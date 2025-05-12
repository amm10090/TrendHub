import { Category } from "@prisma/client"; // 导入 Category 类型
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// 定义一个包含产品计数的分类类型别名，以便于使用
type CategoryWithProductCount = Category & {
  _count: {
    products: number;
  };
};

// 辅助函数：获取一个分类的所有后代（子、孙等）分类的ID
function getAllDescendantIds(
  categoryId: string,
  allCategories: CategoryWithProductCount[],
  categoryMap: Map<string, CategoryWithProductCount>,
): string[] {
  const descendantIds: string[] = [];
  const children = allCategories.filter((cat) => cat.parentId === categoryId);

  for (const child of children) {
    descendantIds.push(child.id);
    // 递归查找子分类的后代
    descendantIds.push(
      ...getAllDescendantIds(child.id, allCategories, categoryMap),
    );
  }

  return descendantIds;
}

export async function GET() {
  try {
    // 1. 获取所有活跃分类及其直接关联的活跃、未删除产品数量
    const allActiveCategories = await db.category.findMany({
      where: {
        isActive: true, // 只统计活跃分类
      },
      include: {
        _count: {
          select: {
            products: {
              where: { isDeleted: false }, // 只统计未删除的产品，不再要求 status: "Active"
            },
          },
        },
      },
      orderBy: {
        level: "asc", // 按层级排序可能有助于后续处理，虽然Map查找更快
      },
    });

    // 2. 创建一个Map以便快速查找分类数据
    const categoryMap = new Map<string, CategoryWithProductCount>(
      allActiveCategories.map((cat) => [cat.id, cat]),
    );

    // 3. 筛选出所有一级分类
    const topLevelCategories = allActiveCategories.filter(
      (category) => category.level === 1,
    );

    // 4. 计算每个一级分类及其所有后代的总产品数
    const result = topLevelCategories.map((topCategory) => {
      // 获取所有后代分类的ID
      const descendantIds = getAllDescendantIds(
        topCategory.id,
        allActiveCategories,
        categoryMap,
      );

      // 计算总产品数：一级分类自身的产品数 + 所有后代分类的产品数
      let totalProductCount = topCategory._count.products;

      descendantIds.forEach((descendantId) => {
        const descendantCategory = categoryMap.get(descendantId);

        if (descendantCategory) {
          // 使用 Prisma 返回的正确的 _count 结构
          totalProductCount += descendantCategory._count.products;
        }
      });

      return {
        id: topCategory.id,
        name: topCategory.name,
        level: topCategory.level, // 虽然固定为1，但保留以保持结构一致
        productCount: totalProductCount,
      };
    });

    // 5. 按名称排序最终结果 (可选)
    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "获取分类产品统计失败" },
      { status: 500 },
    );
  }
}
