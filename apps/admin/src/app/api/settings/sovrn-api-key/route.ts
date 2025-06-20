import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";

/**
 * 获取当前配置的Sovrn API Key
 */
export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "sovrnApiKey" },
    });

    const apiKey = setting?.value || "";

    return NextResponse.json({
      success: true,
      apiKey,
      hasApiKey: Boolean(apiKey),
      keyPreview: apiKey
        ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        apiKey: "",
        hasApiKey: false,
      },
      { status: 500 },
    );
  }
}

/**
 * 保存Sovrn API Key到数据库
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: "请提供有效的API Key" },
        { status: 400 },
      );
    }

    await db.siteSetting.upsert({
      where: { key: "sovrnApiKey" },
      update: { value: apiKey.trim(), category: "api" },
      create: { key: "sovrnApiKey", value: apiKey.trim(), category: "api" },
    });

    return NextResponse.json({
      success: true,
      message: "API Key保存成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
