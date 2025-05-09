// Mytheresa scraper placeholder
// export async function scrapeMytheresa(url: string) {
//     console.log(`Scraping Mytheresa: ${url}`);
//     // TODO: Implement Mytheresa specific scraping logic using Crawlee
// }

import { PlaywrightCrawler, log, type Request, type Log } from "crawlee";
import type { Page, Locator } from "playwright";
import type { Product, ECommerceSite } from "@repo/types";
import * as path from "path";
import * as fs from "fs";

// 定义产品数据的接口 (临时，后续会移到 packages/types)

// Mytheresa scraper
export default async function scrapeMytheresa(
  startUrls: string | string[] = [
    "https://www.mytheresa.com/us/en/women/new-arrivals/current-week",
  ],
) {
  log.info(`Starting Mytheresa scraper for URLs: ${JSON.stringify(startUrls)}`);

  // 确保存储目录存在
  const storageDir = path.resolve(process.cwd(), "storage");
  ensureDirectoryExists(path.join(storageDir, "request_queues", "default"));
  ensureDirectoryExists(path.join(storageDir, "datasets", "default"));
  ensureDirectoryExists(path.join(storageDir, "key_value_stores", "default"));

  log.info(`Storage directory set to: ${storageDir}`);

  // 直接指定存储目录，避免使用Configuration
  process.env.CRAWLEE_STORAGE_DIR = storageDir;

  const crawler = new PlaywrightCrawler({
    // 存储配置通过环境变量完成，这里不需要额外配置

    async requestHandler({
      request,
      page,
      log: crawlerLog,
      crawler,
      pushData,
    }) {
      crawlerLog.info(`Processing ${request.url}... (Label: ${request.label})`);

      if (request.label === "DETAIL") {
        crawlerLog.info(
          `Identified as a DETAIL page via label: ${request.url}`,
        );
        const plpData = (request.userData?.plpData as Partial<Product>) || {}; // Use new Product type

        // Initialize product with the new Product type
        const product: Product = {
          source: "Mytheresa" as ECommerceSite,
          url: request.url,
          scrapedAt: new Date(),
          // Initialize fields based on plpData if available, adjusted for new structure
          name: plpData.name,
          brand: plpData.brand,
          // currentPrice: plpData.currentPrice, // plpData might not have Price object structure yet
          images: plpData.images,
          sizes: plpData.sizes,
          // currency is part of Price object now
          // breadcrumbs will be extracted below
          // sku, description, originalPrice, color, material will be extracted below
        };

        // 新增：优先从 URL 提取 SKU
        try {
          const urlPath = new URL(request.url).pathname; // 获取 URL 的路径部分
          const pathSegments = urlPath.split("-");
          if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            // 确保整个最后段落都是 p+数字 (例如, "p01031061")
            const skuMatch = lastSegment.match(/^(p\d+)$/i);
            if (skuMatch && skuMatch[1]) {
              product.sku = skuMatch[1].toLowerCase();
              crawlerLog.info(
                `SKU extracted from URL '${request.url}': ${product.sku}`,
              );
            } else {
              crawlerLog.debug(
                `SKU pattern not found in URL path's last segment: ${lastSegment} for URL: ${request.url}`,
              );
            }
          } else {
            crawlerLog.debug(
              `URL path could not be segmented by '-' or was empty for URL: ${request.url}`,
            );
          }
        } catch (e) {
          crawlerLog.warning(
            `Could not parse SKU from URL ${request.url}: ${(e as Error).message}`,
          );
        }

        // Extract data from PDP
        try {
          product.brand =
            (
              await page
                .locator(".product__area__branding__designer__link")
                .textContent()
            )?.trim() || product.brand;
          crawlerLog.debug(
            `Extracted brand: ${product.brand} for URL: ${request.url}`,
          );
          product.name =
            (
              await page.locator(".product__area__branding__name").textContent()
            )?.trim() || product.name;
          crawlerLog.debug(
            `Extracted name: ${product.name} for URL: ${request.url}`,
          );

          const priceText = (
            await page.locator(".pricing__prices__price").first().textContent()
          )?.trim();
          if (priceText) {
            const priceMatch = priceText.match(/[\d,.]+/);
            const numericPrice = priceMatch
              ? parseFloat(priceMatch[0].replace(/,/g, ""))
              : NaN;
            let currencySymbol = "USD"; // Default currency
            if (
              priceText.includes("€") ||
              priceText.toLowerCase().includes("eur")
            )
              currencySymbol = "EUR";
            else if (
              priceText.includes("$") ||
              priceText.toLowerCase().includes("usd")
            )
              currencySymbol = "USD";
            else if (
              priceText.includes("£") ||
              priceText.toLowerCase().includes("gbp")
            )
              currencySymbol = "GBP";
            else if (
              priceText.includes("¥") ||
              priceText.toLowerCase().includes("cny")
            )
              currencySymbol = "CNY";
            // Add more currency detection as needed

            if (!isNaN(numericPrice)) {
              product.currentPrice = {
                amount: numericPrice,
                currency: currencySymbol,
              };
              crawlerLog.debug(
                `Extracted currentPrice: ${JSON.stringify(product.currentPrice)} for URL: ${request.url}`,
              );
            }
          }
          // TODO: Add logic for originalPrice if a selector is identified

          const pdpImagesRaw = await page
            .locator(
              "div.swiper-wrapper > div.swiper-slide > img.product__gallery__carousel__image",
            )
            .evaluateAll((imgs) =>
              imgs
                .map((img) => (img as HTMLImageElement).src)
                .filter((src) => src),
            );
          if (pdpImagesRaw.length > 0) {
            // Ensure URLs are absolute
            const absoluteImageUrls = pdpImagesRaw.map((src) =>
              new URL(src, request.loadedUrl).toString(),
            );
            // Deduplicate image URLs
            product.images = Array.from(new Set(absoluteImageUrls));
            crawlerLog.debug(
              `Extracted images count: ${product.images?.length} for URL: ${request.url}`,
            );
          }

          const availableSizes: string[] = [];
          const sizeElements = await page
            .locator(
              "div.sizeitem:not(.sizeitem--notavailable) span.sizeitem__label",
            )
            .all();
          for (const el of sizeElements) {
            const sizeText = (await el.textContent())?.trim();
            if (sizeText) availableSizes.push(sizeText);
          }
          if (availableSizes.length > 0) {
            product.sizes = availableSizes;
            crawlerLog.debug(
              `Extracted sizes: ${JSON.stringify(product.sizes)} for URL: ${request.url}`,
            );
          }

          const descriptionParagraph = await page
            .locator(".accordion__body__content > p")
            .first()
            .textContent();
          product.description = descriptionParagraph?.trim() || "";

          const detailListItems = await page
            .locator(".accordion__body__content ul li")
            .all();
          let additionalDetails = "";
          for (const li of detailListItems) {
            const text = (await li.textContent())?.trim();
            if (text) {
              if (text.startsWith("材质:")) {
                product.material = text.replace("材质:", "").trim();
              } else if (text.startsWith("商品颜色:")) {
                product.color = text.replace("商品颜色:", "").trim();
              } else if (text.startsWith("商品编号:")) {
                // 仅当尚未从URL获取到SKU时，才从文本提取
                if (!product.sku) {
                  const skuFromText = text.replace("商品编号:", "").trim();
                  if (skuFromText) {
                    // 尝试匹配 p+数字 或仅数字的模式，并统一处理
                    const textSkuMatch = skuFromText.match(/^(p?)(\d+)$/i);
                    if (textSkuMatch && textSkuMatch[2]) {
                      // 如果没有 'p' 前缀，则加上；统一转小写
                      product.sku =
                        (textSkuMatch[1]
                          ? textSkuMatch[1].toLowerCase()
                          : "p") + textSkuMatch[2];
                      crawlerLog.info(
                        `SKU extracted from page text: ${product.sku}`,
                      );
                    } else {
                      // 如果格式不符，也记录一下，但还是存原始提取值（小写）
                      product.sku = skuFromText.toLowerCase();
                      crawlerLog.warning(
                        `SKU from text ('${skuFromText}') did not fully match expected pattern, stored as: ${product.sku} for URL: ${request.url}`,
                      );
                    }
                  } else {
                    crawlerLog.debug(
                      `SKU not found in text for '商品编号:' for URL: ${request.url}`,
                    );
                  }
                }
              } else {
                additionalDetails += text + "\n";
              }
            }
          }
          if (additionalDetails) {
            product.description = (
              product.description +
              "\n\nDetails:\n" +
              additionalDetails
            ).trim();
          }
          crawlerLog.debug(
            `Final description length: ${product.description?.length} for URL: ${request.url}`,
          );

          // Extract breadcrumbs
          const breadcrumbLinks = await page
            .locator("div.breadcrumb .breadcrumb__item__link")
            .all();
          const breadcrumbsText: string[] = []; // Renamed to avoid conflict with product.breadcrumbs
          for (const link of breadcrumbLinks) {
            const text = (await link.textContent())?.trim();
            if (text) {
              breadcrumbsText.push(text);
            }
          }
          if (breadcrumbsText.length > 0) {
            product.breadcrumbs = breadcrumbsText;
          }
        } catch (e) {
          crawlerLog.error(
            `Error extracting PDP data for ${request.url}: ${(e as Error).message}`,
          );
        }

        const pageTitle = await page.title();
        if (!product.name) product.name = pageTitle;

        // Final check for SKU before pushing
        if (!product.sku) {
          crawlerLog.warning(
            `Failed to extract SKU for URL: ${request.url} from both URL and page text.`,
          );
        }

        crawlerLog.info(
          `Product data extracted for ${product.name ?? product.url}, pushing to dataset.`,
        );
        await pushData(product);
      } else {
        // LIST page (or initial page)
        crawlerLog.info(`Identified as a LIST page: ${request.url}`);

        const productItemSelector = "div.item";
        // Initial product items extraction at the beginning of LIST page processing
        const productItems = await page.locator(productItemSelector).all();
        crawlerLog.info(
          `Found ${productItems.length} product items initially on ${request.url}`,
        );
        await processProductItems(
          productItems,
          page,
          request,
          crawler,
          crawlerLog,
        );

        // New "Load More" pagination logic
        let loadMoreClickedCount = 0;
        const maxLoadMoreClicks = 10; // Safeguard against infinite loops

        while (true) {
          const loadMoreButtonSelector =
            'div.loadmore__button > a.button--active:has-text("查看更多")';
          const loadMoreButton = page.locator(loadMoreButtonSelector);

          const loadMoreInfoSelector = "div.loadmore__info";
          const loadMoreInfoElement = page.locator(loadMoreInfoSelector);
          let allItemsLoaded = false;
          if (await loadMoreInfoElement.isVisible()) {
            const infoText = (await loadMoreInfoElement.textContent()) || "";
            // Example: "您已查看了120件商品，总共250件" or "您已查看了60件商品，总共60件"
            const match = infoText.match(/您已查看了(\d+)件商品，总共(\d+)件/);
            if (match) {
              const viewed = parseInt(match[1], 10);
              const total = parseInt(match[2], 10);
              if (viewed >= total) {
                allItemsLoaded = true;
                crawlerLog.info(
                  `All ${total} items loaded according to loadmore info.`,
                );
              }
            }
          }

          if (
            allItemsLoaded ||
            !(await loadMoreButton.isVisible()) ||
            loadMoreClickedCount >= maxLoadMoreClicks
          ) {
            if (loadMoreClickedCount >= maxLoadMoreClicks) {
              crawlerLog.warning("Reached maximum load more clicks.");
            }
            crawlerLog.info(
              "No more items to load or load more button not visible/all items loaded.",
            );
            break;
          }

          try {
            crawlerLog.info(
              `Attempting to click "Load More" button. Click count: ${loadMoreClickedCount + 1}`,
            );
            await loadMoreButton.click({ timeout: 5000 }); // Added timeout for click
            loadMoreClickedCount++;
            crawlerLog.info(
              '"Load More" button clicked. Waiting for new content to load...',
            );

            // Wait for new content. This is a critical part and might need adjustment.
            // Option 1: Wait for a specific state like network idle or domcontentloaded
            // await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
            // await page.waitForLoadState('networkidle', { timeout: 15000 });

            // Option 2: Simple timeout (less reliable but good for initial testing)
            await page.waitForTimeout(7000); // Adjust timeout as needed

            // Option 3: Wait for a specific element change, e.g., number of items increases
            // This would require knowing the item count before and after click.

            crawlerLog.info(
              "Presumed new content loaded. Re-evaluating product items on the page.",
            );
            // Re-extract items from the (potentially updated) page content
            // Important: Decide how to handle items already processed in this loop before the click.
            // For now, we get all items again. Crawlee's request queue will deduplicate detail page URLs.
            const newProductItems = await page
              .locator(productItemSelector)
              .all();
            crawlerLog.info(
              `Found ${newProductItems.length} product items after "Load More" click on ${request.url}`,
            );
            await processProductItems(
              newProductItems,
              page,
              request,
              crawler,
              crawlerLog,
            );
          } catch (error) {
            crawlerLog.error(
              `Error clicking or processing after "Load More" button: ${(error as Error).message}`,
            );
            break; // Exit loop on error during load more action
          }
        }
      }
    },

    // 发生错误时的处理函数
    failedRequestHandler({ request, log: crawlerLog }) {
      crawlerLog.error(`Request ${request.url} failed!`);
    },

    // 预导航钩子，可以在这里设置 cookies, headers 等
    // async preNavigationHooks(crawlingContext) {
    // const { page, request, log } = crawlingContext;
    // log.info(`Running pre-navigation hooks for ${request.url}`);
    // await page.setExtraHTTPHeaders({ 'User-Agent': 'MyCoolCrawler/1.0' });
    // },

    // 浏览器启动配置
    launchContext: {
      launchOptions: {
        executablePath:
          "/root/.cache/ms-playwright/chromium-1169/chrome-linux/chrome", // 指定 Playwright 下载的浏览器路径
        // headless: false, // 测试时可以打开浏览器查看
      },
      useChrome: true, // 某些网站对 Firefox 的支持可能不如 Chrome
    },
    maxRequestsPerCrawl: 50, // 开发时限制请求数量，避免意外的大量请求
  });

  log.info("Crawler setup complete. Starting crawl...");
  await crawler.run(Array.isArray(startUrls) ? startUrls : [startUrls]);
  log.info("Mytheresa scraper finished. Data pushed to dataset.");
}

