import { Browser, chromium, Page } from "playwright";
import { Product, ECommerceSite } from "@repo/types";
import {
  cleanPrice,
  generateUniqueId,
  getExecutablePath,
  logInfo,
  logError,
} from "../utils.js";
import type { ScraperOptions } from "../main.js";
import * as fs from "fs";
import * as path from "path";

// CSS 选择器
const SELECTORS = {
  PRODUCT_LIST_CONTAINER: "div._3kWsUD-sruWkbllx1UtLKW",
  PRODUCT_CARD: "div.lazyload-wrapper._8T7q2GDqmgeWgJYhbInA1",
  PRODUCT_LINK: "a.qFbwHS4kQ4GkWGJXG18EE",
  PRODUCT_BRAND: "div._1tt3LMOZ50TX6rWCuwNDjK",
  PRODUCT_NAME: "div._1EqhXd6FUIED0ndyLYSncV",
  PRODUCT_ORIGINAL_PRICE: "s.E0_8CVj5Lnq3QKTQFJFQU",
  PRODUCT_PRICE: "span._2Jxa7Rj1Kswy2fPVXbctjY span",
  PRODUCT_IMAGE: "img._2SNSvFX_9k7gfa1DGaYuUW",
  LOAD_MORE_BUTTON:
    "div._1wcDB3Knltilo9IQkv6J4m button._2_uoPWn988k7K6vk5euW2G",

  // 商品详情页选择器 (需要根据实际网页结构调整)
  DETAIL_BRAND: "div.product-brand",
  DETAIL_NAME: "h1.product-name",
  DETAIL_PRICE: "div.product-price",
  DETAIL_ORIGINAL_PRICE: "div.product-original-price",
  DETAIL_DESCRIPTION: "div.product-description",
  DETAIL_IMAGES: "div.product-images img",
  DETAIL_COLOR: "div.product-color",
  DETAIL_SIZE: "div.product-size",
  DETAIL_SKU: "div.product-sku",
};

// 性别映射
const GENDER_MAP: Record<string, "male" | "female"> = {
  men: "male",
  women: "female",
};

