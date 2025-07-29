import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

// 声明全局变量
declare global {
  var prisma: PrismaClient | undefined;
}

// 使用单例模式确保每个实例只创建一次PrismaClient
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Zod schema for validation
const snippetSchema = z.object({
  name: z.string().min(1, { message: "名称不能为空" }),
  description: z.string().optional().nullable(),
  code: z.string().min(1, { message: "代码不能为空" }),
  type: z.enum(["JS", "CSS"], { message: "类型必须是 JS 或 CSS" }),
  location: z.enum(["HEAD", "BODY_START", "BODY_END"], {
    message: "位置必须是 HEAD, BODY_START 或 BODY_END",
  }),
  paths: z.array(z.string()).optional().default([]),
  priority: z.number().int().optional().default(10),
  isActive: z.boolean().optional().default(false),
});

// GET /api/code-snippets - 获取所有代码片段
export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
      orderBy: {
        createdAt: "desc", // 按创建时间降序排序
      },
    });

    return NextResponse.json({ success: true, data: snippets });
  } catch {
    return NextResponse.json(
      { success: false, error: "获取代码片段失败" },
      { status: 500 },
    );
  }
}

// POST /api/code-snippets - 创建新的代码片段
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = snippetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "输入验证失败",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      description,
      code,
      type,
      location,
      paths,
      priority,
      isActive,
    } = validation.data;

    // 构建要传递给 Prisma 的数据对象
    const dataForPrisma = {
      name,
      code,
      type,
      location,
      paths,
      priority,
      isActive,
      // 只有在 description 不是 undefined 或 null 时才包含它
      ...(description !== undefined && description !== null && { description }),
    };

    const newSnippet = await prisma.codeSnippet.create({
      data: dataForPrisma, // 使用构建好的对象
    });

    return NextResponse.json(
      { success: true, data: newSnippet, message: "代码片段创建成功" },
      { status: 201 },
    );
  } catch {
    // 详细记录错误

    // 提供更详细的错误信息以便调试
    const errorMessage =
      error instanceof Error
        ? `创建代码片段失败: ${error.message}`
        : "创建代码片段失败: 未知错误";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
