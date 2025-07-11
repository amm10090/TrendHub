/**
 * FMTC 爬虫主入口
 */

import { Configuration, log as crawleeLog } from "crawlee";
import type { FMTCMerchantData } from "@repo/types";
import * as path from "path";
import type {
  FMTCScraperOptions,
  FMTCUserData,
  FMTCProgressCallback,
  FMTCAntiDetectionConfig,
} from "./types.js";
import { createFMTCRequestHandler } from "./request-handler.js";
import { createStealthCrawler } from "../../crawler-setup.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  ensureDirectoryExists,
} from "../../utils.js";

/**
 * FMTC 爬虫主函数
 */
export default async function scrapeFMTC(
  options: FMTCScraperOptions,
  executionId?: string,
): Promise<FMTCMerchantData[]> {
  const siteName = "FMTC";

  // 验证必需参数
  if (!options.credentials?.username || !options.credentials?.password) {
    throw new Error("FMTC 爬虫需要有效的登录凭据");
  }

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 爬虫启动`,
      {
        options: {
          maxPages: options.maxPages,
          includeDetails: options.includeDetails,
          downloadImages: options.downloadImages,
          maxConcurrency: options.maxConcurrency,
        },
        credentials: {
          username: options.credentials.username,
          // 不记录密码
        },
      },
    );
  }

  const allScrapedMerchants: FMTCMerchantData[] = [];
  const maxRequests = (options.maxPages || 10) * 10; // 估算请求数

  // 设置存储目录
  const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  crawleeLog.info(`${siteName}: 存储目录设置为: ${runSpecificStorageDir}`);

  // 创建必需的目录
  ensureDirectoryExists(
    path.join(runSpecificStorageDir, "request_queues", "default"),
    crawleeLog,
  );
  ensureDirectoryExists(
    path.join(runSpecificStorageDir, "datasets", "default"),
    crawleeLog,
  );
  ensureDirectoryExists(
    path.join(runSpecificStorageDir, "key_value_stores", "default"),
    crawleeLog,
  );

  if (options.downloadImages && options.storageDir) {
    ensureDirectoryExists(options.storageDir, crawleeLog);
  }

  process.env.CRAWLEE_STORAGE_DIR = runSpecificStorageDir;

  // 创建 Crawlee 配置
  const config = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  // 进度回调
  const progressCallback: FMTCProgressCallback = {
    onPageProgress: (progress) => {
      crawleeLog.info(
        `${siteName}: 页面进度 ${progress.currentPage}/${progress.totalPages}, 商户 ${progress.merchantsProcessed}/${progress.merchantsTotal}`,
      );
    },
    onMerchantProcessed: (merchant) => {
      crawleeLog.debug(`${siteName}: 处理商户 "${merchant.name}"`);
    },
    onError: (error, context) => {
      crawleeLog.error(`${siteName}: 错误 - ${context}: ${error.message}`);
    },
    onWarning: (warning, context) => {
      crawleeLog.warning(`${siteName}: 警告 - ${context}: ${warning}`);
    },
  };

  // 反检测配置
  const antiDetectionConfig: FMTCAntiDetectionConfig = {
    enableRandomDelay: true,
    delayRange: {
      min: options.requestDelay || 2000,
      max: (options.requestDelay || 2000) * 2,
    },
    simulateMouseMovement: true,
    simulateScrolling: true,
    detectAntiBot: true,
    retryAttempts: 3,
    sessionTimeout: 30 * 60 * 1000, // 30分钟
  };

  // 创建爬虫
  const crawler = createStealthCrawler(
    {
      requestHandler: createFMTCRequestHandler({
        allScrapedMerchants,
        scraperOptions: options,
        progressCallback,
        antiDetectionConfig,
        maxRetries: 3,
        debugMode: process.env.NODE_ENV === "development",
      }),
      failedRequestHandler: async ({ request, log }) => {
        log.error(`${siteName}: 请求失败 ${request.url}`);

        const currentExecutionId = (request.userData as FMTCUserData)
          ?.executionId;
        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.ERROR,
            `请求失败: ${request.url}`,
            {
              error: request.errorMessages?.join("; "),
              retryCount: request.retryCount,
            },
          );
        }
      },
      launchContext: {
        launchOptions: {
          headless: options.headless !== false, // 默认使用无头模式
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
          ],
        },
      },
      maxRequestsPerCrawl: maxRequests,
      maxConcurrency: options.maxConcurrency || 1,
      minConcurrency: 1,
      autoscaledPoolOptions: {
        desiredConcurrency: 1,
        maxConcurrency: options.maxConcurrency || 1,
      },
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      maxRequestRetries: 3,
    },
    config,
  );

  crawleeLog.info(`${siteName}: 反检测爬虫设置完成，开始抓取...`);

  // 初始请求：登录页面
  const initialRequest = {
    url: "https://account.fmtc.co/cp/login",
    label: "LOGIN" as const,
    userData: {
      executionId,
      label: "LOGIN" as const,
      credentials: options.credentials,
      options: options,
    } as FMTCUserData,
  };

  try {
    // 启动爬虫
    await crawler.run([initialRequest]);

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `${siteName} 爬虫完成，总共收集 ${allScrapedMerchants.length} 个商户`,
        {
          totalMerchants: allScrapedMerchants.length,
          withDetails: allScrapedMerchants.filter((m) => m.homepage || m.fmtcId)
            .length,
          withNetworks: allScrapedMerchants.filter(
            (m) => m.networks && m.networks.length > 0,
          ).length,
        },
      );
    }

    crawleeLog.info(
      `${siteName} 爬虫完成，总共收集 ${allScrapedMerchants.length} 个商户`,
    );

    // 打印统计信息
    const stats = generateStatistics(allScrapedMerchants);
    crawleeLog.info(`${siteName} 统计信息:`, stats);

    return allScrapedMerchants;
  } catch (error) {
    const errorMessage = `${siteName} 爬虫执行失败: ${(error as Error).message}`;

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        errorMessage,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
          partialResults: allScrapedMerchants.length,
        },
      );
    }

    crawleeLog.error(errorMessage);
    throw error;
  }
}

/**
 * 统计信息类型
 */
interface FMTCStatistics {
  totalMerchants: number;
  withHomepage: number;
  withFMTCId: number;
  withNetworks: number;
  withLogos: number;
  withScreenshots: number;
  byCountry: Record<string, number>;
  byNetwork: Record<string, number>;
  byCategory: Record<string, number>;
}

/**
 * 生成抓取统计信息
 */
function generateStatistics(merchants: FMTCMerchantData[]): FMTCStatistics {
  const stats: FMTCStatistics = {
    totalMerchants: merchants.length,
    withHomepage: merchants.filter((m) => m.homepage).length,
    withFMTCId: merchants.filter((m) => m.fmtcId).length,
    withNetworks: merchants.filter((m) => m.networks && m.networks.length > 0)
      .length,
    withLogos: merchants.filter((m) => m.logo120x60 || m.logo88x31).length,
    withScreenshots: merchants.filter(
      (m) => m.screenshot280x210 || m.screenshot600x450,
    ).length,

    // 按国家分组
    byCountry: {} as Record<string, number>,
    // 按网络分组
    byNetwork: {} as Record<string, number>,
    // 按分类分组
    byCategory: {} as Record<string, number>,
  };

  // 统计国家分布
  merchants.forEach((merchant) => {
    if (merchant.country) {
      stats.byCountry[merchant.country] =
        (stats.byCountry[merchant.country] || 0) + 1;
    }
  });

  // 统计网络分布
  merchants.forEach((merchant) => {
    if (merchant.network) {
      stats.byNetwork[merchant.network] =
        (stats.byNetwork[merchant.network] || 0) + 1;
    }
  });

  // 统计分类分布
  merchants.forEach((merchant) => {
    if (merchant.primaryCategory) {
      stats.byCategory[merchant.primaryCategory] =
        (stats.byCategory[merchant.primaryCategory] || 0) + 1;
    }
  });

  return stats;
}

/**
 * 验证 FMTC 爬虫选项
 */
export function validateFMTCOptions(options: FMTCScraperOptions): void {
  if (!options.credentials) {
    throw new Error("FMTC 爬虫需要登录凭据");
  }

  if (!options.credentials.username || !options.credentials.password) {
    throw new Error("FMTC 登录凭据必须包含用户名和密码");
  }

  if (options.maxPages && (options.maxPages < 1 || options.maxPages > 100)) {
    throw new Error("最大页数必须在 1-100 之间");
  }

  if (
    options.maxConcurrency &&
    (options.maxConcurrency < 1 || options.maxConcurrency > 5)
  ) {
    throw new Error("最大并发数必须在 1-5 之间");
  }

  if (options.requestDelay && options.requestDelay < 500) {
    throw new Error("请求延迟不能少于 500 毫秒");
  }
}

/**
 * 创建默认 FMTC 爬虫选项
 */
export function createDefaultFMTCOptions(credentials: {
  username: string;
  password: string;
}): FMTCScraperOptions {
  return {
    credentials,
    maxPages: 10,
    includeDetails: true,
    downloadImages: false,
    maxConcurrency: 1,
    requestDelay: 2000,
    headless: true,
  };
}

// 导出类型和处理器 (用于测试或高级用法)
export * from "./types.js";
export { FMTCLoginHandler } from "./login-handler.js";
export { FMTCNavigationHandler } from "./navigation-handler.js";
export { FMTCSearchHandler } from "./search-handler.js";
export { FMTCResultsParser } from "./results-parser.js";
export { FMTCMerchantListHandler } from "./merchant-list-handler.js";
export { FMTCMerchantDetailHandler } from "./merchant-detail-handler.js";
export { FMTCAntiDetection } from "./anti-detection.js";
export { createFMTCRequestHandler } from "./request-handler.js";
export { FMTC_SELECTORS, FMTC_URL_PATTERNS } from "./selectors.js";
