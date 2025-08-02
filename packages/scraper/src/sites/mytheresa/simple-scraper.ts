// 基于测试脚本成功模式的简化Mytheresa抓取器
import { chromium } from "playwright";
import type { Product } from "@repo/types";
// Removed unused imports
import type { ScraperOptions } from "../../main.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  minimalLog,
  normalLog,
  verboseLog,
  // ScraperLogLevel, - unused
} from "../../utils.js";
import { SELECTORS } from "./selectors.js";

/**
 * 简化的Mytheresa抓取器 - 基于测试脚本的成功模式
 * 特点：
 * 1. 不使用Crawlee框架
 * 2. 单一浏览器会话
 * 3. 顺序处理商品
 * 4. 模拟真实用户行为
 */
export default async function scrapeMytheresaSimple(
  startUrls: string | string[] = [
    "https://www.mytheresa.com/us/en/women/new-arrivals/current-week",
  ],
  options: ScraperOptions = {},
  executionId?: string,
): Promise<Product[]> {
  const siteName = "Mytheresa";
  const allScrapedProducts: Product[] = [];

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} 简化抓取器启动 - 基于测试脚本成功模式`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
        mode: "simple_single_session",
      },
    );
  }

  const startUrlsArray = Array.isArray(startUrls) ? startUrls : [startUrls];
  const maxProducts = options.maxProducts || 20;
  // 🚀 性能优化：可选的详情页抓取，默认启用
  const enableDetailExtraction = options.enableDetailExtraction ?? true;
  const maxDetailPages = enableDetailExtraction ? maxProducts : 0;

  let browser: any = null;

  try {
    // 检测是否在服务器环境运行
    const isServerEnvironment =
      !process.env.DISPLAY && process.platform === "linux";

    // 如果在服务器环境且没有 DISPLAY，提示需要使用 xvfb
    if (isServerEnvironment) {
      console.log("⚠️  检测到服务器环境，需要虚拟显示器支持");
      console.log("   请使用 xvfb-run 启动应用，或设置 DISPLAY 环境变量");
    }

    // 使用与测试脚本完全相同的浏览器配置
    browser = await chromium.launch({
      headless: true, // 使用无头模式
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await (browser as any).newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 注入与测试脚本相同的反检测脚本
    await page.addInitScript(() => {
      // ========== 基础WebDriver隐藏 ==========
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        configurable: true,
      });

      // 删除所有自动化相关变量
      const automationVars = [
        "cdc_adoQpoasnfa76pfcZLmcfl_Array",
        "cdc_adoQpoasnfa76pfcZLmcfl_Promise",
        "cdc_adoQpoasnfa76pfcZLmcfl_Symbol",
        "$cdc_asdjflasutopfhvcZLmcfl_",
        "__webdriver_script_fn",
        "__webdriver_script_func",
        "__webdriver_script_function",
        "__fxdriver_id",
        "__fxdriver_unwrapped",
        "__driver_evaluate",
        "__webdriver_evaluate",
        "__selenium_evaluate",
        "__fxdriver_evaluate",
        "__driver_unwrapped",
        "__webdriver_unwrapped",
        "__selenium_unwrapped",
        "_Selenium_IDE_Recorder",
        "_selenium",
        "calledSelenium",
        "$chrome_asyncScriptInfo",
        "__$webdriverAsyncExecutor",
        "webdriver",
        "driver-evaluate",
        "webdriver-evaluate",
        "selenium-evaluate",
        "webdriverCommand",
        "webdriver-evaluate-response",
      ];

      automationVars.forEach((varName) => {
        try {
          delete (window as unknown as Record<string, unknown>)[varName];
          delete (document as unknown as Record<string, unknown>)[varName];
        } catch (error) {
          // Ignore deletion errors
        }
      });

      // ========== Canvas指纹混淆（关键技术）==========
      const canvasNoise = () => {
        const shift = {
          r: Math.floor(Math.random() * 10) - 5,
          g: Math.floor(Math.random() * 10) - 5,
          b: Math.floor(Math.random() * 10) - 5,
          a: Math.floor(Math.random() * 10) - 5,
        };
        return shift;
      };

      const injectCanvasNoise = function () {
        const overwriteCanvasMethod = function (name: string) {
          const originalMethod =
            HTMLCanvasElement.prototype[name as keyof HTMLCanvasElement];
          Object.defineProperty(HTMLCanvasElement.prototype, name, {
            value: function (this: HTMLCanvasElement, ...args: unknown[]) {
              const context = this.getContext("2d");
              if (context) {
                // 在Canvas上添加微小的噪声
                const imageData = context.getImageData(
                  0,
                  0,
                  this.width,
                  this.height,
                );
                const data = imageData.data;
                const noise = canvasNoise();

                for (let i = 0; i < data.length; i += 4) {
                  if (Math.random() < 0.001) {
                    // 1/1000 的像素点添加噪声
                    data[i] = Math.max(0, Math.min(255, data[i] + noise.r)); // R
                    data[i + 1] = Math.max(
                      0,
                      Math.min(255, data[i + 1] + noise.g),
                    ); // G
                    data[i + 2] = Math.max(
                      0,
                      Math.min(255, data[i + 2] + noise.b),
                    ); // B
                    data[i + 3] = Math.max(
                      0,
                      Math.min(255, data[i + 3] + noise.a),
                    ); // A
                  }
                }
                context.putImageData(imageData, 0, 0);
              }
              return (originalMethod as (...args: unknown[]) => unknown).apply(
                this,
                args,
              );
            },
          });
        };

        overwriteCanvasMethod("toBlob");
        overwriteCanvasMethod("toDataURL");
      };

      injectCanvasNoise();

      // ========== WebGL指纹混淆 ==========
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // 混淆一些关键的WebGL参数
        if (parameter === 37445) {
          // UNMASKED_VENDOR_WEBGL
          return "Intel Inc.";
        }
        if (parameter === 37446) {
          // UNMASKED_RENDERER_WEBGL
          return "Intel Iris Pro OpenGL Engine";
        }
        return getParameter.call(this, parameter);
      };
    });

    // 处理每个起始URL
    for (const targetUrl of startUrlsArray) {
      minimalLog(`\n🚀 开始处理: ${targetUrl}`);

      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `开始处理URL: ${targetUrl}`,
        );
      }

      // 🚀 完全模拟测试脚本的导航流程
      // 1. 首先导航到主页（与测试脚本完全一致）
      const homepageUrl = getHomepageUrl(targetUrl);
      verboseLog(`🏠 导航到主页: ${homepageUrl}`);

      try {
        await page.goto(homepageUrl, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });

        // 🚀 优化：减少页面稳定等待时间
        await page.waitForTimeout(2000);
      } catch (gotoError: unknown) {
        const error = gotoError as Error;
        normalLog(`⚠️ 主页导航失败: ${error.message}`);
        verboseLog("🔄 尝试重新导航...");

        try {
          await page.goto(homepageUrl, {
            waitUntil: "load",
            timeout: 120000,
          });
          await page.waitForTimeout(3000);
        } catch (retryError: unknown) {
          const retryErr = retryError as Error;
          normalLog(`❌ 重试主页导航也失败: ${retryErr.message}`);
          continue; // 跳过这个URL
        }
      }

      verboseLog(`📋 主页标题: "${await page.title()}"`);
      normalLog("✅ 主页加载成功");

      // 2. 模拟真实用户浏览主页行为（与测试脚本完全一致）
      verboseLog("\n👤 模拟真实用户浏览主页行为...");
      await simulateRealUserBehavior(page);

      // 3. 通过模拟点击导航进入目标页面（与测试脚本完全一致）
      verboseLog(`\n🖱️  寻找并点击导航中的目标链接进入: ${targetUrl}`);

      const navigationSuccess = await simulateNavigationToTarget(
        page,
        targetUrl,
      );

      if (!navigationSuccess) {
        normalLog(`⚠️ 模拟导航失败，尝试直接导航到 ${targetUrl}`);
        // 回退到直接导航
        try {
          await page.goto(targetUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
        } catch (directNavError) {
          normalLog(`❌ 直接导航也失败: ${(directNavError as Error).message}`);
          continue; // 跳过这个URL
        }
      }

      // 🚀 优化：等待目标页面加载
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);

      // 获取当前URL确认导航成功
      const currentUrl = page.url();
      normalLog(`🎯 当前页面: ${currentUrl}`);
      verboseLog(`📋 当前页面标题: "${await page.title()}"`);

      // 4. 模拟真实用户浏览目标页面行为
      verboseLog("\n👤 模拟真实用户浏览目标页面行为...");
      await simulateRealUserBehavior(page);

      // 智能提取当前页面的产品（支持数据库去重）
      normalLog("\n📦 智能提取产品信息...");
      const products = await extractProducts(page, maxProducts, executionId);

      if (products.length > 0) {
        minimalLog(`✅ 成功提取 ${products.length} 个产品！`);

        let finalProducts = products;

        // 🚀 性能优化：可选的详情页抓取
        if (enableDetailExtraction && maxDetailPages > 0) {
          normalLog(`\n🚀 开始商品详情页抓取 (前${maxDetailPages}个商品)...`);
          finalProducts = await extractProductDetails(
            page,
            products,
            maxDetailPages,
          );
          normalLog(
            `✅ 详情页抓取完成，获取 ${finalProducts.length} 个详细商品信息`,
          );
        } else {
          normalLog("⚡ 跳过详情页抓取以提升处理速度");
        }

        // 将结果添加到总结果中
        allScrapedProducts.push(...(finalProducts as any as Product[]));

        minimalLog(
          `🎉 URL处理完成: ${targetUrl}, 获取商品数量: ${finalProducts.length}`,
        );

        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.INFO,
            `URL处理完成: ${targetUrl}`,
            {
              productCount: finalProducts.length,
              detailExtractionEnabled: enableDetailExtraction,
            },
          );
        }
      } else {
        normalLog("⚠️  未提取到产品数据");

        if (executionId) {
          await sendLogToBackend(
            executionId,
            LocalScraperLogLevel.WARN,
            `未提取到产品数据: ${targetUrl}`,
          );
        }
      }
    }

    minimalLog(
      `\n🎉 简化抓取器完成！总计获取 ${allScrapedProducts.length} 个商品`,
    );

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Mytheresa 简化抓取器完成`,
        {
          totalProducts: allScrapedProducts.length,
          summary: {
            totalProductsFound: allScrapedProducts.length,
            productsWithDetailData: allScrapedProducts.filter(
              (p) => (p as any).hasDetailData,
            ).length,
            productsWithoutDetailData: allScrapedProducts.filter(
              (p) => !(p as any).hasDetailData,
            ).length,
          },
        },
      );
    }
  } catch (error) {
    console.error("❌ 简化抓取器失败:", error);

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `抓取器失败: ${(error as Error).message}`,
      );
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return allScrapedProducts;
}

