import { DiscountType } from "@prisma/client";

// FMTC折扣数据接口
export interface FMTCDiscountData {
  merchantName: string;
  title: string;
  code?: string;
  type: DiscountType;
  value?: number;
  dealStatus?: string;
  fmtcUpdated?: Date;
  startDate?: Date;
  endDate?: Date;
  rating?: number;
  minAmount?: number;
  maxAmount?: number;
  originalUrl?: string;
}

// 验证结果接口
export interface ValidationResult {
  validData: FMTCDiscountData[];
  errors: string[];
}

// 解析统计接口
export interface ParseStats {
  totalLines: number;
  parsedCount: number;
  errorCount: number;
  skippedCount: number;
}

export class FMTCParserService {
  private readonly DATE_FORMATS = [
    // FMTC常见日期格式
    /(\d{2})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})([ap]m)\s+(PDT|PST)/i,
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})([ap]m)\s+(PDT|PST)/i,
    /(\d{2})\/(\d{2})\/(\d{2})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
  ];

  /**
   * 解析粘贴的FMTC内容
   */
  async parsePastedContent(content: string): Promise<{
    data: FMTCDiscountData[];
    stats: ParseStats;
  }> {
    const lines = content.split("\n").filter((line) => line.trim());
    const discounts: FMTCDiscountData[] = [];
    const stats: ParseStats = {
      totalLines: lines.length,
      parsedCount: 0,
      errorCount: 0,
      skippedCount: 0,
    };

    // 检测是否为表格格式 (tab分隔)
    if (this.isTabularFormat(content)) {
      return this.parseTabularContent(content);
    }

    // 逐行解析
    for (const line of lines) {
      try {
        const discount = this.parseDiscountLine(line);

        if (discount) {
          discounts.push(discount);
          stats.parsedCount++;
        } else {
          stats.skippedCount++;
        }
      } catch {
        stats.errorCount++;
      }
    }

    return { data: discounts, stats };
  }

  /**
   * 检测是否为表格格式
   */
  private isTabularFormat(content: string): boolean {
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length < 2) return false;

    // 检查第一行是否包含表头
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = [
      "merchant",
      "deal",
      "code",
      "updated",
      "start",
      "end",
      "rating",
    ].some((header) => firstLine.includes(header));

    // 检查是否使用tab分隔符
    const hasTabSeparators = lines
      .slice(0, 3)
      .every((line) => line.split("\t").length >= 4);

    return hasHeaders && hasTabSeparators;
  }

  /**
   * 解析表格格式内容
   */
  private parseTabularContent(content: string): {
    data: FMTCDiscountData[];
    stats: ParseStats;
  } {
    const lines = content.split("\n").filter((line) => line.trim());
    const discounts: FMTCDiscountData[] = [];
    const stats: ParseStats = {
      totalLines: lines.length - 1, // 排除表头
      parsedCount: 0,
      errorCount: 0,
      skippedCount: 0,
    };

    // 跳过表头，处理数据行
    for (let i = 1; i < lines.length; i++) {
      try {
        const discount = this.parseTabularLine(lines[i]);

        if (discount) {
          discounts.push(discount);
          stats.parsedCount++;
        } else {
          stats.skippedCount++;
        }
      } catch {
        stats.errorCount++;
      }
    }

    return { data: discounts, stats };
  }

  /**
   * 解析表格格式的单行数据
   */
  private parseTabularLine(line: string): FMTCDiscountData | null {
    const columns = line.split("\t").map((col) => col.trim());

    if (columns.length < 4) {
      return null;
    }

    const [merchant, deal, code, updated, start, end, rating] = columns;

    // 清理商家名称
    const merchantName = this.cleanMerchantName(merchant);

    if (!merchantName) return null;

    // 解析标题和状态
    const { title, dealStatus } = this.parseDealField(deal);

    // 解析折扣类型和值
    const { type, value, minAmount, maxAmount } = this.parseDiscountInfo(title);

    // 解析日期
    const fmtcUpdated = this.parseDate(updated);
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);

    // 解析评分
    const ratingValue = rating ? parseFloat(rating) : undefined;

    return {
      merchantName,
      title: title.trim(),
      code: code && code !== "" ? code : undefined,
      type,
      value,
      minAmount,
      maxAmount,
      dealStatus,
      fmtcUpdated,
      startDate,
      endDate,
      rating: ratingValue,
    };
  }

  /**
   * 清理商家名称
   */
  private cleanMerchantName(merchant: string): string {
    return merchant
      .replace(/\s+(US|UK|CA|AU)$/i, "") // 移除国家后缀
      .trim();
  }

  /**
   * 解析Deal字段，提取标题和状态
   */
  private parseDealField(deal: string): { title: string; dealStatus?: string } {
    // 匹配状态 (如 "new", "not started", "active")
    const statusMatch = deal.match(
      /^"?([^"]*?)\s+(new|not started|active|ended)/i,
    );

    if (statusMatch) {
      return {
        title: statusMatch[1].trim(),
        dealStatus: statusMatch[2].toLowerCase(),
      };
    }

    // 移除引号并返回原始内容
    return {
      title: deal.replace(/^"?(.+?)"?$/, "$1"),
    };
  }

  /**
   * 从标题中解析折扣信息
   */
  private parseDiscountInfo(title: string): {
    type: DiscountType;
    value?: number;
    minAmount?: number;
    maxAmount?: number;
  } {
    const titleLower = title.toLowerCase();

    // 百分比折扣
    const percentMatch = title.match(/(\d+)%\s*off/i);

    if (percentMatch) {
      return {
        type: DiscountType.PERCENTAGE,
        value: parseInt(percentMatch[1]),
      };
    }

    // 固定金额折扣
    const amountMatch = title.match(/[¥$£€](\d+)\s*off/i);

    if (amountMatch) {
      return {
        type: DiscountType.FIXED_AMOUNT,
        value: parseInt(amountMatch[1]),
      };
    }

    // 满减优惠
    const tieredMatch = title.match(/[¥$£€](\d+)\s*off.*?[¥$£€](\d+)/i);

    if (tieredMatch) {
      return {
        type: DiscountType.FIXED_AMOUNT,
        value: parseInt(tieredMatch[1]),
        minAmount: parseInt(tieredMatch[2]),
      };
    }

    // 免费送货
    if (
      titleLower.includes("free shipping") ||
      titleLower.includes("free delivery")
    ) {
      return { type: DiscountType.FREE_SHIPPING };
    }

    // 买X送Y
    if (
      titleLower.includes("buy") &&
      (titleLower.includes("get") || titleLower.includes("free"))
    ) {
      return { type: DiscountType.BUY_X_GET_Y };
    }

    return { type: DiscountType.OTHER };
  }

  /**
   * 解析单行折扣信息 (非表格格式)
   */
  private parseDiscountLine(line: string): FMTCDiscountData | null {
    // 正则表达式匹配常见格式
    const patterns = [
      // "品牌名 - 20% OFF - CODE20 - 截止 2024-12-31"
      /^(.+?)\s*-\s*(.+?)\s*-\s*([A-Z0-9]+)\s*-\s*(.+)$/i,
      // "品牌名: 折扣描述 (CODE)"
      /^(.+?):\s*(.+?)\s*\(([A-Z0-9]+)\)$/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match) {
        return this.extractDiscountFromMatch(match);
      }
    }

    return null;
  }

  /**
   * 从正则匹配结果提取折扣信息
   */
  private extractDiscountFromMatch(match: RegExpMatchArray): FMTCDiscountData {
    const merchantName = this.cleanMerchantName(match[1]);
    const title = match[2].trim();
    const code = match[3];
    const { type, value, minAmount, maxAmount } = this.parseDiscountInfo(title);

    return {
      merchantName,
      title,
      code,
      type,
      value,
      minAmount,
      maxAmount,
    };
  }

  /**
   * 解析日期字符串
   */
  private parseDate(dateStr: string): Date | undefined {
    if (
      !dateStr ||
      dateStr.toLowerCase().includes("unknown") ||
      dateStr.toLowerCase().includes("ongoing")
    ) {
      return undefined;
    }

    // 移除多余的引号和空白
    const cleanDateStr = dateStr.replace(/"/g, "").trim();

    for (const format of this.DATE_FORMATS) {
      const match = cleanDateStr.match(format);

      if (match) {
        try {
          // 根据匹配的格式构建日期
          if (match.length >= 4) {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);
            let year = parseInt(match[3]);

            // 处理2位年份
            if (year < 100) {
              year = year < 50 ? 2000 + year : 1900 + year;
            }

            // 基础日期验证
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const date = new Date(year, month - 1, day);

              // 如果有时间信息，添加时间
              if (match.length >= 7) {
                let hour = parseInt(match[4]);
                const minute = parseInt(match[5]);
                const ampm = match[6].toLowerCase();

                if (ampm === "pm" && hour !== 12) hour += 12;
                if (ampm === "am" && hour === 12) hour = 0;

                date.setHours(hour, minute, 0, 0);
              }

              return date;
            }
          }
        } catch {
          // 忽略时间解析错误
        }
      }
    }

    // 尝试直接解析
    try {
      const date = new Date(cleanDateStr);

      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  /**
   * 验证解析后的数据
   */
  validateDiscountData(data: FMTCDiscountData[]): ValidationResult {
    const errors: string[] = [];
    const validData: FMTCDiscountData[] = [];

    for (const discount of data) {
      const validation = this.validateSingleDiscount(discount);

      if (validation.isValid) {
        validData.push(discount);
      } else {
        errors.push(...validation.errors);
      }
    }

    return { validData, errors };
  }

  /**
   * 验证单个折扣数据
   */
  private validateSingleDiscount(discount: FMTCDiscountData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 必填字段验证
    if (!discount.merchantName?.trim()) {
      errors.push("商家名称不能为空");
    }

    if (!discount.title?.trim()) {
      errors.push("折扣标题不能为空");
    }

    // 数值验证
    if (
      discount.value !== undefined &&
      (discount.value < 0 || discount.value > 100)
    ) {
      if (discount.type === DiscountType.PERCENTAGE && discount.value > 100) {
        errors.push("百分比折扣不能超过100%");
      }
    }

    // 日期验证
    if (
      discount.startDate &&
      discount.endDate &&
      discount.startDate > discount.endDate
    ) {
      errors.push("开始时间不能晚于结束时间");
    }

    // 过期检查
    if (discount.endDate && discount.endDate < new Date()) {
      // 这是警告，不阻止导入，但会标记为过期
      return {
        isValid: true,
        errors: [],
      };
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 格式化解析统计信息
   */
  formatStats(stats: ParseStats): string {
    return `解析完成: 总计 ${stats.totalLines} 行，成功 ${stats.parsedCount} 个，错误 ${stats.errorCount} 个，跳过 ${stats.skippedCount} 个`;
  }
}

export const fmtcParserService = new FMTCParserService();
