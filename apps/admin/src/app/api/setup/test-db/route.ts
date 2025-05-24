import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    // 测试数据库连接
    await db.$connect();

    // 执行一个简单的查询来验证连接
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      messageKey: "setupPage.databaseTest.successMessage",
    });
  } catch (error: unknown) {
    const err = error as Error;

    return NextResponse.json(
      {
        success: false,
        errorKey: "setupPage.databaseTest.errorMessage",
        details: err.message,
      },
      { status: 500 },
    );
  } finally {
    try {
      await db.$disconnect();
    } catch {
      // Silently ignore disconnect errors
    }
  }
}
