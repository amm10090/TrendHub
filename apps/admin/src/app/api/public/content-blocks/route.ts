import { NextRequest, NextResponse } from "next/server";
import { Prisma, ContentBlockType } from "@prisma/client";

import { db } from "@/lib/db";

// GET: 获取公共内容块数据
// 支持通过 identifier (单个) 或 type (多个) 查询
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier");
  const typeParam = searchParams.get("type");
  const singleParam = searchParams.get("single");
  const categorySlug = searchParams.get("categorySlug"); // 新增: 一级分类的slug参数

  try {
    // 如果提供了 categorySlug，先查找对应的分类
    let targetCategoryId: string | undefined;
    if (categorySlug) {
      const category = await db.category.findFirst({
        where: {
          slug: categorySlug,
          level: 1,
          isActive: true,
        },
        select: { id: true },
      });

      if (category) {
        targetCategoryId = category.id;
      }
    }

    if (identifier) {
      // 按 identifier 查询单个 ContentBlock
      const contentBlock = await db.contentBlock.findFirst({
        where: {
          identifier: identifier,
          isActive: true, // 仅获取激活的内容块
        },
        include: {
          items: {
            where: { isActive: true }, // 仅获取激活的 ContentItem
            orderBy: { order: "asc" },
          },
        },
      });

      if (!contentBlock) {
        return NextResponse.json(
          { error: "内容块未找到或未激活" },
          { status: 404 },
        );
      }
      return NextResponse.json(contentBlock);
    } else if (
      typeParam &&
      Object.values(ContentBlockType).includes(typeParam as ContentBlockType)
    ) {
      // 按 type 查询
      const baseWhereCondition: Prisma.ContentBlockWhereInput = {
        type: typeParam as ContentBlockType,
        isActive: true,
      };

      // 如果有一级分类ID，添加到查询条件
      if (targetCategoryId) {
        baseWhereCondition.targetPrimaryCategoryId = targetCategoryId;
      }

      const includeItemsArgs = {
        items: {
          where: { isActive: true },
          orderBy: { order: "asc" as const }, // 确保 Prisma 接受 'asc' 而不是 string
        },
      };

      if (singleParam === "true") {
        // 如果期望单个结果 (single=true)，使用 findFirst
        const singleBlock = await db.contentBlock.findFirst({
          where: baseWhereCondition,
          include: includeItemsArgs,
          // 对于 findFirst，orderBy 通常用于在有多个匹配项时选择哪一个，但我们期望只有一个激活的
        });
        if (!singleBlock) {
          return NextResponse.json(
            { error: `类型为 '${typeParam}' 的激活内容块未找到` },
            { status: 404 },
          );
        }
        return NextResponse.json(singleBlock);
      } else {
        // 否则 (没有 single=true 或 single 不是 true)，返回数组 (findMany)
        const contentBlocks = await db.contentBlock.findMany({
          where: baseWhereCondition,
          include: includeItemsArgs,
          orderBy: { updatedAt: "desc" as const }, // 或者其他合适的默认排序 for a list
        });
        return NextResponse.json(contentBlocks);
      }
    } else {
      // 如果没有提供 identifier 或有效的 type，则返回错误
      return NextResponse.json(
        { error: "必须提供 'identifier' 或有效的 'type' 查询参数" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "获取公共内容块失败" }, { status: 500 });
  }
}
