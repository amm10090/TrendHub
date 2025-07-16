/**
 * FMTC 商户服务
 * 处理FMTC商户的CRUD操作和业务逻辑
 */

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export interface CreateMerchantData {
  name: string;
  homepage?: string;
  country?: string;
  network?: string;
  primaryCategory?: string;
  status?: string;
  fmtcId?: string;
  logo120x60?: string;
  logo88x31?: string;
  brandId?: string;
  affiliateLinks?: Record<string, string[]>;
  affiliateUrl?: string;
  freshReachUrls?: string[];
  previewDealsUrl?: string;
  screenshot280x210?: string;
  screenshot600x450?: string;
  primaryCountry?: string;
  shipsTo?: string[];
  networkId?: string;
  freshReachSupported?: boolean;
  dateAdded?: Date;
  premiumSubscriptions?: number;
  sourceUrl?: string;
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ merchantName: string; error: string }>;
}

export interface MerchantStats {
  totalMerchants: number;
  brandMatched: number;
  unmatched: number;
  recentlyUpdated: number;
}

export class FMTCMerchantService {
  /**
   * 创建商户
   */
  async createMerchant(data: CreateMerchantData) {
    return await db.fMTCMerchant.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        lastScrapedAt: new Date(),
      },
    });
  }

  /**
   * 批量导入商户
   */
  async importMerchants(
    merchants: CreateMerchantData[],
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (const merchantData of merchants) {
      try {
        // 检查是否已存在
        const existing = await db.fMTCMerchant.findFirst({
          where: {
            name: merchantData.name,
            isActive: true,
          },
        });

        if (existing) {
          // 更新现有商户
          await db.fMTCMerchant.update({
            where: { id: existing.id },
            data: {
              ...merchantData,
              lastScrapedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          // 创建新商户
          await this.createMerchant(merchantData);
        }

        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          merchantName: merchantData.name,
          error: error instanceof Error ? error.message : "创建失败",
        });
      }
    }

    return result;
  }

  /**
   * 从爬虫数据同步到数据库
   */
  async syncFromScraperData(): Promise<ImportResult> {
    // 这里应该读取爬虫数据文件并同步
    // 暂时返回空结果
    return {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  /**
   * 批量匹配品牌
   */
  async batchMatchBrand(merchantIds: string[], brandId: string) {
    return await db.fMTCMerchant.updateMany({
      where: { id: { in: merchantIds } },
      data: {
        brandId,
        brandMatchConfirmed: true,
        brandMatchConfidence: new Prisma.Decimal(1.0),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 批量自动匹配品牌
   */
  async batchAutoMatchBrands(merchantIds: string[]) {
    let matchedCount = 0;

    for (const merchantId of merchantIds) {
      const merchant = await db.fMTCMerchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) continue;

      // 简单的品牌匹配逻辑
      const brands = await db.brand.findMany({
        where: {
          name: {
            contains: merchant.name.split(" ")[0], // 使用商户名的第一个单词
            mode: "insensitive",
          },
        },
        take: 1,
      });

      if (brands.length > 0) {
        await db.fMTCMerchant.update({
          where: { id: merchantId },
          data: {
            brandId: brands[0].id,
            brandMatchConfirmed: false, // 自动匹配需要人工确认
            brandMatchConfidence: new Prisma.Decimal(0.7),
            updatedAt: new Date(),
          },
        });
        matchedCount++;
      }
    }

    return { count: matchedCount };
  }

  /**
   * 批量刷新商户数据
   */
  async batchRefreshMerchantData(merchantIds: string[]) {
    return await db.fMTCMerchant.updateMany({
      where: { id: { in: merchantIds } },
      data: {
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 获取商户统计信息
   */
  async getStats(): Promise<MerchantStats> {
    const [totalMerchants, brandMatched, unmatched, recentlyUpdated] =
      await Promise.all([
        db.fMTCMerchant.count({ where: { isActive: true } }),
        db.fMTCMerchant.count({
          where: { isActive: true, brandId: { not: null } },
        }),
        db.fMTCMerchant.count({ where: { isActive: true, brandId: null } }),
        db.fMTCMerchant.count({
          where: {
            isActive: true,
            lastScrapedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

    return {
      totalMerchants,
      brandMatched,
      unmatched,
      recentlyUpdated,
    };
  }
}
