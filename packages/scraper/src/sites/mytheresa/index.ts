// packages/scraper/src/sites/mytheresa/index.ts
import { Configuration, log as crawleeLog } from "crawlee";
import type { Product } from "@repo/types";
import * as path from "path";
import type { ScraperOptions } from "../../main.js";
import {
  sendLogToBackend,
  LocalScraperLogLevel,
  ensureDirectoryExists,
} from "../../utils.js";
import { createStealthCrawler, USER_AGENTS } from "../../crawler-setup.js";
import { requestHandler } from "./request-handler.js";
import type { MytheresaUserData } from "./types.js";

// Helper function to infer gender from URL, specific to Mytheresa's URL structure
export function inferGenderFromMytheresaUrl(
  url: string,
): "women" | "men" | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/women/")) return "women";
  if (urlLower.includes("/men/")) return "men";
  return null;
}

export default async function scrapeMytheresa(
  startUrls: string | string[] = [
    "https://www.mytheresa.com/us/en/women/new-arrivals/current-week",
  ],
  options: ScraperOptions = {},
  executionId?: string,
): Promise<Product[]> {
  const siteName = "Mytheresa";
  const homePageUrl = "https://www.mytheresa.com/";

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `${siteName} scraper starting with warm-up phase.`,
      {
        startUrls: Array.isArray(startUrls) ? startUrls : [startUrls],
        options,
        userAgentPool: USER_AGENTS.length,
      },
    );
  }

  const allScrapedProducts: Product[] = [];
  const maxRequests = options.maxRequests || 90;

  const startUrlsArray = Array.isArray(startUrls) ? startUrls : [startUrls];
  const totalMaxProducts = options.maxProducts || 1000;
  const maxProductsPerUrl = Math.ceil(totalMaxProducts / startUrlsArray.length);

  const urlProductCounts = new Map<
    string,
    { processedDetailPages: number; enqueuedDetailPages: number }
  >();

  startUrlsArray.forEach((url) => {
    urlProductCounts.set(url, {
      processedDetailPages: 0,
      enqueuedDetailPages: 0,
    });
  });

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

  const crawler = createStealthCrawler(
    {
      requestHandler: requestHandler({
        allScrapedProducts,
        urlProductCounts,
        maxProductsPerUrl,
        totalMaxProducts,
        updateProcessedCounters: (isDetail) => {
          if (isDetail) processedDetailPages++;
        },
        updateEnqueuedCounters: (count) => {
          enqueuedDetailPages = count;
        },
      }),
      failedRequestHandler: async ({ request, log: localLog }) => {
        localLog.error(`Mytheresa: Request ${request.url} failed!`);
        const currentExecutionId = (request.userData as MytheresaUserData)
          ?.executionId;
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
          headless: options.headless !== false,
        },
      },
      maxRequestsPerCrawl: maxRequests,
      maxConcurrency: options.maxConcurrency || 1,
      minConcurrency: 1,
      autoscaledPoolOptions: {
        desiredConcurrency: 1,
        maxConcurrency: 1,
      },
    },
    config,
  );

  crawleeLog.info(
    "Mytheresa: Enhanced anti-detection crawler setup complete. Starting crawl...",
  );
  const urlsToScrape = Array.isArray(startUrls) ? startUrls : [startUrls];

  await crawler.run([
    {
      url: homePageUrl,
      label: "HOMEPAGE",
      userData: {
        executionId,
        label: "HOMEPAGE",
        urlsToScrape,
      },
    },
  ]);

  if (executionId) {
    await sendLogToBackend(
      executionId,
      LocalScraperLogLevel.INFO,
      `Mytheresa scraper finished. Total products collected: ${allScrapedProducts.length}.`,
      {
        processedDetailPages,
        enqueuedDetailPages,
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
    `Mytheresa scraper finished. Total products collected: ${allScrapedProducts.length}. Per-URL breakdown:`,
  );

  Array.from(urlProductCounts.entries()).forEach(([url, counts]) => {
    crawleeLog.info(
      `  ${url}: 处理了 ${counts.processedDetailPages}/${maxProductsPerUrl} 个商品 (入队: ${counts.enqueuedDetailPages})`,
    );
  });

  return allScrapedProducts;
}
