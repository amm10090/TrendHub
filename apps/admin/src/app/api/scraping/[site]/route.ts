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
    return "women";
  if (urlLower.includes("/men/") || urlLower.includes("/man/")) return "men";
  if (urlLower.includes("/kids/") || urlLower.includes("/children/"))
    return null; // 根据用户要求，儿童类别不再映射为 unisex，而是返回 null

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

    return { farfetchScraper: moduleImport.farfetchScraper }; // Ensure correct export name
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

// 新增：获取分类层级辅助函数
async function getCategoryLevel(categoryId: string): Promise<number> {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { level: true },
  });

  return category?.level || 0;
}

async function getOrCreateCategoryId(
  breadcrumbsInput?: string[],
  productBrandName?: string,
  baseParentId: string | null = null, // 新增：基础父分类ID参数
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

  // 如果面包屑为空
  if (breadcrumbs.length === 0) {
    // 如果提供了基础父分类ID，直接返回它
    if (baseParentId) return baseParentId;

    // 否则，创建或获取默认分类
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

  // 初始父分类ID和层级
  let currentParentId: string | null = baseParentId;
  // 如果有基础父分类，从其level+1开始
  let currentLevel = 1;

  if (baseParentId) {
    currentLevel = (await getCategoryLevel(baseParentId)) + 1;
  }
  const accumulatedSlugParts: string[] = [];

  // 如果使用基础父分类，获取其slug用于生成子分类的完整slug
  if (baseParentId && currentLevel > 1) {
    const parentCategory = await db.category.findUnique({
      where: { id: baseParentId },
      select: { slug: true },
    });

    if (parentCategory && parentCategory.slug) {
      // 将父分类slug拆分出来
      const parentSlugParts = parentCategory.slug.split("-");

      accumulatedSlugParts.push(...parentSlugParts);
    }
  }

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

          // --- Gender Determination Logic --- START ---
          let determinedGender: string | null = null;

          // 1. Prioritize gender from scraper data if valid
          // Ensure productData is treated as having an optional gender field from @repo/types
          const currentProductData = productData as ScrapedProductType; // Cast to full Product type from @repo/types

          if (
            currentProductData.gender &&
            typeof currentProductData.gender === "string"
          ) {
            const genderLower = currentProductData.gender.toLowerCase();

            if (["women", "men", "unisex"].includes(genderLower)) {
              determinedGender = genderLower;
            }
          }

          // 2. Fallback to URL inference if not set by scraper
          if (!determinedGender) {
            determinedGender = inferGenderFromUrl(productData.url);
          }
          // --- Gender Determination Logic --- END ---

          // Process breadcrumbs (this existing logic can remain,
          // but gender from breadcrumbs is now a lower priority for direct gender field)
          let breadcrumbsForCategoryCreation = productData.breadcrumbs || [];
          const brandNameForCategoryFiltering = productData.brand;

          // 声明和初始化最终使用的 categoryId 变量
          let finalCategoryId: string;

          // --- 根据站点分别处理分类逻辑 ---
          if (site === "Cettire") {
            // --- Cettire 专用分类处理逻辑 ---
            const originalCettireBreadcrumbs = productData.breadcrumbs || [];

            // 确保始终以性别作为一级分类
            let genderCategory: string | null = null;

            // 1. 首先尝试从已确定的 gender 字段获取性别作为一级分类
            if (
              determinedGender &&
              ["men", "women", "unisex"].includes(
                determinedGender.toLowerCase(),
              )
            ) {
              genderCategory = determinedGender.toLowerCase();
            }
            // 2. 其次，检查第一个面包屑是否为性别
            else if (
              originalCettireBreadcrumbs.length > 0 &&
              ["men", "women", "unisex"].includes(
                originalCettireBreadcrumbs[0].toLowerCase(),
              )
            ) {
              genderCategory = originalCettireBreadcrumbs[0].toLowerCase();
            }
            // 3. 如果还未确定，将默认为 unisex
            else {
              genderCategory = "unisex";
            }

            // 统一性别首字母大写
            const formattedGender =
              genderCategory.charAt(0).toUpperCase() + genderCategory.slice(1);

            if (originalCettireBreadcrumbs.length > 0) {
              // 首先获取或创建性别一级分类（作为一级分类）
              const genderBreadcrumbs = [formattedGender];
              const genderCategoryId = await getOrCreateCategoryId(
                genderBreadcrumbs,
                brandNameForCategoryFiltering,
              );

              // 过滤掉面包屑中的性别项和品牌项（通常是第二项）
              let actualCategoryBreadcrumbs: string[] = [];

              if (originalCettireBreadcrumbs.length > 2) {
                // 跳过第一项（性别）和第二项（品牌）
                actualCategoryBreadcrumbs = originalCettireBreadcrumbs.slice(2);
              }

              if (actualCategoryBreadcrumbs.length > 0) {
                // 如果有剩余分类，构建完整的面包屑路径
                const fullBreadcrumbs = [
                  formattedGender,
                  ...actualCategoryBreadcrumbs,
                ];

                // 使用完整路径创建分类结构并获取最终分类ID
                finalCategoryId = await getOrCreateCategoryId(
                  fullBreadcrumbs,
                  brandNameForCategoryFiltering,
                );
              } else {
                // 如果只有性别，直接使用性别分类ID
                finalCategoryId = genderCategoryId;
              }
            } else {
              // 如果没有面包屑，至少确保有一个性别分类
              const genderBreadcrumbs = [formattedGender];

              finalCategoryId = await getOrCreateCategoryId(
                genderBreadcrumbs,
                brandNameForCategoryFiltering,
              );
            }
          } else if (site === "Italist") {
            // --- Italist 专用分类处理逻辑 ---
            // 获取原始面包屑，用于后续处理
            const originalItalistBreadcrumbs = productData.breadcrumbs || [];

            // 确定性别作为一级分类
            let genderCategory: string | null = null;

            // 1. 首先尝试从已确定的 gender 字段获取性别
            if (
              determinedGender &&
              ["men", "women"].includes(determinedGender.toLowerCase())
            ) {
              genderCategory = determinedGender.toLowerCase();
            }
            // 2. 如果未确定，默认为 "unisex"（虽然Italist主要是men/women）
            else {
              genderCategory = "unisex";
            }

            // 统一性别首字母大写
            const formattedGender =
              genderCategory.charAt(0).toUpperCase() + genderCategory.slice(1);

            // 创建或获取性别分类（一级分类）
            const genderCategoryId = await getOrCreateCategoryId(
              [formattedGender],
              brandNameForCategoryFiltering,
            );

            // 处理面包屑，去除可能与性别或品牌重复的部分
            let categoryBreadcrumbs = [...originalItalistBreadcrumbs];

            // 过滤掉品牌名
            if (brandNameForCategoryFiltering) {
              categoryBreadcrumbs = categoryBreadcrumbs.filter(
                (crumb) =>
                  crumb.toLowerCase() !==
                  brandNameForCategoryFiltering.toLowerCase(),
              );
            }

            // 过滤掉与性别相同的面包屑项
            categoryBreadcrumbs = categoryBreadcrumbs.filter(
              (crumb) => crumb.toLowerCase() !== formattedGender.toLowerCase(),
            );

            // 如果面包屑经过过滤后仍有内容，以性别分类为基础创建多级分类
            if (categoryBreadcrumbs.length > 0) {
              finalCategoryId = await getOrCreateCategoryId(
                categoryBreadcrumbs,
                brandNameForCategoryFiltering,
                genderCategoryId, // 使用性别分类ID作为基础父分类
              );
            } else {
              // 如果没有有效的面包屑，直接使用性别分类
              finalCategoryId = genderCategoryId;
            }
          } else {
            // --- 其他站点的通用分类处理逻辑 ---
            // 过滤掉品牌名称，避免将品牌处理为分类
            if (brandNameForCategoryFiltering) {
              breadcrumbsForCategoryCreation =
                breadcrumbsForCategoryCreation.filter(
                  (item) =>
                    item.toLowerCase() !==
                    brandNameForCategoryFiltering.toLowerCase(),
                );
            }

            // 处理面包屑创建分类
            if (breadcrumbsForCategoryCreation.length > 0) {
              // 使用处理过的面包屑创建分类并获取最终分类ID
              finalCategoryId = await getOrCreateCategoryId(
                breadcrumbsForCategoryCreation,
                brandNameForCategoryFiltering,
              );
            }
            // 如果未设置分类且有性别信息，创建或使用性别分类
            else if (determinedGender) {
              const genderName =
                determinedGender.charAt(0).toUpperCase() +
                determinedGender.slice(1);

              finalCategoryId = await getOrCreateCategoryId(
                [genderName],
                brandNameForCategoryFiltering,
              );
            }
            // 最后的兜底：使用默认分类
            else {
              finalCategoryId = await getOrCreateCategoryId(
                [],
                brandNameForCategoryFiltering,
              );
            }
          }
          // --- Cettire Specific Breadcrumb Processing --- END ---

          const productPayload: Prisma.ProductCreateInput = {
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
            breadcrumbs: productData.breadcrumbs || [], // Store original breadcrumbs
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
            gender: determinedGender, // Assign the determined gender
            brand: { connect: { id: brandId } },
            category: { connect: { id: finalCategoryId } },
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
