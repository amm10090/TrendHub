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
  console.log("uploadImageToR2 called with:", {
    bufferSize: fileBuffer.length,
    originalFilename,
    contentType,
    bucketName: R2_BUCKET_NAME,
    publicUrl: R2_PUBLIC_URL,
  });

  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    const error =
      "Server configuration error: R2 bucket or public URL not set.";
    console.error(error, {
      bucketName: R2_BUCKET_NAME,
      publicUrl: R2_PUBLIC_URL,
      env: {
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
          ? "set"
          : "not set",
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "set" : "not set",
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
          ? "set"
          : "not set",
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? "set" : "not set",
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ? "set" : "not set",
      },
    });
    throw new Error(error);
  }

  const ext = getExtensionFromFilename(originalFilename);
  const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${ext}`;

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const key = `images/${year}/${month}/${uniqueFilename}`;

  console.log("Preparing upload with key:", key);

  try {
    console.log("Sending PutObjectCommand to R2...");

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: "public-read", // Make sure the bucket itself allows public read
    });

    console.log("Command created:", {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      BodySize: fileBuffer.length,
    });

    await r2Client.send(command);
    console.log("Upload successful to R2");

    const finalUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    console.log("Generated final URL:", finalUrl);

    return finalUrl;
  } catch (error) {
    console.error("R2 upload failed:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    throw new Error("Image upload failed.");
  }
}
