// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, log as crawleeLog } from "crawlee";
import type { Product } from "@repo/types";
export type { Product }; // 添加这行以重新导出

// 新增：统一的爬虫配置选项接口
export interface ScraperOptions {
  maxRequests?: number;
  maxLoadClicks?: number;
  maxProducts?: number;
  storageDir?: string; // 添加：存储目录参数
  headless?: boolean; // 添加：控制是否使用无头浏览器模式，默认为true
  maxConcurrency?: number; // 新增：控制最大并发数
}

// 新增：统一的爬虫函数类型
export type ScraperFunction = (
  startUrls: string | string[],
  options?: ScraperOptions,
  executionId?: string, // 新增
) => Promise<Product[] | void>; // 修改返回类型

// Export site-specific scrapers
export * from "./sites/cettire.js";
export * from "./sites/farfetch.js";
export * from "./sites/italist.js";
export * from "./sites/mytheresa.js";
export * from "./sites/yoox.js";

// 明确导出默认导出
import mytheresaScraperDefault from "./sites/mytheresa.js";
import italistScraperDefault from "./sites/italist.js";
import yooxScraperDefault from "./sites/yoox.js";
import farfetchScraperDefault from "./sites/farfetch.js";
import cettireScraperDefault from "./sites/cettire.js";

// 重命名导出以匹配 API 路由中的期望名称
export const mytheresaScraper = mytheresaScraperDefault;
export const italistScraper = italistScraperDefault;
export const yooxScraper = yooxScraperDefault;
export const farfetchScraper = farfetchScraperDefault;
export const cettireScraper = cettireScraperDefault;

// Import the specific scraper to test and crawlee's log
// import scrapeMytheresa from './sites/mytheresa.js'; // 被上面的 mytheresaScraperDefault 替代
// Note: 'log' is typically imported from 'crawlee'. If you have a global 'log' or want to avoid conflicts, ensure clarity.
// For this test, we'll use crawleeLog directly or rename it as above.

crawleeLog.setLevel(crawleeLog.LEVELS.DEBUG); // Set log level to DEBUG

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const createCrawler = () =>
  new PlaywrightCrawler({
    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({
      request,
      page,
      enqueueLinks,
      log: localCrawlerLog,
      pushData,
    }) {
      const title = await page.title();
      localCrawlerLog.info(`Title of ${request.loadedUrl} is '${title}'`);

      // Save results as JSON to ./storage/datasets/default
      await pushData({ title, url: request.loadedUrl });

      // Extract links from the current page
      // and add them to the crawling queue.
      await enqueueLinks();
    },
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 10, // 减少测试时的请求数量
    // Uncomment this option to see the browser window.
    // launchContext: {
    //     launchOptions: {
    //         headless: false,
    //     },
    // },
  });

// Export a function to be called from admin API
export async function runMyCrawler(startUrls: string | string[]) {
  crawleeLog.info("Starting crawler...");
  const crawler = createCrawler();
  await crawler.run(Array.isArray(startUrls) ? startUrls : [startUrls]);
  crawleeLog.info("Crawler finished.");
}

// 示例：如果想直接运行此文件进行测试 (可选)
// async function main() {
//   console.log("Node.js process.env.NODE_ENV:", process.env.NODE_ENV);
//   crawleeLog.info("Inside main() function - STARTING");

//   if (process.env.NODE_ENV !== "test") {
//     crawleeLog.info(
//       'NODE_ENV is not "test", proceeding with scrapeMytheresa...',
//     );
//     try {
//       crawleeLog.info("Calling mytheresaScraper..."); // 更新调用
//       await mytheresaScraperDefault(); // 使用默认导入的 mytheresa 进行测试
//       crawleeLog.info("mytheresaScraper finished.");
//     } catch (error) {
//       if (error instanceof Error) {
//         crawleeLog.error(
//           `Error during scrapeMytheresa call in main: ${error.message}`,
//           { stack: error.stack },
//         );
//       } else {
//         crawleeLog.error(
//           "An unknown error occurred during scrapeMytheresa call in main",
//           { errorDetail: String(error) },
//         );
//       }
//     }
//   } else {
//     crawleeLog.info('NODE_ENV is "test", skipping scrapeMytheresa in main.');
//   }
//   crawleeLog.info("Inside main() function - FINISHING");
// }

console.log("Script main.ts is being executed.");
// main()
//   .then(() => {
//     crawleeLog.info("main() promise resolved.");
//   })
//   .catch((err) => {
//     if (err instanceof Error) {
//       crawleeLog.error(
//         `Main execution error in main.ts (Promise rejection): ${err.message}`,
//         { stack: err.stack },
//       );
//     } else {
//       crawleeLog.error(
//         "An unknown error occurred in main.ts (Promise rejection)",
//         { errorDetail: String(err) },
//       );
//     }
//   });
