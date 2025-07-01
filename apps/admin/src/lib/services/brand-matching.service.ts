import { Brand, BrandMapping } from "@prisma/client";

import { db } from "@/lib/db";

export interface BrandMatchResult {
  brandId?: string;
  brand?: Brand;
  confidence: number;
  isExactMatch: boolean;
  matchType: "exact" | "fuzzy" | "none";
}

export interface BrandMatchSuggestion {
  brand: Brand;
  confidence: number;
  matchReason: string;
}

export class BrandMatchingService {
  private brandCache: Map<string, Brand[]> = new Map();
  private mappingCache: Map<string, BrandMapping> = new Map();

  /**
   * 智能匹配FMTC商家名称到系统品牌
   */
  async matchBrand(merchantName: string): Promise<BrandMatchResult> {
    // 1. 检查已确认的映射
    const existingMapping = await this.getExistingMapping(merchantName);

    if (existingMapping && existingMapping.brand) {
      return {
        brandId: existingMapping.brandId!,
        brand: existingMapping.brand,
        confidence: 1.0,
        isExactMatch: true,
        matchType: "exact",
      };
    }

    // 2. 尝试精确匹配
    const exactMatch = await this.findExactMatch(merchantName);

    if (exactMatch) {
      // 自动创建映射记录
      await this.createMapping(merchantName, exactMatch.id, 1.0, true);

      return {
        brandId: exactMatch.id,
        brand: exactMatch,
        confidence: 1.0,
        isExactMatch: true,
        matchType: "exact",
      };
    }

    // 3. 尝试模糊匹配
    const fuzzyMatch = await this.findFuzzyMatch(merchantName);

    if (fuzzyMatch && fuzzyMatch.confidence >= 0.8) {
      return {
        brandId: fuzzyMatch.brand.id,
        brand: fuzzyMatch.brand,
        confidence: fuzzyMatch.confidence,
        isExactMatch: false,
        matchType: "fuzzy",
      };
    }

    return {
      confidence: 0,
      isExactMatch: false,
      matchType: "none",
    };
  }

