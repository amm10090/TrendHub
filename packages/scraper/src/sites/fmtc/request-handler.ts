/**
 * FMTC 请求处理器
 */

import type { PlaywrightCrawlingContext, Log } from "crawlee";
import type {
  FMTCRequestHandlerOptions,
  FMTCUserData,
  FMTCMerchantData,
  FMTCProgressCallback,
} from "./types.js";
import { FMTCLoginHandler } from "./login-handler.js";
import { FMTCNavigationHandler } from "./navigation-handler.js";
import { FMTCSearchHandler } from "./search-handler.js";
import { FMTCResultsParser } from "./results-parser.js";
import { FMTCMerchantListHandler } from "./merchant-list-handler.js";
import { FMTCMerchantDetailHandler } from "./merchant-detail-handler.js";
import { FMTCAntiDetection } from "./anti-detection.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";
import { getRecaptchaConfig } from "./config.js";

/**
 * 创建 FMTC 请求处理器
 */
export function createFMTCRequestHandler(options: FMTCRequestHandlerOptions) {
  const {
    allScrapedMerchants,
    scraperOptions,
    progressCallback,
    antiDetectionConfig,
    maxRetries = 3,
    sessionManager,
  } = options;

  return async function requestHandler(
    context: PlaywrightCrawlingContext,
  ): Promise<void> {
    const { request, page, log } = context;
    const { label } = request;
    const userData = request.userData as FMTCUserData;

    // 创建处理器实例
    const recaptchaConfig = getRecaptchaConfig();
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      userData.executionId,
      recaptchaConfig,
    );
    const navigationHandler = new FMTCNavigationHandler(page, log);
    const searchHandler = new FMTCSearchHandler(page, log);
    const resultsParser = new FMTCResultsParser(page, log);
    const listHandler = new FMTCMerchantListHandler(
      page,
      log,
      userData.executionId,
    );
    const detailHandler = new FMTCMerchantDetailHandler(
      page,
      log,
      userData.executionId,
      scraperOptions.storageDir,
    );
    const antiDetection = new FMTCAntiDetection(
      page,
      log,
      antiDetectionConfig,
      userData.executionId,
    );

    try {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `处理请求: ${label}`,
        { url: request.url, label },
      );

      // 在登录请求中跳过反检测策略，避免干扰reCAPTCHA
      if (label !== "LOGIN") {
        await antiDetection.simulateRealUserBehavior();
      } else {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.DEBUG,
          "登录请求跳过反检测策略，避免干扰reCAPTCHA",
        );
      }

      // 根据标签分发请求
      switch (label) {
        case "LOGIN":
          await handleLogin(
            context,
            loginHandler,
            navigationHandler,
            userData,
            log,
            sessionManager
              ? {
                  saveSessionState: async (
                    context: PlaywrightCrawlingContext,
                    username?: string,
                  ) => {
                    await sessionManager.saveSessionState(context, username);
                  },
                  checkAuthenticationStatus: async (
                    page: PlaywrightCrawlingContext["page"],
                  ) => {
                    return await sessionManager.checkAuthenticationStatus(page);
                  },
                  cleanupSessionState: () => {
                    sessionManager.cleanupSessionState();
                  },
                }
              : undefined,
          );
          break;

        case "SEARCH":
          await handleSearch(
            context,
            searchHandler,
            resultsParser,
            userData,
            allScrapedMerchants,
            progressCallback,
            log,
            sessionManager
              ? {
                  saveSessionState: async (
                    context: PlaywrightCrawlingContext,
                    username?: string,
                  ) => {
                    await sessionManager.saveSessionState(context, username);
                  },
                  checkAuthenticationStatus: async (
                    page: PlaywrightCrawlingContext["page"],
                  ) => {
                    return await sessionManager.checkAuthenticationStatus(page);
                  },
                  cleanupSessionState: () => {
                    sessionManager.cleanupSessionState();
                  },
                }
              : undefined,
          );
          break;

        case "MERCHANT_LIST":
          await handleMerchantList(
            context,
            listHandler,
            detailHandler,
            userData,
            allScrapedMerchants,
            progressCallback,
            log,
          );
          break;

        case "MERCHANT_DETAIL":
          await handleMerchantDetail(
            context,
            detailHandler,
            userData,
            allScrapedMerchants,
            progressCallback,
            log,
          );
          break;

        case "IMAGE_DOWNLOAD":
          await handleImageDownload(context, detailHandler, userData, log);
          break;

        default:
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.WARN,
            `未知请求标签: ${label}`,
          );
      }
    } catch (error) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.ERROR,
        `请求处理失败: ${label}`,
        {
          url: request.url,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );

      // 检查是否需要重试
      if (request.retryCount < maxRetries) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `准备重试请求: ${label}`,
          { retryCount: request.retryCount },
        );

        // 增加延迟后重试
        await delay(Math.random() * 5000 + 5000);
        throw error; // 让 Crawlee 处理重试
      } else {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.ERROR,
          `请求失败，已达到最大重试次数: ${label}`,
        );
      }
    }
  };
}

