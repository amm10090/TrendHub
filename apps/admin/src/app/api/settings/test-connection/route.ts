import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST() {
  try {
    // 尝试执行一个简单的查询来测试连接
    const startTime = Date.now();

    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        latency,
        message: "数据库连接正常",
      },
    });
  } catch (error) {
    console.error("数据库连接测试失败:", error);

    return NextResponse.json({
      success: false,
      data: {
        isConnected: false,
        latency: 0,
        message: "数据库连接失败",
      },
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
}
