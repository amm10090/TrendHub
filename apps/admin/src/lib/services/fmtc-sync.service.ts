import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// 同步结果接口
interface SyncResult {
  totalMerchants: number;
  newMatches: number;
  updatedMatches: number;
  failedMatches: number;
  deletedMappings: number;
  updatedDiscounts: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: string[];
  details: {
    merchantsProcessed: number;
    brandsMatched: number;
    confirmationsPending: number;
    discountsUpdated: number;
  };
}

// 匹配结果接口
interface MatchResult {
  merchantId: string;
  merchantName: string;
  brandId: string | null;
  brandName: string | null;
  confidence: number;
  isConfirmed: boolean;
  isNew: boolean;
  error?: string;
}

// 品牌匹配服务接口
interface BrandMatchingServiceInterface {
  matchBrand: (merchantName: string) => Promise<{
    brandId: string | null;
    brandName: string | null;
    confidence: number;
  }>;
}

/**
 * FMTC 数据同步服务
 * 负责定期同步 FMTC 商户信息到品牌匹配系统
 */
export class FMTCSyncService {
  private brandMatchingService: BrandMatchingServiceInterface;
  private autoMatchThreshold: number = 0.8;

  constructor(brandMatchingService: BrandMatchingServiceInterface) {
    this.brandMatchingService = brandMatchingService;
  }