/**
 * 处理登录请求
 */
async function handleLogin(
  context: PlaywrightCrawlingContext,
  loginHandler: FMTCLoginHandler,
  navigationHandler: FMTCNavigationHandler,
  userData: FMTCUserData,
  log: Log,
  sessionManager?: {
    saveSessionState: (context: unknown, username?: string) => Promise<void>;
    checkAuthenticationStatus: (page: unknown) => Promise<boolean>;
    cleanupSessionState: () => void;
  },
): Promise<void> {
  if (!userData.credentials) {
    throw new Error("登录凭据未提供");
  }

  // 如果有现有会话，先检查是否仍然有效
  if (userData.hasExistingSession && sessionManager) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      "检查现有会话状态",
    );

    try {
      const isValid = await sessionManager.checkAuthenticationStatus(
        context.page,
      );
      if (isValid) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          "现有会话有效，跳过登录步骤",
        );

        // 会话有效，直接导航到Directory页面
        const navigationResult = await navigationHandler.navigateToDirectory();
        if (navigationResult.success) {
          await context.addRequests([
            {
              url:
                navigationResult.currentUrl ||
                "https://account.fmtc.co/cp/program_directory",
              label: "SEARCH",
              userData: {
                ...userData,
                label: "SEARCH",
              },
            },
          ]);
        }
        return;
      } else {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.WARN,
          "现有会话已失效，清理会话状态",
        );
        sessionManager.cleanupSessionState();
      }
    } catch (error) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.ERROR,
        `会话状态检查失败: ${(error as Error).message}`,
      );
      sessionManager.cleanupSessionState();
    }
  }

  // 执行登录
  const loginResult = await loginHandler.login(userData.credentials);

  if (loginResult.success) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      "登录成功，导航到Directory页面",
    );

    // 保存会话状态
    if (sessionManager) {
      try {
        const browserContext = context.page.context();
        await sessionManager.saveSessionState(
          browserContext,
          userData.credentials?.username,
        );
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          "会话状态已保存",
        );
      } catch (error) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.WARN,
          `保存会话状态失败: ${(error as Error).message}`,
        );
      }
    }

    // 登录成功后，导航到Directory页面
    const navigationResult = await navigationHandler.navigateToDirectory();

    if (navigationResult.success) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        "成功导航到Directory页面，开始搜索",
      );

      // 导航成功后，执行搜索
      await context.addRequests([
        {
          url:
            navigationResult.currentUrl ||
            "https://account.fmtc.co/cp/program_directory",
          label: "SEARCH",
          userData: {
            ...userData,
            label: "SEARCH",
          },
        },
      ]);
    } else {
      throw new Error(`导航到Directory页面失败: ${navigationResult.error}`);
    }
  } else {
    throw new Error(`登录失败: ${loginResult.error}`);
  }
}

/**
 * 处理搜索请求
 */
