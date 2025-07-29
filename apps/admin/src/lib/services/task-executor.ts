// apps/admin/src/lib/services/task-executor.ts

import * as fs from "fs";
import * as path from "path";

import {
  Prisma,
  ScraperTaskDefinition,
  ScraperTaskExecution,
  ScraperTaskStatus,
  ScraperLogLevel,
} from "@prisma/client";
import {
  mytheresaScraper,
  italistScraper,
  yooxScraper,
  farfetchScraper,
  cettireScraper,
  ScraperOptions,
} from "@repo/scraper";
import { Product as ScrapedProductType, ECommerceSite } from "@repo/types"; // Removed unused Price import

import { db } from "@/lib/db";

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

// 类型定义 ScraperFunction
type ScraperFunction = (
  startUrls: string | string[],
  options?: ScraperOptions,
  executionId?: string,
) => Promise<ScrapedProductType[] | void>;

export class TaskExecutor {
  private static instance: TaskExecutor;

  private constructor() {}

  public static getInstance(): TaskExecutor {
    if (!TaskExecutor.instance) {
      TaskExecutor.instance = new TaskExecutor();
    }

    return TaskExecutor.instance;
  }

  private async log(
    executionId: string,
    level: ScraperLogLevel,
    message: string,
    context?: Record<string, unknown>,
    taskDefForLogging?: {
      isDebugModeEnabled?: boolean | null;
      targetSite?: string | null;
    },
  ): Promise<void> {
    try {
      await db.scraperTaskLog.create({
        data: {
          executionId,
          level,
          message,
          context: context
            ? (context as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          timestamp: new Date(),
        },
      });
    } catch {
      logger.error(
        `Failed to save log to DB for execution ${executionId}: ${message}`,
        error as Record<string, unknown>,
      );
      // [DB LOG FAIL] EXEC_ID: ${executionId} [${level}] ${message}
    }

    if (taskDefForLogging?.isDebugModeEnabled && taskDefForLogging.targetSite) {
      await this.appendToFileLog(
        executionId,
        taskDefForLogging.targetSite,
        level,
        message,
        context,
      );
    }
  }

  private async appendToFileLog(
    executionId: string,
    targetSite: string,
    level: ScraperLogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const baseStorageDir =
        process.env.CRAWLEE_STORAGE_DIR ||
        path.resolve(process.cwd(), "storage");
      const siteLogDir = path.join(
        baseStorageDir,
        "scraper_storage_runs",
        targetSite,
        executionId,
      );

      if (!fs.existsSync(siteLogDir)) {
        fs.mkdirSync(siteLogDir, { recursive: true });
      }

      const logFilePath = path.join(siteLogDir, "debug.log");
      const timestamp = new Date().toISOString();
      const contextString = context ? JSON.stringify(context) : "";
      const logMessage = `[${timestamp}] [${level}] ${message}${contextString ? ` ${contextString}` : ""}\n`;

      fs.appendFileSync(logFilePath, logMessage, { encoding: "utf8" });
    } catch {
      // [TaskExecutor FileLog FAIL] Failed to write log to file for execution ${executionId}: ${(fileError as Error).message}
    }
  }

  private async getOrCreateBrandId(brandNameInput?: string): Promise<string> {
    const brandName = brandNameInput?.trim();

    if (
      !brandName ||
      brandName.toLowerCase() === "unknown" ||
      brandName.toLowerCase() === "unknown brand"
    ) {
      const unknownBrand = await db.brand.upsert({
        where: { name: "Unknown Brand" },
        update: {},
        create: {
          name: "Unknown Brand",
          slug: "unknown-brand",
          isActive: false,
        },
      });

      return unknownBrand.id;
    }
    const slug = brandName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
    const brand = await db.brand.upsert({
      where: { name: brandName },
      update: { slug: slug, isActive: true },
      create: { name: brandName, slug: slug, isActive: true },
    });

    return brand.id;
  }

  private generateSlug(name: string): string {
    if (!name) return "";

    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
  }

