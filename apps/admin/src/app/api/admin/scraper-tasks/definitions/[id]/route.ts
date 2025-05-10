import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// GET handler to fetch a single ScraperTaskDefinition by ID
export async function GET(
  request: NextRequest,
  props: { params: { id: string } },
) {
  try {
    const awaitedParams = await props.params;
    const taskId = awaitedParams.id;

    if (!taskId) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    const taskDefinition = await db.scraperTaskDefinition.findUnique({
      where: { id: taskId },
      // Optionally include related data if needed on the detail view
      // include: { executions: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });

    if (!taskDefinition) {
      return NextResponse.json(
        { error: "未找到指定的爬虫任务定义" },
        { status: 404 },
      );
    }

    return NextResponse.json(taskDefinition);
  } catch {
    const errorMessage = "获取爬虫任务定义详情时发生未知错误";

    return NextResponse.json(
      { error: "获取爬虫任务定义详情失败", details: errorMessage },
      { status: 500 },
    );
  }
}

// Zod schema for validating the request body when updating a ScraperTaskDefinition
const UpdateScraperTaskDefinitionSchema = z.object({
  name: z.string().min(1, { message: "任务名称不能为空" }).optional(),
  description: z.string().optional().nullable(),
  targetSite: z.string().min(1, { message: "目标站点不能为空" }).optional(),
  startUrls: z
    .array(z.string().url({ message: "请输入有效的URL" }))
    .min(1, { message: "至少需要一个起始URL" })
    .optional(),
  cronExpression: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  maxRequests: z.number().int().positive().optional().nullable(),
  maxLoadClicks: z.number().int().positive().optional().nullable(),
  maxProducts: z.number().int().positive().optional().nullable(),
  defaultInventory: z.number().int().nonnegative().optional(),
});

// PUT handler to update a ScraperTaskDefinition by ID
export async function PUT(
  request: NextRequest,
  props: { params: { id: string } },
) {
  try {
    const awaitedParams = await props.params;
    const taskId = awaitedParams.id;

    if (!taskId) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = UpdateScraperTaskDefinitionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "输入无效",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const dataToUpdate = validationResult.data;

    // Check if the new name (if provided) conflicts with an existing task
    if (dataToUpdate.name) {
      const existingTaskByName = await db.scraperTaskDefinition.findFirst({
        where: {
          name: dataToUpdate.name,
          NOT: {
            id: taskId,
          },
        },
      });

      if (existingTaskByName) {
        return NextResponse.json(
          { error: `名为 "${dataToUpdate.name}" 的任务已存在` },
          { status: 409 }, // Conflict
        );
      }
    }

    const updatedTaskDefinition = await db.scraperTaskDefinition.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    // TODO: If isEnabled or cronExpression changed, update the cron-scheduler service

    return NextResponse.json(updatedTaskDefinition);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      // Prisma error code for record not found
      return NextResponse.json(
        { error: "未找到要更新的爬虫任务定义" },
        { status: 404 },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "更新爬虫任务定义时发生未知错误";

    return NextResponse.json(
      { error: "更新爬虫任务定义失败", details: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE handler to delete a ScraperTaskDefinition by ID
export async function DELETE(
  request: NextRequest,
  props: { params: { id: string } },
) {
  try {
    const awaitedParams = await props.params;
    const taskId = awaitedParams.id;

    if (!taskId) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    // TODO: Consider what to do with ScraperTaskExecutions and ScraperTaskLogs.
    // The schema has onDelete: Cascade for executions, which will cascade to logs.
    // This means deleting a definition will delete all its history.
    // This is often desired, but needs to be confirmed as the business logic.

    await db.scraperTaskDefinition.delete({
      where: { id: taskId },
    });

    // TODO: If the task was scheduled, remove it from the cron-scheduler service

    return NextResponse.json(null, { status: 204 }); // No Content
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      // Prisma error code for record not found
      return NextResponse.json(
        { error: "未找到要删除的爬虫任务定义" },
        { status: 404 },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "删除爬虫任务定义时发生未知错误";

    return NextResponse.json(
      { error: "删除爬虫任务定义失败", details: errorMessage },
      { status: 500 },
    );
  }
}
