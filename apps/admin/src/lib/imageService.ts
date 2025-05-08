import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./r2";

/**
 * 验证文件类型是否为支持的图片类型
 * @param contentType MIME类型字符串
 * @returns 如果是有效的图片类型则返回 true，否则返回 false
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  return validTypes.includes(contentType.toLowerCase());
}

/**
 * 从文件名中提取并返回小写的文件扩展名
 * @param filename 文件名字符串
 * @returns 文件扩展名 (例如: 'jpg', 'png')，如果无法提取则默认为 'jpg'
 */
export function getExtensionFromFilename(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "jpg";
}

/**
 * 将图片文件上传到Cloudflare R2存储桶
 *
 * @param fileBuffer 包含图片数据的Buffer对象
 * @param originalFilename 原始文件名，用于提取文件扩展名
 * @param contentType 图片的MIME类型
 * @returns 上传成功后图片的公开访问URL
 * @throws 如果环境变量R2_BUCKET_NAME或R2_PUBLIC_URL未设置，则抛出错误
 * @throws 如果上传到R2失败，则抛出错误
 */
export async function uploadImageToR2(
  fileBuffer: Buffer,
  originalFilename: string,
  contentType: string,
): Promise<string> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    console.error(
      "Error: R2_BUCKET_NAME or R2_PUBLIC_URL is not defined in environment variables.",
    );
    throw new Error(
      "Server configuration error: R2 bucket or public URL not set.",
    );
  }

  const ext = getExtensionFromFilename(originalFilename);
  const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${ext}`;

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const key = `images/${year}/${month}/${uniqueFilename}`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read", // 确保存储桶本身允许公共读取
      }),
    );

    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  } catch (error) {
    console.error("Failed to upload image to R2:", error);
    throw new Error("Image upload failed.");
  }
}
