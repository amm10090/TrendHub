import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";

/**
 * GET /api/fmtc-merchants/scraper
 * 获取抓取任务状态和配置
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // 获取抓取任务列表
    const [tasks, totalCount] = await Promise.all([
      db.fMTCScraperTask.findMany({
        orderBy: { lastExecutedAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          executions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              merchantsCount: true,
              newMerchantsCount: true,
              updatedMerchantsCount: true,
              errorMessage: true,
            },
          },
        },
      }),
      db.fMTCScraperTask.count(),
    ]);

    // 获取整体统计信息
    const stats = await Promise.all([
      db.fMTCScraperTask.count({ where: { isEnabled: true } }),
      db.fMTCScraperExecution.count({ where: { status: "RUNNING" } }),
      db.fMTCScraperExecution.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.fMTCScraperExecution.count({
        where: {
          status: "FAILED",
          completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // 转换taskType字段为前端期望的格式
    const transformedTasks = tasks.map((task) => ({
      ...task,
      taskType:
        task.taskType === "DATA_REFRESH" ? "data_refresh" : "full_scraping",
    }));

    return NextResponse.json({
      success: true,
      data: {
        tasks: transformedTasks,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          enabledTasks: stats[0],
          runningTasks: stats[1],
          completedToday: stats[2],
          failedToday: stats[3],
        },
      },
    });
  } catch (error) {
    console.error("FMTC Scraper Tasks API Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants/scraper
 * 创建抓取任务或触发执行
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, taskId, taskData } = body;

    switch (action) {
      case "create_task": {
        // 创建新的抓取任务
        if (!taskData?.name || !taskData?.credentials) {
          return NextResponse.json(
            { success: false, error: "任务名称和凭据不能为空" },
            { status: 400 },
          );
        }

        // 检查任务名称是否已存在
        const existingTask = await db.fMTCScraperTask.findUnique({
          where: { name: taskData.name },
        });

        if (existingTask) {
          return NextResponse.json(
            { success: false, error: "任务名称已存在" },
            { status: 400 },
          );
        }

        const newTask = await db.fMTCScraperTask.create({
          data: {
            name: taskData.name,
            description: taskData.description || null,
            taskType:
              taskData.taskType === "data_refresh"
                ? "DATA_REFRESH"
                : "FULL_SCRAPING",
            credentials: taskData.credentials,
            config: taskData.config || {},
            isEnabled: taskData.isEnabled !== false,
            cronExpression: taskData.cronExpression || null,
            nextExecuteAt: taskData.nextExecuteAt
              ? new Date(taskData.nextExecuteAt)
              : null,
          },
        });

        return NextResponse.json({
          success: true,
          data: newTask,
        });
      }

      case "trigger_execution": {
        // 手动触发抓取任务
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: "任务ID不能为空" },
            { status: 400 },
          );
        }

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
            { success: false, error: "任务正在运行中" },
            { status: 409 },
          );
        }

        // 创建新的执行记录
        const execution = await db.fMTCScraperExecution.create({
          data: {
            taskId,
            status: "RUNNING",
            startedAt: new Date(),
          },
        });

        // 更新任务的最后执行时间
        await db.fMTCScraperTask.update({
          where: { id: taskId },
          data: { lastExecutedAt: new Date() },
        });

        // 这里应该触发实际的抓取任务
        // 可以使用队列系统或者直接调用爬虫服务
        // 目前返回执行ID，实际抓取可以在后台进行

        return NextResponse.json({
          success: true,
          data: {
            executionId: execution.id,
            message: "抓取任务已开始",
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("FMTC Scraper Action Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc-merchants/scraper
 * 更新抓取任务配置
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, updates } = body;

    if (!taskId || !updates) {
      return NextResponse.json(
        { success: false, error: "任务ID和更新数据不能为空" },
        { status: 400 },
      );
    }

    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 },
      );
    }

    // 转换taskType字段格式
    const updatesWithTaskType = { ...updates };

    if (updates.taskType) {
      updatesWithTaskType.taskType =
        updates.taskType === "data_refresh" ? "DATA_REFRESH" : "FULL_SCRAPING";
    }

    // 更新任务配置
    const updatedTask = await db.fMTCScraperTask.update({
      where: { id: taskId },
      data: {
        ...updatesWithTaskType,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error("FMTC Scraper Task Update Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants/scraper
 * 删除抓取任务
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "任务ID不能为空" },
        { status: 400 },
      );
    }

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

    // 删除任务（这将级联删除相关的执行记录）
    await db.fMTCScraperTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "任务已删除" },
    });
  } catch (error) {
    console.error("FMTC Scraper Task Delete Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
