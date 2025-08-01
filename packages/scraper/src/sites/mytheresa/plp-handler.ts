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

/**
 * 模拟真实用户浏览行为 - 从测试文件移植
 */
async function simulateRealUserBehavior(page: Page): Promise<void> {
  // 阅读时间
  const readingTime = 3000 + Math.random() * 4000;
  await new Promise((resolve) => setTimeout(resolve, readingTime));

  // 随机滚动
  await page.evaluate(() => {
    window.scrollBy({
      top: window.innerHeight * (0.2 + Math.random() * 0.3),
      behavior: "smooth",
    });
  });

  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000),
  );

  // 随机鼠标移动
  const viewport = (await page.viewportSize()) || { width: 1920, height: 1080 };
  await page.mouse.move(
    Math.random() * viewport.width,
    Math.random() * viewport.height,
    { steps: 5 },
  );
}

/**
 * 模拟产品页面浏览行为 - 从测试文件移植
 */
async function simulateProductBrowsing(page: Page): Promise<void> {
  // 更长的浏览时间
  const browsingTime = 5000 + Math.random() * 5000;
  await new Promise((resolve) => setTimeout(resolve, browsingTime));

  // 多次滚动查看产品
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * 0.4,
        behavior: "smooth",
      });
    });
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 1000),
    );
  }
}

/**
 * 提取单个产品的信息 - 从测试文件移植
 */
async function extractSingleProduct(
  item: Locator,
  page: Page,
): Promise<Record<string, unknown>> {
  // 提取链接
  const link = await item
    .locator(SELECTORS.PLP_PRODUCT_LINK)
    .getAttribute("href")
    .catch(() => null);
  const fullUrl = link ? new URL(link, page.url()).toString() : "";

  // 提取品牌
  const brand = await item
    .locator(SELECTORS.PLP_BRAND)
    .textContent()
    .catch(() => "");

  // 提取产品名称
  const name = await item
    .locator(SELECTORS.PLP_NAME)
    .textContent()
    .catch(() => "");

  // 提取图片
  const image = await item
    .locator(SELECTORS.PLP_IMAGE)
    .first()
    .getAttribute("src")
    .catch(() => "");

  // 提取尺寸
  const sizeLocators = await item
    .locator(SELECTORS.PLP_SIZES)
    .all()
    .catch(() => []);
  const sizes: string[] = [];
  for (const sizeLocator of sizeLocators) {
    const sizeText = await sizeLocator.textContent().catch(() => "");
    if (
      sizeText &&
      sizeText.trim() &&
      sizeText.toLowerCase() !== "available sizes:"
    ) {
      const isNotAvailable = (
        await sizeLocator.getAttribute("class").catch(() => "")
      )?.includes("item__sizes__size--notavailable");
      if (!isNotAvailable) {
        sizes.push(sizeText.trim());
      }
    }
  }

  // 提取标签
  const tagLocators = await item
    .locator(SELECTORS.PLP_TAG)
    .all()
    .catch(() => []);
  const tags: string[] = [];
  for (const tagLocator of tagLocators) {
    const tagText = await tagLocator.textContent().catch(() => "");
    if (tagText && tagText.trim()) {
      tags.push(tagText.trim());
    }
  }

  const productData: Record<string, unknown> = {
    brand: brand?.trim() || "",
    name: name?.trim() || "",
    title: name?.trim() || "", // 兼容字段
    link: fullUrl,
    image: image?.trim() || "",
    sizes,
    tags,
    source: "Mytheresa",
  };
  return productData;
}

/**
 * 提取当前页面的商品 - 从测试文件移植
 */
async function extractCurrentPageProducts(
  page: Page,
  log: Log,
): Promise<Partial<Product>[]> {
  try {
    let productItems: Locator[] = [];

    // 使用已有的产品项选择器
    for (const selector of SELECTORS.PLP_PRODUCT_ITEM_SELECTORS) {
      try {
        const items = await page.locator(selector).all();
        if (items.length > 0) {
          log.info(`📦 找到 ${items.length} 个商品项，使用选择器: ${selector}`);
          productItems = items;
          break;
        }
      } catch {
        continue;
      }
    }

    if (productItems.length === 0) {
      return [];
    }

    const products: Partial<Product>[] = [];

    for (let i = 0; i < productItems.length; i++) {
      const item = productItems[i];

      try {
        const productData = await extractSingleProduct(item, page);

        if (
          productData &&
          (productData.brand || productData.name || productData.title)
        ) {
          products.push(productData);
        }
      } catch {
        // 跳过失败的商品
        continue;
      }
    }

    return products;
  } catch (error) {
    log.error("💥 提取当前页面商品失败:", { error: (error as Error).message });
    return [];
  }
}

/**
 * 加载更多商品 - 从测试文件移植
 */
