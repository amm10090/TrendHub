// packages/scraper/src/sites/mytheresa/plp-handler.ts
import {
  type PlaywrightCrawlingContext,
  type Request,
  type Log,
  type PlaywrightCrawler,
} from "crawlee";
import type { Page, Locator } from "playwright";
import { type Product, ECommerceSite } from "@repo/types";
import { sendLogToBackend, LocalScraperLogLevel } from "../../utils.js";
import { MytheresaUserData } from "./types.js";
import { SELECTORS } from "./selectors.js";

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

  const currentRequestBatchGender = request.userData?.batchGender;

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
      sizes: [],
      tags: [],
      gender: currentRequestBatchGender,
    };
    try {
      const relativeUrl = await item
        .locator(SELECTORS.PLP_PRODUCT_LINK)
        .getAttribute("href");
      if (relativeUrl) {
        const fullUrl = new URL(relativeUrl, request.url).toString();
        plpExtractedData.url = fullUrl;

        const sizeLocators = await item.locator(SELECTORS.PLP_SIZES).all();
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

        const tagLocators = await item.locator(SELECTORS.PLP_TAG).all();
        const plpTags: string[] = [];
        for (const tagLocator of tagLocators) {
          const tagText = (await tagLocator.textContent())?.trim();
          if (tagText) {
            plpTags.push(tagText);
          }
        }
        plpExtractedData.tags = plpTags;

        const brandName = (
          await item.locator(SELECTORS.PLP_BRAND).textContent()
        )?.trim();
        const productName = (
          await item.locator(SELECTORS.PLP_NAME).textContent()
        )?.trim();
        if (brandName) plpExtractedData.brand = brandName;
        if (productName) plpExtractedData.name = productName;

        const plpImage = await item
          .locator(SELECTORS.PLP_IMAGE)
          .first()
          .getAttribute("src");
        if (plpImage) plpExtractedData.images = [plpImage.trim()];

        potentialDetailUrls.push({ url: fullUrl, plpData: plpExtractedData });
      } else {
        crawlerLog.warning(
          "Mytheresa: Could not extract URL from product item on PLP.",
        );
        if (executionId)
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.WARN,
            `Could not extract URL from product item on PLP.`,
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
        );
    }
  }

  if (potentialDetailUrls.length > 0) {
    const urlsToCheck = potentialDetailUrls.map((p) => p.url);
    let existingUrls: string[] = [];
    try {
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
      }
    } catch (apiError: unknown) {
      // Handle API errors
      const _error = apiError as Error;
      crawlerLog.error(
        `Mytheresa: Error calling batch-exists API: ${(_error as Error).message}`,
      );
    }

    for (const potentialItem of potentialDetailUrls) {
      if (localEnqueuedCount >= maxProductsLimit) break;
      if (existingUrls.includes(potentialItem.url)) continue;

      try {
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
        // Handle enqueue errors
        const _error = e as Error;
        crawlerLog.error(
          `Mytheresa: Error enqueuing item ${potentialItem.url}: ${(_error as Error).message}`,
        );
      }
    }
  }
  updateEnqueuedCount(localEnqueuedCount);
}

export async function handlePlp(
  context: PlaywrightCrawlingContext<MytheresaUserData>,
  enqueuedCounters: { count: number },
) {
  const { request, page, log: localCrawlerLog, crawler } = context;
  const { executionId, originUrl } = request.userData;

  localCrawlerLog.info(`Mytheresa: Identified as a LIST page: ${request.url}`);

  // 等待页面加载完成前，先等待一段随机时间
  await page.waitForTimeout(Math.random() * 3000 + 2000);

  // 检查是否遇到反爬虫页面
  const pageContent = await page.content();
  if (
    pageContent.includes("Access to this page has been denied") ||
    pageContent.includes("blocked") ||
    pageContent.includes("captcha") ||
    pageContent.includes("Just a moment") ||
    pageContent.includes("Checking your browser")
  ) {
    localCrawlerLog.warning(
      `Mytheresa: Detected anti-bot page on ${request.url}.`,
    );

    // 尝试等待更长时间，让页面有机会自行解决
    await page.waitForTimeout(Math.random() * 5000 + 10000);

    // 尝试刷新页面
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(Math.random() * 3000 + 2000);

    // 再次检查
    const newContent = await page.content();
    if (
      newContent.includes("Access to this page has been denied") ||
      newContent.includes("blocked") ||
      newContent.includes("captcha")
    ) {
      localCrawlerLog.error(
        `Mytheresa: Still blocked after refresh on ${request.url}.`,
      );

      // 保存截图用于调试
      const screenshotPath = `mytheresa-blocked-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      localCrawlerLog.info(`Screenshot saved to: ${screenshotPath}`);

      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Blocked by anti-bot protection on ${request.url}`,
          { screenshotPath },
        );
      }

      return; // 退出处理
    }
  }

  await page.waitForLoadState("networkidle");

  let productItems: Locator[] = [];
  for (const selector of SELECTORS.PLP_PRODUCT_ITEM_SELECTORS) {
    try {
      const items = await page.locator(selector).all();
      if (items.length > 0) {
        productItems = items;
        break;
      }
    } catch {
      /* continue */
    }
  }

  if (productItems.length === 0) {
    localCrawlerLog.warning(`Mytheresa: No products found with any selector.`);
    const screenshotPath = `mytheresa-no-products-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    localCrawlerLog.info(`Screenshot saved to: ${screenshotPath}`);
  }

  // This is a simplified call. You need to get these values from the main handler.
  // This part requires more significant refactoring to pass state correctly.
  // For now, this is a placeholder to show the structure.
  const maxProductsPerUrl = 100; // Placeholder

  await processProductItems(
    productItems,
    page,
    request,
    crawler,
    localCrawlerLog,
    maxProductsPerUrl,
    enqueuedCounters.count,
    (newCount) => {
      enqueuedCounters.count = newCount;
    },
    executionId,
    originUrl,
  );

  // ... "load more" logic would also go here, and it would also call processProductItems.
}
