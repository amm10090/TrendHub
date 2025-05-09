import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { isValidImageType, uploadImageToR2 } from "@/lib/imageService";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // 验证文件类型
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Supported types: jpeg, png, gif, webp, svg.`,
        },
        { status: 400 },
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.` },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const imageUrl = await uploadImageToR2(fileBuffer, file.name, file.type);

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";

    // 对客户端隐藏详细的服务器错误信息，除非是特定可预期的错误
    if (
      errorMessage === "Image upload failed." ||
      errorMessage.startsWith("Server configuration error")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
