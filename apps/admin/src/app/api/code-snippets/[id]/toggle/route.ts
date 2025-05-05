import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// PATCH /api/code-snippets/{id}/toggle - 切换代码片段激活状态
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    // 检查片段是否存在
    const existingSnippet = await prisma.codeSnippet.findUnique({
      where: { id },
      select: { isActive: true }, // 只选择isActive字段以提高效率
    });

    if (!existingSnippet) {
      return NextResponse.json(
        { success: false, error: "代码片段未找到" },
        { status: 404 },
      );
    }

    // 切换状态
    const updatedSnippet = await prisma.codeSnippet.update({
      where: { id },
      data: { isActive: !existingSnippet.isActive },
    });

    return NextResponse.json({
      success: true,
      data: { isActive: updatedSnippet.isActive },
      message: `代码片段已${updatedSnippet.isActive ? "激活" : "禁用"}`, // 使用中文
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "切换代码片段状态失败" },
      { status: 500 },
    );
  }
}
