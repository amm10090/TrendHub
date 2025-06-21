import { type PlaywrightCrawlingContext } from "crawlee";
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
    const { request, page, log: localCrawlerLog, crawler } = context;
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
        const newRequests = (urlsToScrape || []).map((url) => {
          const newLabel = url.includes("new-arrivals") ? "LIST" : "DETAIL";
          return {
            url,
            label: newLabel,
            userData: {
              ...request.userData,
              label: newLabel,
              originUrl: url,
              batchGender: inferGenderFromMytheresaUrl(url),
            },
          };
        });
        if (newRequests.length > 0) {
          await crawler.addRequests(newRequests);
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
