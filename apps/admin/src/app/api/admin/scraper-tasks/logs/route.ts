import { Prisma, ScraperLogLevel } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const GetLogsQuerySchema = z.object({
  executionId: z.string().cuid({ message: "必须提供有效的任务执行ID" }),
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("50").transform(Number), // Default to 50 logs per page
  level: z.nativeEnum(ScraperLogLevel).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"), // Default to ascending for logs
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = GetLogsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "无效的查询参数",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { executionId, page, limit, level, sortOrder } =
      validationResult.data;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ScraperTaskLogWhereInput = {
      executionId: executionId,
    };

    if (level) {
      whereClause.level = level;
    }

    const logs = await db.scraperTaskLog.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        timestamp: sortOrder,
      },
    });

    const totalLogs = await db.scraperTaskLog.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: logs,
      total: totalLogs,
      page,
      limit,
      totalPages: Math.ceil(totalLogs / limit),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "获取爬虫任务日志时发生未知错误";

    return NextResponse.json(
      { error: "获取爬虫任务日志失败", details: errorMessage },
      { status: 500 },
    );
  }
}
