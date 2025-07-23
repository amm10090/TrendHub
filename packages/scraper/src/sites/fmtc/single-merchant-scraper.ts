/**
 * FMTC Single Merchant Scraper
 * 单个商户详情抓取服务，用于管理后台的单独商户数据同步
 */

import { Configuration, log as crawleeLog, LogLevel } from "crawlee";
import { PlaywrightCrawler } from "crawlee";
import { chromium } from "playwright";
import * as path from "path";
import cuid from "cuid";
import type { FMTCMerchantData } from "@repo/types";
import type { FMTCScraperOptions, FMTCAntiDetectionConfig } from "./types.js";
import { createFMTCRequestHandler } from "./request-handler.js";
import { createSessionManager, type SessionConfig } from "./session-manager.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  ensureDirectoryExists,
} from "../../utils.js";
import { type FMTCConfig } from "./config.js";

/**
 * 单商户抓取选项
 */
export interface SingleMerchantScrapingOptions {
  merchantUrl?: string; // 商户详情页URL
  merchantId?: string; // 商户ID（如果没有URL）
  merchantName?: string; // 商户名称（用于日志）
  credentials: {
    username: string;
    password: string;
  };
  downloadImages?: boolean;
  storageDir?: string;
  executionId?: string;
  config?: FMTCConfig;
}

/**
 * 单商户抓取结果
 */
export interface SingleMerchantScrapingResult {
  success: boolean;
  merchantData?: FMTCMerchantData;
  error?: string;
  logs?: string[];
  scrapedAt: Date;
  merchantUrl?: string;
  processingTime?: number;
}

/**
 * FMTC 单商户抓取器
 */
export class FMTCSingleMerchantScraper {
  private options: SingleMerchantScrapingOptions;
  private logs: string[] = [];
  private startTime: Date;

  constructor(options: SingleMerchantScrapingOptions) {
    this.options = options;
    this.startTime = new Date();

    // 单商户模式设置较高的日志级别，但保留INFO级别用于调试会话管理
    crawleeLog.setLevel(LogLevel.INFO);
  }

  /**
   * 执行单商户抓取
   */
  async scrapeSingleMerchant(): Promise<SingleMerchantScrapingResult> {
    const siteName = "FMTC";
    let merchantUrl = this.options.merchantUrl;

    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "开始单商户详情抓取", {
        merchantName: this.options.merchantName,
        merchantUrl: merchantUrl,
        merchantId: this.options.merchantId,
      });

      // 如果没有提供URL但有merchantId，构建URL
      if (!merchantUrl && this.options.merchantId) {
        merchantUrl = `https://account.fmtc.co/cp/program_directory/m/${this.options.merchantId}/`;
        await this.logMessage(LocalScraperLogLevel.INFO, "根据商户ID构建URL", {
          constructedUrl: merchantUrl,
        });
      }

      if (!merchantUrl) {
        throw new Error("必须提供商户URL或商户ID");
      }