/**
 * 获取主页URL - 根据目标URL推导主页
 */
function getHomepageUrl(targetUrl: string): string {
  try {
    const url = new URL(targetUrl);
    if (url.pathname.includes("/women/")) {
      return "https://www.mytheresa.com/us/en/women";
    } else if (url.pathname.includes("/men/")) {
      return "https://www.mytheresa.com/us/en/men";
    } else {
      return "https://www.mytheresa.com/us/en/women"; // 默认女装
    }
  } catch (error) {
    return "https://www.mytheresa.com/us/en/women"; // 默认女装
  }
}

/**
 * 模拟导航到目标页面 - 与测试脚本完全一致的导航逻辑
 */
async function simulateNavigationToTarget(
  page: any,
  targetUrl: string,
): Promise<boolean> {
  try {
    verboseLog(`🎯 寻找导航链接进入: ${targetUrl}`);

    // 模拟真实用户导航行为 - 基于成功测试文件
    const readingTime = 3000 + Math.random() * 4000; // 使用成功测试的时间
    await page.waitForTimeout(readingTime);

    // 随机滚动 - 匹配成功测试
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * (0.2 + Math.random() * 0.3), // 更大的滚动范围
        behavior: "smooth",
      });
    });

    await page.waitForTimeout(1000 + Math.random() * 1000);

    // 随机鼠标移动 - 匹配成功测试
    const viewport = (await page.viewportSize()) || {
      width: 1920,
      height: 1080,
    };
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 5 },
    );

    // 基于成功测试文件的导航逻辑
    if (targetUrl.includes("new-arrivals")) {
      verboseLog("🎯 寻找New Arrivals链接（基于成功测试逻辑）...");

      // 等待导航栏加载完成
      await page.waitForSelector(".headerdesktop__section__wrapper__nav", {
        timeout: 10000,
      });
      verboseLog("✅ 导航栏已加载");

      // 完全匹配成功测试文件的选择器
      const newArrivalsSelectors = [
        // 最精确的选择器 - 基于成功测试的HTML结构
        '.headerdesktop__section__wrapper__nav .nav .nav__item[data-nav-id="0"] .nav__item__text__link__label:has-text("New Arrivals")',
        '.nav__item[data-nav-id="0"] .nav__item__text__link[data-tracking-label="fo_ww=new-arrivals_main"]',
        'a[data-tracking-label="fo_ww=new-arrivals_main"][href="/us/en/women/new-arrivals/current-week"]',
        // 备用选择器
        '.nav__item__text__link__label:has-text("New Arrivals")',
        'a[href="/us/en/women/new-arrivals/current-week"]',
        '.nav__item[data-nav-id="0"] a',
      ];

      let newArrivalsLink = null;
      let usedSelector = "";

      for (const selector of newArrivalsSelectors) {
        try {
          verboseLog(`🔍 尝试选择器: ${selector}`);
          newArrivalsLink = page.locator(selector).first();
          if (await newArrivalsLink.isVisible({ timeout: 3000 })) {
            verboseLog(`📍 找到New Arrivals链接: ${selector}`);
            usedSelector = selector;
            break;
          }
        } catch (err: unknown) {
          const error = err as Error;
          verboseLog(`❌ 选择器失败: ${selector} - ${error.message}`);
          continue;
        }
      }

      if (newArrivalsLink && (await newArrivalsLink.isVisible())) {
        verboseLog(`🎯 准备点击New Arrivals链接 (使用选择器: ${usedSelector})`);

        // 先滚动到导航区域确保可见
        await page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        await page.waitForTimeout(1000);

        // 完全模拟成功测试的鼠标行为
        const box = await newArrivalsLink.boundingBox();
        if (box) {
          verboseLog(
            `📍 链接位置: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`,
          );

          // 慢慢移动鼠标到链接位置
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
            steps: 10,
          });
          await page.waitForTimeout(1000 + Math.random() * 1000);

          // 悬停一下
          await newArrivalsLink.hover();
          verboseLog("🖱️  鼠标悬停在New Arrivals上");
          await page.waitForTimeout(500 + Math.random() * 500);

          // 点击并等待导航
          verboseLog("🖱️  执行点击...");
          await Promise.all([
            page
              .waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 15000,
              })
              .catch(() => {
                verboseLog("⚠️ 导航等待超时，但可能已经成功跳转");
              }),
            newArrivalsLink.click(),
          ]);

          normalLog("✅ 成功点击 New Arrivals 导航");
          return true;
        } else {
          normalLog("❌ 无法获取New Arrivals链接位置");
        }
      } else {
        normalLog("❌ 未找到New Arrivals链接");
      }
    } else if (targetUrl.includes("designers")) {
      verboseLog("🎯 寻找Designers直接链接...");
      const designersLink = page
        .locator('a[data-tracking-label*="designers"][href*="designers"]')
        .first();
      if (await designersLink.isVisible({ timeout: 3000 })) {
        await designersLink.click();
        normalLog("✅ 成功点击Designers链接");
        return true;
      }
    } else if (targetUrl.includes("clothing")) {
      verboseLog("🎯 寻找Clothing直接链接...");
      const clothingLink = page
        .locator('a[data-tracking-label*="clothing"][href*="clothing"]')
        .first();
      if (await clothingLink.isVisible({ timeout: 3000 })) {
        await clothingLink.click();
        normalLog("✅ 成功点击Clothing链接");
        return true;
      }
    } else if (targetUrl.includes("sale")) {
      verboseLog("🎯 寻找Sale直接链接...");
      const saleLink = page
        .locator('a[data-tracking-label*="sale"][href*="sale"]')
        .first();
      if (await saleLink.isVisible({ timeout: 3000 })) {
        await saleLink.click();
        normalLog("✅ 成功点击Sale链接");
        return true;
      }
    }

    return false;
  } catch (error) {
    normalLog(`💥 模拟导航失败: ${(error as Error).message}`);
    return false;
  }
}

