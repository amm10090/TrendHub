import * as fs from "fs";
import * as path from "path";

import { Prisma, ScraperLogLevel } from "@prisma/client"; // Import the Prisma enum
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const LogEntrySchema = z.object({
  executionId: z.string().cuid({ message: "无效的执行ID格式" }),
  level: z.nativeEnum(ScraperLogLevel, {
    errorMap: () => ({ message: "无效的日志级别" }),
  }),
  message: z.string().min(1, { message: "日志消息不能为空" }),
  context: z.record(z.unknown()).optional(), // Allows any JSON object for context
  timestamp: z.string().datetime({ message: "无效的时间戳格式" }).optional(), // Optional, defaults to now() if not provided by client
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = LogEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "无效的日志条目数据",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { executionId, level, message, context, timestamp } =
      validationResult.data;

    // 1. 查询 ScraperTaskExecution 或 FMTCScraperExecution 和关联的 TaskDefinition
    let taskExecution = null;
    let isFMTCExecution = false;

    // 首先尝试查找通用的抓取任务执行记录
    taskExecution = await db.scraperTaskExecution.findUnique({
      where: { id: executionId },
      include: {
        taskDefinition: {
          select: {
            isDebugModeEnabled: true,
            targetSite: true,
          },
        },
      },
    });

    // 如果没有找到，尝试查找FMTC专用的执行记录
    if (!taskExecution) {
      const fmtcExecution = await db.fMTCScraperExecution.findUnique({
        where: { id: executionId },
        include: {
          task: {
            select: {
              name: true,
            },
          },
        },
      });

      if (fmtcExecution) {
        // 构造一个兼容的taskExecution对象
        taskExecution = {
          id: fmtcExecution.id,
          taskDefinition: {
            isDebugModeEnabled: true, // FMTC任务默认启用调试模式
            targetSite: "FMTC",
          },
        };
        isFMTCExecution = true;
      }
    }

    if (!taskExecution) {
      // 这个检查保留，以防万一 executionId 真的无效
      return NextResponse.json(
        { error: `任务执行ID '${executionId}' 不存在，无法记录日志。` },
        { status: 404 },
      );
    }

    // 如果 taskDefinition 不存在 (理论上不应该，因为 executionId 存在就应该有关联的 taskDefinition)
    if (!taskExecution.taskDefinition) {
      // Task definition should always exist if execution exists
    }

    // 2. 如果启用了调试模式并且 taskDefinition 和 targetSite 存在，则写入本地文件
    if (
      taskExecution.taskDefinition?.isDebugModeEnabled &&
      taskExecution.taskDefinition.targetSite
    ) {
      try {
        const targetSite = taskExecution.taskDefinition.targetSite;
        const baseStorageDir =
          process.env.CRAWLEE_STORAGE_DIR ||
          path.resolve(process.cwd(), "storage");
        // 确保 targetSite 是一个有效的目录名部分
        const safeTargetSite = targetSite.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const siteLogDir = path.join(
          baseStorageDir,
          "scraper_storage_runs",
          safeTargetSite,
          executionId,
        );

        if (!fs.existsSync(siteLogDir)) {
          fs.mkdirSync(siteLogDir, { recursive: true });
        }

        const logFilePath = path.join(siteLogDir, "debug.log");
        // 使用传入的 timestamp (如果存在) 或当前时间，并确保是 ISO 格式
        const logTimestamp = timestamp
          ? new Date(timestamp).toISOString()
          : new Date().toISOString();
        const contextString = context ? JSON.stringify(context) : "";
        // 确保日志消息末尾有换行符
        const fileLogMessage = `[${logTimestamp}] [${level}] ${message}${contextString ? ` ${contextString}` : ""}\n`;

        fs.appendFileSync(logFilePath, fileLogMessage, { encoding: "utf8" });
      } catch {
        // 记录文件写入失败到控制台，但不中断数据库日志记录或返回错误给客户端
        //   `[Internal Log API FileLog FAIL] Failed to write log to file for execution ${executionId}: ${(_fileError as Error).message}`,
        //   _fileError,
        // );
      }
    }

    // 3. 将日志写入数据库 (根据执行类型选择不同的策略)
    if (isFMTCExecution) {
      // FMTC执行记录使用专门的FMTCScraperLog表
      await db.fMTCScraperLog.create({
        data: {
          executionId,
          level,
          message,
          context: context
            ? (context as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });
    } else {
      // 使用原有逻辑处理通用抓取任务
      await db.scraperTaskLog.create({
        data: {
          executionId,
          level,
          message,
          context: context
            ? (context as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });
    }

    return NextResponse.json({ message: "日志已接收" }, { status: 201 });
  } catch {
    // General catch block for the POST handler
    // 避免将详细错误返回给爬虫客户端的内部日志端点
    // 在服务器端记录完整的错误信息以供调试

    return NextResponse.json({ error: "记录内部日志失败" }, { status: 500 });
  }
}
