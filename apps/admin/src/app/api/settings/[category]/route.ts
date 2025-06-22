import { NextResponse } from "next/server";

import { db } from "@/lib/db";

interface SettingResponse {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

// 获取特定类别的设置
export async function GET(
  request: Request,
  { params }: { params: { category: string } },
) {
  try {
    const { category } = await Promise.resolve(params);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少类别参数",
        },
        { status: 400 },
      );
    }

    // 从数据库获取指定类别的设置
    const settings = await db.siteSetting.findMany({
      where: {
        category,
      },
      orderBy: {
        key: "asc",
      },
    });

    // 转换为响应格式
    const formattedSettings: SettingResponse[] = settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedSettings,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: `获取${params.category}类别设置失败`,
      },
      { status: 500 },
    );
  }
}

// 删除特定键的设置
export async function DELETE(
  request: Request,
  { params }: { params: { category: string } },
) {
  const { category } = await Promise.resolve(params);
  // 如果路径是 /api/settings/{key}，则删除特定设置
  if (category && !category.includes("/")) {
    try {
      const key = category;

      // 删除设置
      await db.siteSetting.delete({
        where: { key },
      });

      return NextResponse.json({
        success: true,
        message: `设置 ${key} 已成功删除`,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: `删除设置失败`,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: "无效的请求",
    },
    { status: 400 },
  );
}
