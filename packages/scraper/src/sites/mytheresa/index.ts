// packages/scraper/src/sites/mytheresa/index.ts
import type { Product } from "@repo/types";
import type { ScraperOptions } from "../../main.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  minimalLog,
  normalLog,
  verboseLog,
} from "../../utils.js";
// 导入简化抓取器
import scrapeMytheresaSimple from "./simple-scraper.js";

// Helper function to infer gender from URL, specific to Mytheresa's URL structure
export function inferGenderFromMytheresaUrl(
  url: string,
): "women" | "men" | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/women/")) return "women";
  if (urlLower.includes("/men/")) return "men";
  return null;
}

export default async function scrapeMytheresa(
  startUrls: string | string[] = [
    "https://www.mytheresa.com/us/en/women/new-arrivals/current-week",
  ],
  options: ScraperOptions = {},
  executionId?: string,
): Promise<Product[]> {
  const siteName = "Mytheresa";

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 简化抓取器启动 - 基于测试脚本成功模式`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
        mode: "simplified_single_session",
      },
    );
  }

  normalLog(`🚀 启动 ${siteName} 简化抓取器（基于测试脚本成功模式）`);

  // 直接使用简化抓取器
  const products = await scrapeMytheresaSimple(startUrls, options, executionId);

  verboseLog(
    `🔍 抓取器返回数据: ${JSON.stringify(
      {
        productsCount: products.length,
        firstProductSample: products[0]
          ? {
              name: products[0].name,
              brand: products[0].brand,
              url: products[0].url,
              source: products[0].source,
            }
          : null,
      },
      null,
      2,
    )}`,
  );

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 简化抓取器完成. 总计获取商品: ${products.length}`,
      {
        totalProducts: products.length,
        mode: "simplified_single_session",
      },
    );
  }

  minimalLog(
    `🎉 ${siteName} 简化抓取器完成! 总计获取 ${products.length} 个商品`,
  );

  return products;
}
