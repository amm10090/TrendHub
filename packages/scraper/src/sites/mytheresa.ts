// packages/scraper/src/sites/mytheresa.ts
import {
  PlaywrightCrawler,
  Configuration,
  log as crawleeLog,
  type Request,
  type Log,
  type PlaywrightCrawlingContext,
  type PlaywrightLaunchContext,
} from "crawlee";
import type { Page, Locator } from "playwright";
import type { Product, ECommerceSite, Price } from "@repo/types";
import * as path from "path";
import * as fs from "fs";
import type { ScraperOptions } from "../main.js";
import { sendLogToBackend, LocalScraperLogLevel } from "../utils.js";

interface MytheresaUserData {
  executionId?: string;
  plpData?: Partial<Product>;
  label?: string;
  batchGender?: "women" | "men" | "unisex" | string | null; // For carrying over determined gender
  originUrl?: string; // 新增：获取原始URL
}

// 新增：User-Agent 池 - 使用最新的真实浏览器标识
const USER_AGENTS = [
  // Chrome on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",

  // Chrome on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",

  // Edge on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",

  // Firefox on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",

  // Safari on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

// 新增：随机延迟函数
function getRandomDelay(min: number = 2000, max: number = 8000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 新增：随机选择User-Agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 新增：模拟人类行为的随机操作
async function simulateHumanBehavior(page: Page, log: Log): Promise<void> {
  try {
    // 随机滚动
    const scrollDelay = getRandomDelay(1000, 3000);
    await page.waitForTimeout(scrollDelay);

    // 模拟渐进式滚动
    const viewportSize = await page.viewportSize();
    if (viewportSize) {
      const scrollDistance = Math.random() * viewportSize.height * 0.5;
      await page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, scrollDistance);
    }

    // 随机暂停
    const pauseDelay = getRandomDelay(500, 2000);
    await page.waitForTimeout(pauseDelay);

    // 偶尔模拟鼠标移动
    if (Math.random() < 0.3) {
      const x = Math.random() * (viewportSize?.width || 1920);
      const y = Math.random() * (viewportSize?.height || 1080);
      await page.mouse.move(x, y);
    }

    log.debug("Simulated human behavior - scrolling and random actions");
  } catch (error) {
    log.warning(`Error simulating human behavior: ${(error as Error).message}`);
  }
}

// 新增：增强的浏览器指纹隐藏
function getEnhancedBrowserArgs(): string[] {
  return [
    // 基础安全参数
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",

    // 窗口设置
    "--window-size=1920,1080",
    "--start-maximized",

    // 反检测参数 - 更强的隐藏
    "--disable-blink-features=AutomationControlled",
    "--disable-features=VizDisplayCompositor",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-background-timer-throttling",
    "--disable-features=TranslateUI",
    "--disable-component-extensions-with-background-pages",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-plugins",
    "--disable-popup-blocking",
    "--disable-hang-monitor",
    "--disable-prompt-on-repost",
    "--disable-sync",
    "--disable-translate",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--disable-breakpad",
    "--disable-client-side-phishing-detection",
    "--disable-component-update",
    "--disable-domain-reliability",
    "--disable-logging",
    "--disable-speech-api",
    "--disable-background-networking",
    "--disable-background-sync",
    "--disable-permissions-api",
    "--disable-notifications",

    // 性能优化 - 移除禁用图片，因为这可能被检测
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pings",
    "--no-zygote",
    "--single-process",

    // 语言和地区设置
    "--lang=en-US",
    "--accept-lang=en-US,en;q=0.9",

    // 新增：更真实的浏览器行为
    "--enable-automation", // 反直觉，但有时这样反而不会被检测
    "--disable-blink-features=AutomationControlled",
    "--exclude-switches=enable-automation",
    "--disable-extensions-file-access-check",
    "--disable-extensions-http-throttling",
    "--aggressive-cache-discard",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-client-side-phishing-detection",
    "--disable-crash-reporter",
    "--disable-oopr-debug-crash-dump",
    "--no-crash-upload",
    "--disable-low-res-tiling",
    "--log-level=3",
    "--silent",
  ];
}

function ensureDirectoryExists(
  dirPath: string,
  logger: Log = crawleeLog,
): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    logger.error(
      `Error creating directory ${dirPath}: ${(error as Error).message}`,
    );
    throw error;
  }
}

