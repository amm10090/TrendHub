import { NextRequest } from "next/server";
import { z } from "zod";
import { ScraperLogLevel } from "@prisma/client";
import { db } from "@/lib/db";

const StreamLogsQuerySchema = z.object({
  executionId: z.string().cuid({ message: "必须提供有效的任务执行ID" }),
  level: z.nativeEnum(ScraperLogLevel).optional(),
  lastTimestamp: z.string().optional(),
  includeContext: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = StreamLogsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "无效的查询参数",
          issues: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { executionId, level, lastTimestamp, includeContext } =
      validationResult.data;

    // 验证执行任务是否存在
    const execution = await db.scraperTaskExecution.findUnique({
      where: { id: executionId },
      include: { taskDefinition: true },
    });

    if (!execution) {
      return new Response(JSON.stringify({ error: "任务执行记录不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 设置SSE响应头
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    const stream = new ReadableStream({
      start(controller) {
        let lastSentTimestamp = lastTimestamp
          ? new Date(lastTimestamp)
          : new Date(0);
        let isActive = true;

        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          if (!isActive) return;
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const sendHeartbeat = () => {
          if (!isActive) return;
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        };

        // 发送初始连接确认
        sendEvent("connected", {
          executionId,
          timestamp: new Date().toISOString(),
          taskName: execution.taskDefinition.name,
          taskSite: execution.taskDefinition.targetSite,
        });

        // 定时查询新日志
        const pollLogs = async () => {
          if (!isActive) return;

          try {
            const whereClause: {
              executionId: string;
              timestamp: { gt: Date };
              level?: string;
            } = {
              executionId,
              timestamp: { gt: lastSentTimestamp },
            };

            if (level) {
              whereClause.level = level;
            }

            const newLogs = await db.scraperTaskLog.findMany({
              where: whereClause,
              orderBy: { timestamp: "asc" },
              take: 50, // 限制单次获取数量
              select: {
                id: true,
                level: true,
                message: true,
                timestamp: true,
                ...(includeContext && { context: true }),
              },
            });

            if (newLogs.length > 0) {
              sendEvent("logs", newLogs);

              // 更新最后发送的时间戳
              lastSentTimestamp = newLogs[newLogs.length - 1].timestamp;
            }

            // 检查执行状态
            const currentExecution = await db.scraperTaskExecution.findUnique({
              where: { id: executionId },
              select: { status: true, completedAt: true, errorMessage: true },
            });

            if (currentExecution) {
              const isFinished = ["COMPLETED", "FAILED", "CANCELLED"].includes(
                currentExecution.status,
              );

              sendEvent("status", {
                status: currentExecution.status,
                completedAt: currentExecution.completedAt,
                errorMessage: currentExecution.errorMessage,
                isFinished,
              });

              if (isFinished) {
                cleanup();
              }
            }
          } catch (error) {
            console.error("Error polling logs:", error);
            sendEvent("error", {
              message: "获取日志时出错",
              timestamp: new Date().toISOString(),
            });
          }
        };

        // 清理函数
        const cleanup = () => {
          isActive = false;
          if (intervalId) clearInterval(intervalId);
          if (heartbeatId) clearInterval(heartbeatId);

          sendEvent("close", {
            reason: "Stream closed",
            timestamp: new Date().toISOString(),
          });

          controller.close();
        };

        // 立即执行一次
        pollLogs();

        // 设置定时器
        const intervalId = setInterval(pollLogs, 2000); // 每2秒检查一次新日志
        const heartbeatId = setInterval(sendHeartbeat, 30000); // 每30秒发送心跳

        // 处理客户端断开连接
        request.signal.addEventListener("abort", cleanup);

        // 设置超时 (1小时)
        setTimeout(cleanup, 60 * 60 * 1000);
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("Stream logs error:", error);
    return new Response(JSON.stringify({ error: "创建日志流失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