// 确保截图目录存在
function ensureScreenshotDir(): string {
  const dir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * 从 Cettire 网站抓取商品数据
 */
export async function scrapeCettire(
  startUrls: string | string[] = [
    "https://www.cettire.com/collections/women",
    "https://www.cettire.com/collections/men",
  ],
  options: ScraperOptions & { screenshotOnly?: boolean } = {},
  executionId?: string,
): Promise<Product[]> {
  logInfo("开始抓取 Cettire 网站数据");

  if (executionId) {
    logInfo(`使用执行ID: ${executionId}`);
  }

  if (options.screenshotOnly) {
    logInfo(`仅截图模式：将导航到页面并截图，但不抓取数据`);
  }

  const browser = await launchBrowser(options);
  const products: Product[] = [];
  const maxTotalProducts = options.maxProducts || 50; // 全局最大商品数量

  logInfo(`设置全局最大商品抓取数量: ${maxTotalProducts}`);

  try {
    // 如果提供了特定的起始 URL，则使用它们
    if (startUrls && Array.isArray(startUrls) && startUrls.length > 0) {
      logInfo(`使用提供的起始URL: ${startUrls.join(", ")}`);
      for (const url of startUrls) {
        // 检查是否已达到总目标数量
        if (products.length >= maxTotalProducts) {
          logInfo(
            `已达到全局最大商品数量 (${maxTotalProducts})，跳过剩余URL抓取`,
          );
          break;
        }

        const gender = url.includes("/women")
          ? "women"
          : url.includes("/men")
            ? "men"
            : null;
        if (gender) {
          logInfo(`从URL [${url}] 解析到性别: ${gender}`);

          // 计算此URL应抓取的商品数量
          const remainingNeeded = maxTotalProducts - products.length;
          logInfo(
            `当前已抓取 ${products.length} 个商品，此分类最多再抓取 ${remainingNeeded} 个`,
          );

          // 调整当前分类的最大抓取数量
          const adjustedOptions = {
            ...options,
            maxProducts: remainingNeeded,
          };

          const genderProducts = await scrapeProductsByGender(
            browser,
            gender as "women" | "men",
            adjustedOptions,
          );
          products.push(...genderProducts);

          logInfo(`累计已抓取 ${products.length}/${maxTotalProducts} 个商品`);
        } else {
          logError(`无法从 URL 确定性别: ${url}`);
        }
      }
    } else if (startUrls && typeof startUrls === "string") {
      logInfo(`使用提供的单个起始URL: ${startUrls}`);
      const gender = startUrls.includes("/women")
        ? "women"
        : startUrls.includes("/men")
          ? "men"
          : null;
      if (gender) {
        logInfo(`从URL [${startUrls}] 解析到性别: ${gender}`);
        const genderProducts = await scrapeProductsByGender(
          browser,
          gender as "women" | "men",
          options,
        );
        products.push(...genderProducts);
      } else {
        logError(`无法从 URL 确定性别: ${startUrls}`);
      }
    } else {
      // 默认抓取女性和男性商品
      logInfo(`使用默认起始URL抓取 women 和 men 分类`);

      // 优先处理的性别列表 (可以根据需要调整顺序，例如，如果某个分类的商品更容易加载)
      const gendersToScrape: ("men" | "women")[] = ["men", "women"];

      for (const gender of gendersToScrape) {
        if (products.length >= maxTotalProducts) {
          logInfo(
            `已达到全局最大商品数量 (${maxTotalProducts})，跳过剩余分类抓取`,
          );
          break;
        }

        logInfo(`尝试抓取 ${gender} 分类`);
        const remainingNeeded = maxTotalProducts - products.length;
        const adjustedOptions = {
          ...options,
          maxProducts: remainingNeeded,
        };

        try {
          const genderProducts = await scrapeProductsByGender(
            browser,
            gender,
            adjustedOptions,
          );
          products.push(...genderProducts);
          logInfo(
            `${gender} 分类抓取成功，共获取 ${genderProducts.length} 个商品。累计: ${products.length}/${maxTotalProducts}`,
          );
        } catch (error) {
          logError(`抓取 ${gender} 分类失败: ${error}`);
          // 可选择：如果一个分类失败，是否继续下一个分类，或者直接抛出错误
        }
      }
    }

    logInfo(`Cettire 商品抓取完成，共获取 ${products.length} 个商品`);
    return products;
  } catch (error) {
    logError(`Cettire 抓取失败: ${error}`);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * 启动浏览器
 */
async function launchBrowser(options: ScraperOptions = {}): Promise<Browser> {
  const executablePath = getExecutablePath();
  // 使用options中的headless配置，如果未指定则默认为true
  const headless = options.headless !== undefined ? options.headless : true;

  logInfo(
    `启动浏览器${executablePath ? "，使用指定的可执行文件路径" : ""}，headless模式: ${headless ? "是" : "否"}`,
  );

  return await chromium.launch({
    executablePath,
    headless,
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
    ],
  });
}

/**
 * 根据性别抓取商品列表
 */
async function scrapeProductsByGender(
  browser: Browser,
  gender: "women" | "men",
  options: ScraperOptions & { screenshotOnly?: boolean } = {},
): Promise<Product[]> {
  logInfo(`开始抓取 Cettire ${gender} 商品`);

  // 创建一个新页面并设置用户代理
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  });

  const products: Product[] = [];
  const url = `https://www.cettire.com/collections/${gender}`;

  logInfo(`导航到URL: ${url}`);

  try {
    // 修改导航逻辑：移除 waitUntil，后续等待特定元素
    logInfo(`开始页面导航，超时时间 60 秒...`);
    await page.goto(url, {
      timeout: 60000, // 保持60秒超时
    });

    // 获取页面标题
    const title = await page.title();
    logInfo(`页面标题: ${title}`);

    // 等待一段时间使页面渲染更多内容 (初步渲染)
    await page.waitForTimeout(5000);

    // 等待第一个商品卡片加载，作为页面内容初步加载完成的标志
    logInfo("等待第一个商品卡片加载...");
    try {
      await page.waitForSelector(SELECTORS.PRODUCT_CARD, { timeout: 45000 }); // 等待45秒
      logInfo("第一个商品卡片已加载。");
    } catch (error) {
      logError(`等待第一个商品卡片超时: ${(error as Error).message}`);
      const screenshotDir = ensureScreenshotDir();
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\./g, "-");
      const errorScreenshotPath = path.join(
        screenshotDir,
        `cettire-${gender}-card-timeout-${timestamp}.png`,
      );
      try {
        await page.screenshot({ path: errorScreenshotPath, fullPage: true });
        logInfo(`第一个商品卡片超时截图已保存至: ${errorScreenshotPath}`);
      } catch (screenshotError) {
        logError(`保存第一个商品卡片超时截图失败: ${screenshotError}`);
      }
      throw error; // 重新抛出错误，中断后续操作
    }

    // 截图 (在第一个卡片加载后)
    const screenshotDir = ensureScreenshotDir();
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const screenshotPath = path.join(
      screenshotDir,
      `cettire-${gender}-initial-${timestamp}.png`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logInfo(`初始页面截图已保存至 (第一个卡片加载后): ${screenshotPath}`);

    // 如果仅截图模式，则返回空结果
    if (options.screenshotOnly) {
      logInfo(`仅截图模式: 已保存截图，不进行数据抓取`);
      return [];
    }

    logInfo(`商品列表应已部分加载，开始抓取数据...`);

    // 抓取商品列表页数据
    const maxProductsToScrapeInThisRun = options.maxProducts || 50; // 这个参数现在由 scrapeCettire 控制传入
    logInfo(
      `开始抓取${gender}分类商品，本轮目标数量: ${maxProductsToScrapeInThisRun}`,
    );
    const listProducts = await scrapeProductList(
      page,
      gender,
      maxProductsToScrapeInThisRun,
    );
    products.push(...listProducts);

    // 抓取完成后再次截图
    const finalScreenshotPath = path.join(
      screenshotDir,
      `cettire-${gender}-final-${timestamp}.png`,
    );
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    logInfo(`最终页面截图已保存至: ${finalScreenshotPath}`);

    logInfo(`${gender} 商品列表抓取完成，共获取 ${products.length} 个商品`);
    return products;
  } catch (error) {
    logError(`抓取 ${gender} 商品列表失败: ${error}`);

    // 如果出错，截图保存（如果可能）
    try {
      const screenshotDir = ensureScreenshotDir();
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\./g, "-");
      const errorScreenshotPath = path.join(
        screenshotDir,
        `cettire-${gender}-error-${timestamp}.png`,
      );
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      logInfo(`错误截图已保存至: ${errorScreenshotPath}`);
    } catch (screenshotError) {
      logError(`无法保存错误截图: ${screenshotError}`);
    }

    throw error;
  } finally {
    await page.close();
  }
}

