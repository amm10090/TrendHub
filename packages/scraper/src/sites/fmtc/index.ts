/**
 * FMTC 爬虫主入口
 */

import {
  Configuration,
  log as crawleeLog,
  LogLevel,
  PlaywrightCrawler,
} from "crawlee";
import type { FMTCMerchantData } from "@repo/types";
import * as path from "path";
import type {
  FMTCAntiDetectionConfig,
  FMTCProgressCallback,
  FMTCScraperOptions,
  FMTCUserData,
} from "./types.js";
import { createFMTCRequestHandler } from "./request-handler.js";
import { chromium } from "playwright";
import {
  ensureDirectoryExists,
  LocalScraperLogLevel,
  sendLogToBackend,
} from "../../utils.js";
import { createSessionManager, type SessionConfig } from "./session-manager.js";
import { type FMTCConfig } from "./config.js";

/**
 * FMTC 爬虫主函数（支持配置参数）
 */
export async function scrapeFMTCWithConfig(
  options: FMTCScraperOptions,
  config?: FMTCConfig,
  executionId?: string,
): Promise<FMTCMerchantData[]> {
  const siteName = "FMTC";

  // 验证必需参数
  if (!options.credentials?.username || !options.credentials?.password) {
    throw new Error("FMTC 爬虫需要有效的登录凭据");
  }

  // 创建会话管理器
  const sessionConfig: Partial<SessionConfig> = {
    sessionFile: `fmtc-session-${options.credentials.username.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
    maxAge: config?.sessionTimeout ?? 4 * 60 * 60 * 1000, // 4小时或配置值
    autoSave: options.sessionConfig?.autoSave !== false, // 默认启用
  };

  const sessionManager = createSessionManager(crawleeLog, sessionConfig);

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 爬虫启动（使用配置参数）`,
      {
        options: {
          maxMerchants: options.maxMerchants,
          includeDetails: options.includeDetails,
          downloadImages: options.downloadImages,
          maxConcurrency: options.maxConcurrency,
        },
        credentials: {
          username: options.credentials.username,
          // 不记录密码
        },
        configProvided: !!config,
      },
    );
  }

  const allScrapedMerchants: FMTCMerchantData[] = [];
  // 正确估算所需请求数：搜索请求 + 商户详情请求 + 分页请求 + 缓冲
  const targetMerchants = options.maxMerchants || 500;
  const maxRequests = targetMerchants + 50; // 每个商户1个详情请求 + 50个缓冲请求用于搜索、分页等

  // 设置存储目录
  const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  // 存储目录信息只在调试模式下显示

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
  const crawleeConfig = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  // 进度回调 - 优化后减少噪声
  const progressCallback: FMTCProgressCallback = {
    onPageProgress: (progress) => {
      // 只在关键节点记录进度，减少噪声
      if (
        progress.currentPage % 5 === 0 ||
        progress.currentPage === progress.totalPages
      ) {
        crawleeLog.warning(
          `${siteName}: 进度 - 页面 ${progress.currentPage}/${progress.totalPages}, 商户 ${progress.merchantsProcessed}/${progress.merchantsTotal}`,
        );
      }
    },
    onMerchantProcessed: () => {
      // 不再记录每个商户的处理日志，减少噪声
    },
    onError: (error, context) => {
      crawleeLog.error(`${siteName}: 错误 - ${context}: ${error.message}`);
    },
    onWarning: (warning, context) => {
      crawleeLog.warning(`${siteName}: 警告 - ${context}: ${warning}`);
    },
  };

  // 检查是否有保存的会话状态
  const savedSessionState = sessionManager.loadSessionState(
    options.credentials.username,
  );

  // 反检测配置（使用配置参数或默认值）
  // 设置Crawlee日志级别为WARNING，减少噪声日志
  crawleeLog.setLevel(LogLevel.WARNING);

  const antiDetectionConfig: FMTCAntiDetectionConfig = {
    enableRandomDelay: config?.searchEnableRandomDelay ?? true,
    delayRange: {
      min: config?.searchMinDelay ?? 1000,
      max: config?.searchMaxDelay ?? 3000,
    },
    simulateMouseMovement: config?.searchEnableMouseMovement ?? true,
    simulateScrolling: true,
    detectAntiBot: true,
    retryAttempts: 3,
    sessionTimeout: config?.sessionTimeout ?? 30 * 60 * 1000, // 30分钟
  };

  // 创建爬虫 - 使用与测试文件相同的浏览器上下文创建方式
  const crawler = new PlaywrightCrawler(
    {
      requestHandler: createFMTCRequestHandler({
        allScrapedMerchants,
        scraperOptions: options,
        progressCallback,
        antiDetectionConfig,
        maxRetries: 3,
        debugMode: config?.debugMode ?? false,
        sessionManager,
        fmtcConfig: config, // 传递配置参数
        captureScreenshot: options.captureScreenshot,
        screenshotUploadCallback: options.screenshotUploadCallback,
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
        launcher: chromium,
        launchOptions: {
          headless: config?.headlessMode ?? false,
          slowMo: 500,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-blink-features=AutomationControlled",
          ],
        },
      },
      maxRequestsPerCrawl: maxRequests,
      maxConcurrency: options.maxConcurrency || 1,
      minConcurrency: 1,
      autoscaledPoolOptions: {
        desiredConcurrency: options.maxConcurrency || 1,
        maxConcurrency: options.maxConcurrency || 1,
      },
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      maxRequestRetries: 3,
      // 批量抓取模式下减少日志噪声
      statisticsOptions: {
        logIntervalSecs: 30, // 降低统计输出频率
      },
      preNavigationHooks: [
        async (crawlingContext) => {
          const { page } = crawlingContext;

          page.setDefaultTimeout(60000);
          page.setDefaultNavigationTimeout(60000);

          // 如果有保存的会话状态，直接设置到浏览器上下文
          if (savedSessionState) {
            try {
              // 使用与测试文件相同的方式设置会话状态
              await page.context().addInitScript(() => {
                // 这个脚本会在每个页面加载前执行
              });

              // 设置存储状态
              const storageState = savedSessionState as {
                cookies?: Array<{
                  name: string;
                  value: string;
                  domain: string;
                  path: string;
                  expires?: number;
                  httpOnly?: boolean;
                  secure?: boolean;
                  sameSite?: "Strict" | "Lax" | "None";
                }>;
                origins?: Array<{
                  origin: string;
                  localStorage?: Array<{ name: string; value: string }>;
                }>;
              };

              // 添加 cookies
              if (storageState.cookies && storageState.cookies.length > 0) {
                await page.context().addCookies(storageState.cookies);
              }

              // 设置 localStorage (改进版本)
              if (storageState.origins) {
                for (const origin of storageState.origins) {
                  if (origin.localStorage && origin.localStorage.length > 0) {
                    await page.addInitScript(
                      (originData) => {
                        if (window.location.origin === originData.origin) {
                          for (const item of originData.localStorage) {
                            try {
                              localStorage.setItem(item.name, item.value);
                            } catch (e) {
                              console.warn(
                                "Failed to set localStorage item:",
                                e,
                              );
                            }
                          }
                        }
                      },
                      {
                        origin: origin.origin,
                        localStorage: origin.localStorage,
                      },
                    );
                  }
                }
              }

              // 会话加载成功，静默处理
            } catch (error) {
              crawleeLog.warning(
                `${siteName}: 加载会话状态失败: ${(error as Error).message}`,
              );
            }
          }
        },
      ],
      useSessionPool: false,
    },
    crawleeConfig,
  );

  if (savedSessionState) {
    // 有保存的会话，静默处理
  } else {
    // 需要登录，静默处理
  }

  // 爬虫配置完成，静默开始抓取

  // 初始请求：始终从登录页面开始，确保会话状态正确
  const initialRequest = {
    url: "https://account.fmtc.co/cp/login",
    label: "LOGIN",
    userData: {
      executionId,
      label: "LOGIN",
      credentials: options.credentials,
      options: options,
      hasExistingSession: !!savedSessionState,
      fmtcConfig: config, // 传递配置参数
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

    crawleeLog.warning(`${siteName} 完成: ${allScrapedMerchants.length} 商户`);

    // 简化统计信息输出
    const stats = generateStatistics(allScrapedMerchants);
    crawleeLog.warning(
      `${siteName} 统计: ${stats.withNetworks} 有网络, ${stats.withHomepage} 有主页`,
    );

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
 * FMTC 爬虫主函数（环境变量版本，向后兼容）
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

  // 创建会话管理器
  const sessionConfig: Partial<SessionConfig> = {
    sessionFile: `fmtc-session-${options.credentials.username.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
    maxAge: 4 * 60 * 60 * 1000, // 4小时
    autoSave: options.sessionConfig?.autoSave !== false, // 默认启用
  };

  const sessionManager = createSessionManager(crawleeLog, sessionConfig);

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 爬虫启动`,
      {
        options: {
          maxMerchants: options.maxMerchants,
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
  // 正确估算所需请求数：搜索请求 + 商户详情请求 + 分页请求 + 缓冲
  const targetMerchants = options.maxMerchants || 500;
  const maxRequests = targetMerchants + 50; // 每个商户1个详情请求 + 50个缓冲请求用于搜索、分页等

  // 设置存储目录
  const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  // 存储目录信息只在调试模式下显示

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

  // 进度回调 - 优化后减少噪声
  const progressCallback: FMTCProgressCallback = {
    onPageProgress: (progress) => {
      // 只在关键节点记录进度，减少噪声
      if (
        progress.currentPage % 5 === 0 ||
        progress.currentPage === progress.totalPages
      ) {
        crawleeLog.warning(
          `${siteName}: 进度 - 页面 ${progress.currentPage}/${progress.totalPages}, 商户 ${progress.merchantsProcessed}/${progress.merchantsTotal}`,
        );
      }
    },
    onMerchantProcessed: () => {
      // 不再记录每个商户的处理日志，减少噪声
    },
    onError: (error, context) => {
      crawleeLog.error(`${siteName}: 错误 - ${context}: ${error.message}`);
    },
    onWarning: (warning, context) => {
      crawleeLog.warning(`${siteName}: 警告 - ${context}: ${warning}`);
    },
  };

  // 检查是否有保存的会话状态
  const savedSessionState = sessionManager.loadSessionState(
    options.credentials.username,
  );

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

  // 创建爬虫 - 使用与测试文件相同的浏览器上下文创建方式
  const crawler = new PlaywrightCrawler(
    {
      requestHandler: createFMTCRequestHandler({
        allScrapedMerchants,
        scraperOptions: options,
        progressCallback,
        antiDetectionConfig,
        maxRetries: 3,
        debugMode: process.env.NODE_ENV === "development",
        sessionManager,
        captureScreenshot: options.captureScreenshot,
        screenshotUploadCallback: options.screenshotUploadCallback,
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
        launcher: chromium, // 使用标准chromium，不是playwright-extra
        // 完全使用测试文件的浏览器启动配置
        launchOptions: {
          headless: false, // 与测试文件完全一致
          slowMo: 500, // 与测试文件完全一致
          // 只使用测试文件中的参数，不添加任何额外的
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security", // 测试文件有这个
            "--disable-features=VizDisplayCompositor", // 测试文件有这个
            "--disable-blink-features=AutomationControlled", // 测试文件有这个
          ],
          // 不设置任何额外的选项，保持原生Playwright行为
        },
      },
      maxRequestsPerCrawl: maxRequests,
      maxConcurrency: options.maxConcurrency || 1,
      minConcurrency: 1,
      autoscaledPoolOptions: {
        desiredConcurrency: options.maxConcurrency || 1,
        maxConcurrency: options.maxConcurrency || 1,
      },
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      maxRequestRetries: 3,
      // 批量抓取模式下减少日志噪声
      statisticsOptions: {
        logIntervalSecs: 30, // 降低统计输出频率
      },
      // 最小化preNavigationHooks，完全模拟测试文件
      preNavigationHooks: [
        async (crawlingContext) => {
          const { page } = crawlingContext;

          // 完全模拟测试文件的页面设置
          page.setDefaultTimeout(60000); // 与测试文件一致
          page.setDefaultNavigationTimeout(60000); // 与测试文件一致

          // 如果有保存的会话状态，直接设置到浏览器上下文
          if (savedSessionState) {
            try {
              // 使用与测试文件相同的方式设置会话状态
              await page.context().addInitScript(() => {
                // 这个脚本会在每个页面加载前执行
              });

              // 设置存储状态
              const storageState = savedSessionState as {
                cookies?: Array<{
                  name: string;
                  value: string;
                  domain: string;
                  path: string;
                  expires?: number;
                  httpOnly?: boolean;
                  secure?: boolean;
                  sameSite?: "Strict" | "Lax" | "None";
                }>;
                origins?: Array<{
                  origin: string;
                  localStorage?: Array<{ name: string; value: string }>;
                }>;
              };

              // 添加 cookies
              if (storageState.cookies && storageState.cookies.length > 0) {
                await page.context().addCookies(storageState.cookies);
              }

              // 设置 localStorage (改进版本)
              if (storageState.origins) {
                for (const origin of storageState.origins) {
                  if (origin.localStorage && origin.localStorage.length > 0) {
                    await page.addInitScript(
                      (originData) => {
                        if (window.location.origin === originData.origin) {
                          for (const item of originData.localStorage) {
                            try {
                              localStorage.setItem(item.name, item.value);
                            } catch (e) {
                              console.warn(
                                "Failed to set localStorage item:",
                                e,
                              );
                            }
                          }
                        }
                      },
                      {
                        origin: origin.origin,
                        localStorage: origin.localStorage,
                      },
                    );
                  }
                }
              }

              // 会话加载成功，静默处理
            } catch (error) {
              crawleeLog.warning(
                `${siteName}: 加载会话状态失败: ${(error as Error).message}`,
              );
            }
          }
        },
      ],
      // 禁用Crawlee的复杂功能，保持简单
      useSessionPool: false, // 禁用会话池，使用我们自己的会话管理
    },
    config,
  );

  if (savedSessionState) {
    // 有保存的会话，静默处理
  } else {
    // 需要登录，静默处理
  }

  // 爬虫配置完成，静默开始抓取

  // 初始请求：始终从登录页面开始，确保会话状态正确
  const initialRequest = {
    url: "https://account.fmtc.co/cp/login",
    label: "LOGIN",
    userData: {
      executionId,
      label: "LOGIN",
      credentials: options.credentials,
      options: options,
      hasExistingSession: !!savedSessionState,
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

    crawleeLog.warning(`${siteName} 完成: ${allScrapedMerchants.length} 商户`);

    // 简化统计信息输出
    const stats = generateStatistics(allScrapedMerchants);
    crawleeLog.warning(
      `${siteName} 统计: ${stats.withNetworks} 有网络, ${stats.withHomepage} 有主页`,
    );

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

  if (
    options.maxMerchants &&
    (options.maxMerchants < 1 || options.maxMerchants > 10000)
  ) {
    throw new Error("最大商家数量必须在 1-10000 之间");
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
    maxMerchants: 500,
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
export {
  type FMTCConfig,
  getConfigFromParams,
  getRecaptchaConfigFromParams,
  getSearchConfigFromParams,
} from "./config.js";
export {
  FMTCSingleMerchantScraper,
  scrapeSingleFMTCMerchant,
  type SingleMerchantScrapingOptions,
  type SingleMerchantScrapingResult,
} from "./single-merchant-scraper.js";
export {
  FMTCBatchMerchantScraper,
  executeBatchMerchantScraping,
  type BatchScrapingOptions,
  type BatchScrapingResult,
  type BatchProgress,
  type MerchantTask,
  BatchTaskStatus,
} from "./batch-merchant-scraper.js";

// 导出新的配置支持的爬虫函数已在上面直接导出
