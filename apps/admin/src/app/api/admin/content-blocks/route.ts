import { Prisma, ContentBlockType, ContentItemType } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { db } from "@/lib/db";

// 内容项创建数据的接口
interface ContentItemCreateData {
  itemIdentifier?: string | null;
  slotKey?: string | null;
  type: ContentItemType;
  name: string;
  data?: unknown;
  order: number;
  isActive: boolean;
}

// 创建国际化 Schema 的辅助函数
const createApiContentItemSchema = async () => {
  const t = await getTranslations("contentManagement.api.validation");

  return z.object({
    itemIdentifier: z.string().optional().nullable(),
    slotKey: z.string().optional().nullable(),
    type: z.nativeEnum(ContentItemType),
    name: z.string().min(1, t("nameRequired")),
    data: z.any().optional().nullable(), // 保持 data 宽松，允许任何结构或 null
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
  });
};

const createContentBlockCreateSchema = async () => {
  const t = await getTranslations("contentManagement.api.validation");
  const ApiContentItemSchema = await createApiContentItemSchema();

  return z.object({
    identifier: z
      .string()
      .min(1, t("identifierRequired"))
      .regex(/^[a-z0-9-]+$/, t("identifierFormat")),
    type: z.nativeEnum(ContentBlockType),
    name: z.string().min(1, t("nameRequired")),
    description: z.string().optional().nullable(),
    data: z.any().optional().nullable(),
    isActive: z.boolean().default(true),
    targetPrimaryCategoryId: z
      .string()
      .cuid({ message: t("invalidPrimaryCategoryId") })
      .optional()
      .nullable(),
    items: z.array(ApiContentItemSchema).optional(),
  });
};

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
    const t = await getTranslations("contentManagement.api.errors");

    return NextResponse.json(
      { error: t("fetchContentBlocksFailed") },
      { status: 500 },
    );
  }
}

// POST: 创建新的内容块
export async function POST(request: NextRequest) {
  try {
    const t = await getTranslations("contentManagement.api.errors");
    const body = await request.json();
    const ContentBlockCreateSchema = await createContentBlockCreateSchema();
    const parsedData = ContentBlockCreateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: t("dataValidationFailed"),
          details: parsedData.error.format(),
        },
        { status: 400 },
      );
    }

    const { data: blockData } = parsedData;
    const blockTypeForDb = blockData.type as ContentBlockType;

    let newContentBlock;

    // Helper function to map item data
    const mapItemCreateData = (
      item: ContentItemCreateData,
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
  } catch {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[] | undefined;
        const t = await getTranslations("contentManagement.api.errors");

        return NextResponse.json(
          {
            error: t("createUniqueConstraintConflict", {
              fields: target?.join(", ") || "",
            }),
          },
          { status: 409 },
        );
      }
    }

    const t = await getTranslations("contentManagement.api.errors");

    return NextResponse.json(
      { error: t("createContentBlockFailed") },
      { status: 500 },
    );
  }
}