/**
 * 智能滚动页面
 * @param page Playwright Page 对象
 * @param options 滚动选项，可以指定滚动距离 (像素) 或 'screen' (滚动一屏)
 */
async function smartScroll(
  page: Page,
  options: { distance: "screen" | number },
): Promise<void> {
  let scrollDistance: number;
  if (options.distance === "screen") {
    const viewportHeight = page.viewportSize()?.height || 800; // 默认800px
    scrollDistance = viewportHeight * 0.8; // 滚动屏幕高度的80%
    logInfo(`智能滚动：滚动一屏距离约 ${scrollDistance.toFixed(0)}px`);
  } else {
    scrollDistance = options.distance;
    logInfo(`智能滚动：滚动指定距离 ${scrollDistance}px`);
  }

  await page.evaluate((dist) => {
    window.scrollBy({ top: dist, behavior: "smooth" });
  }, scrollDistance);

  // 滚动后短暂随机停顿，模拟用户查看
  await page.waitForTimeout(500 + Math.random() * 500); // 0.5 - 1秒
}

/**
 * 等待卡片数量增加
 */
async function waitForMoreCards(
  page: Page,
  prevCount: number,
  selector: string,
  timeout: number = 10000,
): Promise<boolean> {
  const startTime = Date.now();
  logInfo(`开始等待更多卡片加载，当前数量: ${prevCount}, 超时: ${timeout}ms`);
  while (Date.now() - startTime < timeout) {
    const currentCount = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, selector);

    if (currentCount > prevCount) {
      logInfo(`卡片数量已从 ${prevCount} 增加到 ${currentCount}。`);
      return true; // 数量已增加
    }
    await page.waitForTimeout(250); // 等待250毫秒再次检查
  }
  logInfo(`等待更多卡片超时，卡片数量未从 ${prevCount} 增加。`);
  return false; // 超时，数量未增加
}