async function handleSearch(
  context: PlaywrightCrawlingContext,
  searchHandler: FMTCSearchHandler,
  resultsParser: FMTCResultsParser,
  userData: FMTCUserData,
  allScrapedMerchants: FMTCMerchantData[],
  progressCallback?: FMTCProgressCallback,
  log?: Log,
  sessionManager?: {
    saveSessionState: (context: unknown, username?: string) => Promise<void>;
    checkAuthenticationStatus: (page: unknown) => Promise<boolean>;
    cleanupSessionState: () => void;
  },
): Promise<void> {
  // 如果有现有会话，先验证会话是否有效
  if (userData.hasExistingSession && sessionManager) {
    try {
      const isValid = await sessionManager.checkAuthenticationStatus(
        context.page,
      );
      if (!isValid) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.WARN,
          "会话已失效，需要重新登录",
        );

        // 清理旧会话并重定向到登录页
        sessionManager.cleanupSessionState();
        await context.addRequests([
          {
            url: "https://account.fmtc.co/cp/login",
            label: "LOGIN",
            userData: {
              ...userData,
              label: "LOGIN",
              hasExistingSession: false,
            },
          },
        ]);
        return;
      }

      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        "会话有效，继续执行搜索",
      );
    } catch (error) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.ERROR,
        `会话验证失败: ${(error as Error).message}`,
      );
      return;
    }
  }

  // 获取搜索参数
  const searchParams = searchHandler.getSearchParamsFromConfig();

  await logMessage(
    log,
    userData.executionId,
    LocalScraperLogLevel.INFO,
    "开始执行搜索",
    { searchParams },
  );

  // 执行搜索
  const searchResult = await searchHandler.performSearch(searchParams);

  if (searchResult.success) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `搜索成功，找到 ${searchResult.resultsCount} 个结果`,
      { resultsCount: searchResult.resultsCount },
    );

    // 解析搜索结果
    const parsedResults = await resultsParser.parseSearchResults();

    if (parsedResults.merchants.length > 0) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `成功解析 ${parsedResults.merchants.length} 个商户`,
      );

      // 处理解析出的商户数据
      for (const merchant of parsedResults.merchants) {
        // 检查是否已达到最大商家数量限制
        const maxMerchants = userData.options?.maxMerchants;
        const currentMerchantCount = allScrapedMerchants.length;

        if (maxMerchants && currentMerchantCount >= maxMerchants) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `已达到最大商家数量限制 (${maxMerchants})，停止处理`,
            { currentCount: currentMerchantCount, maxMerchants },
          );
          break;
        }

        try {
          // 转换为FMTCMerchantData格式
          const merchantData: FMTCMerchantData = {
            name: merchant.name,
            country: merchant.country,
            network: merchant.network,
            sourceUrl: merchant.detailUrl || context.request.url,
            fmtcId: merchant.id,
            rawData: {
              source: "search_results",
              dateAdded: merchant.dateAdded,
              status: merchant.status,
            },
          };

          // 如果有详情URL且启用详情抓取，将详情页加入队列
          if (merchant.detailUrl && userData.options?.includeDetails) {
            await context.addRequests([
              {
                url: merchant.detailUrl,
                label: "MERCHANT_DETAIL",
                userData: {
                  ...userData,
                  label: "MERCHANT_DETAIL",
                  merchantUrl: merchant.detailUrl,
                  merchantName: merchant.name,
                },
              },
            ]);
          } else {
            // 直接添加到结果中
            allScrapedMerchants.push(merchantData);

            if (progressCallback?.onMerchantProcessed) {
              progressCallback.onMerchantProcessed(merchantData);
            }
          }
        } catch (error) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.WARN,
            `处理商户失败: ${merchant.name}`,
            { error: (error as Error).message },
          );
        }
      }

      // 检查是否已达到最大商家数量限制
      const maxMerchants = userData.options?.maxMerchants;
      const currentMerchantCount = allScrapedMerchants.length;

      if (maxMerchants && currentMerchantCount >= maxMerchants) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `已达到最大商家数量限制 (${maxMerchants})，停止抓取`,
          { currentCount: currentMerchantCount, maxMerchants },
        );
        return;
      }

      // 处理分页
      if (parsedResults.hasNextPage) {
        // 检查分页限制
        const maxPages = userData.options?.maxPages;
        const currentPage = userData.pageNumber || 1;

        if (maxPages && currentPage >= maxPages) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `已达到最大页数限制 (${maxPages})，停止抓取`,
            { currentPage, maxPages },
          );
          return;
        }

        const success = await resultsParser.navigateToNextPage();

        if (success) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `成功导航到下一页 (${currentPage + 1})，继续解析`,
            { currentMerchantCount, maxMerchants },
          );

          // 添加下一页的搜索任务
          await context.addRequests([
            {
              url: context.request.url, // 保持当前URL
              label: "SEARCH",
              userData: {
                ...userData,
                pageNumber: currentPage + 1,
              },
            },
          ]);
        } else {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            "无法导航到下一页，搜索结束",
          );
        }
      }
    } else {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.WARN,
        "搜索结果解析失败，未找到商户数据",
      );
    }
  } else {
    throw new Error(`搜索失败: ${searchResult.error}`);
  }
}

