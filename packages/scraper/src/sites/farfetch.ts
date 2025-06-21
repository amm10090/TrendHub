// packages/scraper/src/sites/farfetch.ts
import {
  Configuration,
  type Log,
  type Request as CrawleeRequest,
  log as crawleeLog,
  PlaywrightCrawler,
} from "crawlee";
import type { Page, ElementHandle } from "playwright";
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

interface FarfetchUserData {
  executionId?: string;
  plpData?: Partial<Product>; // Data gathered from PLP to pass to PDP
  label?: "LIST" | "DETAIL";
  batchGender?: "women" | "men" | "unisex" | string | null;
  originUrl?: string; // 新增：获取原始URL
  // currentPage?: number; // Optional: for pagination state, if needed beyond URL params
}

const SELECTORS = {
  // PLP - 产品列表页
  PRODUCT_CARD: 'li[data-testid="productCard"]',
  PRODUCT_LINK: 'a[data-component="ProductCardLink"]',
  PLP_BRAND: 'p[data-component="ProductCardBrandName"]',
  PLP_NAME: 'p[data-component="ProductCardDescription"]',
  PLP_IMAGE: 'img[data-component="ProductCardImagePrimary"]',
  PLP_ORIGINAL_PRICE: 'p[data-component="PriceOriginal"]',
  PLP_CURRENT_PRICE: 'p[data-component="PriceFinal"]',
  PLP_SIZES: 'p[data-component="ProductCardSizesAvailable"]',
  PAGINATION_NEXT_LINK: 'a[data-component="PaginationNextActionButton"]',

  // PDP - 产品详情页
  PDP_BRAND_LINK: 'a[data-ffref="pp_infobrd"]',
  PDP_NAME: 'p[data-component="Body"]',
  PDP_IMAGE: 'img[data-component="Img"].ltr-1w2up3s',
  PDP_ORIGINAL_PRICE: 'p[data-component="PriceOriginal"]',
  PDP_CURRENT_PRICE: 'p[data-component="PriceFinalLarge"]',
  PDP_BREADCRUMBS:
    'nav[data-component="BreadcrumbsNavigation"] ol[data-component="Breadcrumbs"] li a[data-component="Breadcrumb"]',

  // 商品详情区域 - 基于提供的HTML
  DETAILS_PANEL: 'div[data-testid="product-information-accordion"]',
  DETAILS_ACCORDION_ITEM: 'section[data-component="AccordionItem"]',
  DETAILS_ACCORDION_BUTTON: 'button[data-component="AccordionButton"]',
  DETAILS_ACCORDION_PANEL:
    'div[data-component="AccordionPanel"][data-expanded="true"]',
  DETAILS_INNER_PANEL: 'div[data-component="InnerPanel"]',

  // 产品具体信息
  DETAILS_HIGHLIGHTS_CONTAINER: "div.ltr-fzg9du",
  DETAILS_HIGHLIGHTS_LIST: "ul._fdc1e5 li",
  DETAILS_COMPOSITION_CONTAINER: "div.ltr-92qs1a",

  // 弹窗处理
  NEWSLETTER_MODAL:
    'div[data-testid="newsletter-modal"][data-component="ConnectedModalDesktop"]',
  NEWSLETTER_MODAL_CLOSE_BUTTON:
    'button[data-testid="btnClose"][data-component="ModalCloseButton"]',

  // PDP - 尺码选择器 (PDP - Size Selector)
  PDP_SIZE_SELECTOR_TRIGGER:
    'div[data-component="SizeSelectorLabel"][aria-disabled="false"]', // 定位到可点击的尺码选择触发器 (Clickable trigger for size selector)
  PDP_SIZE_OPTIONS_WRAPPER: 'div[data-component="SizeSelectorOptionsWrapper"]', // 尺码选项下拉框容器 (Container for size options dropdown)
  PDP_SIZE_OPTION_ITEM:
    'ul[data-component="SizeSelectorOptions"] > li[data-component="SizeSelectorOption"]', // 单个尺码选项 (Individual size option item)
  PDP_SIZE_OPTION_TEXT:
    'p[data-component="SizeSelectorOptionSize"] span[data-component="BodyBold"]', // 尺码文本 (e.g., "XS") (Size text, e.g., "XS")
  PDP_SIZE_OPTION_AVAILABILITY: 'p[data-component="SizeSelectorOptionLabel"]', // 库存信息 (e.g., "Last 1 left") (Availability info, e.g., "Last 1 left")
};

function inferGenderFromFarfetchUrl(
  url: string,
): "women" | "men" | "unisex" | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/women")) return "women"; // Covers /women/ and /shopping/women/
  if (urlLower.includes("/men")) return "men"; // Covers /men/ and /shopping/men/
  // Farfetch URLs might not always explicitly state "unisex" for unisex items.
  // It might be inferred from category or be a default if neither men/women found.
  // For now, returning null if not explicitly men/women.
  // Consider if categories like "kids" should map to unisex or null.
  // Based on previous API route: children maps to null. Other unisex paths might exist.
  if (urlLower.includes("/kids/") || urlLower.includes("/children/"))
    return null;
  // Add other specific unisex paths if identified, e.g., urlLower.includes("/unisex/")
  return null;
}

/**
 * 处理页面上的弹窗，检测并关闭
 * @param page Playwright页面实例
 * @param localCrawlerLog 日志实例
 * @param executionId 可选的执行ID用于发送日志
 */
