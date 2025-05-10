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
      `${siteName} scraper started.`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
      },
    );
  }

  const allScrapedProducts: Product[] = [];
  const maxRequests = options.maxRequests || 90;
  const maxLoadClicks = options.maxLoadClicks || 10;
  const maxProducts = options.maxProducts || 1000;
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

        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.INFO,
            `Processing URL: ${request.url}`,
            { label: requestLabel },
          );
        }
        localCrawlerLog.info(
          `Mytheresa: Processing ${request.url}... (Label: ${requestLabel})`,
        );

        try {
          if (requestLabel === "DETAIL") {
            processedDetailPages++;
            localCrawlerLog.info(
              `Mytheresa: Identified as a DETAIL page: ${request.url} (${processedDetailPages}/${maxProducts})`,
            );
            const plpData = request.userData?.plpData;
            const product: Product = {
              source: "Mytheresa" as ECommerceSite,
              url: request.url,
              scrapedAt: new Date(),
              name: plpData?.name,
              brand: plpData?.brand,
              images: plpData?.images,
              sizes: plpData?.sizes,
              tags: plpData?.tags,
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

            if (processedDetailPages >= maxProducts) {
              localCrawlerLog.info(
                `Mytheresa: Reached max products limit (${maxProducts}), stopping crawler.`,
              );
              if (currentExecutionId)
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Reached max products limit (${maxProducts}).`,
                );
              await crawler.stop();
            }
          } else {
            // LIST page
            localCrawlerLog.info(
              `Mytheresa: Identified as a LIST page: ${request.url}`,
            );
            const productItemSelector = "div.item";
            const productItems = await page.locator(productItemSelector).all();
            localCrawlerLog.info(
              `Mytheresa: Found ${productItems.length} product items initially on ${request.url}`,
            );

            await processProductItems(
              productItems,
              page,
              request,
              crawler,
              localCrawlerLog,
              maxProducts,
              enqueuedDetailPages,
              (newCount) => {
                enqueuedDetailPages = newCount;
              },
              currentExecutionId,
            );

            if (enqueuedDetailPages >= maxProducts) {
              localCrawlerLog.info(
                `Mytheresa: Reached max products enqueue limit (${maxProducts}), not loading more.`,
              );
              if (currentExecutionId)
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Reached max products enqueue limit (${maxProducts}).`,
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
                enqueuedDetailPages >= maxProducts
              ) {
                if (
                  currentExecutionId &&
                  (loadMoreClickedCount >= maxLoadMoreClicksVal ||
                    enqueuedDetailPages >= maxProducts)
                ) {
                  await sendLogToBackend(
                    currentExecutionId,
                    LocalScraperLogLevel.INFO,
                    "Load more loop terminated due to limits.",
                    {
                      loadMoreClickedCount,
                      enqueuedDetailPages,
                      maxLoadMoreClicksVal,
                      maxProducts,
                    },
                  );
                }
                break;
              }

              try {
                localCrawlerLog.info(
                  `Mytheresa: Attempting to click "Load More". Click count: ${loadMoreClickedCount + 1}.`,
                );
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
                  .locator(productItemSelector)
                  .all();
                await processProductItems(
                  newProductItems,
                  page,
                  request,
                  crawler,
                  localCrawlerLog,
                  maxProducts,
                  enqueuedDetailPages,
                  (newCount) => {
                    enqueuedDetailPages = newCount;
                  },
                  currentExecutionId,
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
            "/root/.cache/ms-playwright/chromium-1169/chrome-linux/chrome",
        },
        useChrome: true,
      } as PlaywrightLaunchContext,
      maxRequestsPerCrawl: maxRequests,
      preNavigationHooks: [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_crawlingContext, _gotoOptions) => {
          // console.log('Pre-navigation hook for:', _crawlingContext.request.url, 'with executionId:', _crawlingContext.request.userData?.executionId);
        },
      ],
    },
    config,
  );

  crawleeLog.info("Mytheresa: Crawler setup complete. Starting crawl...");
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
    return {
      url,
      userData: { executionId: executionId, label: label } as MytheresaUserData,
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
      },
    );
  }
  crawleeLog.info(
    `Mytheresa scraper finished. Total products collected: ${allScrapedProducts.length}.`,
  );
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
          executionId: executionId,
          label: "DETAIL",
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
