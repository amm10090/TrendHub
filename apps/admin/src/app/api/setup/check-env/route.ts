import crypto from "crypto";

import { NextResponse } from "next/server";

// 定义必要的环境变量列表
// 这些是系统运行所必需的核心变量
const REQUIRED_ENV_VARS = ["DATABASE_URL", "AUTH_SECRET", "NEXTAUTH_URL"];

// 定义建议配置的环境变量 (如果缺失，系统仍可运行，但某些功能可能受限或使用默认值)
const SUGGESTED_ENV_VARS = [
  "LOG_LEVEL",
  "NODE_ENV",
  "RESEND_API_KEY", // 如果使用邮件功能则变为必需
  // Cloudflare R2 - 可选，但如果使用图片上传则变为必需
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
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