/**
 * 抓取商品列表页数据
 */
async function scrapeProductList(
  page: Page,
  gender: "women" | "men",
  maxProductsToScrape: number,
): Promise<Product[]> {
  const products: Product[] = [];
  let loadedProductsCount = 0;
  const processedProductPositions = new Set<string>(); // 存储已处理商品的 position
  let scrollAttemptsWithoutNewProduct = 0;
  const MAX_SCROLL_ATTEMPTS_WITHOUT_NEW = 3; // 连续滚动多少次未发现新商品后，触发特定逻辑

  logInfo(
    `scrapeProductList: 开始抓取 ${gender} 列表，本轮目标数量: ${maxProductsToScrape}`,
  );

  try {
    while (loadedProductsCount < maxProductsToScrape) {
      logInfo(
        `scrapeProductList: 当前已加载 ${loadedProductsCount}/${maxProductsToScrape} 个商品。`,
      );
      const currentCardsOnPage = await page.$$(SELECTORS.PRODUCT_CARD);

      if (
        currentCardsOnPage.length === 0 &&
        loadedProductsCount === 0 &&
        processedProductPositions.size === 0
      ) {
        logInfo(
          "scrapeProductList: 页面上未找到任何商品卡片（初始检查），结束抓取。",
        );
        break;
      }

      let newProductsFoundInThisIteration = false;

      for (const productCard of currentCardsOnPage) {
        if (loadedProductsCount >= maxProductsToScrape) {
          break; // 已达到本轮目标，跳出内层循环
        }

        const linkElement = await productCard.$(SELECTORS.PRODUCT_LINK);
        if (!linkElement) continue;

        const position = await linkElement.getAttribute("position");
        if (!position) {
          // logInfo('scrapeProductList: 商品卡片缺少position属性，跳过。'); // 日志可能过于频繁
          continue;
        }
        if (processedProductPositions.has(position)) {
          // logInfo(`scrapeProductList: 跳过已处理商品 (Position: ${position})`); // 日志可能过于频繁
          continue;
        }

        newProductsFoundInThisIteration = true;
        scrollAttemptsWithoutNewProduct = 0;

        try {
          const href = await linkElement.getAttribute("href");
          if (!href) continue;
          const productUrl = `https://www.cettire.com${href}`;

          const brandElement = await productCard.$(SELECTORS.PRODUCT_BRAND);
          const brand = brandElement
            ? (await brandElement.textContent()) || ""
            : "";

          const nameElement = await productCard.$(SELECTORS.PRODUCT_NAME);
          const name = nameElement
            ? (await nameElement.textContent()) || ""
            : "";

          const originalPriceElement = await productCard.$(
            SELECTORS.PRODUCT_ORIGINAL_PRICE,
          );
          const originalPriceText = originalPriceElement
            ? (await originalPriceElement.textContent()) || ""
            : "";
          const originalPrice = cleanPrice(originalPriceText);

          const priceElement = await productCard.$(SELECTORS.PRODUCT_PRICE);
          const priceText = priceElement
            ? (await priceElement.textContent()) || ""
            : "";
          const price = cleanPrice(priceText);

          const imageElement = await productCard.$(SELECTORS.PRODUCT_IMAGE);
          const imageUrl = imageElement
            ? (await imageElement.getAttribute("src")) || ""
            : "";

          let discountPercentage = 0;
          if (originalPrice > 0 && price > 0) {
            discountPercentage = Math.round(
              ((originalPrice - price) / originalPrice) * 100,
            );
          }

          const product: Product = {
            sku: generateUniqueId(),
            name,
            brand,
            currentPrice: { amount: price, currency: "USD" },
            originalPrice:
              originalPrice > 0
                ? { amount: originalPrice, currency: "USD" }
                : undefined,
            description: "",
            images: imageUrl ? [imageUrl] : [],
            url: productUrl,
            source: "Cettire" as ECommerceSite,
            gender: GENDER_MAP[gender],
            scrapedAt: new Date(),
            sizes: [],
            materialDetails: [],
            tags: [`gender:${GENDER_MAP[gender]}`, "Cettire"],
            metadata: {
              category: gender,
              subcategory: "",
              discount: discountPercentage,
              isOnSale: discountPercentage > 0,
              positionOnPage: parseInt(position, 10),
            },
          };
          products.push(product);
          processedProductPositions.add(position);
          loadedProductsCount++;
          logInfo(
            `scrapeProductList: ( ${loadedProductsCount}/${maxProductsToScrape} ) 已抓取商品: ${name.substring(0, 30)}... (Pos: ${position})`,
          );
        } catch (error) {
          logError(
            `scrapeProductList: 处理商品卡片 (Position: ${position}) 时出错: ${error}`,
          );
          continue;
        }
      }

      if (loadedProductsCount >= maxProductsToScrape) {
        logInfo(
          `scrapeProductList: 已抓取 ${loadedProductsCount} 个商品，达到本轮目标数量 ${maxProductsToScrape}。结束此列表抓取。`,
        );
        break;
      }

      if (newProductsFoundInThisIteration) {
        // logInfo('scrapeProductList: 本轮发现新商品，尝试滚动加载下一批。'); // 可能过于频繁
        await smartScroll(page, { distance: "screen" });
      } else {
        scrollAttemptsWithoutNewProduct++;
        logInfo(
          `scrapeProductList: 本轮未发现新商品 (已处理 ${processedProductPositions.size} 个独特商品)，已连续滚动尝试 ${scrollAttemptsWithoutNewProduct}/${MAX_SCROLL_ATTEMPTS_WITHOUT_NEW} 次。`,
        );

        if (
          scrollAttemptsWithoutNewProduct >= MAX_SCROLL_ATTEMPTS_WITHOUT_NEW
        ) {
          logInfo(
            `scrapeProductList: 连续 ${MAX_SCROLL_ATTEMPTS_WITHOUT_NEW} 次滚动未发现新商品，尝试点击"加载更多"。`,
          );
          const loadMoreButton = await page.$(SELECTORS.LOAD_MORE_BUTTON);
          if (loadMoreButton && (await loadMoreButton.isVisible())) {
            logInfo('scrapeProductList: 点击"加载更多"按钮。');
            const prevCardCount = await page.evaluate(
              (sel) => document.querySelectorAll(sel).length,
              SELECTORS.PRODUCT_CARD,
            );
            await loadMoreButton.click();
            const loadWaitTime = 10000 + Math.random() * 5000;
            logInfo(
              `scrapeProductList: 已点击"加载更多"，等待 ${loadWaitTime / 1000} 秒...`,
            );
            await page.waitForTimeout(loadWaitTime);
            scrollAttemptsWithoutNewProduct = 0;

            // 等待确认新卡片是否加载
            const newCardsLoaded = await waitForMoreCards(
              page,
              prevCardCount,
              SELECTORS.PRODUCT_CARD,
              15000,
            );
            if (newCardsLoaded) {
              const currentCardCount = await page.evaluate(
                (sel) => document.querySelectorAll(sel).length,
                SELECTORS.PRODUCT_CARD,
              );
              logInfo(
                `scrapeProductList: "加载更多"后，商品卡片数量从 ${prevCardCount} 增加到 ${currentCardCount}。`,
              );
            } else {
              logInfo(
                `scrapeProductList: "加载更多"后，在超时时间内未检测到商品卡片数量增加 (原 ${prevCardCount})。可能已无更多。`,
              );
              // 即使没有检测到增加，也可能只是加载慢，下一轮循环会重新评估
              // 但如果多次点击加载更多都无反应，可能真的没有了
            }
          } else {
            logInfo(
              'scrapeProductList: 未找到"加载更多"按钮或按钮不可见，判断已无更多商品可加载。',
            );
            break;
          }
        } else {
          logInfo(
            `scrapeProductList: 继续尝试滚动 (${scrollAttemptsWithoutNewProduct}/${MAX_SCROLL_ATTEMPTS_WITHOUT_NEW})。`,
          );
          await smartScroll(page, { distance: "screen" });
        }
      }
      await page.waitForTimeout(1000 + Math.random() * 1500);
    }

    logInfo(`scrapeProductList: 抓取结束，共返回 ${products.length} 个商品。`);
    return products;
  } catch (error) {
    logError(`scrapeProductList: 抓取商品列表失败: ${error}`);
    return products;
  }
}

