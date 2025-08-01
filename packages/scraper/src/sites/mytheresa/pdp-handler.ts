import { type PlaywrightCrawlingContext } from "crawlee";
import { type Product, type Price, ECommerceSite } from "@repo/types";
import { sendLogToBackend, LocalScraperLogLevel } from "../../utils.js";
import { SELECTORS } from "./selectors.js";
import { MytheresaUserData } from "./types.js";
import { inferGenderFromMytheresaUrl } from "./index.js";

/**
 * 优化的详情页浏览行为 - 减少不必要的等待时间
 */
async function simulateDetailPageBrowsing(
  page: import("playwright").Page,
): Promise<void> {
  try {
    console.log("👀 快速浏览详情页...");

    // 减少浏览时间：500-1500ms（原来2000-5000ms）
    const browsingTime = 500 + Math.random() * 1000;
    await page.waitForTimeout(browsingTime);

    // 减少滚动次数和等待时间
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * 0.5,
        behavior: "smooth",
      });
    });
    await page.waitForTimeout(300); // 减少到300ms

    // 简化鼠标移动
    const viewport = (await page.viewportSize()) || {
      width: 1920,
      height: 1080,
    };
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 1 }, // 减少步数
    );
  } catch (error) {
    console.log("⚠️ 详情页浏览模拟失败:", error);
  }
}

/**
 * 快速提取商品详情页数据 - 从测试文件移植优化版本
 */
