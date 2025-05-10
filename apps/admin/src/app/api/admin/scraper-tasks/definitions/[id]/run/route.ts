import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";
import { taskQueueManager } from "@/lib/services/task-queue-manager";

// POST handler to manually trigger a ScraperTaskDefinition by ID
export async function POST(
  request: NextRequest,
  props: { params: { id: string } },
) {
  try {
    const awaitedParams = await props.params;
    const taskDefinitionId = awaitedParams.id;

    if (!taskDefinitionId) {
      return NextResponse.json(
        { error: "任务定义ID不能为空" },
        { status: 400 },
      );
    }

    const taskDefinition = await db.scraperTaskDefinition.findUnique({
      where: { id: taskDefinitionId },
    });

    if (!taskDefinition) {
      return NextResponse.json(
        { error: "未找到指定的爬虫任务定义" },
        { status: 404 },
      );
    }

    if (!taskDefinition.isEnabled) {
      return NextResponse.json(
        {
          error: `任务 '${taskDefinition.name}' 当前已禁用，无法手动触发。请先启用任务。`,
        },
        { status: 400 },
      );
    }

    // 正确调用 TaskQueueManager 将任务加入队列
    const newExecution = await taskQueueManager.enqueueTask(
      taskDefinition.id,
      "MANUAL", // ScraperTaskTriggerType.MANUAL
    );

    // Respond with 202 Accepted, indicating the request has been accepted for processing.
    // The client should then poll the execution status or use WebSocket for updates.
    return NextResponse.json(newExecution, { status: 202 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "手动触发爬虫任务时发生未知错误";

    return NextResponse.json(
      { error: "手动触发爬虫任务失败", details: errorMessage },
      { status: 500 },
    );
  }
}
