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
  status?: "accepting" | "not_accepting" | "unknown" | string;
  url?: string;
  description?: string;
  joinUrl?: string;
  // 从详情页抓取的额外字段
  primaryCategory?: string;
  primaryCountry?: string;
  shipsTo?: string[];
  fmtcId?: string;
  networkId?: string;
  freshReachSupported?: boolean;
  logo120x60?: string;
  logo88x31?: string;
  screenshot280x210?: string;
  screenshot600x450?: string;
  affiliateUrl?: string;
  previewDealsUrl?: string;
  affiliateLinks?: Record<string, string[]>;
  freshReachUrls?: string[];
  networks?: Array<{
    networkName: string;
    networkId?: string;
    status: string;
    fmtcId?: string;
    joinUrl?: string;
  }>;
  homepage?: string;
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
      // 将调试模式传递给浏览器环境
      const debugMode = process.env.NODE_ENV === "development";

      const parsedData = await this.page.evaluate((debugMode) => {
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
            // 仅在开发模式下记录调试信息
            if (debugMode) {
              console.log(
                `找到表格行 ${elements.length} 条，选择器: ${selector}`,
              );
            }
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
            const countryText = cells[2]?.textContent?.trim() || "";
            merchant.country = countryText;

            // 第3列：Network
            const networkText = cells[3]?.textContent?.trim() || "";
            merchant.network = networkText;

            // 第4列：Date Added
            merchant.dateAdded = cells[4]?.textContent?.trim() || "";

            // 第5列：Premium Feed Deals (优惠数量)
            // 获取单元格，但不处理，仅为了保持与真实HTML结构的一致性
            // const premiumCell = cells[5];
            // const premiumLink = premiumCell.querySelector("a");

            // 调试日志：记录提取的字段
            if (debugMode) {
              console.log(
                `解析商户 ${index + 1}: 名称="${merchant.name}" | 国家="${countryText}" | 网络="${networkText}" | 日期="${merchant.dateAdded}"`,
              );
            }

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
            // 仅在开发模式下记录调试信息
            if (debugMode) {
              console.log(
                `解析商户 ${index + 1}: ${merchant.name} | ${merchant.country} | ${merchant.network} | ${merchant.dateAdded}`,
              );
            }

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
          // 仅在开发模式下记录调试信息
          if (debugMode) {
            console.log(`DataTables info: ${infoText}`);
          }

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

            // 仅在开发模式下记录调试信息
            if (debugMode) {
              console.log(
                `分页信息: start=${start}, end=${end}, total=${total}, pageSize=${pageSize}, currentPage=${currentPage}`,
              );
            }
          } else {
            // 如果无法解析DataTables信息，但有实际数据，则使用实际数据量
            if (merchants.length > 0) {
              totalCount = merchants.length;
              // 仅在开发模式下记录调试信息
              if (debugMode) {
                console.log(`使用实际解析数量作为总数: ${totalCount}`);
              }
            }
          }
        } else {
          // 如果没有DataTables info，但有实际数据，则使用实际数据量
          if (merchants.length > 0) {
            totalCount = merchants.length;
            // 仅在开发模式下记录调试信息
            if (debugMode) {
              console.log(
                `未找到DataTables info，使用实际解析数量: ${totalCount}`,
              );
            }
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

          // 仅在开发模式下记录调试信息
          if (debugMode) {
            console.log(`分页控件: hasNextPage=${hasNextPage}`);
          }
        } else {
          // 仅在开发模式下记录调试信息
          if (debugMode) {
            console.log("未找到DataTables分页控件");
          }
        }

        // 仅在开发模式下记录调试信息
        if (debugMode) {
          console.log(
            `解析完成: 找到 ${merchants.length} 个商户，总计 ${totalCount} 个，当前第 ${currentPage} 页，有下一页: ${hasNextPage}`,
          );
        }

        return {
          merchants,
          totalCount,
          currentPage,
          hasNextPage,
          nextPageUrl,
        };
      }, debugMode);

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
   * 增强版：包含加载验证和重试机制
   */
  async navigateToNextPage(): Promise<boolean> {
    this.log.info("尝试导航到下一页");

    try {
      // 获取当前页的第一个商户信息作为基准
      const currentFirstMerchant = await this.getFirstMerchantInfo();
      this.log.info(`当前页第一个商户：${currentFirstMerchant}`);

      // 获取当前页数信息用于日志
      const currentPageInfo = await this.getPaginationInfo();
      this.log.info(
        `当前页数：${currentPageInfo.currentPage}/${currentPageInfo.totalPages}，总商户：${currentPageInfo.totalEntries}`,
      );

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

      // 重试机制：最多尝试2次点击
      for (let attempt = 1; attempt <= 2; attempt++) {
        this.log.info(`点击下一页按钮 (尝试 ${attempt}/2)`);

        // 点击下一页按钮
        await nextButton.click();

        // 等待5秒并验证加载
        this.log.info("等待5秒页面加载...");
        await this.page.waitForTimeout(5000);

        // 检查页面是否已更新
        const newFirstMerchant = await this.getFirstMerchantInfo();
        this.log.info(`新页面第一个商户：${newFirstMerchant}`);

        if (newFirstMerchant && newFirstMerchant !== currentFirstMerchant) {
          // 页面已成功更新
          const newPageInfo = await this.getPaginationInfo();
          this.log.info(
            `✅ 成功切换到第 ${newPageInfo.currentPage} 页，页面已加载完成`,
          );

          // 额外等待确保表格完全渲染
          await this.page.waitForTimeout(2000);
          return true;
        }

        if (attempt === 1) {
          this.log.warning(
            `第一个商户信息未变化，可能页面还在加载中，将进行第二次尝试`,
          );
          // 如果第一次尝试失败，再次点击按钮
          continue;
        } else {
          this.log.error(`两次尝试后页面仍未更新，分页导航失败`);
          break;
        }
      }

      // 如果重试后仍然失败，记录详细信息
      this.log.error("分页导航失败，详细信息：");
      const finalPageInfo = await this.getPaginationInfo();
      this.log.error(
        `最终页数：${finalPageInfo.currentPage}/${finalPageInfo.totalPages}`,
      );

      return false;
    } catch (error) {
      this.log.error(`导航到下一页失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 通过页码直接跳转到指定页面
   */
  async navigateToPage(targetPage: number): Promise<boolean> {
    this.log.info(`尝试跳转到第 ${targetPage} 页`);

    try {
      // 获取当前页面信息
      const currentPageInfo = await this.getPaginationInfo();
      if (currentPageInfo.currentPage === targetPage) {
        this.log.info(`已经在第 ${targetPage} 页，无需跳转`);
        return true;
      }

      // 查找目标页码按钮
      const pageButton = await this.page.$(
        `#program_directory_table_paginate .paginate_button[data-dt-idx="${targetPage}"]`,
      );

      if (!pageButton) {
        this.log.warning(`未找到第 ${targetPage} 页的按钮`);
        return false;
      }

      // 获取当前第一个商户信息
      const currentFirstMerchant = await this.getFirstMerchantInfo();

      // 点击页码按钮
      await pageButton.click();
      this.log.info(`已点击第 ${targetPage} 页按钮，等待页面加载...`);

      // 等待页面加载验证
      for (let attempt = 1; attempt <= 2; attempt++) {
        await this.page.waitForTimeout(5000);

        const newFirstMerchant = await this.getFirstMerchantInfo();
        if (newFirstMerchant && newFirstMerchant !== currentFirstMerchant) {
          const newPageInfo = await this.getPaginationInfo();
          this.log.info(`✅ 成功跳转到第 ${newPageInfo.currentPage} 页`);
          return true;
        }

        if (attempt === 1) {
          this.log.warning(`页面可能还在加载，等待更长时间...`);
        }
      }

      this.log.error(`跳转到第 ${targetPage} 页失败`);
      return false;
    } catch (error) {
      this.log.error(
        `跳转到第 ${targetPage} 页时出错: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * 优化每页显示数量
   * 根据目标商户数量选择最佳的每页显示数量
   */
  async optimizePageSize(targetMerchants: number): Promise<{
    success: boolean;
    selectedPageSize: number;
    originalPageSize?: number;
    error?: string;
  }> {
    this.log.info(`开始优化每页显示数量，目标商户数：${targetMerchants}`);

    try {
      // 确定最佳页面大小
      let optimalPageSize = 100; // 默认值
      if (targetMerchants <= 100) {
        optimalPageSize = 100;
      } else if (targetMerchants <= 500) {
        optimalPageSize = 500;
      } else {
        optimalPageSize = 1000;
      }

      this.log.info(`选择最佳每页显示数量：${optimalPageSize}`);

      // 查找页面大小选择器
      const pageSizeSelector = await this.page.$(
        "#program_directory_table_length select",
      );
      if (!pageSizeSelector) {
        this.log.warning("未找到每页显示数量选择器，使用默认设置");
        return {
          success: false,
          selectedPageSize: 100,
          error: "未找到每页显示数量选择器",
        };
      }

      // 获取当前选择的页面大小
      const currentPageSize = await pageSizeSelector.evaluate(
        (select: HTMLSelectElement) => {
          return parseInt(select.value) || 100;
        },
      );

      this.log.info(`当前每页显示数量：${currentPageSize}`);

      // 如果当前设置已经是最佳的，无需更改
      if (currentPageSize === optimalPageSize) {
        this.log.info("当前每页显示数量已是最佳设置，无需更改");
        return {
          success: true,
          selectedPageSize: optimalPageSize,
          originalPageSize: currentPageSize,
        };
      }

      // 检查目标页面大小选项是否可用
      const availableOptions = await pageSizeSelector.evaluate(
        (select: HTMLSelectElement) => {
          return Array.from(select.options).map((option) => ({
            value: parseInt(option.value) || -1,
            text: option.text.trim(),
          }));
        },
      );

      this.log.info("可用的每页显示数量选项：", availableOptions);

      // 查找最佳选项
      const targetOption = availableOptions.find(
        (option) => option.value === optimalPageSize,
      );
      if (!targetOption) {
        // 如果最佳选项不可用，选择最接近的较大值
        const fallbackOption =
          availableOptions
            .filter((option) => option.value > optimalPageSize)
            .sort((a, b) => a.value - b.value)[0] ||
          availableOptions.sort((a, b) => b.value - a.value)[0];

        if (fallbackOption) {
          optimalPageSize = fallbackOption.value;
          this.log.info(`最佳选项不可用，选择备选项：${optimalPageSize}`);
        } else {
          this.log.warning("无法找到合适的每页显示数量选项");
          return {
            success: false,
            selectedPageSize: currentPageSize,
            originalPageSize: currentPageSize,
            error: "无法找到合适的每页显示数量选项",
          };
        }
      }

      // 选择新的页面大小
      await pageSizeSelector.selectOption(optimalPageSize.toString());
      await this.page.waitForTimeout(2000); // 等待页面更新

      // 验证设置是否成功
      const newPageSize = await pageSizeSelector.evaluate(
        (select: HTMLSelectElement) => {
          return parseInt(select.value) || 100;
        },
      );

      if (newPageSize === optimalPageSize) {
        this.log.info(`✅ 成功设置每页显示数量为：${optimalPageSize}`);

        // 等待表格重新加载
        try {
          await this.page.waitForSelector("#program_directory_table tbody tr", {
            timeout: 15000,
            state: "visible",
          });

          // 等待更长时间确保DataTables完全重新加载数据
          await this.page.waitForTimeout(5000);

          // 验证是否真的加载了更多行
          const rowCount = await this.page.$$eval(
            "#program_directory_table tbody tr",
            (rows) => rows.length,
          );
          this.log.info(`表格重新加载后的行数: ${rowCount}`);

          // 检查DataTables info显示的信息
          const dtInfoText = await this.page
            .$eval(
              "#program_directory_table_info",
              (el) => el.textContent || "",
            )
            .catch(() => "未找到");
          this.log.info(`DataTables 信息: ${dtInfoText}`);

          // 如果行数太少，再等待一下
          if (rowCount < 200 && optimalPageSize >= 500) {
            this.log.info("等待更多数据加载...");
            await this.page.waitForTimeout(5000);
            const finalRowCount = await this.page.$$eval(
              "#program_directory_table tbody tr",
              (rows) => rows.length,
            );
            const finalDtInfoText = await this.page
              .$eval(
                "#program_directory_table_info",
                (el) => el.textContent || "",
              )
              .catch(() => "未找到");
            this.log.info(`最终加载的行数: ${finalRowCount}`);
            this.log.info(`最终DataTables 信息: ${finalDtInfoText}`);
          }
        } catch {
          this.log.warning("等待表格重新加载时超时，但继续执行");
        }

        return {
          success: true,
          selectedPageSize: optimalPageSize,
          originalPageSize: currentPageSize,
        };
      } else {
        this.log.error(
          `设置每页显示数量失败，预期：${optimalPageSize}，实际：${newPageSize}`,
        );
        return {
          success: false,
          selectedPageSize: newPageSize,
          originalPageSize: currentPageSize,
          error: `设置失败，预期：${optimalPageSize}，实际：${newPageSize}`,
        };
      }
    } catch (error) {
      this.log.error(`优化每页显示数量失败：${(error as Error).message}`);
      return {
        success: false,
        selectedPageSize: 100,
        error: `优化失败：${(error as Error).message}`,
      };
    }
  }

  /**
   * 获取第一个商户信息（用于验证分页加载）
   */
  async getFirstMerchantInfo(): Promise<string | null> {
    try {
      const firstRow = await this.page.$(
        "#program_directory_table tbody tr:first-child",
      );
      if (!firstRow) {
        return null;
      }

      return await firstRow.evaluate((row) => {
        const nameCell = row.querySelector("td:nth-child(2)"); // 第二列是商户名称
        return nameCell?.textContent?.trim() || null;
      });
    } catch (error) {
      this.log.warning(`获取第一个商户信息失败：${(error as Error).message}`);
      return null;
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
