import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 storage client configuration
 * Uses AWS S3 compatible API to interact with Cloudflare R2
 */
export const r2Client = new S3Client({
  region: "auto", // Cloudflare R2 标准区域，也支持空值或 us-east-1 作为别名
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: false, // R2 使用虚拟主机样式，与 AWS S3 兼容
});

// Bucket name
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ""; // Ensure environment variables have default values or handle undefined cases

// Public access URL prefix
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Ensure environment variables have default values or handle undefined cases

// Basic validation to ensure environment variables are set
if (
  !process.env.CLOUDFLARE_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME ||
  !R2_PUBLIC_URL
) {
  throw new Error(
    "Cloudflare R2 environment variables are not fully configured.",
  );
}
