import { Prisma, ContentBlockType, ContentItemType } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// 为 API 定义的简化的 ContentItem Schema
const ApiContentItemSchema = z.object({
  itemIdentifier: z.string().optional().nullable(),
  slotKey: z.string().optional().nullable(),
  type: z.nativeEnum(ContentItemType),
  name: z.string().min(1, "名称不能为空"),
  data: z.any().optional().nullable(), // 保持 data 宽松，允许任何结构或 null
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET: 获取所有 ContentBlock (支持过滤和分页)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const sort = searchParams.get("sort") || "updatedAt:desc"; // مثال: "name:asc", "updatedAt:desc"

  const [sortField, sortOrder] = sort.split(":") as [string, "asc" | "desc"];

  try {
    const contentBlocks = await db.contentBlock.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: {
        items: true, // 同时获取关联的 items
        targetPrimaryCategory: { select: { id: true, name: true, slug: true } }, // 新增
      },
    });

    const totalContentBlocks = await db.contentBlock.count();

    return NextResponse.json({
      data: contentBlocks,
      meta: {
        total: totalContentBlocks,
        page,
        limit,
        totalPages: Math.ceil(totalContentBlocks / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "获取内容块列表失败" }, { status: 500 });
  }
}

// 在 route.ts 中显式定义 ContentBlockCreateSchema
const ContentBlockCreateSchema = z.object({
  identifier: z
    .string()
    .min(1, "Identifier 不能为空")
    .regex(/^[a-z0-9-]+$/, "只允许小写字母、数字和连字符"),
  type: z.nativeEnum(ContentBlockType), // 使用导入的 ContentBlockType
  name: z.string().min(1, "名称不能为空"),
  description: z.string().optional().nullable(),
  data: z.any().optional().nullable(), // 或者使用更精确的 jsonSchema 定义（如果已在某处定义）
  isActive: z.boolean().default(true),
  targetPrimaryCategoryId: z
    .string()
    .cuid({ message: "无效的一级分类ID" })
    .optional()
    .nullable(), // 新增
  items: z.array(ApiContentItemSchema).optional(), // 使用更新后的 ApiContentItemSchema
});

// POST: 创建新的内容块
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = ContentBlockCreateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: parsedData.error.format() },
        { status: 400 },
      );
    }

    const { data: blockData } = parsedData;
    const blockTypeForDb = blockData.type as ContentBlockType;

    let newContentBlock;

    // Helper function to map item data
    const mapItemCreateData = (
      item: z.infer<typeof ApiContentItemSchema>,
    ): Prisma.ContentItemUncheckedCreateWithoutParentBlockInput => {
      const itemCreateData: Prisma.ContentItemUncheckedCreateWithoutParentBlockInput =
        {
          type: item.type,
          name: item.name,
          slotKey: item.slotKey,
          data: item.data as Prisma.InputJsonValue,
          order: item.order,
          isActive: item.isActive,
        };

      if (item.itemIdentifier !== undefined) {
        itemCreateData.itemIdentifier = item.itemIdentifier;
      }

      return itemCreateData;
    };

    if (blockData.isActive) {
      newContentBlock = await db.$transaction(async (tx) => {
        // await tx.contentBlock.updateMany({
        //   where: {
        //     type: blockTypeForDb,
        //     isActive: true,
        //   },
        //   data: {
        //     isActive: false,
        //   },
        // });

        return tx.contentBlock.create({
          data: {
            identifier: blockData.identifier,
            type: blockTypeForDb,
            name: blockData.name,
            description: blockData.description,
            data: blockData.data as Prisma.InputJsonValue | undefined,
            isActive: blockData.isActive,
            targetPrimaryCategoryId: blockData.targetPrimaryCategoryId, // 新增
            items: blockData.items
              ? {
                  create: blockData.items.map(mapItemCreateData),
                }
              : undefined,
          },
          include: {
            items: true,
          },
        });
      });
    } else {
      newContentBlock = await db.contentBlock.create({
        data: {
          identifier: blockData.identifier,
          type: blockTypeForDb,
          name: blockData.name,
          description: blockData.description,
          data: blockData.data as Prisma.InputJsonValue | undefined,
          isActive: blockData.isActive,
          targetPrimaryCategoryId: blockData.targetPrimaryCategoryId, // 新增
          items: blockData.items
            ? {
                create: blockData.items.map(mapItemCreateData),
              }
            : undefined,
        },
        include: {
          items: true,
        },
      });
    }

    return NextResponse.json(newContentBlock, { status: 201 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[] | undefined;

        return NextResponse.json(
          {
            error: `创建失败：唯一约束冲突。字段 ${target?.join(", ")} 的值已存在。`,
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({ error: "创建内容块失败" }, { status: 500 });
  }
}
