import crypto from "crypto";

import { NextResponse } from "next/server";

// 定义必要的环境变量列表
// 这些是系统运行所必需的核心变量
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  // Cloudflare R2 - 可选，但如果使用图片上传则变为必需
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  // Resend - 移至建议
];

// 定义建议配置的环境变量 (如果缺失，系统仍可运行，但某些功能可能受限或使用默认值)
const SUGGESTED_ENV_VARS = [
  "LOG_LEVEL",
  "NODE_ENV",
  "RESEND_API_KEY", // 如果使用邮件功能则变为必需
];

interface EnvCheckResult {
  missing: string[];
  present: string[];
  suggestedMissing: string[];
  generatedAuthSecret?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const generateSecret = searchParams.get("generateAuthSecret") === "true";

  const missing: string[] = [];
  const present: string[] = [];
  const suggestedMissing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  }

  for (const varName of SUGGESTED_ENV_VARS) {
    if (!process.env[varName]) {
      suggestedMissing.push(varName);
    }
  }

  const result: EnvCheckResult = { missing, present, suggestedMissing };

  if (generateSecret && missing.includes("AUTH_SECRET")) {
    result.generatedAuthSecret = crypto.randomBytes(32).toString("hex");
  }

  return NextResponse.json(result);
}

/**
 * 注意:
 * 这是一个GET请求处理器，用于检查环境变量的状态。
 * 客户端可以通过查询参数 ?generateAuthSecret=true 来请求生成一个新的 AUTH_SECRET。
 * AUTH_SECRET 的生成应仅在用户明确请求时发生，并且应提示用户将其复制到 .env 文件中。
 *
 * 安全提示:
 * - AUTH_SECRET 非常敏感，不应在URL参数中传递或在客户端日志中明文显示。
 * - 生成后，应通过安全的方式（例如，复制到剪贴板按钮，不在响应中直接显示很长实际值）提供给用户。
 *   为简化，这里我们直接在响应中返回了生成的 secret，实际应用中应增强安全性。
 * - 这个端点本身应该受到保护，确保只有在安装向导期间才能访问。
 */
