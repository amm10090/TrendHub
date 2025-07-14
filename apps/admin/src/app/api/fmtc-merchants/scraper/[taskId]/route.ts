import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";
import { FMTCScraperService } from "@/lib/services/fmtc-scraper.service";

const fmtcScraperService = new FMTCScraperService();

/**
 * GET /api/fmtc-merchants/scraper/[taskId]
 * 获取单个抓取任务的详细信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            merchantsCount: true,
            newMerchantsCount: true,
            updatedMerchantsCount: true,
            errorMessage: true,
            errorStack: true,
            metrics: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    // 获取执行统计信息
    const executionStats = await Promise.all([
      db.fMTCScraperExecution.count({ where: { taskId } }),
      db.fMTCScraperExecution.count({ where: { taskId, status: "COMPLETED" } }),
      db.fMTCScraperExecution.count({ where: { taskId, status: "FAILED" } }),
      db.fMTCScraperExecution.aggregate({
        where: { taskId, status: "COMPLETED" },
        _sum: {
          merchantsCount: true,
          newMerchantsCount: true,
          updatedMerchantsCount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        task,
        stats: {
          totalExecutions: executionStats[0],
          completedExecutions: executionStats[1],
          failedExecutions: executionStats[2],
          totalMerchantsProcessed: executionStats[3]._sum.merchantsCount || 0,
          totalNewMerchants: executionStats[3]._sum.newMerchantsCount || 0,
          totalUpdatedMerchants:
            executionStats[3]._sum.updatedMerchantsCount || 0,
        },
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc-merchants/scraper/[taskId]
 * 更新单个抓取任务的配置
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();

    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    // 如果有新的任务名称，检查是否重复
    if (body.name && body.name !== task.name) {
      const existingTask = await db.fMTCScraperTask.findUnique({
        where: { name: body.name },
      });

      if (existingTask) {
        return NextResponse.json(
          { success: false, error: "任务名称已存在" },
          { status: 400 },
        );
      }
    }

    const updatedTask = await db.fMTCScraperTask.update({
      where: { id: taskId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants/scraper/[taskId]
 * 删除单个抓取任务
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    // 检查是否有正在运行的执行
    const runningExecution = await db.fMTCScraperExecution.findFirst({
      where: {
        taskId,
        status: "RUNNING",
      },
    });

    if (runningExecution) {
      return NextResponse.json(
        { success: false, error: "无法删除正在运行的任务" },
        { status: 409 },
      );
    }

    // 删除任务
    await db.fMTCScraperTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "任务已删除" },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants/scraper/[taskId]
 * 执行任务特定操作
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { action } = body;

    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    switch (action) {
      case "start": {
        // 启动任务
        if (!task.isEnabled) {
          return NextResponse.json(
            { success: false, error: "任务未启用" },
            { status: 400 },
          );
        }

        // 检查是否有正在运行的执行
        const runningExecution = await db.fMTCScraperExecution.findFirst({
          where: {
            taskId,
            status: "RUNNING",
          },
        });

        if (runningExecution) {
          return NextResponse.json(
            { success: false, error: "任务正在运行中" },
            { status: 409 },
          );
        }

        // 使用爬虫服务启动任务
        try {
          const execution = await fmtcScraperService.startScrapingTask(taskId);

          return NextResponse.json({
            success: true,
            data: {
              executionId: execution.id,
              message: "任务已开始",
            },
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 },
          );
        }
      }

      case "stop": {
        // 停止任务
        const activeExecution = await db.fMTCScraperExecution.findFirst({
          where: {
            taskId,
            status: "RUNNING",
          },
        });

        if (!activeExecution) {
          return NextResponse.json(
            { success: false, error: "没有正在运行的任务" },
            { status: 400 },
          );
        }

        // 更新执行状态为取消
        await db.fMTCScraperExecution.update({
          where: { id: activeExecution.id },
          data: {
            status: "CANCELLED",
            completedAt: new Date(),
            errorMessage: "任务被手动停止",
          },
        });

        return NextResponse.json({
          success: true,
          data: { message: "任务已停止" },
        });
      }

      case "enable": {
        // 启用任务
        await db.fMTCScraperTask.update({
          where: { id: taskId },
          data: { isEnabled: true },
        });

        return NextResponse.json({
          success: true,
          data: { message: "任务已启用" },
        });
      }

      case "disable": {
        // 禁用任务
        await db.fMTCScraperTask.update({
          where: { id: taskId },
          data: { isEnabled: false },
        });

        return NextResponse.json({
          success: true,
          data: { message: "任务已禁用" },
        });
      }

      case "reset": {
        // 重置任务（清除执行历史）
        await db.fMTCScraperExecution.deleteMany({
          where: { taskId },
        });

        await db.fMTCScraperTask.update({
          where: { id: taskId },
          data: {
            lastExecutedAt: null,
            nextExecuteAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          data: { message: "任务已重置" },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作" },
          { status: 400 },
        );
    }
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