async function loadMoreProducts(page: Page, log: Log): Promise<boolean> {
  try {
    log.info("🔄 寻找并点击'Show more'按钮...");

    // 滑动到页面底部
    log.info("📜 滑动到页面底部...");
    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    });

    // 等待滑动完成
    await page.waitForTimeout(2000);

    // 尝试找到"Show more"按钮
    let showMoreButton = null;
    const showMoreSelectors = [
      SELECTORS.PLP_LOAD_MORE_BUTTON,
      "div.loadmore__button > a.button--active",
      '.loadmore__button a:has-text("Show more")',
      'a:has-text("Show more")',
    ];

    for (const selector of showMoreSelectors) {
      try {
        log.info(`🔍 尝试Show more选择器: ${selector}`);
        showMoreButton = await page.locator(selector).first();
        if (await showMoreButton.isVisible({ timeout: 3000 })) {
          log.info(`📍 找到Show more按钮: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }

    if (!showMoreButton || !(await showMoreButton.isVisible())) {
      log.info("⚠️ 未找到Show more按钮，可能已到最后一页");
      return false;
    }

    // 检查按钮状态信息
    let loadInfo = "";
    try {
      const info = await page
        .locator(SELECTORS.PLP_LOAD_MORE_INFO)
        .textContent();
      if (info) {
        loadInfo = info.trim();
        log.info(`📊 加载信息: ${loadInfo}`);
      }
    } catch {
      // 信息获取失败不影响主流程
    }

    // 模拟真实用户点击
    const box = await showMoreButton.boundingBox();
    if (box) {
      // 移动鼠标到按钮位置
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(500);

      // 悬停
      await showMoreButton.hover();
      await page.waitForTimeout(300);
    }

    // 点击Show more按钮
    log.info("🖱️  点击Show more按钮...");
    await showMoreButton.click();

    log.info("⏰ 等待新商品加载...");
    // 等待3-5秒让新商品渲染
    const waitTime = 3000 + Math.random() * 2000;
    await page.waitForTimeout(waitTime);

    log.info("✅ 成功加载更多商品");
    return true;
  } catch {
    log.error("💥 加载更多商品失败");
    return false;
  }
}

/**
 * 多页商品抓取主函数 - 从测试文件移植并集成到处理器中
 */
async function extractMultiPageProducts(
  page: Page,
  log: Log,
  maxProducts: number = 180,
): Promise<Partial<Product>[]> {
  try {
    log.info("🔍 开始多页商品抓取...");
    log.info(`🎯 目标: 抓取${maxProducts}个商品`);

    const products: Partial<Product>[] = [];
    let currentPage = 1;

    while (products.length < maxProducts) {
      log.info(`\n📄 第${currentPage}页商品抓取...`);

      // 等待当前页面商品加载
      await page.waitForTimeout(3000);

      // 获取当前页面的所有商品
      const currentPageProducts = await extractCurrentPageProducts(page, log);

      if (currentPageProducts.length === 0) {
        log.info("⚠️ 当前页面未找到商品，停止抓取");
        break;
      }

      // 添加新商品到结果中（避免重复）
      let newProductsCount = 0;
      for (const product of currentPageProducts) {
        if (products.length >= maxProducts) break;

        // 检查是否已存在（通过链接判断）
        const productLink = (product as any).link;
        const exists = products.some((p) => (p as any).link === productLink);
        if (!exists) {
          products.push(product);
          newProductsCount++;
          log.info(
            `✅ 商品 ${products.length}: ${product.brand} - ${product.name || (product as any).title}`,
          );
        }
      }

      log.info(
        `📊 第${currentPage}页新增 ${newProductsCount} 个商品，总计 ${products.length} 个商品`,
      );

      // 如果已达到目标数量，停止抓取
      if (products.length >= maxProducts) {
        log.info(`🎉 已达到目标数量 ${maxProducts} 个商品！`);
        break;
      }

      // 尝试加载更多商品
      const hasMore = await loadMoreProducts(page, log);
      if (!hasMore) {
        log.info("📋 没有更多商品可加载");
        break;
      }

      currentPage++;
    }

    log.info(`🎉 多页抓取完成，共获取 ${products.length} 个商品`);
    return products.slice(0, maxProducts); // 确保不超过目标数量
  } catch (error) {
    log.error("💥 多页抓取失败:", { error: (error as Error).message });
    return [];
  }
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
        `Mytheresa: Error calling batch-exists API: ${_error.message}`,
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
          `Mytheresa: Error enqueuing item ${potentialItem.url}: ${_error.message}`,
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

  localCrawlerLog.info(
    `🛡️ Mytheresa: Identified as a LIST page with complete anti-detection: ${request.url}`,
  );

  // 模拟真实用户行为
  localCrawlerLog.info("👤 模拟真实用户浏览行为...");
  await simulateRealUserBehavior(page);

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

  // 模拟产品页面浏览行为
  localCrawlerLog.info("👀 浏览产品页面...");
  await simulateProductBrowsing(page);

  // 使用多页抓取功能代替原来的单页抓取
  localCrawlerLog.info("🔍 开始多页商品抓取...");
  const maxProductsPerUrl = 180; // 设置合适的数量

  // 执行多页商品抓取
  const allProducts = await extractMultiPageProducts(
    page,
    localCrawlerLog,
    maxProductsPerUrl,
  );

  if (allProducts.length === 0) {
    localCrawlerLog.warning(
      `Mytheresa: No products found with multi-page extraction.`,
    );
    const screenshotPath = `mytheresa-no-products-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    localCrawlerLog.info(`Screenshot saved to: ${screenshotPath}`);
    return;
  }

  localCrawlerLog.info(`🎉 多页抓取完成，获取到 ${allProducts.length} 个商品`);

  // 将抓取到的商品转换为适合处理的格式
  let productItems: Locator[] = [];
  for (const selector of SELECTORS.PLP_PRODUCT_ITEM_SELECTORS) {
    try {
      const items = await page.locator(selector).all();
      if (items.length > 0) {
        productItems = items.slice(0, allProducts.length); // 限制为实际抓取的商品数量
        break;
      }
    } catch {
      /* continue */
    }
  }

  if (productItems.length > 0) {
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
  }

  localCrawlerLog.info(
    `✅ LIST页面处理完成，成功处理 ${allProducts.length} 个商品`,
  );
}