  /**
   * 设置自动匹配阈值
   */
  setAutoMatchThreshold(threshold: number): void {
    this.autoMatchThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * 主要同步方法：同步 FMTC 商户信息到品牌匹配系统
   */
  async syncMerchantsWithBrands(): Promise<SyncResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let totalMerchants = 0;
    let newMatches = 0;
    let updatedMatches = 0;
    let failedMatches = 0;
    let deletedMappings = 0;
    let updatedDiscounts = 0;

    try {
      // 1. 获取所有活跃的 FMTC 商户
      const merchants = await this.getActiveFMTCMerchants();

      totalMerchants = merchants.length;

      // 2. 批量执行品牌匹配
      const matchResults = await this.batchMatchBrands(merchants);

      // 3. 统计匹配结果
      for (const result of matchResults) {
        if (result.error) {
          failedMatches++;
          errors.push(`${result.merchantName}: ${result.error}`);
        } else if (result.isNew) {
          newMatches++;
        } else {
          updatedMatches++;
        }
      }

      // 4. 更新品牌映射表
      await this.updateBrandMappings(matchResults);

      // 5. 清理无效的品牌映射
      deletedMappings = await this.cleanupInvalidMappings();

      // 6. 更新相关折扣的品牌关联
      updatedDiscounts = await this.updateDiscountBrandAssociations();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        totalMerchants,
        newMatches,
        updatedMatches,
        failedMatches,
        deletedMappings,
        updatedDiscounts,
        startTime,
        endTime,
        duration,
        errors,
        details: {
          merchantsProcessed: totalMerchants,
          brandsMatched: newMatches + updatedMatches,
          confirmationsPending: matchResults.filter(
            (r) => !r.isConfirmed && r.brandId,
          ).length,
          discountsUpdated: updatedDiscounts,
        },
      };
    } catch {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      errors.push(
        `同步失败: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        totalMerchants,
        newMatches,
        updatedMatches,
        failedMatches: totalMerchants,
        deletedMappings,
        updatedDiscounts,
        startTime,
        endTime,
        duration,
        errors,
        details: {
          merchantsProcessed: 0,
          brandsMatched: 0,
          confirmationsPending: 0,
          discountsUpdated: 0,
        },
      };
    }
  }

  /**
   * 获取所有活跃的 FMTC 商户
   */
  private async getActiveFMTCMerchants() {
    return await db.fMTCMerchant.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        homepage: true,
        primaryCategory: true,
        country: true,
        brandId: true,
        brandMatchConfirmed: true,
        brandMatchConfidence: true,
      },
      orderBy: {
        lastScrapedAt: "desc",
      },
    });
  }

  /**
   * 批量执行品牌匹配
   */
  private async batchMatchBrands(
    merchants: {
      id: string;
      name: string;
      brandId?: string | null;
      brandMatchConfirmed?: boolean | null;
      brandMatchConfidence?: Prisma.Decimal | null;
    }[],
  ): Promise<MatchResult[]> {
    const results: MatchResult[] = [];
    const batchSize = 10; // 批量处理大小

    for (let i = 0; i < merchants.length; i += batchSize) {
      const batch = merchants.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (merchant) => {
          try {
            // 如果已经确认匹配，跳过
            if (merchant.brandMatchConfirmed && merchant.brandId) {
              return {
                merchantId: merchant.id,
                merchantName: merchant.name,
                brandId: merchant.brandId,
                brandName: null, // 会在后续查询中填充
                confidence: merchant.brandMatchConfidence
                  ? Number(merchant.brandMatchConfidence.toString())
                  : 1.0,
                isConfirmed: true,
                isNew: false,
              };
            }

            // 执行品牌匹配
            const matchResult = await this.brandMatchingService.matchBrand(
              merchant.name,
            );

            // 判断是否为新匹配
            const isNew = !merchant.brandId;

            // 判断是否自动确认（高置信度）
            const isConfirmed =
              matchResult.confidence >= this.autoMatchThreshold;

            return {
              merchantId: merchant.id,
              merchantName: merchant.name,
              brandId: matchResult.brandId,
              brandName: matchResult.brandName,
              confidence: matchResult.confidence,
              isConfirmed,
              isNew,
            };
          } catch {
            return {
              merchantId: merchant.id,
              merchantName: merchant.name,
              brandId: null,
              brandName: null,
              confidence: 0,
              isConfirmed: false,
              isNew: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }),
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 更新品牌映射表
   */
  private async updateBrandMappings(
    matchResults: MatchResult[],
  ): Promise<void> {
    const validResults = matchResults.filter((r) => r.brandId && !r.error);

    for (const result of validResults) {
      try {
        // 更新 FMTC 商户的品牌关联
        await db.fMTCMerchant.update({
          where: { id: result.merchantId },
          data: {
            brandId: result.brandId,
            brandMatchConfidence: new Prisma.Decimal(result.confidence),
            brandMatchConfirmed: result.isConfirmed,
          },
        });

        // 创建或更新品牌映射记录
        await db.brandMapping.upsert({
          where: { merchantName: result.merchantName },
          create: {
            merchantName: result.merchantName,
            brandId: result.brandId,
            isConfirmed: result.isConfirmed,
            confidence: new Prisma.Decimal(result.confidence),
            fmtcMerchantId: result.merchantId,
          },
          update: {
            brandId: result.brandId,
            isConfirmed: result.isConfirmed,
            confidence: new Prisma.Decimal(result.confidence),
            fmtcMerchantId: result.merchantId,
          },
        });
      } catch {
        // Error creating brand mapping
      }
    }
  }

  /**
   * 清理无效的品牌映射
   */
  private async cleanupInvalidMappings(): Promise<number> {
    try {
      // 删除关联的 FMTC 商户已不存在的映射
      const result = await db.brandMapping.deleteMany({
        where: {
          fmtcMerchantId: {
            not: null,
          },
          fmtcMerchant: null,
        },
      });

      return result.count;
    } catch {
      return 0;
    }
  }

  /**
   * 更新相关折扣的品牌关联
   */
  private async updateDiscountBrandAssociations(): Promise<number> {
    try {
      // 获取所有有品牌匹配的 FMTC 商户
      const merchantsWithBrands = await db.fMTCMerchant.findMany({
        where: {
          isActive: true,
          brandId: { not: null },
          brandMatchConfirmed: true,
        },
        select: {
          name: true,
          brandId: true,
        },
      });

      let updatedCount = 0;

      // 批量更新相关折扣的品牌关联
      for (const merchant of merchantsWithBrands) {
        try {
          const result = await db.discount.updateMany({
            where: {
              merchantName: merchant.name,
              brandId: null, // 只更新未关联品牌的折扣
              isActive: true,
            },
            data: {
              brandId: merchant.brandId,
            },
          });

          updatedCount += result.count;
        } catch {
          // Error updating brand mapping
        }
      }

      return updatedCount;
    } catch {
      return 0;
    }
  }

  /**
   * 获取同步统计信息
   */
  async getSyncStats(): Promise<{
    totalMerchants: number;
    matchedMerchants: number;
    unmatchedMerchants: number;
    confirmedMatches: number;
    pendingMatches: number;
    associatedDiscounts: number;
  }> {
    const [
      totalMerchants,
      matchedMerchants,
      unmatchedMerchants,
      confirmedMatches,
      pendingMatches,
      associatedDiscounts,
    ] = await Promise.all([
      db.fMTCMerchant.count({ where: { isActive: true } }),
      db.fMTCMerchant.count({
        where: { isActive: true, brandId: { not: null } },
      }),
      db.fMTCMerchant.count({ where: { isActive: true, brandId: null } }),
      db.fMTCMerchant.count({
        where: { isActive: true, brandMatchConfirmed: true },
      }),
      db.fMTCMerchant.count({
        where: {
          isActive: true,
          brandMatchConfirmed: false,
          brandId: { not: null },
        },
      }),
      db.discount.count({ where: { isActive: true, brandId: { not: null } } }),
    ]);

    return {
      totalMerchants,
      matchedMerchants,
      unmatchedMerchants,
      confirmedMatches,
      pendingMatches,
      associatedDiscounts,
    };
  }

  /**
   * 重置所有品牌匹配
   */
  async resetAllMatches(): Promise<{ resetCount: number }> {
    try {
      const result = await db.fMTCMerchant.updateMany({
        where: { isActive: true },
        data: {
          brandId: null,
          brandMatchConfirmed: false,
          brandMatchConfidence: null,
        },
      });

      // 清理品牌映射表
      await db.brandMapping.deleteMany({
        where: {
          fmtcMerchantId: { not: null },
        },
      });

      return { resetCount: result.count };
    } catch {
      throw error;
    }
  }

  /**
   * 手动触发同步（用于测试或管理界面）
   */
  async triggerManualSync(): Promise<SyncResult> {
    return await this.syncMerchantsWithBrands();
  }
}

// 创建默认实例
let fmtcSyncService: FMTCSyncService | null = null;

/**
 * 获取 FMTC 同步服务实例
 */
export function getFMTCSyncService(): FMTCSyncService {
  if (!fmtcSyncService) {
    // 简单的品牌匹配服务实现
    const simpleBrandMatchingService: BrandMatchingServiceInterface = {
      async matchBrand(merchantName: string) {
        // 获取所有活跃品牌
        const brands = await db.brand.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        });

        // 简单的字符串匹配算法
        let bestMatch = null;
        let bestSimilarity = 0;

        for (const brand of brands) {
          const similarity = calculateStringSimilarity(
            merchantName,
            brand.name,
          );

          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = brand;
          }
        }

        return {
          brandId: bestMatch?.id || null,
          brandName: bestMatch?.name || null,
          confidence: bestSimilarity,
        };
      },
    };

    fmtcSyncService = new FMTCSyncService(simpleBrandMatchingService);
  }

  return fmtcSyncService;
}

/**
 * 计算字符串相似度（简化版 Levenshtein 距离）
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);

  if (normalized1 === normalized2) return 1.0;

  const len1 = normalized1.length;
  const len2 = normalized2.length;

  if (len1 === 0 || len2 === 0) return 0;

  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;

      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);

  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

export default FMTCSyncService;