/*
async function smartScrollToLoadMoreButton(page: Page, targetSelector: string): Promise<boolean> {
  logInfo('开始智能滚动以寻找"加载更多"按钮...');
  
  const isButtonVisible = await page.evaluate((selector) => {
    const button = document.querySelector(selector);
    if (!button) return false;
    const rect = button.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, targetSelector);
  
  if (isButtonVisible) {
    logInfo('"加载更多"按钮已在视图中，无需滚动');
    return true;
  }
  
  let lastPosition = 0;
  let buttonFound = false;
  let attemptCount = 0;
  const maxAttempts = 20;
  
  while (!buttonFound && attemptCount < maxAttempts) {
    const scrollStep = Math.floor(Math.random() * 300) + 200;
    lastPosition += scrollStep;
    await page.evaluate((position) => {
      window.scrollTo({ top: position, behavior: 'smooth' });
    }, lastPosition);
    
    const pauseTime = Math.floor(Math.random() * 1000) + 500;
    await page.waitForTimeout(pauseTime);
    
    if (Math.random() > 0.5) {
      await page.waitForTimeout(Math.floor(Math.random() * 1000) + 500);
    }
    
    buttonFound = await page.evaluate((selector) => {
      const button = document.querySelector(selector);
      if (!button) return false;
      const rect = button.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    }, targetSelector);
    
    attemptCount++;
    if (buttonFound) {
      logInfo(`在第 ${attemptCount} 次尝试后找到"加载更多"按钮`);
      await page.waitForTimeout(1000);
      return true;
    }
  }
  logInfo(`未找到"加载更多"按钮，已达到最大尝试次数 (${maxAttempts})`);
  return false;
}
*/

