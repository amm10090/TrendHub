import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let prisma: PrismaClient | null = null;

  try {
    const body = await req.json();
    const { host, port, database, user, password, ssl } = body;

    // 输出连接尝试日志，但不显示密码

    // 创建一个临时的Prisma客户端用于测试连接
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public${ssl ? "&sslmode=require" : ""}`;

    // 创建一个临时的Prisma客户端实例
    prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });

    // 测试连接
    await prisma.$connect();

    // 计算延迟
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    return NextResponse.json(
      {
        success: true,
        data: {
          isConnected: true,
          message: `成功连接到 ${host}:${port}/${database}`,
          latency,
        },
      },
      { status: 200 },
    );
  } catch {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // 提取和格式化错误信息
    let errorMessage = "连接失败: 未知错误";
    let detailedError = "未知错误";

    if (error instanceof Error) {
      errorMessage = error.message;
      detailedError = `${error.name}: ${error.message}${error.stack ? "\n" + error.stack : ""}`;

      // 提供更友好的错误消息
      if (errorMessage.includes("timeout")) {
        errorMessage =
          "连接超时：请检查主机地址、端口是否正确，以及数据库服务器是否运行";
      } else if (errorMessage.includes("authentication")) {
        errorMessage = "认证失败：用户名或密码不正确";
      } else if (
        errorMessage.includes("does not exist") ||
        errorMessage.includes("不存在")
      ) {
        errorMessage = "数据库不存在：请检查数据库名称或创建数据库";
      } else if (errorMessage.includes("ECONNREFUSED")) {
        errorMessage = "连接被拒绝：服务器可能未运行或防火墙阻止了连接";
      }
    }

    return NextResponse.json(
      {
        success: false,
        data: {
          isConnected: false,
          message: errorMessage,
          error: detailedError,
          latency,
        },
      },
      { status: 200 },
    );
  } finally {
    // 确保断开连接
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
