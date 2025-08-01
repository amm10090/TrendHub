import { type PlaywrightCrawlingContext, Request } from "crawlee";
import { type Product } from "@repo/types";
import { sendLogToBackend, LocalScraperLogLevel } from "../../utils.js";
import { getRandomDelay } from "../../crawler-setup.js";
import { handlePdp } from "./pdp-handler.js";
import { handlePlp } from "./plp-handler.js";
import { MytheresaUserData } from "./types.js";
import { inferGenderFromMytheresaUrl } from "./index.js";
import { EnhancedAntiDetection } from "../../anti-detection-enhanced.js";

type HandlerOptions = {
  allScrapedProducts: Product[];
  urlProductCounts: Map<
    string,
    { processedDetailPages: number; enqueuedDetailPages: number }
  >;
  maxProductsPerUrl: number;
  totalMaxProducts: number;
  updateProcessedCounters: (isDetail: boolean) => void;
  updateEnqueuedCounters: (count: number) => void;
};

/**
 * 模拟真实用户导航行为 - 从测试文件移植
 */
async function simulateNavigationClick(
  page: import("playwright").Page,
  targetUrl: string,
  log: import("crawlee").Log,
): Promise<boolean> {
  try {
    log.info(`🖱️  模拟用户导航到 ${targetUrl}...`);

    // 模拟真实用户浏览行为 - 基于成功测试文件
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
      log.info("🎯 寻找New Arrivals链接（基于成功测试逻辑）...");

      // 等待导航栏加载完成
      await page.waitForSelector(".headerdesktop__section__wrapper__nav", {
        timeout: 10000,
      });
      log.info("✅ 导航栏已加载");

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
          log.info(`🔍 尝试选择器: ${selector}`);
          newArrivalsLink = page.locator(selector).first();
          if (await newArrivalsLink.isVisible({ timeout: 3000 })) {
            log.info(`📍 找到New Arrivals链接: ${selector}`);
            usedSelector = selector;
            break;
          }
        } catch {
          log.debug(`❌ 选择器失败: ${selector}`);
          continue;
        }
      }

      if (newArrivalsLink && (await newArrivalsLink.isVisible())) {
        log.info(`🎯 准备点击New Arrivals链接 (使用选择器: ${usedSelector})`);

        // 先滚动到导航区域确保可见
        await page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        await page.waitForTimeout(1000);

        // 完全模拟成功测试的鼠标行为
        const box = await newArrivalsLink.boundingBox();
        if (box) {
          log.info(
            `📍 链接位置: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`,
          );

          // 慢慢移动鼠标到链接位置
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
            steps: 10,
          });
          await page.waitForTimeout(1000 + Math.random() * 1000);

          // 悬停一下
          await newArrivalsLink.hover();
          log.info("🖱️  鼠标悬停在New Arrivals上");
          await page.waitForTimeout(500 + Math.random() * 500);

          // 点击并等待导航
          log.info("🖱️  执行点击...");
          await Promise.all([
            page
              .waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 15000,
              })
              .catch(() => {
                log.info("⚠️ 导航等待超时，但可能已经成功跳转");
              }),
            newArrivalsLink.click(),
          ]);

          log.info("✅ 成功点击 New Arrivals 导航");
          return true;
        } else {
          log.error("无法获取New Arrivals链接位置");
        }
      } else {
        log.error("未找到New Arrivals链接");
      }
    } else if (targetUrl.includes("designers")) {
      log.info("🎯 寻找Designers直接链接...");
      const designersLink = page
        .locator('a[data-tracking-label*="designers"][href*="designers"]')
        .first();
      if (await designersLink.isVisible({ timeout: 3000 })) {
        await designersLink.click();
        log.info("✅ 成功点击Designers链接");
        return true;
      }
    } else if (targetUrl.includes("clothing")) {
      log.info("🎯 寻找Clothing直接链接...");
      const clothingLink = page
        .locator('a[data-tracking-label*="clothing"][href*="clothing"]')
        .first();
      if (await clothingLink.isVisible({ timeout: 3000 })) {
        await clothingLink.click();
        log.info("✅ 成功点击Clothing链接");
        return true;
      }
    } else if (targetUrl.includes("sale")) {
      log.info("🎯 寻找Sale直接链接...");
      const saleLink = page
        .locator('a[data-tracking-label*="sale"][href*="sale"]')
        .first();
      if (await saleLink.isVisible({ timeout: 3000 })) {
        await saleLink.click();
        log.info("✅ 成功点击Sale链接");
        return true;
      }
    }

    return false;
  } catch (error) {
    log.error(`💥 模拟导航失败: ${(error as Error).message}`);
    return false;
  }
}