async function handlePopups(
  page: Page,
  localCrawlerLog: Log,
  executionId?: string,
): Promise<void> {
  if (page.isClosed()) {
    localCrawlerLog.warning(
      `Farfetch: Page is closed at the beginning of handlePopups. Skipping pop-up handling.`,
    );
    return;
  }
  try {
    // 稍微等待，确保页面加载完成并且弹窗有时间显示
    await page.waitForTimeout(1000);

    // 检查通讯订阅弹窗是否存在
    const hasNewsletterModal = await page.$(SELECTORS.NEWSLETTER_MODAL);
    if (hasNewsletterModal) {
      localCrawlerLog.info("Farfetch: 检测到订阅通讯弹窗，尝试关闭它。");

      // 尝试多种方法关闭弹窗
      // 方法1: 常规方式 - 找到并点击关闭按钮
      const closeButton = await page.$(SELECTORS.NEWSLETTER_MODAL_CLOSE_BUTTON);
      if (closeButton) {
        // 尝试直接点击
        await closeButton.click();
        await page.waitForTimeout(1000); // 增加等待时间到1秒

        // 验证弹窗是否已关闭
        let modalStillVisible = await page.$(SELECTORS.NEWSLETTER_MODAL);
        if (!modalStillVisible) {
          localCrawlerLog.info("Farfetch: 成功关闭订阅通讯弹窗。");
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.INFO,
              "Farfetch: 成功关闭订阅通讯弹窗。",
            );
          }
          return;
        }

        // 第一次尝试失败，再次尝试
        localCrawlerLog.info("Farfetch: 第一次点击未能关闭弹窗，再次尝试...");
        try {
          // 使用JavaScript点击，有时更可靠
          await page.evaluate(() => {
            const closeBtn = document.querySelector(
              'button[data-testid="btnClose"]',
            );
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
            }
          });
          await page.waitForTimeout(1000);

          modalStillVisible = await page.$(SELECTORS.NEWSLETTER_MODAL);
          if (!modalStillVisible) {
            localCrawlerLog.info(
              "Farfetch: 通过JavaScript点击成功关闭订阅通讯弹窗。",
            );
            if (executionId) {
              await sendLogToBackend(
                executionId,
                LocalScraperLogLevel.INFO,
                "Farfetch: 通过JavaScript点击成功关闭订阅通讯弹窗。",
              );
            }
            return;
          }
        } catch (clickError) {
          localCrawlerLog.warning(
            `Farfetch: JavaScript点击尝试失败: ${(clickError as Error).message}`,
          );
        }

        // 最后尝试通过修改DOM隐藏弹窗
        try {
          await page.evaluate(() => {
            const modal = document.querySelector(
              'div[data-testid="newsletter-modal"]',
            );
            if (modal) {
              (modal as HTMLElement).style.display = "none";
              // 移除modal相关样式，避免页面滚动受限
              document.body.style.overflow = "";
              document.body.style.position = "";
            }
          });
          localCrawlerLog.info("Farfetch: 尝试通过DOM操作隐藏弹窗。");
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.INFO,
              "Farfetch: 尝试通过DOM操作隐藏弹窗。",
            );
          }
        } catch (domError) {
          localCrawlerLog.warning(
            `Farfetch: DOM操作尝试失败: ${(domError as Error).message}`,
          );
        }
      } else {
        // 如果找不到关闭按钮，尝试直接通过DOM隐藏弹窗
        localCrawlerLog.warning(
          "Farfetch: 找到订阅通讯弹窗但未找到关闭按钮，尝试通过DOM隐藏。",
        );
        try {
          await page.evaluate(() => {
            const modal = document.querySelector(
              'div[data-testid="newsletter-modal"]',
            );
            if (modal) {
              (modal as HTMLElement).style.display = "none";
              document.body.style.overflow = "";
              document.body.style.position = "";
            }
          });
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.WARN,
              "Farfetch: 检测到订阅通讯弹窗，但未找到关闭按钮。已尝试通过DOM隐藏。",
            );
          }
        } catch (hidingError) {
          localCrawlerLog.error(
            `Farfetch: 尝试隐藏弹窗失败: ${(hidingError as Error).message}`,
          );
          if (executionId) {
            await sendLogToBackend(
              executionId,
              LocalScraperLogLevel.ERROR,
              `Farfetch: 尝试隐藏弹窗失败: ${(hidingError as Error).message}`,
            );
          }
        }
      }
    }
  } catch (error: unknown) {
    const castError = error as Error;
    localCrawlerLog.error(`Farfetch: 处理弹窗时出错: ${castError.message}`, {
      stack: castError.stack,
    });
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `Farfetch: 处理弹窗时出错: ${castError.message}`,
        { stack: castError.stack },
      );
    }
  }
}

