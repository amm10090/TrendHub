import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// 使用单例模式确保每个实例只创建一次PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// 判断路径是否匹配给定的模式
function pathMatchesPattern(path: string, pattern: string): boolean {
  // 简单的通配符支持
  if (pattern === "*") return true;
  if (pattern === "/") return path === "/" || path === "";
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1); // 去除 /*
    return path === prefix || path.startsWith(prefix);
  }
  return path === pattern;
}

// GET /api/public/code-snippets - 获取当前路径下的所有活跃代码片段
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";

  try {
    // 获取所有活跃的代码片段
    const snippets = await prisma.codeSnippet.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc", // 按创建时间降序排序
      },
    });

    // 过滤匹配当前路径的片段
    const matchingSnippets = snippets.filter((snippet) => {
      // 如果片段没有指定路径限制，则在所有页面生效
      if (!snippet.paths?.length) return true;
      // 否则检查当前路径是否匹配任意一个指定的路径模式
      return snippet.paths.some((pattern) => pathMatchesPattern(path, pattern));
    });

    // 返回过滤后的结果
    return NextResponse.json({
      success: true,
      data: matchingSnippets.map((snippet) => ({
        ...snippet,
        // 清理代码中可能存在的多余空格，特别是URL部分
        code: snippet.code.replace(/src=["']([^"']+?)["']/g, (match, url) => {
          return match.replace(url, url.trim());
        }),
      })),
    });
  } catch (error) {
    console.error("获取公开代码片段失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取代码片段失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
