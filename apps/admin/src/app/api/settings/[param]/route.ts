import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// 设置项的接口定义
interface SettingItem {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

// 获取特定类别或键的设置的API处理函数
// GET /api/settings/[param]
export async function GET(
  req: NextRequest,
  context: { params: { param: string } },
) {
  try {
    const param = await context.params.param;

    if (!param) {
      return NextResponse.json(
        { success: false, error: "参数是必须的" },
        { status: 400 },
      );
    }

    // 尝试按键查找设置
    const settingByKey = await db.siteSetting.findUnique({
      where: {
        key: param,
      },
    });

    // 如果按键找到了设置，返回单个设置
    if (settingByKey) {
      return NextResponse.json(
        { success: true, data: settingByKey },
        { status: 200 },
      );
    }

    // 否则按类别查询设置
    const settings = await db.siteSetting.findMany({
      where: {
        category: param,
      },
      orderBy: {
        key: "asc",
      },
    });

    // 如果找到了设置，返回设置列表
    if (settings.length > 0) {
      const formattedSettings: SettingItem[] = settings.map((setting) => ({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt,
      }));

      return NextResponse.json(
        { success: true, data: formattedSettings },
        { status: 200 },
      );
    }

    // 如果都没找到，返回404
    return NextResponse.json(
      { success: false, error: "未找到设置" },
      { status: 404 },
    );
  } catch (error) {
    console.error(`[SETTINGS_GET_PARAM]`, error);

    // 返回错误响应
    return NextResponse.json(
      { success: false, error: "获取设置失败" },
      { status: 500 },
    );
  }
}

// 删除特定键的设置
// DELETE /api/settings/[param]
export async function DELETE(
  req: NextRequest,
  context: { params: { param: string } },
) {
  try {
    const param = await context.params.param;

    if (!param) {
      return NextResponse.json(
        { success: false, error: "设置键是必须的" },
        { status: 400 },
      );
    }

    // 查询特定键的设置是否存在
    const setting = await db.siteSetting.findUnique({
      where: {
        key: param,
      },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: "未找到该设置" },
        { status: 404 },
      );
    }

    // 删除设置
    await db.siteSetting.delete({
      where: {
        key: param,
      },
    });

    // 返回成功响应
    return NextResponse.json(
      { success: true, message: "设置已成功删除" },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[SETTINGS_DELETE_PARAM]`, error);

    // 返回错误响应
    return NextResponse.json(
      { success: false, error: "删除设置失败" },
      { status: 500 },
    );
  }
}