async function processProductCardsOnPlp(
  page: Page, // Added Page type
  request: CrawleeRequest<FarfetchUserData>, // Use CrawleeRequest and FarfetchUserData
  crawler: PlaywrightCrawler, // Use PlaywrightCrawler type
  localCrawlerLog: Log, // Use Log type
  maxProductsLimit: number,
  currentEnqueuedCount: number,
  updateEnqueuedCountCB: (newCount: number) => void,
  executionId?: string,
  batchGender?: string | null,
  processedUrlsSet?: Set<string>, // Optional, but recommended for session de-duplication
  siteName: ECommerceSite = "Farfetch", // <<<< 新增 siteName 参数
  originUrl?: string, // 新增：传递原始URL参数
) {
  if (page.isClosed()) {
    const msg = `${siteName}: Page for ${request.url} is closed before processing product items. Skipping.`; // 使用 siteName
    localCrawlerLog.warning(msg);
    if (executionId) {
      await sendLogToBackend(executionId, LocalScraperLogLevel.WARN, msg, {
        url: request.url,
      });
    }
    return;
  }

  let localEnqueuedCount = currentEnqueuedCount;
  const potentialDetailUrls: { url: string; plpData: Partial<Product> }[] = [];

  // 获取所有产品卡片元素，但筛选掉骨架屏元素
  let productCardElements = await page.$$(SELECTORS.PRODUCT_CARD);

  // 筛选掉骨架屏元素 (ProductCardSkeleton)
  // 使用page.$eval来执行筛选，返回有效产品卡片的选择器
  const validCards = await page.$$eval(SELECTORS.PRODUCT_CARD, (cards) => {
    return cards
      .filter((card) => {
        // 检查是否有ProductCardSkeleton组件
        const isSkeletonCard =
          card.getAttribute("data-component") === "ProductCardSkeleton";
        // 检查是否包含实际产品链接
        const hasLink =
          card.querySelector('a[data-component="ProductCardLink"]') !== null;
        return !isSkeletonCard && hasLink;
      })
      .map((_, index) => index); // 返回有效卡片的索引
  });

  // 使用筛选后的索引获取ElementHandle对象
  const validCardElements: ElementHandle<HTMLElement | SVGElement>[] = [];
  for (const index of validCards) {
    const elements = await page.$$(SELECTORS.PRODUCT_CARD);
    if (index < elements.length) {
      validCardElements.push(elements[index]);
    }
  }

  productCardElements = validCardElements;

  localCrawlerLog.info(
    `${siteName}: Found ${productCardElements.length} valid product cards on ${request.url}. Current enqueued: ${localEnqueuedCount}/${maxProductsLimit}. Processed URLs: ${processedUrlsSet?.size || 0}`,
  );

  // 新增：实现懒加载处理逻辑，滚动到页面底部以加载更多商品卡片
  let previousCardCount = productCardElements.length;
  let loadAttempts = 0;
  const maxLoadAttempts = 5; // 最大加载尝试次数

  // 如果找到的卡片数量小于页面应有的商品数量，并且没有达到获取限制，尝试滚动加载更多
  while (
    productCardElements.length < 96 && // Farfetch一页通常有96个商品
    loadAttempts < maxLoadAttempts &&
    localEnqueuedCount < maxProductsLimit
  ) {
    loadAttempts++;
    localCrawlerLog.info(
      `${siteName}: Attempting to scroll and load more products (attempt ${loadAttempts}/${maxLoadAttempts}). Current card count: ${productCardElements.length}`,
    );

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `${siteName}: Scrolling to load more products (attempt ${loadAttempts}/${maxLoadAttempts})`,
        { currentCardCount: productCardElements.length },
      );
    }

    try {
      // 滚动到页面底部以触发懒加载
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // 等待新内容加载
      await page.waitForTimeout(2000);

      // 筛选有效卡片
      const newValidCards = await page.$$eval(
        SELECTORS.PRODUCT_CARD,
        (cards) => {
          return cards
            .filter((card) => {
              const isSkeletonCard =
                card.getAttribute("data-component") === "ProductCardSkeleton";
              const hasLink =
                card.querySelector('a[data-component="ProductCardLink"]') !==
                null;
              return !isSkeletonCard && hasLink;
            })
            .map((_, index) => index);
        },
      );

      // 重建validCardElements数组
      const newValidCardElements: ElementHandle<HTMLElement | SVGElement>[] =
        [];
      for (const index of newValidCards) {
        const elements = await page.$$(SELECTORS.PRODUCT_CARD);
        if (index < elements.length) {
          newValidCardElements.push(elements[index]);
        }
      }

      productCardElements = newValidCardElements;

      // 检查是否加载了新卡片
      if (productCardElements.length <= previousCardCount) {
        localCrawlerLog.info(
          `${siteName}: No new cards loaded after scroll attempt ${loadAttempts}, stopping lazy load process. Card count: ${productCardElements.length}`,
        );
        break;
      }

      localCrawlerLog.info(
        `${siteName}: After scroll attempt ${loadAttempts}, found ${productCardElements.length} cards (+${productCardElements.length - previousCardCount} new)`,
      );
      previousCardCount = productCardElements.length;
    } catch (scrollError) {
      const error = scrollError as Error;
      localCrawlerLog.error(
        `${siteName}: Error during lazy load scrolling (attempt ${loadAttempts}): ${error.message}`,
        { stack: error.stack },
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `${siteName}: Error during lazy load scrolling: ${error.message}`,
          { stack: error.stack },
        );
      }
      break;
    }
  }

  localCrawlerLog.info(
    `${siteName}: Completed lazy loading with ${productCardElements.length} total valid product cards on ${request.url}.`,
  );

  for (const card of productCardElements) {
    if (localEnqueuedCount >= maxProductsLimit) {
      localCrawlerLog.info(
        `${siteName}: Reached max product enqueue limit (${maxProductsLimit}) during PLP card processing.`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `${siteName}: Max product enqueue limit reached in processProductCards (mid-loop).`,
        );
      }
      break;
    }

    let fullProductUrl = "";
    const cardIndexOnPage = productCardElements.indexOf(card); // 获取当前卡片在列表中的索引

    try {
      // 确保卡片在视口内并给予加载时间
      try {
        await card.scrollIntoViewIfNeeded();
        localCrawlerLog.debug(
          `${siteName}: Card (index ${cardIndexOnPage}) scrolled into view on ${request.url}.`,
        );
        await page.waitForTimeout(750); // 给予短暂延时等待加载
      } catch (scrollError: unknown) {
        const castedScrollError = scrollError as Error;
        localCrawlerLog.warning(
          `${siteName}: Error scrolling card (index ${cardIndexOnPage}) into view or waiting on ${request.url}: ${castedScrollError.message}`,
          { stack: castedScrollError.stack },
        );
        // 此处决定是否继续处理该卡片，暂时记录警告并继续
      }

      const linkElement = await card.$(SELECTORS.PRODUCT_LINK);
      if (!linkElement) {
        localCrawlerLog.warning(
          `Farfetch: Product card link not found (index ${cardIndexOnPage}).`,
          { htmlBrief: (await card.innerHTML()).substring(0, 200) },
        );
        continue;
      }
      const href = await linkElement.getAttribute("href");
      if (!href) {
        localCrawlerLog.warning("Farfetch: Product card href not found.", {
          htmlBrief: (await linkElement.innerHTML()).substring(0, 200),
        });
        continue;
      }
      fullProductUrl = new URL(href, request.loadedUrl).toString();

      if (processedUrlsSet && processedUrlsSet.has(fullProductUrl)) {
        continue;
      }

      const plpData: Partial<Product> = {
        source: "Farfetch",
        gender: batchGender,
        url: fullProductUrl,
        metadata: {
          executionId,
          cardIndexOnPage, // <<< 添加页面索引
          storeId: new URL(request.url).searchParams.get("storeid"),
        },
      };

      const brandElement = await card.$(SELECTORS.PLP_BRAND);
      plpData.brand = (await brandElement?.textContent())?.trim();

      const nameElement = await card.$(SELECTORS.PLP_NAME);
      plpData.name = (await nameElement?.textContent())?.trim();

      const imageElement = await card.$(SELECTORS.PLP_IMAGE);
      const imgSrc = await imageElement?.getAttribute("src");
      if (imgSrc) plpData.images = [imgSrc];

      const currentPriceElement = await card.$(SELECTORS.PLP_CURRENT_PRICE);
      const currentPriceText = (
        await currentPriceElement?.textContent()
      )?.trim();
      if (currentPriceText) {
        const priceAmount = cleanPrice(currentPriceText);
        plpData.currentPrice = {
          amount: priceAmount,
          currency: request.url.includes("/tw/") ? "TWD" : "USD",
        };
      }

      const originalPriceElement = await card.$(SELECTORS.PLP_ORIGINAL_PRICE);
      const originalPriceText = (
        await originalPriceElement?.textContent()
      )?.trim();
      if (originalPriceText) {
        const priceAmount = cleanPrice(originalPriceText);
        plpData.originalPrice = {
          amount: priceAmount,
          currency: request.url.includes("/tw/") ? "TWD" : "USD",
        };
      }

      // Sizes from PLP are usually just availability indicators, full list on PDP
      // plpData.sizes = [(await card.$(SELECTORS.PLP_SIZES)?.textContent())?.trim() || "N/A"];

      potentialDetailUrls.push({ url: fullProductUrl, plpData });
    } catch (e: unknown) {
      const error = e as Error;
      localCrawlerLog.error(
        `${siteName}: Error processing a product card (index ${cardIndexOnPage}) on ${request.url} (item URL: ${fullProductUrl || "unknown"}): ${error.message}`,
        { stack: error.stack },
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `${siteName}: Error processing card (index ${cardIndexOnPage}) on ${request.url}: ${error.message}`,
          { stack: error.stack, itemUrl: fullProductUrl },
        );
      }
    }
  }

  if (potentialDetailUrls.length > 0) {
    const urlsToCheck = potentialDetailUrls.map((p) => p.url);
    let existingUrls: string[] = [];

    try {
      const BATCH_EXISTS_API_ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_API_URL
        ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/internal/products/batch-exists`
        : "http://localhost:3001/api/internal/products/batch-exists";

      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.DEBUG,
          `${siteName}: Calling batch-exists API for ${urlsToCheck.length} URLs. Endpoint: ${BATCH_EXISTS_API_ENDPOINT}`,
        );
      }
      const response = await fetch(BATCH_EXISTS_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsToCheck, source: "Farfetch" }),
      });

      if (response.ok) {
        const data = await response.json();
        existingUrls = data.existingUrls || [];
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `${siteName}: Batch-exists API returned ${existingUrls.length} existing URLs.`,
            { existingUrls: existingUrls.slice(0, 10) },
          ); // Log first 10 existing URLs and use siteName
        }
      } else {
        const errorText = await response.text();
        localCrawlerLog.error(
          `${siteName}: Batch-exists API call failed. Status: ${response.status}. Body: ${errorText.substring(0, 500)}`,
        ); // 使用 siteName
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `${siteName}: Batch-exists API call failed. Status: ${response.status}`,
            { responseBodyBrief: errorText.substring(0, 500) },
          ); // 使用 siteName
        }
      }
    } catch (e: unknown) {
      const apiError = e as Error;
      localCrawlerLog.error(
        `${siteName}: Error calling batch-exists API: ${apiError.message}`,
        { stack: apiError.stack },
      ); // 使用 siteName
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `${siteName}: Error calling batch-exists API: ${apiError.message}`,
          { stack: apiError.stack },
        ); // 使用 siteName
      }
    }

    for (const item of potentialDetailUrls) {
      if (localEnqueuedCount >= maxProductsLimit) break;
      if (existingUrls.includes(item.url)) {
        if (processedUrlsSet) processedUrlsSet.add(item.url); // Still mark as processed to avoid re-checking if logic changes
        localCrawlerLog.info(
          `${siteName}: URL ${item.url} skipped, already exists in DB (per batch-exists).`,
        ); // 使用 siteName
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.INFO,
            `${siteName}: URL skipped, already exists in DB`,
            { url: item.url },
          ); // 使用 siteName
        }
        continue;
      }
      if (processedUrlsSet && processedUrlsSet.has(item.url)) {
        continue;
      }

      try {
        if (processedUrlsSet) processedUrlsSet.add(item.url);
        const detailUserData: FarfetchUserData = {
          label: "DETAIL",
          plpData: item.plpData, // plpData 已经包含了带有 cardIndexOnPage 的 metadata
          executionId,
          batchGender,
          originUrl, // 新增：传递原始URL参数
        };
        await crawler.addRequests([
          { url: item.url, label: "DETAIL", userData: detailUserData },
        ]);
        localEnqueuedCount++;
      } catch (e: unknown) {
        const enqueueError = e as Error;
        localCrawlerLog.error(
          `${siteName}: Error enqueuing item (from card index ${item.plpData.metadata?.cardIndexOnPage}) ${item.url}: ${enqueueError.message}`,
          { stack: enqueueError.stack },
        );
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.ERROR,
            `${siteName}: Error enqueuing item (from card index ${item.plpData.metadata?.cardIndexOnPage}) ${item.url}: ${enqueueError.message}`,
            { stack: enqueueError.stack },
          );
        }
      }
    }
  }
  updateEnqueuedCountCB(localEnqueuedCount);
  localCrawlerLog.info(
    `${siteName}: processProductCardsOnPlp finished for ${request.url}. Total enqueued now: ${localEnqueuedCount}`,
  );
}

async function handlePaginationOnPlp(
  page: Page,
  request: CrawleeRequest<FarfetchUserData>,
  crawler: PlaywrightCrawler,
  localCrawlerLog: Log,
  maxProductsLimit: number,
  currentEnqueuedCount: number, // Current total enqueued products across all pages for this run
  executionId?: string,
  batchGender?: string | null,
  scraperOptions?: ScraperOptions,
  originUrl?: string, // 新增：传递原始URL参数
) {
  if (currentEnqueuedCount >= maxProductsLimit) {
    localCrawlerLog.info(
      `Farfetch: Max products limit reached (${maxProductsLimit}), not attempting pagination from ${request.url}.`,
    );
    return;
  }

  if (page.isClosed()) {
    localCrawlerLog.warning(
      `Farfetch: Page for ${request.url} is closed at the beginning of handlePaginationOnPlp. Skipping pagination.`,
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `Farfetch: Page closed (pagination start) for ${request.url}`,
      );
    }
    return;
  }

  // Basic pagination click limit to prevent infinite loops if maxProductsLimit is very high or not reached
  const maxPagingClicks = scraperOptions?.maxLoadClicks || 200; // Default to a high number of pages if not set
  let currentPageNum = 1;
  const urlParams = new URLSearchParams(new URL(request.url).search);
  if (urlParams.has("page")) {
    currentPageNum = parseInt(urlParams.get("page") || "1", 10);
  }

  if (currentPageNum >= maxPagingClicks) {
    localCrawlerLog.info(
      `Farfetch: Reached max pagination clicks (${maxPagingClicks}) for ${request.url}.`,
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Farfetch: Reached max paging clicks (${maxPagingClicks}) on PLP.`,
        { baseUrl: request.url.split("?")[0] },
      );
    }
    return;
  }

  try {
    const nextPageLinkElement = await page.$(SELECTORS.PAGINATION_NEXT_LINK);
    if (nextPageLinkElement) {
      const nextPageHref = await nextPageLinkElement.getAttribute("href");
      if (nextPageHref) {
        const nextPageUrl = new URL(nextPageHref, request.loadedUrl).toString();
        localCrawlerLog.info(
          `Farfetch: Enqueuing next list page: ${nextPageUrl} from ${request.url}`,
        );
        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.DEBUG,
            `Farfetch: Enqueuing next PLP: ${nextPageUrl}`,
            { fromUrl: request.url },
          );
        }
        const nextListPageUserData: FarfetchUserData = {
          label: "LIST",
          executionId,
          batchGender,
          originUrl, // 新增：保持原始URL
          // plpData is not carried over to next LIST page, only to DETAIL pages
        };
        await crawler.addRequests([
          { url: nextPageUrl, label: "LIST", userData: nextListPageUserData },
        ]);
      } else {
        localCrawlerLog.info(
          `Farfetch: Next page link found on ${request.url}, but no href attribute.`,
        );
      }
    } else {
      localCrawlerLog.info(
        `Farfetch: No next page link found on ${request.url}. Assuming end of pagination.`,
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `Farfetch: No next page link found on ${request.url}. End of PLP.`,
          { url: request.url },
        );
      }
    }
  } catch (error: unknown) {
    const castError = error as Error;
    localCrawlerLog.error(
      `Farfetch: Error handling pagination on ${request.url}: ${castError.message}`,
      { stack: castError.stack },
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `Farfetch: Error in pagination on ${request.url}: ${castError.message}`,
        { stack: castError.stack },
      );
    }
  }
}