  /**
   * 获取品牌匹配建议
   */
  async getBrandSuggestions(
    merchantName: string,
    limit: number = 5,
  ): Promise<BrandMatchSuggestion[]> {
    const suggestions: BrandMatchSuggestion[] = [];
    const brands = await this.getAllBrands();

    for (const brand of brands) {
      const confidence = this.calculateSimilarity(merchantName, brand.name);

      if (confidence > 0.3) {
        // 只返回相似度大于30%的建议
        suggestions.push({
          brand,
          confidence,
          matchReason: this.getMatchReason(
            merchantName,
            brand.name,
            confidence,
          ),
        });
      }
    }

    // 按置信度降序排序并限制数量
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * 手动确认品牌映射
   */
  async confirmBrandMapping(
    merchantName: string,
    brandId: string,
  ): Promise<BrandMapping> {
    const brand = await db.brand.findUnique({ where: { id: brandId } });

    if (!brand) {
      throw new Error(`品牌ID ${brandId} 不存在`);
    }

    return this.createMapping(merchantName, brandId, 1.0, true);
  }

  /**
   * 批量处理品牌匹配
   */
  async batchMatchBrands(
    merchantNames: string[],
  ): Promise<Map<string, BrandMatchResult>> {
    const results = new Map<string, BrandMatchResult>();

    // 预加载所有品牌和映射数据
    await this.preloadData();

    for (const merchantName of merchantNames) {
      try {
        const result = await this.matchBrand(merchantName);

        results.set(merchantName, result);
      } catch {
        results.set(merchantName, {
          confidence: 0,
          isExactMatch: false,
          matchType: "none",
        });
      }
    }

    return results;
  }

  /**
   * 获取未匹配的商家名称
   */
  async getUnmatchedMerchants(): Promise<string[]> {
    const discountMerchants = await db.discount.findMany({
      select: { merchantName: true },
      distinct: ["merchantName"],
      where: { brandId: null },
    });

    return discountMerchants.map((d) => d.merchantName);
  }

  /**
   * 获取匹配统计信息
   */
  async getMatchingStats(): Promise<{
    totalMerchants: number;
    matchedMerchants: number;
    unmatchedMerchants: number;
    confirmedMappings: number;
  }> {
    const [totalMerchants, matchedMerchants, confirmedMappings] =
      await Promise.all([
        db.discount.findMany({
          select: { merchantName: true },
          distinct: ["merchantName"],
        }),
        db.discount.findMany({
          select: { merchantName: true },
          distinct: ["merchantName"],
          where: { brandId: { not: null } },
        }),
        db.brandMapping.count({
          where: { isConfirmed: true },
        }),
      ]);

    return {
      totalMerchants: totalMerchants.length,
      matchedMerchants: matchedMerchants.length,
      unmatchedMerchants: totalMerchants.length - matchedMerchants.length,
      confirmedMappings,
    };
  }

  // === 私有方法 ===

  private async getExistingMapping(
    merchantName: string,
  ): Promise<(BrandMapping & { brand: Brand | null }) | null> {
    const cacheKey = merchantName.toLowerCase();

    if (this.mappingCache.has(cacheKey)) {
      const mapping = this.mappingCache.get(cacheKey)!;
      const brand = mapping.brandId
        ? await db.brand.findUnique({ where: { id: mapping.brandId } })
        : null;

      return { ...mapping, brand };
    }

    const mapping = await db.brandMapping.findUnique({
      where: { merchantName },
      include: { brand: true },
    });

    if (mapping) {
      this.mappingCache.set(cacheKey, mapping);
    }

    return mapping;
  }

  private async findExactMatch(merchantName: string): Promise<Brand | null> {
    const normalizedMerchant = this.normalizeBrandName(merchantName);

    const brands = await this.getAllBrands();

    return (
      brands.find((brand) => {
        const normalizedBrand = this.normalizeBrandName(brand.name);

        return normalizedBrand === normalizedMerchant;
      }) || null
    );
  }

  private async findFuzzyMatch(
    merchantName: string,
  ): Promise<BrandMatchSuggestion | null> {
    const suggestions = await this.getBrandSuggestions(merchantName, 1);

    return suggestions.length > 0 ? suggestions[0] : null;
  }

  private async getAllBrands(): Promise<Brand[]> {
    if (!this.brandCache.has("all")) {
      const brands = await db.brand.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      this.brandCache.set("all", brands);
    }

    return this.brandCache.get("all")!;
  }

  private normalizeBrandName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // 移除标点符号
      .replace(/\s+/g, " ") // 规范化空格
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = this.normalizeBrandName(str1);
    const normalized2 = this.normalizeBrandName(str2);

    // Levenshtein距离算法
    const matrix = Array(normalized2.length + 1)
      .fill(null)
      .map(() => Array(normalized1.length + 1).fill(null));

    for (let i = 0; i <= normalized1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= normalized2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= normalized2.length; j++) {
      for (let i = 1; i <= normalized1.length; i++) {
        const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;

        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    const distance = matrix[normalized2.length][normalized1.length];
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private getMatchReason(
    _merchantName: string,
    _brandName: string,
    confidence: number,
  ): string {
    // const normalizedMerchant = this.normalizeBrandName(merchantName);
    // const normalizedBrand = this.normalizeBrandName(brandName);

    if (confidence >= 0.9) {
      return "几乎完全匹配";
    } else if (confidence >= 0.7) {
      return "高度相似";
    } else if (confidence >= 0.5) {
      return "中等相似";
    } else {
      return "部分相似";
    }
  }

  private async createMapping(
    merchantName: string,
    brandId: string,
    confidence: number,
    isConfirmed: boolean,
  ): Promise<BrandMapping> {
    const mapping = await db.brandMapping.upsert({
      where: { merchantName },
      create: {
        merchantName,
        brandId,
        confidence,
        isConfirmed,
      },
      update: {
        brandId,
        confidence,
        isConfirmed,
        updatedAt: new Date(),
      },
      include: { brand: true },
    });

    // 更新缓存
    this.mappingCache.set(merchantName.toLowerCase(), mapping);

    // 如果已确认，更新相关折扣的品牌关联
    if (isConfirmed) {
      await db.discount.updateMany({
        where: { merchantName, brandId: null },
        data: { brandId },
      });
    }

    return mapping;
  }

  private async preloadData(): Promise<void> {
    // 预加载品牌数据
    await this.getAllBrands();

    // 预加载映射数据
    const mappings = await db.brandMapping.findMany({
      include: { brand: true },
    });

    for (const mapping of mappings) {
      this.mappingCache.set(mapping.merchantName.toLowerCase(), mapping);
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.brandCache.clear();
    this.mappingCache.clear();
  }
}

export const brandMatchingService = new BrandMatchingService();
