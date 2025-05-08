import { Prisma, ContentBlockType, ContentItemType } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// 服务端定义的 ContentItemSchema
const ServerContentItemSchema = z.object({
  id: z.string().optional(),
  itemIdentifier: z.string().optional().nullable(),
  slotKey: z.string().optional().nullable(),
  type: z.nativeEnum(ContentItemType),
  name: z.string().min(1, "Item name cannot be empty"),
  data: z.any().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// 显式定义 ContentBlockUpdateSchema，所有字段可选
const ContentBlockUpdateSchema = z.object({
  identifier: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  type: z.nativeEnum(ContentBlockType).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
  items: z.array(ServerContentItemSchema).optional(), // 使用服务端定义的 Schema
});

// GET: 获取单个 ContentBlock
export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params; // 添加await以正确处理动态参数

  try {
    const contentBlock = await db.contentBlock.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!contentBlock) {
      return NextResponse.json({ error: "内容块未找到" }, { status: 404 });
    }

    return NextResponse.json(contentBlock);
  } catch {
    return NextResponse.json({ error: "获取内容块失败" }, { status: 500 });
  }
}

// PATCH: 更新指定的 ContentBlock
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params; // 添加await以正确处理动态参数

  if (!id) {
    return NextResponse.json({ error: "缺少内容块 ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    // 使用新的 ContentBlockUpdateSchema 进行验证
    const parsedData = ContentBlockUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: parsedData.error.format() },
        { status: 400 },
      );
    }

    const { data: updateData } = parsedData;
    let updatedContentBlock;

    // Helper function to map item data for creation
    const mapItemCreateData = (
      item: z.infer<typeof ServerContentItemSchema>,
    ): Prisma.ContentItemUncheckedCreateWithoutParentBlockInput => {
      const itemCreateData: Prisma.ContentItemUncheckedCreateWithoutParentBlockInput =
        {
          itemIdentifier: item.itemIdentifier,
          slotKey: item.slotKey,
          type: item.type,
          name: item.name,
          data: item.data as Prisma.InputJsonValue,
          order: item.order,
          isActive: item.isActive,
        };

      // Note: We don't include item.id here as it's for creation
      return itemCreateData;
    };

    let blockTypeForDb: ContentBlockType | undefined = updateData.type;

    if (updateData.isActive === true && !blockTypeForDb) {
      const currentBlock = await db.contentBlock.findUnique({
        where: { id },
        select: { type: true },
      });

      if (!currentBlock) {
        return NextResponse.json(
          { error: "要更新的内容块未找到 (在获取类型时)" },
          { status: 404 },
        );
      }
      blockTypeForDb = currentBlock.type;
    }

    if (updateData.isActive === true && blockTypeForDb) {
      updatedContentBlock = await db.$transaction(async (tx) => {
        await tx.contentBlock.updateMany({
          where: {
            type: blockTypeForDb,
            id: { not: id },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        const { items, ...blockFieldsToUpdate } = updateData;

        return tx.contentBlock.update({
          where: { id },
          data: {
            ...blockFieldsToUpdate,
            type: blockFieldsToUpdate.type as ContentBlockType | undefined,
            data: blockFieldsToUpdate.data as
              | Prisma.InputJsonValue
              | undefined
              | null,
            items: items
              ? {
                  deleteMany: {},
                  create: items.map(mapItemCreateData),
                }
              : undefined,
          },
          include: {
            items: true,
          },
        });
      });
    } else {
      const { items, ...blockFieldsToUpdate } = updateData;

      updatedContentBlock = await db.contentBlock.update({
        where: { id },
        data: {
          ...blockFieldsToUpdate,
          type: blockFieldsToUpdate.type as ContentBlockType | undefined,
          data: blockFieldsToUpdate.data as
            | Prisma.InputJsonValue
            | undefined
            | null,
          items: items
            ? {
                deleteMany: {},
                create: items.map(mapItemCreateData),
              }
            : undefined,
        },
        include: {
          items: true,
        },
      });
    }

    return NextResponse.json(updatedContentBlock);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[] | undefined;

        return NextResponse.json(
          {
            error: `更新失败：唯一约束冲突。字段 ${target?.join(", ")} 的值已存在。`,
          },
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "要更新的内容块未找到" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ error: `更新内容块失败` }, { status: 500 });
  }
}

// DELETE: 删除指定的 ContentBlock
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params; // 添加await以正确处理动态参数

  try {
    const existingBlock = await db.contentBlock.findUnique({
      where: { id },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: "内容块未找到" }, { status: 404 });
    }

    // 由于 schema 中 ContentItem 与 ContentBlock 的关系设置了 onDelete: Cascade
    // Prisma 会自动删除关联的 ContentItem 记录
    await db.contentBlock.delete({
      where: { id },
    });

    return NextResponse.json({ message: "内容块已成功删除" });
  } catch {
    return NextResponse.json({ error: "删除内容块失败" }, { status: 500 });
  }
}
