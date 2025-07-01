import { NextRequest, NextResponse } from "next/server";

// 默认设置配置
const defaultSettings = {
  scheduler: {
    enabled: true,
    intervalMinutes: 60,
    cleanup: true,
    retentionDays: 30,
  },
  notifications: {
    enabled: true,
    criticalThreshold: 100,
    warningThreshold: 500,
    channels: {
      email: true,
      webhook: false,
      dashboard: true,
    },
  },
  brandMatching: {
    autoMatch: true,
    confidenceLevel: 0.8,
    fuzzyMatch: true,
  },
};

// 简单的内存存储（生产环境中应使用数据库）
let settings = { ...defaultSettings };

export async function GET() {
  try {
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证设置格式
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 },
      );
    }

    // 更新设置（可以添加更多验证）
    settings = {
      ...settings,
      ...body,
      scheduler: {
        ...settings.scheduler,
        ...body.scheduler,
      },
      notifications: {
        ...settings.notifications,
        ...body.notifications,
        channels: {
          ...settings.notifications.channels,
          ...body.notifications?.channels,
        },
      },
      brandMatching: {
        ...settings.brandMatching,
        ...body.brandMatching,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
