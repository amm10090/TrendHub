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
   * 解析粘贴的FMTC内容 - 简化版本
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

    // 检测是否为表格格式
    const isTabular = this.isTabularFormat(content);

    if (isTabular) {
      return this.parseTabularContent(content);
    }

    // 逐行解析
    for (let i = 0; i < lines.length; i++) {
      try {
        const discount = this.parseDiscountLine(lines[i]);

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
   * 检测是否为表格格式 (Ultra Think Enhanced)
   */
  private isTabularFormat(content: string): boolean {
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length < 1) return false;

    // 1. 检查传统表头格式
    if (lines.length >= 2) {
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

      if (hasHeaders && hasTabSeparators) {
        return true;
      }
    }

    // 2. 检查单行或多行数据是否包含 "|" 分隔符 (你的格式)
    const hasPipeFormat = lines.some((line) => {
      const parts = line.split("|").map((part) => part.trim());

      return parts.length >= 2 && parts[0] && parts[1];
    });

    if (hasPipeFormat) {
      return true;
    }

    // 3. 检查是否为tab分隔但没有表头的格式
    const hasTabFormat = lines.some((line) => {
      const parts = line.split("\t").map((part) => part.trim());

      return parts.length >= 2 && parts[0] && parts[1];
    });

    return hasTabFormat;
  }

  /**
   * 解析表格格式内容 - 简化版本
   */
  private parseTabularContent(content: string): {
    data: FMTCDiscountData[];
    stats: ParseStats;
  } {
    const rows = this.parseCSVWithQuotes(content);
    const discounts: FMTCDiscountData[] = [];

    // 智能表头检测
    const hasHeaders = this.detectCSVHeaders(rows);
    const startIndex = hasHeaders ? 1 : 0;

    const stats: ParseStats = {
      totalLines: rows.length - startIndex,
      parsedCount: 0,
      errorCount: 0,
      skippedCount: 0,
    };

    // 处理数据行
    for (let i = startIndex; i < rows.length; i++) {
      try {
        const row = rows[i];
        const discount = this.parseCSVRow(row);

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
   * 解析CSV内容，正确处理引号内的换行符和逗号
   */
  private parseCSVWithQuotes(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let i = 0;

    while (i < content.length) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 双引号转义
          currentField += '"';
          i += 2;
          continue;
        } else {
          // 开始或结束引号
          inQuotes = !inQuotes;
        }
      } else if ((char === "," || char === "\t") && !inQuotes) {
        // 字段分隔符
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" && !inQuotes) {
        // 行结束
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some((field) => field.length > 0)) {
            rows.push(currentRow);
          }
        }
        currentRow = [];
        currentField = "";
      } else if (char === "\r") {
        // 忽略回车符
      } else {
        // 普通字符
        currentField += char;
      }

      i++;
    }

    // 处理最后一行
    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * 解析CSV行数据 - 简化版本
   */
  private parseCSVRow(row: string[]): FMTCDiscountData | null {
    if (row.length < 2) {
      return null;
    }

    const [merchant, deal, code, updated, start, end, rating] = row;

    // 清理商家名称
    const merchantName = this.cleanMerchantName(merchant || "");

    if (!merchantName) {
      return null;
    }

    // 清理Deal字段
    const { cleanedText: cleanDeal, dealStatus } = this.cleanDealField(
      deal || "",
    );

    if (!cleanDeal) {
      return null;
    }

    // 解析标题和状态
    const { title } = this.parseDealField(cleanDeal);

    // 解析折扣类型和值
    const { type, value, minAmount, maxAmount } = this.parseDiscountInfo(title);

    // 解析日期
    const fmtcUpdated = this.parseDate(updated || "");
    const startDate = this.parseDate(start || "");
    const endDate = this.parseDate(end || "");

    // 解析评分
    const ratingValue = rating ? parseFloat(rating) : undefined;

    return {
      merchantName: this.ensureSingleLine(merchantName),
      title: this.ensureSingleLine(title),
      code: code && code.trim() ? code.trim() : undefined,
      type,
      value,
      minAmount,
      maxAmount,
      dealStatus: dealStatus ? this.ensureSingleLine(dealStatus) : dealStatus,
      fmtcUpdated,
      startDate,
      endDate,
      rating: isNaN(ratingValue) ? undefined : ratingValue,
    };
  }

  /**
   * 解析表格格式的单行数据 - 简化版本
   */
  private parseTabularLine(line: string): FMTCDiscountData | null {
    let columns: string[] = [];

    // 尝试不同的分隔符
    if (line.includes("|")) {
      columns = line.split("|").map((col) => col.trim());
    } else if (line.includes("\t")) {
      columns = line.split("\t").map((col) => col.trim());
    } else {
      return this.parseSingleLineFormat(line);
    }

    // 至少需要商家和描述
    if (columns.length < 2) {
      return null;
    }

    // 解析列数据
    const merchant = columns[0];
    const deal = columns[1] || "";
    const code = columns[2] || "";
    const updated = columns[3] || "";
    const start = columns[4] || "";
    const end = columns[5] || "";
    const rating = columns[6] || "";

    // 清理商家名称
    const merchantName = this.cleanMerchantName(merchant);

    if (!merchantName) return null;

    // 清理Deal字段
    const { cleanedText: cleanDeal, dealStatus } = this.cleanDealField(deal);

    // 解析标题和状态
    const { title } = this.parseDealField(cleanDeal);

    // 解析折扣类型和值
    const { type, value, minAmount, maxAmount } = this.parseDiscountInfo(title);

    // 解析日期
    const fmtcUpdated = this.parseDate(updated);
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);

    // 解析评分
    const ratingValue = rating ? parseFloat(rating) : undefined;

    return {
      merchantName: this.ensureSingleLine(merchantName),
      title: this.ensureSingleLine(title),
      code: code && code.trim() ? code.trim() : undefined,
      type,
      value,
      minAmount,
      maxAmount,
      dealStatus: dealStatus ? this.ensureSingleLine(dealStatus) : dealStatus,
      fmtcUpdated,
      startDate,
      endDate,
      rating: isNaN(ratingValue) ? undefined : ratingValue,
    };
  }

  /**
   * 解析单行格式 (没有分隔符的情况) - 简化版本
   */
  private parseSingleLineFormat(line: string): FMTCDiscountData | null {
    const trimmedLine = line.trim();

    if (!trimmedLine) return null;

    // 尝试找到品牌名和描述的分隔点
    let merchantName = "";
    let description = "";

    // 查找常见的分隔符
    const separators = [" - ", " – ", " — ", ": ", " | "];
    let found = false;

    for (const sep of separators) {
      if (trimmedLine.includes(sep)) {
        const parts = trimmedLine.split(sep, 2);

        merchantName = parts[0].trim();
        description = parts[1].trim();
        found = true;
        break;
      }
    }

    // 如果没有找到分隔符，尝试从开头提取可能的品牌名
    if (!found) {
      const words = trimmedLine.split(" ");

      if (words.length >= 2) {
        merchantName = words[0];
        if (words[1] && words[1][0] === words[1][0].toUpperCase()) {
          merchantName += " " + words[1];
          description = words.slice(2).join(" ");
        } else {
          description = words.slice(1).join(" ");
        }
      } else {
        merchantName = trimmedLine;
        description = trimmedLine;
      }
    }

    // 清理商家名称
    const cleanMerchant = this.cleanMerchantName(merchantName);

    if (!cleanMerchant) return null;

    // 清理描述字段
    const { cleanedText: cleanDescription, dealStatus } =
      this.cleanDealField(description);

    // 解析描述
    const { title } = this.parseDealField(cleanDescription);
    const { type, value, minAmount, maxAmount } = this.parseDiscountInfo(title);

    return {
      merchantName: this.ensureSingleLine(cleanMerchant),
      title: this.ensureSingleLine(title),
      code: undefined,
      type,
      value,
      minAmount,
      maxAmount,
      dealStatus: dealStatus ? this.ensureSingleLine(dealStatus) : dealStatus,
      fmtcUpdated: undefined,
      startDate: undefined,
      endDate: undefined,
      rating: undefined,
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
   * 解析Deal字段，提取标题和状态 (Ultra Think Enhanced)
   */
  private parseDealField(deal: string): { title: string; dealStatus?: string } {
    // Ultra Think: 基于真实JSON数据的Deal字段解析
    const cleanDeal = deal.trim();

    // Ultra Think: 基于真实数据，所有经过cleanDealField的Deal都已经移除了"new\n"前缀
    // 因此这里的deal应该是纯净的内容，我们总是设置状态为"new"
    return {
      title: cleanDeal,
      dealStatus: "new", // 基于真实数据，所有项目都是new状态
    };
  }

  /**
   * 简化的折扣信息解析 - 检测基本折扣类型和推广类型
   */
  private parseDiscountInfo(title: string): {
    type: DiscountType;
    value?: number;
    minAmount?: number;
    maxAmount?: number;
  } {
    // const titleLower = title.toLowerCase();

    // 移除状态前缀 (new, active等) 来更好地分析内容
    const cleanTitle = title
      .replace(/^(new|active|not started)\s+/i, "")
      .trim();
    const cleanTitleLower = cleanTitle.toLowerCase();

    // 1. 百分比折扣检测 (不区分大小写)
    const percentagePatterns = [
      /(\d+)%\s*off/i,
      /(\d+)\s*percent\s*off/i,
      /save\s+(\d+)%/i,
      /(\d+)%\s*discount/i,
      /get\s+(\d+)%\s*off/i,
      /take\s+(\d+)%\s*off/i,
      /up\s+to\s+(\d+)%\s*off/i,
    ];

    for (const pattern of percentagePatterns) {
      const match = cleanTitle.match(pattern);

      if (match) {
        const value = parseInt(match[1]);

        if (value > 0 && value <= 100) {
          return {
            type: DiscountType.PERCENTAGE,
            value,
          };
        }
      }
    }

    // 2. 固定金额折扣检测
    const fixedAmountPatterns = [
      /[$£€¥](\d+(?:\.\d+)?)\s*off/i,
      /save\s+[$£€¥](\d+(?:\.\d+)?)/i,
      /[$£€¥](\d+(?:\.\d+)?)\s*discount/i,
      /(\d+)\s*dollars?\s*off/i,
      /(\d+)\s*pounds?\s*off/i,
      /(\d+)\s*euros?\s*off/i,
    ];

    for (const pattern of fixedAmountPatterns) {
      const match = cleanTitle.match(pattern);

      if (match) {
        const value = parseFloat(match[1]);

        if (value > 0) {
          return {
            type: DiscountType.FIXED_AMOUNT,
            value,
          };
        }
      }
    }

    // 3. 免运费检测
    const freeShippingPatterns = [
      /free\s+shipping/i,
      /free\s+delivery/i,
      /free\s+express\s+shipping/i,
      /free\s+next\s+day\s+delivery/i,
      /no\s+shipping\s+cost/i,
      /complimentary\s+shipping/i,
    ];

    for (const pattern of freeShippingPatterns) {
      if (pattern.test(cleanTitle)) {
        // 检查是否有最低消费要求
        const minSpendMatch = cleanTitle.match(/[$£€¥](\d+(?:\.\d+)?)/i);

        return {
          type: DiscountType.FREE_SHIPPING,
          minAmount: minSpendMatch ? parseFloat(minSpendMatch[1]) : undefined,
        };
      }
    }

    // 4. 买一送一检测
    const buyGetPatterns = [
      /buy\s+(\d+)\s+get\s+(\d+)\s+free/i,
      /buy\s+one\s+get\s+one/i,
      /bogo/i,
      /buy\s+(\d+),?\s*get\s+(\d+)\s+free/i,
      /(\d+)\s+for\s+(\d+)/i,
      /buy\s+any\s+(\d+)/i,
    ];

    for (const pattern of buyGetPatterns) {
      const match = cleanTitle.match(pattern);

      if (match) {
        if (
          cleanTitleLower.includes("buy one get one") ||
          cleanTitleLower.includes("bogo")
        ) {
          return {
            type: DiscountType.BUY_X_GET_Y,
            value: 1,
            maxAmount: 1,
          };
        }

        return {
          type: DiscountType.BUY_X_GET_Y,
          value: match[1] ? parseInt(match[1]) : undefined,
          maxAmount: match[2] ? parseInt(match[2]) : undefined,
        };
      }
    }

    // 5. 如果包含数字和%符号，但没有匹配到百分比模式，仍然尝试提取
    const basicPercentMatch = cleanTitle.match(/(\d+)%/);

    if (basicPercentMatch) {
      const value = parseInt(basicPercentMatch[1]);

      if (value > 0 && value <= 100) {
        return {
          type: DiscountType.PERCENTAGE,
          value,
        };
      }
    }

    // 6. 如果包含货币符号和数字，但没有匹配到固定金额模式，仍然尝试提取
    const basicAmountMatch = cleanTitle.match(/[$£€¥](\d+(?:\.\d+)?)/i);

    if (basicAmountMatch) {
      const value = parseFloat(basicAmountMatch[1]);

      if (value > 0) {
        return {
          type: DiscountType.FIXED_AMOUNT,
          value,
        };
      }
    }

    // 7. 特殊促销活动检测 - 保持为OTHER但可以添加更多信息
    const promotionPatterns = [
      /shop\s+(new\s+)?arrivals?/i, // 新品上市
      /shop\s+(the\s+)?new\s+/i, // 新品推广
      /shop\s+\w+\s+(collection|series)/i, // 系列推广
      /discover\s+/i, // 发现类推广
      /premium\s+/i, // 高端产品推广
    ];

    for (const pattern of promotionPatterns) {
      if (pattern.test(cleanTitle)) {
        // 这些仍然是OTHER类型，但我们知道它们是推广活动
        return { type: DiscountType.OTHER };
      }
    }

    // 默认返回OTHER类型
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
   * 解析日期字符串 (Ultra Think Enhanced)
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) {
      return undefined;
    }

    // Ultra Think: 处理特殊日期格式
    const lowerDateStr = dateStr.toLowerCase().trim();

    if (
      lowerDateStr.includes("unknown") ||
      lowerDateStr.includes("ongoing") ||
      lowerDateStr === "unknown / ongoing" ||
      lowerDateStr === "ongoing / unknown"
    ) {
      // 这些是有效的特殊日期标识，不视为解析错误
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
      // Ultra Think: 日期解析失败 (避免重复警告)
      this.logDateFormatIssue(dateStr, cleanDateStr, "解析异常");

      return undefined;
    }

    // Ultra Think: 所有格式都匹配失败 (避免重复警告)
    this.logDateFormatIssue(dateStr, cleanDateStr, "格式不匹配");

    return undefined;
  }

  /**
   * 验证解析后的数据 - 优化错误去重和汇总
   */
  validateDiscountData(data: FMTCDiscountData[]): ValidationResult {
    const validData: FMTCDiscountData[] = [];
    const errorStats = new Map<
      string,
      {
        count: number;
        examples: string[];
        category: string;
        suggestion?: string;
      }
    >();

    for (const discount of data) {
      const validation = this.validateSingleDiscount(discount);

      if (validation.isValid) {
        validData.push(discount);
      } else {
        // 收集错误统计信息
        for (const error of validation.errors) {
          if (!errorStats.has(error)) {
            errorStats.set(error, {
              count: 0,
              examples: [],
              category: this.categorizeError(error),
              suggestion: this.getErrorSuggestion(error),
            });
          }

          const stats = errorStats.get(error)!;

          stats.count++;

          // 保存前3个示例商家名称
          if (stats.examples.length < 3) {
            stats.examples.push(discount.merchantName || "未知商家");
          }
        }
      }
    }

    // 生成分类的错误信息
    const errors: string[] = [];
    const errorsByCategory = new Map<string, string[]>();

    for (const [errorMsg, stats] of errorStats.entries()) {
      const { count, examples, category, suggestion } = stats;

      let formattedError = "";

      if (count === 1) {
        formattedError = errorMsg;
      } else {
        const exampleText =
          examples.length > 0
            ? ` (如: ${examples.slice(0, 2).join(", ")}${examples.length > 2 ? " 等" : ""})`
            : "";

        formattedError = `${errorMsg} (${count}个商家)${exampleText}`;
      }

      if (suggestion) {
        formattedError += ` - ${suggestion}`;
      }

      if (!errorsByCategory.has(category)) {
        errorsByCategory.set(category, []);
      }
      errorsByCategory.get(category)!.push(formattedError);
    }

    // 按优先级顺序组织错误信息
    const categoryOrder = ["数据完整性", "日期时间", "数值范围", "其他"];

    for (const category of categoryOrder) {
      const categoryErrors = errorsByCategory.get(category);

      if (categoryErrors && categoryErrors.length > 0) {
        if (errors.length > 0) {
          errors.push(""); // 添加空行分隔
        }
        errors.push(`📋 ${category}问题:`);
        errors.push(...categoryErrors.map((err) => `  • ${err}`));
      }
    }

    return { validData, errors };
  }

  /**
   * 错误分类
   */
  private categorizeError(error: string): string {
    if (error.includes("不能为空")) {
      return "数据完整性";
    }
    if (error.includes("时间") || error.includes("日期")) {
      return "日期时间";
    }
    if (
      error.includes("不能为负数") ||
      error.includes("不能超过") ||
      error.includes("应在")
    ) {
      return "数值范围";
    }

    return "其他";
  }

  /**
   * 错误建议
   */
  private getErrorSuggestion(error: string): string | undefined {
    if (error.includes("开始时间不能晚于结束时间")) {
      return "请检查CSV中的Start和End列";
    }
    if (error.includes("商家名称不能为空")) {
      return "请检查CSV中的Merchant列";
    }
    if (error.includes("折扣标题不能为空")) {
      return "请检查CSV中的Deal列";
    }
    if (error.includes("百分比折扣不能超过100%")) {
      return "请检查折扣值是否正确";
    }
    if (error.includes("评分应在0-100之间")) {
      return "请检查CSV中的Rating列";
    }

    return undefined;
  }

  /**
   * 验证单个折扣数据 - 简化版本
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

    // 基本数值验证
    if (discount.value !== undefined && discount.value < 0) {
      errors.push("折扣值不能为负数");
    }

    // 百分比折扣验证
    if (
      discount.type === DiscountType.PERCENTAGE &&
      discount.value !== undefined
    ) {
      if (discount.value > 100) {
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

    // 评分验证
    if (
      discount.rating !== undefined &&
      (discount.rating < 0 || discount.rating > 100)
    ) {
      errors.push("评分应在0-100之间");
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

  /**
   * 智能CSV表头检测 - 简化版本
   */
  private detectCSVHeaders(rows: string[][]): boolean {
    if (rows.length < 2) return false;

    const firstRow = rows[0];
    const secondRow = rows[1];

    // 检查第一行是否包含典型的表头关键词
    const headerKeywords = [
      "merchant",
      "deal",
      "code",
      "updated",
      "start",
      "end",
      "rating",
    ];
    const firstRowText = firstRow.join(" ").toLowerCase();

    const hasHeaderKeywords = headerKeywords.some((keyword) =>
      firstRowText.includes(keyword),
    );

    // 检查第一行和第二行的数据类型差异
    const firstRowHasText = firstRow.some(
      (field) => field && isNaN(parseFloat(field)) && !field.includes("/"),
    );

    const secondRowHasData =
      secondRow &&
      secondRow.some(
        (field) =>
          field &&
          (field.includes("/") ||
            !isNaN(parseFloat(field)) ||
            field.length > 20),
      );

    return hasHeaderKeywords && firstRowHasText && secondRowHasData;
  }

  /**
   * Ultra Think: 确保字符串为单行 (最终保险措施)
   */
  private ensureSingleLine(text: string): string {
    if (!text) return text;

    return text
      .replace(/[\r\n]+/g, " ") // 移除所有换行符
      .replace(/\s+/g, " ") // 合并多余空格
      .trim(); // 清理首尾空白
  }

  /**
   * Ultra Think: 彻底清理Deal字段，确保单行输出
   */
  private cleanDealField(dealText: string): {
    cleanedText: string;
    dealStatus: string;
  } {
    if (!dealText) return { cleanedText: "", dealStatus: "new" };

    let cleaned = dealText;
    let dealStatus = "new"; // 默认状态

    // 1. 移除外层引号
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // 2. Ultra Think: 处理真实数据中的多种状态前缀
    // 根据JSON数据分析，发现了"new\n"、"not started\n"、"active\n"等格式
    if (cleaned.startsWith("new\n ")) {
      cleaned = cleaned.substring(5); // 移除"new\n "
      dealStatus = "new";
    } else if (cleaned.startsWith("new\n")) {
      cleaned = cleaned.substring(4); // 移除"new\n"
      dealStatus = "new";
    } else if (cleaned.startsWith("not started\n ")) {
      cleaned = cleaned.substring(13); // 移除"not started\n "
      dealStatus = "not started";
    } else if (cleaned.startsWith("not started\n")) {
      cleaned = cleaned.substring(12); // 移除"not started\n"
      dealStatus = "not started";
    } else if (cleaned.startsWith("active\n ")) {
      cleaned = cleaned.substring(8); // 移除"active\n "
      dealStatus = "active";
    } else if (cleaned.startsWith("active\n")) {
      cleaned = cleaned.substring(7); // 移除"active\n"
      dealStatus = "active";
    }

    const cleanedText = cleaned
      // 3. 将剩余的换行符替换为单个空格
      .replace(/[\r\n]+/g, " ")
      // 4. 清理多余的空白字符
      .replace(/\s+/g, " ")
      // 5. 移除首尾空白
      .trim();

    return { cleanedText, dealStatus };
  }

  /**
   * 检查是否为特殊日期格式
   */
  private isSpecialDateFormat(dateStr: string): boolean {
    const lowerDateStr = dateStr.toLowerCase().trim();

    return (
      lowerDateStr.includes("unknown") ||
      lowerDateStr.includes("ongoing") ||
      lowerDateStr === "unknown / ongoing" ||
      lowerDateStr === "ongoing / unknown"
    );
  }
}

export const fmtcParserService = new FMTCParserService();
