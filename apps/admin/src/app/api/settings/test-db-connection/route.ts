import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { host, port, database, user, password, ssl } = await req.json();

    // 创建一个临时的Prisma客户端用于测试连接
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public${ssl ? "&sslmode=require" : ""}`,
        },
      },
    });

    // 尝试连接数据库并执行简单查询
    await prisma.$queryRaw`SELECT 1`;

    // 连接成功，断开连接
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        message: "数据库连接成功",
      },
    });
  } catch (error) {
    console.error("数据库连接测试失败:", error);

    // 提取有用的错误信息
    let errorMessage = "数据库连接失败";

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "连接超时，请检查数据库地址和端口是否正确";
      } else if (error.message.includes("authentication")) {
        errorMessage = "认证失败，请检查用户名和密码";
      } else if (error.message.includes("database")) {
        errorMessage = "数据库不存在或无法访问";
      } else {
        errorMessage = `连接错误: ${error.message}`;
      }
    }

    return NextResponse.json({
      success: false,
      data: {
        isConnected: false,
        message: errorMessage,
      },
    });
  }
}
