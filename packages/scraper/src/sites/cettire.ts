import { Page, ElementHandle } from "playwright";
import { Product, ECommerceSite } from "@repo/types";
import {
  cleanPrice,
  logInfo,
  logError,
  sendLogToBackend,
  LocalScraperLogLevel,
} from "../utils.js";
import type { ScraperOptions } from "../main.js";
import * as fs from "fs";
import * as path from "path";
import { PlaywrightCrawler, Request, Log, Configuration } from "crawlee";

// 定义用于任务队列的用户数据接口
interface CettireUserData {
  executionId?: string; // 恢复 executionId
  plpData?: Partial<Product>; // 列表页提取的初步产品数据
  label?: string; // 标记请求类型：LIST 或 DETAIL
  batchGender?: "women" | "men" | "unisex" | string | null; // 从URL推断的性别类别
}

// CSS 选择器
const SELECTORS = {
  PRODUCT_LIST_CONTAINER: "div._3kWsUD-sruWkbllx1UtLKW",
  PRODUCT_CARD: "div.lazyload-wrapper._8T7q2GDqmgeWgJYhbInA1",
  PRODUCT_LINK: "a.qFbwHS4kQ4GkWGJXG18EE",
  PRODUCT_POSITION: "a.qFbwHS4kQ4GkWGJXG18EE[position]", // 带position属性的商品链接
  PRODUCT_BRAND: "div._1tt3LMOZ50TX6rWCuwNDjK",
  PRODUCT_NAME: "div._1EqhXd6FUIED0ndyLYSncV",
  PRODUCT_ORIGINAL_PRICE: "s.E0_8CVj5Lnq3QKTQFJFQU",
  PRODUCT_PRICE: "span._2Jxa7Rj1Kswy2fPVXbctjY span",
  PRODUCT_IMAGE: "img._2SNSvFX_9k7gfa1DGaYuUW",
  LOAD_MORE_BUTTON:
    "div._1wcDB3Knltilo9IQkv6J4m button._2_uoPWn988k7K6vk5euW2G",

  // 新的商品详情页选择器 (旧的DETAIL_*选择器已移除，因为scrapeProductDetail函数被移除)
  DETAIL_BREADCRUMB:
    "div._1uovQUBIvVTH1TNG-I_TOo div.bhOC9HflVSE4O-zd0yeIi a._2ZT6npFg-lBdbsrslQx-5p",
  DETAIL_PRODUCT_TAG: "div._3ALcrDvuoLuhBGK5T7T_y3",
  DETAIL_PRODUCT_DETAILS_CONTENT: "div._3csgcokkLIL6WO9FCmWmQ4", // 只保留内容选择器
  DETAIL_PRODUCT_IMAGES_CONTAINER: "div._1aaZ1SVhxttpeH9so_zp-Y",
  DETAIL_PRODUCT_IMAGE_NEXT_BUTTON: "div._1wsXbc9wv1Uv7o-45goPQF",
  DETAIL_PRODUCT_IMAGE_PREV_BUTTON: "div._2Tj4Wc40QPFvVfbP5EA8dL", // 注意：这个选择器在当前代码中未使用，但保留以备将来可能需要
  DETAIL_PRODUCT_IMAGES:
    "div.swiper-slide picture.picture source[type='image/webp']",
  DETAIL_PRODUCT_IMAGES_THUMBNAILS: "div.swiper-wrapper div.swiper-slide img",
};

/**
 * 从Cettire URL推断性别分类
 */
function inferGenderFromCettireUrl(
  url: string,
): "women" | "men" | "unisex" | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    for (const part of pathParts) {
      const lowerPart = part.toLowerCase();
      if (lowerPart === "women") return "women";
      if (lowerPart === "men") return "men";
      if (lowerPart === "unisex") return "unisex";
    }

    return null;
  } catch (error) {
    logError(`inferGenderFromCettireUrl: 无法解析URL ${url}: ${error}`);
    return null;
  }
}

/**
 * 从商品详情文本中提取结构化信息
 */
function extractProductDetails(detailsText: string): {
  material?: string;
  color?: string;
  dimensions?: string;
  sku?: string;
  materialDetails: string[];
} {
  const details = {
    material: undefined as string | undefined,
    color: undefined as string | undefined,
    dimensions: undefined as string | undefined,
    sku: undefined as string | undefined,
    materialDetails: [] as string[],
  };

  const lines = detailsText.split(/\n|<br>|<br\/>/);
  details.materialDetails = lines
    .map((line) => line.trim())
    .filter((line) => line);

  const dimensionsMatch = detailsText.match(/Dimensions:([^<]+)/i);
  if (dimensionsMatch && dimensionsMatch[1]) {
    details.dimensions = dimensionsMatch[1].trim();
  }

  const materialMatches = detailsText.match(/(\d+%\s*[A-Za-z]+)/g);
  if (materialMatches && materialMatches.length > 0) {
    details.material = materialMatches.join(", ");
  }

  const colorMatch = detailsText.match(/Designer Colour:\s*([A-Za-z0-9\s]+)/i); // 允许颜色名称中包含空格
  if (colorMatch && colorMatch[1]) {
    details.color = colorMatch[1].trim();
  }

  const skuMatch = detailsText.match(
    /Designer Model Number:\s*([A-Za-z0-9-]+)/i,
  ); // 允许SKU中包含连字符
  if (skuMatch && skuMatch[1]) {
    details.sku = skuMatch[1].trim();
  }

  return details;
}

/**
 * 提取所有产品图片
 */
async function extractAllProductImages(page: Page): Promise<string[]> {
  const images: string[] = [];

  try {
    const thumbnails = await page.$$(
      SELECTORS.DETAIL_PRODUCT_IMAGES_THUMBNAILS,
    );
    const totalImages = thumbnails.length;
    logInfo(`extractAllProductImages: 发现 ${totalImages} 张缩略图`);

    const currentImages = await page.$$(SELECTORS.DETAIL_PRODUCT_IMAGES);
    for (const img of currentImages) {
      const srcset = await img.getAttribute("srcset");
      if (srcset) {
        const src = srcset.split(" ")[0];
        if (src && !images.includes(src)) {
          images.push(src);
        }
      }
    }

    const nextButton = await page.$(SELECTORS.DETAIL_PRODUCT_IMAGE_NEXT_BUTTON);
    if (nextButton && totalImages > 1) {
      // 仅当图片多于1张时才尝试点击
      for (let i = 0; i < totalImages - 1; i++) {
        if (!(await nextButton.isVisible())) break; // 如果按钮不可见，则停止点击
        await nextButton.click();
        await page.waitForTimeout(500);

        const newPageImages = await page.$$(SELECTORS.DETAIL_PRODUCT_IMAGES);
        for (const img of newPageImages) {
          const srcset = await img.getAttribute("srcset");
          if (srcset) {
            const src = srcset.split(" ")[0];
            if (src && !images.includes(src)) {
              images.push(src);
            }
          }
        }
      }
    }

    logInfo(`extractAllProductImages: 成功提取 ${images.length} 张产品图片`);
    return Array.from(new Set(images)); //确保图片唯一
  } catch (error) {
    logError(`extractAllProductImages: 提取图片时出错: ${error}`);
    return Array.from(new Set(images)); // 返回已提取的唯一图片
  }
}

