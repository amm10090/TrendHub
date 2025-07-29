import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// 扩展全局类型以包含PrismaClient单例
declare global {
  var prisma: PrismaClient | undefined;
}

// 初始化PrismaClient (使用单例模式)
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// 定义不应公开的设置类别或键名
// 注意：这是一个示例列表，您可能需要根据实际情况调整
const SENSITIVE_CATEGORIES = ["database", "api"]; // 按类别过滤
const SENSITIVE_KEYS = ["apiKey", "dbPassword"]; // 按特定键过滤

// GET /api/public/settings - 获取公共网站设置
export async function GET() {
  try {
    // 1. 获取所有设置
    const allSettings = await prisma.siteSetting.findMany();

    // 2. 过滤敏感设置并转换为键值对对象
    const publicSettings = allSettings.reduce(
      (acc: Record<string, string>, setting) => {
        // 检查是否属于敏感类别或特定敏感键
        const isSensitiveCategory = SENSITIVE_CATEGORIES.includes(
          setting.category,
        );
        const isSensitiveKey = SENSITIVE_KEYS.includes(setting.key);

        // 如果不是敏感设置，则添加到结果对象中
        if (!isSensitiveCategory && !isSensitiveKey) {
          acc[setting.key] = setting.value;
        }
        return acc;
      },
      {},
    );

    // 3. 返回公共设置
    return NextResponse.json({ success: true, data: publicSettings });
  } catch {
    // 在生产环境中可能希望记录更详细的错误，但对客户端隐藏细节
    return NextResponse.json(
      {
        success: false,
        error: "获取网站设置失败",
        // message: errorMessage, // 调试时可以取消注释
      },
      { status: 500 },
    );
  }
}
