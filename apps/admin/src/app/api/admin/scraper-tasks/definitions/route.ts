import { Prisma } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// Zod schema for validating the request body when creating a ScraperTaskDefinition
const CreateScraperTaskDefinitionSchema = z.object({
  name: z.string().min(1, { message: "任务名称不能为空" }),
  description: z.string().optional(),
  targetSite: z.string().min(1, { message: "目标站点不能为空" }), // TODO: Potentially use an enum of ECommerceSite
  startUrls: z
    .array(z.string().url({ message: "请输入有效的URL" }))
    .min(1, { message: "至少需要一个起始URL" }),
  cronExpression: z.string().optional(), // TODO: Add CRON expression validation if needed
  isEnabled: z.boolean().default(true),
  maxRequests: z.number().int().positive().optional(),
  maxLoadClicks: z.number().int().positive().optional(),
  maxProducts: z.number().int().positive().optional(),
  defaultInventory: z.number().int().nonnegative().default(99),
  isDebugModeEnabled: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateScraperTaskDefinitionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "输入无效",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      description,
      targetSite,
      startUrls,
      cronExpression,
      isEnabled,
      maxRequests,
      maxLoadClicks,
      maxProducts,
      defaultInventory,
      isDebugModeEnabled,
    } = validationResult.data;

    // TODO: Check if a task with the same name already exists (if name should be unique)
    // Prisma schema already enforces unique name, so this check is for a friendlier error message
    const existingTaskByName = await db.scraperTaskDefinition.findUnique({
      where: { name },
    });

    if (existingTaskByName) {
      return NextResponse.json(
        { error: `名为 "${name}" 的任务已存在` },
        { status: 409 }, // Conflict
      );
    }

    const newTaskDefinition = await db.scraperTaskDefinition.create({
      data: {
        name,
        description,
        targetSite,
        startUrls,
        cronExpression,
        isEnabled,
        maxRequests,
        maxLoadClicks,
        maxProducts,
        defaultInventory,
        isDebugModeEnabled,
      },
    });

    // TODO: If isEnabled and cronExpression is set, potentially trigger cron-scheduler service to add/update the job
    // This will be handled by a separate service later.

    return NextResponse.json(newTaskDefinition, { status: 201 });
  } catch {
    // Enhance error logging for production
    const errorMessage =
      error instanceof Error ? error.message : "创建爬虫任务定义时发生未知错误";

    return NextResponse.json(
      { error: "创建爬虫任务定义失败", details: errorMessage },
      { status: 500 },
    );
  }
}

// GET handler to fetch all ScraperTaskDefinitions with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const filterByName = searchParams.get("name");
    const filterBySite = searchParams.get("site");
    const filterByStatus = searchParams.get("status"); // 'true', 'false', or null/undefined for all

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ScraperTaskDefinitionWhereInput = {};

    if (filterByName) {
      whereClause.name = { contains: filterByName, mode: "insensitive" };
    }
    if (filterBySite) {
      whereClause.targetSite = filterBySite;
    }
    if (filterByStatus !== null && filterByStatus !== undefined) {
      if (filterByStatus === "true" || filterByStatus === "false") {
        whereClause.isEnabled = filterByStatus === "true";
      } else {
        // Removed error response for invalid status filter to allow fetching all
      }
    }

    const taskDefinitions = await db.scraperTaskDefinition.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        executions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    const totalTaskDefinitions = await db.scraperTaskDefinition.count({
      where: whereClause,
    });

    // Map executions to latestExecution for frontend compatibility
    const dataWithLatestExecution = taskDefinitions.map((td) => ({
      ...td,
      latestExecution:
        td.executions && td.executions.length > 0 ? td.executions[0] : null,
      // executions: undefined, // Remove the executions array if not needed directly on ScraperTaskDefinitionWithLatestExecution type
    }));

    return NextResponse.json({
      data: dataWithLatestExecution,
      total: totalTaskDefinitions,
      page,
      limit,
      totalPages: Math.ceil(totalTaskDefinitions / limit),
    });
  } catch {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "获取爬虫任务定义列表时发生未知错误";

    return NextResponse.json(
      { error: "获取爬虫任务定义列表失败", details: errorMessage },
      { status: 500 },
    );
  }
}
