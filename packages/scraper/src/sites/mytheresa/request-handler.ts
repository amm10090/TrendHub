import { type PlaywrightCrawlingContext, Request } from "crawlee";
import { type Product } from "@repo/types";
import { sendLogToBackend, LocalScraperLogLevel } from "../../utils.js";
import { simulateHumanBehavior, getRandomDelay } from "../../crawler-setup.js";
import { handlePdp } from "./pdp-handler.js";
import { handlePlp } from "./plp-handler.js";
import { MytheresaUserData } from "./types.js";
import { inferGenderFromMytheresaUrl } from "./index.js";

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

export function requestHandler(options: HandlerOptions) {
  return async (context: PlaywrightCrawlingContext<MytheresaUserData>) => {
    const { request, page, log: localCrawlerLog } = context;
    const { executionId, label, originUrl, urlsToScrape } = request.userData;

    await page.waitForTimeout(getRandomDelay(5000, 12000));
    localCrawlerLog.info(`Waited before processing ${request.url}`);
    if (executionId) {
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.INFO,
        `Processing URL: ${request.url}`,
        { label },
      );
    }

    try {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(getRandomDelay(2000, 4000));

      const pageContent = await page.content();
      if (
        pageContent.includes("Access to this page has been denied") ||
        pageContent.includes("blocked") ||
        pageContent.includes("captcha")
      ) {
        localCrawlerLog.error(`Mytheresa: Access denied on ${request.url}.`);
        await page.waitForTimeout(getRandomDelay(5000, 10000));
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(getRandomDelay(3000, 6000));
        if (
          (await page.content()).includes("Access to this page has been denied")
        ) {
          throw new Error("Access denied after reload attempt");
        }
      }

      await simulateHumanBehavior(page, localCrawlerLog);

      if (label === "HOMEPAGE") {
        localCrawlerLog.info(
          `Mytheresa: Warming up session on homepage: ${request.url}`,
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

        // 确保页面完全加载
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(getRandomDelay(3000, 5000));

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

        // 通过导航菜单进入目标页面
        for (const targetUrl of urlsToScrape || []) {
          try {
            localCrawlerLog.info(`Navigating to ${targetUrl} via menu`);

            // 判断目标页面类型
            if (targetUrl.includes("/women/")) {
              // 悬停在 Women 菜单上
              await page.hover('nav a[href*="/women"]:has-text("Women")', {
                timeout: 5000,
              });
              await page.waitForTimeout(getRandomDelay(1000, 2000));

              if (targetUrl.includes("new-arrivals")) {
                // 点击 New Arrivals
                await page.click(
                  'a[href*="/women/new-arrivals"]:has-text("New Arrivals")',
                  { timeout: 5000 },
                );
                localCrawlerLog.info("Clicked on Women > New Arrivals");
              } else {
                // 尝试直接点击链接
                await page.click(`a[href*="${targetUrl}"]`, { timeout: 5000 });
              }
            } else if (targetUrl.includes("/men/")) {
              // 悬停在 Men 菜单上
              await page.hover('nav a[href*="/men"]:has-text("Men")', {
                timeout: 5000,
              });
              await page.waitForTimeout(getRandomDelay(1000, 2000));

              if (targetUrl.includes("new-arrivals")) {
                await page.click(
                  'a[href*="/men/new-arrivals"]:has-text("New Arrivals")',
                  { timeout: 5000 },
                );
                localCrawlerLog.info("Clicked on Men > New Arrivals");
              }
            }

            // 等待页面加载
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(getRandomDelay(3000, 5000));

            // 获取当前URL
            const currentUrl = page.url();
            localCrawlerLog.info(`Current URL after navigation: ${currentUrl}`);

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
    } catch (e: unknown) {
      const error = e as Error;
      localCrawlerLog.error(
        `Mytheresa: Request handler error for ${request.url}: ${error.message}`,
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