/**
 * 模拟真实用户浏览行为 - 与测试脚本完全一致
 */
async function simulateRealUserBehavior(page: any): Promise<void> {
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
 * 智能产品抓取器 - 支持数据库去重和动态深度遍历
 */
async function extractProducts(
  page: any,
  maxProducts: number,
  executionId?: string,
): Promise<Record<string, unknown>[]> {
  try {
    normalLog("🔍 开始智能多页商品抓取...");
    normalLog(
      `🎯 目标: 抓取${maxProducts}个新商品（自动跳过数据库中已存在的商品）`,
    );

    // 初始化页面跟踪系统
    initializePageTracking();

    const products: Record<string, unknown>[] = [];
    let currentPage = 1;
    let consecutiveSkippedPages = 0; // 连续跳过的页面数
    const maxConsecutiveSkips = 3; // 最大连续跳过页面数
    let previousTotalProducts = 0; // 记录上一次的商品总数

    while (
      products.length < maxProducts &&
      consecutiveSkippedPages < maxConsecutiveSkips
    ) {
      normalLog(`\n📄 第${currentPage}页商品抓取...`);

      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `开始抓取第${currentPage}页，当前已获取${products.length}个新商品`,
          {
            currentPage,
            newProductsCount: products.length,
            targetProducts: maxProducts,
          },
        );
      }

      // 🚀 优化：减少商品加载等待时间
      await page.waitForTimeout(1500);

      // 获取当前页面的商品，只处理我们还需要的数量
      const remainingNeeded = maxProducts - products.length;

      // 检查当前页面是否已被处理过
      const pageIndicators = await page
        .locator("div.list__page__indicator[data-page]")
        .all();
      let currentPageNumber = currentPage;
      if (pageIndicators.length > 0) {
        // 获取最后一个页面指示器的页码
        const lastIndicator = pageIndicators[pageIndicators.length - 1];
        const dataPage = await lastIndicator.getAttribute("data-page");
        currentPageNumber = parseInt(dataPage || currentPage.toString(), 10);
      }

      // 检查这一页是否已经被完全处理过
      const pageAlreadyProcessed =
        await checkPageAlreadyProcessed(currentPageNumber);
      if (pageAlreadyProcessed) {
        normalLog(`⏭️ 第 ${currentPageNumber} 页已经被完全处理过，跳过...`);

        // 尝试加载更多商品
        const hasMore = await loadMoreProducts(page);
        if (!hasMore) {
          normalLog("📋 没有更多商品可加载，停止抓取");
          break;
        }

        currentPage++;
        continue;
      }

      // 如果是加载更多后的页面，优先处理新加载的商品
      let currentPageProducts;
      if (currentPage > 1) {
        // 获取页面上的总商品数
        const allItems = await page.locator("div.item").all();
        const currentTotalProducts = allItems.length;

        if (currentTotalProducts > previousTotalProducts) {
          // 有新商品加载，处理最后加载的部分
          const newItemsStartIndex = previousTotalProducts;
          normalLog(
            `🆕 检测到新加载的商品：从索引 ${newItemsStartIndex + 1} 开始的 ${currentTotalProducts - previousTotalProducts} 个商品`,
          );

          // 强制处理新加载的商品范围
          currentPageProducts = await extractCurrentPageProducts(
            page,
            remainingNeeded,
            newItemsStartIndex,
          );
          previousTotalProducts = currentTotalProducts;
        } else {
          // 没有新商品加载，使用常规提取
          currentPageProducts = await extractCurrentPageProducts(
            page,
            remainingNeeded,
          );
        }
      } else {
        // 第一页，使用常规提取
        currentPageProducts = await extractCurrentPageProducts(
          page,
          remainingNeeded,
        );
        const allItems = await page.locator("div.item").all();
        previousTotalProducts = allItems.length;
      }

      if (currentPageProducts.length === 0) {
        normalLog("⚠️ 当前页面未找到新商品，尝试加载更多...");

        // 尝试加载更多商品
        const hasMore = await loadMoreProducts(page);
        if (!hasMore) {
          normalLog("📋 没有更多商品可加载，停止抓取");
          break;
        }

        currentPage++;
        continue;
      }

      // 🚀 简化逻辑：extractCurrentPageProducts 已经包含智能去重
      // 只需要过滤内存中已存在的商品
      let newProductsCount = 0;

      for (const product of currentPageProducts) {
        if (products.length >= maxProducts) break;

        const productUrl = product.link || product.url;

        // 检查内存去重
        const existsInMemory = products.some(
          (p) => (p.link || p.url) === productUrl,
        );
        if (existsInMemory) {
          verboseLog(
            `⏭️  跳过内存中已存在商品: ${product.brand} - ${product.name}`,
          );
          continue;
        }

        // 新商品：添加到结果中
        products.push(product);
        newProductsCount++;
        verboseLog(
          `✅ 新商品 ${products.length}: ${product.brand} - ${product.name || product.title}`,
        );
      }

      minimalLog(
        `📊 第${currentPage}页统计: 新增${newProductsCount}个商品, 总计${products.length}个新商品`,
      );

      // 记录页面处理情况
      if (currentPageProducts.length > 0) {
        const pageNumbers = [
          ...new Set(
            currentPageProducts.map(
              (p) => (p as any).metadata?.pageIndicator || 1,
            ),
          ),
        ];
        pageNumbers.forEach((pageNum) => {
          const pageProducts = currentPageProducts.filter(
            (p) => (p as any).metadata?.pageIndicator === pageNum,
          );
          recordPageProducts(pageNum, pageProducts);
        });
      }

      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.INFO,
          `第${currentPage}页抓取完成`,
          {
            newProducts: newProductsCount,
            totalNewProducts: products.length,
          },
        );
      }

      // 如果这一页没有新商品，计数连续跳过页面
      if (newProductsCount === 0) {
        consecutiveSkippedPages++;
        normalLog(
          `⚠️ 第${currentPage}页没有新商品，连续跳过页面数: ${consecutiveSkippedPages}/${maxConsecutiveSkips}`,
        );
      } else {
        consecutiveSkippedPages = 0; // 重置计数器
      }

      // 如果已达到目标数量，停止抓取
      if (products.length >= maxProducts) {
        minimalLog(`🎉 已达到目标数量 ${maxProducts} 个新商品！`);
        break;
      }

      // 如果连续多页都没有新商品，可能已经抓取完所有新商品
      if (consecutiveSkippedPages >= maxConsecutiveSkips) {
        normalLog(
          `📋 连续${maxConsecutiveSkips}页没有新商品，可能已抓取完所有新商品`,
        );
        break;
      }

      // 尝试加载更多商品
      const hasMore = await loadMoreProducts(page);
      if (!hasMore) {
        normalLog("📋 没有更多商品可加载");
        break;
      }

      currentPage++;
    }

    minimalLog(
      `🎉 智能抓取完成！共获取 ${products.length} 个新商品，遍历了 ${currentPage} 页`,
    );

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `智能抓取完成`,
        {
          totalNewProducts: products.length,
          pagesTraversed: currentPage,
          maxProducts: maxProducts,
          efficiency:
            products.length > 0
              ? ((products.length / maxProducts) * 100).toFixed(1) + "%"
              : "0%",
        },
      );
    }

    return products.slice(0, maxProducts); // 确保不超过目标数量
  } catch (error) {
    normalLog("💥 智能抓取失败:");

    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.ERROR,
        `智能抓取失败: ${(error as Error).message}`,
      );
    }

    return [];
  }
}

