import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./r2";

/**
 * Validate if file type is a supported image type
 * @param contentType MIME type string
 * @returns true if valid image type, false otherwise
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
 * Extract and return lowercase file extension from filename
 * @param filename filename string
 * @returns file extension (e.g.: 'jpg', 'png'), defaults to 'jpg' if cannot extract
 */
export function getExtensionFromFilename(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "jpg";
}

/**
 * Upload image file to Cloudflare R2 bucket
 *
 * @param fileBuffer Buffer object containing image data
 * @param originalFilename original filename for extracting file extension
 * @param contentType MIME type of the image
 * @returns public access URL of the uploaded image
 * @throws if R2_BUCKET_NAME or R2_PUBLIC_URL environment variables are not set
 * @throws if upload to R2 fails
 */
export async function uploadImageToR2(
  fileBuffer: Buffer,
  originalFilename: string,
  contentType: string,
): Promise<string> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    const error =
      "Server configuration error: R2 bucket or public URL not set.";

    throw new Error(error);
  }

  const ext = getExtensionFromFilename(originalFilename);
  const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${ext}`;

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const key = `images/${year}/${month}/${uniqueFilename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // 移除 ACL 参数，Cloudflare R2 不支持 AWS S3 的 ACL
    });

    await r2Client.send(command);

    const finalUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    return finalUrl;
  } catch {
    throw new Error("Image upload failed.");
  }
}
