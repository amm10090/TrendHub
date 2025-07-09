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
import { FMTCMerchantListHandler } from "./merchant-list-handler.js";
import { FMTCMerchantDetailHandler } from "./merchant-detail-handler.js";
import { FMTCAntiDetection } from "./anti-detection.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";

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
  } = options;

  return async function requestHandler(
    context: PlaywrightCrawlingContext,
  ): Promise<void> {
    const { request, page, log } = context;
    const { label } = request;
    const userData = request.userData as FMTCUserData;

    // 创建处理器实例
    const loginHandler = new FMTCLoginHandler(page, log, userData.executionId);
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

      // 在每个请求前执行反检测策略
      await antiDetection.simulateRealUserBehavior();

      // 根据标签分发请求
      switch (label) {
        case "LOGIN":
          await handleLogin(context, loginHandler, userData, log);
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
  userData: FMTCUserData,
  log: Log,
): Promise<void> {
  if (!userData.credentials) {
    throw new Error("登录凭据未提供");
  }

  // 执行登录
  const loginResult = await loginHandler.login(userData.credentials);

  if (loginResult.success) {
    await logMessage(
      log,
      userData.executionId,
      LocalScraperLogLevel.INFO,
      "登录成功，开始抓取商户列表",
    );

    // 登录成功后，将商户列表页面加入队列
    await context.addRequests([
      {
        url: "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
        label: "MERCHANT_LIST",
        userData: {
          ...userData,
          label: "MERCHANT_LIST",
          pageNumber: 1,
        },
      },
    ]);
  } else {
    throw new Error(`登录失败: ${loginResult.error}`);
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