// Helper function to infer gender from URL, specific to Mytheresa's URL structure
function inferGenderFromMytheresaUrl(url: string): "women" | "men" | null {
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

  // Determine batchGender based on the first startUrl
  const firstStartUrl = Array.isArray(startUrls) ? startUrls[0] : startUrls;
  const batchGender = firstStartUrl
    ? inferGenderFromMytheresaUrl(firstStartUrl)
    : null;

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper started with enhanced anti-detection.`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
        inferredBatchGender: batchGender,
        userAgentPool: USER_AGENTS.length,
      },
    );
  }

  const allScrapedProducts: Product[] = [];
  const maxRequests = options.maxRequests || 90;
  const maxLoadClicks = options.maxLoadClicks || 10;

  // 新增：计算每个URL的商品数量限制
  const startUrlsArray = Array.isArray(startUrls) ? startUrls : [startUrls];
  const totalMaxProducts = options.maxProducts || 1000;
  const maxProductsPerUrl = Math.ceil(totalMaxProducts / startUrlsArray.length);

  // 新增：为每个URL维护独立的计数器
  const urlProductCounts = new Map<
    string,
    { processedDetailPages: number; enqueuedDetailPages: number }
  >();

  // 初始化每个URL的计数器
  startUrlsArray.forEach((url) => {
    urlProductCounts.set(url, {
      processedDetailPages: 0,
      enqueuedDetailPages: 0,
    });
  });

  let processedDetailPages = 0;
  let enqueuedDetailPages = 0;

  const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  crawleeLog.info(
    `Mytheresa: Storage directory for this run set to: ${runSpecificStorageDir}`,
  );

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
  process.env.CRAWLEE_STORAGE_DIR = runSpecificStorageDir;

  const config = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  const crawler = new PlaywrightCrawler(
    {
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      // 新增：减少并发数量以降低检测风险
      maxConcurrency: options.maxConcurrency || 1, // 单线程爬取
      // 新增：请求间隔
      minConcurrency: 1,
      maxRequestRetries: 3,
      async requestHandler(
        context: PlaywrightCrawlingContext<MytheresaUserData>,
      ) {
        const {
          request,
          page,
          log: localCrawlerLog,
          crawler,
          pushData,
        } = context;
        const currentExecutionId = request.userData?.executionId;
        const requestLabel = request.userData?.label || request.label;
        const currentBatchGender = request.userData?.batchGender; // Get gender from request
        const originUrl = request.userData?.originUrl; // 新增：获取原始URL

        // 新增：每个请求开始时的随机延迟
        const initialDelay = getRandomDelay(3000, 8000);
        await page.waitForTimeout(initialDelay);
        localCrawlerLog.info(
          `Waited ${initialDelay}ms before processing ${request.url}`,
        );

        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.INFO,
            `Processing URL: ${request.url}`,
            { label: requestLabel, delay: initialDelay },
          );
        }
        localCrawlerLog.info(
          `Mytheresa: Processing ${request.url}... (Label: ${requestLabel})`,
        );

        try {
          // 新增：模拟人类行为
          await simulateHumanBehavior(page, localCrawlerLog);

          if (requestLabel === "DETAIL") {
            // 获取当前URL对应的计数器
            const urlCounters = originUrl
              ? urlProductCounts.get(originUrl)
              : null;
            if (urlCounters) {
              urlCounters.processedDetailPages++;
            }
            processedDetailPages++;

            localCrawlerLog.info(
              `Mytheresa: Identified as a DETAIL page: ${request.url} (总: ${processedDetailPages}, 当前URL: ${urlCounters?.processedDetailPages || 0}/${maxProductsPerUrl})`,
            );
            const plpData = request.userData?.plpData;

            // 新增：基于实际商品URL推断gender，而不是使用全局batchGender
            const actualGender =
              inferGenderFromMytheresaUrl(request.url) ||
              currentBatchGender ||
              plpData?.gender;

            const product: Product = {
              source: "Mytheresa" as ECommerceSite,
              url: request.url,
              scrapedAt: new Date(),
              name: plpData?.name,
              brand: plpData?.brand,
              images: plpData?.images,
              sizes: plpData?.sizes,
              tags: plpData?.tags,
              gender: actualGender, // 使用基于实际URL推断的gender
              materialDetails: [],
              metadata: {},
            };

            try {
              const urlPath = new URL(request.url).pathname;
              const pathSegments = urlPath.split("-");
              if (pathSegments.length > 0) {
                const lastSegment = pathSegments[pathSegments.length - 1];
                const skuMatch = lastSegment.match(/^(p\d+)$/i);
                if (skuMatch && skuMatch[1]) {
                  product.sku = skuMatch[1].toLowerCase();
                }
              }
            } catch (e) {
              localCrawlerLog.warning(
                `Mytheresa: Could not parse SKU from URL ${request.url}: ${(e as Error).message}`,
              );
            }

            // 新增：等待页面完全加载
            await page.waitForLoadState("networkidle");

            product.brand =
              (
                await page
                  .locator(".product__area__branding__designer__link")
                  .textContent()
              )?.trim() || product.brand;
            product.name =
              (
                await page
                  .locator(".product__area__branding__name")
                  .textContent()
              )?.trim() || product.name;

            // 新增：随机延迟后再继续
            await page.waitForTimeout(getRandomDelay(1000, 3000));

            // 抓取描述、材质、颜色等详细信息
            const detailsAccordionContent = page.locator(
              "div.accordion__item--active div.accordion__body__content",
            );
            if (await detailsAccordionContent.isVisible()) {
              let productDescriptionText: string | undefined;

              // 尝试获取第一个 <p> 标签的内容
              const mainDescriptionP = detailsAccordionContent
                .locator("p")
                .first();
              if (await mainDescriptionP.isVisible()) {
                const pText = (await mainDescriptionP.textContent())?.trim();
                if (pText) {
                  // 检查 pText 是否非空
                  productDescriptionText = pText;
                }
              }

              // 如果 <p> 标签内容为空，则尝试从 <ul> 中提取内容作为描述
              if (!productDescriptionText) {
                const listItems = await detailsAccordionContent
                  .locator("ul > li")
                  .allTextContents();
                // 过滤掉空字符串或不必要的细节，然后拼接
                const relevantListItems = listItems
                  .map((item) => item.trim())
                  .filter(
                    (item) =>
                      item.length > 0 &&
                      !item.toLowerCase().includes("item number:"),
                  );
                if (relevantListItems.length > 0) {
                  productDescriptionText = relevantListItems.join(". "); // 用句号和空格分隔各项
                }
              }

              product.description = productDescriptionText; // 最终赋值

              // 提取 materialDetails (无论描述如何提取，这个字段都应填充)
              const allDetailListItems = await detailsAccordionContent
                .locator("ul li")
                .allTextContents();
              product.materialDetails = allDetailListItems
                .map((item) => item.trim())
                .filter((item) => item.length > 0);

              // 从 materialDetails 解析 material 和 color (保持现有逻辑)
              for (const itemText of product.materialDetails) {
                if (itemText.toLowerCase().startsWith("material:")) {
                  product.material = itemText
                    .substring("material:".length)
                    .trim();
                }
                if (itemText.toLowerCase().startsWith("designer color name:")) {
                  product.color = itemText
                    .substring("designer color name:".length)
                    .trim();
                } else if (
                  !product.color &&
                  itemText.toLowerCase().startsWith("item color:")
                ) {
                  product.color = itemText
                    .substring("item color:".length)
                    .trim();
                }
              }
            }

            // 抓取面包屑
            const breadcrumbLinks = await page
              .locator(
                "div.breadcrumb div.breadcrumb__item a.breadcrumb__item__link",
              )
              .all();
            const breadcrumbTexts = await Promise.all(
              breadcrumbLinks.map(async (link) =>
                (await link.textContent())?.trim(),
              ),
            );
            product.breadcrumbs = breadcrumbTexts.filter(Boolean) as string[];

            // 抓取价格
            const priceContainer = page.locator("div.productinfo__price");
            const parsePrice = (
              priceText: string | null,
            ): Price | undefined => {
              if (!priceText) return undefined;
              const amountMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
              const amount = amountMatch
                ? parseFloat(amountMatch[0].replace(/,/g, ""))
                : undefined;
              if (amount === undefined) return undefined;
              // Assuming USD for now, as currency symbol isn't always consistently extractable or present with the value.
              // Mytheresa URL often indicates region, e.g., /us/en/
              let currency = "USD"; // Default
              if (
                priceText.includes("€") ||
                request.url.includes("/de/") ||
                request.url.includes("/fr/") ||
                request.url.includes("/it/")
              )
                currency = "EUR";
              if (priceText.includes("£") || request.url.includes("/gb/"))
                currency = "GBP";
              // Add more currency detections if needed
              return { amount, currency };
            };

            const discountPriceEl = priceContainer.locator(
              "span.pricing__prices__value--discount span.pricing__prices__price",
            );
            const originalPriceEl = priceContainer.locator(
              "span.pricing__prices__value--original span.pricing__prices__price",
            );

            let currentPriceText: string | null = null;
            let originalPriceText: string | null = null;

            if (
              await discountPriceEl
                .isVisible({ timeout: 5000 })
                .catch(() => false)
            ) {
              currentPriceText = await discountPriceEl.textContent();
              if (
                await originalPriceEl
                  .isVisible({ timeout: 5000 })
                  .catch(() => false)
              ) {
                originalPriceText = await originalPriceEl.textContent();
              }
            } else if (
              await originalPriceEl
                .isVisible({ timeout: 5000 })
                .catch(() => false)
            ) {
              currentPriceText = await originalPriceEl.textContent();
              // originalPriceText remains null or could be set equal to currentPriceText if business logic dictates
            }

            product.currentPrice = parsePrice(currentPriceText);
            product.originalPrice = parsePrice(originalPriceText);
            // If originalPrice is same as currentPrice, and there was a discount span, it means the original was actually different.
            // If no discount span, and originalPriceText was used for current, then actual originalPrice should be null or same.
            // For simplicity, if originalPriceText is parsed and it's the same as currentPrice, make originalPrice undefined unless a discount was explicitly shown
            if (
              product.originalPrice &&
              product.currentPrice &&
              product.originalPrice.amount === product.currentPrice.amount &&
              !(await discountPriceEl
                .isVisible({ timeout: 1000 })
                .catch(() => false))
            ) {
              product.originalPrice = undefined; // Or set based on explicit business rule
            }

            // 抓取图片
            const imageLocators = await page
              .locator(
                "div.photocarousel__items div.swiper-slide img.product__gallery__thumbscarousel__image",
              )
              .all();
            if (imageLocators.length > 0) {
              const imageUrls = await Promise.all(
                imageLocators.map(async (img) =>
                  (await img.getAttribute("src"))?.trim(),
                ),
              );
              product.images = [
                ...new Set(imageUrls.filter(Boolean) as string[]),
              ];
            }
            // If no images found on PDP, keep plpData.images (already assigned at product init)

            if (!product.sku) {
              const skuMissingMsg = `Failed to extract SKU for URL: ${request.url}.`;
              localCrawlerLog.warning("Mytheresa: " + skuMissingMsg);
              if (currentExecutionId)
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  skuMissingMsg,
                  { url: request.url },
                );
            }

            localCrawlerLog.info(
              `Mytheresa: Product data extracted for ${product.name ?? product.url}, pushing to dataset.`,
            );
            await pushData(product);
            allScrapedProducts.push(product);

            if (
              urlCounters &&
              urlCounters.processedDetailPages >= maxProductsPerUrl
            ) {
              localCrawlerLog.info(
                `Mytheresa: Reached max products limit (${maxProductsPerUrl}) for URL starting from ${originUrl}.`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Reached max products limit (${maxProductsPerUrl}) for specific URL.`,
                  {
                    originUrl,
                    processedForUrl: urlCounters.processedDetailPages,
                  },
                );
              }
              // 不停止整个爬虫，只是不再为这个URL添加新的详情页
            }
          } else {
            // LIST page
            localCrawlerLog.info(
              `Mytheresa: Identified as a LIST page: ${request.url}`,
            );

            // 新增：等待页面完全加载
            await page.waitForLoadState("networkidle");

            // 更新选择器策略：尝试多个可能的选择器
            let productItems: Locator[] = [];
            let usedSelector = "";
            const possibleSelectors = [
              "div.item",
              'div[data-testid="product-card"]',
              'div[class*="product"]',
              "article",
              ".product-card",
              ".product-item",
              'a[href*="/p"]',
              "div.list__container div",
              'div[class*="list"] div[class*="item"]',
              '[data-cy*="product"]',
            ];

            for (const selector of possibleSelectors) {
              try {
                const items = await page.locator(selector).all();
                if (items.length > 0) {
                  localCrawlerLog.info(
                    `Mytheresa: Found ${items.length} items with selector "${selector}"`,
                  );
                  productItems = items;
                  usedSelector = selector;
                  break;
                }
              } catch {
                // 忽略选择器错误，继续尝试下一个
              }
            }

            if (productItems.length === 0) {
              localCrawlerLog.warning(
                `Mytheresa: No products found with any selector. Page might be blocked or structure changed.`,
              );
              // 截图调试
              await page.screenshot({
                path: `mytheresa-no-products-${Date.now()}.png`,
                fullPage: true,
              });
            }
            localCrawlerLog.info(
              `Mytheresa: Found ${productItems.length} product items initially on ${request.url}`,
            );

            // 获取当前LIST页面对应的原始URL
            const currentOriginUrl = request.userData?.originUrl || request.url;
            const currentUrlCounters = urlProductCounts.get(currentOriginUrl);

            await processProductItems(
              productItems,
              page,
              request,
              crawler,
              localCrawlerLog,
              maxProductsPerUrl, // 使用每个URL的限制
              currentUrlCounters?.enqueuedDetailPages || 0,
              (newCount) => {
                if (currentUrlCounters) {
                  currentUrlCounters.enqueuedDetailPages = newCount;
                }
                // 更新总计数
                enqueuedDetailPages = Array.from(
                  urlProductCounts.values(),
                ).reduce((sum, counts) => sum + counts.enqueuedDetailPages, 0);
              },
              currentExecutionId,
              currentOriginUrl, // 传递原始URL
            );

            if (
              currentUrlCounters &&
              currentUrlCounters.enqueuedDetailPages >= maxProductsPerUrl
            ) {
              localCrawlerLog.info(
                `Mytheresa: Reached max products enqueue limit (${maxProductsPerUrl}) for URL ${currentOriginUrl}, not loading more.`,
              );
              if (currentExecutionId)
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Reached max products enqueue limit (${maxProductsPerUrl}) for specific URL.`,
                  { originUrl: currentOriginUrl },
                );
              return;
            }

            let loadMoreClickedCount = 0;
            const maxLoadMoreClicksVal = maxLoadClicks;

            const extractViewedCount = (text: string): number | null => {
              const match = text.match(
                /You've viewed (\d+) (?:out of|of) (\d+) products/i,
              );
              return match && match[1] ? parseInt(match[1], 10) : null;
            };

            while (true) {
              const loadMoreButtonSelector =
                'div.loadmore__button > a.button--active:has-text("Show more")';
              const loadMoreButton = page.locator(loadMoreButtonSelector);
              const loadMoreInfoSelector = "div.loadmore__info";
              const loadMoreInfoElement = page.locator(loadMoreInfoSelector);
              let allItemsLoaded = false;
              let currentViewedCountBeforeClick: number | null = null;

              if (await loadMoreInfoElement.isVisible()) {
                const infoText =
                  (await loadMoreInfoElement.textContent()) || "";
                currentViewedCountBeforeClick = extractViewedCount(infoText);
                const match = infoText.match(
                  /You've viewed (\d+) (?:out of|of) (\d+) products/i,
                );
                if (match) {
                  const viewed = parseInt(match[1], 10);
                  const total = parseInt(match[2], 10);
                  if (viewed >= total) {
                    allItemsLoaded = true;
                    localCrawlerLog.info(
                      `Mytheresa: All ${total} items loaded according to loadmore info.`,
                    );
                  }
                }
              }

              if (
                allItemsLoaded ||
                !(await loadMoreButton.isVisible()) ||
                !(await loadMoreButton.isEnabled()) ||
                loadMoreClickedCount >= maxLoadMoreClicksVal ||
                enqueuedDetailPages >= totalMaxProducts
              ) {
                if (
                  currentExecutionId &&
                  (loadMoreClickedCount >= maxLoadMoreClicksVal ||
                    enqueuedDetailPages >= totalMaxProducts)
                ) {
                  await sendLogToBackend(
                    currentExecutionId,
                    LocalScraperLogLevel.INFO,
                    "Load more loop terminated due to limits.",
                    {
                      loadMoreClickedCount,
                      enqueuedDetailPages,
                      maxLoadMoreClicksVal,
                      maxProducts: totalMaxProducts,
                    },
                  );
                }
                break;
              }

              try {
                localCrawlerLog.info(
                  `Mytheresa: Attempting to click "Load More". Click count: ${loadMoreClickedCount + 1}.`,
                );

                // 新增：点击前的随机延迟和人类行为模拟
                await simulateHumanBehavior(page, localCrawlerLog);
                const clickDelay = getRandomDelay(2000, 5000);
                await page.waitForTimeout(clickDelay);

                await loadMoreButton.click({ timeout: 20000 });
                loadMoreClickedCount++;

                const maxWaitTimeForLoadMore = 20000;
                const pollInterval = 1000;
                let waitedTime = 0;
                let newContentLoaded = false;

                while (waitedTime < maxWaitTimeForLoadMore) {
                  await page.waitForTimeout(pollInterval);
                  waitedTime += pollInterval;
                  if (
                    !(await loadMoreButton.isVisible()) ||
                    !(await loadMoreButton.isEnabled())
                  ) {
                    newContentLoaded = true;
                    break;
                  }
                  if (await loadMoreInfoElement.isVisible()) {
                    const newInfoText =
                      (await loadMoreInfoElement.textContent()) || "";
                    const newViewedCount = extractViewedCount(newInfoText);
                    if (
                      newViewedCount !== null &&
                      currentViewedCountBeforeClick !== null &&
                      newViewedCount > currentViewedCountBeforeClick
                    ) {
                      newContentLoaded = true;
                      break;
                    }
                    const match = newInfoText.match(
                      /You've viewed (\d+) (?:out of|of) (\d+) products/i,
                    );
                    if (
                      match &&
                      parseInt(match[1], 10) >= parseInt(match[2], 10)
                    ) {
                      allItemsLoaded = true;
                      newContentLoaded = true;
                      break;
                    }
                  }
                  if (waitedTime % 5000 === 0)
                    localCrawlerLog.info(
                      `Mytheresa: Still waiting for content after ${waitedTime}ms...`,
                    );
                }
                if (!newContentLoaded && !allItemsLoaded)
                  localCrawlerLog.warning(
                    `Mytheresa: Load More timeout, proceeding.`,
                  );

                const newProductItems = await page
                  .locator(usedSelector || "div.item")
                  .all();
                await processProductItems(
                  newProductItems,
                  page,
                  request,
                  crawler,
                  localCrawlerLog,
                  maxProductsPerUrl, // 使用每个URL的限制
                  currentUrlCounters?.enqueuedDetailPages || 0,
                  (newCount) => {
                    if (currentUrlCounters) {
                      currentUrlCounters.enqueuedDetailPages = newCount;
                    }
                    // 更新总计数
                    enqueuedDetailPages = Array.from(
                      urlProductCounts.values(),
                    ).reduce(
                      (sum, counts) => sum + counts.enqueuedDetailPages,
                      0,
                    );
                  },
                  currentExecutionId,
                  currentOriginUrl, // 传递原始URL
                );
              } catch (error) {
                localCrawlerLog.error(
                  `Mytheresa: Error clicking "Load More": ${(error as Error).message}`,
                );
                if (currentExecutionId)
                  await sendLogToBackend(
                    currentExecutionId,
                    LocalScraperLogLevel.ERROR,
                    `Error clicking "Load More": ${(error as Error).message}`,
                    { stack: (error as Error).stack },
                  );
                break;
              }
            }
          }
        } catch (e: unknown) {
          const error = e as Error;
          localCrawlerLog.error(
            `Mytheresa: Request handler error for ${request.url}: ${error.message}`,
            { stack: error.stack },
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.ERROR,
              `Request handler error: ${error.message}`,
              { url: request.url, stack: error.stack },
            );
          }
          throw e;
        }
      },
      failedRequestHandler: async ({
        request,
        log: localLog,
      }: PlaywrightCrawlingContext<MytheresaUserData>) => {
        localLog.error(`Mytheresa: Request ${request.url} failed!`);
        const currentExecutionId = request.userData?.executionId;
        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.ERROR,
            `Request failed: ${request.url}`,
            { error: request.errorMessages?.join("; ") },
          );
        }
      },
      launchContext: {
        launchOptions: {
          executablePath:
            process.env.CHROME_EXECUTABLE_PATH ||
            "/Users/amm10090/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
          headless: options.headless !== false, // 默认使用无头模式，除非明确设置为 false
          args: getEnhancedBrowserArgs(), // 使用增强的浏览器参数
        },
        useChrome: true,
      } as PlaywrightLaunchContext,
      maxRequestsPerCrawl: maxRequests,
      preNavigationHooks: [
        async (crawlingContext) => {
          const { page } = crawlingContext;

          // 新增：为每个请求设置随机User-Agent
          const randomUserAgent = getRandomUserAgent();
          await page.context().addInitScript(`
              Object.defineProperty(navigator, 'userAgent', {
                get: () => '${randomUserAgent}'
              });
            `);

          // 新增：设置随机视口大小
          const viewportSizes = [
            { width: 1920, height: 1080 },
            { width: 1366, height: 768 },
            { width: 1536, height: 864 },
            { width: 1440, height: 900 },
            { width: 1600, height: 900 },
          ];
          const randomViewport =
            viewportSizes[Math.floor(Math.random() * viewportSizes.length)];
          await page.setViewportSize(randomViewport);

          // 新增：设置额外的请求头
          await page.setExtraHTTPHeaders({
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
          });

          // 新增：强化stealth模式隐藏
          await page.context().addInitScript(() => {
            // 删除webdriver标识
            delete (window.navigator as unknown as Record<string, unknown>)
              .webdriver;

            // 重写navigator.webdriver属性
            Object.defineProperty(navigator, "webdriver", {
              get: () => undefined,
            });

            // 模拟真实插件
            Object.defineProperty(navigator, "plugins", {
              get: () => ({
                length: 3,
                0: { name: "Chrome PDF Plugin" },
                1: { name: "Chrome PDF Viewer" },
                2: { name: "Native Client" },
              }),
            });

            // 模拟语言
            Object.defineProperty(navigator, "languages", {
              get: () => ["en-US", "en"],
            });

            // 隐藏自动化框架痕迹
            const automationProps = [
              "__playwright",
              "__puppeteer",
              "__selenium",
              "__webdriver_evaluate",
              "__webdriver_script_function",
              "__fxdriver_evaluate",
              "__driver_unwrapped",
            ];

            automationProps.forEach((prop) => {
              delete (window as unknown as Record<string, unknown>)[prop];
            });
          });

          crawleeLog.debug(`Set User-Agent: ${randomUserAgent}`);
          crawleeLog.debug(
            `Set Viewport: ${randomViewport.width}x${randomViewport.height}`,
          );
        },
      ],
    },
    config,
  );

  crawleeLog.info(
    "Mytheresa: Enhanced anti-detection crawler setup complete. Starting crawl...",
  );
  const initialRequests = (
    Array.isArray(startUrls) ? startUrls : [startUrls]
  ).map((url) => {
    const label =
      url.includes("new-arrivals") ||
      url.includes("products") ||
      url.includes("clothing") ||
      url.includes("shoes") ||
      url.includes("bags") ||
      url.includes("accessories")
        ? "LIST"
        : "DETAIL";
    // Pass batchGender in userData for each request
    return {
      url,
      userData: {
        executionId: executionId,
        label: label,
        batchGender: batchGender,
        originUrl: url,
      } as MytheresaUserData,
      label: label,
    };
  });

  await crawler.run(initialRequests);

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `Mytheresa scraper finished. Total products collected: ${allScrapedProducts.length}.`,
      {
        processedDetailPages,
        enqueuedDetailPages,
        urlBreakdown: Array.from(urlProductCounts.entries()).map(
          ([url, counts]) => ({
            url,
            processedDetailPages: counts.processedDetailPages,
            enqueuedDetailPages: counts.enqueuedDetailPages,
            maxAllowedPerUrl: maxProductsPerUrl,
          }),
        ),
        totalMaxProducts,
        maxProductsPerUrl,
      },
    );
  }
  crawleeLog.info(
    `Mytheresa scraper finished. Total products collected: ${allScrapedProducts.length}. Per-URL breakdown:`,
  );

  // 输出每个URL的详细统计
  Array.from(urlProductCounts.entries()).forEach(([url, counts]) => {
    crawleeLog.info(
      `  ${url}: 处理了 ${counts.processedDetailPages}/${maxProductsPerUrl} 个商品 (入队: ${counts.enqueuedDetailPages})`,
    );
  });

  return allScrapedProducts;
}

async function processProductItems(
  productItems: Locator[],
  page: Page,
  request: Request<MytheresaUserData>,
  crawler: PlaywrightCrawler,
  crawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  updateEnqueuedCount: (newCount: number) => void,
  executionId?: string,
  originUrl?: string,
) {
  if (page.isClosed()) {
    crawlerLog.warning(
      `Mytheresa: Page for ${request.url} is closed before processing product items. Skipping.`,
    );
    if (executionId)
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `Page closed before processing items for ${request.url}`,
      );
    return;
  }

  let localEnqueuedCount = currentEnqueuedCount;
  const potentialDetailUrls: { url: string; plpData: Partial<Product> }[] = [];

  const currentRequestBatchGender = request.userData?.batchGender; // Get gender from current request context

  for (const item of productItems) {
    if (localEnqueuedCount >= maxProductsLimit) {
      if (executionId)
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `Max product enqueue limit reached in processProductItems (pre-collection).`,
        );
      break;
    }

    const plpExtractedData: Partial<Product> = {
      source: "Mytheresa" as ECommerceSite,
      sizes: [], // Initialize sizes
      tags: [], // Initialize tags
      gender: currentRequestBatchGender, // Assign gender from current request context
    };
    try {
      const relativeUrl = await item
        .locator("a.item__link")
        .getAttribute("href");
      if (relativeUrl) {
        const fullUrl = new URL(relativeUrl, request.loadedUrl).toString();
        plpExtractedData.url = fullUrl;

        // Extract sizes from PLP
        const sizeLocators = await item.locator("span.item__sizes__size").all();
        const plpSizes: string[] = [];
        for (const sizeLocator of sizeLocators) {
          const sizeText = (await sizeLocator.textContent())?.trim();
          if (sizeText && sizeText.toLowerCase() !== "available sizes:") {
            const isNotAvailable = (
              await sizeLocator.getAttribute("class")
            )?.includes("item__sizes__size--notavailable");
            if (!isNotAvailable) {
              plpSizes.push(sizeText);
            }
          }
        }
        plpExtractedData.sizes = plpSizes;

        // Extract tags from PLP
        const tagLocators = await item
          .locator("div.labels__wrapper span.labels__label")
          .all();
        const plpTags: string[] = [];
        for (const tagLocator of tagLocators) {
          const tagText = (await tagLocator.textContent())?.trim();
          if (tagText) {
            plpTags.push(tagText);
          }
        }
        plpExtractedData.tags = plpTags;

        // Extract name and brand from PLP as a fallback or for plpData
        const brandName = (
          await item.locator("div.item__info__header__designer").textContent()
        )?.trim();
        const productName = (
          await item.locator("div.item__info__name a").textContent()
        )?.trim();
        if (brandName) plpExtractedData.brand = brandName;
        if (productName) plpExtractedData.name = productName;

        // Potentially extract PLP image for plpData.images if needed, though PDP images are preferred
        const plpImage = await item
          .locator("div.item__images__image img")
          .first()
          .getAttribute("src");
        if (plpImage) plpExtractedData.images = [plpImage.trim()];

        potentialDetailUrls.push({ url: fullUrl, plpData: plpExtractedData });
      } else {
        crawlerLog.warning(
          "Mytheresa: Could not extract URL from product item on PLP.",
          { itemHTMLBrief: (await item.innerHTML()).substring(0, 100) },
        );
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.WARN,
            `Could not extract URL from product item on PLP.`,
            { itemHTMLBrief: (await item.innerHTML()).substring(0, 100) },
          );
      }
    } catch (e: unknown) {
      const error = e as Error;
      crawlerLog.error(
        `Mytheresa: Error extracting item URL on ${request.url}: ${error.message}`,
      );
      if (executionId)
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Error extracting item URL on ${request.url}: ${error.message}`,
          { stack: error.stack },
        );
    }
  }

  if (potentialDetailUrls.length > 0) {
    const urlsToCheck = potentialDetailUrls.map((p) => p.url);
    let existingUrls: string[] = [];
    try {
      // API_ENDPOINT should be configured, e.g., from an environment variable or a shared config
      // For now, hardcoding for testing, replace with proper configuration
      const BATCH_EXISTS_API_ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_API_URL
        ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/internal/products/batch-exists`
        : "http://localhost:3001/api/internal/products/batch-exists";

      if (executionId)
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.DEBUG,
          `Calling batch-exists API for ${urlsToCheck.length} URLs. Endpoint: ${BATCH_EXISTS_API_ENDPOINT}`,
        );

      const response = await fetch(BATCH_EXISTS_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsToCheck, source: "Mytheresa" }),
      });

      if (response.ok) {
        const data = await response.json();
        existingUrls = data.existingUrls || [];
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `Batch-exists API returned ${existingUrls.length} existing URLs.`,
          );
      } else {
        const errorText = await response.text();
        crawlerLog.error(
          `Mytheresa: Batch-exists API call failed. Status: ${response.status}. Body: ${errorText}`,
        );
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `Batch-exists API call failed. Status: ${response.status}`,
            { responseBody: errorText.substring(0, 500) },
          );
        // Fallback: Assume all URLs are new to avoid blocking scraping due to API issues.
        // Alternatively, could choose to not enqueue any if API fails.
      }
    } catch (apiError: unknown) {
      const error = apiError as Error;
      crawlerLog.error(
        `Mytheresa: Error calling batch-exists API: ${error.message}`,
      );
      if (executionId)
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Error calling batch-exists API: ${error.message}`,
          { stack: error.stack },
        );
      // Fallback: Assume all URLs are new
    }

    for (const potentialItem of potentialDetailUrls) {
      if (localEnqueuedCount >= maxProductsLimit) {
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.INFO,
            `Max product enqueue limit reached in processProductItems (post-API check).`,
          );
        break;
      }
      if (existingUrls.includes(potentialItem.url)) {
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `Skipping already existing URL: ${potentialItem.url}`,
          );
        continue;
      }

      try {
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `Enqueuing detail page from PLP: ${potentialItem.url}`,
          );
        const newUserData: MytheresaUserData = {
          ...request.userData,
          plpData: potentialItem.plpData,
          label: "DETAIL",
          batchGender: currentRequestBatchGender,
          originUrl: originUrl,
        };
        await crawler.addRequests([
          {
            url: potentialItem.url,
            label: "DETAIL",
            userData: newUserData,
          },
        ]);
        localEnqueuedCount++;
      } catch (e: unknown) {
        const error = e as Error;
        crawlerLog.error(
          `Mytheresa: Error enqueuing item ${potentialItem.url} on ${request.url}: ${error.message}`,
        );
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `Error enqueuing item ${potentialItem.url} on ${request.url}: ${error.message}`,
            { stack: error.stack },
          );
      }
    }
  }
  updateEnqueuedCount(localEnqueuedCount);
}
