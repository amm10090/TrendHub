import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";

// 进度数据类型定义
interface ProgressData {
  type?: string;
  total?: number;
  completed?: number;
  failed?: number;
  running?: number;
  pending?: number;
  percentage?: number;
  startTime?: string | Date;
  averageTimePerTask?: number;
  estimatedTimeRemaining?: number;
  workers?: Array<{
    id: string;
    isWorking: boolean;
    currentTask?: {
      id: string;
      merchantName: string;
      status: string;
      startTime?: string | Date;
    } | null;
  }>;
  recentCompletedTasks?: Array<{
    id: string;
    merchantName: string;
    duration: number;
  }>;
  recentFailedTasks?: Array<{
    id: string;
    merchantName: string;
    error?: string;
  }>;
}

// 完成状态数据类型定义
interface CompletionData {
  type?: string;
  result?: {
    success: boolean;
    total: number;
    completed: number;
    failed: number;
    totalTime: number;
    averageTimePerTask: number;
  };
  endTime?: string | Date;
  summary?: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalTimeSeconds: number;
    averageTimePerTaskSeconds: number;
    concurrency?: number;
    speedImprovement?: string;
  };
}

// 存储活跃的SSE连接
const activeConnections = new Map<string, ReadableStreamDefaultController>();
const progressData = new Map<string, ProgressData>();

/**
 * GET /api/fmtc-merchants/progress/[executionId]
 * 建立SSE连接以接收批量抓取的实时进度
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { executionId } = await params;

    // 创建SSE流
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // 发送初始连接确认
        const initialData = {
          type: "connected",
          executionId,
          timestamp: new Date().toISOString(),
          message: "SSE连接已建立",
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`),
        );

        // 如果已有进度数据，立即发送
        const existingProgress = progressData.get(executionId);

        if (existingProgress) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                ...existingProgress,
              })}\n\n`,
            ),
          );
        }

        // 存储控制器以便后续推送数据
        activeConnections.set(executionId, controller);
        // [SSE] 控制器已存储，当前活跃连接数: ${activeConnections.size}

        // 清理函数
        const cleanup = () => {
          activeConnections.delete(executionId);
          progressData.delete(executionId);
          try {
            controller.close();
          } catch {
            // Controller already closed
          }
        };

        // 设置30分钟后自动清理
        const timeoutId = setTimeout(cleanup, 30 * 60 * 1000);

        // 监听客户端断开连接
        request.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          cleanup();
        });
      },
    });

    // 返回SSE响应
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch {
    return NextResponse.json({ error: "无法建立SSE连接" }, { status: 500 });
  }
}

/**
 * POST /api/fmtc-merchants/progress/[executionId]
 * 推送进度更新（由批量抓取器调用）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> },
) {
  try {
    const { executionId } = await params;
    const progressUpdate = await request.json();

    // [SSE] 收到进度更新，executionId: ${executionId}, 活跃连接数: ${activeConnections.size}

    // 存储进度数据
    progressData.set(executionId, progressUpdate);

    // 推送给所有监听此executionId的客户端
    const controller = activeConnections.get(executionId);

    if (controller) {
      const encoder = new TextEncoder();
      const data = {
        type: "progress",
        executionId,
        timestamp: new Date().toISOString(),
        ...progressUpdate,
      };

      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch {
        // 连接已断开，清理
        activeConnections.delete(executionId);
        progressData.delete(executionId);
      }
    } else {
      // No active connection for this executionId
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "推送进度更新失败" }, { status: 500 });
  }
}

/**
 * 推送进度更新的辅助函数（供其他模块调用）
 */
export async function pushProgressUpdate(
  executionId: string,
  progress: ProgressData,
) {
  try {
    // 内部调用，直接更新
    progressData.set(executionId, progress);

    const controller = activeConnections.get(executionId);

    if (controller) {
      const encoder = new TextEncoder();
      const data = {
        type: "progress",
        executionId,
        timestamp: new Date().toISOString(),
        ...progress,
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    }
  } catch {
    // Error pushing progress update
  }
}

/**
 * 推送完成状态
 */
export async function pushCompletionStatus(
  executionId: string,
  result: CompletionData,
) {
  try {
    const controller = activeConnections.get(executionId);

    if (controller) {
      const encoder = new TextEncoder();
      const data = {
        type: "completed",
        executionId,
        timestamp: new Date().toISOString(),
        ...result,
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // 发送完成后关闭连接
      setTimeout(() => {
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
        activeConnections.delete(executionId);
        progressData.delete(executionId);
      }, 5000); // 5秒后清理
    }
  } catch {
    // Error pushing progress update
  }
}