      // 创建会话管理器
      const sessionConfig: Partial<SessionConfig> = {
        sessionFile: `fmtc-session-${this.options.credentials.username.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
        maxAge:
          this.options.config?.sessionMaxAge ??
          this.options.config?.sessionTimeout ??
          4 * 60 * 60 * 1000,
        autoSave: true,
        useDatabase: this.options.config?.useDatabase ?? true,
        fallbackToFile: this.options.config?.fallbackToFile ?? true,
      };

      const sessionManager = createSessionManager(crawleeLog, sessionConfig);

      // 添加调试信息
      await this.logMessage(LocalScraperLogLevel.INFO, "会话管理器配置", {
        sessionFile: sessionConfig.sessionFile,
        maxAge: sessionConfig.maxAge,
        useDatabase: sessionConfig.useDatabase,
        fallbackToFile: sessionConfig.fallbackToFile,
        workingDirectory: process.cwd(),
      });

      // 设置存储目录
      const baseStorageDir = path.resolve(
        process.cwd(),
        "scraper_storage_runs",
      );
      const executionId = this.options.executionId || cuid();
      const runSpecificStorageDir = path.join(
        baseStorageDir,
        siteName,
        "single_merchants",
        executionId,
      );

      await this.logMessage(
        LocalScraperLogLevel.INFO,
        `存储目录: ${runSpecificStorageDir}`,
      );

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

      if (this.options.downloadImages && this.options.storageDir) {
        ensureDirectoryExists(this.options.storageDir, crawleeLog);
      }

      process.env.CRAWLEE_STORAGE_DIR = runSpecificStorageDir;

      // 创建Crawlee配置
      const crawleeConfig = new Configuration({
        storageClientOptions: { storageDir: runSpecificStorageDir },
      });

      // 反检测配置
      const antiDetectionConfig: FMTCAntiDetectionConfig = {
        enableRandomDelay: this.options.config?.searchEnableRandomDelay ?? true,
        delayRange: {
          min: this.options.config?.searchMinDelay ?? 1000,
          max: this.options.config?.searchMaxDelay ?? 3000,
        },
        simulateMouseMovement:
          this.options.config?.searchEnableMouseMovement ?? true,
        simulateScrolling: true,
        detectAntiBot: true,
        retryAttempts: 3,
        sessionTimeout: this.options.config?.sessionTimeout ?? 30 * 60 * 1000,
      };

      // 准备单商户爬虫选项 - 模拟批量抓取的选项结构
      const scraperOptions: FMTCScraperOptions = {
        credentials: this.options.credentials,
        maxMerchants: 1, // 单商户抓取
        includeDetails: true,
        downloadImages: this.options.downloadImages || false,
        maxConcurrency: 1,
        requestDelay: 2000,
        headless: this.options.config?.headlessMode ?? false,
      };

      // 创建一个数组来存储单个商户的数据
      const allScrapedMerchants: FMTCMerchantData[] = [];

      // 创建爬虫 - 使用与批量抓取完全相同的requestHandler
      const crawler = new PlaywrightCrawler(
        {
          requestHandler: createFMTCRequestHandler({
            allScrapedMerchants,
            scraperOptions,
            progressCallback: {
              onPageProgress: () => {},
              onMerchantProcessed: (merchant) => {
                this.logMessage(
                  LocalScraperLogLevel.INFO,
                  `处理商户: ${merchant.name}`,
                );
              },
              onError: (error, context) => {
                this.logMessage(
                  LocalScraperLogLevel.ERROR,
                  `错误 - ${context}: ${error.message}`,
                );
              },
              onWarning: (warning, context) => {
                this.logMessage(
                  LocalScraperLogLevel.WARN,
                  `警告 - ${context}: ${warning}`,
                );
              },
            },
            antiDetectionConfig,
            maxRetries: 3,
            debugMode: this.options.config?.debugMode ?? false,
            sessionManager,
            fmtcConfig: this.options.config, // 传递完整的FMTC配置
          }),
          failedRequestHandler: async ({ request, log }) => {
            const errorMessage = `请求失败: ${request.url}`;
            log.error(errorMessage);
            await this.logMessage(LocalScraperLogLevel.ERROR, errorMessage, {
              error: request.errorMessages?.join("; "),
              retryCount: request.retryCount,
            });
          },
          launchContext: {
            launcher: chromium,
            launchOptions: {
              headless: this.options.config?.headlessMode ?? false,
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
          maxRequestsPerCrawl: 10, // 单商户抓取需要的请求：登录页、商户详情页等
          maxConcurrency: 1,
          minConcurrency: 1,
          autoscaledPoolOptions: {
            desiredConcurrency: 1,
            maxConcurrency: 1,
          },
          requestHandlerTimeoutSecs: 300, // 与批量抓取保持一致
          navigationTimeoutSecs: 120, // 与批量抓取保持一致
          maxRequestRetries: 3, // 与批量抓取保持一致
          // 单商户模式下减少日志噪声
          statisticsOptions: {
            logIntervalSecs: 60, // 每60秒输出一次统计信息
          },
          preNavigationHooks: [
            async (crawlingContext) => {
              const { page } = crawlingContext;

              // 与批量抓取保持一致的超时设置
              page.setDefaultTimeout(60000);
              page.setDefaultNavigationTimeout(60000);

              // 检查是否有保存的会话状态
              const savedSessionState =
                await sessionManager.loadSessionStateAsync(
                  this.options.credentials.username,
                );

              if (savedSessionState) {
                try {
                  // 使用与批量抓取相同的会话状态设置方式
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
                      if (
                        origin.localStorage &&
                        origin.localStorage.length > 0
                      ) {
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

                  await this.logMessage(
                    LocalScraperLogLevel.INFO,
                    "已通过优化的hooks加载会话状态",
                  );
                } catch (error) {
                  await this.logMessage(
                    LocalScraperLogLevel.WARN,
                    "加载会话状态失败",
                    { error: (error as Error).message },
                  );
                }
              }
            },
          ],
          useSessionPool: false,
        },
        crawleeConfig,
      );

      // 检查是否有保存的会话状态
      const savedSessionState = await sessionManager.loadSessionStateAsync(
        this.options.credentials.username,
      );

      if (savedSessionState) {
        await this.logMessage(
          LocalScraperLogLevel.INFO,
          "找到保存的会话状态，将跳过登录直接开始抓取",
        );
      } else {
        await this.logMessage(
          LocalScraperLogLevel.INFO,
          "未找到保存的会话，将执行登录流程",
        );
      }

      // 单商户模式：如果有有效会话，直接跳转到商户详情页面
      // 否则先登录，然后跳转到商户详情页面
      await this.logMessage(LocalScraperLogLevel.INFO, "准备构造初始请求", {
        hasSession: !!savedSessionState,
        targetUrl: merchantUrl,
      });

      const initialRequest = savedSessionState
        ? {
            url: merchantUrl,
            label: "MERCHANT_DETAIL",
            userData: {
              executionId: this.options.executionId,
              label: "MERCHANT_DETAIL",
              credentials: this.options.credentials,
              options: scraperOptions,
              hasExistingSession: true,
              fmtcConfig: this.options.config,
              // 单商户特定数据
              singleMerchantMode: true,
              targetMerchantUrl: merchantUrl,
              targetMerchantName: this.options.merchantName,
              // handleMerchantDetail 函数期望的字段
              merchantUrl: merchantUrl,
              merchantName: this.options.merchantName,
            },
          }
        : {
            url: "https://account.fmtc.co/cp/login",
            label: "LOGIN",
            userData: {
              executionId: this.options.executionId,
              label: "LOGIN",
              credentials: this.options.credentials,
              options: scraperOptions,
              hasExistingSession: false,
              fmtcConfig: this.options.config,
              // 单商户特定数据
              singleMerchantMode: true,
              targetMerchantUrl: merchantUrl,
              targetMerchantName: this.options.merchantName,
            },
          };

      // 执行抓取
      await this.logMessage(LocalScraperLogLevel.INFO, "开始执行爬虫", {
        requestLabel: initialRequest.label,
        requestUrl: initialRequest.url,
      });

      await crawler.run([initialRequest]);

      await this.logMessage(LocalScraperLogLevel.INFO, "爬虫执行完成");

      const processingTime = Date.now() - this.startTime.getTime();

      // 检查是否有抓取到的数据
      if (allScrapedMerchants.length > 0) {
        const scrapedMerchantData = allScrapedMerchants[0];

        await this.logMessage(LocalScraperLogLevel.INFO, "单商户抓取成功完成", {
          merchantName: scrapedMerchantData.name,
          processingTimeMs: processingTime,
        });

        return {
          success: true,
          merchantData: scrapedMerchantData,
          logs: this.logs,
          scrapedAt: new Date(),
          merchantUrl: merchantUrl,
          processingTime: processingTime,
        };
      } else {
        throw new Error("未能抓取到商户数据");
      }
    } catch (error) {
      const processingTime = Date.now() - this.startTime.getTime();
      const errorMessage = `单商户抓取失败: ${(error as Error).message}`;

      await this.logMessage(LocalScraperLogLevel.ERROR, errorMessage, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        processingTimeMs: processingTime,
      });

      return {
        success: false,
        error: errorMessage,
        logs: this.logs,
        scrapedAt: new Date(),
        merchantUrl: merchantUrl,
        processingTime: processingTime,
      };
    }
  }

  /**
   * 记录日志消息
   */
  private async logMessage(
    level: LocalScraperLogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const logEntry = `[${new Date().toISOString()}] ${level}: ${message}`;
    this.logs.push(logEntry);

    crawleeLog.info(`[FMTC SingleMerchant] ${message}`);

    if (this.options.executionId) {
      await sendLogToBackend(
        this.options.executionId,
        level,
        `[FMTC SingleMerchant] ${message}`,
        context,
      );
    }
  }
}

/**
 * 便捷函数：执行单商户抓取
 */
export async function scrapeSingleFMTCMerchant(
  options: SingleMerchantScrapingOptions,
): Promise<SingleMerchantScrapingResult> {
  const scraper = new FMTCSingleMerchantScraper(options);
  return await scraper.scrapeSingleMerchant();
}
