import { NextRequest, NextResponse } from "next/server";

import { discountExpirationService } from "@/lib/services/discount-expiration.service";
import { discountSchedulerService } from "@/lib/services/discount-scheduler.service";

// GET - 获取调度器状态和日志
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "status":
        return getSchedulerStatus();
      case "logs":
        return getSchedulerLogs(searchParams);
      case "health":
        return getHealthCheck();
      case "stats":
        return getExpirationStats();
      default:
        return getSchedulerOverview();
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "获取调度器信息失败",
      },
      { status: 500 },
    );
  }
}

// POST - 调度器操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case "start":
        return startScheduler();
      case "stop":
        return stopScheduler();
      case "restart":
        return restartScheduler();
      case "trigger":
        return triggerManualRun();
      case "update_config":
        return updateSchedulerConfig(config);
      case "clear_logs":
        return clearSchedulerLogs();
      case "force_expiration_check":
        return forceExpirationCheck();
      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "调度器操作失败",
      },
      { status: 500 },
    );
  }
}

// 获取调度器概览
async function getSchedulerOverview() {
  const status = discountSchedulerService.getStatus();
  const health = discountSchedulerService.healthCheck();
  const stats = await discountExpirationService.getExpirationStats();
  const recentLogs = discountSchedulerService.getLogs(5);

  return NextResponse.json({
    success: true,
    data: {
      status,
      health,
      stats,
      recentLogs,
    },
  });
}

// 获取调度器状态
async function getSchedulerStatus() {
  const status = discountSchedulerService.getStatus();

  return NextResponse.json({
    success: true,
    data: status,
  });
}

// 获取调度器日志
async function getSchedulerLogs(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get("limit") || "20");
  const logs = discountSchedulerService.getLogs(limit);

  return NextResponse.json({
    success: true,
    data: {
      logs,
      total: logs.length,
    },
  });
}

// 获取健康检查
async function getHealthCheck() {
  const health = discountSchedulerService.healthCheck();
  const expirationServiceStatus = discountExpirationService.getStatus();

  return NextResponse.json({
    success: true,
    data: {
      scheduler: health,
      expirationService: expirationServiceStatus,
      timestamp: new Date().toISOString(),
    },
  });
}

// 获取过期统计
async function getExpirationStats() {
  const stats = await discountExpirationService.getExpirationStats();

  return NextResponse.json({
    success: true,
    data: stats,
  });
}

// 启动调度器
async function startScheduler() {
  try {
    discountSchedulerService.start();

    return NextResponse.json({
      success: true,
      message: "调度器启动成功",
      data: discountSchedulerService.getStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "启动调度器失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 停止调度器
async function stopScheduler() {
  try {
    discountSchedulerService.stop();

    return NextResponse.json({
      success: true,
      message: "调度器停止成功",
      data: discountSchedulerService.getStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "停止调度器失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 重启调度器
async function restartScheduler() {
  try {
    discountSchedulerService.restart();

    return NextResponse.json({
      success: true,
      message: "调度器重启成功",
      data: discountSchedulerService.getStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "重启调度器失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 手动触发运行
async function triggerManualRun() {
  try {
    const results = await discountSchedulerService.triggerManual();

    return NextResponse.json({
      success: true,
      message: "手动任务执行完成",
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "手动任务执行失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 更新调度器配置
async function updateSchedulerConfig(config: Record<string, unknown>) {
  try {
    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { success: false, error: "无效的配置数据" },
        { status: 400 },
      );
    }

    discountSchedulerService.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: "调度器配置更新成功",
      data: discountSchedulerService.getStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "更新配置失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 清理调度器日志
async function clearSchedulerLogs() {
  try {
    discountSchedulerService.clearLogs();

    return NextResponse.json({
      success: true,
      message: "调度器日志清理成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "清理日志失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 强制执行过期检查
async function forceExpirationCheck() {
  try {
    const results = await discountExpirationService.forceCheck();

    return NextResponse.json({
      success: true,
      message: "强制过期检查完成",
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "强制过期检查失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
