import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSchedulerHealth } from "@/lib/services/scheduler-init";

// GET - 系统健康检查
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    // 基础健康检查
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    interface DatabaseCheck {
      status: string;
      message?: string;
      error?: string;
      stats?: {
        discounts: {
          total: number;
          active: number;
          expired: number;
        };
        brands: number;
        imports: number;
      };
      statsError?: string;
    }

    const checks: Record<string, unknown> = {};

    // 数据库连接检查
    try {
      await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: "healthy",
        message: "Database connection successful",
      };
    } catch {
      checks.database = {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      health.status = "error";
    }

    // 调度器健康检查
    try {
      const schedulerHealth = getSchedulerHealth();

      checks.scheduler = {
        status: schedulerHealth.status,
        details: schedulerHealth.details,
      };

      if (schedulerHealth.status === "error") {
        health.status = "warning";
      }
    } catch {
      checks.scheduler = {
        status: "error",
        message: "Scheduler health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 详细检查
    if (detailed) {
      // 内存使用情况
      const memoryUsage = process.memoryUsage();

      checks.memory = {
        status: "healthy",
        usage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
      };

      // 数据库统计
      try {
        const [
          totalDiscounts,
          activeDiscounts,
          expiredDiscounts,
          totalBrands,
          totalImports,
        ] = await Promise.all([
          db.discount.count(),
          db.discount.count({ where: { isActive: true, isExpired: false } }),
          db.discount.count({ where: { isExpired: true } }),
          db.brand.count(),
          db.discountImport.count(),
        ]);

        (checks.database as DatabaseCheck).stats = {
          discounts: {
            total: totalDiscounts,
            active: activeDiscounts,
            expired: expiredDiscounts,
          },
          brands: totalBrands,
          imports: totalImports,
        };
      } catch {
        (checks.database as DatabaseCheck).statsError =
          error instanceof Error ? error.message : "Unknown error";
      }

      // 最近的错误日志检查
      try {
        const recentErrors = await checkRecentErrors();

        if (recentErrors.length > 0) {
          checks.recentErrors = {
            status: "warning",
            count: recentErrors.length,
            errors: recentErrors.slice(0, 5), // 只返回前5个错误
          };
          if (health.status === "healthy") {
            health.status = "warning";
          }
        }
      } catch {
        checks.recentErrorsCheck = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...health,
      responseTime: `${responseTime}ms`,
      checks,
    });
  } catch {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 检查最近的错误（这里可以检查日志文件或错误记录）
async function checkRecentErrors(): Promise<unknown[]> {
  try {
    // 检查最近失败的导入
    const failedImports = await db.discountImport.findMany({
      where: {
        status: "FAILED",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 过去24小时
        },
      },
      select: {
        id: true,
        status: true,
        errorCount: true,
        errors: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return failedImports.map((imp) => ({
      type: "import_failed",
      id: imp.id,
      errorCount: imp.errorCount,
      timestamp: imp.createdAt,
      errors: imp.errors,
    }));
  } catch {
    return [];
  }
}
