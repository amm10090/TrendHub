import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface SettingResponse {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

// 获取所有设置
export async function GET() {
  try {
    // 从数据库获取所有站点设置
    const settings = await db.siteSetting.findMany({
      orderBy: {
        key: "asc",
      },
    });

    // 按类别组织设置
    const settingsByCategory: Record<string, SettingResponse[]> = {};

    for (const setting of settings) {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = [];
      }

      settingsByCategory[setting.category].push({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: settingsByCategory,
    });
  } catch (error) {
    console.error("获取设置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "获取设置失败",
      },
      { status: 500 },
    );
  }
}

// 创建或更新单个设置
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value, category } = body;

    if (!key || value === undefined || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "参数不完整",
        },
        { status: 400 },
      );
    }

    // 使用upsert创建或更新设置
    const setting = await db.siteSetting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: setting.id,
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("保存设置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "保存设置失败",
      },
      { status: 500 },
    );
  }
}

// 批量保存设置
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的设置数据",
        },
        { status: 400 },
      );
    }

    // 批量更新设置
    const results = await Promise.all(
      settings.map(
        async ({
          key,
          value,
          category,
        }: {
          key: string;
          value: string;
          category: string;
        }) => {
          if (!key || value === undefined || !category) {
            throw new Error(`设置 ${key} 参数不完整`);
          }

          return db.siteSetting.upsert({
            where: { key },
            update: { value, category },
            create: { key, value, category },
          });
        },
      ),
    );

    return NextResponse.json({
      success: true,
      data: results.map((setting) => ({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("批量保存设置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "批量保存设置失败",
      },
      { status: 500 },
    );
  }
}
