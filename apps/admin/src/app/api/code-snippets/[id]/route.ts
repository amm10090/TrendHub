import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

// Zod schema for validation (Update)
const snippetUpdateSchema = z.object({
  name: z.string().min(1, { message: "名称不能为空" }).optional(),
  description: z.string().optional().nullable(),
  code: z.string().min(1, { message: "代码不能为空" }).optional(),
  type: z.enum(["JS", "CSS"], { message: "类型必须是 JS 或 CSS" }).optional(),
  location: z
    .enum(["HEAD", "BODY_START", "BODY_END"], {
      message: "位置必须是 HEAD, BODY_START 或 BODY_END",
    })
    .optional(),
  paths: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/code-snippets/{id} - 获取单个代码片段
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await Promise.resolve(params);

  try {
    const snippet = await prisma.codeSnippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json(
        { success: false, error: "代码片段未找到" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: snippet });
  } catch {
    return NextResponse.json(
      { success: false, error: "获取代码片段失败" },
      { status: 500 },
    );
  }
}

// PUT /api/code-snippets/{id} - 更新代码片段
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await Promise.resolve(params);

  try {
    const body = await request.json();
    const validation = snippetUpdateSchema.safeParse(body);

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

    const dataToUpdate = validation.data;

    // 检查片段是否存在
    const existingSnippet = await prisma.codeSnippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return NextResponse.json(
        { success: false, error: "代码片段未找到" },
        { status: 404 },
      );
    }

    const updatedSnippet = await prisma.codeSnippet.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      data: updatedSnippet,
      message: "代码片段更新成功",
    });
  } catch {
    // Handle potential Prisma errors like unique constraint violations if needed
    return NextResponse.json(
      { success: false, error: "更新代码片段失败" },
      { status: 500 },
    );
  }
}

// DELETE /api/code-snippets/{id} - 删除代码片段
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await Promise.resolve(params);

  try {
    // 检查片段是否存在
    const existingSnippet = await prisma.codeSnippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return NextResponse.json(
        { success: false, error: "代码片段未找到" },
        { status: 404 },
      );
    }

    await prisma.codeSnippet.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "代码片段删除成功" },
      { status: 200 }, // Or 204 No Content
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "删除代码片段失败" },
      { status: 500 },
    );
  }
}