/**
 * 清理Farfetch面包屑导航数组。
 * 规则：
 * 1. "Women Home" -> "Women", "Men Home" -> "Men"。
 * 2. 移除与产品品牌名称匹配的项 (忽略大小写)。
 * @param originalBreadcrumbs 原始提取的面包屑字符串数组。
 * @param productBrand 从产品详情中提取的品牌名称，用于过滤。
 * @param logger Crawlee的日志实例。
 * @param siteName 站点名称，用于日志。
 * @returns 清理后的面包屑字符串数组。
 */
function cleanFarfetchBreadcrumbs(
  originalBreadcrumbs: string[],
  productBrand?: string,
  logger?: Log, // 可选的日志记录器
  siteName?: string, // 可选的站点名称
): string[] {
  if (!originalBreadcrumbs || originalBreadcrumbs.length === 0) {
    return [];
  }

  let cleaned = [...originalBreadcrumbs];
  const logPrefix = siteName ? `${siteName}: ` : "";

  // 规则 1: 清理 "X Home"
  if (cleaned.length > 0) {
    if (cleaned[0] === "Women Home") {
      cleaned[0] = "Women";
      logger?.debug(`${logPrefix}Breadcrumb cleanup: "Women Home" -> "Women"`);
    } else if (cleaned[0] === "Men Home") {
      cleaned[0] = "Men";
      logger?.debug(`${logPrefix}Breadcrumb cleanup: "Men Home" -> "Men"`);
    }
    // 可以根据需要添加更多 "XXX Home" 的规则
  }

  // 规则 2: 移除品牌名
  if (productBrand && productBrand.trim() !== "") {
    const brandLower = productBrand.toLowerCase();
    const initialLength = cleaned.length;
    cleaned = cleaned.filter((crumb) => {
      const crumbLower = crumb.toLowerCase();
      return crumbLower !== brandLower;
    });
    if (cleaned.length < initialLength) {
      logger?.debug(
        `${logPrefix}Breadcrumb cleanup: Removed brand "${productBrand}".`,
      );
    }
  } else {
    logger?.debug(
      `${logPrefix}Breadcrumb cleanup: No productBrand provided or brand is empty, skipping brand removal.`,
    );
  }

  logger?.debug(
    `${logPrefix}Original breadcrumbs for cleaning: [${originalBreadcrumbs.join(", ")}] Cleaned: [${cleaned.join(", ")}]`,
  );

  return cleaned;
}

