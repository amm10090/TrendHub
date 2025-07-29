import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// 获取所有页面
export async function GET() {
  try {
    const pages = await db.page.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(pages);
  } catch {
    return NextResponse.json({ error: "获取页面失败" }, { status: 500 });
  }
}

// 创建新页面
const PageSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  url: z.string().min(1, "URL不能为空"),
  content: z.string().optional(),
  mainImage: z.string().optional(),
  status: z.enum(["Published", "Draft"]).default("Draft"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = PageSchema.parse(body);

    // 检查URL是否已存在
    const existingPage = await db.page.findUnique({
      where: { url: validatedData.url },
    });

    if (existingPage) {
      return NextResponse.json({ error: "此URL已被使用" }, { status: 400 });
    }

    // 设置publishedAt (如果是Published状态)
    const pageData: {
      title: string;
      url: string;
      content?: string;
      mainImage?: string;
      status: "Published" | "Draft";
      publishedAt?: Date;
    } = {
      title: validatedData.title,
      url: validatedData.url,
      content: validatedData.content,
      mainImage: validatedData.mainImage,
      status: validatedData.status,
    };

    if (validatedData.status === "Published") {
      pageData.publishedAt = new Date();
    }

    const newPage = await db.page.create({
      data: pageData,
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "验证失败", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "创建页面失败" }, { status: 500 });
  }
}
