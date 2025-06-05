import { S3Client } from "@aws-sdk/client-s3";

console.log("Initializing R2 client with environment variables:", {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "set" : "not set",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "set" : "not set",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "set" : "not set",
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? "set" : "not set",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ? "set" : "not set",
});

/**
 * Cloudflare R2 storage client configuration
 * Uses AWS S3 compatible API to interact with Cloudflare R2
 */
export const r2Client = new S3Client({
  region: "auto", // Cloudflare R2 uses auto as region
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

console.log(
  "R2 client initialized with endpoint:",
  `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
);

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
  console.error("Missing Cloudflare R2 environment variables:", {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "✓" : "✗",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✓" : "✗",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "✓" : "✗",
    R2_BUCKET_NAME: R2_BUCKET_NAME ? "✓" : "✗",
    R2_PUBLIC_URL: R2_PUBLIC_URL ? "✓" : "✗",
  });
  // In production environment, you might want to throw an error or take stricter measures
  // throw new Error("Cloudflare R2 environment variables are not fully configured.");
}