async function extractOptimizedPdpData(
  page: import("playwright").Page,
): Promise<Partial<Product>> {
  try {
    console.log("📦 开始快速提取商品详情页数据...");

    // 改进的等待策略
    console.log("⏰ 等待页面完全加载...");
    try {
      // 首先等待DOM加载
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
      console.log("✅ DOM加载完成");

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
          console.log(`✅ 找到关键元素: ${selector}`);
          foundKeyElement = true;
          break;
        } catch {
          console.log(`⏰ 等待元素超时: ${selector}`);
        }
      }

      if (!foundKeyElement) {
        console.log("⚠️ 未找到任何关键元素，继续尝试数据提取");
      }

      // 减少页面稳定等待时间
      await page.waitForTimeout(800);
    } catch (loadError) {
      console.log(
        "⚠️ 页面加载等待超时，尝试继续:",
        (loadError as Error).message,
      );
    }

    const productDetails: Partial<Product> = {};

    // 快速提取品牌 - 优化选择器顺序，减少超时时间
    console.log("🏷️  快速提取品牌信息...");
    const brandSelectors = [
      SELECTORS.PDP_BRAND, // 最可能成功的原选择器
      "h1",
      "h2", // 快速简单选择器
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
          .textContent({ timeout: 800 }); // 减少到800ms
        if (brand && brand.trim().length > 0) {
          productDetails.brand = brand.trim();
          console.log(`✅ 品牌提取成功 (${selector}): ${productDetails.brand}`);
          break;
        }
      } catch {
        // 静默失败，不打印日志以提升速度
        continue;
      }
    }

    if (!productDetails.brand) {
      console.log("❌ 所有品牌选择器都失败");
    }

    // 快速提取商品名称
    console.log("📝 快速提取商品名称...");
    const nameSelectors = [
      SELECTORS.PDP_NAME, // 最可能成功的原选择器
      "h1",
      "h2", // 快速选择器
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
          .textContent({ timeout: 800 });
        if (
          name &&
          name.trim().length > 0 &&
          name.trim() !== productDetails.brand
        ) {
          productDetails.name = name.trim();
          console.log(
            `✅ 商品名称提取成功 (${selector}): ${productDetails.name}`,
          );
          break;
        }
      } catch {
        continue; // 静默失败
      }
    }

    // 快速提取价格信息 - 大幅优化使用正则表达式
    console.log("💰 快速提取价格信息...");
    const priceContainerSelectors = [
      SELECTORS.PDP_PRICE_CONTAINER, // 最可能成功的原选择器
      ".price",
      '[class*="price"]',
      '[class*="pricing"]',
    ];

    // let priceExtracted = false;
    for (const containerSelector of priceContainerSelectors) {
      try {
        const priceContainer = page.locator(containerSelector).first();

        if (
          await priceContainer.isVisible({ timeout: 600 }).catch(() => false)
        ) {
          // 快速策略：直接提取容器文本并用正则解析
          try {
            const containerText = await priceContainer.textContent({
              timeout: 500,
            });
            if (containerText && containerText.trim()) {
              // 使用正则表达式快速提取价格
              const priceMatches = containerText.match(
                /\$[\d,.]+|\$\s*[\d,.]+|USD\s*[\d,.]+|[\d,.]+\s*USD/gi,
              );
              if (priceMatches && priceMatches.length > 0) {
                if (priceMatches.length === 1) {
                  productDetails.currentPrice = priceMatches[0].trim();
                } else {
                  // 多个价格，第一个通常是当前价格，第二个是原价
                  productDetails.currentPrice = priceMatches[0].trim();
                  productDetails.originalPrice = priceMatches[1].trim();
                }
                console.log(`✅ 快速提取价格: ${productDetails.currentPrice}`);
                // priceExtracted = true;
                break;
              }
            }
          } catch {
            continue;
          }
        }
      } catch {
        continue; // 静默失败
      }
    }

    // 快速提取其他关键信息
    console.log("📝 快速提取其他信息...");

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
              return desc.trim().substring(0, 150); // 进一步缩短
            }
          } catch {
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
          } catch {
            continue;
          }
        }
        return null;
      })(),
    ]);

    if (description.status === "fulfilled" && description.value) {
      productDetails.description = description.value;
      console.log(`✅ 描述: ${description.value.substring(0, 30)}...`);
    }

    if (mainImage.status === "fulfilled" && mainImage.value) {
      productDetails.detailImages = [mainImage.value];
      console.log(`✅ 主图片提取成功`);
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
    } catch {
      console.log("⚠️ SKU提取失败");
    }

    // 增强：提取颜色信息
    console.log("🎨 提取颜色信息...");
    try {
      const colorName = await page
        .locator(SELECTORS.PDP_COLOR_NAME)
        .first()
        .textContent({ timeout: 800 })
        .catch(() => "");
      const designerColor = await page
        .locator(SELECTORS.PDP_DESIGNER_COLOR)
        .first()
        .textContent({ timeout: 800 })
        .catch(() => "");

      if (colorName?.trim()) {
        productDetails.color = colorName.trim();
        console.log(`✅ 颜色名称: ${productDetails.color}`);
      }
      if (designerColor?.trim()) {
        productDetails.designerColorName = designerColor.trim();
        console.log(`✅ 设计师颜色: ${productDetails.designerColorName}`);
      }
    } catch {
      console.log("⚠️ 颜色信息提取失败");
    }

    // 增强：提取商品详情信息（材质、颜色、SKU等）
    console.log("📋 提取商品详情信息...");
    try {
      // 提取详情列表项
      const detailElements = await page
        .locator(SELECTORS.PDP_DETAIL_LIST)
        .all()
        .catch(() => []);

      const materialDetails: string[] = [];
      let material = "";
      let designerColorName = "";
      let itemColor = "";
      let itemNumber = "";

      for (const element of detailElements) {
        const text = await element.textContent().catch(() => "");
        if (text?.trim()) {
          const trimmedText = text.trim();

          // 解析材质信息
          if (trimmedText.toLowerCase().includes("material:")) {
            material = trimmedText.replace(/^material:\s*/i, "").trim();
            materialDetails.push(trimmedText);
          }
          // 解析护理说明
          else if (trimmedText.toLowerCase().includes("care instructions:")) {
            materialDetails.push(trimmedText);
          }
          // 解析设计师颜色名称
          else if (trimmedText.toLowerCase().includes("designer color name:")) {
            designerColorName = trimmedText
              .replace(/^designer color name:\s*/i, "")
              .trim();
          }
          // 解析商品颜色
          else if (trimmedText.toLowerCase().includes("item color:")) {
            itemColor = trimmedText.replace(/^item color:\s*/i, "").trim();
          }
          // 解析商品编号
          else if (trimmedText.toLowerCase().includes("item number:")) {
            itemNumber = trimmedText.replace(/^item number:\s*/i, "").trim();
          }
          // 其他详情信息
          else {
            materialDetails.push(trimmedText);
          }
        }
      }

      // 设置提取到的信息
      if (material) {
        productDetails.material = material;
        console.log(`✅ 材质: ${material}`);
      }
      if (materialDetails.length > 0) {
        productDetails.materialDetails = materialDetails;
        console.log(`✅ 详情信息: ${materialDetails.length} 条`);
      }
      if (designerColorName) {
        productDetails.designerColorName = designerColorName;
        console.log(`✅ 设计师颜色: ${designerColorName}`);
      }
      if (itemColor) {
        productDetails.color = itemColor;
        console.log(`✅ 商品颜色: ${itemColor}`);
      }
      if (itemNumber) {
        productDetails.sku = itemNumber;
        console.log(`✅ 商品编号: ${itemNumber}`);
      }
    } catch {
      console.log("⚠️ 商品详情信息提取失败");
    }

    // 增强：提取所有图片
    console.log("📸 提取所有图片...");
    try {
      const allImages: string[] = [];

      // 提取主图片
      const mainImageLocators = await page
        .locator(SELECTORS.PDP_MAIN_IMAGES)
        .all()
        .catch(() => []);
      for (const img of mainImageLocators) {
        const src = await img.getAttribute("src").catch(() => "");
        if (src?.trim() && !allImages.includes(src.trim())) {
          allImages.push(src.trim());
        }
      }

      // 提取缩略图
      const thumbnailLocators = await page
        .locator(SELECTORS.PDP_THUMBNAIL_IMAGES)
        .all()
        .catch(() => []);
      for (const img of thumbnailLocators) {
        const src = await img.getAttribute("src").catch(() => "");
        if (src?.trim() && !allImages.includes(src.trim())) {
          allImages.push(src.trim());
        }
      }

      // 通用图片选择器
      const allImgLocators = await page
        .locator(SELECTORS.PDP_ALL_IMAGES)
        .all()
        .catch(() => []);
      for (const img of allImgLocators) {
        const src = await img.getAttribute("src").catch(() => "");
        if (src?.trim() && !allImages.includes(src.trim())) {
          allImages.push(src.trim());
        }
      }

      if (allImages.length > 0) {
        productDetails.images = allImages;
        productDetails.detailImages = allImages; // 向后兼容
        console.log(`✅ 提取到 ${allImages.length} 张图片`);
      }
    } catch {
      console.log("⚠️ 图片提取失败");
    }

    // 增强：提取面包屑导航
    console.log("🗂️ 提取面包屑导航...");
    try {
      const breadcrumbElements = await page
        .locator(SELECTORS.PDP_BREADCRUMBS)
        .all()
        .catch(() => []);
      const breadcrumbs: string[] = [];

      for (const element of breadcrumbElements) {
        const text = await element.textContent().catch(() => "");
        if (text?.trim()) {
          breadcrumbs.push(text.trim());
        }
      }

      if (breadcrumbs.length > 0) {
        productDetails.breadcrumbs = breadcrumbs;
        console.log(`✅ 面包屑: ${breadcrumbs.join(" > ")}`);
      }
    } catch {
      console.log("⚠️ 面包屑提取失败");
    }

    // 增强：提取尺寸信息
    console.log("📏 提取尺寸信息...");
    try {
      const sizeElements = await page
        .locator(SELECTORS.PDP_SIZE_SELECTOR)
        .all()
        .catch(() => []);
      const sizes: string[] = [];

      for (const element of sizeElements) {
        const text = await element.textContent().catch(() => "");
        const isDisabled = await element
          .getAttribute("class")
          .then((cls: string | null) => cls?.includes("disabled"))
          .catch(() => false);

        if (text?.trim() && !isDisabled) {
          sizes.push(text.trim());
        }
      }

      if (sizes.length > 0) {
        productDetails.sizes = sizes;
        console.log(`✅ 可用尺寸: ${sizes.join(", ")}`);
      }
    } catch {
      console.log("⚠️ 尺寸信息提取失败");
    }

    // 增强：提取尺寸和合身信息
    console.log("👗 提取尺寸和合身信息...");
    try {
      const sizeFitElements = await page
        .locator(SELECTORS.PDP_SIZE_FIT_INFO)
        .all()
        .catch(() => []);
      const sizeFitDetails: string[] = [];

      for (const element of sizeFitElements) {
        const text = await element.textContent().catch(() => "");
        if (text?.trim()) {
          sizeFitDetails.push(text.trim());
        }
      }

      if (sizeFitDetails.length > 0) {
        productDetails.sizeFitInfo = sizeFitDetails;
        console.log(`✅ 尺寸合身信息: ${sizeFitDetails.length} 条`);
      }
    } catch {
      console.log("⚠️ 尺寸合身信息提取失败");
    }

    productDetails.detailPageUrl = page.url();
    productDetails.scrapedAt = new Date().toISOString();

    console.log(
      `✅ 详情页数据提取完成: ${productDetails.brand} - ${productDetails.name}`,
    );

    return productDetails;
  } catch (error) {
    console.error("💥 详情页数据提取失败:", error);
    return null;
  }
}

