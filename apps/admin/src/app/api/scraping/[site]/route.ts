import * as fs from "fs";
import * as path from "path";

import { Prisma } from "@prisma/client";
import { ScraperOptions } from "@repo/scraper";
import { ECommerceSite, Product as ScrapedProductType } from "@repo/types";
import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";

// 新增：从URL推断性别分类
function inferGenderFromUrl(url: string): string | null {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("/women/") || urlLower.includes("/woman/"))
    return "Women";
  if (urlLower.includes("/men/") || urlLower.includes("/man/")) return "Men";
  if (urlLower.includes("/kids/") || urlLower.includes("/children/"))
    return "Kids";

  return null;
}

// 确保存储目录存在
function ensureStorageDirectories(): void {
  const adminDir = path.resolve(process.cwd());
  const storageDir = path.join(adminDir, "storage");

  // 清理整个存储目录（在开发环境下）
  if (process.env.NODE_ENV === "development") {
    if (fs.existsSync(storageDir)) {
      try {
        // 清理 request_queues 目录
        const requestQueuesDir = path.join(
          storageDir,
          "request_queues",
          "default",
        );

        if (fs.existsSync(requestQueuesDir)) {
          const files = fs.readdirSync(requestQueuesDir);

          for (const file of files) {
            if (file.endsWith(".json")) {
              fs.unlinkSync(path.join(requestQueuesDir, file));
            }
          }
        }

        // 清理 key_value_stores 目录
        /*
                const keyValueStoresDir = path.join(storageDir, "key_value_stores", "default");

                if (fs.existsSync(keyValueStoresDir)) {
                    const keyValueFiles = fs.readdirSync(keyValueStoresDir);

                    for (const file of keyValueFiles) {
                        if (file.endsWith(".json")) {
                            fs.unlinkSync(path.join(keyValueStoresDir, file));
                        }
                    }
                }
                */
      } catch {
        return;
      }
    }
  }

  // 确保主要存储目录存在
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // 确保必要的子目录存在
  const subDirsToEnsure = [
    "datasets/default",
    "key_value_stores/default",
    "request_queues/default",
  ];

  for (const subDir of subDirsToEnsure) {
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
  options?: ScraperOptions,
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

// 新增：generateSlug 辅助函数
function generateSlug(name: string): string {
  if (!name) return "";

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // 替换空格为 -
    .replace(/&/g, "and") // 替换 & 为 and
    .replace(/[^a-z0-9-]/g, "") // 移除特殊字符
    .substring(0, 50); // 限制单片 slug 长度
}

async function getOrCreateCategoryId(
  breadcrumbsInput?: string[],
  productBrandName?: string,
): Promise<string> {
  let breadcrumbs =
    breadcrumbsInput?.map((b) => b?.trim()).filter((b) => b && b.length > 0) ||
    [];

  // 如果提供了产品品牌名，并且面包屑中包含该品牌名（不区分大小写），则过滤掉
  if (productBrandName && productBrandName.trim() !== "") {
    const lowerCaseBrandName = productBrandName.trim().toLowerCase();

    breadcrumbs = breadcrumbs.filter(
      (crumb) => crumb.toLowerCase() !== lowerCaseBrandName,
    );
  }

  const defaultCategoryName = "Default Category";
  const defaultCategorySlug = generateSlug(defaultCategoryName);

  if (breadcrumbs.length === 0) {
    const defaultCategory = await db.category.upsert({
      where: { slug: defaultCategorySlug },
      create: {
        name: defaultCategoryName,
        slug: defaultCategorySlug,
        level: 1,
        parentId: null,
        isActive: true,
      },
      update: {
        name: defaultCategoryName,
        isActive: true,
      },
    });

    return defaultCategory.id;
  }

  let currentParentId: string | null = null;
  let currentLevel = 1;
  const accumulatedSlugParts: string[] = [];

  for (const categoryNamePart of breadcrumbs) {
    const currentNameSlugPart = generateSlug(categoryNamePart);

    accumulatedSlugParts.push(currentNameSlugPart);
    const finalCompositeSlug = accumulatedSlugParts.join("-");

    const category = await db.category.upsert({
      where: { slug: finalCompositeSlug },
      create: {
        name: categoryNamePart,
        slug: finalCompositeSlug,
        level: currentLevel,
        parentId: currentParentId,
        isActive: true,
      },
      update: {
        name: categoryNamePart,
        isActive: true,
      },
    });

    currentParentId = category.id;
    currentLevel++;
  }

  return currentParentId as string;
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
        error: `爬虫存储目录初始化失败: ${(error as Error).message}`,
        detail: {
          cwd: process.cwd(),
          storageDirAttempted: path.join(process.cwd(), "storage"),
          stack: (error as Error).stack,
        },
      },
      { status: 500 },
    );
  }

  const resolvedParams = await context.params;
  const site = resolvedParams.site as ECommerceSite;
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的JSON请求体" }, { status: 400 });
  }
  const startUrl = body.startUrl as string | string[];

  // 新增：提取爬虫配置参数
  const scraperOptions = {
    maxRequests: typeof body.maxRequests === "number" ? body.maxRequests : 90,
    maxLoadClicks:
      typeof body.maxLoadClicks === "number" ? body.maxLoadClicks : 10,
    maxProducts:
      typeof body.maxProducts === "number" ? body.maxProducts : undefined,
    storageDir: path.resolve(process.cwd(), "storage"), // 添加：确保传递正确的存储路径
  };

  // 新增：提取默认库存参数
  const defaultInventory =
    typeof body.defaultInventory === "number" ? body.defaultInventory : 99;

  if (!site || !Object.keys(scrapers).includes(site)) {
    return NextResponse.json({ error: `无效的站点: ${site}` }, { status: 400 });
  }

  if (!startUrl) {
    return NextResponse.json(
      { error: "请求体中必须包含 startUrl" },
      { status: 400 },
    );
  }

  const scraperImporter = scrapers[site];

  if (!scraperImporter) {
    return NextResponse.json(
      { error: `没有找到站点 ${site} 的爬虫导入器` },
      { status: 404 },
    );
  }

  try {
    const scraperModuleExports = await scraperImporter();

    const expectedScraperFunctionName = `${site.toLowerCase()}Scraper`;

    const scraperFunction = scraperModuleExports[expectedScraperFunctionName];

    if (typeof scraperFunction !== "function") {
      return NextResponse.json(
        {
          error: `爬虫函数 ${expectedScraperFunctionName} 未找到或不是一个函数，站点: ${site}`,
          availableExports: Object.keys(scraperModuleExports),
        },
        { status: 500 },
      );
    }

    // 修改：传递爬虫配置参数
    const scrapedProducts = await scraperFunction(startUrl, scraperOptions);

    if (Array.isArray(scrapedProducts) && scrapedProducts.length > 0) {
      const processingResults = [];
      let successCount = 0;
      let errorCount = 0;

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

          // 新增：处理面包屑，确保包含性别分类
          let processedBreadcrumbs = [...(productData.breadcrumbs || [])];

          // 获取品牌名，用于传递给 getOrCreateCategoryId
          const brandNameForCategoryFiltering = productData.brand;

          // 定义已知的性别分类关键词
          const genderCategories = [
            "Women",
            "Woman",
            "Men",
            "Man",
            "Kids",
            "Children",
          ];

          // 检查面包屑是否已包含性别分类
          const hasGenderCategory = processedBreadcrumbs.some((crumb) =>
            genderCategories.some(
              (gender) => crumb.toLowerCase() === gender.toLowerCase(),
            ),
          );

          // 如果面包屑不包含性别分类，尝试从URL推断
          if (!hasGenderCategory) {
            const inferredGender = inferGenderFromUrl(productData.url);

            if (inferredGender) {
              // 将推断的性别添加为面包屑的第一个元素
              processedBreadcrumbs = [inferredGender, ...processedBreadcrumbs];
            }
          }

          const categoryId = await getOrCreateCategoryId(
            processedBreadcrumbs,
            brandNameForCategoryFiltering,
          );

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
            currency: productData.currentPrice?.currency || "USD",
            originalPrice:
              productData.originalPrice?.amount !== undefined
                ? new Prisma.Decimal(productData.originalPrice.amount)
                : null,
            originalPriceCurrency:
              productData.originalPrice?.currency ||
              (productData.originalPrice ? "USD" : null),
            images: productData.images || [],
            videos: productData.videos || [],
            colors: productData.color
              ? [productData.color.trim()].filter((c) => c)
              : [],
            designerColorName: productData.designerColorName || null,
            sizes: productData.sizes || [],
            material: productData.material || null,
            materialDetails: productData.materialDetails || [],
            breadcrumbs: productData.breadcrumbs || [],
            tags: productData.tags || [],
            scrapedAt: productData.scrapedAt
              ? new Date(productData.scrapedAt)
              : new Date(),
            metadata: (productData.metadata &&
            Object.keys(productData.metadata).length > 0
              ? productData.metadata
              : Prisma.JsonNull) as Prisma.InputJsonValue,
            status: "Available",
            inventory: defaultInventory,
            isDeleted: false,
            isNew:
              productData.tags?.some(
                (tag) => tag.toLowerCase() === "new arrival",
              ) || false,
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
            update: productPayload,
          });

          successCount++;
          processingResults.push({
            url: productData.url,
            status: "success",
            id: product.id,
          });
        } catch (err: unknown) {
          errorCount++;
          const error = err as Error;

          processingResults.push({
            url: productData.url,
            status: "error",
            error: error.message,
            stack: error.stack,
          });
        }
      }

      const message = `${successCount} 个产品处理成功 (共 ${scrapedProducts.length} 个)，${errorCount} 个处理失败。`;

      return NextResponse.json({
        message: message,
        results: processingResults,
      });
    } else {
      return NextResponse.json({
        message: "没有抓取到产品或没有产品需要处理。",
      });
    }
  } catch (err: unknown) {
    const error = err as Error;

    return NextResponse.json(
      {
        error: `执行站点 ${site} 的爬虫失败: ${error.message}`,
        stack: error.stack,
        cwd: process.cwd(),
        storageDirUsed: process.env.CRAWLEE_STORAGE_DIR,
      },
      { status: 500 },
    );
  }
}