/**
 * 使用PlaywrightCrawler爬取Cettire网站
 */
export async function scrapeCettireWithCrawler(
  startUrls: string | string[] = [
    "https://www.cettire.com/collections/women",
    "https://www.cettire.com/collections/men",
  ],
  options: ScraperOptions = {},
  executionId?: string, // 保留executionId，因为它可能在其他地方或将来被用于日志追踪
): Promise<Product[]> {
  const siteName = "Cettire";

  // 添加会话级 URL 去重集合，用于跟踪当前爬取会话中已处理的 URL
  const processedUrls = new Set<string>();

  // 添加处理过的位置集合，记录已处理的商品位置
  const processedPositions = new Set<number>();

  // 跟踪最大位置值
  const maxPositionSeen = 0;
  const maxPositionRef = { value: maxPositionSeen }; // 使用引用对象来跟踪最大位置

  const firstStartUrl = Array.isArray(startUrls) ? startUrls[0] : startUrls;
  const batchGender = firstStartUrl
    ? inferGenderFromCettireUrl(firstStartUrl)
    : null;

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper started.`,
      {
        incomingStartUrls: startUrls,
        incomingOptions: options,
        inferredBatchGender: batchGender,
      },
    );
  }

  const initialRequests = (
    Array.isArray(startUrls) ? startUrls : [startUrls]
  ).map((url) => {
    return {
      url,
      userData: {
        executionId: executionId,
        label: "LIST",
        batchGender: batchGender,
      } as CettireUserData,
      label: "LIST",
    };
  });

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.DEBUG,
      `Cettire: Prepared initial requests.`,
      {
        count: initialRequests.length,
        // Log first 5 requests for brevity, ensure not too large for log payload
        requestsContent: initialRequests
          .slice(0, 5)
          .map((r) => ({
            url: r.url,
            label: r.label,
            userDataPreview: {
              label: r.userData.label,
              batchGender: r.userData.batchGender,
            },
          })),
      },
    );
  }

  if (initialRequests.length === 0 && executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.WARN,
      `Cettire: No initial requests generated. StartUrls might be empty or invalid. Crawler will likely exit.`,
      { originalStartUrls: startUrls },
    );
  }

  // logInfo(`推断的性别分类: ${batchGender || "未知"}`); // Replaced by backend log
  const allScrapedProducts: Product[] = [];
  let processedDetailPages = 0;
  let enqueuedDetailPages = 0;

  const DEFAULT_MAX_PRODUCTS = 1000;
  const FALLBACK_MAX_REQUESTS_BUFFER = 20; // Buffer for PLP, load more, retries

  const targetMaxProducts = options.maxProducts || DEFAULT_MAX_PRODUCTS;
  let effectiveMaxRequests = options.maxRequests;

  if (effectiveMaxRequests && effectiveMaxRequests < targetMaxProducts + 1) {
    const warningMsg = `Cettire Scraper: User-defined maxRequests (${effectiveMaxRequests}) is potentially too low for targetMaxProducts (${targetMaxProducts}). Adjusting internally.`;
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        warningMsg,
        {
          originalMaxRequests: effectiveMaxRequests,
          targetMaxProducts,
          adjustedMaxRequests: targetMaxProducts + FALLBACK_MAX_REQUESTS_BUFFER,
        },
      );
    }
    logInfo(warningMsg); // Also log locally
    effectiveMaxRequests = targetMaxProducts + FALLBACK_MAX_REQUESTS_BUFFER;
  } else if (!effectiveMaxRequests) {
    effectiveMaxRequests = targetMaxProducts + FALLBACK_MAX_REQUESTS_BUFFER;
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Cettire Scraper: maxRequests not set by user, defaulting to ${effectiveMaxRequests} based on targetMaxProducts (${targetMaxProducts}).`,
        { defaultedMaxRequests: effectiveMaxRequests, targetMaxProducts },
      ); // No comma needed if last prop
    }
  }

  // Ensure maxRequests is not accidentally huge if targetMaxProducts was huge and no user maxRequests
  // This is a sanity cap, e.g. if default_max_products was very large.
  // User's explicit options.maxRequests (if reasonable) should still be respected over this cap.
  const sanityMaxRequestsCap = 2000; // Example cap
  if (
    effectiveMaxRequests > sanityMaxRequestsCap &&
    !(options.maxRequests && options.maxRequests > sanityMaxRequestsCap)
  ) {
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `Cettire Scraper: Calculated effectiveMaxRequests (${effectiveMaxRequests}) exceeds sanity cap (${sanityMaxRequestsCap}) and user did not explicitly set a higher value. Capping.`,
        {
          originalEffective: effectiveMaxRequests,
          cappedAt: sanityMaxRequestsCap,
        },
      ); // No comma needed if last prop
    }
    effectiveMaxRequests = sanityMaxRequestsCap;
  }

  const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  logInfo(`本次运行的存储目录设置为: ${runSpecificStorageDir}`);

  if (
    !fs.existsSync(
      path.join(runSpecificStorageDir, "request_queues", "default"),
    )
  ) {
    fs.mkdirSync(
      path.join(runSpecificStorageDir, "request_queues", "default"),
      { recursive: true },
    );
  }
  if (!fs.existsSync(path.join(runSpecificStorageDir, "datasets", "default"))) {
    fs.mkdirSync(path.join(runSpecificStorageDir, "datasets", "default"), {
      recursive: true,
    });
  }
  if (
    !fs.existsSync(
      path.join(runSpecificStorageDir, "key_value_stores", "default"),
    )
  ) {
    fs.mkdirSync(
      path.join(runSpecificStorageDir, "key_value_stores", "default"),
      { recursive: true },
    );
  }
  // process.env.CRAWLEE_STORAGE_DIR = runSpecificStorageDir; // 移除或注释掉此行

  // 创建 Configuration 对象
  const config = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  const crawler = new PlaywrightCrawler(
    {
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      maxRequestsPerCrawl: effectiveMaxRequests, // 使用调整后的值
      maxConcurrency: 5, // <--- 新增：限制最大并发数为5

      async requestHandler({
        request,
        page,
        log: localCrawlerLog,
        crawler,
        pushData,
      }) {
        // --- 开始插入请求拦截代码 ---
        try {
          await page.route("**/*", (route) => {
            const req = route.request();
            const resourceType = req.resourceType();
            const url = req.url();

            // 允许 HTML文档, 主要脚本, XHR/Fetch API调用 (数据交互)
            if (
              resourceType === "document" ||
              resourceType === "script" || // 需要谨慎，Cettire可能依赖特定脚本渲染内容
              resourceType === "xhr" ||
              resourceType === "fetch"
            ) {
              // localCrawlerLog.debug(`Allowing resource: ${resourceType} ${url.substring(0, 80)}`);
              return route.continue();
            }

            // 允许图片资源 (Cettire商品图片是必需的)
            if (resourceType === "image") {
              // localCrawlerLog.debug(`Allowing image: ${url.substring(0, 80)}`);
              return route.continue();
            }

            // 阻止其他类型，如样式表、字体、媒体、其他不明确的类型
            if (
              ["stylesheet", "font", "media", "other"].includes(resourceType)
            ) {
              localCrawlerLog.debug(
                `Cettire: Blocking resource: ${resourceType} ${url.substring(0, 80)}...`,
              );
              return route.abort();
            }

            // 对于未明确分类的，默认放行，但可以记录以供审查
            // localCrawlerLog.debug(`Allowing (default): ${resourceType} ${url.substring(0, 80)}`);
            return route.continue();
          });
        } catch (routeError) {
          localCrawlerLog.warning(
            `Cettire: Failed to set up request routing for ${request.url}: ${(routeError as Error).message}`,
          );
        }
        // --- 结束插入请求拦截代码 ---

        const currentExecutionId = request.userData?.executionId; // 从请求的用户数据中获取 executionId
        const requestLabel = request.userData?.label || request.label;
        const currentBatchGender = request.userData?.batchGender;

        localCrawlerLog.info(
          `Cettire: 处理 ${request.url}... (标签: ${requestLabel}, 执行ID: ${currentExecutionId || "无"})`,
        );

        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.INFO,
            `Cettire: Processing URL: ${request.url} `,
            { label: requestLabel, batchGender: currentBatchGender },
          );
        }

        try {
          if (requestLabel === "DETAIL") {
            processedDetailPages++;
            localCrawlerLog.info(
              `Cettire: 识别为详情页: ${request.url} (${processedDetailPages}/${targetMaxProducts})`,
            );

            // 将URL添加到处理集合中，防止重复处理
            processedUrls.add(request.url);

            const plpData = request.userData?.plpData;

            const product: Product = {
              source: "Cettire" as ECommerceSite,
              url: request.url,
              scrapedAt: new Date(),
              name: plpData?.name,
              brand: plpData?.brand,
              images: plpData?.images,
              currentPrice: plpData?.currentPrice,
              originalPrice: plpData?.originalPrice,
              sizes: [],
              tags: plpData?.tags || [],
              gender: currentBatchGender || plpData?.gender,
              materialDetails: [],
              metadata: { executionId: currentExecutionId }, // 将 executionId 添加到元数据
            };

            const breadcrumbElements = await page.$$(
              SELECTORS.DETAIL_BREADCRUMB,
            );
            const breadcrumbs: string[] = [];
            for (const element of breadcrumbElements) {
              const text = await element.textContent();
              if (text && text.trim() !== "Home") {
                breadcrumbs.push(text.trim());
              }
            }
            if (breadcrumbs.length > 0) {
              product.breadcrumbs = breadcrumbs;
              localCrawlerLog.info(`提取到面包屑: ${breadcrumbs.join(" > ")} `);
            }

            const tagElements = await page.$$(SELECTORS.DETAIL_PRODUCT_TAG);
            for (const element of tagElements) {
              const tag = await element.textContent();
              if (tag) {
                if (!product.tags) product.tags = [];
                if (!product.tags.includes(tag.trim())) {
                  // 确保标签不重复
                  product.tags.push(tag.trim());
                }
              }
            }
            if (product.tags && product.tags.length > 0) {
              localCrawlerLog.info(`提取到标签: ${product.tags.join(", ")} `);
            }

            // 清理和确保标签唯一性
            if (product.tags && product.tags.length > 0) {
              product.tags = product.tags
                .map((tag) => {
                  if (tag.toLowerCase().startsWith("gender:")) {
                    return tag.substring("gender:".length);
                  }
                  return tag;
                })
                .filter(
                  (tag, index, self) =>
                    tag && tag.trim() !== "" && self.indexOf(tag) === index,
                ); // 确保标签非空、非纯空格且唯一
              localCrawlerLog.info(`清理后标签: ${product.tags.join(", ")} `);
            }

            const detailsElement = await page.$(
              SELECTORS.DETAIL_PRODUCT_DETAILS_CONTENT,
            );
            if (detailsElement) {
              const detailsText = await detailsElement.innerHTML(); // 使用 innerHTML 以保留换行符
              product.description = detailsText.trim();

              const extractedDetails = extractProductDetails(detailsText);
              if (extractedDetails.material)
                product.material = extractedDetails.material;
              if (extractedDetails.color)
                product.color = extractedDetails.color;
              if (extractedDetails.sku) product.sku = extractedDetails.sku; // SKU从详情中提取
              if (extractedDetails.materialDetails.length > 0) {
                product.materialDetails = extractedDetails.materialDetails;
              }

              // 新增逻辑：将提取的物理尺寸存入 product.sizes
              if (
                extractedDetails.dimensions &&
                extractedDetails.dimensions.trim()
              ) {
                product.sizes = [extractedDetails.dimensions.trim()];
                localCrawlerLog.info(
                  `Cettire: 已提取物理尺寸并存入 product.sizes: "${product.sizes[0]}"`,
                );
              }
              // 如果 extractedDetails.dimensions 为空或无效，product.sizes 依然是初始化时的空数组

              localCrawlerLog.info(
                `提取到商品描述，长度: ${product.description.length} `,
              );
              if (extractedDetails.material)
                localCrawlerLog.info(
                  `提取到材质: ${extractedDetails.material} `,
                );
              if (extractedDetails.color)
                localCrawlerLog.info(`提取到颜色: ${extractedDetails.color} `);
              if (extractedDetails.sku)
                localCrawlerLog.info(`提取到SKU: ${extractedDetails.sku} `);
            }

            const images = await extractAllProductImages(page);
            if (images.length > 0) {
              product.images = images;
              localCrawlerLog.info(`提取到 ${images.length} 张产品图片`);
            }

            if (!product.sku) {
              const skuMissingMsg = `Cettire: Failed to extract SKU for URL: ${request.url}. Product details: Name: ${product.name}, Brand: ${product.brand} `;
              localCrawlerLog.warning(skuMissingMsg);
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  skuMissingMsg,
                  {
                    url: request.url,
                    productName: product.name,
                    productBrand: product.brand,
                  },
                );
              }
            }

            localCrawlerLog.info(
              `Cettire: 已提取商品数据 ${product.name ?? product.url}, 保存到数据集。`,
            );
            await pushData(product);
            allScrapedProducts.push(product);

            if (currentExecutionId) {
              await sendLogToBackend(
                currentExecutionId,
                LocalScraperLogLevel.INFO,
                `Cettire: Product data extracted and saved for ${product.name ?? product.url}`,
                { productId: product.sku, url: product.url }, // Assuming product.sku can serve as a product identifier
              );
            }

            if (processedDetailPages >= targetMaxProducts) {
              // Check against targetMaxProducts
              localCrawlerLog.info(
                `Cettire: 已达到最大产品限制(${targetMaxProducts})，停止爬虫。`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Cettire: Reached max products limit(${targetMaxProducts}), stopping crawler.`,
                  { processedDetailPages, maxProducts: targetMaxProducts }, // use targetMaxProducts for logging consistency
                );
              }
              await crawler.stop();
            }
          } else {
            localCrawlerLog.info(`Cettire: 识别为列表页: ${request.url} `);

            await page.waitForSelector(SELECTORS.PRODUCT_CARD, {
              timeout: 60000,
            }); // 增加超时时间

            const productCards = await page.$$(SELECTORS.PRODUCT_CARD);
            localCrawlerLog.info(
              `Cettire: 在 ${request.url} 上找到 ${productCards.length} 个商品卡片`,
            );

            // 传递 processedUrls 集合到处理卡片函数
            await processProductCards(
              productCards,
              page,
              request,
              crawler,
              localCrawlerLog,
              targetMaxProducts, // Pass targetMaxProducts
              enqueuedDetailPages,
              (newCount: number) => {
                enqueuedDetailPages = newCount;
              },
              currentExecutionId, // 传递 executionId
              currentBatchGender,
              processedUrls, // 传递会话级 URL 去重集合
              0, // 从索引 0 开始处理全部卡片
              processedPositions, // 传递位置去重集合
              maxPositionRef, // 传递最大位置值
            );

            // 添加调试日志
            localCrawlerLog.info(
              `Cettire: DEBUG - Before 'no more loading' check. enqueuedDetailPages: ${enqueuedDetailPages}, targetMaxProducts: ${targetMaxProducts}, 已处理URLs: ${processedUrls.size}`,
            );

            if (enqueuedDetailPages >= targetMaxProducts) {
              // Check against targetMaxProducts
              localCrawlerLog.info(
                `Cettire: 已达到最大产品入队限制(${targetMaxProducts})，不再加载更多。`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Cettire: Reached max products enqueue limit(${targetMaxProducts}), not loading more from this list page.`,
                  {
                    enqueuedDetailPages,
                    maxProducts: targetMaxProducts,
                    url: request.url,
                  },
                );
              }
              return;
            }

            // 传递 processedUrls 集合到加载更多函数
            await handleLoadMoreButton(
              page,
              productCards, // 传递初始卡片用于比较
              request,
              crawler,
              localCrawlerLog,
              targetMaxProducts, // Pass targetMaxProducts
              enqueuedDetailPages,
              (newCount: number) => {
                enqueuedDetailPages = newCount;
              },
              currentExecutionId, // 传递 executionId
              currentBatchGender,
              options, // 传递 options 给 handleLoadMoreButton
              processedUrls, // 传递会话级 URL 去重集合
              processedPositions, // 传递位置去重集合
              maxPositionRef, // 传递最大位置值
            );
          }
        } catch (error) {
          localCrawlerLog.error(
            `Cettire: 处理请求 ${request.url} 时出错: ${error} `,
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.ERROR,
              `Cettire: Error processing request ${request.url}: ${(error as Error).message} `,
              {
                stack: (error as Error).stack,
                url: request.url,
                label: requestLabel,
              },
            );
          }
        }
      },

      failedRequestHandler: async ({ request, log }) => {
        log.error(
          `Cettire: 请求 ${request.url} 失败! 错误: ${request.errorMessages?.join(", ")} `,
        );
        const currentExecutionId = request.userData?.executionId;
        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.ERROR,
            `Cettire: Request ${request.url} failed! Error(s): ${request.errorMessages?.join(", ")} `,
            {
              url: request.url,
              label: request.label,
              errors: request.errorMessages,
            },
          );
        }
      },

      launchContext: {
        launchOptions: {
          executablePath:
            process.env.CHROME_EXECUTABLE_PATH ||
            "/root/.cache/ms-playwright/chromium-1169/chrome-linux/chrome",
          headless: options.headless !== undefined ? options.headless : true,
          args: [
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-site-isolation-trials",
            "--no-sandbox", // 添加无沙盒模式，有时可解决权限问题
            "--disable-dev-shm-usage", // 解决DevShm不足的问题
          ],
        },
        useChrome: true,
      },
    },
    config,
  ); // 将 config 对象传递给构造函数

  logInfo("Cettire: 爬虫设置完成，开始爬取...");

  await crawler.run(initialRequests);

  logInfo(
    `Cettire 爬虫完成。共收集 ${allScrapedProducts.length} 个商品。会话中处理过的URL总数: ${processedUrls.size}, 处理过的位置总数: ${processedPositions.size}, 最大位置值: ${maxPositionRef.value}`,
  );
  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper finished.Total products collected: ${allScrapedProducts.length}.`,
      {
        processedDetailPages,
        enqueuedDetailPages,
        processedUrls: processedUrls.size,
        processedPositions: processedPositions.size,
        maxPosition: maxPositionRef.value,
        optionsUsed: options, // log the options used for this run
      },
    );
  }

  // 添加最终总结日志，包含去重统计
  logInfo(
    `Cettire 爬虫总结 - 收集商品: ${allScrapedProducts.length}, 处理过的详情页: ${processedDetailPages}, 入队过的URL: ${enqueuedDetailPages}, 会话内URL去重总数: ${processedUrls.size}, 会话内位置去重总数: ${processedPositions.size}, 最大位置值: ${maxPositionRef.value}, 最终入队/目标比: ${enqueuedDetailPages}/${targetMaxProducts}`,
  );

  return allScrapedProducts;
}

/**
 * 智能滚动页面
 */
async function smartScroll(
  page: Page,
  options: { distance: "screen" | number },
): Promise<void> {
  let scrollDistance: number;
  if (options.distance === "screen") {
    const viewportHeight = page.viewportSize()?.height || 800;
    scrollDistance = viewportHeight * 0.8;
    logInfo(`智能滚动：滚动一屏距离约 ${scrollDistance.toFixed(0)} px`);
  } else {
    scrollDistance = options.distance;
    logInfo(`智能滚动：滚动指定距离 ${scrollDistance} px`);
  }

  await page.evaluate((dist) => {
    window.scrollBy({ top: dist, behavior: "smooth" });
  }, scrollDistance);

  await page.waitForTimeout(500 + Math.random() * 500);
}

/**
 * 等待卡片数量增加
 */
async function waitForMoreCards(
  page: Page,
  prevCount: number,
  selector: string,
  timeout: number = 15000, // 增加超时时间
): Promise<boolean> {
  const startTime = Date.now();
  logInfo(`开始等待更多卡片加载，当前数量: ${prevCount}, 超时: ${timeout} ms`);
  while (Date.now() - startTime < timeout) {
    const currentCount = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, selector);

    if (currentCount > prevCount) {
      logInfo(`卡片数量已从 ${prevCount} 增加到 ${currentCount}。`);
      return true;
    }
    await page.waitForTimeout(500); // 增加轮询间隔
  }
  logInfo(`等待更多卡片超时，卡片数量未从 ${prevCount} 增加。`);
  return false;
}

/**
 * 处理商品卡片列表
 */
async function processProductCards(
  productCards: ElementHandle<SVGElement | HTMLElement>[],
  page: Page,
  request: Request<CettireUserData>,
  crawler: PlaywrightCrawler,
  crawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  updateEnqueuedCount: (newCount: number) => void,
  executionId?: string, // 接收 executionId
  batchGender?: string | null,
  processedUrls: Set<string> = new Set(), // URL 去重集合
  startIndex: number = 0, // 处理的起始索引，用于只处理新卡片
  processedPositions: Set<number> = new Set(), // 位置去重集合
  maxPositionRef: { value: number } = { value: 0 }, // 引用类型的最大位置值
): Promise<void> {
  if (page.isClosed()) {
    const msg = `Cettire: 处理商品卡片前页面 ${request.url} 已关闭。跳过。`;
    crawlerLog.warning(msg);
    if (executionId) {
      await sendLogToBackend(executionId, LocalScraperLogLevel.WARN, msg, {
        url: request.url,
      });
    }
    return;
  }

  crawlerLog.info(
    `Cettire: 处理卡片前状态 - 总卡片数: ${productCards.length}, 开始处理索引: ${startIndex}, 当前已入队: ${currentEnqueuedCount}, 目标: ${maxProductsLimit}, 已处理URL数: ${processedUrls.size}, 已处理位置数: ${processedPositions.size}, 最大位置值: ${maxPositionRef.value}`,
  );

  let localEnqueuedCount = currentEnqueuedCount;
  let potentialDetailUrls: {
    url: string;
    plpData: Partial<Product>;
    position?: number;
  }[] = [];
  let skippedDuplicateUrls = 0;
  let skippedDuplicatePositions = 0;
  const processedPositionsInThisBatch = new Set<number>();

  for (let i = startIndex; i < productCards.length; i++) {
    const card = productCards[i];
    const cardIdentifier = `card_idx_${i}_start_idx_${startIndex}_page_url_${request.url.substring(request.url.lastIndexOf("/") + 1)}`;

    if (page.isClosed()) {
      // 增加页面关闭检查
      crawlerLog.warning(
        `Cettire: 卡片 ${cardIdentifier} 处理前页面已关闭，跳过后续卡片处理。`,
      );
      break; // 中断循环
    }

    try {
      // 步骤 1: 将卡片滚动到视图中
      // Ensure card is not detached
      const isConnected = await card.evaluate((node) => node.isConnected);
      if (!isConnected) {
        crawlerLog.warning(
          `Cettire: 卡片 ${cardIdentifier} 已从DOM中分离，跳过。`,
        );
        continue;
      }
      await card.scrollIntoViewIfNeeded();
      crawlerLog.debug(`Cettire: 卡片 ${cardIdentifier} 已滚动到视图。`);

      // 步骤 2: 等待卡片内的图片元素渲染完成
      const imageElement = await card.waitForSelector(SELECTORS.PRODUCT_IMAGE, {
        state: "visible",
        timeout: 5000,
      }); // 等待图片元素可见，5秒超时

      // 步骤 3: (可选但推荐) 检查图片 src 是否为真实 URL
      let imageUrl = await imageElement.getAttribute("src");
      if (!imageUrl || imageUrl.startsWith("data:image")) {
        // 简单检查占位符
        crawlerLog.debug(
          `Cettire: 卡片 ${cardIdentifier} 图片URL ('${imageUrl || "null"}') 疑似占位符，额外等待。`,
        );
        await page.waitForTimeout(1000); // 额外等待1秒
        imageUrl = await imageElement.getAttribute("src"); // 重新获取 image URL
      }
      crawlerLog.debug(
        `Cettire: 卡片 ${cardIdentifier} 内图片元素已渲染 (最终URL: '${imageUrl || "null"}').`,
      );
    } catch (scrollRenderError) {
      crawlerLog.warning(
        `Cettire: 卡片 ${cardIdentifier} 滚动或等待渲染时出错: ${(scrollRenderError as Error).message}`,
      );
      // 根据错误类型和业务需求，可以决定是否跳过此卡片
      // 例如，如果错误是超时，可能表示卡片确实无法正常加载
      // 为保持健壮性，此处选择继续尝试提取卡片的其他文本信息，但图片可能缺失
      // 如果图片是绝对必要的，这里应该 continue;
    }

    try {
      const linkElement = await card.$(SELECTORS.PRODUCT_LINK);

      if (!linkElement) {
        crawlerLog.warning(
          `Cettire: 卡片 ${cardIdentifier} 未找到链接元素 (SELECTOR: ${SELECTORS.PRODUCT_LINK}).`,
        );
        try {
          const cardHtml = await card.innerHTML();
          crawlerLog.debug(
            `Cettire: 卡片 ${cardIdentifier} HTML: ${cardHtml.substring(0, 500)}...`,
          );
          // 截图功能可以根据需要启用，确保路径有效
          // const screenshotPath = path.join(crawler.config.get('storageClientOptions').storageDir || './debug_screenshots', `${cardIdentifier}_no_link.png`);
          // await card.screenshot({ path: screenshotPath });
        } catch (debugError) {
          crawlerLog.error(
            `Cettire: 记录卡片 ${cardIdentifier} (无链接) 调试信息时出错: ${debugError}`,
          );
        }
        continue;
      }

      const href = await linkElement.getAttribute("href");
      const positionAttr = await linkElement.getAttribute("position");
      const positionNum = positionAttr ? parseInt(positionAttr, 10) : null;

      // 每 20 个卡片记录一次位置日志 (如果 positionNum 有效)
      if (positionNum !== null && i % 20 === 0) {
        crawlerLog.info(`Cettire: 当前处理卡片索引 ${i}, 位置 ${positionNum}`);
      }

      if (!href || positionNum === null) {
        crawlerLog.warning(
          `Cettire: 卡片 ${cardIdentifier} (链接元素找到) 缺少 href 或 position. Href: ${href}, Position Attribute: ${positionAttr}`,
        );
        try {
          const linkHtml = await linkElement.innerHTML();
          crawlerLog.debug(
            `Cettire: 卡片 ${cardIdentifier} 链接元素 HTML: ${linkHtml.substring(0, 500)}...`,
          );
          // const screenshotPath = path.join(crawler.config.get('storageClientOptions').storageDir || './debug_screenshots', `${cardIdentifier}_missing_attr.png`);
          // await card.screenshot({ path: screenshotPath });
        } catch (debugError) {
          crawlerLog.error(
            `Cettire: 记录卡片 ${cardIdentifier} (链接存在但缺少属性) 调试信息时出错: ${debugError}`,
          );
        }
        if (!href) continue; // 如果没有href，则无法继续
        // 如果只有position缺失，但href存在，我们仍然可以尝试基于URL去重，但位置相关的逻辑会受影响
      }

      // 更新最大位置值 (仅当 positionNum 有效时)
      if (positionNum !== null && positionNum > maxPositionRef.value) {
        maxPositionRef.value = positionNum;
      }

      // 位置去重检查 (仅当 positionNum 有效时)
      if (positionNum !== null && processedPositions.has(positionNum)) {
        skippedDuplicatePositions++;
        if (
          skippedDuplicatePositions % 10 === 1 ||
          skippedDuplicatePositions === 1
        ) {
          // Log first and then every 10th
          crawlerLog.debug(
            // Changed to debug to reduce noise unless specifically looking for this
            `Cettire: 已跳过 ${skippedDuplicatePositions} 个会话内重复位置，如: ${positionNum} (卡片 ${cardIdentifier})`,
          );
        }
        continue;
      }

      const productUrl = `https://www.cettire.com${href}`; // href 在此之前已验证存在
      // URL 去重检查
      if (processedUrls.has(productUrl)) {
        skippedDuplicateUrls++;
        if (skippedDuplicateUrls % 10 === 1 || skippedDuplicateUrls === 1) {
          crawlerLog.debug(
            // Changed to debug
            `Cettire: 已跳过 ${skippedDuplicateUrls} 个会话内重复URL，如: ${productUrl} (卡片 ${cardIdentifier})`,
          );
        }
        continue;
      }

      // 如果通过所有检查:
      // 1. 添加到 processedUrls
      processedUrls.add(productUrl);
      // 2. 如果 positionNum 有效, 添加到 processedPositions 和 processedPositionsInThisBatch
      if (positionNum !== null) {
        processedPositions.add(positionNum);
        processedPositionsInThisBatch.add(positionNum);
      }

      // const plpExtractedData: Partial<Product> = {
      //   source: "Cettire" as ECommerceSite,
      //   tags: [`gender:${batchGender || "unknown"}`, "Cettire"],
      //   gender: batchGender as "women" | "men" | string | null,
      //   metadata: { executionId, position: positionNum !== null ? positionNum : undefined }, // 添加 position 到元数据
      // };

      const initialTags = ["Cettire"];
      if (batchGender && batchGender !== "unknown") {
        // 确保 batchGender 有意义
        initialTags.unshift(batchGender);
      }

      const plpExtractedData: Partial<Product> = {
        source: "Cettire" as ECommerceSite,
        tags: initialTags, // 使用清理后的标签
        gender: batchGender as "women" | "men" | string | null,
        metadata: {
          executionId,
          position: positionNum !== null ? positionNum : undefined,
        },
      };

      const brandElement = await card.$(SELECTORS.PRODUCT_BRAND);
      if (brandElement) {
        plpExtractedData.brand = (await brandElement.textContent())?.trim();
      }

      const nameElement = await card.$(SELECTORS.PRODUCT_NAME);
      if (nameElement) {
        plpExtractedData.name = (await nameElement.textContent())?.trim();
      }

      const priceElement = await card.$(SELECTORS.PRODUCT_PRICE);
      if (priceElement) {
        const priceText = (await priceElement.textContent()) || "";
        const price = cleanPrice(priceText);
        plpExtractedData.currentPrice = { amount: price, currency: "USD" };
      }

      const originalPriceElement = await card.$(
        SELECTORS.PRODUCT_ORIGINAL_PRICE,
      );
      if (originalPriceElement) {
        const originalPriceText =
          (await originalPriceElement.textContent()) || "";
        const originalPrice = cleanPrice(originalPriceText);
        if (originalPrice > 0) {
          plpExtractedData.originalPrice = {
            amount: originalPrice,
            currency: "USD",
          };
        }
      }

      const imageElement = await card.$(SELECTORS.PRODUCT_IMAGE);
      if (imageElement) {
        const imageUrl = (await imageElement.getAttribute("src")) || "";
        if (imageUrl) {
          plpExtractedData.images = [imageUrl];
        }
      }

      potentialDetailUrls.push({
        url: productUrl,
        plpData: plpExtractedData,
        position: positionNum !== null ? positionNum : undefined, // 确保 position 也被添加到这里
      });
    } catch (error) {
      crawlerLog.error(`Cettire: 处理卡片 ${cardIdentifier} 时出错: ${error}`);
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Cettire: Error processing card ${cardIdentifier} on ${request.url}: ${(error as Error).message}`,
          {
            stack: (error as Error).stack,
            itemHTMLBrief: (await card.innerHTML()).substring(0, 200),
          },
        );
      }
    }
  }

  if (potentialDetailUrls.length > 0 && executionId) {
    const urlsToCheck = potentialDetailUrls.map((p) => p.url);
    let existingUrls: string[] = [];

    try {
      const BATCH_EXISTS_API_ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_API_URL
        ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/internal/products/batch-exists`
        : "http://localhost:3001/api/internal/products/batch-exists";

      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.DEBUG,
        `Cettire: Calling batch-exists API for ${urlsToCheck.length} URLs. Endpoint: ${BATCH_EXISTS_API_ENDPOINT}`,
        { count: urlsToCheck.length },
      );

      const response = await fetch(BATCH_EXISTS_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsToCheck, source: "Cettire" }),
      });

      if (response.ok) {
        const data = await response.json();
        existingUrls = data.existingUrls || [];
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.DEBUG,
          `Cettire: Batch-exists API returned ${existingUrls.length} existing URLs.`,
          {
            existingCount: existingUrls.length,
            checkedCount: urlsToCheck.length,
          },
        );
      } else {
        const errorText = await response.text();
        const msg = `Cettire: Batch - exists API call failed.Status: ${response.status}.`;
        crawlerLog.error(msg, { responseBody: errorText.substring(0, 500) });
        await sendLogToBackend(executionId, LocalScraperLogLevel.ERROR, msg, {
          status: response.status,
          responseBodyBrief: errorText.substring(0, 500),
        });
      }
    } catch (apiError: unknown) {
      const error = apiError as Error;
      const msg = `Cettire: Error calling batch-exists API: ${error.message}`;
      crawlerLog.error(msg, { stack: error.stack });
      await sendLogToBackend(executionId, LocalScraperLogLevel.ERROR, msg, {
        stack: error.stack,
      });
    }

    const filteredPotentialDetailUrls = potentialDetailUrls.filter((item) => {
      if (existingUrls.includes(item.url)) {
        if (executionId) {
          sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `Cettire: Skipping already existing URL from PLP: ${item.url}`,
            { url: item.url },
          );
        }
        return false;
      }
      return true;
    });
    // Use filteredPotentialDetailUrls for enqueuing
    potentialDetailUrls = filteredPotentialDetailUrls;

    const skippedCount = urlsToCheck.length - potentialDetailUrls.length;
    if (skippedCount > 0) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Cettire: Skipped ${skippedCount} URLs from PLP processing due to batch-exists filter.`,
        {
          initialPotentialCount: urlsToCheck.length,
          afterFilteringCount: potentialDetailUrls.length,
          skippedCount: skippedCount,
          listPageUrl: request.url,
        },
      );
    }
  }

  let successfullyEnqueued = 0;
  for (const item of potentialDetailUrls) {
    if (localEnqueuedCount >= maxProductsLimit) {
      crawlerLog.info(`Cettire: 已达到最大商品入队限制(${maxProductsLimit})`);
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `Cettire: Reached max product enqueue limit(${maxProductsLimit}) in processProductCards.`,
          { localEnqueuedCount, maxProductsLimit },
        );
      }
      break;
    }

    try {
      // 记录 URL 已处理到会话级去重集合中
      processedUrls.add(item.url);

      crawlerLog.info(
        `Cettire: 将详情页加入队列: ${item.url}${item.position !== undefined ? ` (position: ${item.position})` : ""}`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.DEBUG,
          `Cettire: Enqueuing detail page: ${item.url}`,
          {
            url: item.url,
            plpName: item.plpData?.name,
            position: item.position,
          },
        );
      }
      const newUserData: CettireUserData = {
        ...request.userData,
        plpData: item.plpData,
        label: "DETAIL",
        batchGender: batchGender,
        executionId: executionId, // 传递 executionId
      };
      await crawler.addRequests([
        {
          url: item.url,
          label: "DETAIL",
          userData: newUserData,
        },
      ]);
      localEnqueuedCount++;
      successfullyEnqueued++;
    } catch (error) {
      crawlerLog.error(
        `Cettire: 将详情页加入队列时出错: ${item.url}, ${error}`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Cettire: Error enqueuing detail page ${item.url}: ${(error as Error).message} `,
          { stack: (error as Error).stack, url: item.url },
        );
      }
    }
  }

  updateEnqueuedCount(localEnqueuedCount);

  // 添加处理完成后的状态总结
  crawlerLog.info(
    `Cettire: processProductCards 完成 - 本批处理卡片数: ${productCards.length - startIndex}, 跳过重复URL: ${skippedDuplicateUrls}, 跳过重复Position: ${skippedDuplicatePositions}, 本批新处理Positions: ${processedPositionsInThisBatch.size}, 待检查URLs: ${potentialDetailUrls.length}, 成功入队(本轮): ${successfullyEnqueued}, 当前总入队: ${localEnqueuedCount}/${maxProductsLimit}, 已处理Positions总数: ${processedPositions.size}, 最大Position: ${maxPositionRef.value}`,
  );
}

