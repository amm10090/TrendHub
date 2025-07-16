/**
 * FMTC 商户列表处理器
 */

import type { Page, ElementHandle } from "playwright";
import type { Log } from "crawlee";
import type { FMTCMerchantListData, FMTCMerchantListResult } from "./types.js";
import {
  FMTC_SELECTORS,
  FMTC_URL_PATTERNS,
  FMTC_REGEX_PATTERNS,
} from "./selectors.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";

/**
 * FMTC 商户列表处理器类
 */
export class FMTCMerchantListHandler {
  private page: Page;
  private log: Log;
  private executionId?: string;

  constructor(page: Page, log: Log, executionId?: string) {
    this.page = page;
    this.log = log;
    this.executionId = executionId;
  }

  /**
   * 抓取商户列表 (指定页面)
   */
  async scrapeMerchantList(
    pageNum: number = 1,
  ): Promise<FMTCMerchantListResult> {
    try {
      await this.logMessage(
        LocalScraperLogLevel.INFO,
        `开始抓取商户列表 - 第 ${pageNum} 页`,
      );

      // 1. 导航到指定页面
      await this.navigateToPage(pageNum);

      // 2. 等待页面加载完成
      await this.waitForPageLoad();

      // 3. 抓取商户数据
      const merchants = await this.extractMerchantsFromPage();

      // 4. 获取分页信息
      const pagination = await this.getPaginationInfo();

      // 5. 编译抓取结果
      const result: FMTCMerchantListResult = {
        merchants,
        pagination,
        stats: {
          successCount: merchants.length,
          failureCount: 0,
          totalCount: merchants.length,
        },
      };

      await this.logMessage(
        LocalScraperLogLevel.INFO,
        `第 ${pageNum} 页抓取完成`,
        {
          merchantsCount: merchants.length,
          hasNextPage: pagination.hasNextPage,
          totalPages: pagination.totalPages,
        },
      );

      return result;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        `抓取第 ${pageNum} 页失败`,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );

      return {
        merchants: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 1,
          hasNextPage: false,
        },
        stats: {
          successCount: 0,
          failureCount: 1,
          totalCount: 0,
        },
      };
    }
  }

  /**
   * 获取总页数
   */
  async getTotalPages(): Promise<number> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "获取总页数");

      // 方法1: 从分页导航中获取
      const paginationElement = await this.page.$(
        FMTC_SELECTORS.merchantList.pagination.totalPages,
      );
      if (paginationElement) {
        const totalPagesText = await paginationElement.textContent();
        if (totalPagesText) {
          const numbers = totalPagesText.match(FMTC_REGEX_PATTERNS.NUMBERS);
          if (numbers && numbers.length > 0) {
            return parseInt(numbers[numbers.length - 1]);
          }
        }
      }

      // 方法2: 从页面链接中获取最大页数
      const pageLinks = await this.page.$$(
        FMTC_SELECTORS.merchantList.pagination.pageLinks,
      );
      let maxPage = 1;

      for (const link of pageLinks) {
        const href = await link.getAttribute("href");
        const text = await link.textContent();

        if (href) {
          const pageMatch = href.match(/page[/=](\d+)/i);
          if (pageMatch) {
            maxPage = Math.max(maxPage, parseInt(pageMatch[1]));
          }
        }

        if (text && /^\d+$/.test(text.trim())) {
          maxPage = Math.max(maxPage, parseInt(text.trim()));
        }
      }

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        `检测到总页数: ${maxPage}`,
      );
      return maxPage;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.WARN,
        "获取总页数失败，使用默认值",
        {
          error: (error as Error).message,
        },
      );
      return 1;
    }
  }

  /**
   * 导航到指定页面
   */
  async navigateToPage(pageNum: number): Promise<void> {
    try {
      let targetUrl = FMTC_URL_PATTERNS.DEFAULT_MERCHANT_LIST;

      if (pageNum > 1) {
        // 构建分页URL (假设使用标准的分页参数)
        const url = new URL(targetUrl);
        url.searchParams.set("page", pageNum.toString());
        targetUrl = url.toString();
      }

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        `导航到第 ${pageNum} 页`,
        {
          url: targetUrl,
        },
      );

      await this.page.goto(targetUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // 额外等待确保动态内容加载
      await delay(2000);
    } catch (error) {
      throw new Error(
        `导航到第 ${pageNum} 页失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 等待页面加载完成
   */
  private async waitForPageLoad(): Promise<void> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "等待商户列表页面加载");

      // 等待商户行出现
      await this.page.waitForSelector(
        FMTC_SELECTORS.merchantList.merchantRows,
        {
          timeout: 15000,
        },
      );

      // 等待一段时间确保所有内容加载完成
      await delay(1000);

      await this.logMessage(LocalScraperLogLevel.DEBUG, "商户列表页面加载完成");
    } catch (error) {
      throw new Error(`等待页面加载失败: ${(error as Error).message}`);
    }
  }

  /**
   * 从页面提取商户数据
   */
  private async extractMerchantsFromPage(): Promise<FMTCMerchantListData[]> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "开始提取商户数据");

      const merchants: FMTCMerchantListData[] = [];

      // 获取所有商户行
      const merchantRows = await this.page.$$(
        FMTC_SELECTORS.merchantList.merchantRows,
      );

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        `找到 ${merchantRows.length} 个商户行`,
      );

      for (let i = 0; i < merchantRows.length; i++) {
        try {
          const row = merchantRows[i];
          const merchant = await this.extractMerchantFromRow(row, i);

          if (merchant) {
            merchants.push(merchant);
            await this.logMessage(
              LocalScraperLogLevel.DEBUG,
              `成功提取商户: ${merchant.name}`,
              {
                index: i,
                merchant: merchant.name,
              },
            );
          }
        } catch (error) {
          await this.logMessage(
            LocalScraperLogLevel.WARN,
            `提取第 ${i} 个商户失败`,
            {
              error: (error as Error).message,
            },
          );
        }
      }

      await this.logMessage(LocalScraperLogLevel.INFO, `商户数据提取完成`, {
        totalMerchants: merchants.length,
        totalRows: merchantRows.length,
      });

      return merchants;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "提取商户数据失败", {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * 从单行提取商户数据
   */
  private async extractMerchantFromRow(
    row: ElementHandle,
    index: number,
  ): Promise<FMTCMerchantListData | null> {
    try {
      const merchant: Partial<FMTCMerchantListData> = {};

      // 获取所有表格单元格
      const cells = await row.$$("td");

      if (cells.length < 6) {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          `第 ${index} 行数据列数不足 (${cells.length} < 6)，跳过`,
        );
        return null;
      }

      // 根据真实HTML结构解析：
      // cells[0] = Favorite Merchant (收藏按钮)
      // cells[1] = Name (商户名称)
      // cells[2] = Country (国家)
      // cells[3] = Network (网络)
      // cells[4] = Date Added (添加日期)
      // cells[5] = Premium Feed Deals (优惠数量)

      // 第1列：Name (包含链接到详情页)
      const nameCell = cells[1];
      const nameLink = await nameCell.$("a");
      if (nameLink) {
        merchant.name = (await nameLink.textContent())?.trim() || "";
        // 构建完整的详情URL
        const href = await nameLink.getAttribute("href");
        if (href && href.startsWith("/")) {
          merchant.detailUrl = `https://account.fmtc.co${href}`;
        } else {
          merchant.detailUrl = href || "";
        }
      } else {
        merchant.name = (await nameCell.textContent())?.trim() || "";
      }

      // 第2列：Country
      const countryText = (await cells[2].textContent())?.trim() || "";
      merchant.country = countryText || undefined;

      // 第3列：Network
      const networkText = (await cells[3].textContent())?.trim() || "";
      merchant.network = networkText || undefined;

      // 第4列：Date Added
      const dateText = (await cells[4].textContent())?.trim() || "";
      merchant.dateAdded = this.parseDate(dateText);

      // 第5列：Premium Feed Deals (优惠数量)
      const premiumCell = cells[5];
      const premiumText = (await premiumCell.textContent())?.trim() || "";
      const premiumLink = await premiumCell.$("a");
      if (premiumLink) {
        const linkText = (await premiumLink.textContent())?.trim() || "";
        const numbers = linkText.match(FMTC_REGEX_PATTERNS.NUMBERS);
        if (numbers && numbers.length > 0) {
          merchant.premiumSubscriptions = parseInt(numbers[0]);
        }
      } else {
        const numbers = premiumText.match(FMTC_REGEX_PATTERNS.NUMBERS);
        if (numbers && numbers.length > 0) {
          merchant.premiumSubscriptions = parseInt(numbers[0]);
        }
      }

      // 验证必需字段
      if (!merchant.name || merchant.name.trim() === "") {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          `第 ${index} 行缺少商户名称，跳过`,
        );
        return null;
      }

      // 清理数据
      const cleanedMerchant: FMTCMerchantListData = {
        name: merchant.name.trim(),
        country: merchant.country?.trim() || undefined,
        network: merchant.network?.trim() || undefined,
        dateAdded: merchant.dateAdded,
        premiumSubscriptions: merchant.premiumSubscriptions || 0,
        detailUrl: merchant.detailUrl || undefined,
      };

      // 添加调试日志
      await this.logMessage(LocalScraperLogLevel.DEBUG, `解析商户数据`, {
        name: cleanedMerchant.name,
        country: cleanedMerchant.country,
        network: cleanedMerchant.network,
        dateAdded: cleanedMerchant.dateAdded,
        premiumSubscriptions: cleanedMerchant.premiumSubscriptions,
        detailUrl: cleanedMerchant.detailUrl,
        rawNetworkText: networkText,
      });

      return cleanedMerchant;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.WARN,
        `解析第 ${index} 行数据失败`,
        {
          error: (error as Error).message,
        },
      );
      return null;
    }
  }

  /**
   * 获取分页信息
   */
  private async getPaginationInfo(): Promise<
    FMTCMerchantListResult["pagination"]
  > {
    try {
      // 获取当前页码
      let currentPage = 1;
      const currentPageElement = await this.page.$(
        FMTC_SELECTORS.merchantList.pagination.currentPage,
      );
      if (currentPageElement) {
        const currentPageText = await currentPageElement.textContent();
        if (currentPageText && /^\d+$/.test(currentPageText.trim())) {
          currentPage = parseInt(currentPageText.trim());
        }
      }

      // 获取总页数
      const totalPages = await this.getTotalPages();

      // 检查是否有下一页
      const nextButton = await this.page.$(
        FMTC_SELECTORS.merchantList.pagination.nextButton,
      );
      const hasNextPage = nextButton !== null && currentPage < totalPages;

      // 获取下一页URL
      let nextPageUrl: string | undefined;
      if (hasNextPage && nextButton) {
        nextPageUrl = (await nextButton.getAttribute("href")) || undefined;
        if (nextPageUrl && !nextPageUrl.startsWith("http")) {
          nextPageUrl = new URL(
            nextPageUrl,
            "https://account.fmtc.co",
          ).toString();
        }
      }

      return {
        currentPage,
        totalPages,
        hasNextPage,
        nextPageUrl,
      };
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "获取分页信息失败", {
        error: (error as Error).message,
      });

      return {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
      };
    }
  }

  /**
   * 解析日期字符串
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      const trimmed = dateStr.trim();
      if (!trimmed) return undefined;

      // 尝试匹配常见日期格式
      const dateMatch = trimmed.match(FMTC_REGEX_PATTERNS.DATE);
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }

      // 尝试直接解析
      const directParse = new Date(trimmed);
      if (!isNaN(directParse.getTime())) {
        return directParse;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 检查是否还有更多页面
   */
  async hasNextPage(): Promise<boolean> {
    try {
      const pagination = await this.getPaginationInfo();
      return pagination.hasNextPage;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "检查下一页失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 获取商户数量统计
   */
  async getMerchantCount(): Promise<number> {
    try {
      const merchantRows = await this.page.$$(
        FMTC_SELECTORS.merchantList.merchantRows,
      );
      return merchantRows.length;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "获取商户数量失败", {
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * 记录日志消息
   */
  private async logMessage(
    level: LocalScraperLogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    this.log.info(`[FMTC MerchantList] ${message}`);

    if (this.executionId) {
      await sendLogToBackend(
        this.executionId,
        level,
        `[FMTC MerchantList] ${message}`,
        context,
      );
    }
  }
}