/**
 * 处理商户列表请求
 */
async function handleMerchantList(
  context: PlaywrightCrawlingContext,
  listHandler: FMTCMerchantListHandler,
  detailHandler: FMTCMerchantDetailHandler,
  userData: FMTCUserData,
  allScrapedMerchants: FMTCMerchantData[],
  progressCallback?: FMTCProgressCallback,
  log?: Log,
): Promise<void> {
  const pageNumber = userData.pageNumber || 1;

  // 抓取当前页面的商户列表
  const listResult = await listHandler.scrapeMerchantList(pageNumber);

  if (listResult.merchants.length > 0) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `第 ${pageNumber} 页抓取到 ${listResult.merchants.length} 个商户`,
    );

    // 更新进度
    if (progressCallback?.onPageProgress) {
      progressCallback.onPageProgress({
        currentPage: pageNumber,
        totalPages: listResult.pagination.totalPages,
        merchantsProcessed: allScrapedMerchants.length,
        merchantsTotal: listResult.pagination.totalPages * 100, // 估算
      });
    }

    // 处理每个商户
    for (const merchant of listResult.merchants) {
      try {
        // 将基本信息添加到结果中
        const merchantData: FMTCMerchantData = {
          ...merchant,
          sourceUrl: context.request.url,
          rawData: { source: "merchant_list", pageNumber },
        };

        // 如果有详情链接且启用详情抓取，将详情页加入队列
        if (merchant.detailUrl && userData.options?.includeDetails) {
          await context.addRequests([
            {
              url: merchant.detailUrl,
              label: "MERCHANT_DETAIL",
              userData: {
                ...userData,
                label: "MERCHANT_DETAIL",
                merchantUrl: merchant.detailUrl,
                merchantName: merchant.name,
              },
            },
          ]);
        } else {
          // 直接添加到结果中（只有基本信息）
          allScrapedMerchants.push(merchantData);

          if (progressCallback?.onMerchantProcessed) {
            progressCallback.onMerchantProcessed(merchantData);
          }
        }
      } catch (error) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.WARN,
          `处理商户失败: ${merchant.name}`,
          {
            error: (error as Error).message,
          },
        );

        if (progressCallback?.onError) {
          progressCallback.onError(
            error as Error,
            `处理商户: ${merchant.name}`,
          );
        }
      }
    }

    // 检查是否需要抓取下一页
    const maxPages = userData.options?.maxPages || 10;
    if (listResult.pagination.hasNextPage && pageNumber < maxPages) {
      await context.addRequests([
        {
          url:
            listResult.pagination.nextPageUrl ||
            `https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0?page=${pageNumber + 1}`,
          label: "MERCHANT_LIST",
          userData: {
            ...userData,
            pageNumber: pageNumber + 1,
          },
        },
      ]);
    }
  }
}

/**
 * 处理商户详情请求
 */