// Helper function to process product items (used initially and after each load more)
async function processProductItems(
  productItems: Locator[], // Locator[] type might be more precise if Playwright types are available
  page: Page, // Page type from Playwright
  request: Request, // Request type from Crawlee
  crawler: PlaywrightCrawler, // PlaywrightCrawler type
  crawlerLog: Log, // Log type from Crawlee
) {
  for (const item of productItems) {
    // Temporary storage for data extracted from PLP
    const plpExtractedData: Partial<Product> = {
      source: "Mytheresa" as ECommerceSite,
      // url will be set below
      // name, brand, currentPrice, images, sizes will be extracted from item
    };

    try {
      const relativeUrl = await item
        .locator("a.item__link")
        .getAttribute("href");
      if (relativeUrl) {
        plpExtractedData.url = new URL(
          relativeUrl,
          request.loadedUrl,
        ).toString();
      }

      plpExtractedData.name =
        (await item.locator(".item__info__name a").textContent())?.trim() ||
        undefined;
      plpExtractedData.brand =
        (
          await item.locator(".item__info__header__designer").textContent()
        )?.trim() || undefined;

      const priceText = (
        await item.locator(".pricing__prices__price").textContent()
      )?.trim();
      if (priceText) {
        const priceMatch = priceText.match(/[\d,.]+/);
        const numericPrice = priceMatch
          ? parseFloat(priceMatch[0].replace(/,/g, ""))
          : NaN;
        let currencySymbol = "USD"; // Default
        if (priceText.includes("€") || priceText.toLowerCase().includes("eur"))
          currencySymbol = "EUR";
        else if (
          priceText.includes("$") ||
          priceText.toLowerCase().includes("usd")
        )
          currencySymbol = "USD";
        else if (
          priceText.includes("£") ||
          priceText.toLowerCase().includes("gbp")
        )
          currencySymbol = "GBP";
        else if (
          priceText.includes("¥") ||
          priceText.toLowerCase().includes("cny")
        )
          currencySymbol = "CNY";

        if (!isNaN(numericPrice)) {
          plpExtractedData.currentPrice = {
            amount: numericPrice,
            currency: currencySymbol,
          };
        }
      }

      const imgSrc = await item
        .locator(".item__images__image img")
        .getAttribute("src");
      if (imgSrc) {
        plpExtractedData.images = [
          new URL(imgSrc, request.loadedUrl).toString(),
        ];
      }

      const sizeElements = await item.locator(".item__sizes__size").all();
      const sizes: string[] = [];
      for (const sizeElement of sizeElements) {
        const sizeText = (await sizeElement.textContent())?.trim();
        if (
          sizeText &&
          !sizeText.startsWith("可选尺码:") &&
          sizeText.length > 0 &&
          sizeText.length < 10
        ) {
          sizes.push(sizeText);
        }
      }
      plpExtractedData.sizes = sizes.length > 0 ? sizes : undefined;

      if (plpExtractedData.url) {
        crawlerLog.info(
          `Enqueuing detail page for: ${plpExtractedData.name || plpExtractedData.url} (PLP data: ${JSON.stringify(Object.keys(plpExtractedData))})`,
        );
        await crawler.addRequests([
          {
            url: plpExtractedData.url,
            label: "DETAIL",
            userData: { plpData: plpExtractedData }, // Pass a subset of Product
          },
        ]);
      } else {
        crawlerLog.warning("Could not extract URL from product item.", {
          itemHTML: await item.innerHTML(),
        });
      }
    } catch (e) {
      crawlerLog.error(
        `Error extracting data from a product item on ${request.url}: ${(e as Error).message}`,
      );
    }
  }
}

// 辅助函数：确保目录存在
function ensureDirectoryExists(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.info(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    log.error(
      `Error creating directory ${dirPath}: ${(error as Error).message}`,
    );
    throw error; // 重新抛出错误，以便上层函数能够处理
  }
}