/**
 * 构建API基础URL - 使用环境变量配置
 */
function buildApiBaseUrl(): string {
  let baseUrl = "";

  // 优先使用明确指定的API URL
  if (process.env.INTERNAL_API_URL) {
    baseUrl = process.env.INTERNAL_API_URL;
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    // 次优使用公共API URL
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
  } else {
    // 默认值：根据环境判断
    const defaultPort = process.env.NODE_ENV === "production" ? "3000" : "3001";
    const defaultHost = process.env.HOST || "localhost";
    baseUrl = `http://${defaultHost}:${defaultPort}`;
  }

  // 确保baseUrl不以/api结尾，因为我们会手动添加完整路径
  if (baseUrl.endsWith("/api")) {
    baseUrl = baseUrl.slice(0, -4);
  }

  return baseUrl;
}

/**
 * 批量检查商品是否已在数据库中存在
 */
async function batchCheckProductsExistence(
  productUrls: string[],
): Promise<Set<string>> {
  if (!productUrls || productUrls.length === 0) return new Set();

  try {
    const apiBaseUrl = buildApiBaseUrl();
    const apiEndpoint = `${apiBaseUrl}/api/internal/products/batch-exists`;

    verboseLog(`🔗 调用批量检查API: ${apiEndpoint}`);

    // 调用后端批量检查API
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: productUrls,
        source: "Mytheresa",
      }),
    });

    if (!response.ok) {
      verboseLog(`⚠️ 批量检查API响应错误: ${response.status} - ${apiEndpoint}`);
      return new Set(); // 返回空集合，假设都不存在
    }

    const data = await response.json();
    if (data.existingUrls && Array.isArray(data.existingUrls)) {
      verboseLog(
        `✅ 批量检查完成: ${productUrls.length}个URL中有${data.existingUrls.length}个已存在`,
      );
      return new Set(data.existingUrls);
    }

    return new Set();
  } catch (error) {
    verboseLog(`⚠️ 批量数据库存在性检查失败: ${(error as Error).message}`);
    return new Set(); // 出错时假设都不存在，让智能更新机制处理
  }
}

/**
 * 检查某个页面是否已经被完全处理过
 * 使用内存缓存来跟踪已处理的页面
 */
async function checkPageAlreadyProcessed(pageNumber: number): Promise<boolean> {
  initializePageTracking();
  const processedPages = (global as Record<string, unknown>)
    .processedPages as Set<number>;

  if (processedPages.has(pageNumber)) {
    normalLog(`⏭️ 第 ${pageNumber} 页在本次运行中已被处理过`);
    return true;
  }

  verboseLog(`📄 第 ${pageNumber} 页需要处理`);
  return false;
}

/**
 * 提取当前页面的商品 - 智能偏移量版本
 * 支持根据数据库已存在商品智能选择处理范围
 * @param page - 页面对象
 * @param maxItems - 最大提取数量
 * @param forceStartIndex - 强制从指定索引开始（用于处理新加载的商品）
 */
async function extractCurrentPageProducts(
  page: any,
  maxItems: number = 20,
  forceStartIndex?: number,
): Promise<Record<string, unknown>[]> {
  try {
    normalLog("🔍 开始智能提取当前页面商品...");

    // 优化：减少页面等待时间
    await page.waitForTimeout(1000);

    // 调试：检查页面状态
    const currentUrl = page.url();
    const pageTitle = await page.title();
    normalLog(`📍 当前页面URL: ${currentUrl}`);
    normalLog(`📍 页面标题: ${pageTitle}`);

    let productItems: any[] = [];

    // 使用已有的产品项选择器
    for (const selector of SELECTORS.PLP_PRODUCT_ITEM_SELECTORS) {
      try {
        normalLog(`🔍 尝试选择器: ${selector}`);
        const items = await page.locator(selector).all();
        normalLog(`📊 选择器 ${selector} 找到 ${items.length} 个元素`);

        if (items.length > 0) {
          verboseLog(
            `📦 找到 ${items.length} 个商品项，使用选择器: ${selector}`,
          );
          productItems = items;
          break;
        }
      } catch (err: unknown) {
        const error = err as Error;
        normalLog(`❌ 选择器失败 ${selector}: ${error.message}`);
        continue;
      }
    }

    if (productItems.length === 0) {
      normalLog("❌ 所有商品项选择器都未找到元素");

      // 调试：尝试查找页面上任何可能的商品容器
      const debugSelectors = [
        ".list__container",
        ".item",
        ".product",
        "[class*='item']",
        "[class*='product']",
        ".grid",
        ".list",
      ];

      for (const debugSelector of debugSelectors) {
        try {
          const debugItems = await page.locator(debugSelector).all();
          normalLog(
            `🔍 调试选择器 ${debugSelector}: 找到 ${debugItems.length} 个元素`,
          );
        } catch (error) {
          continue;
        }
      }

      return [];
    }

    normalLog(
      `🧠 开始智能分析页面商品范围（共${productItems.length}个商品）...`,
    );

    // 第一步：快速提取所有商品的基础信息（主要是URL）
    const allProductsBasicInfo: Array<{ index: number; url: string }> = [];

    for (let i = 0; i < productItems.length; i++) {
      try {
        const item = productItems[i];
        const link = await item
          .locator(SELECTORS.PLP_PRODUCT_LINK)
          .getAttribute("href", { timeout: 300 });
        if (link) {
          const fullUrl = new URL(link, page.url()).toString();
          allProductsBasicInfo.push({ index: i, url: fullUrl });
        }
      } catch (error) {
        verboseLog(`⚠️ 无法获取商品${i + 1}的URL，跳过`);
        continue;
      }
    }

    normalLog(`✅ 成功获取${allProductsBasicInfo.length}个商品的URL信息`);

    // 第二步：批量检查所有商品的存在性
    const allUrls = allProductsBasicInfo.map((info) => info.url);
    normalLog(`🔍 批量检查${allUrls.length}个商品的数据库存在性...`);

    const existingUrlsSet = await batchCheckProductsExistence(allUrls);
    normalLog(`✅ 批量检查完成，发现${existingUrlsSet.size}个已存在的商品`);

    // 第三步：智能查找最佳处理范围
    const { startIndex, endIndex, reason } = findOptimalProductRange(
      allProductsBasicInfo,
      existingUrlsSet,
      maxItems,
      forceStartIndex,
    );

    normalLog(`🎯 智能范围选择: 索引${startIndex}-${endIndex - 1} (${reason})`);

    if (startIndex >= productItems.length) {
      normalLog("⚠️ 所有商品都已存在于数据库中");
      return [];
    }

    // 检查选定范围内是否有新商品
    const rangeProductsInfo = allProductsBasicInfo.slice(startIndex, endIndex);
    const newProductsInRange = rangeProductsInfo.filter(
      (info) => !existingUrlsSet.has(info.url),
    ).length;

    if (newProductsInRange === 0) {
      normalLog("⚠️ 选定范围内的商品都已存在于数据库中，需要加载更多页面");
      return [];
    }

    // 第四步：处理选定范围的商品
    const products: Record<string, unknown>[] = [];
    const targetRange = Math.min(endIndex, productItems.length);

    normalLog(
      `📦 开始处理商品范围 ${startIndex + 1}-${targetRange} (共${targetRange - startIndex}个)...`,
    );

    for (let i = startIndex; i < targetRange; i++) {
      const item = productItems[i];

      try {
        normalLog(
          `📦 处理商品 ${i + 1}/${productItems.length} (范围内第${i - startIndex + 1}个)...`,
        );
        const productData = await extractSingleProduct(item, page, i);

        if (
          productData &&
          (productData.brand || productData.name || productData.title)
        ) {
          products.push(productData);
          normalLog(
            `✅ 商品 ${i + 1} 提取成功: ${productData.brand} - ${productData.name} (第${(productData as any).metadata?.pageIndicator}页)`,
          );
        } else {
          normalLog(`⚠️ 商品 ${i + 1} 数据不完整，跳过`);
        }

        // 如果已经获得足够的有效商品，提前停止
        if (products.length >= maxItems) {
          normalLog(`🎉 已获得 ${products.length} 个有效商品，达到目标数量！`);
          break;
        }
      } catch (error: unknown) {
        const err = error as Error;
        normalLog(`❌ 商品 ${i + 1} 提取失败: ${err.message}`);
        continue;
      }
    }

    normalLog(
      `🎉 智能商品提取完成，成功提取 ${products.length} 个商品 (处理范围: ${startIndex + 1}-${Math.min(startIndex + products.length, productItems.length)})`,
    );
    return products;
  } catch (error) {
    const err = error as Error;
    normalLog(`💥 智能提取当前页面商品失败: ${err.message}`);
    return [];
  }
}

