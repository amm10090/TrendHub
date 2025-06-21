// packages/scraper/src/sites/italist.ts
import {
  PlaywrightCrawler,
  Configuration,
  log as crawleeLog,
  type Request as CrawleeRequest,
  type Log,
  type PlaywrightCrawlingContext,
  type PlaywrightLaunchContext,
} from "crawlee";
import type { Page, Locator } from "playwright";
import type { Product, ECommerceSite } from "@repo/types";
import * as path from "path";
import type { ScraperOptions, ScraperFunction } from "../main.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  cleanPrice,
  ensureDirectoryExists,
} from "../utils.js";
import { createStealthCrawler } from "../crawler-setup.js";

interface ItalistUserData {
  executionId?: string;
  plpData?: Partial<Product>;
  label?: "LIST" | "DETAIL";
  batchGender?: "women" | "men" | "unisex" | string | null;
  originUrl?: string; // 新增：获取原始URL
}

// 基于最新网站结构分析更新的选择器
const SELECTORS = {
  // PLP - 产品列表页 (基于实际运行日志的HTML结构)
  PRODUCT_LIST_CONTAINER:
    ".product-grid-container:not(.display-none), .products-container, main", // 更新：排除隐藏的product-grid-container
  PRODUCT_CARD: ".product-grid-container:not(.display-none) > a", // 更新：直接选择容器内的<a>标签，因为卡片本身就是链接
  PRODUCT_LINK: "", // 更新：卡片本身就是链接，不需要在内部查找
  PLP_BRAND: ".brand", // 更新：根据HTML结构，品牌在.brand类中
  PLP_NAME: ".model", // 更新：产品名称在.model类中
  PLP_PRICE: ".price", // 更新：价格在.price类中
  PLP_ORIGINAL_PRICE: ".product-info p", // 价格字符串中的第二个价格（原价）
  PLP_CURRENT_PRICE_WITH_DISCOUNT: ".product-info p", // 价格字符串中的第一个价格（现价）
  PLP_CURRENT_PRICE_NO_DISCOUNT: ".product-info p", // 单一价格情况
  PLP_TAG: ".product-tag, .badge, .label", // 更新：产品标签选择器
  PLP_IMAGE: "img", // 更新：产品卡片内的任何图片
  PAGINATION_LINK: ".pagination a", // 更新：分页链接在.pagination容器内
  PLP_TOTAL_COUNT: ".results-count, .total-count", // 更新：总数统计选择器

  // 筛选器选择器 (基于firecrawl分析)
  FILTER_CATEGORY: ".filter-category",
  FILTER_SIZE: ".filter-size",
  FILTER_COLOR: ".filter-color",
  FILTER_PRICE: ".filter-price",
  FILTER_DESIGNER: ".filter-designer",

  // 导航选择器
  MAIN_NAVIGATION: ".main-navigation",
  BREADCRUMB_NAVIGATION: ".breadcrumb, nav[aria-label='breadcrumb']",

  // PDP - 产品详情页 (基于推测和常见模式)
  PDP_BREADCRUMBS_CONTAINER:
    "div.breadcrumbs-row, .breadcrumb, nav[aria-label='breadcrumb'], .navigation-breadcrumb", // 更新：面包屑容器
  PDP_BREADCRUMB_ITEM:
    "a.breadcrumbs-link, .breadcrumb a, .breadcrumb-item a, nav[aria-label='breadcrumb'] a", // 更新：面包屑项目
  PDP_BRAND: "h2.brand, .product-brand, .brand-name, h1 .brand", // 更新：产品品牌
  PDP_NAME: "h1.model, .product-name, .product-title, h1", // 更新：产品名称
  PDP_CURRENT_PRICE:
    ".price .sales-price, .current-price, .price-now, .sale-price", // 更新：当前价格
  PDP_ORIGINAL_PRICE:
    ".price .old-price, .original-price, .price-was, .old-price", // 更新：原价
  PDP_IMAGE_CONTAINER: ".product-gallery, .product-images, .image-gallery", // 更新：图片容器
  PDP_MAIN_IMAGE: ".product-gallery img, .main-image img, .primary-image img", // 更新：主图
  PDP_THUMBNAIL_IMAGE: ".thumbnail img, .gallery-thumb img, .product-thumb img", // 更新：缩略图
  PDP_DESCRIPTION_AREA:
    "div.expanded-section-text, .accordion-content, .product-description, .description, .product-details", // 更新：描述区域
  PDP_COLOR: ".product-color, .color-info", // 更新：颜色信息
  PDP_MATERIAL:
    ".description-container, .product-material, .material-info, .composition", // 更新：材质信息
  PDP_SKU:
    "p:has-text('Model number:'), .product-sku, .model-number, .item-code", // 更新：SKU选择器
  PDP_SIZE_SELECTOR:
    "div[data-testid='size-selector'], .size-selector, .sizes, .size-options", // 更新：尺寸选择器
  PDP_SIZE_OPTIONS: ".size-option, .size-button, .size-variant", // 更新：尺寸选项
  PDP_MODEL_NUMBER: "p:has-text('Model number:'), .model-number, .product-code", // 更新：型号
};

function inferGenderFromItalistUrl(
  url: string,
): "women" | "men" | "unisex" | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/women")) return "women";
  if (urlLower.includes("/men")) return "men";
  // Italist URL 结构可能不直接包含 unisex，可能需要从分类判断
  // 暂时返回 null，后续根据实际情况调整
  return null;
}

// 新增：智能滚动页面函数
async function smartScroll(
  page: Page,
  options: { distance?: "screen" | number } = {},
): Promise<void> {
  let scrollDistance: number;
  if (options.distance === "screen") {
    const viewportHeight = page.viewportSize()?.height || 800;
    scrollDistance = viewportHeight * 0.8;
  } else if (typeof options.distance === "number") {
    scrollDistance = options.distance;
  } else {
    scrollDistance = 500; // 默认滚动距离
  }

  await page.evaluate((dist) => {
    window.scrollBy({ top: dist, behavior: "smooth" });
  }, scrollDistance);

  await page.waitForTimeout(500 + Math.random() * 500); // 等待滚动生效和平滑
}

// 新增：监测卡片数量变化函数
// 这个函数被作为内部工具使用，用于检测页面中卡片数量的变化
function checkCardCountChange(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    return document.querySelectorAll(sel).length;
  }, selector);
}