  private async getOrCreateCategoryId(
    breadcrumbsInput?: string[],
    productBrandName?: string,
  ): Promise<string> {
    let breadcrumbs =
      breadcrumbsInput
        ?.map((b) => b?.trim())
        .filter((b) => b && b.length > 0) || [];

    if (productBrandName && productBrandName.trim() !== "") {
      const lowerCaseBrandName = productBrandName.trim().toLowerCase();

      breadcrumbs = breadcrumbs.filter(
        (crumb) => crumb.toLowerCase() !== lowerCaseBrandName,
      );
    }

    const defaultCategoryName = "Default Category";
    const defaultCategorySlug = this.generateSlug(defaultCategoryName);

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
        update: { name: defaultCategoryName, isActive: true },
      });

      return defaultCategory.id;
    }

    let currentParentId: string | null = null;
    let currentLevel = 1;
    const accumulatedSlugParts: string[] = [];

    for (const categoryNamePart of breadcrumbs) {
      const currentNameSlugPart = this.generateSlug(categoryNamePart);

      accumulatedSlugParts.push(currentNameSlugPart);
      const finalCompositeSlug = accumulatedSlugParts
        .join("-")
        .substring(0, 255);

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
          level: currentLevel,
          parentId: currentParentId,
        },
      });

      currentParentId = category.id;
      currentLevel++;
    }

    return currentParentId as string;
  }

  private inferGenderFromUrl(url: string): string | null {
    const urlLower = url.toLowerCase();

    if (urlLower.includes("/women/") || urlLower.includes("/woman/"))
      return "Women";
    if (urlLower.includes("/men/") || urlLower.includes("/man/")) return "Men";
    if (urlLower.includes("/kids/") || urlLower.includes("/children/"))
      return "Kids";

    return null;
  }

  private async saveScrapedProducts(
    executionId: string,
    products: ScrapedProductType[],
    sourceSite: ECommerceSite,
    defaultInventory: number,
    taskDefForLogging: {
      isDebugModeEnabled?: boolean | null;
      targetSite?: string | null;
    },
  ): Promise<{ savedCount: number; errorCount: number; errors: string[] }> {
    let savedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const productData of products) {
      try {
        if (!productData.url || !productData.source) {
          const errorMsg = `Skipped product due to missing URL or source. URL: ${productData.url || "N/A"}`;

          errors.push(errorMsg);
          await this.log(
            executionId,
            ScraperLogLevel.WARN,
            errorMsg,
            {
              productData: productData as unknown as Record<string, unknown>,
            },
            taskDefForLogging,
          );
          errorCount++;
          continue;
        }

        const brandId = await this.getOrCreateBrandId(productData.brand);

        let processedBreadcrumbs = [...(productData.breadcrumbs || [])];
        const brandNameForCategoryFiltering = productData.brand;
        const genderCategories = [
          "Women",
          "Woman",
          "Men",
          "Man",
          "Kids",
          "Children",
        ];
        const hasGenderCategory = processedBreadcrumbs.some((crumb) =>
          genderCategories.some(
            (gender) => crumb.toLowerCase() === gender.toLowerCase(),
          ),
        );

        if (!hasGenderCategory) {
          const inferredGender = this.inferGenderFromUrl(productData.url);

          if (inferredGender) {
            processedBreadcrumbs = [inferredGender, ...processedBreadcrumbs];
          }
        }
        const categoryId = await this.getOrCreateCategoryId(
          processedBreadcrumbs,
          brandNameForCategoryFiltering,
        );

        const currentPriceAmount = productData.currentPrice?.amount;
        const originalPriceAmount = productData.originalPrice?.amount;

        const productPayload: Prisma.ProductCreateInput = {
          name: productData.name || "N/A",
          url: productData.url,
          source: productData.source,
          sku: productData.sku || null,
          description: productData.description || null,
          price:
            currentPriceAmount !== undefined
              ? new Prisma.Decimal(currentPriceAmount)
              : new Prisma.Decimal(0),
          currency: productData.currentPrice?.currency || "USD",
          originalPrice:
            originalPriceAmount !== undefined
              ? new Prisma.Decimal(originalPriceAmount)
              : null,
          originalPriceCurrency: productData.originalPrice?.currency || null,
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
            productData.tags?.some((tag) =>
              tag.toLowerCase().includes("new"),
            ) || false,
          discount:
            productData.discount !== undefined && productData.discount !== null
              ? new Prisma.Decimal(productData.discount)
              : null,
          brand: { connect: { id: brandId } },
          category: { connect: { id: categoryId } },
          gender: productData.gender,
        };

        if (productPayload.sku === "") productPayload.sku = null;

        await db.product.upsert({
          where: {
            url_source: { url: productData.url, source: productData.source },
          },
          create: productPayload,
          update: productPayload,
        });
        savedCount++;
      } catch (err: unknown) {
        errorCount++;
        const error = err as Error;
        const errorMsg = `Error saving product (URL: ${productData.url}): ${error.message}`;

        errors.push(errorMsg);
        await this.log(
          executionId,
          ScraperLogLevel.ERROR,
          errorMsg,
          {
            stack: error.stack,
            productData: productData as unknown as Record<string, unknown>,
          },
          taskDefForLogging,
        );
      }
    }

    return { savedCount, errorCount, errors };
  }

  public async executeTask(executionId: string): Promise<void> {
    logger.info(`Starting execution for task ID: ${executionId}`);
    let executionRecord:
      | (ScraperTaskExecution & { taskDefinition: ScraperTaskDefinition })
      | null = null;

    try {
      executionRecord = await db.scraperTaskExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.RUNNING,
          startedAt: new Date(),
          errorMessage: null,
          errorStack: null,
          metrics: Prisma.JsonNull,
        },
        include: { taskDefinition: true },
      });

      if (!executionRecord) {
        await this.log(
          executionId,
          ScraperLogLevel.ERROR,
          `Execution record ${executionId} not found, cannot run.`,
          undefined,
          executionRecord
            ? {
                isDebugModeEnabled:
                  executionRecord.taskDefinition.isDebugModeEnabled,
                targetSite: executionRecord.taskDefinition.targetSite,
              }
            : undefined,
        );
        throw new Error(`Execution record ${executionId} not found.`);
      }
      await this.log(
        executionId,
        ScraperLogLevel.INFO,
        "Task execution status updated to RUNNING.",
        undefined,
        executionRecord
          ? {
              isDebugModeEnabled:
                executionRecord.taskDefinition.isDebugModeEnabled,
              targetSite: executionRecord.taskDefinition.targetSite,
            }
          : undefined,
      );

      const { taskDefinition } = executionRecord;
      const logInfoForTask = {
        isDebugModeEnabled: taskDefinition.isDebugModeEnabled,
        targetSite: taskDefinition.targetSite,
      };

      const scraperOptions: ScraperOptions = {
        maxRequests: taskDefinition.maxRequests ?? undefined,
        maxLoadClicks: taskDefinition.maxLoadClicks ?? undefined,
        maxProducts: taskDefinition.maxProducts ?? undefined,
        storageDir:
          process.env.CRAWLEE_STORAGE_DIR ||
          path.resolve(process.cwd(), "storage"),
      };

      const siteKey = taskDefinition.targetSite as ECommerceSite;
      const scraperMap: Record<ECommerceSite, ScraperFunction | undefined> = {
        Mytheresa: mytheresaScraper,
        Italist: italistScraper,
        Yoox: yooxScraper,
        Farfetch: farfetchScraper,
        Cettire: cettireScraper,
        Unknown: undefined,
      };
      const scraperFn = scraperMap[siteKey]; // Changed to const

      if (!scraperFn) {
        throw new Error(
          `Unsupported target site or scraper not found: ${taskDefinition.targetSite}`,
        );
      }

      await this.log(
        executionId,
        ScraperLogLevel.INFO,
        `Invoking scraper for site: ${taskDefinition.targetSite}`,
        {
          urls: taskDefinition.startUrls,
          options: {
            maxRequests: scraperOptions.maxRequests,
            maxLoadClicks: scraperOptions.maxLoadClicks,
            maxProducts: scraperOptions.maxProducts,
          },
        },
        logInfoForTask,
      );

      const scrapedData = await scraperFn(
        taskDefinition.startUrls,
        scraperOptions,
        executionId,
      );
      const productsToSave = Array.isArray(scrapedData) ? scrapedData : [];

      await this.log(
        executionId,
        ScraperLogLevel.INFO,
        `Scraper finished. Found ${productsToSave.length} products potentially.`,
        undefined,
        logInfoForTask,
      );

      const saveResults = await this.saveScrapedProducts(
        executionId,
        productsToSave,
        taskDefinition.targetSite as ECommerceSite,
        taskDefinition.defaultInventory,
        logInfoForTask,
      );

      const metrics = {
        productsFoundByScraper: productsToSave.length,
        productsSuccessfullySaved: saveResults.savedCount,
        productsFailedToSave: saveResults.errorCount,
        saveErrorsSummary:
          saveResults.errors.length > 0
            ? saveResults.errors.slice(0, 5)
            : undefined,
      };

      await db.scraperTaskExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.COMPLETED,
          completedAt: new Date(),
          metrics: metrics as unknown as Prisma.InputJsonValue,
        },
      });
      await this.log(
        executionId,
        ScraperLogLevel.INFO,
        "Task execution COMPLETED successfully.",
        { metrics },
        logInfoForTask,
      );
    } catch (error: unknown) {
      const typedError = error as Error; // Type assertion
      const errorMessage =
        typedError.message || "Unknown error during task execution.";
      const errorStack = typedError.stack || undefined;

      logger.error(
        `Execution failed for task ID ${executionId}: ${errorMessage}`,
        { stack: errorStack, errorObj: error },
      );

      if (executionRecord) {
        await db.scraperTaskExecution.update({
          where: { id: executionId },
          data: {
            status: ScraperTaskStatus.FAILED,
            completedAt: new Date(),
            errorMessage: errorMessage.substring(0, 1999),
            errorStack: errorStack ? errorStack.substring(0, 3999) : undefined,
          },
        });
      }
      await this.log(
        executionId,
        ScraperLogLevel.ERROR,
        `Task execution FAILED: ${errorMessage}`,
        { stackBrief: errorStack?.substring(0, 500) },
        executionRecord
          ? {
              isDebugModeEnabled:
                executionRecord.taskDefinition.isDebugModeEnabled,
              targetSite: executionRecord.taskDefinition.targetSite,
            }
          : undefined,
      );
    }
  }
}

export const taskExecutor = TaskExecutor.getInstance();