/**
 * 处理加载更多按钮
 */
async function handleLoadMoreButton(
  page: Page,
  initialProductCards: ElementHandle<SVGElement | HTMLElement>[], // 接收初始卡片用于比较
  request: Request<CettireUserData>,
  crawler: PlaywrightCrawler,
  crawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  updateEnqueuedCount: (newCount: number) => void,
  executionId?: string, // 接收 executionId
  batchGender?: string | null,
  scraperOptions?: ScraperOptions, // 接收 scraperOptions
  processedUrls: Set<string> = new Set(), // 新增: URL 去重集合
  processedPositions: Set<number> = new Set(), // 传递位置去重集合
  maxPositionRef: { value: number } = { value: 0 }, // 传递最大位置值
): Promise<void> {
  let localEnqueuedCount = currentEnqueuedCount;
  let loadMoreClickCount = 0;
  const MAX_LOAD_MORE_CLICKS = scraperOptions?.maxLoadClicks || 10; // 使用 scraperOptions 中的值
  let scrollAttemptsWithoutNewProduct = 0;
  const MAX_SCROLL_ATTEMPTS_WITHOUT_NEW = 3;
  let lastCardCount = initialProductCards.length;

  // 添加详细日志，展示当前状态
  crawlerLog.info(
    `Cettire: 处理"加载更多"前的状态 - 已入队商品: ${localEnqueuedCount}, 目标: ${maxProductsLimit}, 当前页面卡片数: ${lastCardCount}, 已处理URL数: ${processedUrls.size}, 已处理位置数: ${processedPositions.size}, 最大位置值: ${maxPositionRef.value}`,
  );

  // 如果已经处理的位置数接近或超过最大位置值，可能不需要继续加载
  if (
    maxPositionRef.value > 0 &&
    processedPositions.size >= maxPositionRef.value * 0.9
  ) {
    crawlerLog.info(
      `Cettire: 已处理位置数(${processedPositions.size})接近最大位置值(${maxPositionRef.value})，可能已经处理了大部分商品。`,
    );
  }

  while (
    localEnqueuedCount < maxProductsLimit &&
    loadMoreClickCount < MAX_LOAD_MORE_CLICKS
  ) {
    await smartScroll(page, { distance: "screen" });

    const loadMoreButton = await page.$(SELECTORS.LOAD_MORE_BUTTON);
    if (!loadMoreButton || !(await loadMoreButton.isVisible())) {
      scrollAttemptsWithoutNewProduct++;
      if (scrollAttemptsWithoutNewProduct >= MAX_SCROLL_ATTEMPTS_WITHOUT_NEW) {
        crawlerLog.info(
          `Cettire: 连续 ${MAX_SCROLL_ATTEMPTS_WITHOUT_NEW} 次滚动未发现"加载更多"按钮，可能已无更多商品。`,
        );
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.INFO,
            `Cettire: Load more button not found after ${MAX_SCROLL_ATTEMPTS_WITHOUT_NEW} scroll attempts.Assuming no more products.`,
            {
              url: request.url,
              scrollAttempts: scrollAttemptsWithoutNewProduct,
            },
          );
        }
        break;
      }
      await page.waitForTimeout(1000); // 等待一下再尝试
      continue;
    }

    scrollAttemptsWithoutNewProduct = 0;
    loadMoreClickCount++;

    crawlerLog.info(`Cettire: 点击"加载更多"按钮，第 ${loadMoreClickCount} 次`);

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.DEBUG,
        `Cettire: Clicking "Load More" button, attempt #${loadMoreClickCount} `,
        { url: request.url, clickCount: loadMoreClickCount },
      );
    }

    try {
      await loadMoreButton.click();
      await page.waitForTimeout(7000); // 增加等待时间

      const newCardsLoaded = await waitForMoreCards(
        page,
        lastCardCount, // 与上一次的卡片数量比较
        SELECTORS.PRODUCT_CARD,
        20000, // 增加超时
      );

      const currentProductCardsOnPage = await page.$$(SELECTORS.PRODUCT_CARD);
      const newCardCount = currentProductCardsOnPage.length;

      // 非常关键的修改：只处理新增的卡片
      if (newCardsLoaded && newCardCount > lastCardCount) {
        crawlerLog.info(
          `Cettire: "加载更多"后，商品卡片数量从 ${lastCardCount} 增加到 ${newCardCount}, 将处理新增的 ${newCardCount - lastCardCount} 个卡片`,
        );

        // 获取加载前后的位置统计，用于比较
        const positionsBeforeCount = processedPositions.size;

        // 只处理从 lastCardCount 索引开始的新卡片
        await processProductCards(
          currentProductCardsOnPage,
          page,
          request,
          crawler,
          crawlerLog,
          maxProductsLimit,
          localEnqueuedCount,
          (newCount: number) => {
            localEnqueuedCount = newCount;
          },
          executionId,
          batchGender,
          processedUrls,
          lastCardCount, // 起始索引，只处理新卡片
          processedPositions, // 传递位置去重集合
          maxPositionRef, // 传递最大位置值
        );

        // 记录新增的位置数量
        const newPositionsCount =
          processedPositions.size - positionsBeforeCount;

        crawlerLog.info(
          `Cettire: 本次加载新增了 ${newPositionsCount} 个唯一位置，当前最大位置值: ${maxPositionRef.value}`,
        );

        lastCardCount = newCardCount; // 更新卡片计数
      } else {
        crawlerLog.warning(
          `Cettire: "加载更多"后未检测到新商品加载(或卡片数量未增加)`,
        );
      }

      // 检查是否已处理的位置足够多，或者已处理位置数接近最大位置值
      if (
        maxPositionRef.value > 0 &&
        (processedPositions.size >= maxProductsLimit * 2 ||
          processedPositions.size >= maxPositionRef.value * 0.9)
      ) {
        crawlerLog.info(
          `Cettire: 已处理足够多的位置 (${processedPositions.size}/${maxPositionRef.value})，停止加载更多。`,
        );
        break;
      }
    } catch (error) {
      crawlerLog.error(`Cettire: 点击"加载更多"按钮时出错: ${error} `);
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Cettire: Error clicking "Load More" button: ${(error as Error).message} `,
          {
            stack: (error as Error).stack,
            url: request.url,
            clickCount: loadMoreClickCount,
          },
        );
      }
      break;
    }

    if (localEnqueuedCount >= maxProductsLimit) {
      crawlerLog.info(`Cettire: 已达到最大商品入队限制(${maxProductsLimit})`);
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `Cettire: Reached max product enqueue limit(${maxProductsLimit}) in handleLoadMoreButton.`,
          {
            localEnqueuedCount,
            maxProductsLimit,
            clickCount: loadMoreClickCount,
          },
        );
      }
      break;
    }
  }

  if (loadMoreClickCount >= MAX_LOAD_MORE_CLICKS && executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `Cettire: Reached max load more clicks limit(${MAX_LOAD_MORE_CLICKS}).`,
      { clickCount: loadMoreClickCount, url: request.url },
    );
  }

  // 添加最终状态日志
  crawlerLog.info(
    `Cettire: "加载更多"处理完成 - 点击次数: ${loadMoreClickCount}/${MAX_LOAD_MORE_CLICKS}, 当前入队商品数: ${localEnqueuedCount}/${maxProductsLimit}, 已处理URL总数: ${processedUrls.size}, 已处理位置总数: ${processedPositions.size}, 最大位置值: ${maxPositionRef.value}`,
  );

  updateEnqueuedCount(localEnqueuedCount);
}

/**
 * 从 Cettire 网站抓取商品数据 (向后兼容函数)
 */
export async function scrapeCettire(
  startUrls: string | string[] = [
    "https://www.cettire.com/collections/women",
    "https://www.cettire.com/collections/men",
  ],
  options: ScraperOptions & { screenshotOnly?: boolean } = {},
  executionId?: string,
): Promise<Product[]> {
  return scrapeCettireWithCrawler(startUrls, options, executionId);
}

export default scrapeCettireWithCrawler;