async function processProductCardsOnPlpItalist(
  page: Page,
  request: CrawleeRequest<ItalistUserData>,
  crawler: PlaywrightCrawler,
  localCrawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  updateEnqueuedCountCB: (newCount: number) => void,
  executionId?: string,
  batchGender?: string | null,
  processedUrls?: Set<string>,
) {
  const siteNameForLog = "Italist"; // 用于日志前缀
  localCrawlerLog.info(
    `[${siteNameForLog}] 开始处理列表页 ${request.url} 上的商品卡片，目标获取数量: ${maxProductsLimit}。`,
  );

  let localEnqueuedCount = currentEnqueuedCount;
  const potentialDetailRequestObjects: {
    url: string;
    label: string;
    userData: ItalistUserData;
    keepUrlFragment: boolean;
    uniqueKey: string;
  }[] = [];
  const plpItemsToBatchCheck: { url: string; plpData: Partial<Product> }[] = [];

  try {
    // 添加调试信息：显示页面上所有可能的产品容器
    const availableContainers = await page.evaluate(() => {
      const containers: Array<{
        selector: string;
        testid: string | null;
        className: string;
        childCount: number;
      }> = [];
      // 查找所有可能的容器元素
      const possibleSelectors = [
        'div[data-testid*="product"]',
        'div[class*="product"]',
        'div[class*="list"]',
        'div[class*="grid"]',
        'div[class*="container"]',
      ];

      possibleSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.getAttribute("data-testid") || el.className) {
            containers.push({
              selector: selector,
              testid: el.getAttribute("data-testid"),
              className: el.className,
              childCount: el.children.length,
            });
          }
        });
      });
      return containers;
    });

    localCrawlerLog.info(
      `[${siteNameForLog}] 页面上发现的容器元素:`,
      availableContainers.slice(0, 10), // 只显示前10个
    );

    await page.waitForSelector(SELECTORS.PRODUCT_LIST_CONTAINER, {
      state: "visible",
      timeout: 60000, // 增加超时时间
    });
    localCrawlerLog.debug(
      `[${siteNameForLog}] 商品列表容器 ${SELECTORS.PRODUCT_LIST_CONTAINER} 已找到。`,
    );

    // 提取总商品数
    let totalProductsCount = 0;
    try {
      const totalCountElement = await page.$(SELECTORS.PLP_TOTAL_COUNT);
      if (totalCountElement) {
        const totalText = await totalCountElement.textContent();
        totalProductsCount = parseInt(totalText?.replace(/,/g, "") || "0", 10);
        localCrawlerLog.info(
          `[${siteNameForLog}] 当前分类下总商品数: ${totalProductsCount}`,
        );
      } else {
        localCrawlerLog.warning(
          `[${siteNameForLog}] 未找到总商品数元素: ${SELECTORS.PLP_TOTAL_COUNT}`,
        );
      }
    } catch (countError) {
      localCrawlerLog.warning(
        `[${siteNameForLog}] 提取总商品数时出错: ${(countError as Error).message}`,
      );
    }

    // 计算需要处理的商品数量（还需要多少商品）
    const neededProducts = maxProductsLimit - localEnqueuedCount;
    if (neededProducts <= 0) {
      localCrawlerLog.info(
        `[${siteNameForLog}] 已达到目标商品数量 (${maxProductsLimit})，无需处理更多商品。`,
      );
      return;
    }

    localCrawlerLog.info(
      `[${siteNameForLog}] 计划提取 ${neededProducts} 个商品。`,
    );

    // 每行通常显示4个商品，计算需要滚动到的行数
    const productsPerRow = 4;
    const rowsNeeded = Math.ceil(neededProducts / productsPerRow);

    // 初始化已获取的卡片数
    let initialCardCount = await checkCardCountChange(
      page,
      SELECTORS.PRODUCT_CARD,
    );
    localCrawlerLog.info(
      `[${siteNameForLog}] 初始可见商品卡片数: ${initialCardCount}`,
    );

    // 只滚动到需要的位置
    const maxScrolls = Math.min(rowsNeeded + 1, 5); // 额外滚动一行防止边界情况，最多滚动5次

    for (let i = 0; i < maxScrolls; i++) {
      await smartScroll(page, { distance: "screen" });

      // 检查当前卡片数量
      const currentCardCount = await checkCardCountChange(
        page,
        SELECTORS.PRODUCT_CARD,
      );
      localCrawlerLog.info(
        `[${siteNameForLog}] 滚动 #${i + 1} 后可见商品卡片数: ${currentCardCount}`,
      );

      // 如果已经能看到足够的卡片或者卡片数不再增加，停止滚动
      if (
        currentCardCount >= neededProducts ||
        currentCardCount === initialCardCount
      ) {
        break;
      }

      initialCardCount = currentCardCount;
      await page.waitForTimeout(800); // 短暂等待加载
    }

    // 获取可见的商品卡片元素，只处理需要的数量
    const productCardElements = await page.$$(SELECTORS.PRODUCT_CARD);
    const cardsToProcess = productCardElements.slice(0, neededProducts);

    // 添加调试信息：显示找到的产品卡片的详细信息
    if (productCardElements.length === 0) {
      const alternativeSelectors = [
        ".product-card",
        'div[class*="product"]',
        "article",
        ".product-item",
      ];

      for (const altSelector of alternativeSelectors) {
        const altElements = await page.$$(altSelector);
        localCrawlerLog.info(
          `[${siteNameForLog}] 使用选择器 "${altSelector}" 找到 ${altElements.length} 个元素`,
        );
        if (altElements.length > 0) {
          // 显示前几个元素的信息
          for (let i = 0; i < Math.min(3, altElements.length); i++) {
            const innerHTML = await altElements[i].innerHTML();
            localCrawlerLog.info(
              `[${siteNameForLog}] 元素 ${i + 1}: ${innerHTML.substring(0, 200)}...`,
            );
          }
          break;
        }
      }
    }

    localCrawlerLog.info(
      `[${siteNameForLog}] 在 ${request.url} 找到 ${productCardElements.length} 个商品卡片元素，将处理其中 ${cardsToProcess.length} 个。`,
    );

    if (productCardElements.length === 0 && executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `[${siteNameForLog}] No product cards found on PLP: ${request.url}`,
        { selector: SELECTORS.PRODUCT_CARD },
      );
    }

    for (const card of cardsToProcess) {
      if (localEnqueuedCount >= maxProductsLimit) {
        localCrawlerLog.info(
          `[${siteNameForLog}] 已达到最大产品入队数 (${maxProductsLimit})，停止处理此列表页的更多卡片。`,
        );
        break;
      }

      let productUrl = "";
      try {
        // 确保卡片在视图中并等待元素加载
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200); // 短暂等待

        // 卡片本身就是链接，直接获取href属性
        const href = await card.getAttribute("href");
        if (!href) {
          localCrawlerLog.warning(
            `[${siteNameForLog}] 商品卡片缺少 href 属性。`,
          );
          continue;
        }
        productUrl = href.startsWith("http")
          ? href
          : new URL(href, "https://www.italist.com").toString();

        if (!productUrl.includes("italist.com")) {
          localCrawlerLog.warning(
            `[${siteNameForLog}] 提取到无效的商品 URL: ${productUrl}, 从 href: ${href}`,
          );
          continue;
        }

        if (processedUrls && processedUrls.has(productUrl)) {
          localCrawlerLog.debug(
            `[${siteNameForLog}] URL ${productUrl} 已处理过，跳过。`,
          );
          continue;
        }

        const plpData: Partial<Product> = {
          source: siteNameForLog as ECommerceSite,
          url: productUrl,
          gender: batchGender,
          tags: [],
          metadata: { executionId },
        };

        // 更新后的品牌名称提取逻辑 - 基于实际HTML结构
        try {
          // 方法1: 从.brand元素中提取品牌
          const brandEl = await card.$(SELECTORS.PLP_BRAND); // .brand
          if (brandEl) {
            const brandText = (await brandEl.textContent())?.trim();
            if (
              brandText &&
              !brandText.match(/^(USD|EUR|GBP|JPY|CNY|\$)\s*\d/)
            ) {
              plpData.brand = brandText;
              localCrawlerLog.info(
                `[${siteNameForLog}] 提取到品牌: ${plpData.brand}`,
              );
            }
          }

          // 方法2: 从.model元素中提取产品名称
          const nameEl = await card.$(SELECTORS.PLP_NAME); // .model
          if (nameEl) {
            const nameText = (await nameEl.textContent())?.trim();
            if (nameText && !nameText.match(/^(USD|EUR|GBP|JPY|CNY|\$)\s*\d/)) {
              plpData.name = nameText;
              localCrawlerLog.info(
                `[${siteNameForLog}] 提取到产品名: ${plpData.name}`,
              );
            }
          }

          // 方法2: 从URL提取品牌作为备用方案
          if (!plpData.brand) {
            try {
              const urlParts = productUrl.split("/");
              const lastPart = urlParts[urlParts.length - 2]; // 通常品牌在URL倒数第二部分
              if (lastPart && lastPart.length > 1 && lastPart !== "us") {
                // 转换为品牌格式（首字母大写，连字符替换为空格）
                const brandFromUrl = lastPart
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                plpData.brand = brandFromUrl;
                localCrawlerLog.info(
                  `[${siteNameForLog}] 从URL推断品牌: ${plpData.brand}`,
                );
              }
            } catch (urlError) {
              localCrawlerLog.debug(
                `[${siteNameForLog}] 从URL推断品牌失败: ${(urlError as Error).message}`,
              );
            }
          }

          if (!plpData.brand) {
            localCrawlerLog.warning(
              `[${siteNameForLog}] 未能从商品卡片中提取到品牌名称，URL: ${productUrl}`,
            );
          }
        } catch (brandError) {
          localCrawlerLog.error(
            `[${siteNameForLog}] 提取品牌时发生错误: ${(brandError as Error).message}`,
          );
        }

        // 产品名称已在品牌提取逻辑中一起处理了

        // 更新后的价格提取逻辑 - 基于实际HTML结构
        try {
          const priceContainer = await card.$(SELECTORS.PLP_PRICE); // .price
          if (priceContainer) {
            // 检查是否有销售价格和原价
            const salesPriceEl = await priceContainer.$(".sales-price");
            const oldPriceEl = await priceContainer.$(".old-price");

            if (salesPriceEl && oldPriceEl) {
              // 有折扣的情况：销售价 • 原价
              const salesPriceText = (await salesPriceEl.textContent())?.trim();
              const oldPriceText = (await oldPriceEl.textContent())?.trim();

              if (salesPriceText && oldPriceText) {
                const currentAmount = cleanPrice(salesPriceText);
                const originalAmount = cleanPrice(oldPriceText);

                plpData.currentPrice = {
                  amount: currentAmount,
                  currency: "USD",
                };
                plpData.originalPrice = {
                  amount: originalAmount,
                  currency: "USD",
                };

                localCrawlerLog.info(
                  `[${siteNameForLog}] 提取折扣价格: 现价 ${currentAmount}, 原价 ${originalAmount}`,
                );
              }
            } else {
              // 单一价格情况，查找 .price span
              const singlePriceEl = await priceContainer.$("span.price");
              if (singlePriceEl) {
                const priceText = (await singlePriceEl.textContent())?.trim();
                if (priceText) {
                  const amount = cleanPrice(priceText);
                  plpData.currentPrice = { amount, currency: "USD" };
                  plpData.originalPrice = { amount, currency: "USD" };

                  localCrawlerLog.info(
                    `[${siteNameForLog}] 单一价格: ${amount}`,
                  );
                }
              }
            }
          } else {
            localCrawlerLog.warning(
              `[${siteNameForLog}] 未找到价格容器，URL: ${productUrl}`,
            );
          }
        } catch (priceError) {
          localCrawlerLog.error(
            `[${siteNameForLog}] 提取价格时发生错误: ${(priceError as Error).message}`,
          );
        }

        // 计算折扣
        if (
          plpData.originalPrice &&
          plpData.currentPrice &&
          plpData.originalPrice.amount > 0
        ) {
          if (plpData.originalPrice.amount > plpData.currentPrice.amount) {
            const discount =
              (plpData.originalPrice.amount - plpData.currentPrice.amount) /
              plpData.originalPrice.amount;
            plpData.discount = parseFloat(discount.toFixed(2));
          } else {
            plpData.discount = 0; // 如果原价不高于现价，则折扣为0
          }
        } else {
          plpData.discount = 0; // 如果缺少价格信息，折扣也为0
        }

        const imageEl = await card.$(SELECTORS.PLP_IMAGE);
        if (imageEl) {
          const imgSrc = await imageEl.getAttribute("src");
          if (imgSrc) plpData.images = [imgSrc.trim()];
        }

        const tagEl = await card.$(SELECTORS.PLP_TAG);
        if (tagEl) {
          const tagText = (await tagEl.textContent())?.trim();
          if (tagText && plpData.tags) plpData.tags.push(tagText);
        }

        plpItemsToBatchCheck.push({ url: productUrl, plpData });
      } catch (cardError: unknown) {
        localCrawlerLog.error(
          `[${siteNameForLog}] 处理单个商品卡片 (${productUrl || "未知URL"}) 时出错: ${(cardError as Error).message}`,
          { stack: (cardError as Error).stack },
        );
        if (executionId && productUrl) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `[${siteNameForLog}] Error processing product card: ${productUrl}`,
            {
              error: (cardError as Error).message,
              stack: (cardError as Error).stack,
            },
          );
        }
      }
    }

    if (plpItemsToBatchCheck.length > 0) {
      const urlsToCheck = plpItemsToBatchCheck.map((item) => item.url);
      let existingUrlsInDB: string[] = [];
      try {
        const BATCH_EXISTS_API_ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_API_URL
          ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/internal/products/batch-exists`
          : "http://localhost:3001/api/internal/products/batch-exists";

        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `[${siteNameForLog}] Calling batch-exists API for ${urlsToCheck.length} URLs. Endpoint: ${BATCH_EXISTS_API_ENDPOINT}`,
          );
        }

        const response = await fetch(BATCH_EXISTS_API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: urlsToCheck, source: siteNameForLog }),
        });

        if (response.ok) {
          const data = await response.json();
          existingUrlsInDB = data.existingUrls || [];
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.DEBUG,
              `[${siteNameForLog}] Batch-exists API returned ${existingUrlsInDB.length} existing URLs.`,
            );
          }
        } else {
          const errorText = await response.text();
          localCrawlerLog.error(
            `[${siteNameForLog}] Batch-exists API call failed. Status: ${response.status}. Body: ${errorText.substring(0, 500)}`,
          );
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.ERROR,
              `[${siteNameForLog}] Batch-exists API call failed. Status: ${response.status}`,
              { responseBodyBrief: errorText.substring(0, 500) },
            );
          }
        }
      } catch (apiError: unknown) {
        localCrawlerLog.error(
          `[${siteNameForLog}] 调用 batch-exists API 出错: ${(apiError as Error).message}`,
        );
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `[${siteNameForLog}] Error calling batch-exists API: ${(apiError as Error).message}`,
            { stack: (apiError as Error).stack },
          );
        }
      }

      for (const item of plpItemsToBatchCheck) {
        if (localEnqueuedCount >= maxProductsLimit) break;

        if (existingUrlsInDB.includes(item.url)) {
          if (processedUrls) processedUrls.add(item.url); // 标记为已处理（即使是已存在的）
          localCrawlerLog.debug(
            `[${siteNameForLog}] URL ${item.url} 已存在于数据库，跳过入队详情页。`,
          );
          continue;
        }
        if (processedUrls && processedUrls.has(item.url)) {
          // 此处应该在循环开始时就已处理，但作为双重检查保留
          localCrawlerLog.debug(
            `[${siteNameForLog}] URL ${item.url} 已在本会话中处理过，跳过重复入队。`,
          );
          continue;
        }

        if (processedUrls) processedUrls.add(item.url); // 标记为已处理
        const detailUserData: ItalistUserData = {
          label: "DETAIL",
          plpData: item.plpData,
          executionId,
          batchGender,
          originUrl: item.url, // 新增：设置原始URL
        };
        potentialDetailRequestObjects.push({
          url: item.url,
          label: "DETAIL",
          userData: detailUserData,
          keepUrlFragment: false,
          uniqueKey: item.url, // 确保唯一性
        });
        localEnqueuedCount++;
      }
    }

    if (potentialDetailRequestObjects.length > 0) {
      await crawler.addRequests(potentialDetailRequestObjects);
      localCrawlerLog.info(
        `[${siteNameForLog}] 从 ${request.url} 添加了 ${potentialDetailRequestObjects.length} 个新的详情页请求到队列。`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `[${siteNameForLog}] Enqueued ${potentialDetailRequestObjects.length} new DETAIL requests from ${request.url}`,
          { count: potentialDetailRequestObjects.length },
        );
      }
    }
  } catch (e: unknown) {
    localCrawlerLog.error(
      `[${siteNameForLog}] 处理列表页 ${request.url} 时发生严重错误: ${(e as Error).message}`,
      { stack: (e as Error).stack },
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `[${siteNameForLog}] Critical error processing PLP ${request.url}: ${(e as Error).message}`,
        { stack: (e as Error).stack },
      );
    }
  }

  updateEnqueuedCountCB(localEnqueuedCount);
  localCrawlerLog.info(
    `[${siteNameForLog}] 列表页 ${request.url} 商品卡片处理完毕。当前总入队数: ${localEnqueuedCount}。`,
  );
}

async function handlePaginationItalist(
  page: Page,
  request: CrawleeRequest<ItalistUserData>,
  crawler: PlaywrightCrawler,
  localCrawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  executionId?: string,
  batchGender?: string | null,
  scraperOptions?: ScraperOptions,
  processedUrls?: Set<string>,
) {
  const siteNameForLog = "Italist";
  localCrawlerLog.info(
    `[${siteNameForLog}] 开始处理列表页 ${request.url} 的分页。`,
  );

  // 如果已入队商品达到上限，跳过分页处理
  if (currentEnqueuedCount >= maxProductsLimit) {
    localCrawlerLog.info(
      `[${siteNameForLog}] 已入队商品数 (${currentEnqueuedCount}) 达到或超过总限制 (${maxProductsLimit})，停止分页。`,
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `[${siteNameForLog}] Skipping pagination as enqueued count (${currentEnqueuedCount}) reached max limit (${maxProductsLimit}).`,
      );
    }
    return;
  }

  const maxPagingClicks = scraperOptions?.maxLoadClicks || 50;
  let currentPageNum = 1;
  try {
    const urlObj = new URL(request.url);
    const skipParam = urlObj.searchParams.get("skip");
    if (skipParam) {
      // Italist 使用 skip 参数的值除以60（每页商品数）加1来表示页码
      currentPageNum = Math.floor(parseInt(skipParam, 10) / 60) + 1;
    } else {
      currentPageNum = parseInt(urlObj.searchParams.get("page") || "1", 10);
    }
    localCrawlerLog.info(
      `[${siteNameForLog}] 当前处理的页码：${currentPageNum}`,
    );
  } catch (urlParseError) {
    localCrawlerLog.warning(
      `[${siteNameForLog}] 解析当前页码失败从 URL: ${request.url}: ${(urlParseError as Error).message}`,
    );
  }

  if (currentPageNum >= maxPagingClicks) {
    localCrawlerLog.info(
      `[${siteNameForLog}] 已达到最大分页点击次数 (${maxPagingClicks})，URL: ${request.url}`,
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `[${siteNameForLog}] Reached max paging clicks (${maxPagingClicks}) for ${request.url}`,
      );
    }
    return;
  }

  try {
    // 智能滚动到页面底部，确保分页元素可见
    for (let i = 0; i < 2; i++) {
      await smartScroll(page, { distance: "screen" });
      await page.waitForTimeout(500);
    }

    const paginationSelectors = SELECTORS.PAGINATION_LINK.split(", ").map((s) =>
      s.trim(),
    );
    let nextPageLink: Locator | null = null;

    // 尝试多种分页选择器
    for (const selector of paginationSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          // 增加超时时间，确保元素有足够时间加载
          nextPageLink = link;
          localCrawlerLog.info(
            `[${siteNameForLog}] 找到下一页链接，使用选择器: ${selector}`,
          );
          break;
        }
      } catch {
        // 如果选择器无效或元素不可见，则忽略并尝试下一个
        continue;
      }
    }

    if (nextPageLink && (await nextPageLink.count()) > 0) {
      const nextPageHref = await nextPageLink.getAttribute("href");
      if (nextPageHref) {
        const nextPageUrl = new URL(
          nextPageHref,
          request.loadedUrl || "https://www.italist.com",
        ).toString();

        // 检查URL是否已处理过
        if (processedUrls && processedUrls.has(nextPageUrl)) {
          localCrawlerLog.info(
            `[${siteNameForLog}] 下一页URL已处理过，跳过: ${nextPageUrl}`,
          );
          return;
        }

        localCrawlerLog.info(
          `[${siteNameForLog}] 即将加入队列的下一列表页: ${nextPageUrl} (来自: ${request.url})`,
        );
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `[${siteNameForLog}] Enqueuing next LIST page: ${nextPageUrl}`,
            { fromUrl: request.url },
          );
        }

        // 将URL标记为已处理
        if (processedUrls) processedUrls.add(nextPageUrl);

        const nextListPageUserData: ItalistUserData = {
          label: "LIST",
          executionId,
          batchGender,
          originUrl: nextPageUrl, // 新增：设置原始URL
        };
        await crawler.addRequests([
          {
            url: nextPageUrl,
            label: "LIST",
            userData: nextListPageUserData,
            uniqueKey: nextPageUrl,
          },
        ]);
      } else {
        localCrawlerLog.info(
          `[${siteNameForLog}] 下一页链接元素找到，但缺少 href 属性。URL: ${request.url}`,
        );
      }
    } else {
      localCrawlerLog.info(
        `[${siteNameForLog}] 在 ${request.url} 未找到下一页链接。可能已到达最后一页。`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `[${siteNameForLog}] No next page link found on ${request.url}. End of PLP for this path.`,
        );
      }
    }
  } catch (error: unknown) {
    localCrawlerLog.error(
      `[${siteNameForLog}] 处理分页时出错 ${request.url}: ${(error as Error).message}`,
      { stack: (error as Error).stack },
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `[${siteNameForLog}] Error handling pagination on ${request.url}: ${(error as Error).message}`,
        { stack: (error as Error).stack },
      );
    }
  }
  localCrawlerLog.info(
    `[${siteNameForLog}] 列表页 ${request.url} 分页处理完毕。`,
  );
}

const scrapeItalist: ScraperFunction = async (
  startUrls: string | string[],
  options: ScraperOptions = {},
  executionId?: string,
): Promise<Product[]> => {
  const siteName: ECommerceSite = "Italist";
  const allScrapedProducts: Product[] = [];
  let processedDetailPages = 0;
  let enqueuedDetailPages = 0;
  const processedUrls = new Set<string>(); // This is the correct Set to be used

  const firstStartUrl = Array.isArray(startUrls) ? startUrls[0] : startUrls;
  const batchGender = firstStartUrl
    ? inferGenderFromItalistUrl(firstStartUrl)
    : null;

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper started.`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
        inferredBatchGender: batchGender,
      },
    );
  }

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

  const baseStorageDir = path.resolve(
    process.cwd(),
    "..",
    "..",
    "apps",
    "admin",
    "scraper_storage_runs", // 与 Farfetch 保持一致，或根据项目配置调整
  );
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  ensureDirectoryExists(runSpecificStorageDir); // 确保目录存在
  // Crawlee 会自动处理 runSpecificStorageDir 下的子目录，无需手动创建

  const config = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  const maxProducts = options.maxProducts || 1000;
  // 根据 maxProducts 和其他因素估算 maxRequests
  const maxRequests = options.maxRequests || maxProducts + 50; // 初步估算，可能需要调整

  const crawler = createStealthCrawler(
    {
      requestHandlerTimeoutSecs: 300,
      navigationTimeoutSecs: 120,
      maxRequestsPerCrawl: maxRequests,
      maxConcurrency: options.maxConcurrency || 5,
      launchContext: {
        launchOptions: {
          headless: options.headless !== undefined ? options.headless : true,
          executablePath: process.env.CHROME_EXECUTABLE_PATH,
        },
        useChrome: !!process.env.CHROME_EXECUTABLE_PATH,
      } as PlaywrightLaunchContext,
      async requestHandler(
        context: PlaywrightCrawlingContext<ItalistUserData>,
      ) {
        const {
          request,
          page,
          log: localCrawlerLog,
          crawler: pwtCrawler,
          pushData,
        } = context;
        const currentExecutionId = request.userData?.executionId;
        const requestLabel = request.userData?.label;
        const currentBatchGender = request.userData?.batchGender;

        if (page.isClosed()) {
          localCrawlerLog.warning(
            `[${siteName}] 页面 ${request.url} 在 requestHandler 开始时已关闭，跳过。`,
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.WARN,
              `[${siteName}] Page closed (handler start) for ${request.url}`,
            );
          }
          return;
        }

        localCrawlerLog.info(
          `[${siteName}] 处理URL: ${request.url} (标签: ${requestLabel}, 执行ID: ${currentExecutionId || "N/A"})`,
        );
        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.INFO,
            `[${siteName}] Processing URL: ${request.url}`,
            { label: requestLabel, batchGender: currentBatchGender },
          );
        }

        try {
          // 实现请求拦截逻辑，阻止不必要的资源加载以提高性能
          await page.route(
            "**/*.{png,jpg,jpeg,gif,webp,svg,css,font,woff,woff2,eot,ttf,otf}",
            async (route) => {
              const url = route.request().url();
              // 允许产品图片通过，阻止其他不必要的图片请求
              if (
                url.includes("/image/upload/") ||
                url.includes("cdn-images.italist.com")
              ) {
                await route.continue();
              } else {
                await route.abort();
              }
            },
          );

          // 拦截一些不必要的API调用和分析脚本
          await page.route(
            "**/{analytics,tracking,telemetry,stats}/**",
            (route) => route.abort(),
          );
          await page.route("**/api/**", async (route) => {
            const url = route.request().url();
            // 只允许产品数据相关的API通过
            if (url.includes("/api/products") || url.includes("/api/catalog")) {
              await route.continue();
            } else {
              await route.abort();
            }
          });

          // 检测并处理弹窗
          try {
            localCrawlerLog.info(`[${siteName}] 检查页面上是否存在促销弹窗...`);

            // 等待页面加载，给弹窗足够的时间出现
            await page
              .waitForLoadState("networkidle", { timeout: 10000 })
              .catch(() => {
                // 超时继续执行，不中断流程
                localCrawlerLog.debug(
                  `[${siteName}] 等待页面网络空闲超时，继续执行`,
                );
              });

            // 特定弹窗的精确选择器（基于提供的HTML结构）
            const specificPopupSelectors = [
              'button[id="el_kj1d-fdug3"][aria-label="Close"]', // 精确匹配提供的弹窗关闭按钮
              'button[type="button"][aria-label="Close"]', // 更通用的匹配
              'div[id^="el_"][class*="animation"] button[aria-label="Close"]', // 使用动画类和aria-label匹配
              'button[aria-label="Close"]:has(svg)', // 有SVG的关闭按钮
              // 保留之前的选择器
              'button[aria-label="Close"]',
              'button[id*="close"]',
              'div[class*="popup"] button',
              'div[class*="modal"] button',
              "button svg",
              'div[id*="popup"] button, div[class*="popup"] button',
              'div[id*="modal"] button, div[class*="modal"] button',
              "button:has(svg)",
            ];

            let popupClosed = false;
            for (const selector of specificPopupSelectors) {
              // 检查选择器是否存在
              const exists = await page.$(selector);
              if (exists) {
                localCrawlerLog.info(
                  `[${siteName}] 找到可能的弹窗关闭按钮: ${selector}`,
                );
                try {
                  // 尝试点击关闭按钮
                  await page.click(selector, { force: true, timeout: 3000 });
                  await page.waitForTimeout(1000); // 等待弹窗消失的动画

                  // 验证弹窗是否关闭
                  const stillExists = await page.$(selector);
                  if (!stillExists) {
                    localCrawlerLog.info(`[${siteName}] 成功关闭弹窗`);
                    popupClosed = true;
                    break; // 找到并成功关闭了弹窗，跳出循环
                  }
                } catch (clickError) {
                  // 点击失败，尝试下一个选择器
                  localCrawlerLog.debug(
                    `[${siteName}] 点击选择器 ${selector} 失败: ${(clickError as Error).message}`,
                  );
                }
              }
            }

            if (!popupClosed) {
              // 如果所有选择器都失败，尝试通过按Escape键关闭弹窗
              await page.keyboard.press("Escape");
              localCrawlerLog.info(`[${siteName}] 尝试通过Escape键关闭弹窗`);
            }

            // 处理性别选择弹窗（如果存在）
            try {
              // 等待弹窗动画完成
              await page.waitForTimeout(2000);

              // 检查是否有性别选择弹窗
              const genderButtons = [
                'button[id="el_7YnBwnzfFp"]', // 女装按钮
                'button[id="el_MMRzN7oy2u"]', // 男装按钮
                'button[id="el_84W_QqvYZAm"]', // 通用按钮
                'button:has(div:contains("Women"))',
                'button:has(div:contains("Men"))',
                'button:has(div:contains("Both"))',
              ];

              // 根据当前URL决定选择哪个性别按钮
              let targetGenderButton = null;
              if (request.url.toLowerCase().includes("/women/")) {
                targetGenderButton = genderButtons[0]; // 女装按钮
                localCrawlerLog.info(
                  `[${siteName}] 检测到女装URL，将选择Women选项`,
                );
              } else if (request.url.toLowerCase().includes("/men/")) {
                targetGenderButton = genderButtons[1]; // 男装按钮
                localCrawlerLog.info(
                  `[${siteName}] 检测到男装URL，将选择Men选项`,
                );
              } else {
                targetGenderButton = genderButtons[2]; // 通用按钮
                localCrawlerLog.info(
                  `[${siteName}] 未检测到具体性别URL，将选择Both选项`,
                );
              }

              // 尝试点击选定的性别按钮
              if (targetGenderButton) {
                try {
                  // 等待按钮变为可见且可点击
                  await page.waitForSelector(targetGenderButton, {
                    state: "visible",
                    timeout: 5000,
                  });

                  // 检查按钮是否真的可见
                  const isVisible = await page.isVisible(targetGenderButton);
                  if (isVisible) {
                    localCrawlerLog.info(
                      `[${siteName}] 性别选择按钮已可见: ${targetGenderButton}`,
                    );

                    // 滚动到按钮位置并点击
                    await page
                      .locator(targetGenderButton)
                      .scrollIntoViewIfNeeded();
                    await page.waitForTimeout(500);

                    await page.locator(targetGenderButton).click({
                      timeout: 3000,
                    });

                    await page.waitForTimeout(1000); // 等待页面响应
                    localCrawlerLog.info(`[${siteName}] 已点击性别选择按钮`);
                  } else {
                    localCrawlerLog.info(
                      `[${siteName}] 性别选择按钮存在但不可见，跳过点击`,
                    );
                  }
                } catch (btnError) {
                  localCrawlerLog.info(
                    `[${siteName}] 性别选择按钮点击失败，可能弹窗已消失: ${(btnError as Error).message}`,
                  );
                }
              }

              // 等待弹窗完全消失并且页面内容加载
              await page.waitForTimeout(2000); // 给一些时间让弹窗消失

              // 验证弹窗是否真的消失了，检查页面是否可交互
              const isPopupGone = await page.evaluate(() => {
                // 检查是否有模态框覆盖层或弹窗元素仍然可见
                const modalOverlays = document.querySelectorAll(
                  'div[class*="modal"], div[class*="popup"], div[id^="el_"][class*="animation"]',
                );
                for (const overlay of modalOverlays) {
                  const style = window.getComputedStyle(overlay);
                  if (
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    style.opacity !== "0"
                  ) {
                    return false; // 弹窗仍然可见
                  }
                }
                return true; // 没有发现可见的弹窗
              });

              if (isPopupGone) {
                localCrawlerLog.info(
                  `[${siteName}] 确认弹窗已完全关闭，页面可交互`,
                );
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] 弹窗可能仍然存在，尝试继续处理页面`,
                );
                // 最后的尝试：点击页面背景以关闭可能的弹窗
                await page.mouse.click(50, 50); // 点击页面左上角区域
                await page.waitForTimeout(1000);
              }
            } catch (genderSelectError) {
              localCrawlerLog.warning(
                `[${siteName}] 处理性别选择弹窗时出错: ${(genderSelectError as Error).message}`,
              );
            }
          } catch (popupError) {
            localCrawlerLog.warning(
              `[${siteName}] 处理弹窗时出错: ${(popupError as Error).message}`,
            );
          }

          if (requestLabel === "DETAIL") {
            // 获取当前URL对应的计数器
            const originUrl = request.userData?.originUrl;
            const urlCounters = originUrl
              ? urlProductCounts.get(originUrl)
              : null;
            if (urlCounters) {
              urlCounters.processedDetailPages++;
            }
            processedDetailPages++;

            localCrawlerLog.info(
              `[${siteName}] 识别为详情页: ${request.url} (总: ${processedDetailPages}, 当前URL: ${urlCounters?.processedDetailPages || 0}/${maxProductsPerUrl})`,
            );
            if (processedUrls) processedUrls.add(request.url);

            const plpData = request.userData?.plpData as
              | Partial<Product>
              | undefined;

            // 新增：基于实际商品URL推断gender，而不是使用全局batchGender
            const actualGender =
              inferGenderFromItalistUrl(request.url) ||
              currentBatchGender ||
              plpData?.gender;

            const product: Product = {
              source: siteName as ECommerceSite,
              url: request.url,
              scrapedAt: new Date(),
              name: plpData?.name, // PDP 会覆盖
              brand: plpData?.brand, // PDP 会覆盖
              images: plpData?.images || [],
              currentPrice: plpData?.currentPrice, // PDP 会覆盖
              originalPrice: plpData?.originalPrice, // PDP 会覆盖
              discount: plpData?.discount,
              sizes: [], // PDP 会填充
              tags: plpData?.tags || [],
              gender: actualGender, // 使用基于实际URL推断的gender
              materialDetails: [],
              metadata: {
                ...(plpData?.metadata || {}),
                executionId: currentExecutionId,
              },
            };

            // 1. 提取面包屑
            try {
              const breadcrumbContainer = await page.waitForSelector(
                SELECTORS.PDP_BREADCRUMBS_CONTAINER,
                { state: "visible", timeout: 10000 },
              );
              if (breadcrumbContainer) {
                // 使用更新后的选择器找到所有面包屑链接
                const breadcrumbItems = await breadcrumbContainer.$$(
                  SELECTORS.PDP_BREADCRUMB_ITEM,
                );

                if (breadcrumbItems.length > 0) {
                  // 提取并处理面包屑文本
                  const breadcrumbTexts = await Promise.all(
                    breadcrumbItems.map(async (item) => {
                      const text = (await item.textContent())?.trim();
                      return text || "";
                    }),
                  );

                  // 过滤掉空值和"Home"，并确保第一级是性别分类
                  const filteredBreadcrumbs = breadcrumbTexts
                    .filter((text) => text && text.length > 0)
                    .filter((text) => text.toLowerCase() !== "home"); // 移除"Home"

                  if (filteredBreadcrumbs.length > 0) {
                    // 检查第一级是否为性别分类
                    const firstLevel = filteredBreadcrumbs[0].toLowerCase();
                    const isMenOrWomen =
                      firstLevel === "men" ||
                      firstLevel === "women" ||
                      firstLevel === "man" ||
                      firstLevel === "woman";

                    if (!isMenOrWomen && filteredBreadcrumbs.length > 1) {
                      // 如果第一级不是性别分类，查找面包屑中的性别并调整顺序
                      let genderFound = false;
                      for (let i = 1; i < filteredBreadcrumbs.length; i++) {
                        const crumb = filteredBreadcrumbs[i].toLowerCase();
                        if (
                          crumb === "men" ||
                          crumb === "women" ||
                          crumb === "man" ||
                          crumb === "woman"
                        ) {
                          // 将性别移到第一位
                          const gender = filteredBreadcrumbs.splice(i, 1)[0];
                          filteredBreadcrumbs.unshift(gender);
                          genderFound = true;
                          localCrawlerLog.info(
                            `[${siteName}] 将性别分类 "${gender}" 移到面包屑第一位`,
                          );
                          break;
                        }
                      }

                      if (!genderFound && product.gender) {
                        // 如果在面包屑中找不到性别，但产品已知性别，添加到第一位
                        const capitalizedGender =
                          product.gender.charAt(0).toUpperCase() +
                          product.gender.slice(1);
                        filteredBreadcrumbs.unshift(capitalizedGender);
                        localCrawlerLog.info(
                          `[${siteName}] 添加产品性别 "${capitalizedGender}" 到面包屑第一位`,
                        );
                      }
                    }

                    // 保存优化后的面包屑
                    product.breadcrumbs = filteredBreadcrumbs;
                    localCrawlerLog.info(
                      `[${siteName}] 优化后的面包屑: ${product.breadcrumbs.join(" > ")}`,
                    );

                    // 从面包屑中尝试识别性别信息（如果尚未指定）
                    if (!product.gender && product.breadcrumbs.length > 0) {
                      const firstCrumb = product.breadcrumbs[0].toLowerCase();
                      if (firstCrumb === "men" || firstCrumb === "man") {
                        product.gender = "men";
                      } else if (
                        firstCrumb === "women" ||
                        firstCrumb === "woman"
                      ) {
                        product.gender = "women";
                      }

                      if (product.gender) {
                        localCrawlerLog.info(
                          `[${siteName}] 从面包屑推断性别: ${product.gender}`,
                        );
                      }
                    }
                  } else {
                    localCrawlerLog.warning(
                      `[${siteName}] 找到面包屑容器但未提取到有效面包屑文本`,
                    );
                  }
                } else {
                  localCrawlerLog.warning(
                    `[${siteName}] 面包屑容器内未找到面包屑项: ${SELECTORS.PDP_BREADCRUMB_ITEM}`,
                  );
                }
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] 未找到面包屑容器: ${SELECTORS.PDP_BREADCRUMBS_CONTAINER}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取面包屑出错: ${(e as Error).message}`,
              );
            }

            // 2. 提取图片 (需要更完善的逻辑来处理轮播图和所有图片)
            try {
              const collectedImages = new Set<string>(product.images || []); // 使用 Set 去重，并从 PLP 数据初始化
              const imageContainer = await page.$(
                SELECTORS.PDP_IMAGE_CONTAINER,
              ); // 主图/轮播图容器

              if (imageContainer) {
                // 方案A: 查找所有主图元素 (可能是多张平铺或通过某种方式切换)
                const mainImageElements = await imageContainer.$$(
                  SELECTORS.PDP_MAIN_IMAGE,
                );
                for (const imgEl of mainImageElements) {
                  let mainSrc =
                    (await imgEl.getAttribute("src")) ||
                    (await imgEl.getAttribute("data-src")) ||
                    (await imgEl.getAttribute("data-srcset"));
                  if (mainSrc) {
                    if (mainSrc.includes("srcset=")) {
                      // 处理 srcset 的情况
                      mainSrc = mainSrc.split(",")[0].split(" ")[0]; // 取第一个 src
                    } else if (mainSrc.includes(",")) {
                      // 有些 data-srcset 可能直接是逗号分隔的 URL
                      mainSrc = mainSrc.split(",")[0].trim();
                    }
                    if (
                      mainSrc &&
                      mainSrc.trim().length > 0 &&
                      !mainSrc.trim().startsWith("data:image")
                    ) {
                      collectedImages.add(mainSrc.trim());
                    }
                  }
                }
                localCrawlerLog.info(
                  `[${siteName}] 从主图元素提取到 ${mainImageElements.length} 个潜在图片源。`,
                );

                // 方案B: 查找并点击缩略图来加载大图 (如果适用)
                const thumbnailElements = await imageContainer.$$(
                  SELECTORS.PDP_THUMBNAIL_IMAGE,
                );
                if (thumbnailElements.length > 0) {
                  localCrawlerLog.info(
                    `[${siteName}] 找到 ${thumbnailElements.length} 个缩略图。`,
                  );
                  for (const thumb of thumbnailElements) {
                    try {
                      // Italist 缩略图可能直接在 src 或 data-src 中有大图链接，或需要点击加载
                      let thumbRelatedBigImage =
                        (await thumb.getAttribute("src")) ||
                        (await thumb.getAttribute("data-src"));
                      // 尝试从缩略图的 data属性获取大图链接
                      const dataBigUrl =
                        (await thumb.getAttribute("data-large-url")) ||
                        (await thumb.getAttribute("data-full-src"));
                      if (dataBigUrl) thumbRelatedBigImage = dataBigUrl;

                      if (
                        thumbRelatedBigImage &&
                        thumbRelatedBigImage.trim().length > 0 &&
                        !thumbRelatedBigImage.trim().startsWith("data:image")
                      ) {
                        // 通常缩略图的 src 可能是小图，需要转换或查找大图
                        // 这里的逻辑需要根据 Italist 的具体实现调整，例如替换路径中的 '_thumb' 为 '_large'
                        const bigImageUrl = thumbRelatedBigImage.replace(
                          /_small|_thumb|_tn/gi,
                          "_large",
                        ); // 尝试转换
                        collectedImages.add(bigImageUrl.trim());
                      }

                      // 如果缩略图是可点击的并且点击会改变主图区域
                      // const isClickable = await thumb.evaluate(node => node.nodeName === 'BUTTON' || window.getComputedStyle(node).cursor === 'pointer');
                      // if (isClickable) {
                      //    await thumb.click({ delay: 200 });
                      //    await page.waitForTimeout(500); // 等待主图更新
                      //    const currentMainImageAfterClick = await page.$(`${SELECTORS.PDP_IMAGE_CONTAINER} ${SELECTORS.PDP_MAIN_IMAGE}`);
                      //    if (currentMainImageAfterClick) {
                      //        let srcAfterClick = await currentMainImageAfterClick.getAttribute("src") || await currentMainImageAfterClick.getAttribute("data-src");
                      //        if (srcAfterClick) collectedImages.add(srcAfterClick.trim());
                      //    }
                      // }
                    } catch (thumbError) {
                      localCrawlerLog.warning(
                        `[${siteName}] 处理单个缩略图时出错: ${(thumbError as Error).message}`,
                      );
                    }
                  }
                }
                // TODO: 添加处理轮播图左右切换按钮的逻辑 (如果存在且必要)
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] 未找到图片容器: ${SELECTORS.PDP_IMAGE_CONTAINER}`,
                );
              }

              product.images = Array.from(collectedImages).filter(
                (img) => img && !img.startsWith("data:image"),
              ); // 确保移除data URI
              if (product.images.length > 0) {
                localCrawlerLog.info(
                  `[${siteName}] 最终提取并去重后的图片数量: ${product.images.length}`,
                );
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] 未能提取到任何有效的产品图片 for ${product.url}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取PDP所有图片出错: ${(e as Error).message}`,
              );
            }

            // 3. 提取描述
            try {
              const descriptionEl = await page.$(
                SELECTORS.PDP_DESCRIPTION_AREA,
              );
              if (descriptionEl) {
                product.description = (
                  await descriptionEl.textContent()
                )?.trim();
                localCrawlerLog.info(
                  `[${siteName}] 提取到描述 (部分): ${product.description?.substring(0, 50)}...`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取描述出错: ${(e as Error).message}`,
              );
            }

            // 更新/提取品牌和名称 (PDP优先)
            try {
              // 品牌提取策略1: 使用选择器尝试找到品牌元素
              const brandElPdp = await page.$(SELECTORS.PDP_BRAND);
              if (brandElPdp) {
                const brandText = (await brandElPdp.textContent())?.trim();
                // 验证提取的不是价格（排除以货币代码开头的文本）
                if (
                  brandText &&
                  !brandText.match(/^(USD|EUR|GBP|JPY|CNY)\s*\d/)
                ) {
                  product.brand = brandText;
                  localCrawlerLog.info(
                    `[${siteName}] PDP Brand: ${product.brand}`,
                  );
                } else {
                  localCrawlerLog.warning(
                    `[${siteName}] PDP提取到的可能是价格而非品牌: "${brandText}"`,
                  );
                }
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] PDP Brand selector not found: ${SELECTORS.PDP_BRAND}`,
                );
              }

              // 品牌提取策略2: 如果上面的方法失败，从URL中提取
              if (!product.brand) {
                try {
                  // 从URL中提取品牌信息 - Italist URL格式通常在末尾包含品牌名
                  // 例如：/us/women/clothing/topwear/t-shirts/.../saint-laurent/
                  const url = product.url;
                  const pathParts = url
                    .split("/")
                    .filter((part) => part.trim().length > 0);
                  // 通常品牌是URL路径的最后一个部分
                  if (pathParts.length > 2) {
                    const lastPart = pathParts[pathParts.length - 1].replace(
                      /-/g,
                      " ",
                    );
                    // 验证提取的是品牌名而不是其他信息
                    if (
                      lastPart &&
                      lastPart.length > 1 &&
                      lastPart.length < 30 &&
                      !lastPart.match(/^\d/) &&
                      !lastPart.includes(".") &&
                      !lastPart.includes("html")
                    ) {
                      // 转换为首字母大写的格式
                      const formattedBrand = lastPart
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                        )
                        .join(" ");

                      product.brand = formattedBrand;
                      localCrawlerLog.info(
                        `[${siteName}] 从URL提取品牌: ${product.brand}`,
                      );
                    }
                  }
                } catch (urlError) {
                  localCrawlerLog.debug(
                    `[${siteName}] 从URL提取品牌出错: ${(urlError as Error).message}`,
                  );
                }
              }

              // 品牌提取策略3: 从面包屑中提取品牌
              if (
                !product.brand &&
                product.breadcrumbs &&
                product.breadcrumbs.length > 0
              ) {
                // 品牌通常是面包屑中的最后一个或倒数第二个元素
                const lastCrumb =
                  product.breadcrumbs[product.breadcrumbs.length - 1];
                if (
                  lastCrumb &&
                  !lastCrumb.match(/^\d/) &&
                  lastCrumb.length < 30
                ) {
                  product.brand = lastCrumb;
                  localCrawlerLog.info(
                    `[${siteName}] 从面包屑提取品牌: ${product.brand}`,
                  );
                }
              }

              // 验证结果并从PLP继承（如果未提取到）
              if (
                !product.brand &&
                plpData?.brand &&
                !plpData.brand.match(/^(USD|EUR|GBP|JPY|CNY)\s*\d/)
              ) {
                product.brand = plpData.brand;
                localCrawlerLog.info(
                  `[${siteName}] 从PLP继承品牌: ${product.brand}`,
                );
              }

              const nameElPdp = await page.$(SELECTORS.PDP_NAME);
              if (nameElPdp) {
                const nameText = (await nameElPdp.textContent())?.trim();
                if (nameText) {
                  product.name = nameText;
                  localCrawlerLog.info(
                    `[${siteName}] PDP Name: ${product.name}`,
                  );
                }
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] PDP Name selector not found: ${SELECTORS.PDP_NAME}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取PDP品牌/名称出错: ${(e as Error).message}`,
              );
            }

            // 更新/提取价格 (PDP优先)
            try {
              const currentPriceElPdp = await page.$(
                SELECTORS.PDP_CURRENT_PRICE,
              );
              if (currentPriceElPdp) {
                const priceText = (
                  await currentPriceElPdp.textContent()
                )?.trim();
                if (priceText) {
                  const amount = cleanPrice(priceText);
                  // TODO: 确认货币单位的提取方式 for Italist PDP
                  product.currentPrice = { amount, currency: "USD" }; // 假设 USD
                  localCrawlerLog.info(
                    `[${siteName}] PDP Current Price: ${amount} USD`,
                  );
                }
              }

              const originalPriceElPdp = await page.$(
                SELECTORS.PDP_ORIGINAL_PRICE,
              );
              if (originalPriceElPdp) {
                const priceText = (
                  await originalPriceElPdp.textContent()
                )?.trim();
                if (priceText) {
                  const amount = cleanPrice(priceText);
                  product.originalPrice = { amount, currency: "USD" }; // 假设 USD
                  localCrawlerLog.info(
                    `[${siteName}] PDP Original Price: ${amount} USD`,
                  );
                }
              } else {
                // 如果没有明确的原价元素，且售价存在，则认为原价与售价相同 (无折扣)
                if (product.currentPrice && !product.originalPrice) {
                  product.originalPrice = { ...product.currentPrice };
                  localCrawlerLog.info(
                    `[${siteName}] No explicit original price, setting to current price.`,
                  );
                }
              }

              // 重新计算折扣
              if (
                product.originalPrice &&
                product.currentPrice &&
                product.originalPrice.amount > 0
              ) {
                if (
                  product.originalPrice.amount > product.currentPrice.amount
                ) {
                  const discount =
                    (product.originalPrice.amount -
                      product.currentPrice.amount) /
                    product.originalPrice.amount;
                  product.discount = parseFloat(discount.toFixed(2));
                  localCrawlerLog.info(
                    `[${siteName}] PDP Discount calculated: ${product.discount}`,
                  );
                } else {
                  product.discount = 0; // No discount if current is not less than original
                }
              } else {
                product.discount = 0; // No discount if prices are missing or original is zero
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取PDP价格出错: ${(e as Error).message}`,
              );
            }

            // 4. 提取SKU/Model Number (PDP优先) - 更新后的逻辑
            try {
              // 方法1: 使用选择器查找SKU/型号元素
              let skuEl = await page.$(SELECTORS.PDP_SKU);
              if (!skuEl) {
                // 尝试查找model number选择器
                skuEl = await page.$(SELECTORS.PDP_MODEL_NUMBER);
              }

              if (skuEl) {
                const skuTextContent = (await skuEl.textContent())?.trim();
                if (skuTextContent && skuTextContent.length > 0) {
                  let processedSku: string;
                  if (
                    skuTextContent.toLowerCase().startsWith("product code:")
                  ) {
                    processedSku = skuTextContent
                      .substring("product code:".length)
                      .trim();
                  } else if (
                    skuTextContent.toLowerCase().startsWith("model number:")
                  ) {
                    processedSku = skuTextContent
                      .substring("model number:".length)
                      .trim();
                  } else {
                    processedSku = skuTextContent;
                  }
                  product.sku =
                    processedSku.length > 0 ? processedSku : undefined;
                  if (product.sku) {
                    localCrawlerLog.info(
                      `[${siteName}] PDP SKU: ${product.sku}`,
                    );
                  }
                }
              }

              // 方法2: 通用DOM搜索 - 查找包含model number的文本
              if (!product.sku) {
                try {
                  const modelNumberText = await page.evaluate(() => {
                    // 查找包含model number模式的文本
                    const allElements = Array.from(
                      document.querySelectorAll("*"),
                    );
                    for (const el of allElements) {
                      const text = el.textContent || "";
                      if (
                        text.includes("Model number") ||
                        text.includes("Product Code")
                      ) {
                        // 提取冒号后的内容
                        const match = text.match(
                          /(?:Model number|Product Code):\s*([A-Z0-9]+)/i,
                        );
                        if (match && match[1]) {
                          return match[1].trim();
                        }
                      }
                    }
                    return null;
                  });

                  if (modelNumberText) {
                    product.sku = modelNumberText;
                    localCrawlerLog.info(
                      `[${siteName}] 通用搜索提取到SKU: ${product.sku}`,
                    );
                  }
                } catch (evalError) {
                  localCrawlerLog.debug(
                    `[${siteName}] 通用SKU搜索失败: ${(evalError as Error).message}`,
                  );
                }
              }

              // 方法3: 从URL提取数字ID作为回退方案
              if (!product.sku && product.url) {
                const urlParts = product.url.split("/");
                const potentialSkuFromUrlPart =
                  urlParts[urlParts.length - 3] ||
                  urlParts[urlParts.length - 2];

                if (
                  potentialSkuFromUrlPart &&
                  /^[0-9]{7,}$/.test(potentialSkuFromUrlPart)
                ) {
                  product.sku = potentialSkuFromUrlPart;
                  localCrawlerLog.info(
                    `[${siteName}] 从URL回退提取SKU (策略1): ${product.sku}`,
                  );
                } else {
                  const foundNumericPart = urlParts.find((part) =>
                    /^[0-9]{7,}$/.test(part),
                  );
                  if (foundNumericPart) {
                    product.sku = foundNumericPart;
                    localCrawlerLog.info(
                      `[${siteName}] 从URL回退提取SKU (策略2 - find): ${product.sku}`,
                    );
                  }
                }
              }

              if (!product.sku) {
                localCrawlerLog.warning(
                  `[${siteName}] 未能提取到PDP SKU for ${product.url}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取PDP SKU出错: ${(e as Error).message}`,
              );
            }

            // 5. 提取颜色和材质
            try {
              // 新增：展开描述区域以确保内容可见
              try {
                const accordionHeading = await page.$(
                  "div.accordion-heading:has-text('Description')",
                );
                if (accordionHeading) {
                  const content = await page.$(".accordion-content");
                  const isVisible = content ? await content.isVisible() : false;
                  if (!isVisible) {
                    await accordionHeading.click({ timeout: 3000 });
                    await page.waitForTimeout(500); // 等待展开动画
                    localCrawlerLog.info(
                      `[${siteName}] 已点击描述区域以展开内容。`,
                    );
                  }
                }
              } catch (accordionError) {
                localCrawlerLog.warning(
                  `[${siteName}] 展开描述区域时出错: ${(accordionError as Error).message}`,
                );
              }

              // 基于给定HTML结构，优化颜色和材质的提取逻辑
              const descriptionAreaEl = await page.$(
                SELECTORS.PDP_DESCRIPTION_AREA,
              );
              let descriptionTextForParsing = product.description || ""; // 使用已提取的描述，或空字符串
              let descriptionHtml = "";

              if (descriptionAreaEl) {
                // 获取描述区域的HTML和文本内容，便于更精确地提取
                descriptionHtml =
                  (await descriptionAreaEl.evaluate(
                    (node) => node.innerHTML,
                  )) || "";
                if (!descriptionTextForParsing) {
                  descriptionTextForParsing =
                    (await descriptionAreaEl.evaluate(
                      (node) => node.textContent,
                    )) || "";
                }

                localCrawlerLog.info(
                  `[${siteName}] 找到描述区域，长度: ${descriptionTextForParsing.length} 字符`,
                );
              }

              // 提取颜色信息
              if (descriptionTextForParsing || descriptionHtml) {
                // 策略1: 优先使用精确选择器
                try {
                  const colorElement = await page.$(
                    "p:has-text('Color:') span",
                  );
                  if (colorElement) {
                    const colorText = (
                      await colorElement.textContent()
                    )?.trim();
                    if (
                      colorText &&
                      colorText.length > 0 &&
                      colorText.length < 20
                    ) {
                      product.color = colorText;
                      product.designerColorName = colorText;
                      localCrawlerLog.info(
                        `[${siteName}] 精确选择器提取到颜色: ${product.color}`,
                      );
                    }
                  }
                } catch {
                  // 忽略错误，继续执行后续逻辑
                }

                // 策略1: 使用更严格的正则从文本中查找颜色信息
                if (!product.color) {
                  const colorRegex = /Color:\s*([^<\n\r.,;]+)(?![^<>]*Size)/i;
                  const colorMatch = (
                    descriptionTextForParsing || descriptionHtml
                  ).match(colorRegex);

                  // 尝试更精确的提取 - 寻找<span>标签中的颜色
                  if (!colorMatch) {
                    const spanColorRegex = /Color:.*?<span[^>]*>(.*?)<\/span>/i;
                    const spanMatch = descriptionHtml.match(spanColorRegex);
                    if (spanMatch && spanMatch[1]) {
                      // 直接从匹配中提取颜色值
                      const extractedColor = spanMatch[1].trim();
                      if (
                        extractedColor.length < 20 &&
                        !extractedColor.includes("Size") &&
                        !extractedColor.includes("Model")
                      ) {
                        product.color = extractedColor;
                        product.designerColorName = extractedColor;
                        localCrawlerLog.info(
                          `[${siteName}] 从<span>标签中提取到颜色: ${product.color}`,
                        );
                      }
                    }
                  }

                  if (colorMatch && colorMatch[1]) {
                    const extractedColor = colorMatch[1].trim();
                    // 验证提取的颜色是一个合理的值（不包含其他字段）
                    if (
                      extractedColor.length < 20 &&
                      !extractedColor.includes("Size") &&
                      !extractedColor.includes("Model")
                    ) {
                      product.color = extractedColor;
                      product.designerColorName = extractedColor;
                      localCrawlerLog.info(
                        `[${siteName}] 从描述中提取到颜色: ${product.color}`,
                      );
                    } else {
                      localCrawlerLog.warning(
                        `[${siteName}] 提取到的颜色值异常: "${extractedColor}"，尝试其他方法提取`,
                      );
                    }
                  }
                }

                // 策略2: 使用特定选择器查找颜色元素
                if (
                  !product.color ||
                  product.color.length > 20 ||
                  product.color.includes("Size") ||
                  product.color.includes("Model")
                ) {
                  try {
                    // 使用更精确的选择器寻找颜色信息 - 特别针对示例中的结构
                    const colorElement = await page.$(
                      'p:contains("Color:") span',
                    );
                    if (colorElement) {
                      const pureColorText =
                        (await colorElement.textContent()) || "";
                      if (
                        pureColorText &&
                        pureColorText.length < 20 &&
                        !pureColorText.includes("Size") &&
                        !pureColorText.includes("Model")
                      ) {
                        product.color = pureColorText.trim();
                        product.designerColorName = product.color;
                        localCrawlerLog.info(
                          `[${siteName}] 从颜色<span>元素提取到: ${product.color}`,
                        );
                      } else {
                        localCrawlerLog.warning(
                          `[${siteName}] 从<span>中提取的颜色值异常: "${pureColorText}"`,
                        );
                      }
                    } else {
                      // 备选：查找包含Color:的段落，然后提取冒号后的文本（不包含整个段落）
                      const colorParagraph = await page.$(
                        'p:contains("Color:")',
                      );
                      if (colorParagraph) {
                        const paragraphText =
                          (await colorParagraph.textContent()) || "";
                        if (paragraphText.includes("Color:")) {
                          // 提取Color:后面的文本，但不包括后续可能的其他字段
                          const cleanColorMatch =
                            paragraphText.match(/Color:\s*([^:;.\n]+)/i);
                          if (cleanColorMatch && cleanColorMatch[1]) {
                            const cleanColor = cleanColorMatch[1].trim();
                            if (
                              cleanColor.length < 20 &&
                              !cleanColor.includes("Size") &&
                              !cleanColor.includes("Model")
                            ) {
                              product.color = cleanColor;
                              product.designerColorName = cleanColor;
                              localCrawlerLog.info(
                                `[${siteName}] 从段落中提取到纯净颜色: ${product.color}`,
                              );
                            }
                          }
                        }
                      }
                    }
                  } catch (colorError) {
                    localCrawlerLog.debug(
                      `[${siteName}] 查找颜色元素出错: ${(colorError as Error).message}`,
                    );
                  }
                }

                // 策略3: 直接从页面中查找颜色文本 (最后的回退方案)
                if (
                  !product.color ||
                  product.color.length > 20 ||
                  product.color.includes("Size") ||
                  product.color.includes("Model")
                ) {
                  try {
                    // 使用evaluate在页面上下文中执行JavaScript寻找颜色信息
                    const pageColorText = await page.evaluate(() => {
                      // 优先尝试找到<span>元素中的颜色信息
                      const colorSpans = Array.from(
                        document.querySelectorAll('p:has(span[dir="ltr"])'),
                      ).filter(
                        (p) =>
                          p.textContent && p.textContent.includes("Color:"),
                      );

                      if (colorSpans.length > 0) {
                        const span =
                          colorSpans[0].querySelector('span[dir="ltr"]');
                        if (span) return span.textContent?.trim() || null;
                      }

                      // 回退方案：查找包含Color:的较短文本节点
                      const colorNodes = Array.from(
                        document.querySelectorAll("*"),
                      ).filter(
                        (node) =>
                          node.textContent &&
                          node.textContent.includes("Color:") &&
                          node.textContent.length < 50 &&
                          !node.textContent.includes("Size") &&
                          !node.textContent.includes("Model"),
                      );

                      if (colorNodes.length > 0) {
                        const colorText = colorNodes[0].textContent || "";
                        const colorMatch = colorText.match(
                          /Color:\s*([^:;.,\n\r]+)/i,
                        );
                        return colorMatch ? colorMatch[1].trim() : null;
                      }
                      return null;
                    });

                    if (
                      pageColorText &&
                      pageColorText.length < 20 &&
                      !pageColorText.includes("Size") &&
                      !pageColorText.includes("Model")
                    ) {
                      product.color = pageColorText;
                      product.designerColorName = pageColorText;
                      localCrawlerLog.info(
                        `[${siteName}] 页面扫描提取到纯净颜色: ${product.color}`,
                      );
                    }
                  } catch (evalError) {
                    localCrawlerLog.debug(
                      `[${siteName}] 页面扫描颜色出错: ${(evalError as Error).message}`,
                    );
                  }
                }

                // 最终验证颜色信息的合理性
                if (
                  product.color &&
                  (product.color.length > 20 ||
                    product.color.includes("Size") ||
                    product.color.includes("Model") ||
                    product.color.includes("fit"))
                ) {
                  localCrawlerLog.warning(
                    `[${siteName}] 最终颜色值仍然异常，尝试强制清理: "${product.color}"`,
                  );
                  // 尝试提取颜色值的第一个单词，这通常是颜色名称本身
                  const firstWord = product.color.split(/\s+/)[0];
                  if (firstWord && firstWord.length < 15) {
                    product.color = firstWord;
                    product.designerColorName = firstWord;
                    localCrawlerLog.info(
                      `[${siteName}] 强制清理后的颜色值: ${product.color}`,
                    );
                  }
                }

                // 提取材质信息 - 策略1：优先使用精确选择器
                try {
                  const materialElement = await page.$(SELECTORS.PDP_MATERIAL);
                  if (materialElement) {
                    const materialText = (
                      await materialElement.textContent()
                    )?.trim();
                    if (materialText) {
                      product.material = materialText.split(",")[0].trim();
                      product.materialDetails = materialText
                        .split(",")
                        .map((m) => m.trim())
                        .filter((m) => m.length > 0);

                      localCrawlerLog.info(
                        `[${siteName}] 从新选择器提取到材质: ${product.material}`,
                      );
                    }
                  }
                } catch (e) {
                  localCrawlerLog.debug(
                    `[${siteName}] 使用新材质选择器提取失败: ${(e as Error).message}`,
                  );
                }

                // 提取材质信息 (优先查找Composition:，然后是Material:) - 策略2：回退到旧逻辑
                if (!product.material) {
                  const compositionRegex = /Composition:\s*([^<\n\r]+)/i;
                  const materialRegex = /Material:\s*([^<\n\r]+)/i;

                  const compositionMatch = (
                    descriptionTextForParsing || descriptionHtml
                  ).match(compositionRegex);
                  const materialMatch = (
                    descriptionTextForParsing || descriptionHtml
                  ).match(materialRegex);

                  if (compositionMatch && compositionMatch[1]) {
                    // 处理材质信息，通常是"100% Cotton"或"80% Wool, 20% Polyester"格式
                    const materialText = compositionMatch[1].trim();
                    product.material = materialText.split(",")[0].trim();
                    product.materialDetails = materialText
                      .split(",")
                      .map((m) => m.trim())
                      .filter((m) => m.length > 0);

                    localCrawlerLog.info(
                      `[${siteName}] 从Composition提取材质: ${product.material}`,
                    );
                  } else if (materialMatch && materialMatch[1]) {
                    // 处理Material字段
                    const materialText = materialMatch[1].trim();
                    product.material = materialText.split(",")[0].trim();
                    product.materialDetails = materialText
                      .split(",")
                      .map((m) => m.trim())
                      .filter((m) => m.length > 0);

                    localCrawlerLog.info(
                      `[${siteName}] 从Material提取材质: ${product.material}`,
                    );
                  } else {
                    // 尝试直接从页面中查找材质信息
                    try {
                      const materialElement = await page.$(
                        '*:contains("Composition:"), *:contains("Material:")',
                      );
                      if (materialElement) {
                        const materialText =
                          (await materialElement.textContent()) || "";
                        let extractedMaterial = "";

                        if (materialText.includes("Composition:")) {
                          extractedMaterial = materialText
                            .split("Composition:")[1]
                            .trim();
                        } else if (materialText.includes("Material:")) {
                          extractedMaterial = materialText
                            .split("Material:")[1]
                            .trim();
                        }

                        if (extractedMaterial) {
                          product.material = extractedMaterial
                            .split(",")[0]
                            .trim();
                          product.materialDetails = extractedMaterial
                            .split(",")
                            .map((m) => m.trim())
                            .filter((m) => m.length > 0);

                          localCrawlerLog.info(
                            `[${siteName}] 从元素提取材质: ${product.material}`,
                          );
                        }
                      }
                    } catch (materialError) {
                      localCrawlerLog.debug(
                        `[${siteName}] 查找材质元素出错: ${(materialError as Error).message}`,
                      );
                    }
                  }
                }

                // 日志记录
                if (!product.color) {
                  localCrawlerLog.warning(
                    `[${siteName}] 未能提取到颜色信息 for ${product.url}`,
                  );
                }

                if (!product.material) {
                  localCrawlerLog.warning(
                    `[${siteName}] 未能提取到材质信息 for ${product.url}`,
                  );
                }
              } else {
                localCrawlerLog.warning(
                  `[${siteName}] 描述区域文本为空，无法提取颜色/材质 for ${product.url}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取颜色/材质出错: ${(e as Error).message}`,
              );
            }

            // 6. 提取尺码
            try {
              // 基于提供的HTML结构优化尺码提取
              const sizeSelectorContainer = await page.$(
                SELECTORS.PDP_SIZE_SELECTOR,
              );
              const availableSizes: string[] = [];

              if (sizeSelectorContainer) {
                localCrawlerLog.info(
                  `[${siteName}] 找到尺码选择器容器: ${SELECTORS.PDP_SIZE_SELECTOR}`,
                );

                // 新增：尝试点击按钮以展开尺码下拉菜单
                try {
                  const sizeButton = await sizeSelectorContainer.$("button");
                  if (sizeButton && (await sizeButton.isVisible())) {
                    await sizeButton.click({ timeout: 5000 });
                    await page.waitForTimeout(500); // 等待动画/选项加载
                    localCrawlerLog.info(
                      `[${siteName}] 已点击尺码选择按钮以显示选项。`,
                    );
                  }
                } catch (clickError) {
                  localCrawlerLog.warning(
                    `[${siteName}] 点击尺码选择按钮失败: ${(clickError as Error).message}. 可能是尺码已直接显示。`,
                  );
                }

                // 尝试使用新的专用尺码选项选择器
                const sizeOptions = await page.$$(SELECTORS.PDP_SIZE_OPTIONS);

                if (sizeOptions.length > 0) {
                  localCrawlerLog.info(
                    `[${siteName}] 找到 ${sizeOptions.length} 个尺码选项元素`,
                  );

                  for (const option of sizeOptions) {
                    if (await option.isVisible()) {
                      const fullText =
                        (await option.textContent())?.trim() || "";

                      // 处理可能带有 "Only X left" 文本的尺码
                      let processedSizeText = fullText;

                      // 尝试分离尺码信息和库存信息
                      if (fullText.includes("Only")) {
                        processedSizeText = fullText.split("Only")[0].trim();
                      } else if (fullText.includes("left")) {
                        processedSizeText = fullText.split("left")[0].trim();
                      }

                      if (
                        processedSizeText &&
                        processedSizeText.length > 0 &&
                        processedSizeText.length < 20
                      ) {
                        availableSizes.push(processedSizeText);
                      }
                    }
                  }
                } else {
                  // 回退方案 A: 检查下拉框中的选项
                  const dropdownEl = await sizeSelectorContainer.$(
                    "button .placeholder",
                  );
                  if (dropdownEl) {
                    const selectedSizeText =
                      (await dropdownEl.textContent())?.trim() || "";

                    if (
                      selectedSizeText &&
                      selectedSizeText.includes("Selected Size:")
                    ) {
                      const extractedSize = selectedSizeText
                        .replace("Selected Size:", "")
                        .trim();
                      if (extractedSize && extractedSize.length > 0) {
                        availableSizes.push(extractedSize);
                        localCrawlerLog.info(
                          `[${siteName}] 从已选中尺码提取: ${extractedSize}`,
                        );
                      }
                    }
                  }

                  // 回退方案 B: 寻找可见的下拉列表
                  const visibleDropdown = await page.$(
                    "ul.visibleList.dropdown",
                  );
                  if (visibleDropdown) {
                    const listItems = await visibleDropdown.$$("li");
                    for (const item of listItems) {
                      const sizeOptionEl = await item.$(".size-option");
                      if (sizeOptionEl) {
                        const fullText =
                          (await sizeOptionEl.textContent())?.trim() || "";
                        const sizeText = fullText.split("Only")[0].trim();
                        if (sizeText && sizeText.length > 0) {
                          availableSizes.push(sizeText);
                        }
                      }
                    }
                  }

                  // 回退方案 C: 从描述信息中提取尺码
                  if (availableSizes.length === 0 && product.description) {
                    const sizeMatches =
                      product.description.match(/Size:?\s*([\w\s.]+)/i) ||
                      product.description.match(/Size and fit:?\s*([\w\s.]+)/i);
                    if (sizeMatches && sizeMatches[1]) {
                      availableSizes.push(sizeMatches[1].trim());
                      localCrawlerLog.info(
                        `[${siteName}] 从描述中提取尺码: ${sizeMatches[1].trim()}`,
                      );
                    }
                  }
                }

                // 处理并保存尺码信息
                product.sizes = [...new Set(availableSizes)]
                  .filter(
                    (s) =>
                      s.toLowerCase() !== "select size" &&
                      s.toLowerCase() !== "size",
                  )
                  .map((s) => s.replace(/\s+/g, " ").trim()); // 清理多余空格

                if (product.sizes.length > 0) {
                  localCrawlerLog.info(
                    `[${siteName}] 提取到尺码: ${product.sizes.join(", ")}`,
                  );
                } else {
                  localCrawlerLog.warning(
                    `[${siteName}] 尺码选择器找到，但未能提取到有效尺码 for ${product.url}`,
                  );
                }
              } else {
                // 尝试直接从页面中搜索尺码元素
                const directSizeElements = await page.$$(
                  ".size-option, span:contains('Size:'), div:contains('Size:')",
                );

                for (const el of directSizeElements) {
                  const text = (await el.textContent())?.trim() || "";
                  if (text.includes("Size:")) {
                    const extractedSize = text.split("Size:")[1].trim();
                    if (
                      extractedSize &&
                      extractedSize.length > 0 &&
                      extractedSize.length < 20
                    ) {
                      availableSizes.push(extractedSize);
                    }
                  } else if (
                    text.length > 0 &&
                    text.length < 15 &&
                    !text.toLowerCase().includes("select")
                  ) {
                    availableSizes.push(text);
                  }
                }

                if (availableSizes.length > 0) {
                  product.sizes = [...new Set(availableSizes)];
                  localCrawlerLog.info(
                    `[${siteName}] 直接搜索提取到尺码: ${product.sizes.join(", ")}`,
                  );
                } else {
                  localCrawlerLog.warning(
                    `[${siteName}] 未找到尺码选择器或尺码信息 for ${product.url}`,
                  );
                }
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取尺码出错: ${(e as Error).message}`,
              );
            }

            // 7. 提取PDP特定标签 (合并到现有标签)
            try {
              // 假设PDP页面的标签可能在特定区域，或通过特定class标识
              const pdpTagElements = await page.$$(
                'span[class*="tag"], div[class*="label"], a[href*="/sets/"]',
              ); // 宽泛的选择器示例
              const pdpTags: string[] = [];
              for (const tagEl of pdpTagElements) {
                const tagText = (await tagEl.textContent())?.trim();
                if (
                  tagText &&
                  tagText.length > 1 &&
                  tagText.length < 50 &&
                  !tagText.startsWith("http")
                ) {
                  // 简单的有效性检查
                  pdpTags.push(tagText);
                }
              }
              if (pdpTags.length > 0) {
                product.tags = [
                  ...new Set([...(product.tags || []), ...pdpTags]),
                ]; // 合并并去重
                localCrawlerLog.info(
                  `[${siteName}] PDP 标签提取并合并后: ${product.tags.join(", ")}`,
                );
              }
            } catch (e) {
              localCrawlerLog.warning(
                `[${siteName}] 提取PDP标签出错: ${(e as Error).message}`,
              );
            }

            await pushData(product);
            allScrapedProducts.push(product);
            localCrawlerLog.info(
              `[${siteName}] 产品 ${product.name || product.sku} 数据已推送。`,
            );

            if (maxProducts && processedDetailPages >= maxProducts) {
              localCrawlerLog.info(
                `[${siteName}] 已达到最大产品处理数 (${maxProducts})，将停止添加新请求。`,
              );
              // 不直接调用 pwtCrawler.stop()，而是通过不再添加新请求来自然结束
            }
          } else {
            // LIST page
            localCrawlerLog.info(`[${siteName}] 识别为列表页: ${request.url}`);

            // 获取当前LIST页面对应的原始URL
            const currentOriginUrl = request.userData?.originUrl || request.url;
            const currentUrlCounters = urlProductCounts.get(currentOriginUrl);

            await processProductCardsOnPlpItalist(
              page,
              request,
              pwtCrawler,
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
              currentBatchGender,
              processedUrls,
            );

            // 检查当前URL是否已达到限制
            if (
              currentUrlCounters &&
              currentUrlCounters.enqueuedDetailPages >= maxProductsPerUrl
            ) {
              localCrawlerLog.info(
                `[${siteName}] Reached max products enqueue limit (${maxProductsPerUrl}) for URL ${currentOriginUrl}, not proceeding to pagination.`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `Reached max products enqueue limit (${maxProductsPerUrl}) for specific URL.`,
                  { originUrl: currentOriginUrl },
                );
              }
              return;
            }

            if (
              currentUrlCounters &&
              currentUrlCounters.enqueuedDetailPages < maxProductsPerUrl
            ) {
              await handlePaginationItalist(
                page,
                request,
                pwtCrawler,
                localCrawlerLog,
                maxProductsPerUrl, // 使用每个URL的限制
                currentUrlCounters.enqueuedDetailPages,
                currentExecutionId,
                currentBatchGender,
                options,
                processedUrls,
              );
            }
          }
        } catch (e: unknown) {
          const error = e as Error;
          localCrawlerLog.error(
            `[${siteName}] 请求处理错误 ${request.url}: ${error.message}`,
            { stack: error.stack },
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.ERROR,
              `[${siteName}] Request handler error: ${error.message}`,
              { url: request.url, stack: error.stack, label: requestLabel },
            );
          }
        }
      },
      async failedRequestHandler({
        request,
        log: localFailedLog,
      }: PlaywrightCrawlingContext<ItalistUserData>) {
        // 明确类型
        const handlerExecutionId = request.userData?.executionId;
        localFailedLog.error(
          `[${siteName}] 请求 ${request.url} 失败! 错误: ${request.errorMessages?.join(", ")}`,
        );
        if (handlerExecutionId) {
          await sendLogToBackend(
            handlerExecutionId,
            LocalScraperLogLevel.ERROR,
            `[${siteName}] 请求 ${request.url} 失败!`,
            {
              url: request.url,
              errors: request.errorMessages?.join("; "),
              label: request.label,
              userData: request.userData,
            },
          );
        }
      },
    },
    config,
  );

  const initialRequestObjects = (
    Array.isArray(startUrls) ? startUrls : [startUrls]
  ).map((url) => ({
    url,
    userData: {
      executionId,
      label: "LIST",
      batchGender,
      originUrl: url, // 新增：为每个初始请求添加originUrl
    } as ItalistUserData,
    label: "LIST",
    uniqueKey: url, // Added uniqueKey for initial requests too
  }));

  if (initialRequestObjects.length > 0) {
    crawleeLog.info(
      `[${siteName}] 开始爬取 ${initialRequestObjects.length} 个初始URL。`,
    );
    await crawler.run(initialRequestObjects);
  } else {
    crawleeLog.warning(`[${siteName}] 没有有效的初始URL可供爬取。`);
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `[${siteName}] No valid initial URLs to start crawl.`,
      );
    }
  }

  crawleeLog.info(
    `[${siteName}] 爬虫结束。共收集 ${allScrapedProducts.length} 个商品。已处理详情页: ${processedDetailPages}, 已入队详情页: ${enqueuedDetailPages}, 已处理URL总数: ${processedUrls.size}`,
  );
  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `[${siteName}] 爬虫结束。共收集: ${allScrapedProducts.length} 个商品.`,
      {
        processedDetailPages,
        enqueuedDetailPages,
        processedUrlsCount: processedUrls.size,
      },
    );
  }

  return allScrapedProducts;
};

export default scrapeItalist;