/*
async function scrollPageToLoad(page: Page, scrollDelay: number = 1000): Promise<void> {
  logInfo('开始滚动页面以加载更多内容...');
  let pageHeight = await page.evaluate(() => document.body.scrollHeight);
  let currentPosition = 0;
  const scrollStep = 300;
  while (currentPosition < pageHeight) {
    await page.evaluate((position) => {
      window.scrollTo(0, position);
    }, currentPosition);
    currentPosition += scrollStep;
    await page.waitForTimeout(scrollDelay);
    if (currentPosition % 1500 === 0) {
      const newPageHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newPageHeight > pageHeight) {
        logInfo(`页面高度从 ${pageHeight}px 增加到 ${newPageHeight}px`);
        pageHeight = newPageHeight;
      }
    }
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  logInfo('页面滚动完成');
}
*/

/**
 * 抓取商品详情页数据 (暂未使用，留作后续扩展)
 */
export async function scrapeProductDetail(
  browser: Browser,
  product: Product,
): Promise<Product> {
  logInfo(`开始抓取商品详情: ${product.name}`);

  const page = await browser.newPage();

  try {
    await page.goto(product.url, { waitUntil: "networkidle" });

    // 等待页面加载
    await page.waitForSelector("body");

    // 提取详细描述
    const descriptionElement = await page.$(SELECTORS.DETAIL_DESCRIPTION);
    if (descriptionElement) {
      product.description = (await descriptionElement.textContent()) || "";
    }

    // 提取更多图片
    const imageElements = await page.$$(SELECTORS.DETAIL_IMAGES);
    const images: string[] = [];
    for (const imgElement of imageElements) {
      const src = await imgElement.getAttribute("src");
      if (src) images.push(src);
    }
    if (images.length > 0) {
      product.images = images;
    }

    // 提取颜色
    const colorElement = await page.$(SELECTORS.DETAIL_COLOR);
    if (colorElement) {
      const colorText = (await colorElement.textContent()) || "";
      product.color = colorText.trim();
    }

    // 提取尺码
    const sizeElements = await page.$$(SELECTORS.DETAIL_SIZE);
    const sizes: string[] = [];
    for (const sizeElement of sizeElements) {
      const size = await sizeElement.textContent();
      if (size) sizes.push(size.trim());
    }
    product.sizes = sizes;

    // 提取 SKU
    const skuElement = await page.$(SELECTORS.DETAIL_SKU);
    if (skuElement) {
      const skuText = (await skuElement.textContent()) || "";
      product.sku = skuText.replace("SKU:", "").trim();
    }

    return product;
  } catch (error) {
    logError(`抓取商品详情失败: ${product.url}, ${error}`);
    return product; // 返回原始商品数据
  } finally {
    await page.close();
  }
}

// 导出函数
export default scrapeCettire;
