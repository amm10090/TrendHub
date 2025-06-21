import { type PlaywrightCrawlingContext } from "crawlee";
import { type Product, type Price, ECommerceSite } from "@repo/types";
import { sendLogToBackend, LocalScraperLogLevel } from "../../utils.js";
import { SELECTORS } from "./selectors.js";
import { MytheresaUserData } from "./types.js";
import { inferGenderFromMytheresaUrl } from "./index.js";

export async function handlePdp(
  context: PlaywrightCrawlingContext<MytheresaUserData>,
  allScrapedProducts: Product[],
) {
  const { request, page, log: localCrawlerLog, pushData } = context;
  const { executionId, plpData } = request.userData;

  localCrawlerLog.info(`Extracting data from DETAIL page: ${request.url}`);

  const actualGender =
    inferGenderFromMytheresaUrl(request.url) ||
    request.userData.batchGender ||
    plpData?.gender;

  const product: Product = {
    source: "Mytheresa" as ECommerceSite,
    url: request.url,
    scrapedAt: new Date(),
    name: plpData?.name,
    brand: plpData?.brand,
    images: plpData?.images,
    sizes: plpData?.sizes,
    tags: plpData?.tags,
    gender: actualGender,
    materialDetails: [],
    metadata: { executionId },
  };

  try {
    const urlPath = new URL(request.url).pathname;
    const pathSegments = urlPath.split("-");
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const skuMatch = lastSegment.match(/^(p\d+)$/i);
      if (skuMatch && skuMatch[1]) {
        product.sku = skuMatch[1].toLowerCase();
      }
    }
  } catch (e) {
    localCrawlerLog.warning(
      `Mytheresa: Could not parse SKU from URL ${request.url}: ${(e as Error).message}`,
    );
  }

  await page.waitForLoadState("networkidle");

  product.brand =
    (await page.locator(SELECTORS.PDP_BRAND).textContent())?.trim() ||
    product.brand;
  product.name =
    (await page.locator(SELECTORS.PDP_NAME).textContent())?.trim() ||
    product.name;

  const detailsAccordionContent = page.locator(
    SELECTORS.PDP_DETAILS_ACCORDION_CONTENT,
  );
  if (await detailsAccordionContent.isVisible()) {
    let productDescriptionText: string | undefined;

    const mainDescriptionP = detailsAccordionContent.locator("p").first();
    if (await mainDescriptionP.isVisible()) {
      const pText = (await mainDescriptionP.textContent())?.trim();
      if (pText) {
        productDescriptionText = pText;
      }
    }

    if (!productDescriptionText) {
      const listItems = await detailsAccordionContent
        .locator("ul > li")
        .allTextContents();
      const relevantListItems = listItems
        .map((item) => item.trim())
        .filter(
          (item) =>
            item.length > 0 && !item.toLowerCase().includes("item number:"),
        );
      if (relevantListItems.length > 0) {
        productDescriptionText = relevantListItems.join(". ");
      }
    }
    product.description = productDescriptionText;

    const allDetailListItems = await detailsAccordionContent
      .locator("ul li")
      .allTextContents();
    product.materialDetails = allDetailListItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    for (const itemText of product.materialDetails) {
      if (itemText.toLowerCase().startsWith("material:")) {
        product.material = itemText.substring("material:".length).trim();
      }
      if (itemText.toLowerCase().startsWith("designer color name:")) {
        product.color = itemText
          .substring("designer color name:".length)
          .trim();
      } else if (
        !product.color &&
        itemText.toLowerCase().startsWith("item color:")
      ) {
        product.color = itemText.substring("item color:".length).trim();
      }
    }
  }

  const breadcrumbLinks = await page.locator(SELECTORS.PDP_BREADCRUMBS).all();
  const breadcrumbTexts = await Promise.all(
    breadcrumbLinks.map(async (link) => (await link.textContent())?.trim()),
  );
  product.breadcrumbs = breadcrumbTexts.filter(Boolean) as string[];

  const priceContainer = page.locator(SELECTORS.PDP_PRICE_CONTAINER);
  const parsePrice = (priceText: string | null): Price | undefined => {
    if (!priceText) return undefined;
    const amountMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
    const amount = amountMatch
      ? parseFloat(amountMatch[0].replace(/,/g, ""))
      : undefined;
    if (amount === undefined) return undefined;
    let currency = "USD";
    if (
      priceText.includes("€") ||
      request.url.includes("/de/") ||
      request.url.includes("/fr/") ||
      request.url.includes("/it/")
    )
      currency = "EUR";
    if (priceText.includes("£") || request.url.includes("/gb/"))
      currency = "GBP";
    return { amount, currency };
  };

  const discountPriceEl = priceContainer.locator(SELECTORS.PDP_DISCOUNT_PRICE);
  const originalPriceEl = priceContainer.locator(SELECTORS.PDP_ORIGINAL_PRICE);

  let currentPriceText: string | null = null;
  let originalPriceText: string | null = null;

  if (await discountPriceEl.isVisible({ timeout: 5000 }).catch(() => false)) {
    currentPriceText = await discountPriceEl.textContent();
    if (await originalPriceEl.isVisible({ timeout: 5000 }).catch(() => false)) {
      originalPriceText = await originalPriceEl.textContent();
    }
  } else if (
    await originalPriceEl.isVisible({ timeout: 5000 }).catch(() => false)
  ) {
    currentPriceText = await originalPriceEl.textContent();
  }

  product.currentPrice = parsePrice(currentPriceText);
  product.originalPrice = parsePrice(originalPriceText);

  if (
    product.originalPrice &&
    product.currentPrice &&
    product.originalPrice.amount === product.currentPrice.amount &&
    !(await discountPriceEl.isVisible({ timeout: 1000 }).catch(() => false))
  ) {
    product.originalPrice = undefined;
  }

  const imageLocators = await page.locator(SELECTORS.PDP_IMAGES).all();
  if (imageLocators.length > 0) {
    const imageUrls = await Promise.all(
      imageLocators.map(async (img) => (await img.getAttribute("src"))?.trim()),
    );
    product.images = [...new Set(imageUrls.filter(Boolean) as string[])];
  }

  if (!product.sku) {
    const skuMissingMsg = `Failed to extract SKU for URL: ${request.url}.`;
    localCrawlerLog.warning("Mytheresa: " + skuMissingMsg);
    if (executionId)
      await sendLogToBackend(
        executionId,
        LocalScraperLogLevel.WARN,
        skuMissingMsg,
        { url: request.url },
      );
  }

  localCrawlerLog.info(
    `Mytheresa: Product data extracted for ${product.name ?? product.url}, pushing to dataset.`,
  );
  await pushData(product);
  allScrapedProducts.push(product);
}
