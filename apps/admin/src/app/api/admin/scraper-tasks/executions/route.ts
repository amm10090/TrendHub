import {
  Prisma,
  ScraperTaskStatus,
  ScraperTaskTriggerType,
} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// Zod schema for query parameters validation (optional, but good practice)
const GetExecutionsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  taskDefinitionId: z
    .string()
    .cuid({ message: "无效的任务定义ID格式" })
    .optional(),
  status: z.nativeEnum(ScraperTaskStatus).optional(),
  triggerType: z.nativeEnum(ScraperTaskTriggerType).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = GetExecutionsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "无效的查询参数",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      taskDefinitionId,
      status,
      triggerType,
    } = validationResult.data;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ScraperTaskExecutionWhereInput = {};

    if (taskDefinitionId) {
      whereClause.taskDefinitionId = taskDefinitionId;
    }
    if (status) {
      whereClause.status = status;
    }
    if (triggerType) {
      whereClause.triggerType = triggerType;
    }

    const executions = await db.scraperTaskExecution.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        taskDefinition: {
          select: { name: true, targetSite: true }, // Include related task definition name and site
        },
      },
    });

    const totalExecutions = await db.scraperTaskExecution.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: executions,
      total: totalExecutions,
      page,
      limit,
      totalPages: Math.ceil(totalExecutions / limit),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "获取爬虫任务执行记录时发生未知错误";

    return NextResponse.json(
      { error: "获取爬虫任务执行记录失败", details: errorMessage },
      { status: 500 },
    );
  }
}
