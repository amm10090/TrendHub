import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// 单个页面的路由处理

// 获取单个页面
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const page = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json({ error: "页面不存在" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "获取页面失败" }, { status: 500 });
  }
}

// 更新页面
const UpdatePageSchema = z.object({
  title: z.string().min(1, "标题不能为空").optional(),
  url: z.string().min(1, "URL不能为空").optional(),
  content: z.string().optional(),
  mainImage: z.string().optional(),
  status: z.enum(["Published", "Draft"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const validatedData = UpdatePageSchema.parse(body);

    // 检查页面是否存在
    const existingPage = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "页面不存在" }, { status: 404 });
    }

    // 如果更新URL，检查是否与其他页面冲突
    if (validatedData.url && validatedData.url !== existingPage.url) {
      const urlExists = await db.page.findUnique({
        where: { url: validatedData.url },
      });

      if (urlExists) {
        return NextResponse.json({ error: "此URL已被使用" }, { status: 400 });
      }
    }

    // 处理状态变更
    let publishedAt = existingPage.publishedAt;

    if (validatedData.status === "Published" && !existingPage.publishedAt) {
      publishedAt = new Date();
    } else if (
      validatedData.status === "Draft" &&
      existingPage.status === "Published"
    ) {
      // 如果从已发布变为草稿，保留publishedAt (历史记录)
      publishedAt = existingPage.publishedAt;
    }

    // 更新页面
    const updatedPage = await db.page.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        publishedAt,
      },
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "验证失败", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "更新页面失败" }, { status: 500 });
  }
}

// 删除页面
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 检查页面是否存在
    const existingPage = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "页面不存在" }, { status: 404 });
    }

    // 删除页面
    await db.page.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除页面失败" }, { status: 500 });
  }
}
