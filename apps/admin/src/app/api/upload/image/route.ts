import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { isValidImageType, uploadImageToR2 } from "@/lib/imageService";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    console.log("Image upload API called");

    const formData = await request.formData();
    console.log("FormData parsed successfully");

    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("No file provided in request");
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    console.log(
      `File received: ${file.name}, size: ${file.size}, type: ${file.type}`,
    );

    // Validate file type
    if (!isValidImageType(file.type)) {
      console.log(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        {
          error: `Invalid file type. Supported types: jpeg, png, gif, webp, svg.`,
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.log(
        `File size exceeds limit: ${file.size} > ${MAX_FILE_SIZE_BYTES}`,
      );
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.` },
        { status: 400 },
      );
    }

    console.log("Converting file to buffer...");
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`Buffer created, size: ${fileBuffer.length}`);

    console.log("Attempting to upload to R2...");
    const imageUrl = await uploadImageToR2(fileBuffer, file.name, file.type);
    console.log(`Upload successful, URL: ${imageUrl}`);

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Image upload error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";

    // Log the full error for debugging
    console.error("Full error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.name : "Unknown error type",
    });

    // Provide more detailed error information in development/debugging
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: errorMessage,
          details: error instanceof Error ? error.stack : "No stack trace",
        },
        { status: 500 },
      );
    }

    // For production, still provide some useful error info
    if (
      errorMessage === "Image upload failed." ||
      errorMessage.startsWith("Server configuration error")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to upload image.", details: errorMessage },
      { status: 500 },
    );
  }
}