/**
 * 获取上次处理的范围（从全局缓存或环境变量）
 */
function getLastProcessedRange(): {
  startIndex: number;
  endIndex: number;
} | null {
  // 使用全局变量作为简单的内存缓存
  if (!(global as Record<string, unknown>).lastProcessedRange) {
    return null;
  }
  return (global as any).lastProcessedRange as {
    startIndex: number;
    endIndex: number;
  } | null;
}

/**
 * 保存本次处理的范围
 */
function saveProcessedRange(startIndex: number, endIndex: number): void {
  (global as Record<string, unknown>).lastProcessedRange = {
    startIndex,
    endIndex,
  };
}

/**
 * 初始化页面处理记录
 */
function initializePageTracking(): void {
  if (!(global as Record<string, unknown>).processedPages) {
    (global as Record<string, unknown>).processedPages = new Set<number>();
  }
  if (!(global as Record<string, unknown>).pageProductCounts) {
    (global as Record<string, unknown>).pageProductCounts = new Map<
      number,
      { total: number; processed: number }
    >();
  }
}

/**
 * 记录页面的商品处理情况
 */
function recordPageProducts(
  pageNumber: number,
  products: Record<string, unknown>[],
): void {
  initializePageTracking();
  const pageProductCounts = (global as Record<string, unknown>)
    .pageProductCounts as Map<number, { total: number; processed: number }>;

  const currentCount = pageProductCounts.get(pageNumber) || {
    total: 0,
    processed: 0,
  };
  currentCount.total = Math.max(currentCount.total, products.length);
  currentCount.processed += products.filter(
    (p) => (p as any).metadata?.pageIndicator === pageNumber,
  ).length;

  pageProductCounts.set(pageNumber, currentCount);

  // 如果该页面的商品已经处理了90%以上，标记为已处理
  if (currentCount.processed >= currentCount.total * 0.9) {
    ((global as any).processedPages as Set<number>).add(pageNumber);
    normalLog(
      `✅ 第 ${pageNumber} 页已完成处理 (${currentCount.processed}/${currentCount.total})`,
    );
  }
}

/**
 * 智能查找最佳商品处理范围 - 使用滑动窗口机制
 * 根据数据库存在情况和上次处理位置，找到最适合处理的连续商品范围
 */
function findOptimalProductRange(
  productInfos: Array<{ index: number; url: string }>,
  existingUrls: Set<string>,
  targetCount: number,
  forceStartIndex?: number,
): { startIndex: number; endIndex: number; reason: string } {
  if (productInfos.length === 0) {
    return { startIndex: 0, endIndex: 0, reason: "无商品数据" };
  }

  // 如果指定了强制起始索引，优先使用（用于处理新加载的商品）
  if (
    forceStartIndex !== undefined &&
    forceStartIndex >= 0 &&
    forceStartIndex < productInfos.length
  ) {
    const endIndex = Math.min(
      forceStartIndex + targetCount,
      productInfos.length,
    );

    // 统计这个范围内的新商品数
    let newProductCount = 0;
    for (let i = forceStartIndex; i < endIndex; i++) {
      if (!existingUrls.has(productInfos[i].url)) {
        newProductCount++;
      }
    }

    // 不保存强制范围到滑动窗口历史
    return {
      startIndex: forceStartIndex,
      endIndex: endIndex,
      reason: `处理新加载商品(${forceStartIndex + 1}-${endIndex}, ${newProductCount}个新商品)`,
    };
  }

  // 滑动窗口步长（每次向后滑动的商品数）
  const slideStep = Math.floor(targetCount / 2); // 默认滑动半个窗口大小

  // 获取上次处理的范围
  const lastRange = getLastProcessedRange();
  let preferredStartIndex = 0;

  if (lastRange) {
    // 计算下次应该开始的位置（滑动窗口）
    preferredStartIndex = lastRange.startIndex + slideStep;
    verboseLog(
      `📍 上次处理范围: ${lastRange.startIndex + 1}-${lastRange.endIndex}, 本次优先从索引 ${preferredStartIndex + 1} 开始`,
    );

    // 如果滑动后超出范围，从头开始
    if (preferredStartIndex >= productInfos.length) {
      preferredStartIndex = 0;
      verboseLog(`🔄 已到达页面末尾，从头开始新一轮扫描`);
    }
  }

  // 策略1: 优先使用滑动窗口位置
  if (preferredStartIndex < productInfos.length) {
    const endIndex = Math.min(
      preferredStartIndex + targetCount,
      productInfos.length,
    );
    let newProductCount = 0;
    const rangeSize = endIndex - preferredStartIndex;

    // 统计滑动窗口范围内的新商品数量
    for (let i = preferredStartIndex; i < endIndex; i++) {
      const productInfo = productInfos[i];
      const isNew = !existingUrls.has(productInfo.url);
      if (isNew) {
        newProductCount++;
      }
    }

    const newProductRatio = newProductCount / rangeSize;

    // 保存本次处理范围
    saveProcessedRange(preferredStartIndex, endIndex);

    // 即使新商品比例较低，也使用滑动窗口位置（确保覆盖）
    if (rangeSize > 0) {
      return {
        startIndex: preferredStartIndex,
        endIndex: endIndex,
        reason: `滑动窗口位置(${preferredStartIndex + 1}-${endIndex}, ${newProductCount}个新商品, 占比${(newProductRatio * 100).toFixed(1)}%)`,
      };
    }
  }

  // 策略2: 如果滑动窗口不可用，寻找新商品最多的范围
  let bestRange = null;
  let bestNewCount = 0;

  // 从preferredStartIndex开始查找，优先处理后面的商品
  for (let offset = 0; offset < productInfos.length; offset++) {
    const start = (preferredStartIndex + offset) % productInfos.length;
    const endIndex = Math.min(start + targetCount, productInfos.length);

    // 如果这个范围太小，跳过
    if (endIndex - start < targetCount * 0.5) continue;

    let newProductCount = 0;
    const rangeSize = endIndex - start;

    for (let i = start; i < endIndex; i++) {
      const productInfo = productInfos[i];
      const isNew = !existingUrls.has(productInfo.url);
      if (isNew) {
        newProductCount++;
      }
    }

    const newProductRatio = newProductCount / rangeSize;

    // 选择新商品最多的范围
    if (newProductCount > bestNewCount) {
      bestRange = {
        startIndex: start,
        endIndex: endIndex,
        newCount: newProductCount,
        ratio: newProductRatio,
      };
      bestNewCount = newProductCount;
    }

    // 如果找到足够好的范围，提前返回
    if (newProductRatio >= 0.7 && newProductCount >= targetCount * 0.7) {
      saveProcessedRange(start, endIndex);
      return {
        startIndex: start,
        endIndex: endIndex,
        reason: `找到高质量范围(${start + 1}-${endIndex}, ${newProductCount}个新商品, 占比${(newProductRatio * 100).toFixed(1)}%)`,
      };
    }
  }

  // 返回找到的最佳范围
  if (bestRange) {
    saveProcessedRange(bestRange.startIndex, bestRange.endIndex);
    return {
      startIndex: bestRange.startIndex,
      endIndex: bestRange.endIndex,
      reason: `选择新商品最多的范围(${bestRange.startIndex + 1}-${bestRange.endIndex}, ${bestRange.newCount}个新商品, 占比${(bestRange.ratio * 100).toFixed(1)}%)`,
    };
  }

  // 策略3: 最后的兜底方案 - 确保覆盖
  // 从头开始，选择第一个可用范围
  const fallbackStart = 0;
  const fallbackEnd = Math.min(
    fallbackStart + targetCount,
    productInfos.length,
  );

  if (fallbackEnd > fallbackStart) {
    let newProductCount = 0;
    for (let i = fallbackStart; i < fallbackEnd; i++) {
      if (!existingUrls.has(productInfos[i].url)) {
        newProductCount++;
      }
    }

    saveProcessedRange(fallbackStart, fallbackEnd);
    return {
      startIndex: fallbackStart,
      endIndex: fallbackEnd,
      reason: `兜底方案：从头开始(${fallbackStart + 1}-${fallbackEnd}, ${newProductCount}个新商品)`,
    };
  }

  // 如果连兜底都不行，返回空范围
  return {
    startIndex: 0,
    endIndex: 0,
    reason: "无可用商品范围",
  };
}

