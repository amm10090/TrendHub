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
  FMTCUserData,
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

  private userData?: FMTCUserData; // 添加userData引用以检查单商户模式

  /**
   * 检查是否应该输出调试日志 - 批量和单商户模式都减少噪声
   */
  private shouldLogDebug(): boolean {
    return false; // 完全禁用DEBUG日志以减少噪声
  }

  /**
   * 设置用户数据上下文
   */
  setUserData(userData: FMTCUserData): void {
    this.userData = userData;
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
      // URL验证和修复
      let cleanUrl = merchantUrl;

      // 修复已知的URL损坏问题
      if (cleanUrl.includes("program_dtails")) {
        cleanUrl = cleanUrl.replace("program_dtails", "program_directory");
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          "检测到URL损坏，已自动修复",
          {
            originalUrl: merchantUrl,
            fixedUrl: cleanUrl,
          },
        );
      }

      // 确保URL格式正确
      if (cleanUrl.includes("program_directory/m/")) {
        cleanUrl = cleanUrl.replace(
          "program_directory/m/",
          "program_directory/details/m/",
        );
        await this.logMessage(
          LocalScraperLogLevel.INFO,
          "标准化商户详情URL格式",
          {
            originalUrl: merchantUrl,
            standardizedUrl: cleanUrl,
          },
        );
      }

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "导航到商户详情页面",
          {
            url: cleanUrl,
          },
        );
      }

      await this.page.goto(cleanUrl, {
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
      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "等待商户详情页面加载",
        );
      }

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

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "商户详情页面加载完成",
        );
      }
    } catch (error) {
      throw new Error(`等待详情页面加载失败: ${(error as Error).message}`);
    }
  }

  /**
   * 提取商户详情数据
   */
  private async extractMerchantDetails(): Promise<FMTCMerchantDetailData> {
    try {
      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "开始提取商户详情数据",
        );
      }

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

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "页面结构调试信息",
          pageStructure,
        );
      }

      // 使用页面评估来批量提取所有信息 - 修复选择器问题
      const extractedData = await this.page.evaluate(() => {
        interface ExtractedData {
          homepage?: string;
          primaryCategory?: string;
          primaryCountry?: string;
          shipsTo?: string;
          fmtcId?: string;
          freshReachSupported?: boolean;
          logoInMerchantInfo?: string;
          logo120x60?: string;
          logo88x31?: string;
          screenshot280x210?: string;
          screenshot600x450?: string;
          previewDealsUrl?: string;
          affiliateUrl?: string;
          affiliateLinks?: Record<string, string[]>;
          freshReachUrls?: string[];
          _debug?: Record<string, unknown>;
        }
        const data: ExtractedData = {};

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

        // 从Tools部分提取图片链接和其他链接
        if (toolsSection) {
          const allUlGroups = toolsSection.querySelectorAll("ul.list-group");

          allUlGroups.forEach((ulGroup) => {
            const listItems = ulGroup.querySelectorAll("li.list-group-item");

            listItems.forEach((item) => {
              const text = item.textContent || "";

              // 处理Branding Images部分
              if (text.includes("120x60 Logo")) {
                const link = item.querySelector("a");
                if (link) {
                  data.logo120x60 = (link as HTMLAnchorElement).href;
                }
              } else if (text.includes("88x31 Logo")) {
                const link = item.querySelector("a");
                if (link) {
                  data.logo88x31 = (link as HTMLAnchorElement).href;
                }
              } else if (text.includes("280x210 Screenshot")) {
                const link = item.querySelector("a");
                if (link) {
                  data.screenshot280x210 = (link as HTMLAnchorElement).href;
                }
              } else if (text.includes("600x450 Screenshot")) {
                const link = item.querySelector("a");
                if (link) {
                  data.screenshot600x450 = (link as HTMLAnchorElement).href;
                }
              }
              // 处理Links部分
              else if (text.includes("Preview Deals")) {
                const link = item.querySelector("a.showdeals");
                if (link) {
                  const rel = link.getAttribute("rel");
                  if (rel) {
                    data.previewDealsUrl = `https://account.fmtc.co${rel}`;
                  }
                }
              } else if (text.includes("FreshReach")) {
                // 提取FreshReach链接（可能有多个）
                if (!data.freshReachUrls) data.freshReachUrls = [];
                const freshReachLinks = item.querySelectorAll("a");
                freshReachLinks.forEach((frLink) => {
                  const href = (frLink as HTMLAnchorElement).href;
                  if (
                    href &&
                    href.includes("freshreach.co") &&
                    !data.freshReachUrls!.includes(href)
                  ) {
                    data.freshReachUrls!.push(href);
                  }
                });
                // 确认FreshReach支持状态
                data.freshReachSupported = true;
              }
            });
          });

          // 专门处理Links部分 - 更健壮的方式
          const linksGroups = toolsSection.querySelectorAll("ul.list-group");
          linksGroups.forEach((ulGroup) => {
            const headerItem = ulGroup.querySelector(
              "li.list-group-item.fmtc-bg-primary",
            );
            if (headerItem && headerItem.textContent?.includes("Links")) {
              // 找到Links部分，遍历所有非标题的li项
              const linkItems = ulGroup.querySelectorAll(
                "li.list-group-item:not(.fmtc-bg-primary)",
              );

              linkItems.forEach((linkItem) => {
                const text = linkItem.textContent || "";

                // 跳过Preview Deals，因为已经在前面处理过
                if (text.includes("Preview Deals")) {
                  return;
                }

                // 跳过FreshReach，因为已经在前面处理过
                if (text.includes("FreshReach")) {
                  return;
                }

                // 查找该li项中的所有a标签
                const links = linkItem.querySelectorAll("a");
                links.forEach((link) => {
                  const href = (link as HTMLAnchorElement).href;
                  if (
                    !href ||
                    href.startsWith("#") ||
                    href.includes("javascript:")
                  ) {
                    return; // 跳过无效链接
                  }

                  // 尝试从文本中提取网络名称
                  let networkName = "OTHER"; // 默认分组

                  // 检查常见的网络名称模式
                  const networkPatterns = [
                    { pattern: /\b(AW|Awin)\b/i, name: "AW" },
                    { pattern: /\b(CJ|Commission Junction)\b/i, name: "CJ" },
                    { pattern: /\b(RA|Rakuten)\b/i, name: "RA" },
                    { pattern: /\b(LS|LinkShare)\b/i, name: "LS" },
                    { pattern: /\b(SAS|ShareASale)\b/i, name: "SAS" },
                    { pattern: /\b(PJ|PartnerJunction)\b/i, name: "PJ" },
                    { pattern: /\b(TC|TradeTracker)\b/i, name: "TC" },
                    { pattern: /\b(WB|WebGains)\b/i, name: "WB" },
                    { pattern: /\b(PH|PHG)\b/i, name: "PH" },
                    { pattern: /\b(AN|Affiliate Network)\b/i, name: "AN" },
                  ];

                  // 检查文本中是否包含已知的网络名称
                  for (const { pattern, name } of networkPatterns) {
                    if (pattern.test(text)) {
                      networkName = name;
                      break;
                    }
                  }

                  // 如果没有匹配到已知网络，尝试从URL中判断
                  if (networkName === "OTHER") {
                    if (href.includes("awin") || href.includes("awclick")) {
                      networkName = "AW";
                    } else if (
                      href.includes("cj.com") ||
                      href.includes("commission")
                    ) {
                      networkName = "CJ";
                    } else if (
                      href.includes("rakuten") ||
                      href.includes("linksynergy")
                    ) {
                      networkName = "RA";
                    } else if (href.includes("shareasale")) {
                      networkName = "SAS";
                    } else if (href.includes("partnerize")) {
                      networkName = "PJ";
                    } else if (href.includes("webgains")) {
                      networkName = "WB";
                    } else if (href.includes("tradedoubler")) {
                      networkName = "TD";
                    } else if (href.includes("impact")) {
                      networkName = "IR";
                    }
                  }

                  // 初始化affiliateLinks对象
                  if (!data.affiliateLinks) data.affiliateLinks = {};
                  if (!data.affiliateLinks[networkName])
                    data.affiliateLinks[networkName] = [];

                  // 添加链接（去重）
                  if (!data.affiliateLinks[networkName].includes(href)) {
                    data.affiliateLinks[networkName].push(href);
                  }

                  // 为了向后兼容，保留原有的affiliateUrl字段（使用第一个找到的链接）
                  if (!data.affiliateUrl) {
                    data.affiliateUrl = href;
                  }
                });
              });
            }
          });
        }

        // 检查FreshReach支持状态 - 使用多种方法检测
        data.freshReachSupported = false; // 默认为不支持

        // 方法1: 查找包含FreshReach文本的span标签
        const freshReachSpans = document.querySelectorAll(
          "span.label, span[class*='label'], .label, .badge",
        );
        for (const span of freshReachSpans) {
          const text = span.textContent || "";
          if (text.toLowerCase().includes("freshreach")) {
            // 检查是否有success或supported相关的class或文本
            const hasSuccessClass =
              span.classList.contains("label-success") ||
              span.classList.contains("badge-success") ||
              span.classList.contains("text-success") ||
              span.classList.contains("success");

            const hasGreenColor =
              (span as HTMLElement).style.color?.includes("green") ||
              getComputedStyle(span).color?.includes("green") ||
              getComputedStyle(span).backgroundColor?.includes("green");

            const hasSupportedText = text.toLowerCase().includes("supported");
            const hasEnabledText = text.toLowerCase().includes("enabled");
            const hasAvailableText = text.toLowerCase().includes("available");

            // 如果有成功样式或支持相关的文本，则认为支持
            if (
              hasSuccessClass ||
              hasGreenColor ||
              hasSupportedText ||
              hasEnabledText ||
              hasAvailableText
            ) {
              data.freshReachSupported = true;
              break;
            }
          }
        }

        // 方法2: 查找FreshReach链接 - 如果有链接则认为支持
        if (
          !data.freshReachSupported &&
          data.freshReachUrls &&
          data.freshReachUrls.length > 0
        ) {
          data.freshReachSupported = true;
        }

        // 方法3: 在页面内容中搜索FreshReach支持的明确指示
        if (!data.freshReachSupported) {
          const bodyText = document.body.textContent?.toLowerCase() || "";
          const freshReachPatterns = [
            /freshreach.*support/,
            /freshreach.*enable/,
            /freshreach.*available/,
            /freshreach.*active/,
          ];

          for (const pattern of freshReachPatterns) {
            if (pattern.test(bodyText)) {
              data.freshReachSupported = true;
              break;
            }
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
          linksGroupsFound: toolsSection
            ? toolsSection.querySelectorAll("ul.list-group").length
            : 0,
          linksHeadersFound: toolsSection
            ? Array.from(
                toolsSection.querySelectorAll(
                  "li.list-group-item.fmtc-bg-primary",
                ),
              )
                .map((header) => header.textContent?.trim())
                .filter((text) => text?.includes("Links"))
            : [],
          affiliateLinksExtracted: data.affiliateLinks
            ? Object.keys(data.affiliateLinks).length
            : 0,
          affiliateLinksDetails: data.affiliateLinks || {},
        };

        return data;
      });

      // 映射提取的数据到detail对象
      detail.homepage = extractedData.homepage as string | undefined;
      detail.primaryCategory = extractedData.primaryCategory as
        | string
        | undefined;
      detail.primaryCountry = extractedData.primaryCountry as
        | string
        | undefined;

      // 处理配送地区
      if (extractedData.shipsTo && typeof extractedData.shipsTo === "string") {
        detail.shipsTo = extractedData.shipsTo
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s);
      }

      detail.fmtcId = extractedData.fmtcId as string | undefined;
      detail.freshReachSupported = extractedData.freshReachSupported as
        | boolean
        | undefined;

      // 图片URLs - 优先使用Tools部分的链接，如果没有则使用商户信息中的
      detail.logo120x60 =
        (extractedData.logo120x60 as string | undefined) ||
        (extractedData.logoInMerchantInfo as string | undefined);
      detail.logo88x31 = extractedData.logo88x31 as string | undefined;
      detail.screenshot280x210 = extractedData.screenshot280x210 as
        | string
        | undefined;
      detail.screenshot600x450 = extractedData.screenshot600x450 as
        | string
        | undefined;

      // 链接
      detail.affiliateUrl = extractedData.affiliateUrl as string | undefined;
      detail.previewDealsUrl = extractedData.previewDealsUrl as
        | string
        | undefined;

      // 新增的链接数据
      detail.affiliateLinks = extractedData.affiliateLinks as
        | Record<string, string[]>
        | undefined;
      detail.freshReachUrls = extractedData.freshReachUrls as
        | string[]
        | undefined;

      // 获取主要网络信息（从网络关联中提取第一个网络的名称和ID）
      const networks = await this.extractNetworks();
      if (networks.length > 0) {
        detail.network = networks[0].networkName; // 设置主要网络名称
        detail.networkId = networks[0].networkId; // 设置主要网络ID
      }

      if (this.shouldLogDebug()) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "数据提取调试信息", {
          extractedDataDebug: extractedData._debug,
          extractedFields: Object.keys(extractedData).filter(
            (key) => key !== "_debug",
          ),
          extractedData: extractedData,
        });
      }

      if (this.shouldLogDebug()) {
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
            affiliateLinksNetworks: detail.affiliateLinks
              ? Object.keys(detail.affiliateLinks)
              : [],
            affiliateLinksCount: detail.affiliateLinks
              ? Object.values(detail.affiliateLinks).flat().length
              : 0,
            freshReachUrlsCount: detail.freshReachUrls?.length || 0,
            freshReachSupported: detail.freshReachSupported,
            // 网络相关调试信息
            primaryNetwork: detail.network,
            primaryNetworkId: detail.networkId,
            networksCount: networks.length,
            allNetworks: networks.map((n) => ({
              name: n.networkName,
              id: n.networkId,
              status: n.status,
            })),
          },
        );
      }

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
      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "开始提取网络关联信息",
        );
      }

      const networks: FMTCMerchantNetworkData[] = [];

      // 使用页面评估来提取网络表格数据 - 修复选择器问题
      interface NetworkDataResult {
        networkList: Array<{
          fmtcId: string;
          networkName: string;
          networkId: string;
          status: string;
          joinUrl?: string;
        }>;
        debugInfo: {
          networkSectionFound: boolean;
          tableFound: boolean;
          rowsCount: number;
          sectionsChecked: number;
          networkListLength: number;
        };
      }

      const networkData: NetworkDataResult = await this.page.evaluate(() => {
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
          return {
            networkList,
            debugInfo: {
              networkSectionFound: false,
              tableFound: false,
              rowsCount: 0,
              sectionsChecked: sections.length,
              networkListLength: 0,
            },
          } as NetworkDataResult;
        }

        // 查找网络关联表格
        const networkTable =
          networkSection.querySelector("table.fmtc-table tbody") ||
          networkSection.querySelector("table tbody") ||
          networkSection.querySelector(".table tbody");

        if (!networkTable) {
          return {
            networkList,
            debugInfo: {
              networkSectionFound: true,
              tableFound: false,
              rowsCount: 0,
              sectionsChecked: sections.length,
              networkListLength: 0,
            },
          } as NetworkDataResult;
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

        return { networkList, debugInfo } as NetworkDataResult;
      });

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "网络数据提取调试信息",
          networkData.debugInfo,
        );
      }

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

        if (this.shouldLogDebug()) {
          await this.logMessage(LocalScraperLogLevel.DEBUG, `提取网络关联`, {
            fmtcId: networkInfo.fmtcId,
            networkName: networkInfo.networkName,
            networkId: networkInfo.networkId,
            status: networkInfo.status,
            hasJoinUrl: !!networkInfo.joinUrl,
          });
        }
      }

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          `网络关联信息提取完成`,
          {
            networksCount: networks.length,
          },
        );
      }

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
