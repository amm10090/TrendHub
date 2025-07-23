/**
 * FMTC 请求处理器
 */

import type { PlaywrightCrawlingContext, Log } from "crawlee";
import type { BrowserContext } from "playwright";
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
import { getRecaptchaConfig, getRecaptchaConfigFromParams } from "./config.js";

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
    // 优先使用传递的配置参数，如果没有则使用环境变量
    const recaptchaConfig = userData.fmtcConfig
      ? getRecaptchaConfigFromParams(userData.fmtcConfig)
      : getRecaptchaConfig();
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      userData.executionId,
      recaptchaConfig,
    );
    const navigationHandler = new FMTCNavigationHandler(page, log);
    const searchHandler = new FMTCSearchHandler(page, log, userData.fmtcConfig);
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
      {
        captureScreenshot: options.captureScreenshot,
        screenshotUploadCallback: options.screenshotUploadCallback,
      },
    );
    // 设置用户数据上下文，用于单商户模式日志优化
    detailHandler.setUserData(userData);
    const antiDetection = new FMTCAntiDetection(
      page,
      log,
      antiDetectionConfig,
      userData.executionId,
    );
    // 设置用户数据上下文，用于单商户模式日志优化
    antiDetection.setUserData(userData);

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
                    context: unknown,
                    username?: string,
                  ) => {
                    try {
                      // 修复：检查是否是 BrowserContext 类型
                      if (
                        context &&
                        typeof context === "object" &&
                        "storageState" in context
                      ) {
                        const result = await sessionManager.saveSessionState(
                          context as BrowserContext,
                          username,
                        );
                        await logMessage(
                          log,
                          userData.executionId,
                          LocalScraperLogLevel.INFO,
                          "[包装函数] 会话状态已保存",
                        );
                        return result;
                      } else {
                        throw new Error("无效的浏览器上下文对象");
                      }
                    } catch (error) {
                      await logMessage(
                        log,
                        userData.executionId,
                        LocalScraperLogLevel.WARN,
                        `[包装函数] 会话保存失败: ${(error as Error).message}`,
                      );
                      return false;
                    }
                  },
                  checkAuthenticationStatus: async (page: unknown) => {
                    return await sessionManager.checkAuthenticationStatus(
                      page as PlaywrightCrawlingContext["page"],
                    );
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
                    context: unknown,
                    username?: string,
                  ) => {
                    try {
                      // 修复：检查是否是 BrowserContext 类型
                      if (
                        context &&
                        typeof context === "object" &&
                        "storageState" in context
                      ) {
                        const result = await sessionManager.saveSessionState(
                          context as BrowserContext,
                          username,
                        );
                        await logMessage(
                          log,
                          userData.executionId,
                          LocalScraperLogLevel.INFO,
                          "[包装函数] 会话状态已保存",
                        );
                        return result;
                      } else {
                        throw new Error("无效的浏览器上下文对象");
                      }
                    } catch (error) {
                      await logMessage(
                        log,
                        userData.executionId,
                        LocalScraperLogLevel.WARN,
                        `[包装函数] 会话保存失败: ${(error as Error).message}`,
                      );
                      return false;
                    }
                  },
                  checkAuthenticationStatus: async (page: unknown) => {
                    return await sessionManager.checkAuthenticationStatus(
                      page as PlaywrightCrawlingContext["page"],
                    );
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
    saveSessionState: (context: unknown, username?: string) => Promise<boolean>;
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

        // 单商户模式：直接跳转到商户详情页面，批量模式：导航到Directory页面
        if (userData.singleMerchantMode && userData.targetMerchantUrl) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            "单商户模式：会话有效，直接跳转到商户详情页面",
          );

          await context.addRequests([
            {
              url: userData.targetMerchantUrl,
              label: "MERCHANT_DETAIL",
              userData: {
                ...userData,
                label: "MERCHANT_DETAIL",
                merchantUrl: userData.targetMerchantUrl,
                merchantName: userData.targetMerchantName,
              },
            },
          ]);
        } else {
          // 批量模式：导航到Directory页面
          const navigationResult =
            await navigationHandler.navigateToDirectory();
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
      "登录成功，立即保存会话状态",
    );

    // 保存会话状态（主逻辑）- 在登录成功后立即保存
    if (sessionManager) {
      try {
        // 检查 page 和 context 是否可用
        if (!context.page) {
          throw new Error("页面对象不可用");
        }

        const browserContext = context.page.context();
        if (!browserContext) {
          throw new Error("浏览器上下文不可用");
        }

        const saveResult: boolean = await sessionManager.saveSessionState(
          browserContext,
          userData.credentials?.username,
        );

        if (saveResult) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            "[主逻辑] 会话状态保存成功",
          );
        } else {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.WARN,
            "[主逻辑] 会话状态保存失败",
          );
        }
      } catch (error) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.ERROR,
          `[主逻辑] 保存会话状态异常: ${(error as Error).message}`,
        );
      }
    }

    // 登录成功后，导航到Directory页面
    const navigationResult = await navigationHandler.navigateToDirectory();

    if (navigationResult.success) {
      // 单商户模式：直接跳转到商户详情页面，批量模式：开始搜索
      if (userData.singleMerchantMode && userData.targetMerchantUrl) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          "单商户模式：登录成功，直接跳转到商户详情页面",
        );

        await context.addRequests([
          {
            url: userData.targetMerchantUrl,
            label: "MERCHANT_DETAIL",
            userData: {
              ...userData,
              label: "MERCHANT_DETAIL",
              merchantUrl: userData.targetMerchantUrl,
              merchantName: userData.targetMerchantName,
            },
          },
        ]);
      } else {
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
      }
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
    saveSessionState: (context: unknown, username?: string) => Promise<boolean>;
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
  const targetMerchants = userData.options?.maxMerchants || 500;

  await logMessage(
    log,
    userData.executionId,
    LocalScraperLogLevel.INFO,
    "开始执行搜索",
    { searchParams, targetMerchants },
  );

  // 优化页面大小设置
  // 先执行搜索
  const searchResult = await searchHandler.performSearch(searchParams);

  if (searchResult.success) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `搜索成功，找到 ${searchResult.resultsCount} 个结果`,
      { resultsCount: searchResult.resultsCount },
    );

    // 搜索成功后，立即优化页面大小
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      "正在优化每页显示数量设置...",
      { targetMerchants },
    );

    const pageSizeResult =
      await resultsParser.optimizePageSize(targetMerchants);
    if (pageSizeResult.success) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `✅ 页面大小优化完成：${pageSizeResult.selectedPageSize} 商户/页`,
        {
          selectedPageSize: pageSizeResult.selectedPageSize,
          originalPageSize: pageSizeResult.originalPageSize,
        },
      );
    } else {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.WARN,
        `⚠️ 页面大小优化失败：${pageSizeResult.error}`,
        { error: pageSizeResult.error },
      );
    }

    // 然后解析搜索结果
    const parsedResults = await resultsParser.parseSearchResults();

    if (parsedResults.merchants.length > 0) {
      // 处理解析出的商户数据
      const merchantsToProcess = parsedResults.merchants;

      // 计算实际需要处理的商户数量（考虑最大限制）
      const maxMerchants = userData.options?.maxMerchants || 500;
      const currentMerchantCount = allScrapedMerchants.length;
      const remainingSlots = maxMerchants - currentMerchantCount;
      const actualMerchantsToProcess = Math.min(
        merchantsToProcess.length,
        remainingSlots,
      );

      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `成功解析 ${parsedResults.merchants.length} 个商户，将处理其中 ${actualMerchantsToProcess} 个`,
        {
          totalParsed: parsedResults.merchants.length,
          willProcess: actualMerchantsToProcess,
          remainingSlots: remainingSlots,
          maxMerchants: maxMerchants,
          currentMerchantCount: currentMerchantCount,
        },
      );

      let processedCount = 0;
      let merchantsWithCountry = 0;
      let merchantsWithNetwork = 0;
      const processingStartTime = Date.now();

      for (let index = 0; index < merchantsToProcess.length; index++) {
        const merchant = merchantsToProcess[index];

        // 检查是否已达到最大商家数量限制
        const maxMerchantsLimit = userData.options?.maxMerchants || 500;
        const currentCount = allScrapedMerchants.length;

        if (currentCount >= maxMerchantsLimit) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `已达到最大商家数量限制 (${maxMerchantsLimit})，停止处理`,
            { currentCount: currentCount, maxMerchants: maxMerchantsLimit },
          );
          break;
        }

        try {
          // 转换为FMTCMerchantData格式
          const merchantData: FMTCMerchantData = {
            name: merchant.name,
            country: merchant.country,
            network: merchant.network,
            dateAdded: merchant.dateAdded
              ? new Date(merchant.dateAdded)
              : undefined,
            sourceUrl: merchant.detailUrl || context.request.url,
            fmtcId: merchant.id,
            status: merchant.status,
            rawData: {
              source: "search_results",
              dateAdded: merchant.dateAdded,
              status: merchant.status,
              originalCountry: merchant.country,
              originalNetwork: merchant.network,
            },
          };

          // 收集统计信息
          processedCount++;
          if (merchant.country) merchantsWithCountry++;
          if (merchant.network) merchantsWithNetwork++;

          // 如果有详情URL且启用详情抓取，将详情页加入队列
          if (merchant.detailUrl && userData.options?.includeDetails) {
            // 再次检查是否会超过最大商户数量限制（考虑当前索引）
            const detailRequestCount = allScrapedMerchants.length + index + 1;
            const maxMerchantsLimit = userData.options?.maxMerchants || 500;

            if (detailRequestCount <= maxMerchantsLimit) {
              await context.addRequests([
                {
                  url: merchant.detailUrl,
                  label: "MERCHANT_DETAIL",
                  userData: {
                    ...userData,
                    label: "MERCHANT_DETAIL",
                    merchantUrl: merchant.detailUrl,
                    merchantName: merchant.name,
                    merchantDetailIndex: index,
                    totalDetailsToProcess: Math.min(
                      actualMerchantsToProcess,
                      maxMerchantsLimit - allScrapedMerchants.length,
                    ),
                  },
                },
              ]);
            } else {
              await logMessage(
                log,
                userData.executionId,
                LocalScraperLogLevel.INFO,
                `跳过商户详情请求以避免超过限制: ${merchant.name}`,
                { detailRequestCount, maxMerchants: maxMerchantsLimit },
              );
            }
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

      // 输出汇总统计日志
      const processingTime = Date.now() - processingStartTime;
      if (processedCount > 0) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `✅ 商户数据转换完成：共处理 ${processedCount} 个商户`,
          {
            processedCount,
            merchantsWithCountry,
            merchantsWithNetwork,
            countryRate: `${Math.round((merchantsWithCountry / processedCount) * 100)}%`,
            networkRate: `${Math.round((merchantsWithNetwork / processedCount) * 100)}%`,
            processingTimeMs: processingTime,
            avgProcessingTimeMs: Math.round(processingTime / processedCount),
          },
        );
      } else {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `✅ 商户数据转换完成：未处理任何商户`,
          { processingTimeMs: processingTime },
        );
      }

      // 检查是否已达到最大商家数量限制
      const maxMerchantsLimit = userData.options?.maxMerchants || 500;
      const currentCount = allScrapedMerchants.length;

      if (currentCount >= maxMerchantsLimit) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `已达到最大商家数量限制 (${maxMerchantsLimit})，停止抓取`,
          { currentCount: currentCount, maxMerchants: maxMerchantsLimit },
        );
        return;
      }

      // 处理分页 - 重构后的逻辑
      if (parsedResults.hasNextPage && currentCount < maxMerchantsLimit) {
        // 获取当前分页信息
        const paginationInfo = await resultsParser.getPaginationInfo();
        const currentPageSize = paginationInfo.pageSize;
        const remainingMerchants = maxMerchantsLimit - currentCount;

        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `📊 分页状态检查：当前第 ${paginationInfo.currentPage}/${paginationInfo.totalPages} 页`,
          {
            currentPage: paginationInfo.currentPage,
            totalPages: paginationInfo.totalPages,
            currentPageSize,
            currentMerchantCount: currentCount,
            maxMerchants: maxMerchantsLimit,
            remainingMerchants,
            hasNextPage: parsedResults.hasNextPage,
          },
        );

        // 估算是否还需要更多页面
        const estimatedPagesNeeded = Math.ceil(
          remainingMerchants / currentPageSize,
        );
        const shouldContinue =
          estimatedPagesNeeded > 0 && paginationInfo.hasNextPage;

        if (shouldContinue) {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `🔄 需要继续分页：还需约 ${estimatedPagesNeeded} 页来达到目标 ${maxMerchantsLimit} 个商户`,
            { estimatedPagesNeeded, remainingMerchants },
          );

          const success = await resultsParser.navigateToNextPage();

          if (success) {
            const newPageInfo = await resultsParser.getPaginationInfo();
            await logMessage(
              log,
              userData.executionId,
              LocalScraperLogLevel.INFO,
              `✅ 成功导航到第 ${newPageInfo.currentPage} 页，继续抓取`,
              {
                newCurrentPage: newPageInfo.currentPage,
                currentMerchantCount: currentCount,
                targetRemaining: remainingMerchants,
              },
            );

            // 添加下一页的搜索任务
            await context.addRequests([
              {
                url: context.request.url, // 保持当前URL
                label: "SEARCH",
                userData: {
                  ...userData,
                  pageNumber: newPageInfo.currentPage,
                },
              },
            ]);
          } else {
            await logMessage(
              log,
              userData.executionId,
              LocalScraperLogLevel.WARN,
              "❌ 无法导航到下一页，搜索结束",
              { reason: "navigation_failed" },
            );
          }
        } else {
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.INFO,
            `🎯 分页结束：${shouldContinue ? "无更多页面" : "已达到商户数量目标"}`,
            {
              reason: shouldContinue ? "no_more_pages" : "target_reached",
              finalMerchantCount: currentCount,
              targetMerchants: maxMerchantsLimit,
            },
          );
        }
      } else {
        const reason = !parsedResults.hasNextPage
          ? "无更多页面"
          : "已达到商户数量限制";
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `🏁 搜索完成：${reason}`,
          {
            hasNextPage: parsedResults.hasNextPage,
            finalMerchantCount: currentCount,
            maxMerchants: maxMerchantsLimit,
            reason: !parsedResults.hasNextPage
              ? "no_more_pages"
              : "merchant_limit_reached",
          },
        );
      }
    } else {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.WARN,
        "⚠️ 搜索结果解析失败，未找到商户数据",
        {
          searchResultsFound: parsedResults.merchants.length,
          searchSuccessful: searchResult.success,
          currentUrl: context.request.url,
        },
      );
    }
  } else {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.ERROR,
      `❌ 搜索操作失败: ${searchResult.error}`,
      {
        error: searchResult.error,
        searchParams,
        currentUrl: context.request.url,
      },
    );
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
    const maxMerchantsLimit = userData.options?.maxMerchants || 500;
    const currentMerchantCountInList = allScrapedMerchants.length;
    const remainingSlots = maxMerchantsLimit - currentMerchantCountInList;
    const actualMerchantsToProcess = Math.min(
      listResult.merchants.length,
      remainingSlots,
    );

    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `第 ${pageNumber} 页抓取到 ${listResult.merchants.length} 个商户，将处理其中 ${actualMerchantsToProcess} 个`,
      {
        totalParsed: listResult.merchants.length,
        willProcess: actualMerchantsToProcess,
        remainingSlots: remainingSlots,
        maxMerchants: maxMerchantsLimit,
        currentMerchantCount: currentMerchantCountInList,
      },
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
    const merchantsToProcess = listResult.merchants;

    for (let index = 0; index < merchantsToProcess.length; index++) {
      const merchant = merchantsToProcess[index];

      // 检查是否已达到最大商家数量限制
      const currentCount = allScrapedMerchants.length;
      const maxMerchantsInLoop = userData.options?.maxMerchants || 500;
      if (currentCount >= maxMerchantsInLoop) {
        await logMessage(
          log,
          userData.executionId,
          LocalScraperLogLevel.INFO,
          `已达到最大商家数量限制 (${maxMerchantsInLoop})，停止处理`,
          { currentCount, maxMerchants: maxMerchantsInLoop },
        );
        break;
      }

      try {
        // 将基本信息添加到结果中
        const merchantData: FMTCMerchantData = {
          ...merchant,
          sourceUrl: context.request.url,
          rawData: { source: "merchant_list", pageNumber },
        };

        // 如果有详情链接且启用详情抓取，将详情页加入队列
        if (merchant.detailUrl && userData.options?.includeDetails) {
          // 再次检查是否会超过最大商户数量限制（考虑当前索引）
          const detailRequestCount = allScrapedMerchants.length + index + 1;
          const maxMerchantsInDetail = userData.options?.maxMerchants || 500;

          if (detailRequestCount <= maxMerchantsInDetail) {
            await context.addRequests([
              {
                url: merchant.detailUrl,
                label: "MERCHANT_DETAIL",
                userData: {
                  ...userData,
                  label: "MERCHANT_DETAIL",
                  merchantUrl: merchant.detailUrl,
                  merchantName: merchant.name,
                  merchantDetailIndex: index,
                  totalDetailsToProcess: Math.min(
                    actualMerchantsToProcess,
                    maxMerchantsInDetail - allScrapedMerchants.length,
                  ),
                },
              },
            ]);
          } else {
            await logMessage(
              log,
              userData.executionId,
              LocalScraperLogLevel.INFO,
              `跳过商户详情请求以避免超过限制: ${merchant.name}`,
              { detailRequestCount, maxMerchants: maxMerchantsInDetail },
            );
          }
        } else {
          // 直接添加到结果中（只有基本信息）

          // 调试：记录列表页数据添加（无详情）
          await logMessage(
            log,
            userData.executionId,
            LocalScraperLogLevel.DEBUG,
            `添加商户列表数据（无详情）`,
            {
              merchantName: merchant.name,
              country: merchant.country,
              network: merchant.network,
              detailUrl: merchant.detailUrl,
            },
          );

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

    // 根据商户数量动态计算是否需要更多页面
    const maxMerchantsForPagination = userData.options?.maxMerchants || 500;
    const currentMerchantCountForPagination = allScrapedMerchants.length;
    const shouldContinuePagination =
      currentMerchantCountForPagination < maxMerchantsForPagination;

    if (listResult.pagination.hasNextPage && shouldContinuePagination) {
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

  // 计算当前进度
  const currentDetailIndex = userData.merchantDetailIndex || 0;
  const totalDetailsToProcess = userData.totalDetailsToProcess || 1;
  const currentMerchantCount = allScrapedMerchants.length;
  const maxMerchantsForDetail = userData.options?.maxMerchants || 500;

  // 检查是否已达到最大商户数量限制，如果是则跳过处理
  if (currentMerchantCount >= maxMerchantsForDetail) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `已达到最大商户数量限制 (${maxMerchantsForDetail})，跳过商户详情处理: ${userData.merchantName}`,
      {
        currentMerchantCount,
        maxMerchants: maxMerchantsForDetail,
        skippedMerchant: userData.merchantName,
      },
    );
    return;
  }

  // 记录进度日志 - 单商户模式下简化日志
  if (userData.singleMerchantMode) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `处理商户详情: ${userData.merchantName}`,
    );
  } else {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      `处理商户详情 [${currentDetailIndex + 1}/${totalDetailsToProcess}]: ${userData.merchantName}`,
      {
        currentDetailIndex: currentDetailIndex + 1,
        totalDetailsToProcess,
        currentMerchantCount,
        maxMerchants: maxMerchantsForDetail,
        progressPercentage: Math.round(
          ((currentDetailIndex + 1) / totalDetailsToProcess) * 100,
        ),
      },
    );
  }

  // 抓取商户详情
  const detailResult = await detailHandler.scrapeMerchantDetails(
    userData.merchantUrl,
    userData.merchantName,
  );

  if (detailResult.success) {
    // 查找对应的基本信息并合并
    // 先尝试精确匹配商户名称
    let existingMerchantIndex = allScrapedMerchants.findIndex(
      (m) => m.name === userData.merchantName,
    );

    // 如果精确匹配失败，尝试模糊匹配（去除空格和特殊字符）
    if (existingMerchantIndex === -1) {
      const normalizedName = userData.merchantName
        ?.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w]/g, "");
      existingMerchantIndex = allScrapedMerchants.findIndex(
        (m) =>
          m.name.toLowerCase().replace(/\s+/g, "").replace(/[^\w]/g, "") ===
          normalizedName,
      );
    }

    // 如果仍然没有找到，尝试通过detailUrl匹配
    if (existingMerchantIndex === -1) {
      existingMerchantIndex = allScrapedMerchants.findIndex(
        (m) => m.detailUrl === userData.merchantUrl,
      );
    }

    // 获取现有的基本信息（包含 country 和 network）
    const existingData =
      existingMerchantIndex >= 0
        ? allScrapedMerchants[existingMerchantIndex]
        : null;

    // 如果仍然没有找到匹配的数据，记录调试信息
    // 注意：在单商户模式下，这是正常情况，因为我们直接跳转到详情页面，不经过列表页
    if (!existingData && !userData.singleMerchantMode) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.WARN,
        `未找到商户 "${userData.merchantName}" 的列表页数据，network字段可能丢失`,
        {
          merchantName: userData.merchantName,
          merchantUrl: userData.merchantUrl,
          totalScrapedMerchants: allScrapedMerchants.length,
          availableNames: allScrapedMerchants.slice(0, 5).map((m) => m.name),
        },
      );
    } else if (!existingData && userData.singleMerchantMode) {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.DEBUG,
        `单商户模式：直接使用详情页数据，无需列表页数据`,
        {
          merchantName: userData.merchantName,
          merchantUrl: userData.merchantUrl,
          networksFromDetail: detailResult.merchantDetail.networks?.length || 0,
        },
      );
    }

    const completeData: FMTCMerchantData = {
      // 基本信息
      name: userData.merchantName || "",
      ...(existingData || {}),
      // 详情信息
      ...detailResult.merchantDetail,
      // 确保列表页的关键字段不被覆盖
      country:
        existingData?.country || detailResult.merchantDetail.primaryCountry,
      network:
        existingData?.network ||
        (detailResult.merchantDetail.networks &&
        detailResult.merchantDetail.networks.length > 0
          ? detailResult.merchantDetail.networks[0].networkName
          : undefined), // 统一使用undefined，符合类型定义
      sourceUrl: userData.merchantUrl,
      rawData: {
        source: "merchant_detail",
        scrapedAt: detailResult.scrapedAt,
        originalListData:
          existingData && (existingData.country || existingData.network)
            ? {
                country: existingData.country,
                network: existingData.network,
              }
            : undefined,
      },
    };

    // 调试：记录数据合并结果
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.DEBUG,
      `商户详情数据合并完成`,
      {
        merchantName: userData.merchantName,
        hasExistingData: !!existingData,
        existingNetwork: existingData?.network,
        finalNetwork: completeData.network,
        networksFromDetail: detailResult.merchantDetail.networks?.map(
          (n) => n.networkName,
        ),
      },
    );

    if (existingMerchantIndex >= 0) {
      // 更新现有数据
      allScrapedMerchants[existingMerchantIndex] = completeData;
    } else {
      // 添加新数据
      allScrapedMerchants.push(completeData);
    }

    // 单商户模式下简化完成日志
    if (userData.singleMerchantMode) {
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
    } else {
      await logMessage(
        log,
        userData.executionId,
        LocalScraperLogLevel.INFO,
        `商户详情抓取完成 [${currentDetailIndex + 1}/${totalDetailsToProcess}]: ${userData.merchantName}`,
        {
          fmtcId: detailResult.merchantDetail.fmtcId,
          networksCount: detailResult.merchantDetail.networks?.length || 0,
          currentDetailIndex: currentDetailIndex + 1,
          totalDetailsToProcess,
          progressPercentage: Math.round(
            ((currentDetailIndex + 1) / totalDetailsToProcess) * 100,
          ),
        },
      );
    }

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
      `商户详情抓取失败 [${currentDetailIndex + 1}/${totalDetailsToProcess}]: ${userData.merchantName}`,
      {
        error: detailResult.error,
        currentDetailIndex: currentDetailIndex + 1,
        totalDetailsToProcess,
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
