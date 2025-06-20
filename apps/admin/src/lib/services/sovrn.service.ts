/**
 * Sovrn Commerce API Service
 * 用于将商品URL转化为货币化URL
 */

import { db } from "@/lib/db";

interface SovrnUrlParams {
  url: string;
  cuid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  opt?: boolean;
  fbu?: string;
  bf?: number;
}

interface MonetizedUrlResult {
  success: boolean;
  monetizedUrl?: string;
  error?: string;
}

/**
 * 从数据库获取Sovrn API Key
 * @returns API Key 或 null
 * @internal 仅服务器端使用
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

/**
 * 将商品URL转化为Sovrn货币化URL
 * @param params Sovrn API参数
 * @returns 货币化URL结果
 */
export async function monetizeUrl(
  params: SovrnUrlParams,
): Promise<MonetizedUrlResult> {
  try {
    // 从数据库获取API key
    const apiKey = await getSovrnApiKey();

    if (!apiKey) {
      throw new Error(
        "SOVRN API Key not configured. Please set it in the system settings.",
      );
    }

    // 构建查询参数 - URLSearchParams会自动处理URL编码，无需手动编码
    const queryParams = new URLSearchParams({
      key: apiKey,
      u: params.url, // 直接传入原始URL，让URLSearchParams处理编码
    });

    // 添加可选参数
    if (params.cuid) queryParams.append("cuid", params.cuid);
    if (params.utm_source) queryParams.append("utm_source", params.utm_source);
    if (params.utm_medium) queryParams.append("utm_medium", params.utm_medium);
    if (params.utm_campaign)
      queryParams.append("utm_campaign", params.utm_campaign);
    if (params.utm_term) queryParams.append("utm_term", params.utm_term);
    if (params.utm_content)
      queryParams.append("utm_content", params.utm_content);
    if (params.opt !== undefined)
      queryParams.append("opt", params.opt.toString());
    if (params.fbu) queryParams.append("fbu", params.fbu);
    if (params.bf !== undefined) queryParams.append("bf", params.bf.toString());

    // 构建完整的API URL
    const apiUrl = `https://redirect.viglink.com?${queryParams.toString()}`;

    // 对于Sovrn API，我们直接返回构建的URL，因为它是一个重定向服务
    // 实际的货币化URL就是我们构建的这个URL
    return {
      success: true,
      monetizedUrl: apiUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 批量处理URL货币化
 * @param urls 商品URL数组
 * @param defaultParams 默认参数
 * @returns 货币化结果映射
 */
export async function monetizeUrlsBatch(
  urls: string[],
  defaultParams?: Omit<SovrnUrlParams, "url">,
): Promise<Map<string, MonetizedUrlResult>> {
  const results = new Map<string, MonetizedUrlResult>();

  // 批量处理，避免过多并发请求
  const batchSize = 10;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map((url) =>
      monetizeUrl({ ...defaultParams, url }).then((result) => ({
        url,
        result,
      })),
    );

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach(({ url, result }) => {
      results.set(url, result);
    });

    // 添加小延迟避免rate limiting
    if (i + batchSize < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
