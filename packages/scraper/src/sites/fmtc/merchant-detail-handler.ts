/**
 * FMTC 商户详情处理器
 */

import type { Page } from "playwright";
import type { Log } from "crawlee";
import * as fs from "fs";
import * as path from "path";
import type {
  FMTCMerchantDetailData,
  FMTCMerchantDetailResult,
  FMTCMerchantNetworkData,
  FMTCImageDownloadResult,
  FMTCNetworkStatus,
} from "./types.js";
import { FMTC_SELECTORS, FMTC_REGEX_PATTERNS } from "./selectors.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";

/**
 * FMTC 商户详情处理器类
 */
export class FMTCMerchantDetailHandler {
  private page: Page;
  private log: Log;
  private executionId?: string;
  private downloadDir?: string;

  constructor(
    page: Page,
    log: Log,
    executionId?: string,
    downloadDir?: string,
  ) {
    this.page = page;
    this.log = log;
    this.executionId = executionId;
    this.downloadDir = downloadDir;
  }

  /**
   * 抓取商户详情信息
   */
  async scrapeMerchantDetails(
    merchantUrl: string,
    merchantName?: string,
  ): Promise<FMTCMerchantDetailResult> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, `开始抓取商户详情`, {
        merchantName,
        url: merchantUrl,
      });

      // 1. 导航到商户详情页面
      await this.navigateToDetailPage(merchantUrl);

      // 2. 等待页面加载完成
      await this.waitForDetailPageLoad();

      // 3. 提取商户详情数据
      const merchantDetail = await this.extractMerchantDetails();

      // 4. 提取网络关联信息
      merchantDetail.networks = await this.extractNetworks();

      // 5. 如果启用了图片下载，下载商户图片
      if (this.downloadDir) {
        await this.downloadMerchantImages(
          merchantDetail,
          merchantName || "unknown",
        );
      }

      const result: FMTCMerchantDetailResult = {
        merchantDetail,
        success: true,
        scrapedAt: new Date(),
      };

      await this.logMessage(LocalScraperLogLevel.INFO, `商户详情抓取完成`, {
        merchantName: merchantName || merchantDetail.homepage,
        fmtcId: merchantDetail.fmtcId,
        networksCount: merchantDetail.networks?.length || 0,
      });

      return result;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, `抓取商户详情失败`, {
        merchantName,
        url: merchantUrl,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      return {
        merchantDetail: {},
        success: false,
        error: (error as Error).message,
        scrapedAt: new Date(),
      };
    }
  }

  /**
   * 导航到商户详情页面
   */
  private async navigateToDetailPage(merchantUrl: string): Promise<void> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "导航到商户详情页面", {
        url: merchantUrl,
      });

      await this.page.goto(merchantUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // 额外等待确保动态内容加载
      await delay(2000);
    } catch (error) {
      throw new Error(`导航到商户详情页面失败: ${(error as Error).message}`);
    }
  }

  /**
   * 等待详情页面加载完成
   */
  private async waitForDetailPageLoad(): Promise<void> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "等待商户详情页面加载");

      // 等待任一关键元素出现
      await this.page.waitForSelector(
        [
          FMTC_SELECTORS.merchantDetail.homepage,
          ".merchant-info",
          ".program-info",
          "table",
        ].join(", "),
        {
          timeout: 15000,
        },
      );

      // 等待额外时间确保所有内容加载
      await delay(1500);

      await this.logMessage(LocalScraperLogLevel.DEBUG, "商户详情页面加载完成");
    } catch (error) {
      throw new Error(`等待详情页面加载失败: ${(error as Error).message}`);
    }
  }

  /**
   * 提取商户详情数据
   */
  private async extractMerchantDetails(): Promise<FMTCMerchantDetailData> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "开始提取商户详情数据");

      const detail: FMTCMerchantDetailData = {};

      // 首先添加调试信息，检查页面结构
      const pageStructure = await this.page.evaluate(() => {
        const debug = {
          url: window.location.href,
          title: document.title,
          sectionsCount: document.querySelectorAll("section").length,
          sections: [] as string[],
          hasTable: !!document.querySelector("table"),
          tableCount: document.querySelectorAll("table").length,
        };

        // 收集所有section的标题
        const sections = document.querySelectorAll("section");
        sections.forEach((section, index) => {
          const h3 = section.querySelector("h3");
          const title = h3
            ? h3.textContent?.trim()
            : `Section ${index + 1} (no h3)`;
          debug.sections.push(title || `Section ${index + 1}`);
        });

        return debug;
      });

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        "页面结构调试信息",
        pageStructure,
      );

      // 使用页面评估来批量提取所有信息 - 修复选择器问题
      const extractedData = await this.page.evaluate(() => {
        const data: Record<string, unknown> = {};

        // 查找包含"Merchant Information"标题的section
        const sections = document.querySelectorAll("section");
        let merchantInfoSection = null;
        let toolsSection = null;

        for (const section of sections) {
          const h3 = section.querySelector("h3");
          if (h3) {
            const text = h3.textContent || "";
            if (text.includes("Merchant Information")) {
              merchantInfoSection = section;
            } else if (text.includes("Tools")) {
              toolsSection = section;
            }
          }
        }

        // 提取Merchant Information部分的数据
        if (merchantInfoSection) {
          const merchantInfoItems =
            merchantInfoSection.querySelectorAll(".list-group-item");

          merchantInfoItems.forEach((item) => {
            const text = item.textContent || "";

            // Homepage
            if (text.includes("Homepage:")) {
              const link =
                item.querySelector(".ml-5 a") ||
                item.querySelector("span.ml-5 a");
              if (link) {
                data.homepage = (link as HTMLAnchorElement).href;
              }
            }

            // Primary Category
            if (text.includes("Primary Category:")) {
              const span =
                item.querySelector(".ml-5") || item.querySelector("span.ml-5");
              if (span) {
                data.primaryCategory = span.textContent?.trim();
              }
            }

            // Primary Country
            if (text.includes("Primary Country:")) {
              const span =
                item.querySelector(".ml-5") || item.querySelector("span.ml-5");
              if (span) {
                data.primaryCountry = span.textContent?.trim();
              }
            }

            // Ships To
            if (text.includes("Ships To:")) {
              const span =
                item.querySelector(".ml-5") || item.querySelector("span.ml-5");
              if (span) {
                data.shipsTo = span.textContent?.trim();
              }
            }

            // Logo (在商户信息中)
            if (text.includes("Logo:")) {
              const img = item.querySelector("img");
              if (img) {
                data.logoInMerchantInfo = (img as HTMLImageElement).src;
              }
            }
          });
        }

        // 从Tools部分提取图片链接
        if (toolsSection) {
          // 查找包含特定文本的链接
          const allLinks = toolsSection.querySelectorAll("a");

          for (const link of allLinks) {
            const linkText = link.textContent || "";

            if (linkText.includes("120x60 Logo")) {
              data.logo120x60 = (link as HTMLAnchorElement).href;
            } else if (linkText.includes("88x31 Logo")) {
              data.logo88x31 = (link as HTMLAnchorElement).href;
            } else if (linkText.includes("280x210 Screenshot")) {
              data.screenshot280x210 = (link as HTMLAnchorElement).href;
            } else if (linkText.includes("600x450 Screenshot")) {
              data.screenshot600x450 = (link as HTMLAnchorElement).href;
            } else if (linkText.includes("Preview Deals")) {
              const rel = link.getAttribute("rel");
              if (rel) {
                data.previewDealsUrl = `https://account.fmtc.co${rel}`;
              }
            }
          }

          // AW URL (联盟链接) - 查找包含AW URL文本的列表项
          const allListItems = toolsSection.querySelectorAll("li");
          for (const item of allListItems) {
            const text = item.textContent || "";
            if (text.includes("AW URL:")) {
              const awLink = item.querySelector("a");
              if (awLink) {
                data.affiliateUrl = (awLink as HTMLAnchorElement).href;
              }
            }
          }
        }

        // 检查FreshReach支持 - 查找包含FreshReach文本的span
        const spans = document.querySelectorAll("span.label");
        for (const span of spans) {
          const text = span.textContent || "";
          if (text.includes("FreshReach")) {
            data.freshReachSupported = text.toLowerCase().includes("supported");
            break;
          }
        }

        // 从URL中提取FMTC ID
        const currentUrl = window.location.href;
        const urlMatch = currentUrl.match(/\/m\/(\d+)\//);
        if (urlMatch) {
          data.fmtcId = urlMatch[1];
        }

        // 添加调试信息
        data._debug = {
          merchantInfoSectionFound: !!merchantInfoSection,
          toolsSectionFound: !!toolsSection,
          sectionsCount: document.querySelectorAll("section").length,
          listGroupItemsCount: merchantInfoSection
            ? merchantInfoSection.querySelectorAll(".list-group-item").length
            : 0,
          toolsLinksCount: toolsSection
            ? toolsSection.querySelectorAll("a").length
            : 0,
        };

        return data;
      });

      // 映射提取的数据到detail对象
      detail.homepage = extractedData.homepage;
      detail.primaryCategory = extractedData.primaryCategory;
      detail.primaryCountry = extractedData.primaryCountry;

      // 处理配送地区
      if (extractedData.shipsTo) {
        detail.shipsTo = extractedData.shipsTo
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s);
      }

      detail.fmtcId = extractedData.fmtcId;
      detail.freshReachSupported = extractedData.freshReachSupported;

      // 图片URLs - 优先使用Tools部分的链接，如果没有则使用商户信息中的
      detail.logo120x60 =
        extractedData.logo120x60 || extractedData.logoInMerchantInfo;
      detail.logo88x31 = extractedData.logo88x31;
      detail.screenshot280x210 = extractedData.screenshot280x210;
      detail.screenshot600x450 = extractedData.screenshot600x450;

      // 链接
      detail.affiliateUrl = extractedData.affiliateUrl;
      detail.previewDealsUrl = extractedData.previewDealsUrl;

      await this.logMessage(LocalScraperLogLevel.DEBUG, "数据提取调试信息", {
        extractedDataDebug: extractedData._debug,
        extractedFields: Object.keys(extractedData).filter(
          (key) => key !== "_debug",
        ),
        extractedData: extractedData,
      });

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        "商户详情数据提取完成",
        {
          homepage: detail.homepage,
          fmtcId: detail.fmtcId,
          primaryCategory: detail.primaryCategory,
          hasLogos: !!(detail.logo120x60 || detail.logo88x31),
          hasScreenshots: !!(
            detail.screenshot280x210 || detail.screenshot600x450
          ),
        },
      );

      return detail;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "提取商户详情数据失败",
        {
          error: (error as Error).message,
        },
      );
      return {};
    }
  }

  /**
   * 提取网络关联信息
   */
  async extractNetworks(): Promise<FMTCMerchantNetworkData[]> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "开始提取网络关联信息");

      const networks: FMTCMerchantNetworkData[] = [];

      // 使用页面评估来提取网络表格数据 - 修复选择器问题
      const networkData = await this.page.evaluate(() => {
        const networkList: Array<{
          fmtcId: string;
          networkName: string;
          networkId: string;
          status: string;
          joinUrl?: string;
        }> = [];

        // 查找包含"Networks"标题的section
        const sections = document.querySelectorAll("section");
        let networkSection = null;

        for (const section of sections) {
          const h3 = section.querySelector("h3");
          if (h3) {
            const text = h3.textContent || "";
            if (text.includes("Networks")) {
              networkSection = section;
              break;
            }
          }
        }

        if (!networkSection) {
          return networkList;
        }

        // 查找网络关联表格
        const networkTable =
          networkSection.querySelector("table.fmtc-table tbody") ||
          networkSection.querySelector("table tbody") ||
          networkSection.querySelector(".table tbody");

        if (!networkTable) {
          return networkList;
        }

        const rows = networkTable.querySelectorAll("tr");

        rows.forEach((row, index) => {
          try {
            const cells = row.querySelectorAll("td");
            if (cells.length < 4) {
              return; // 跳过列数不足的行
            }

            // 第2列：FMTC ID
            const fmtcIdCell = cells[1];
            const fmtcIdText = fmtcIdCell.textContent?.trim() || "";
            const fmtcIdMatch = fmtcIdText.match(/(\d+)/);
            const fmtcId = fmtcIdMatch ? fmtcIdMatch[1] : "";

            // 第3列：Network (ID) - 格式如 "AL (35601)"
            const networkCell = cells[2];
            const networkText = networkCell.textContent?.trim() || "";

            let networkName = "";
            let networkId = "";

            // 解析网络名称和ID - 格式: "AL (35601)"
            const networkMatch = networkText.match(/^(.+?)\s*\((\d+)\)$/);
            if (networkMatch) {
              networkName = networkMatch[1].trim();
              networkId = networkMatch[2];
            } else {
              networkName = networkText; // 如果没有匹配到括号格式，直接使用整个文本
            }

            // 第4列：Status - 通过badge的class判断状态
            const statusCell = cells[3];
            const badge = statusCell.querySelector(".badge");
            let status = "Not Joined"; // 默认状态

            if (badge) {
              const badgeClasses = badge.className;
              if (badgeClasses.includes("badge-success")) {
                status = "Joined";
              } else if (badgeClasses.includes("badge-warning")) {
                status = "Relationship Not Verified";
              } else if (badgeClasses.includes("badge-danger")) {
                status = "Not Joined";
              }
            }

            // 第5列：Join按钮URL (如果存在)
            const joinCell = cells[4];
            const joinLink = joinCell ? joinCell.querySelector("a") : null;
            const joinUrl = joinLink
              ? (joinLink as HTMLAnchorElement).href
              : undefined;

            if (networkName) {
              // 只有当网络名称存在时才添加
              networkList.push({
                fmtcId,
                networkName,
                networkId,
                status,
                joinUrl,
              });
            }
          } catch (error) {
            console.warn(`解析第 ${index} 行网络数据失败:`, error);
          }
        });

        // 添加调试信息
        const debugInfo = {
          networkSectionFound: !!networkSection,
          tableFound: !!networkTable,
          rowsCount: networkTable
            ? networkTable.querySelectorAll("tr").length
            : 0,
          sectionsChecked: sections.length,
          networkListLength: networkList.length,
        };

        return { networkList, debugInfo };
      });

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        "网络数据提取调试信息",
        networkData.debugInfo,
      );

      // 转换为FMTCMerchantNetworkData格式
      for (const item of networkData.networkList) {
        const networkInfo: FMTCMerchantNetworkData = {
          networkName: item.networkName,
          networkId: item.networkId,
          status: item.status as FMTCNetworkStatus,
          fmtcId: item.fmtcId,
          joinUrl: item.joinUrl,
        };

        networks.push(networkInfo);

        await this.logMessage(LocalScraperLogLevel.DEBUG, `提取网络关联`, {
          fmtcId: networkInfo.fmtcId,
          networkName: networkInfo.networkName,
          networkId: networkInfo.networkId,
          status: networkInfo.status,
          hasJoinUrl: !!networkInfo.joinUrl,
        });
      }

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        `网络关联信息提取完成`,
        {
          networksCount: networks.length,
        },
      );

      return networks;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "提取网络关联信息失败",
        {
          error: (error as Error).message,
        },
      );
      return [];
    }
  }

  /**
   * 下载商户图片
   */
  async downloadImages(
    merchant: FMTCMerchantDetailData,
    merchantName: string,
  ): Promise<string[]> {
    try {
      if (!this.downloadDir) {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          "未配置下载目录，跳过图片下载",
        );
        return [];
      }

      await this.logMessage(LocalScraperLogLevel.INFO, "开始下载商户图片", {
        merchantName,
      });

      const downloadedFiles: string[] = [];
      const imageUrls: Record<string, string> = {
        logo_120x60: merchant.logo120x60 || "",
        logo_88x31: merchant.logo88x31 || "",
        screenshot_280x210: merchant.screenshot280x210 || "",
        screenshot_600x450: merchant.screenshot600x450 || "",
      };

      // 创建商户专用目录
      const merchantDir = path.join(
        this.downloadDir,
        this.sanitizeFileName(merchantName),
      );
      if (!fs.existsSync(merchantDir)) {
        fs.mkdirSync(merchantDir, { recursive: true });
      }

      for (const [imageName, imageUrl] of Object.entries(imageUrls)) {
        if (imageUrl) {
          try {
            const result = await this.downloadSingleImage(
              imageUrl,
              merchantDir,
              imageName,
            );
            if (result.success && result.localPath) {
              downloadedFiles.push(result.localPath);
            }
          } catch (error) {
            await this.logMessage(LocalScraperLogLevel.WARN, `下载图片失败`, {
              imageName,
              imageUrl,
              error: (error as Error).message,
            });
          }
        }
      }

      await this.logMessage(LocalScraperLogLevel.INFO, "图片下载完成", {
        merchantName,
        downloadedCount: downloadedFiles.length,
      });

      return downloadedFiles;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "下载商户图片失败", {
        merchantName,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * 下载单个图片
   */
  private async downloadSingleImage(
    imageUrl: string,
    downloadDir: string,
    imageName: string,
  ): Promise<FMTCImageDownloadResult> {
    try {
      // 确保URL是完整的
      let fullUrl = imageUrl;
      if (!imageUrl.startsWith("http")) {
        fullUrl = new URL(imageUrl, "https://account.fmtc.co").toString();
      }

      // 获取文件扩展名
      const urlObj = new URL(fullUrl);
      const pathname = urlObj.pathname;
      const ext = path.extname(pathname) || ".jpg"; // 默认jpg

      // 构建本地文件路径
      const fileName = `${imageName}${ext}`;
      const localPath = path.join(downloadDir, fileName);

      // 使用 Playwright 下载图片
      const response = await this.page.goto(fullUrl);
      if (!response || !response.ok()) {
        throw new Error(
          `HTTP ${response?.status()}: ${response?.statusText()}`,
        );
      }

      const buffer = await response.body();
      fs.writeFileSync(localPath, buffer);

      return {
        originalUrl: imageUrl,
        localPath,
        success: true,
        fileSize: buffer.length,
        mimeType: response.headers()["content-type"],
      };
    } catch (error) {
      return {
        originalUrl: imageUrl,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 提取文本内容
   */
  private async extractText(selector: string): Promise<string | undefined> {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const text = await element.textContent();
        return text?.trim() || undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 提取链接URL
   */
  private async extractLink(selector: string): Promise<string | undefined> {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const href = await element.getAttribute("href");
        if (href && !href.startsWith("http")) {
          return new URL(href, "https://account.fmtc.co").toString();
        }
        return href || undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 提取图片URL
   */
  private async extractImageUrl(selector: string): Promise<string | undefined> {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const src = await element.getAttribute("src");
        if (src && !src.startsWith("http")) {
          return new URL(src, "https://account.fmtc.co").toString();
        }
        return src || undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 提取 FMTC ID
   */
  private async extractFMTCId(): Promise<string | undefined> {
    try {
      // 方法1: 通过选择器查找
      const fmtcIdText = await this.extractText(
        FMTC_SELECTORS.merchantDetail.fmtcId,
      );
      if (fmtcIdText) {
        const idMatch = fmtcIdText.match(FMTC_REGEX_PATTERNS.FMTC_ID);
        if (idMatch) {
          return idMatch[1];
        }
      }

      // 方法2: 从URL中提取
      const currentUrl = this.page.url();
      const urlMatch = currentUrl.match(/merchant\/(\d+)/);
      if (urlMatch) {
        return urlMatch[1];
      }

      // 方法3: 从页面内容中搜索
      const pageContent = await this.page.content();
      const contentMatch = pageContent.match(FMTC_REGEX_PATTERNS.FMTC_ID);
      if (contentMatch) {
        return contentMatch[1];
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 检查 FreshReach 支持
   */
  private async checkFreshReachSupport(): Promise<boolean> {
    try {
      const element = await this.page.$(
        FMTC_SELECTORS.merchantDetail.freshReachSupported,
      );
      if (element) {
        const text = await element.textContent();
        return text?.toLowerCase().includes("supported") || false;
      }

      // 在页面内容中搜索
      const pageContent = await this.page.content();
      return (
        pageContent.toLowerCase().includes("freshreach") &&
        pageContent.toLowerCase().includes("supported")
      );
    } catch {
      return false;
    }
  }

  /**
   * 清理文件名
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9\-_]/g, "_").substring(0, 50);
  }

  /**
   * 下载商户图片 (公共方法)
   */
  async downloadMerchantImages(
    merchant: FMTCMerchantDetailData,
    merchantName: string,
  ): Promise<string[]> {
    return this.downloadImages(merchant, merchantName);
  }

  /**
   * 记录日志消息
   */
  private async logMessage(
    level: LocalScraperLogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    this.log.info(`[FMTC MerchantDetail] ${message}`);

    if (this.executionId) {
      await sendLogToBackend(
        this.executionId,
        level,
        `[FMTC MerchantDetail] ${message}`,
        context,
      );
    }
  }
}