export async function handlePdp(
  context: PlaywrightCrawlingContext<MytheresaUserData>,
  allScrapedProducts: Product[],
) {
  const { request, page, log: localCrawlerLog, pushData } = context;
  const { executionId, plpData } = request.userData;

  localCrawlerLog.info(
    `🛡️ Extracting data from DETAIL page with optimized extraction: ${request.url}`,
  );

  // 模拟用户在详情页的浏览行为
  await simulateDetailPageBrowsing(page);

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
  } catch {
    localCrawlerLog.warning(
      `Mytheresa: Could not parse SKU from URL ${request.url}: ${(e as Error).message}`,
    );
  }

  await page.waitForLoadState("networkidle");

  // 使用优化的数据提取
  const optimizedData = await extractOptimizedPdpData(page);

  if (optimizedData) {
    // 合并优化提取的数据
    product.brand = optimizedData.brand || product.brand;
    product.name = optimizedData.name || product.name;
    product.description = optimizedData.description;
    product.sku = optimizedData.sku || product.sku;

    // 新增字段：颜色信息
    if (optimizedData.color) {
      product.color = optimizedData.color;
    }
    if (optimizedData.designerColorName) {
      product.designerColorName = optimizedData.designerColorName;
    }

    // 新增字段：材质信息
    if (optimizedData.material) {
      product.material = optimizedData.material;
    }
    if (
      optimizedData.materialDetails &&
      optimizedData.materialDetails.length > 0
    ) {
      product.materialDetails = optimizedData.materialDetails;
    }

    // 新增字段：面包屑导航
    if (optimizedData.breadcrumbs && optimizedData.breadcrumbs.length > 0) {
      product.breadcrumbs = optimizedData.breadcrumbs;
    }

    // 更新字段：尺寸（优先使用详情页的更完整数据）
    if (optimizedData.sizes && optimizedData.sizes.length > 0) {
      product.sizes = optimizedData.sizes;
    }

    // 处理价格数据
    if (optimizedData.currentPrice) {
      const parsePrice = (priceText: string): Price | undefined => {
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

      product.currentPrice = parsePrice(optimizedData.currentPrice);
      if (optimizedData.originalPrice) {
        product.originalPrice = parsePrice(optimizedData.originalPrice);
      }
    }

    // 处理图片 - 优先使用详情页的完整图片集合
    if (optimizedData.images && optimizedData.images.length > 0) {
      product.images = optimizedData.images;
    } else if (
      optimizedData.detailImages &&
      optimizedData.detailImages.length > 0
    ) {
      product.images = [
        ...new Set([...(product.images || []), ...optimizedData.detailImages]),
      ];
    }
  }

  // 回退到原始方法提取遗漏的数据
  if (!product.brand) {
    product.brand =
      (
        await page
          .locator(SELECTORS.PDP_BRAND)
          .textContent()
          .catch(() => null)
      )?.trim() || product.brand;
  }

  if (!product.name) {
    product.name =
      (
        await page
          .locator(SELECTORS.PDP_NAME)
          .textContent()
          .catch(() => null)
      )?.trim() || product.name;
  }

  // 只有在优化提取失败时才使用详细的手动提取
  if (!product.description) {
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
  }

  // 只有在优化提取失败时才提取面包屑
  if (!product.breadcrumbs) {
    const breadcrumbLinks = await page.locator(SELECTORS.PDP_BREADCRUMBS).all();
    const breadcrumbTexts = await Promise.all(
      breadcrumbLinks.map(async (link) => (await link.textContent())?.trim()),
    );
    product.breadcrumbs = breadcrumbTexts.filter(Boolean) as string[];
  }

  // 只有在优化提取失败时才进行详细价格提取
  if (!product.currentPrice) {
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

    const discountPriceEl = priceContainer.locator(
      SELECTORS.PDP_DISCOUNT_PRICE,
    );
    const originalPriceEl = priceContainer.locator(
      SELECTORS.PDP_ORIGINAL_PRICE,
    );

    let currentPriceText: string | null = null;
    let originalPriceText: string | null = null;

    if (await discountPriceEl.isVisible({ timeout: 5000 }).catch(() => false)) {
      currentPriceText = await discountPriceEl.textContent();
      if (
        await originalPriceEl.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
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
  }

  // 只有在优化提取失败时才提取图片
  if (!product.images || product.images.length === 0) {
    const imageLocators = await page.locator(SELECTORS.PDP_IMAGES).all();
    if (imageLocators.length > 0) {
      const imageUrls = await Promise.all(
        imageLocators.map(async (img) =>
          (await img.getAttribute("src"))?.trim(),
        ),
      );
      product.images = [...new Set(imageUrls.filter(Boolean) as string[])];
    }
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
    `🛡️ Mytheresa: Optimized product data extracted for ${product.name ?? product.url}, pushing to dataset.`,
  );
  await pushData(product);
  allScrapedProducts.push(product);
}