async function handleMerchantDetail(
  context: PlaywrightCrawlingContext,
  detailHandler: FMTCMerchantDetailHandler,
  userData: FMTCUserData,
  allScrapedMerchants: FMTCMerchantData[],
  progressCallback?: FMTCProgressCallback,
  log?: Log,
): Promise<void> {
  if (!userData.merchantUrl) {
    throw new Error("商户详情URL未提供");
  }

  // 抓取商户详情
  const detailResult = await detailHandler.scrapeMerchantDetails(
    userData.merchantUrl,
    userData.merchantName,
  );

  if (detailResult.success) {
    // 查找对应的基本信息并合并
    const existingMerchantIndex = allScrapedMerchants.findIndex(
      (m) => m.name === userData.merchantName,
    );

    const completeData: FMTCMerchantData = {
      // 基本信息
      name: userData.merchantName || "",
      ...(existingMerchantIndex >= 0
        ? allScrapedMerchants[existingMerchantIndex]
        : {}),
      // 详情信息
      ...detailResult.merchantDetail,
      sourceUrl: userData.merchantUrl,
      rawData: {
        source: "merchant_detail",
        scrapedAt: detailResult.scrapedAt,
      },
    };

    if (existingMerchantIndex >= 0) {
      // 更新现有数据
      allScrapedMerchants[existingMerchantIndex] = completeData;
    } else {
      // 添加新数据
      allScrapedMerchants.push(completeData);
    }

    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `商户详情抓取完成: ${userData.merchantName}`,
      {
        fmtcId: detailResult.merchantDetail.fmtcId,
        networksCount: detailResult.merchantDetail.networks?.length || 0,
      },
    );

    if (progressCallback?.onMerchantProcessed) {
      progressCallback.onMerchantProcessed(completeData);
    }

    // 如果启用图片下载，将图片下载任务加入队列
    if (
      userData.options?.downloadImages &&
      (detailResult.merchantDetail.logo120x60 ||
        detailResult.merchantDetail.logo88x31 ||
        detailResult.merchantDetail.screenshot280x210 ||
        detailResult.merchantDetail.screenshot600x450)
    ) {
      await context.addRequests([
        {
          url: userData.merchantUrl, // 使用相同URL，但不同标签
          label: "IMAGE_DOWNLOAD",
          userData: {
            ...userData,
            label: "IMAGE_DOWNLOAD",
          },
        },
      ]);
    }
  } else {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.ERROR,
      `商户详情抓取失败: ${userData.merchantName}`,
      {
        error: detailResult.error,
      },
    );

    if (progressCallback?.onError) {
      progressCallback.onError(
        new Error(detailResult.error || "未知错误"),
        `抓取商户详情: ${userData.merchantName}`,
      );
    }
  }
}

/**
 * 处理图片下载请求
 */
async function handleImageDownload(
  context: PlaywrightCrawlingContext,
  detailHandler: FMTCMerchantDetailHandler,
  userData: FMTCUserData,
  log: Log,
): Promise<void> {
  if (!userData.merchantUrl || !userData.merchantName) {
    throw new Error("图片下载需要商户URL和名称");
  }

  try {
    // 重新抓取详情页面以获取图片
    const detailResult = await detailHandler.scrapeMerchantDetails(
      userData.merchantUrl,
      userData.merchantName,
    );

    if (detailResult.success) {
      // 下载图片
      const downloadedFiles = await detailHandler.downloadMerchantImages(
        detailResult.merchantDetail,
        userData.merchantName,
      );

      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `图片下载完成: ${userData.merchantName}`,
        {
          downloadedCount: downloadedFiles.length,
          files: downloadedFiles,
        },
      );
    }
  } catch (error) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.ERROR,
      `图片下载失败: ${userData.merchantName}`,
      {
        error: (error as Error).message,
      },
    );
  }
}

/**
 * 记录日志消息
 */
async function logMessage(
  log: Log | undefined,
  executionId: string | undefined,
  level: LocalScraperLogLevel,
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  if (log) {
    log.info(`[FMTC RequestHandler] ${message}`);
  }

  if (executionId) {
    await sendLogToBackend(
      executionId,
      level,
      `[FMTC RequestHandler] ${message}`,
      context,
    );
  }
}
