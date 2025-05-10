import { ScraperLogLevel, Prisma } from "@prisma/client"; // Import the Prisma enum
import { NextResponse, NextRequest } from "next/server";
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

    // Ensure the executionId exists (optional, but good for data integrity before logging)
    // Depending on performance needs, this check could be skipped if executionId is trusted.
    const executionExists = await db.scraperTaskExecution.findUnique({
      where: { id: executionId },
      select: { id: true },
    });

    if (!executionExists) {
      // Decide how to handle: silently fail, log to console, or return error
      // For now, let's log and return an error as the executionId is crucial.

      return NextResponse.json(
        { error: `任务执行ID '${executionId}' 不存在，无法记录日志。` },
        { status: 404 },
      );
    }

    await db.scraperTaskLog.create({
      data: {
        executionId,
        level,
        message,
        context: context ? (context as Prisma.InputJsonValue) : Prisma.JsonNull,
        timestamp: timestamp ? new Date(timestamp) : new Date(), // Use provided timestamp or now
      },
    });

    return NextResponse.json({ message: "日志已接收" }, { status: 201 });
  } catch {
    // Avoid sending detailed error back to scraper client for internal log endpoint
    return NextResponse.json({ error: "记录内部日志失败" }, { status: 500 });
  }
}