/**
 * 加载更多商品 - 与测试脚本一致
 */
async function loadMoreProducts(page: any): Promise<boolean> {
  try {
    verboseLog("\n🔄 寻找并点击'Show more'按钮...");

    // 滑动到页面底部
    verboseLog("📜 滑动到页面底部...");
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
        verboseLog(`🔍 尝试Show more选择器: ${selector}`);
        showMoreButton = await page.locator(selector).first();
        if (await showMoreButton.isVisible({ timeout: 3000 })) {
          verboseLog(`📍 找到Show more按钮: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!showMoreButton || !(await showMoreButton.isVisible())) {
      normalLog("⚠️ 未找到Show more按钮，可能已到最后一页");
      return false;
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
    verboseLog("🖱️  点击Show more按钮...");
    await showMoreButton.click();

    verboseLog("⏰ 等待新商品加载...");
    // 等待3-5秒让新商品渲染
    const waitTime = 3000 + Math.random() * 2000;
    await page.waitForTimeout(waitTime);

    normalLog("✅ 成功加载更多商品");
    return true;
  } catch (error) {
    normalLog("💥 加载更多商品失败:");
    return false;
  }
}

/**
 * 提取商品详情信息 - 与测试脚本完全一致
 */
async function extractProductDetails(
  page: any,
  products: Record<string, unknown>[],
  maxDetailsCount = 20,
): Promise<Record<string, unknown>[]> {
  try {
    normalLog(`\n🔍 开始抓取商品详情信息 (目标: ${maxDetailsCount}个)`);

    const detailedProducts: Record<string, unknown>[] = [];
    const targetProducts = products.slice(0, maxDetailsCount);

    for (let i = 0; i < targetProducts.length; i++) {
      const product = targetProducts[i];
      normalLog(
        `\n📦 处理商品 ${i + 1}/${targetProducts.length}: ${product.brand} - ${product.name}`,
      );

      try {
        // 重新获取商品元素（因为页面可能已经变化）
        const productItems = await page
          .locator(SELECTORS.PLP_PRODUCT_ITEM_SELECTORS[0])
          .all();

        if (i >= productItems.length) {
          normalLog("⚠️ 商品元素索引超出范围，跳过");
          continue;
        }

        const productElement = productItems[i];

        // 点击进入详情页
        const clickSuccess = await simulateProductClick(page, productElement);
        if (!clickSuccess) {
          normalLog("❌ 点击失败，跳过该商品");
          continue;
        }

        // 模拟用户在详情页的浏览行为
        await simulateDetailPageBrowsing(page);

        // 提取详情页数据
        const detailData = await extractPdpData(page);

        if (detailData) {
          // 合并列表页和详情页数据，确保关键字段正确
          const combinedProduct = {
            ...product,
            ...detailData,
            // 确保关键字段不被详情页数据覆盖
            url: product.url || product.link,
            link: product.link || product.url,
            source: product.source,
            currentPrice: detailData.currentPrice || product.currentPrice,
            originalPrice: detailData.originalPrice || product.originalPrice,
            listPageData: product,
            hasDetailData: true,
          };

          detailedProducts.push(combinedProduct);
          minimalLog(`✅ 商品详情提取成功 ${i + 1}/${targetProducts.length}`);
        } else {
          normalLog(`⚠️ 商品详情提取失败 ${i + 1}/${targetProducts.length}`);
          // 仍然保存基础数据
          detailedProducts.push({
            ...product,
            hasDetailData: false,
          });
        }

        // 返回列表页
        const backSuccess = await navigateBackToList(page);
        if (!backSuccess) {
          normalLog("❌ 返回列表页失败，尝试刷新页面");
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3000);
        }

        // 🚀 进一步优化等待时间：0.5-1.5秒
        const waitTime = 500 + Math.random() * 1000;
        verboseLog(`⏰ 快速等待 ${Math.round(waitTime / 1000)} 秒...`);
        await page.waitForTimeout(waitTime);
      } catch (error) {
        normalLog(`💥 处理商品 ${i + 1} 时发生错误`);
        // 尝试返回列表页
        try {
          await navigateBackToList(page);
        } catch (error) {
          verboseLog("尝试返回列表页失败，刷新页面");
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3000);
        }
        continue;
      }
    }

    minimalLog(
      `\n🎉 商品详情抓取完成，成功获取 ${detailedProducts.length} 个商品的详细信息`,
    );
    return detailedProducts;
  } catch (error) {
    normalLog("💥 商品详情抓取主流程失败:");
    return products; // 返回原始数据
  }
}

// 其他辅助函数（与测试脚本完全一致）

/**
 * 模拟点击商品链接进入详情页
 */
async function simulateProductClick(
  page: any,
  productElement: any,
): Promise<boolean> {
  try {
    verboseLog("🖱️  准备点击商品进入详情页...");

    // 滚动到商品位置
    await productElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // 找到商品链接
    const productLink = productElement.locator(SELECTORS.PLP_PRODUCT_LINK);

    if (!(await productLink.isVisible())) {
      normalLog("❌ 商品链接不可见");
      return false;
    }

    // 获取链接位置
    const box = await productLink.boundingBox();
    if (!box) {
      normalLog("❌ 无法获取商品链接位置");
      return false;
    }

    verboseLog(`📍 商品链接位置: x=${box.x}, y=${box.y}`);

    // 模拟真实用户鼠标操作
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 8,
    });
    await page.waitForTimeout(500 + Math.random() * 500);

    // 悬停
    await productLink.hover();
    verboseLog("🖱️  鼠标悬停在商品上");
    await page.waitForTimeout(300 + Math.random() * 300);

    // 点击商品链接
    verboseLog("🖱️  点击商品链接...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
      productLink.click(),
    ]);

    verboseLog("✅ 成功进入商品详情页");

    return true;
  } catch (error) {
    normalLog("💥 点击商品失败:");
    return false;
  }
}

/**
 * 返回商品列表页
 */
async function navigateBackToList(page: any): Promise<boolean> {
  try {
    verboseLog("🔙 返回商品列表页...");

    // 使用浏览器后退按钮
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });

    // 🚀 优化：减少返回页面等待时间
    await page.waitForTimeout(1000);

    verboseLog("✅ 成功返回商品列表页");

    return true;
  } catch (error) {
    normalLog("💥 返回列表页失败:");
    return false;
  }
}

/**
 * 优化的详情页浏览行为
 */
async function simulateDetailPageBrowsing(page: any): Promise<void> {
  try {
    verboseLog("👀 快速浏览详情页...");

    // 大幅减少浏览时间：500-1500ms
    const browsingTime = 500 + Math.random() * 1000;
    await page.waitForTimeout(browsingTime);

    // 减少滚动次数和等待时间
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * 0.5,
        behavior: "smooth",
      });
    });
    await page.waitForTimeout(300);

    // 简化鼠标移动
    const viewport = (await page.viewportSize()) || {
      width: 1920,
      height: 1080,
    };
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 1 },
    );
  } catch (error) {
    verboseLog("⚠️ 详情页浏览模拟失败:");
  }
}

/**
 * 提取商品详情页数据
 */
async function extractPdpData(page: any): Promise<Record<string, unknown>> {
  try {
    verboseLog("📦 开始提取商品详情页数据...");

    // 改进的等待策略
    verboseLog("⏰ 等待页面完全加载...");
    try {
      // 首先等待DOM加载
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
      verboseLog("✅ DOM加载完成");

      // 等待一些关键元素出现
      const keySelectors = [
        ".product__area__branding__designer__link",
        ".product__area__branding__name",
        "div.productinfo__price",
        ".product__area",
        "h1",
        "h2",
      ];

      let foundKeyElement = false;
      for (const selector of keySelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          verboseLog(`✅ 找到关键元素: ${selector}`);
          foundKeyElement = true;
          break;
        } catch (error) {
          verboseLog(`⏰ 等待元素超时: ${selector}`);
        }
      }

      if (!foundKeyElement) {
        verboseLog("⚠️ 未找到任何关键元素，继续尝试数据提取");
      }

      // 减少页面稳定等待时间
      await page.waitForTimeout(1500);
    } catch (error) {
      verboseLog("⚠️ 页面加载等待超时，尝试继续:");
    }

    const productDetails: Record<string, unknown> = {};

    // 快速提取品牌
    verboseLog("🏷️  快速提取品牌信息...");
    const brandSelectors = [
      SELECTORS.PDP_BRAND,
      "h1",
      "h2",
      ".product__branding__designer",
      ".designer",
      '[class*="brand"]',
      '[class*="designer"]',
    ];

    for (const selector of brandSelectors) {
      try {
        const brand = await page
          .locator(selector)
          .first()
          .textContent({ timeout: 1000 });
        if (brand && brand.trim().length > 0) {
          productDetails.brand = brand.trim();
          verboseLog(`✅ 品牌提取成功 (${selector}): ${productDetails.brand}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!productDetails.brand) {
      verboseLog("❌ 所有品牌选择器都失败");
    }

    // 快速提取商品名称
    verboseLog("📝 快速提取商品名称...");
    const nameSelectors = [
      SELECTORS.PDP_NAME,
      "h1",
      "h2",
      ".product__name",
      ".product-name",
      '[class*="product"][class*="name"]',
      '[class*="title"]',
    ];

    for (const selector of nameSelectors) {
      try {
        const name = await page
          .locator(selector)
          .first()
          .textContent({ timeout: 1000 });
        if (
          name &&
          name.trim().length > 0 &&
          name.trim() !== productDetails.brand
        ) {
          productDetails.name = name.trim();
          verboseLog(
            `✅ 商品名称提取成功 (${selector}): ${productDetails.name}`,
          );
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // 快速提取价格信息
    verboseLog("💰 快速提取价格信息...");
    const priceContainerSelectors = [
      SELECTORS.PDP_PRICE_CONTAINER,
      ".price",
      '[class*="price"]',
      '[class*="pricing"]',
    ];

    for (const containerSelector of priceContainerSelectors) {
      try {
        const priceContainer = page.locator(containerSelector).first();

        if (
          await priceContainer.isVisible({ timeout: 800 }).catch(() => false)
        ) {
          try {
            const containerText = await priceContainer.textContent({
              timeout: 500,
            });
            if (containerText && containerText.trim()) {
              // 使用正则表达式快速提取价格
              const priceMatches = containerText.match(
                /\$[\d,.]+|\$\s*[\d,.]+|USD\s*[\d,.]+|[\d,.]+\s*USD|€[\d,.]+|€\s*[\d,.]+|EUR\s*[\d,.]+|[\d,.]+\s*EUR/gi,
              );
              if (priceMatches && priceMatches.length > 0) {
                // 价格解析函数
                const parsePrice = (priceText: string) => {
                  const match = priceText
                    .trim()
                    .match(/([A-Z]{3})?\s*([€$¥£])?([0-9,.]+)/i);
                  if (match) {
                    const amount = parseFloat(match[3].replace(/,/g, ""));
                    const currency =
                      match[1] ||
                      (match[2] === "€"
                        ? "EUR"
                        : match[2] === "$"
                          ? "USD"
                          : "USD");
                    return { amount, currency };
                  }
                  return undefined;
                };

                if (priceMatches.length === 1) {
                  productDetails.currentPrice = parsePrice(priceMatches[0]);
                } else {
                  productDetails.currentPrice = parsePrice(priceMatches[0]);
                  productDetails.originalPrice = parsePrice(priceMatches[1]);
                }
                verboseLog(
                  `✅ 快速提取价格: ${JSON.stringify(productDetails.currentPrice)}`,
                );
                break;
              }
            }
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // 快速提取其他关键信息
    verboseLog("📝 快速提取其他信息...");

    // 并行提取描述和图片以节省时间
    const [description, mainImage] = await Promise.allSettled([
      // 快速提取描述
      (async () => {
        const descSelectors = [
          SELECTORS.PDP_DETAILS_ACCORDION_CONTENT + " p",
          ".product-description",
          "p",
        ];
        for (const selector of descSelectors) {
          try {
            const desc = await page
              .locator(selector)
              .first()
              .textContent({ timeout: 500 });
            if (desc && desc.trim().length > 10) {
              return desc.trim().substring(0, 150);
            }
          } catch (error) {
            continue;
          }
        }
        return null;
      })(),

      // 快速提取主图片
      (async () => {
        const imgSelectors = [
          SELECTORS.PDP_IMAGES,
          ".product-image img",
          "img",
        ];
        for (const selector of imgSelectors) {
          try {
            const img = await page
              .locator(selector)
              .first()
              .getAttribute("src", { timeout: 500 });
            if (img) return img.trim();
          } catch (error) {
            continue;
          }
        }
        return null;
      })(),
    ]);

    if (description.status === "fulfilled" && description.value) {
      productDetails.description = description.value;
      verboseLog(`✅ 描述: ${description.value.substring(0, 30)}...`);
    }

    if (mainImage.status === "fulfilled" && mainImage.value) {
      productDetails.detailImages = [mainImage.value];
      verboseLog(`✅ 主图片提取成功`);
    }

    // 提取SKU
    try {
      const url = page.url();
      const urlPath = new URL(url).pathname;
      const pathSegments = urlPath.split("-");
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const skuMatch = lastSegment.match(/^(p\d+)$/i);
        if (skuMatch && skuMatch[1]) {
          productDetails.sku = skuMatch[1].toLowerCase();
        }
      }
    } catch (error) {
      verboseLog("⚠️ SKU提取失败");
    }

    productDetails.detailPageUrl = page.url();
    productDetails.scrapedAt = new Date().toISOString();

    verboseLog(
      `✅ 详情页数据提取完成: ${productDetails.brand} - ${productDetails.name}`,
    );

    return productDetails;
  } catch (error) {
    normalLog("💥 详情页数据提取失败:");
    return {};
  }
}

/**
 * 提取单个产品的信息 - 性能优化版本
 * @param item - 商品元素
 * @param page - 页面对象
 * @param itemIndex - 商品在页面中的索引（用于查找页面指示器）
 */
async function extractSingleProduct(
  item: any,
  page: any,
  itemIndex?: number,
): Promise<Record<string, unknown> | null> {
  try {
    // 🚀 并行化所有DOM查询以提升性能
    const [
      linkResult,
      brandResult,
      nameResult,
      imageResult,
      currentPriceResult,
      originalPriceResult,
      discountPriceResult,
      colorInfoResult,
      availabilityResult,
      sizesResult,
      tagsResult,
    ] = await Promise.allSettled([
      // 基础信息
      item
        .locator(SELECTORS.PLP_PRODUCT_LINK)
        .getAttribute("href", { timeout: 300 }),
      item.locator(SELECTORS.PLP_BRAND).textContent({ timeout: 300 }),
      item.locator(SELECTORS.PLP_NAME).textContent({ timeout: 300 }),
      item
        .locator(SELECTORS.PLP_IMAGE)
        .first()
        .getAttribute("src", { timeout: 300 }),

      // 价格信息
      item.locator(SELECTORS.PLP_PRICE).first().textContent({ timeout: 300 }),
      item
        .locator(SELECTORS.PLP_ORIGINAL_PRICE)
        .first()
        .textContent({ timeout: 300 }),
      item
        .locator(SELECTORS.PLP_DISCOUNT_PRICE)
        .first()
        .textContent({ timeout: 300 }),

      // 其他属性
      item
        .locator(SELECTORS.PLP_COLOR_INFO)
        .first()
        .textContent({ timeout: 300 }),
      item
        .locator(SELECTORS.PLP_AVAILABILITY)
        .first()
        .textContent({ timeout: 300 }),

      // 数组数据 - 简化处理
      item.locator(SELECTORS.PLP_SIZES).allTextContents({ timeout: 500 }),
      item.locator(SELECTORS.PLP_TAG).allTextContents({ timeout: 500 }),
    ]);

    // 🚀 快速提取结果
    const link = linkResult.status === "fulfilled" ? linkResult.value : null;
    const fullUrl = link ? new URL(link, page.url()).toString() : "";

    const brand =
      brandResult.status === "fulfilled" ? brandResult.value?.trim() || "" : "";
    const name =
      nameResult.status === "fulfilled" ? nameResult.value?.trim() || "" : "";
    const image =
      imageResult.status === "fulfilled" ? imageResult.value?.trim() || "" : "";

    const currentPrice =
      currentPriceResult.status === "fulfilled"
        ? currentPriceResult.value?.trim() || ""
        : "";
    const originalPrice =
      originalPriceResult.status === "fulfilled"
        ? originalPriceResult.value?.trim() || ""
        : "";
    const discountPrice =
      discountPriceResult.status === "fulfilled"
        ? discountPriceResult.value?.trim() || ""
        : "";

    const colorInfo =
      colorInfoResult.status === "fulfilled"
        ? colorInfoResult.value?.trim() || ""
        : "";
    const availability =
      availabilityResult.status === "fulfilled"
        ? availabilityResult.value?.trim() || ""
        : "";

    // 🚀 快速处理尺寸数据
    const rawSizes =
      sizesResult.status === "fulfilled" ? sizesResult.value || [] : [];
    const sizes = rawSizes
      .filter(
        (size: string) =>
          size && size.trim() && size.toLowerCase() !== "available sizes:",
      )
      .map((size: string) => size.trim());

    // 🚀 快速处理标签数据
    const rawTags =
      tagsResult.status === "fulfilled" ? tagsResult.value || [] : [];
    const tags = rawTags
      .filter((tag: string) => tag && tag.trim())
      .map((tag: string) => tag.trim());

    // 🚀 优化的价格解析函数
    const parsePrice = (priceText: string) => {
      if (!priceText) return undefined;
      const match = priceText.match(/([€$¥£])?([0-9,.]+)/);
      if (match) {
        const amount = parseFloat(match[2].replace(/,/g, ""));
        const currency = match[1] === "€" ? "EUR" : "USD";
        return { amount, currency };
      }
      return undefined;
    };

    // 查找商品所属的页面（通过页面指示器）
    let pageNumber = 1; // 默认第一页
    if (itemIndex !== undefined && itemIndex >= 0) {
      try {
        // 获取所有页面指示器
        const pageIndicators = await page
          .locator("div.list__page__indicator[data-page]")
          .all();

        // 找到小于当前商品索引的最大页面指示器
        let maxPageBelowIndex = 0;
        let maxPageNumber = 1;

        for (const indicator of pageIndicators) {
          const indicatorBox = await indicator.boundingBox();
          const itemBox = await item.boundingBox();

          if (indicatorBox && itemBox && indicatorBox.y < itemBox.y) {
            const dataPage = await indicator.getAttribute("data-page");
            const pageNum = parseInt(dataPage || "1", 10);

            if (indicatorBox.y > maxPageBelowIndex) {
              maxPageBelowIndex = indicatorBox.y;
              maxPageNumber = pageNum;
            }
          }
        }

        pageNumber = maxPageNumber;
        verboseLog(`📄 商品 ${itemIndex + 1} 属于第 ${pageNumber} 页`);
      } catch (error) {
        verboseLog(
          `⚠️ 无法确定商品页面，使用默认值: ${(error as Error).message}`,
        );
      }
    }

    return {
      brand,
      name,
      title: name, // 兼容字段
      url: fullUrl,
      link: fullUrl, // 向后兼容
      image,
      images: image ? [image] : [], // 简化图片处理，只保留主图
      sizes,
      tags,
      source: "Mytheresa",
      color: colorInfo || undefined,
      currentPrice: parsePrice(currentPrice),
      originalPrice: parsePrice(originalPrice),
      discountPrice: parsePrice(discountPrice),
      availability: availability || undefined,
      // 添加页面标识到 metadata
      metadata: {
        pageIndicator: pageNumber,
        extractedAt: new Date().toISOString(),
        itemIndex: itemIndex,
      },
    };
  } catch (error) {
    throw error;
  }
}