export function requestHandler(options: HandlerOptions) {
  // 使用完整的增强反检测系统
  const antiDetection = new EnhancedAntiDetection({
    enableAdvancedFingerprinting: true,
    enableRequestHeaderRotation: true,
    enableBehavioralPatterns: true,
    enableSessionPersistence: true,
    timingVariationFactor: 0.4,
  });

  return async (context: PlaywrightCrawlingContext<MytheresaUserData>) => {
    const { request, page, log: localCrawlerLog } = context;
    const { executionId, label, originUrl, urlsToScrape } = request.userData;

    // 初始化完整的增强反检测系统
    await antiDetection.initializePage(page, localCrawlerLog);

    await page.waitForTimeout(getRandomDelay(2000, 4000)); // 减少初始等待时间
    localCrawlerLog.info(
      `🛡️ Waited before processing ${request.url} with complete anti-detection`,
    );
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Processing URL with complete anti-detection: ${request.url}`,
        { label },
      );
    }

    try {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(getRandomDelay(2000, 4000));

      // 增强的反机器人检测和处理
      if (await antiDetection.detectAntiBot(page, localCrawlerLog)) {
        const success = await antiDetection.handleAntiBot(
          page,
          localCrawlerLog,
        );
        if (!success) {
          throw new Error("Unable to bypass anti-bot protection");
        }
      }

      // 使用增强的行为模拟
      await antiDetection.simulateAdvancedHumanBehavior(page, localCrawlerLog);

      if (label === "HOMEPAGE") {
        localCrawlerLog.info(
          `🛡️ Mytheresa: Warming up session on homepage with complete stealth: ${request.url}`,
        );

        const currentPageContent = await page.content();
        if (currentPageContent.includes("SOMETHING WENT WRONG")) {
          localCrawlerLog.warning(
            `Mytheresa: Detected error page on ${request.url}. Falling back to global homepage.`,
          );
          await page.goto("https://www.mytheresa.com/", {
            waitUntil: "networkidle",
          });
          localCrawlerLog.info("Navigated to global homepage.");
        }

        // 确保页面完全加载 - 优化等待时间
        await page.waitForLoadState("domcontentloaded"); // 改为更快的domcontentloaded
        await page.waitForTimeout(getRandomDelay(2000, 3000)); // 减少等待时间

        // 检查并关闭可能的弹窗（如 cookie 通知、订阅弹窗等）
        try {
          const cookieAcceptButton = page
            .locator('button:has-text("Accept")')
            .first();
          if (await cookieAcceptButton.isVisible({ timeout: 3000 })) {
            await cookieAcceptButton.click();
            localCrawlerLog.info("Clicked cookie accept button");
          }
        } catch {
          // 忽略错误
        }

        // 通过模拟点击导航菜单进入目标页面
        for (const targetUrl of urlsToScrape || []) {
          try {
            localCrawlerLog.info(
              `🖱️  Navigating to ${targetUrl} via simulated menu interaction`,
            );

            // 使用模拟点击导航
            const navigationSuccess = await simulateNavigationClick(
              page,
              targetUrl,
              localCrawlerLog,
            );

            if (!navigationSuccess) {
              localCrawlerLog.warning(
                `模拟导航失败，尝试直接导航到 ${targetUrl}`,
              );
              // 回退到直接导航
              await page.goto(targetUrl, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
              });
            }

            // 等待页面加载 - 优化等待时间
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(getRandomDelay(2000, 3000));

            // 获取当前URL
            const currentUrl = page.url();
            localCrawlerLog.info(
              `🎯 Current URL after navigation: ${currentUrl}`,
            );

            // 将当前页面作为 LIST 页面处理
            const newRequest = new Request<MytheresaUserData>({
              url: currentUrl,
              label: "LIST",
              userData: {
                ...request.userData,
                label: "LIST",
                originUrl: targetUrl,
                batchGender: inferGenderFromMytheresaUrl(targetUrl),
              },
            });

            // 直接处理当前页面，而不是添加到队列
            await handlePlp(
              {
                ...context,
                request: newRequest,
              },
              { count: 0 },
            );
          } catch (navError) {
            localCrawlerLog.error(
              `Failed to navigate to ${targetUrl} via menu: ${(navError as Error).message}`,
            );
            if (executionId) {
              await sendLogToBackend(
                executionId,
                LocalScraperLogLevel.ERROR,
                `Navigation failed for ${targetUrl}`,
                { error: (navError as Error).message },
              );
            }
          }
        }
      } else if (label === "DETAIL") {
        options.updateProcessedCounters(true);
        const urlCounters = options.urlProductCounts.get(
          originUrl || request.url,
        );
        if (urlCounters) urlCounters.processedDetailPages++;

        await handlePdp(context, options.allScrapedProducts);

        if (
          urlCounters &&
          urlCounters.processedDetailPages >= options.maxProductsPerUrl
        ) {
          localCrawlerLog.info(
            `Reached max products limit for URL: ${originUrl}`,
          );
        }
      } else {
        // LIST page
        const enqueuedCounters = { count: 0 };
        const urlCounters = options.urlProductCounts.get(
          originUrl || request.url,
        );
        if (urlCounters)
          enqueuedCounters.count = urlCounters.enqueuedDetailPages;

        await handlePlp(context, enqueuedCounters);

        if (urlCounters) {
          urlCounters.enqueuedDetailPages = enqueuedCounters.count;
          options.updateEnqueuedCounters(
            Array.from(options.urlProductCounts.values()).reduce(
              (sum, counts) => sum + counts.enqueuedDetailPages,
              0,
            ),
          );
          if (urlCounters.enqueuedDetailPages >= options.maxProductsPerUrl) {
            localCrawlerLog.info(
              `Reached max products enqueue limit for URL: ${originUrl}, not loading more.`,
            );
          }
        }
      }

      // 保存会话以在请求间持久化
      await antiDetection.saveSession(page, localCrawlerLog);
    } catch (e: unknown) {
      const error = e as Error;
      localCrawlerLog.error(
        `🛡️ Mytheresa: Request handler error for ${request.url}: ${error.message}`,
        { stack: error.stack },
      );
      if (executionId) {
        await sendLogToBackend(
          executionId,
          LocalScraperLogLevel.ERROR,
          `Request handler error: ${error.message}`,
          { url: request.url, stack: error.stack },
        );
      }
      throw e;
    }
  };
}
