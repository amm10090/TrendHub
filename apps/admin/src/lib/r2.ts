import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2存储客户端配置
 * 使用AWS S3兼容API与Cloudflare R2进行交互
 */
export const r2Client = new S3Client({
  region: "auto", // Cloudflare R2使用auto作为区域
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// 存储桶名称
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ""; // 确保环境变量有默认值或处理未定义情况

// 公共访问URL前缀
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // 确保环境变量有默认值或处理未定义情况

// 基本验证，确保环境变量已设置
if (
  !process.env.CLOUDFLARE_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME ||
  !R2_PUBLIC_URL
) {
  // 在生产环境中，您可能希望抛出错误或采取更严格的措施
  // throw new Error("Cloudflare R2 environment variables are not fully configured.");
}
