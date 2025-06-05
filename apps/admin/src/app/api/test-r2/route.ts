import { NextResponse } from "next/server";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

export async function GET() {
  try {
    console.log("Testing R2 connection...");

    // Test 1: Check environment variables
    const envCheck = {
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "✓" : "✗",
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✓" : "✗",
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "✓" : "✗",
      R2_BUCKET_NAME: R2_BUCKET_NAME ? "✓" : "✗",
      R2_PUBLIC_URL: R2_PUBLIC_URL ? "✓" : "✗",
    };

    console.log("Environment variables check:", envCheck);

    if (!R2_BUCKET_NAME) {
      return NextResponse.json(
        {
          success: false,
          error: "R2_BUCKET_NAME not configured",
          envCheck,
        },
        { status: 500 },
      );
    }

    // Test 2: List objects in bucket (basic connectivity test)
    console.log("Testing bucket list operation...");

    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1,
    });

    const listResult = await r2Client.send(listCommand);
    console.log("List operation successful:", {
      bucketExists: true,
      objectCount: listResult.KeyCount,
    });

    // Test 3: Try to upload a small test file
    console.log("Testing file upload...");

    const testContent = "R2 connection test";
    const testKey = `test/connection-test-${Date.now()}.txt`;

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: "text/plain",
    });

    await r2Client.send(putCommand);
    console.log("Upload test successful");

    const testUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${testKey}`;

    return NextResponse.json({
      success: true,
      message: "R2 connection test successful",
      details: {
        envCheck,
        bucketName: R2_BUCKET_NAME,
        testFileUrl: testUrl,
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
    });
  } catch (error) {
    console.error("R2 connection test failed:", error);

    const errorDetails = {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      code: (error as { code?: string })?.code || "No error code",
      statusCode:
        (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode || "No status code",
    };

    console.error("Detailed error info:", errorDetails);

    return NextResponse.json(
      {
        success: false,
        error: "R2 connection test failed",
        details: errorDetails,
        envCheck: {
          CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "✓" : "✗",
          R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✓" : "✗",
          R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "✓" : "✗",
          R2_BUCKET_NAME: R2_BUCKET_NAME ? "✓" : "✗",
          R2_PUBLIC_URL: R2_PUBLIC_URL ? "✓" : "✗",
        },
      },
      { status: 500 },
    );
  }
}
