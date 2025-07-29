import type { ECommerceSite as ECommerceSiteType } from "@repo/types"; // Import the type
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// Define the enum values for Zod validation based on the ECommerceSite type
const ECommerceSiteEnumValues: [ECommerceSiteType, ...ECommerceSiteType[]] = [
  "Mytheresa",
  "Italist",
  "Yoox",
  "Farfetch",
  "Cettire",
  "Unknown",
];

const BatchExistsSchema = z.object({
  urls: z
    .array(z.string().url({ message: "URL列表中包含无效的URL" }))
    .min(1, { message: "URL列表不能为空" }),
  source: z.enum(ECommerceSiteEnumValues, {
    errorMap: () => ({ message: "无效的电商网站来源" }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = BatchExistsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "无效的请求数据",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // validationResult.data is guaranteed to have 'urls' and 'source' here due to successful parsing
    // and the schema defining them as required.
    const { urls, source } = validationResult.data;

    if (urls.length === 0) {
      // Check length after confirming urls is an array
      return NextResponse.json({ existingUrls: [] });
    }

    const products = await db.product.findMany({
      where: {
        url: {
          in: urls,
        },
        source: source, // Prisma expects 'source' to be a string, z.enum provides a string literal union
      },
      select: {
        url: true,
      },
    });

    const existingUrls = products.map((p) => p.url);

    return NextResponse.json({ existingUrls });
  } catch {
    const errorMessage =
      error instanceof Error ? error.message : "检查URL是否存在时发生未知错误";

    return NextResponse.json(
      { error: "批量检查URL失败", details: errorMessage },
      { status: 500 },
    );
  }
}
