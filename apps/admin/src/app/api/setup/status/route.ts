import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const initializedSetting = await db.siteSetting.findUnique({
      where: { key: "systemInitialized" },
      select: { value: true }, // 只选择 value 字段以提高效率
    });

    const isInitialized = initializedSetting?.value === "true";

    return NextResponse.json({ initialized: isInitialized });
  } catch {
    // 如果数据库查询失败，为了安全起见，可以认为系统未初始化或返回错误
    // 返回一个错误状态，让中间件决定如何处理（例如，重定向到错误页或设置页）
    return NextResponse.json(
      { initialized: false, error: "Failed to check system status" },
      { status: 500 },
    );
  }
}
