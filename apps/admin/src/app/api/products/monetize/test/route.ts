import { NextResponse, NextRequest } from "next/server";

import { monetizeUrl } from "@/lib/services/sovrn.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await monetizeUrl({
      url,
      utm_source: "test",
      utm_medium: "api_test",
      utm_campaign: "url_verification",
    });

    if (result.success) {
      const monetizedUrl = result.monetizedUrl!;

      // 解析生成的URL来检查编码是否正确
      const urlObj = new URL(monetizedUrl);
      const encodedOriginalUrl = urlObj.searchParams.get("u");

      // 检查是否存在双重编码
      const hasDoubleEncoding = encodedOriginalUrl?.includes("%25");

      // 尝试解码URL参数来验证
      let decodedUrl: string | null = null;

      try {
        if (encodedOriginalUrl) {
          decodedUrl = decodeURIComponent(encodedOriginalUrl);
        }
      } catch {
        return NextResponse.json(
          { error: "Failed to decode URL" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        input: {
          originalUrl: url,
        },
        output: {
          monetizedUrl,
          encodedUrlParameter: encodedOriginalUrl,
          decodedUrlParameter: decodedUrl,
          hasDoubleEncoding,
          isValid: !hasDoubleEncoding && decodedUrl === url,
        },
        validation: {
          passesDoubleEncodingCheck: !hasDoubleEncoding,
          decodesToOriginal: decodedUrl === url,
          overallValid: !hasDoubleEncoding && decodedUrl === url,
        },
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to generate monetization link" },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}
