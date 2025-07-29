import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * 取消爬虫任务执行
 *
 * POST /api/admin/scraper-tasks/executions/:id/cancel
 */
export async function POST(
  req: NextRequest,
  props: { params: { id: string } },
) {
  try {
    const awaitedParams = await props.params;
    const id = awaitedParams.id;

    // 验证任务执行记录是否存在
    const taskExecution = await db.scraperTaskExecution.findUnique({
      where: { id },
      include: {
        taskDefinition: true,
      },
    });

    if (!taskExecution) {
      return NextResponse.json(
        { error: "任务执行记录不存在" },
        { status: 404 },
      );
    }

    // 只有运行中和队列中的任务才能取消
    if (
      taskExecution.status !== "RUNNING" &&
      taskExecution.status !== "QUEUED"
    ) {
      return NextResponse.json(
        { error: `无法取消状态为 ${taskExecution.status} 的任务` },
        { status: 400 },
      );
    }

    // 更新任务状态为已取消
    const updatedExecution = await db.scraperTaskExecution.update({
      where: { id },
      data: {
        status: "CANCELLED",
        completedAt: new Date(), // 将完成时间设置为当前时间
      },
      include: {
        taskDefinition: true,
      },
    });

    // 记录取消事件
    await db.scraperTaskLog.create({
      data: {
        level: "INFO",
        message: `任务被手动取消`,
        executionId: id,
        context: {
          cancelledAt: new Date().toISOString(),
          previousStatus: taskExecution.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `成功取消任务 ${taskExecution.taskDefinition.name}`,
      data: updatedExecution,
    });
  } catch {
    return NextResponse.json(
      { error: "取消任务失败", details: (error as Error).message },
      { status: 500 },
    );
  }
}
