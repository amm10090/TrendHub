import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";

// GET handler to fetch a single ScraperTaskExecution by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: executionId } = await Promise.resolve(params);

    if (!executionId) {
      return NextResponse.json(
        { error: "任务执行ID不能为空" },
        { status: 400 },
      );
    }

    const taskExecution = await db.scraperTaskExecution.findUnique({
      where: { id: executionId },
      include: {
        taskDefinition: true, // Include full task definition details
        logs: {
          orderBy: { timestamp: "asc" }, // Optionally fetch some recent logs
          take: 50, // Example: fetch latest 50 logs
        },
      },
    });

    if (!taskExecution) {
      return NextResponse.json(
        { error: "未找到指定的爬虫任务执行记录" },
        { status: 404 },
      );
    }

    return NextResponse.json(taskExecution);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "获取爬虫任务执行记录详情时发生未知错误";

    return NextResponse.json(
      { error: "获取爬虫任务执行记录详情失败", details: errorMessage },
      { status: 500 },
    );
  }
}

// TODO: Implement POST /{id}/cancel if needed in the future
// This would require a mechanism to signal the TaskExecutor to stop a running task.
// For a simple implementation, it might just update the status to CANCELLED if the task hasn't started yet.
