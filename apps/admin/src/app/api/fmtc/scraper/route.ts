/**
 * FMTC 抓取任务管理 API
 */

import { ScraperTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";
import { FMTCScraperService } from "@/lib/services/fmtc-scraper.service";

const logger = {
  error: () => {},
};

const fmtcScraperService = new FMTCScraperService();

/**
 * GET /api/fmtc/scraper
 * 获取抓取任务状态和配置
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    switch (action) {
      case "status": {
        // 获取所有任务状态
        const tasks = await db.fMTCScraperTask.findMany({
          include: {
            executions: {
              orderBy: { startedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        const tasksWithStatus = tasks.map((task) => ({
          ...task,
          credentials: undefined, // 不返回敏感信息
          lastExecution: task.executions[0] || null,
        }));

        return NextResponse.json({
          success: true,
          data: {
            tasks: tasksWithStatus,
            summary: await fmtcScraperService.getScraperSummary(),
          },
        });
      }

      case "executions": {
        const taskId = searchParams.get("taskId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const where = taskId ? { taskId } : {};
        const offset = (page - 1) * limit;

        const [executions, total] = await Promise.all([
          db.fMTCScraperExecution.findMany({
            where,
            include: {
              task: {
                select: { name: true, description: true },
              },
            },
            orderBy: { startedAt: "desc" },
            take: limit,
            skip: offset,
          }),
          db.fMTCScraperExecution.count({ where }),
        ]);

        return NextResponse.json({
          success: true,
          data: executions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case "logs": {
        const executionId = searchParams.get("executionId");

        if (!executionId) {
          return NextResponse.json(
            { success: false, error: "缺少执行ID" },
            { status: 400 },
          );
        }

        // 这里应该从爬虫日志服务获取日志
        const logs = await fmtcScraperService.getExecutionLogs();

        return NextResponse.json({
          success: true,
          data: logs,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }
  } catch {
    logger.error("获取抓取任务信息失败:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc/scraper
 * 启动抓取任务或创建新任务
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, taskId, config } = body;

    switch (action) {
      case "start": {
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: "缺少任务ID" },
            { status: 400 },
          );
        }

        // 检查任务是否已在运行
        const runningExecution = await db.fMTCScraperExecution.findFirst({
          where: {
            taskId,
            status: {
              in: [ScraperTaskStatus.RUNNING, ScraperTaskStatus.QUEUED],
            },
          },
        });

        if (runningExecution) {
          return NextResponse.json(
            { success: false, error: "任务已在运行中" },
            { status: 400 },
          );
        }

        const execution = await fmtcScraperService.startScrapingTask(
          taskId,
          config,
        );

        return NextResponse.json({
          success: true,
          data: execution,
          message: "抓取任务已启动",
        });
      }

      case "create_task": {
        const { name, description, credentials, scraperConfig } = body;

        if (!name || !credentials || !scraperConfig) {
          return NextResponse.json(
            { success: false, error: "缺少必要参数" },
            { status: 400 },
          );
        }

        const newTask = await fmtcScraperService.createScrapingTask({
          name,
          description,
          credentials,
          config: scraperConfig,
        });

        return NextResponse.json({
          success: true,
          data: newTask,
          message: "抓取任务创建成功",
        });
      }

      case "stop": {
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: "缺少任务ID" },
            { status: 400 },
          );
        }

        const stopResult = await fmtcScraperService.stopScrapingTask(taskId);

        return NextResponse.json({
          success: true,
          data: stopResult,
          message: "抓取任务已停止",
        });
      }

      case "quick_scrape": {
        // 快速抓取（使用默认配置）
        const quickConfig = {
          maxMerchantsPerRun: parseInt(
            body.maxMerchantsPerRun || body.maxMerchants || "500",
          ),
          includeDetails: body.includeDetails !== false,
          searchParams: body.searchParams || {},
        };

        const quickExecution =
          await fmtcScraperService.startQuickScraping(quickConfig);

        return NextResponse.json({
          success: true,
          data: quickExecution,
          message: "快速抓取已启动",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }
  } catch {
    logger.error("抓取任务操作失败:", error);

    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc/scraper/[taskId]
 * 更新抓取任务配置
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { taskId, updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "缺少任务ID" },
        { status: 400 },
      );
    }

    // 验证任务是否存在
    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    // 更新任务配置
    const updatedTask = await db.fMTCScraperTask.update({
      where: { id: taskId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: "任务配置更新成功",
    });
  } catch {
    logger.error("更新抓取任务配置失败:", error);

    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc/scraper/[taskId]
 * 删除抓取任务
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "缺少任务ID" },
        { status: 400 },
      );
    }

    // 检查是否有正在运行的执行
    const runningExecution = await db.fMTCScraperExecution.findFirst({
      where: {
        taskId,
        status: { in: [ScraperTaskStatus.RUNNING, ScraperTaskStatus.QUEUED] },
      },
    });

    if (runningExecution) {
      return NextResponse.json(
        { success: false, error: "无法删除正在运行的任务" },
        { status: 400 },
      );
    }

    // 删除任务（级联删除相关执行记录）
    await db.fMTCScraperTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      message: "任务删除成功",
    });
  } catch {
    logger.error("删除抓取任务失败:", error);

    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
