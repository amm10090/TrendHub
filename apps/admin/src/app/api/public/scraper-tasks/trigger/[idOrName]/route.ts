import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ScraperTaskStatus, ScraperTaskTriggerType } from "@prisma/client";
// import { TaskQueueManager } from "@/lib/services/task-queue-manager"; // Placeholder for actual import

const CRON_SECRET_HEADER = "x-cron-trigger-secret";

export async function POST(
  request: NextRequest,
  { params }: { params: { idOrName: string } },
) {
  try {
    const { idOrName } = await Promise.resolve(params);
    // 1. Security Check: Verify secret header
    const providedSecret = request.headers.get(CRON_SECRET_HEADER);
    const expectedSecret = process.env.CRON_TRIGGER_SECRET;

    if (!expectedSecret) {
      // [CRON_TRIGGER_POST] CRON_TRIGGER_SECRET is not set in environment variables
      // Do not expose detailed error to public API for security reasons
      return NextResponse.json(
        { error: "服务内部错误，无法处理请求。" },
        { status: 500 },
      );
    }

    if (providedSecret !== expectedSecret) {
      // [CRON_TRIGGER_POST] Invalid or missing secret for task trigger attempt on: ${idOrName}
      return NextResponse.json({ error: "未经授权的访问" }, { status: 401 });
    }

    // 2. Find Task Definition by ID or Name
    const taskDefinition = await db.scraperTaskDefinition.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
    });

    if (!taskDefinition) {
      return NextResponse.json(
        { error: `未找到ID或名称为 '${idOrName}' 的爬虫任务定义` },
        { status: 404 },
      );
    }

    // 3. Check if task is enabled for scheduling/triggering
    if (!taskDefinition.isEnabled) {
      // Task is disabled, skipping trigger
      // It's important to return a success-like status to the cron scheduler to prevent retries for a disabled task.
      return NextResponse.json(
        { message: `任务 '${taskDefinition.name}' 当前已禁用，因此跳过执行。` },
        { status: 200 }, // OK, task was found but intentionally not run.
      );
    }

    // 4. Enqueue Task (Placeholder - to be replaced with TaskQueueManager call)
    // Attempting to enqueue task with trigger type API

    // Simulate creating an execution record as TaskQueueManager.enqueueTask would do.
    // This will be replaced by a call to TaskQueueManager.enqueueTask(taskDefinition.id, ScraperTaskTriggerType.API);
    const newExecution = await db.scraperTaskExecution.create({
      data: {
        taskDefinitionId: taskDefinition.id,
        status: ScraperTaskStatus.QUEUED,
        triggerType: ScraperTaskTriggerType.API,
      },
    });

    // TODO: Replace the above simulation with:
    // const newExecution = await TaskQueueManager.enqueueTask(taskDefinition.id, ScraperTaskTriggerType.API);
    // And potentially trigger queue processing if not self-polling:
    // await TaskQueueManager.processQueue();

    return NextResponse.json(
      {
        message: `任务 '${taskDefinition.name}' 已成功加入队列执行。`,
        executionId: newExecution.id,
      },
      { status: 202 }, // Accepted: The request has been accepted for processing, but the processing has not been completed.
    );
  } catch {
    // Critical error while processing cron trigger
    // For public API, avoid exposing too many details in error messages.
    return NextResponse.json(
      { error: "处理外部触发爬虫任务失败" /*, details: errorMessage */ },
      { status: 500 },
    );
  }
}