const scrapeFarfetch: ScraperFunction = async (
  startUrls: string | string[],
  options: ScraperOptions = {},
  executionId?: string,
) => {
  const siteName: ECommerceSite = "Farfetch";
  const allScrapedProducts: Product[] = [];
  let processedDetailPages = 0;
  let enqueuedDetailPages = 0;
  const processedUrls = new Set<string>();

  const firstStartUrl = Array.isArray(startUrls) ? startUrls[0] : startUrls;
  const batchGender = firstStartUrl
    ? inferGenderFromFarfetchUrl(firstStartUrl)
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
    "scraper_storage_runs",
  );
  const runSpecificStorageDir = executionId
    ? path.join(baseStorageDir, siteName, executionId)
    : path.join(
        baseStorageDir,
        siteName,
        `default_run_${new Date().getTime()}`,
      );

  ensureDirectoryExists(runSpecificStorageDir);

  const config = new Configuration({
    storageClientOptions: { storageDir: runSpecificStorageDir },
  });

  const maxProducts = options.maxProducts || 1000;
  const maxRequests = options.maxRequests || maxProducts + 50;

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
      },
      async requestHandler({
        request,
        page,
        log: localCrawlerLog,
        crawler: pwtCrawler,
        pushData,
      }) {
        const currentExecutionId = request.userData?.executionId as
          | string
          | undefined;
        const requestLabel = request.userData?.label as
          | "LIST"
          | "DETAIL"
          | undefined;
        const currentBatchGender = request.userData?.batchGender as
          | string
          | null
          | undefined;

        // 在处理任何请求之前，确保页面是打开的
        if (page.isClosed()) {
          localCrawlerLog.warning(
            `${siteName}: Page for ${request.url} is closed at the beginning of requestHandler. Skipping.`,
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.WARN,
              `${siteName}: Page closed (handler start) for ${request.url}`,
            );
          }
          return;
        }

        localCrawlerLog.info(
          `${siteName}: Processing ${request.url}... (Label: ${requestLabel}, ExecutionID: ${currentExecutionId || "N/A"})`,
        );
        if (currentExecutionId) {
          await sendLogToBackend(
            currentExecutionId,
            LocalScraperLogLevel.INFO,
            `${siteName}: Processing URL: ${request.url}`,
            { label: requestLabel, batchGender: currentBatchGender },
          );
        }

        try {
          await page.route("**/*", (route) => {
            const req = route.request();
            const resourceType = req.resourceType();
            if (
              ["document", "script", "xhr", "fetch", "image"].includes(
                resourceType,
              )
            ) {
              return route.continue();
            }
            return route.abort();
          });
        } catch (routeError) {
          localCrawlerLog.warning(
            `${siteName}: Failed to set up request routing for ${request.url}: ${(routeError as Error).message}`,
          );
        }

        try {
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
              `${siteName}: Identified as a DETAIL page: ${request.url} (总: ${processedDetailPages}, 当前URL: ${urlCounters?.processedDetailPages || 0}/${maxProductsPerUrl})`,
            );

            // 处理通讯订阅弹窗
            await handlePopups(page, localCrawlerLog, currentExecutionId);
            const plpData = request.userData?.plpData as
              | Partial<Product>
              | undefined;

            // 新增：基于实际商品URL推断gender，而不是使用全局batchGender
            const actualGender =
              inferGenderFromFarfetchUrl(request.url) ||
              currentBatchGender ||
              plpData?.gender;

            const product: Product = {
              source: siteName,
              url: request.url,
              scrapedAt: new Date(),
              name: plpData?.name, // Will be overwritten by PDP data if found
              brand: plpData?.brand, // Will be overwritten by PDP data if found
              images: plpData?.images || [], // Start with PLP images, PDP can append or replace
              currentPrice: plpData?.currentPrice, // Fallback, will be overwritten
              originalPrice: plpData?.originalPrice, // Fallback, will be overwritten
              gender: actualGender, // 使用基于实际URL推断的gender
              metadata: {
                executionId: currentExecutionId,
                storeId: new URL(request.url).searchParams.get("storeid"),
              },
              // Initialize other fields to prevent undefined issues later
              sku: undefined,
              description: undefined,
              breadcrumbs: [],
              color: undefined,
              designerColorName: undefined,
              sizes: [],
              material: undefined,
              materialDetails: [],
              tags: plpData?.tags || [],
              videos: [],
            };

            // Extract Brand and Name from PDP (higher priority)
            const brandLinkElement = await page.$(SELECTORS.PDP_BRAND_LINK);
            if (brandLinkElement) {
              product.brand = (await brandLinkElement.textContent())?.trim();
            } else {
              localCrawlerLog.warning(
                `${siteName}: PDP品牌链接元素 (PDP_BRAND_LINK) 未找到. URL: ${request.url}`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  `${siteName}: PDP品牌链接元素未找到`,
                  { url: request.url, selector: SELECTORS.PDP_BRAND_LINK },
                );
              }
            }
            const nameElement = await page.$(SELECTORS.PDP_NAME);
            if (nameElement) {
              product.name = (await nameElement.textContent())?.trim();
            } else {
              localCrawlerLog.warning(
                `${siteName}: PDP名称元素 (PDP_NAME) 未找到. URL: ${request.url}`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  `${siteName}: PDP名称元素未找到`,
                  { url: request.url, selector: SELECTORS.PDP_NAME },
                );
              }
            }

            // Extract Images from PDP
            const imageElements = await page.$$(SELECTORS.PDP_IMAGE);
            if (imageElements.length > 0) {
              const pdpImages = (
                await Promise.all(
                  imageElements.map((el) => el.getAttribute("src")),
                )
              ).filter(Boolean) as string[];
              product.images = [
                ...new Set([...(product.images || []), ...pdpImages]),
              ]; // Merge and deduplicate
            }

            // Extract Prices from PDP
            const currentPriceElPDP = await page.$(SELECTORS.PDP_CURRENT_PRICE);
            if (currentPriceElPDP) {
              const priceText = (await currentPriceElPDP.textContent())?.trim();
              if (priceText)
                product.currentPrice = {
                  amount: cleanPrice(priceText),
                  currency: request.url.includes("/tw/") ? "TWD" : "USD",
                };
            } else {
              localCrawlerLog.warning(
                `${siteName}: PDP当前价格元素 (PDP_CURRENT_PRICE) 未找到. URL: ${request.url}`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  `${siteName}: PDP当前价格元素未找到`,
                  { url: request.url, selector: SELECTORS.PDP_CURRENT_PRICE },
                );
              }
            }
            const originalPriceElPDP = await page.$(
              SELECTORS.PDP_ORIGINAL_PRICE,
            );
            if (originalPriceElPDP) {
              const priceText = (
                await originalPriceElPDP.textContent()
              )?.trim();
              if (priceText)
                product.originalPrice = {
                  amount: cleanPrice(priceText),
                  currency: request.url.includes("/tw/") ? "TWD" : "USD",
                };
            } else {
              localCrawlerLog.warning(
                `${siteName}: PDP原始价格元素 (PDP_ORIGINAL_PRICE) 未找到. URL: ${request.url}`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.WARN,
                  `${siteName}: PDP原始价格元素未找到`,
                  { url: request.url, selector: SELECTORS.PDP_ORIGINAL_PRICE },
                );
              }
            }

            // 计算折扣
            if (
              product.originalPrice &&
              product.currentPrice &&
              product.originalPrice.amount > product.currentPrice.amount
            ) {
              if (product.originalPrice.amount > 0) {
                // 避免除以零
                product.discount =
                  (product.originalPrice.amount - product.currentPrice.amount) /
                  product.originalPrice.amount;
                localCrawlerLog.info(
                  `${siteName}: 计算折扣比例: ${product.discount?.toFixed(2)}. 原价: ${product.originalPrice.amount}, 现价: ${product.currentPrice.amount}. URL: ${request.url}`,
                );
              } else {
                product.discount = 0; // 如果原价为0或负数，则折扣视为0
                localCrawlerLog.info(
                  `${siteName}: 原价为0或负数，折扣比例设为0. URL: ${request.url}`,
                );
              }
            } else if (
              product.originalPrice &&
              product.currentPrice &&
              product.originalPrice.amount <= product.currentPrice.amount
            ) {
              product.discount = 0; // 如果现价不低于原价，则折扣为0
              localCrawlerLog.info(
                `${siteName}: 现价不低于原价，折扣比例设为0. URL: ${request.url}`,
              );
            }

            // 获取详情面板
            const detailsPanel = await page.$(SELECTORS.DETAILS_PANEL);
            if (detailsPanel) {
              try {
                // 查找"The Details"手风琴项
                const theDetailsButton = await detailsPanel.$(
                  'button:has-text("The Details")',
                );
                if (theDetailsButton) {
                  // 点击展开详情面板
                  await theDetailsButton.click();
                  localCrawlerLog.info(
                    `${siteName}: 点击展开'The Details'面板`,
                  );

                  // 等待面板展开
                  await page.waitForTimeout(1000);

                  // 获取展开的详情面板内容
                  const expandedPanel = await page.$(
                    SELECTORS.DETAILS_ACCORDION_PANEL,
                  );
                  if (expandedPanel) {
                    const innerPanel = await expandedPanel.$(
                      SELECTORS.DETAILS_INNER_PANEL,
                    );
                    if (innerPanel) {
                      localCrawlerLog.info(
                        `${siteName}: 成功找到展开的详情内容面板`,
                      );

                      // 用于收集产品描述的所有文本片段
                      const descriptionParts: string[] = [];

                      // 1. 提取SKU (FARFETCH ID)
                      const allParagraphs = await innerPanel.$$("p");
                      for (const paragraph of allParagraphs) {
                        const paragraphText =
                          (await paragraph.textContent()) || "";
                        if (paragraphText.includes("FARFETCH ID:")) {
                          const skuMatch =
                            paragraphText.match(/FARFETCH ID:\s*(\d+)/i);
                          if (skuMatch && skuMatch[1]) {
                            product.sku = skuMatch[1].trim();
                            localCrawlerLog.info(
                              `${siteName}: 成功从详情面板提取SKU: ${product.sku}`,
                            );
                          }
                          break;
                        }
                      }

                      // 如果未找到SKU，从URL提取
                      if (!product.sku) {
                        const urlSkuMatch = request.url.match(/item-(\d+)/i);
                        if (urlSkuMatch && urlSkuMatch[1]) {
                          product.sku = urlSkuMatch[1];
                          localCrawlerLog.info(
                            `${siteName}: 从URL提取SKU: ${product.sku}`,
                          );
                        }
                      }

                      if (product.sku) {
                        localCrawlerLog.info(
                          `${siteName}: 最终SKU为: ${product.sku}`,
                        );
                      } else {
                        localCrawlerLog.warning(
                          `${siteName}: 未能提取到SKU. URL: ${request.url}`,
                        );
                        if (currentExecutionId) {
                          await sendLogToBackend(
                            currentExecutionId,
                            LocalScraperLogLevel.WARN,
                            `${siteName}: 未能提取到SKU`,
                            { url: request.url },
                          );
                        }
                      }

                      // 2. 提取产品亮点(Highlights)，用于描述和标签
                      const highlightsContainer = await innerPanel.$(
                        SELECTORS.DETAILS_HIGHLIGHTS_CONTAINER,
                      );
                      if (highlightsContainer) {
                        // 获取亮点标题
                        const highlightTitle =
                          await highlightsContainer.$("h4");
                        if (highlightTitle) {
                          const titleText = await highlightTitle.textContent();
                          if (titleText) {
                            descriptionParts.push(`${titleText}:`);
                          }
                        }

                        // 获取亮点列表项
                        const highlightItems = await highlightsContainer.$$(
                          SELECTORS.DETAILS_HIGHLIGHTS_LIST,
                        );
                        if (highlightItems.length > 0) {
                          const highlights = await Promise.all(
                            highlightItems.map(async (item) =>
                              (await item.textContent())?.trim(),
                            ),
                          );

                          const validHighlights = highlights.filter(
                            Boolean,
                          ) as string[];

                          // 第一个亮点通常是颜色
                          if (validHighlights.length > 0) {
                            product.color = validHighlights[0];
                            product.designerColorName = validHighlights[0];
                            localCrawlerLog.info(
                              `${siteName}: 从Highlights提取颜色: ${product.color}`,
                            );
                          } else {
                            localCrawlerLog.warning(
                              `${siteName}: Highlights为空，未能提取颜色信息. URL: ${request.url}`,
                            );
                            if (currentExecutionId) {
                              await sendLogToBackend(
                                currentExecutionId,
                                LocalScraperLogLevel.WARN,
                                `${siteName}: Highlights为空，未能提取颜色信息`,
                                { url: request.url },
                              );
                            }
                          }

                          // 添加所有亮点作为标签
                          product.tags = [
                            ...(product.tags || []),
                            ...validHighlights,
                          ];

                          // 添加亮点到描述
                          descriptionParts.push(validHighlights.join(", "));

                          localCrawlerLog.info(
                            `${siteName}: 提取${validHighlights.length}个亮点作为标签`,
                          );
                        } else {
                          localCrawlerLog.info(
                            `${siteName}: Highlights列表为空，未提取标签. URL: ${request.url}`,
                          );
                          if (currentExecutionId) {
                            await sendLogToBackend(
                              currentExecutionId,
                              LocalScraperLogLevel.INFO,
                              `${siteName}: Highlights列表为空，未提取标签`,
                              { url: request.url },
                            );
                          }
                        }
                      } else {
                        localCrawlerLog.warning(
                          `${siteName}: 未找到Highlights容器 (DETAILS_HIGHLIGHTS_CONTAINER)，无法提取标签. URL: ${request.url}`,
                        );
                        if (currentExecutionId) {
                          await sendLogToBackend(
                            currentExecutionId,
                            LocalScraperLogLevel.WARN,
                            `${siteName}: 未找到Highlights容器，无法提取标签`,
                            { url: request.url },
                          );
                        }
                      }

                      // 3. 提取材质和洗涤说明
                      const compositionContainers = await innerPanel.$$(
                        SELECTORS.DETAILS_COMPOSITION_CONTAINER,
                      );
                      for (const container of compositionContainers) {
                        const titleElement = await container.$("h4");
                        if (!titleElement) continue;

                        const titleText =
                          (await titleElement.textContent()) || "";
                        const contentElement = await container.$("p");
                        if (!contentElement) continue;

                        const contentText =
                          (await contentElement.textContent()) || "";

                        if (titleText.includes("Composition")) {
                          // 处理材质信息
                          product.material = contentText.trim();

                          // 分割材质详情
                          const materials = contentText
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean);
                          product.materialDetails = [
                            ...(product.materialDetails || []),
                            ...materials,
                          ];

                          // 添加到描述
                          descriptionParts.push(`${titleText}: ${contentText}`);

                          localCrawlerLog.info(
                            `${siteName}: 提取材质: ${product.material}`,
                          );
                        } else if (titleText.includes("Washing")) {
                          // 处理洗涤说明
                          if (!product.materialDetails)
                            product.materialDetails = [];
                          product.materialDetails.push(contentText.trim());

                          // 添加到描述
                          descriptionParts.push(`${titleText}: ${contentText}`);

                          localCrawlerLog.info(
                            `${siteName}: 提取洗涤说明: ${contentText.trim()}`,
                          );
                        }
                      }

                      // 4. 合并所有信息作为产品描述
                      if (descriptionParts.length > 0) {
                        product.description = descriptionParts.join(". ");
                        localCrawlerLog.info(
                          `${siteName}: 成功构建商品描述: ${product.description.substring(0, 100)}...`,
                        );
                      } else {
                        // 如果没有提取到任何描述，使用商品名称
                        product.description = product.name;
                        localCrawlerLog.info(
                          `${siteName}: 未找到详细信息，使用商品名称作为描述`,
                        );
                      }

                      // 5. 如果没有材质信息但有材质详情，使用第一个详情作为材质
                      if (
                        !product.material &&
                        product.materialDetails &&
                        product.materialDetails.length > 0
                      ) {
                        product.material = product.materialDetails[0];
                        localCrawlerLog.info(
                          `${siteName}: 使用首个materialDetail作为material: ${product.material}`,
                        );
                      }

                      if (
                        !product.material &&
                        (!product.materialDetails ||
                          product.materialDetails.length === 0)
                      ) {
                        localCrawlerLog.warning(
                          `${siteName}: 未能提取到材质信息 (material 和 materialDetails 都为空). URL: ${request.url}`,
                        );
                        if (currentExecutionId) {
                          await sendLogToBackend(
                            currentExecutionId,
                            LocalScraperLogLevel.WARN,
                            `${siteName}: 未能提取到材质信息`,
                            { url: request.url },
                          );
                        }
                      }
                    } else {
                      localCrawlerLog.warning(
                        `${siteName}: 未找到内部面板内容`,
                      );
                    }
                  } else {
                    localCrawlerLog.warning(
                      `${siteName}: 点击后未找到展开的面板`,
                    );
                  }
                } else {
                  localCrawlerLog.warning(
                    `${siteName}: 未找到"The Details"按钮`,
                  );
                }
              } catch (detailsError: unknown) {
                const error = detailsError as Error;
                localCrawlerLog.error(
                  `${siteName}: 处理详情面板时出错: ${error.message}`,
                  { stack: error.stack },
                );
                if (currentExecutionId) {
                  await sendLogToBackend(
                    currentExecutionId,
                    LocalScraperLogLevel.ERROR,
                    `${siteName}: 处理详情面板时出错: ${error.message}`,
                    { url: request.url, stack: error.stack },
                  );
                }
              }
            } else {
              localCrawlerLog.warning(`${siteName}: 未找到商品详情面板`);
            }

            // 提取面包屑
            try {
              const breadcrumbElements = await page.$$(
                SELECTORS.PDP_BREADCRUMBS,
              );
              if (breadcrumbElements.length > 0) {
                const rawBreadcrumbTexts = (
                  await Promise.all(
                    breadcrumbElements.map(async (el) =>
                      (await el.textContent())?.trim(),
                    ),
                  )
                ).filter(Boolean) as string[]; // 首先过滤掉 undefined/null/空字符串，确保是 string[]

                if (rawBreadcrumbTexts.length > 0) {
                  // 调用清理函数处理面包屑
                  product.breadcrumbs = cleanFarfetchBreadcrumbs(
                    rawBreadcrumbTexts,
                    product.brand,
                    localCrawlerLog,
                    siteName,
                  );
                  localCrawlerLog.info(
                    `${siteName}: 清理后的面包屑路径: ${product.breadcrumbs.join(" > ")}. URL: ${request.url}`,
                  );
                } else {
                  product.breadcrumbs = [];
                  localCrawlerLog.info(
                    `${siteName}: 未提取到有效面包屑文本. URL: ${request.url}`,
                  );
                }
              } else {
                product.breadcrumbs = [];
                localCrawlerLog.info(
                  `${siteName}: 未找到面包屑元素. URL: ${request.url}`,
                );
              }
            } catch (breadcrumbError) {
              localCrawlerLog.warning(
                `${siteName}: 提取面包屑时出错: ${(breadcrumbError as Error).message}`,
              );
            }

            // 提取尺码信息 (Extract size information)
            product.sizes = []; // 确保sizes被初始化为数组 (Ensure sizes is initialized as an array)
            try {
              // 尝试定位并点击尺码选择器的触发元素 (Try to locate and click the size selector trigger)
              const sizeSelectorTrigger = await page.$(
                SELECTORS.PDP_SIZE_SELECTOR_TRIGGER,
              );
              if (sizeSelectorTrigger) {
                localCrawlerLog.info(
                  `${siteName}: 找到尺码选择器，尝试点击。 URL: ${request.url}`,
                );
                await sizeSelectorTrigger.click(); // 点击打开尺码选择下拉框 (Click to open the size selector dropdown)

                try {
                  // 等待尺码选项的容器变为可见 (Wait for the size options container to become visible)
                  await page.waitForSelector(
                    SELECTORS.PDP_SIZE_OPTIONS_WRAPPER,
                    { state: "visible", timeout: 7000 },
                  );
                  localCrawlerLog.info(
                    `${siteName}: 尺码选项下拉框已出现。 URL: ${request.url}`,
                  );

                  // 获取所有的尺码选项元素 (Get all size option elements)
                  const sizeOptionElements = await page.$$(
                    SELECTORS.PDP_SIZE_OPTION_ITEM,
                  );
                  if (sizeOptionElements.length > 0) {
                    localCrawlerLog.info(
                      `${siteName}: 找到 ${sizeOptionElements.length} 个尺码选项。 URL: ${request.url}`,
                    );
                    // 遍历每个尺码选项 (Iterate over each size option)
                    for (const optionEl of sizeOptionElements) {
                      // 新增调试日志：打印正在处理的尺码选项的简要 HTML，以便检查其结构
                      try {
                        const optionHtmlPreview = (await optionEl.innerHTML())
                          .substring(0, 150)
                          .replace(/\n/g, " "); // 获取前150个字符并移除换行符以便单行显示
                        localCrawlerLog.debug(
                          `${siteName}: Processing size option element. HTML preview: ${optionHtmlPreview}. URL: ${request.url}`,
                        );
                      } catch (htmlError: unknown) {
                        localCrawlerLog.debug(
                          `${siteName}: Error getting HTML preview for size option. URL: ${request.url}, Error: ${(htmlError as Error).message}`,
                        );
                      }

                      // 提取尺码文本 (Extract the size text)
                      const sizeTextElement = await optionEl.$(
                        SELECTORS.PDP_SIZE_OPTION_TEXT,
                      );
                      const sizeText = (
                        await sizeTextElement?.textContent()
                      )?.trim();

                      if (sizeText) {
                        product.sizes.push(sizeText); // 新逻辑：只添加纯尺码文本到列表
                      }
                    }
                    localCrawlerLog.info(
                      `${siteName}: 成功提取尺码: ${product.sizes.join(", ")}. URL: ${request.url}`,
                    );

                    // 尝试关闭尺码下拉框以避免干扰后续操作 (Try to close the dropdown to avoid interference)
                    try {
                      await page.keyboard.press("Escape");
                      localCrawlerLog.info(
                        `${siteName}: 尝试通过Escape键关闭尺码下拉框。 URL: ${request.url}`,
                      );
                    } catch (error: unknown) {
                      localCrawlerLog.debug(
                        `${siteName}: 按Escape键关闭尺码下拉框失败 (可能已自动关闭). Error: ${(error as Error)?.message}. URL: ${request.url}`,
                      );
                    }
                  } else {
                    localCrawlerLog.info(
                      `${siteName}: 尺码选项下拉框中未找到具体尺码项。 URL: ${request.url}`,
                    );
                    if (currentExecutionId) {
                      await sendLogToBackend(
                        currentExecutionId,
                        LocalScraperLogLevel.INFO,
                        `${siteName}: 尺码选项下拉框中未找到具体尺码项`,
                        { url: request.url },
                      );
                    }
                  }
                } catch (error: unknown) {
                  // 处理等待尺码下拉框或提取尺码过程中的错误 (Handle errors during waiting for/processing the size dropdown)
                  localCrawlerLog.warning(
                    `${siteName}: 等待或处理尺码下拉框时出错: ${(error as Error)?.message}. URL: ${request.url}`,
                  );
                  if (currentExecutionId) {
                    await sendLogToBackend(
                      currentExecutionId,
                      LocalScraperLogLevel.WARN,
                      `${siteName}: 等待或处理尺码下拉框时出错: ${(error as Error)?.message}`,
                      { url: request.url, stack: (error as Error)?.stack },
                    );
                  }
                }
              } else {
                localCrawlerLog.info(
                  `${siteName}: 未在页面上找到尺码选择器。 URL: ${request.url}`,
                );
                if (currentExecutionId) {
                  await sendLogToBackend(
                    currentExecutionId,
                    LocalScraperLogLevel.INFO,
                    `${siteName}: 未在页面上找到尺码选择器`,
                    { url: request.url },
                  );
                }
              }
            } catch (error: unknown) {
              // 处理尺码提取过程中的主要错误 (Handle main errors during size extraction process)
              localCrawlerLog.error(
                `${siteName}: 提取尺码信息时发生主错误: ${(error as Error)?.message}. URL: ${request.url}`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.ERROR,
                  `${siteName}: 提取尺码信息失败: ${(error as Error)?.message}`,
                  { url: request.url, stack: (error as Error).stack },
                );
              }
            }

            // 保存商品数据
            await pushData(product);
            allScrapedProducts.push(product);

            // 检查每URL限制
            if (
              urlCounters &&
              urlCounters.processedDetailPages >= maxProductsPerUrl
            ) {
              localCrawlerLog.info(
                `${siteName}: Reached max products limit (${maxProductsPerUrl}) for URL starting from ${originUrl}.`,
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

            // 当达到最大产品数量限制时，记录日志，但不再停止整个爬虫
            // 后续的列表页处理逻辑 (processProductCardsOnPlp 和 handlePaginationOnPlp)
            // 会通过检查 enqueuedDetailPages < maxProducts 来决定是否继续添加新的详情页请求。
            if (maxProducts && processedDetailPages >= maxProducts) {
              localCrawlerLog.info(
                `${siteName}: 已处理 ${processedDetailPages} 个详情页，达到或超过最大产品数量限制 (${maxProducts})。将不再从新的列表页添加更多详情页。`,
              );
              if (currentExecutionId) {
                await sendLogToBackend(
                  currentExecutionId,
                  LocalScraperLogLevel.INFO,
                  `${siteName}: 已处理 ${processedDetailPages} 个详情页，达到或超过最大产品数量限制 (${maxProducts})。`,
                );
              }
            }
          } else {
            // LIST page
            localCrawlerLog.info(
              `${siteName}: Identified as a LIST page: ${request.url}`,
            );

            // >>> ADD POPUP HANDLING FOR LIST PAGES HERE <<<
            await handlePopups(page, localCrawlerLog, currentExecutionId); // Call handlePopups for LIST pages

            // 等待至少一个真实产品卡片加载完成（非骨架屏元素）
            await page.waitForSelector(
              `${SELECTORS.PRODUCT_CARD}:has(${SELECTORS.PRODUCT_LINK})`,
              { timeout: 90000 },
            );

            // 给页面额外时间完全加载，避免处理骨架屏元素
            await page.waitForTimeout(2000);

            // 获取当前LIST页面对应的原始URL
            const currentOriginUrl = request.userData?.originUrl || request.url;
            const currentUrlCounters = urlProductCounts.get(currentOriginUrl);

            await processProductCardsOnPlp(
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
              siteName,
              currentOriginUrl, // 新增：传递原始URL参数
            );

            // 检查当前URL是否已达到限制
            if (
              currentUrlCounters &&
              currentUrlCounters.enqueuedDetailPages >= maxProductsPerUrl
            ) {
              localCrawlerLog.info(
                `${siteName}: Reached max products enqueue limit (${maxProductsPerUrl}) for URL ${currentOriginUrl}, not proceeding to pagination.`,
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

            // Only proceed to pagination if not already at product limit from current page processing
            if (
              currentUrlCounters &&
              currentUrlCounters.enqueuedDetailPages < maxProductsPerUrl
            ) {
              await handlePaginationOnPlp(
                page,
                request,
                pwtCrawler,
                localCrawlerLog,
                maxProductsPerUrl, // 使用每个URL的限制
                currentUrlCounters.enqueuedDetailPages,
                currentExecutionId,
                currentBatchGender,
                options,
                currentOriginUrl, // 新增：传递原始URL参数
              );
            }
          }
        } catch (e: unknown) {
          const error = e as Error;
          localCrawlerLog.error(
            `${siteName}: Request handler error for ${request.url}: ${error.message}`,
            { stack: error.stack },
          );
          if (currentExecutionId) {
            await sendLogToBackend(
              currentExecutionId,
              LocalScraperLogLevel.ERROR,
              `${siteName}: Request handler error: ${error.message}`,
              { url: request.url, stack: error.stack, label: requestLabel },
            );
          }
        }
      },
      async failedRequestHandler({ request, log: localFailedLog }) {
        const handlerExecutionId = request.userData?.executionId as
          | string
          | undefined;
        localFailedLog.error(
          `${siteName}: Request ${request.url} failed! Error(s): ${request.errorMessages?.join(", ")}`,
        );
        if (handlerExecutionId) {
          await sendLogToBackend(
            handlerExecutionId,
            LocalScraperLogLevel.ERROR,
            `${siteName}: Request ${request.url} failed!`,
            {
              url: request.url,
              errors: request.errorMessages?.join("; "),
              label: request.label, // Include label for context
              userData: request.userData, // Include userData for debugging
            },
          );
        }
      },
    },
    config,
  );

  const initialRequests = (
    Array.isArray(startUrls) ? startUrls : [startUrls]
  ).map((url) => ({
    url,
    userData: {
      executionId,
      label: "LIST",
      batchGender,
      originUrl: url, // 新增：为每个初始请求添加originUrl
    } as FarfetchUserData,
    label: "LIST",
  }));

  if (initialRequests.length > 0) {
    await crawler.run(initialRequests);
  } else {
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        `${siteName}: No valid initial URLs to start crawl.`,
      );
    }
    crawleeLog.warning(`${siteName}: No valid initial URLs provided.`);
  }

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper finished. Total products collected: ${allScrapedProducts.length}.`,
      {
        processedDetailPages,
        enqueuedDetailPages,
        processedUrlsCount: processedUrls.size,
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
    `${siteName} scraper finished. Collected: ${allScrapedProducts.length}, Enqueued: ${enqueuedDetailPages}, Processed PDP: ${processedDetailPages}`,
  );

  // 输出每个URL的详细统计
  Array.from(urlProductCounts.entries()).forEach(([url, counts]) => {
    crawleeLog.info(
      `  ${url}: 处理了 ${counts.processedDetailPages}/${maxProductsPerUrl} 个商品 (入队: ${counts.enqueuedDetailPages})`,
    );
  });

  return allScrapedProducts;
};

export default scrapeFarfetch;
