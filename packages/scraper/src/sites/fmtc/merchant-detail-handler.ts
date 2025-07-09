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

      // 提取官方网站
      detail.homepage = await this.extractText(
        FMTC_SELECTORS.merchantDetail.homepage,
      );

      // 提取主要分类
      detail.primaryCategory = await this.extractText(
        FMTC_SELECTORS.merchantDetail.primaryCategory,
      );

      // 提取主要国家
      detail.primaryCountry = await this.extractText(
        FMTC_SELECTORS.merchantDetail.primaryCountry,
      );

      // 提取配送地区
      const shipsToText = await this.extractText(
        FMTC_SELECTORS.merchantDetail.shipsTo,
      );
      if (shipsToText) {
        detail.shipsTo = shipsToText
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      // 提取 FMTC ID
      detail.fmtcId = await this.extractFMTCId();

      // 提取商户状态
      detail.status = await this.extractText(
        FMTC_SELECTORS.merchantDetail.status,
      );

      // 检查 FreshReach 支持
      detail.freshReachSupported = await this.checkFreshReachSupport();

      // 提取图片URL
      detail.logo120x60 = await this.extractImageUrl(
        FMTC_SELECTORS.merchantDetail.logos.logo120x60,
      );
      detail.logo88x31 = await this.extractImageUrl(
        FMTC_SELECTORS.merchantDetail.logos.logo88x31,
      );
      detail.screenshot280x210 = await this.extractImageUrl(
        FMTC_SELECTORS.merchantDetail.screenshots.screenshot280x210,
      );
      detail.screenshot600x450 = await this.extractImageUrl(
        FMTC_SELECTORS.merchantDetail.screenshots.screenshot600x450,
      );

      // 提取链接
      detail.affiliateUrl = await this.extractLink(
        FMTC_SELECTORS.merchantDetail.affiliateUrl,
      );
      detail.previewDealsUrl = await this.extractLink(
        FMTC_SELECTORS.merchantDetail.previewDealsUrl,
      );

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        "商户详情数据提取完成",
        {
          homepage: detail.homepage,
          fmtcId: detail.fmtcId,
          hasLogos: !!(detail.logo120x60 || detail.logo88x31),
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

      // 查找网络关联表格
      const networkRows = await this.page.$$(
        FMTC_SELECTORS.merchantDetail.networkTable.rows,
      );

      for (let i = 0; i < networkRows.length; i++) {
        try {
          const row = networkRows[i];

          // 提取网络名称
          const networkNameElement = await row.$(
            FMTC_SELECTORS.merchantDetail.networkTable.networkName,
          );
          const networkName = await networkNameElement?.textContent();

          if (!networkName || networkName.trim() === "") {
            continue; // 跳过没有网络名称的行
          }

          // 提取网络ID
          const networkIdElement = await row.$(
            FMTC_SELECTORS.merchantDetail.networkTable.networkId,
          );
          let networkId = await networkIdElement?.textContent();

          // 使用正则提取括号中的ID
          if (networkId) {
            const idMatch = networkId.match(FMTC_REGEX_PATTERNS.NETWORK_ID);
            if (idMatch) {
              networkId = idMatch[1];
            }
          }

          // 提取状态
          const statusElement = await row.$(
            FMTC_SELECTORS.merchantDetail.networkTable.status,
          );
          const statusText = await statusElement?.textContent();

          // 映射状态文本到枚举值
          let status = "Not Joined"; // 默认状态
          if (statusText) {
            const lowerStatus = statusText.toLowerCase().trim();
            if (
              lowerStatus.includes("joined") &&
              !lowerStatus.includes("not")
            ) {
              status = "Joined";
            } else if (
              lowerStatus.includes("not verified") ||
              lowerStatus.includes("relationship not verified")
            ) {
              status = "Relationship Not Verified";
            }
          }

          const networkData: FMTCMerchantNetworkData = {
            networkName: networkName.trim(),
            networkId: networkId?.trim() || undefined,
            status: status as FMTCNetworkStatus,
          };

          networks.push(networkData);

          await this.logMessage(LocalScraperLogLevel.DEBUG, `提取网络关联`, {
            networkName: networkData.networkName,
            networkId: networkData.networkId,
            status: networkData.status,
          });
        } catch (error) {
          await this.logMessage(
            LocalScraperLogLevel.WARN,
            `提取第 ${i} 个网络关联失败`,
            {
              error: (error as Error).message,
            },
          );
        }
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
