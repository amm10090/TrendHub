import * as fs from "fs";
import * as path from "path";

import { Prisma } from "@prisma/client";
import { ECommerceSite, Product as ScrapedProductType } from "@repo/types";
import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";

// 确保存储目录存在
function ensureStorageDirectories(): void {
  const adminDir = path.resolve(process.cwd());
  const storageDir = path.join(adminDir, "storage");

  // 确保主要存储目录存在
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // 确保必要的子目录存在
  const subDirs = [
    "request_queues/default",
    "datasets/default",
    "key_value_stores/default",
  ];

  for (const subDir of subDirs) {
    const fullPath = path.join(storageDir, subDir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // 设置环境变量确保scrapers知道使用哪个存储目录
  process.env.CRAWLEE_STORAGE_DIR = storageDir;

  return;
}

// 动态导入类型声明
type ScraperFunction = (
  startUrls: string | string[],
) => Promise<void | ScrapedProductType[]>; // 允许返回 void 或 产品数组
type ScrapersMap = {
  [key in ECommerceSite]?: () => Promise<{ [key: string]: ScraperFunction }>; // 期望主模块导出包含各爬虫函数的对象
};

// 确保这里的路径和导出与 packages/scraper 中的实际情况一致
const scrapers: ScrapersMap = {
  Mytheresa: async () => {
    const moduleImport = await import("@repo/scraper"); // 导入主模块

    // 假设 Mytheresa 爬虫从主模块中以 'mytheresaScraper' 的名称导出
    return { mytheresaScraper: moduleImport.mytheresaScraper };
  },
  Italist: async () => {
    const moduleImport = await import("@repo/scraper");

    return { italistScraper: moduleImport.italistScraper }; // 假设名称
  },
  Yoox: async () => {
    const moduleImport = await import("@repo/scraper");

    return { yooxScraper: moduleImport.yooxScraper }; // 假设名称
  },
  Farfetch: async () => {
    const moduleImport = await import("@repo/scraper");

    return { farfetchScraper: moduleImport.farfetchScraper }; // 假设名称
  },
  Cettire: async () => {
    const moduleImport = await import("@repo/scraper");

    return { cettireScraper: moduleImport.cettireScraper }; // 假设名称
  },
  Unknown: undefined, // Or handle appropriately
};

async function getOrCreateBrandId(brandNameInput: string): Promise<string> {
  const brandName = brandNameInput?.trim();

  if (!brandName) {
    // 如果没有品牌名，查找或创建一个 "Unknown Brand"
    const unknownBrand = await db.brand.upsert({
      where: { name: "Unknown Brand" },
      update: {},
      create: {
        name: "Unknown Brand",
        slug: "unknown-brand",
        isActive: false, // 通常未知品牌可能先标记为非活跃
      },
    });

    return unknownBrand.id;
  }

  const slug = brandName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const brand = await db.brand.upsert({
    where: { name: brandName },
    update: { slug: slug, isActive: true }, // 如果找到，确保是活跃的，并更新slug
    create: {
      name: brandName,
      slug: slug,
      isActive: true,
    },
  });

  return brand.id;
}

async function getOrCreateCategoryId(breadcrumbs?: string[]): Promise<string> {
  let categoryName = "Default Category"; // 默认分类名

  if (breadcrumbs && breadcrumbs.length > 0) {
    // 取面包屑的最后一个非空元素作为分类名
    for (let i = breadcrumbs.length - 1; i >= 0; i--) {
      const potentialName = breadcrumbs[i]?.trim();

      if (potentialName) {
        categoryName = potentialName;
        break;
      }
    }
  }

  // 创建一个更安全的 slug
  let slug = categoryName
    .toLowerCase()
    .replace(/\s+/g, "-") // 替换空格为-
    .replace(/&/g, "and") // 替换&为and
    .replace(/[^a-z0-9-]/g, "") // 移除特殊字符
    .substring(0, 50); // 限制长度

  if (!slug) {
    slug = "unnamed-category"; // 防止slug为空
  }

  const category = await db.category.upsert({
    where: { slug: slug },
    update: { name: categoryName, isActive: true, level: 1 }, // 确保level在update时也设置
    create: {
      name: categoryName,
      slug: slug,
      level: 1, // 简化处理：所有动态创建的分类都视为一级分类
      isActive: true,
    },
  });

  return category.id;
}

export async function POST(
  request: NextRequest,
  context: { params: { site: string } },
) {
  // 确保存储目录在任何爬虫运行前都存在
  try {
    ensureStorageDirectories();
  } catch (error) {
    return NextResponse.json(
      {
        error: `爬虫存储目录创建失败: ${(error as Error).message}`,
        detail: {
          cwd: process.cwd(),
          storageDir: path.join(process.cwd(), "storage"),
          stack: (error as Error).stack,
        },
      },
      { status: 500 },
    );
  }

  const resolvedParams = await context.params;
  const site = resolvedParams.site as ECommerceSite;
  const body = await request.json();
  const startUrl = body.startUrl as string | string[];

  if (!site || !Object.keys(scrapers).includes(site)) {
    return NextResponse.json(
      { error: `Invalid site: ${site}` },
      { status: 400 },
    );
  }

  if (!startUrl) {
    return NextResponse.json(
      { error: "startUrl is required in the request body" },
      { status: 400 },
    );
  }

  const scraperImporter = scrapers[site];

  if (!scraperImporter) {
    return NextResponse.json(
      { error: `No scraper available for site: ${site}` },
      { status: 404 },
    );
  }

  try {
    const scraperModuleExports = await scraperImporter();

    // 构建一个预期的爬虫函数名，例如 'mytheresaScraper'
    const expectedScraperFunctionName = `${site.toLowerCase()}Scraper`;

    const scraperFunction = scraperModuleExports[expectedScraperFunctionName];

    if (typeof scraperFunction !== "function") {
      return NextResponse.json(
        {
          error: `Scraper function ${expectedScraperFunctionName} not found or not a function for site: ${site}`,
          availableExports: Object.keys(scraperModuleExports),
        },
        { status: 500 },
      );
    }

    const scrapedProducts = await scraperFunction(startUrl);

    if (scrapedProducts && scrapedProducts.length > 0) {
      const processingResults = [];

      for (const productData of scrapedProducts) {
        try {
          if (!productData.url || !productData.source) {
            processingResults.push({
              url: productData.url || "N/A",
              status: "skipped",
              error: "Missing URL or source",
            });
            continue;
          }

          const brandId = await getOrCreateBrandId(
            productData.brand || "Unknown Brand",
          );
          const categoryId = await getOrCreateCategoryId(
            productData.breadcrumbs,
          );

          // 直接构造符合 Prisma.ProductCreateInput/UpdateInput 的对象
          const productPayload = {
            name: productData.name || "N/A",
            url: productData.url,
            source: productData.source,
            sku: productData.sku || null,
            description: productData.description || null,
            price:
              productData.currentPrice?.amount !== undefined
                ? new Prisma.Decimal(productData.currentPrice.amount)
                : new Prisma.Decimal(0),
            currency: productData.currentPrice?.currency || null,
            originalPrice:
              productData.originalPrice?.amount !== undefined
                ? new Prisma.Decimal(productData.originalPrice.amount)
                : null,
            originalPriceCurrency: productData.originalPrice?.currency || null,
            images: productData.images || [],
            videos: productData.videos || [],
            colors: productData.color
              ? [productData.color.trim()].filter((c) => c)
              : [],
            sizes: productData.sizes || [],
            material: productData.material || null,
            breadcrumbs: productData.breadcrumbs || [],
            scrapedAt: productData.scrapedAt
              ? new Date(productData.scrapedAt)
              : new Date(),
            metadata:
              (productData.metadata as Prisma.InputJsonValue) ||
              Prisma.JsonNull,
            status: "Available",
            inventory: 0,
            isDeleted: false,
            isNew: false,
            brand: { connect: { id: brandId } },
            category: { connect: { id: categoryId } },
            promotionUrl: null,
            discount: null,
            coupon: null,
            couponDescription: null,
            couponExpirationDate: null,
            cautions: null,
          };

          if (productPayload.sku === "") {
            productPayload.sku = null;
          }

          const product = await db.product.upsert({
            where: {
              url_source: { url: productData.url, source: productData.source },
            },
            create: productPayload,
            update: productPayload, // Prisma handles this well for upsert
          });

          processingResults.push({
            url: productData.url,
            status: "success",
            id: product.id,
          });
        } catch (err: unknown) {
          const error = err as Error;

          processingResults.push({
            url: productData.url,
            status: "error",
            error: error.message,
            stack: error.stack,
          });
        }
      }

      return NextResponse.json({
        message: `${processingResults.filter((r) => r.status === "success").length} of ${scrapedProducts.length} products processed successfully.`,
        results: processingResults,
      });
    } else {
      return NextResponse.json({
        message: "No products scraped or to process.",
      });
    }
  } catch (err: unknown) {
    const error = err as Error;

    return NextResponse.json(
      { error: `Failed to scrape ${site}: ${error.message}` },
      { status: 500 },
    );
  }
}
