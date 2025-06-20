import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";

/**
 * 从数据库获取Sovrn API Key (内部函数)
 */
async function getSovrnApiKey(): Promise<string | null> {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "sovrnApiKey" },
    });

    if (setting && setting.value) {
      return setting.value;
    }

    // 如果数据库中没有配置，回退到环境变量
    const envApiKey = process.env.SOVRN_API_KEY;

    if (envApiKey) {
      return envApiKey;
    }

    return null;
  } catch {
    // 出错时回退到环境变量
    const envApiKey = process.env.SOVRN_API_KEY;

    if (envApiKey) {
      return envApiKey;
    }

    return null;
  }
}

export async function GET() {
  try {
    const apiKey = await getSovrnApiKey();

    return NextResponse.json({
      success: true,
      hasApiKey: Boolean(apiKey),
      keyPreview: apiKey
        ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
        : null,
      message: apiKey ? "API Key 已配置" : "API Key 未配置",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hasApiKey: false,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testUrl = "https://www.example.com/test-product" } = body;

    const apiKey = await getSovrnApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API Key 未配置",
          hasApiKey: false,
        },
        { status: 400 },
      );
    }

    // 测试用URL参数编码
    const queryParams = new URLSearchParams({
      key: apiKey,
      u: testUrl,
      utm_source: "test",
      utm_medium: "api_test",
      utm_campaign: "configuration_test",
    });

    const testMonetizedUrl = `https://redirect.viglink.com?${queryParams.toString()}`;

    // 解析URL来验证格式
    const urlObj = new URL(testMonetizedUrl);
    const encodedTestUrl = urlObj.searchParams.get("u");

    // 检查是否存在双重编码
    const hasDoubleEncoding = encodedTestUrl?.includes("%25");

    // 尝试解码URL参数来验证
    let decodedUrl: string | null = null;

    try {
      if (encodedTestUrl) {
        decodedUrl = decodeURIComponent(encodedTestUrl);
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to decode test URL",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      test: {
        inputUrl: testUrl,
        monetizedUrl: testMonetizedUrl,
        encodedUrlParameter: encodedTestUrl,
        decodedUrlParameter: decodedUrl,
        hasDoubleEncoding,
        isValid: !hasDoubleEncoding && decodedUrl === testUrl,
      },
      validation: {
        apiKeyConfigured: true,
        urlEncodingCorrect: !hasDoubleEncoding,
        decodesToOriginal: decodedUrl === testUrl,
        overallValid: !hasDoubleEncoding && decodedUrl === testUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
