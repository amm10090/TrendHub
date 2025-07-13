/**
 * FMTC 搜索结果解析器 - 解析Program Search结果页面
 */

import type { Page } from "playwright";
import type { Log } from "crawlee";

/**
 * 商户信息接口
 */
export interface MerchantInfo {
  id?: string;
  name: string;
  network?: string;
  category?: string;
  country?: string;
  dateAdded?: string;
  detailUrl?: string;
  commissionRate?: string;
  cookieDuration?: string;
  ecdDuration?: string;
  status?: "accepting" | "not_accepting" | "unknown";
  url?: string;
  description?: string;
  joinUrl?: string;
}

/**
 * 解析结果接口
 */
export interface ParsedResults {
  merchants: MerchantInfo[];
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
  nextPageUrl?: string;
}

/**
 * FMTC 结果解析器类
 */
export class FMTCResultsParser {
  private page: Page;
  private log: Log;

  constructor(page: Page, log: Log) {
    this.page = page;
    this.log = log;
  }

  /**
   * 解析搜索结果页面
   */
  async parseSearchResults(): Promise<ParsedResults> {
    this.log.info("开始解析搜索结果");

    try {
      const parsedData = await this.page.evaluate(() => {
        const merchants: MerchantInfo[] = [];

        // 基于真实HTML结构的表格选择器
        const tableSelectors = [
          "#program_directory_table tbody tr", // 主要选择器
          "table.dataTable tbody tr",
          "table.fmtc-table tbody tr",
          "table.table-striped tbody tr",
          "table tbody tr", // 兜底选择器
        ];

        let rows: NodeListOf<Element> | null = null;
        for (const selector of tableSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            rows = elements;
            console.log(
              `找到表格行 ${elements.length} 条，选择器: ${selector}`,
            );
            break;
          }
        }

        if (!rows || rows.length === 0) {
          return {
            merchants: [],
            totalCount: 0,
            currentPage: 1,
            hasNextPage: false,
          };
        }

        // 解析每一行数据
        rows.forEach((row, index) => {
          try {
            const merchant: MerchantInfo = {
              name: "",
              status: "unknown",
            };

            // 提取所有表格单元格
            const cells = Array.from(row.querySelectorAll("td"));

            if (cells.length < 6) {
              console.warn(
                `第 ${index + 1} 行数据列数不足 (${cells.length} < 6)，跳过`,
              );
              return;
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
            const nameLink = nameCell.querySelector("a");
            if (nameLink) {
              merchant.name = nameLink.textContent?.trim() || "";
              // 构建完整的详情URL
              const href = (nameLink as HTMLAnchorElement).href;
              if (href && href.startsWith("/")) {
                merchant.detailUrl = `https://account.fmtc.co${href}`;
              } else {
                merchant.detailUrl = href || "";
              }
            } else {
              merchant.name = nameCell.textContent?.trim() || "";
            }

            // 如果没有找到名称，跳过这一行
            if (!merchant.name) {
              console.warn(`第 ${index + 1} 行未找到商户名称，跳过`);
              return;
            }

            // 第2列：Country
            merchant.country = cells[2]?.textContent?.trim() || "";

            // 第3列：Network
            merchant.network = cells[3]?.textContent?.trim() || "";

            // 第4列：Date Added
            merchant.dateAdded = cells[4]?.textContent?.trim() || "";

            // 第5列：Premium Feed Deals (优惠数量)
            // 获取单元格，但不处理，仅为了保持与真实HTML结构的一致性
            // const premiumCell = cells[5];
            // const premiumLink = premiumCell.querySelector("a");

            // 生成唯一ID（从详情URL或名称生成）
            if (merchant.detailUrl) {
              const urlMatch = merchant.detailUrl.match(/\/m\/(\d+)\//);
              if (urlMatch) {
                merchant.id = urlMatch[1];
              }
            }

            if (!merchant.id) {
              // 如果无法从URL提取ID，使用名称hash作为ID
              merchant.id = `fmtc_${merchant.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${index}`;
            }

            // 设置基本状态（FMTC目录中的商户通常都是accepting状态）
            merchant.status = "accepting";

            // 从名称中提取更多信息
            const nameText = merchant.name.toLowerCase();

            // 检测状态关键词
            if (nameText.includes("closed") || nameText.includes("inactive")) {
              merchant.status = "not_accepting";
            }

            // 记录调试信息
            console.log(
              `解析商户 ${index + 1}: ${merchant.name} | ${merchant.country} | ${merchant.network} | ${merchant.dateAdded}`,
            );

            merchants.push(merchant);
          } catch (error) {
            console.warn(`解析第 ${index + 1} 行数据时出错:`, error);
          }
        });

        // 获取分页信息
        let totalCount = merchants.length; // 默认使用实际解析到的商户数量
        let currentPage = 1;
        let hasNextPage = false;
        let nextPageUrl: string | undefined;

        // 从DataTables info获取总数信息
        const dtInfo = document.querySelector("#program_directory_table_info");
        if (dtInfo && dtInfo.textContent) {
          const infoText = dtInfo.textContent.trim();
          console.log(`DataTables info: ${infoText}`);

          // 匹配类似 "Showing 1 to 50 of 139 entries" 的文本
          const infoMatch = infoText.match(
            /showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+entries/i,
          );
          if (infoMatch) {
            const start = parseInt(infoMatch[1]);
            const end = parseInt(infoMatch[2]);
            const total = parseInt(infoMatch[3]);

            totalCount = Math.max(total, merchants.length); // 使用更大的值
            const pageSize = end - start + 1;
            currentPage = Math.ceil(start / pageSize);

            console.log(
              `分页信息: start=${start}, end=${end}, total=${total}, pageSize=${pageSize}, currentPage=${currentPage}`,
            );
          } else {
            // 如果无法解析DataTables信息，但有实际数据，则使用实际数据量
            if (merchants.length > 0) {
              totalCount = merchants.length;
              console.log(`使用实际解析数量作为总数: ${totalCount}`);
            }
          }
        } else {
          // 如果没有DataTables info，但有实际数据，则使用实际数据量
          if (merchants.length > 0) {
            totalCount = merchants.length;
            console.log(
              `未找到DataTables info，使用实际解析数量: ${totalCount}`,
            );
          }
        }

        // 检测DataTables分页控件
        const pagination = document.querySelector(
          "#program_directory_table_paginate, .dataTables_paginate",
        );
        if (pagination) {
          // 查找下一页按钮
          const nextButton = pagination.querySelector(
            ".paginate_button.next:not(.disabled)",
          );
          hasNextPage = !!nextButton;

          if (hasNextPage && nextButton) {
            // DataTables通常使用JavaScript控制分页，这里记录有下一页
            nextPageUrl = window.location.href; // 保持当前URL，由调用方处理分页
          }

          console.log(`分页控件: hasNextPage=${hasNextPage}`);
        } else {
          console.log("未找到DataTables分页控件");
        }

        console.log(
          `解析完成: 找到 ${merchants.length} 个商户，总计 ${totalCount} 个，当前第 ${currentPage} 页，有下一页: ${hasNextPage}`,
        );

        return {
          merchants,
          totalCount,
          currentPage,
          hasNextPage,
          nextPageUrl,
        };
      });

      this.log.info(`解析完成，找到 ${parsedData.merchants.length} 个商户`);
      return parsedData;
    } catch (error) {
      this.log.error(`解析搜索结果失败: ${(error as Error).message}`);
      return {
        merchants: [],
        totalCount: 0,
        currentPage: 1,
        hasNextPage: false,
      };
    }
  }

  /**
   * 解析商户详细信息（访问商户详情页）
   */
  async parseMerchantDetails(
    merchantUrl: string,
  ): Promise<MerchantInfo | null> {
    this.log.info(`解析商户详情: ${merchantUrl}`);

    try {
      // 在新标签页打开商户详情
      const newPage = await this.page.context().newPage();

      try {
        await newPage.goto(merchantUrl, {
          waitUntil: "networkidle",
          timeout: 15000,
        });

        const detailData = await newPage.evaluate(() => {
          const merchant: Partial<MerchantInfo> = {};

          // 提取商户名称
          const nameSelectors = [
            "h1",
            ".merchant-name",
            ".program-title",
            ".title",
          ];

          for (const selector of nameSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              merchant.name = element.textContent.trim();
              break;
            }
          }

          // 提取详细描述
          const descSelectors = [
            ".description",
            ".merchant-description",
            ".program-description",
            ".about",
            ".details",
          ];

          for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              const desc = element.textContent.trim();
              if (desc.length > 20) {
                merchant.description = desc;
                break;
              }
            }
          }

          // 提取佣金信息
          const pageText = document.body.textContent || "";
          const commissionMatch = pageText.match(
            /commission[:\s]*(\d+(?:\.\d+)?%)/i,
          );
          if (commissionMatch) {
            merchant.commissionRate = commissionMatch[1];
          }

          // 提取Cookie duration
          const cookieMatch = pageText.match(/cookie[:\s]*(\d+)\s*days?/i);
          if (cookieMatch) {
            merchant.cookieDuration = cookieMatch[1] + " days";
          }

          // 提取ECD duration
          const ecdMatch = pageText.match(/ecd[:\s]*(\d+)\s*days?/i);
          if (ecdMatch) {
            merchant.ecdDuration = ecdMatch[1] + " days";
          }

          return merchant;
        });

        await newPage.close();

        this.log.info("商户详情解析完成");
        return detailData as MerchantInfo;
      } catch (error) {
        await newPage.close();
        throw error;
      }
    } catch (error) {
      this.log.error(`解析商户详情失败: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 导出解析结果为JSON
   */
  exportToJson(results: ParsedResults): string {
    return JSON.stringify(results, null, 2);
  }

  /**
   * 导出解析结果为CSV
   */
  exportToCsv(results: ParsedResults): string {
    const headers = [
      "Name",
      "Network",
      "Category",
      "Country",
      "Commission Rate",
      "Cookie Duration",
      "ECD Duration",
      "Status",
      "URL",
      "Join URL",
      "Description",
    ];

    const csvLines = [headers.join(",")];

    results.merchants.forEach((merchant) => {
      const row = [
        this.escapeCsvField(merchant.name),
        this.escapeCsvField(merchant.network || ""),
        this.escapeCsvField(merchant.category || ""),
        this.escapeCsvField(merchant.country || ""),
        this.escapeCsvField(merchant.commissionRate || ""),
        this.escapeCsvField(merchant.cookieDuration || ""),
        this.escapeCsvField(merchant.ecdDuration || ""),
        this.escapeCsvField(merchant.status || ""),
        this.escapeCsvField(merchant.url || ""),
        this.escapeCsvField(merchant.joinUrl || ""),
        this.escapeCsvField(merchant.description || ""),
      ];
      csvLines.push(row.join(","));
    });

    return csvLines.join("\n");
  }

  /**
   * 转义CSV字段
   */
  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * 处理DataTables分页，点击下一页
   */
  async navigateToNextPage(): Promise<boolean> {
    this.log.info("尝试导航到下一页");

    try {
      // 查找DataTables下一页按钮
      const nextButton = await this.page.$(
        "#program_directory_table_paginate .paginate_button.next:not(.disabled), .dataTables_paginate .paginate_button.next:not(.disabled)",
      );

      if (!nextButton) {
        this.log.info("没有下一页或下一页按钮已禁用");
        return false;
      }

      // 检查按钮是否可点击
      const isClickable = await nextButton.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (
          !el.classList.contains("disabled") &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });

      if (!isClickable) {
        this.log.info("下一页按钮不可点击");
        return false;
      }

      this.log.info("点击下一页按钮");

      // 等待页面更新
      const navigationPromise = this.page.waitForResponse(
        (response) =>
          response.url().includes("program_directory") &&
          response.status() === 200,
        { timeout: 15000 },
      );

      await nextButton.click();

      try {
        await navigationPromise;
        this.log.info("页面已更新到下一页");
      } catch {
        this.log.warning("等待页面响应超时，但继续检查");
      }

      // 等待表格内容更新
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      this.log.error(`导航到下一页失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 获取当前分页状态
   */
  async getPaginationInfo(): Promise<{
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalEntries: number;
    pageSize: number;
  }> {
    return await this.page.evaluate(() => {
      const info = {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        totalEntries: 0,
        pageSize: 10,
      };

      // 从DataTables info获取信息
      const dtInfo = document.querySelector(
        "#program_directory_table_info, .dataTables_info",
      );
      if (dtInfo && dtInfo.textContent) {
        const infoText = dtInfo.textContent.trim();

        // 解析 "Showing 1 to 50 of 139 entries"
        const match = infoText.match(
          /showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+entries/i,
        );
        if (match) {
          const start = parseInt(match[1]);
          const end = parseInt(match[2]);
          const total = parseInt(match[3]);

          info.totalEntries = total;
          info.pageSize = end - start + 1;
          info.currentPage = Math.ceil(start / info.pageSize);
          info.totalPages = Math.ceil(total / info.pageSize);
        } else {
          // 如果无法解析info，检查实际表格行数
          const tableRows = document.querySelectorAll(
            "#program_directory_table tbody tr",
          );
          if (tableRows.length > 0) {
            info.totalEntries = tableRows.length;
            info.pageSize = tableRows.length;
            info.currentPage = 1;
            info.totalPages = 1;
          }
        }
      } else {
        // 如果没有DataTables info，检查实际表格行数
        const tableRows = document.querySelectorAll(
          "#program_directory_table tbody tr",
        );
        if (tableRows.length > 0) {
          info.totalEntries = tableRows.length;
          info.pageSize = tableRows.length;
          info.currentPage = 1;
          info.totalPages = 1;
        }
      }

      // 检查分页按钮状态
      const pagination = document.querySelector(
        "#program_directory_table_paginate, .dataTables_paginate",
      );
      if (pagination) {
        const nextButton = pagination.querySelector(".paginate_button.next");
        const prevButton = pagination.querySelector(
          ".paginate_button.previous",
        );

        info.hasNextPage = nextButton
          ? !nextButton.classList.contains("disabled")
          : false;
        info.hasPrevPage = prevButton
          ? !prevButton.classList.contains("disabled")
          : false;
      }

      return info;
    });
  }

  /**
   * 调试：打印结果页面结构
   */
  async debugResultsStructure(): Promise<void> {
    this.log.info("调试结果页面结构...");

    const structure = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,

        // 查找表格
        tables: Array.from(document.querySelectorAll("table")).map((table) => ({
          className: table.className,
          id: table.id,
          rowCount: table.querySelectorAll("tr").length,
          headers: Array.from(table.querySelectorAll("th")).map((th) =>
            th.textContent?.trim(),
          ),
        })),

        // DataTables特定信息
        dataTables: {
          hasDataTable: !!document.querySelector("#program_directory_table"),
          hasInfo: !!document.querySelector(".dataTables_info"),
          hasPagination: !!document.querySelector(".dataTables_paginate"),
          infoText: document.querySelector(".dataTables_info")?.textContent,
          nextButtonExists: !!document.querySelector(".paginate_button.next"),
          nextButtonDisabled: document
            .querySelector(".paginate_button.next")
            ?.classList.contains("disabled"),
        },

        // 页面内容样本
        bodyText: document.body.textContent?.substring(0, 500),
      };
    });

    this.log.info("结果页面结构:", structure);

    // 获取分页信息
    const paginationInfo = await this.getPaginationInfo();
    this.log.info("分页信息:", paginationInfo);
  }
}
