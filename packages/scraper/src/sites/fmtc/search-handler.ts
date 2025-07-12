/**
 * FMTC 搜索表单处理器 - 处理Program Search功能
 */

import type { Page, ElementHandle } from "playwright";
import type { Log } from "crawlee";
import { delay } from "../../utils.js";
import { getSearchConfig, validateSearchConfig } from "./config.js";

/**
 * 搜索参数接口
 */
export interface SearchParams {
  searchText?: string; // 搜索关键词
  networkId?: string; // Network ID
  opmProvider?: string; // OPM Provider
  category?: string; // 分类
  country?: string; // 国家
  shippingCountry?: string; // 配送国家
  displayType?: "all" | "accepting" | "not_accepting"; // 显示类型
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  success: boolean;
  resultsCount?: number;
  currentUrl?: string;
  error?: string;
  searchParams?: SearchParams;
}

/**
 * FMTC 搜索处理器类
 */
export class FMTCSearchHandler {
  private page: Page;
  private log: Log;
  private config: ReturnType<typeof getSearchConfig>;

  constructor(page: Page, log: Log) {
    this.page = page;
    this.log = log;
    this.config = getSearchConfig();

    // 验证配置
    const validation = validateSearchConfig(this.config);
    if (!validation.valid) {
      this.log.warning("搜索配置验证失败:", validation.errors);
    }
  }

  /**
   * 模拟人类等待行为
   */
  private async humanDelay(minMs?: number, maxMs?: number): Promise<void> {
    if (!this.config.enableRandomDelay) {
      await delay(100); // 最小延迟
      return;
    }

    const min = minMs ?? this.config.minDelay;
    const max = maxMs ?? this.config.maxDelay;
    const delayTime = Math.floor(Math.random() * (max - min)) + min;
    await delay(delayTime);
  }

  /**
   * 模拟人类鼠标移动
   */
  private async simulateMouseMovement(element: ElementHandle): Promise<void> {
    if (!this.config.enableMouseMovement) {
      return;
    }

    const box = await element.boundingBox();
    if (box) {
      // 先移动到元素附近
      await this.page.mouse.move(
        box.x + box.width / 2 + Math.random() * 30 - 15,
        box.y + box.height / 2 + Math.random() * 30 - 15,
      );
      await this.humanDelay(200, 500);

      // 再移动到元素中心
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.humanDelay(100, 300);
    }
  }

  /**
   * 模拟人类输入文本
   */
  private async simulateTyping(
    element: ElementHandle,
    text: string,
  ): Promise<void> {
    await element.click();
    await this.humanDelay(200, 400);

    // 清空现有内容
    await this.page.keyboard.down("Control");
    await this.page.keyboard.press("KeyA");
    await this.page.keyboard.up("Control");
    await this.humanDelay(100, 200);

    // 逐字符输入
    for (const char of text) {
      await this.page.keyboard.type(char);

      // 使用配置的输入延迟
      const typingDelay =
        Math.random() *
          (this.config.typingDelayMax - this.config.typingDelayMin) +
        this.config.typingDelayMin;
      await delay(typingDelay);
    }

    await this.humanDelay(200, 400);
  }

  /**
   * 模拟下拉选择操作
   */
  private async simulateSelectOption(
    selectElement: ElementHandle,
    optionValue: string,
  ): Promise<boolean> {
    try {
      await this.simulateMouseMovement(selectElement);
      await selectElement.click();
      await this.humanDelay(300, 600);

      // 查找选项
      const option = await this.page.$(`option[value="${optionValue}"]`);
      if (!option) {
        this.log.warning(`未找到选项值: ${optionValue}`);
        return false;
      }

      await option.click();
      await this.humanDelay(200, 400);
      return true;
    } catch (error) {
      this.log.error(`选择下拉选项失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 检测是否在Program Directory页面
   */
  async isOnProgramDirectoryPage(): Promise<boolean> {
    const currentUrl = this.page.url();
    const hasSearchForm = await this.page.$(
      '#programSearchForm, form[action*="program_directory"]',
    );

    return currentUrl.includes("program_directory") && !!hasSearchForm;
  }

  /**
   * 检测并定位搜索表单
   */
  async detectSearchForm(): Promise<boolean> {
    this.log.info("检测搜索表单...");

    const formSelectors = [
      "#programSearchForm",
      'form[action*="program_directory"]',
      'form[action*="search"]',
      ".search-form",
    ];

    for (const selector of formSelectors) {
      const form = await this.page.$(selector);
      if (form) {
        this.log.info(`找到搜索表单: ${selector}`);
        return true;
      }
    }

    this.log.warning("未找到搜索表单");
    return false;
  }

  /**
   * 填充搜索参数
   */
  async fillSearchParams(params: SearchParams): Promise<boolean> {
    this.log.info("开始填充搜索参数", params);

    try {
      // 1. 填充搜索文本
      if (params.searchText) {
        this.log.info(`填充搜索文本: ${params.searchText}`);

        const searchInputSelectors = [
          'input[name="q"]',
          'input[name="search"]',
          'input[name="keyword"]',
          'input[type="search"]',
          "#search_text",
        ];

        let searchInput = null;
        for (const selector of searchInputSelectors) {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            this.log.debug(`找到搜索输入框: ${selector}`);
            break;
          }
        }

        if (searchInput) {
          await this.simulateTyping(searchInput, params.searchText);
          this.log.info("✅ 搜索文本填充完成");
        } else {
          this.log.warning("未找到搜索输入框");
        }
      }

      // 2. 选择Network
      if (params.networkId) {
        this.log.info(`选择Network: ${params.networkId}`);

        const networkSelect = await this.page.$(
          'select[name="network_id"], #network_select',
        );
        if (networkSelect) {
          await this.simulateSelectOption(networkSelect, params.networkId);
          this.log.info("✅ Network选择完成");
        } else {
          this.log.warning("未找到Network选择器");
        }
      }

      // 3. 选择OPM Provider
      if (params.opmProvider) {
        this.log.info(`选择OPM Provider: ${params.opmProvider}`);

        const opmSelect = await this.page.$(
          'select[name="omp_provider"], #omp_select',
        );
        if (opmSelect) {
          await this.simulateSelectOption(opmSelect, params.opmProvider);
          this.log.info("✅ OPM Provider选择完成");
        } else {
          this.log.warning("未找到OPM Provider选择器");
        }
      }

      // 4. 选择Category
      if (params.category) {
        this.log.info(`选择Category: ${params.category}`);

        // 首先尝试原始的select元素
        const categorySelect = await this.page.$('#cat, select[name="cat"]');

        if (categorySelect) {
          // 检查是否被Chosen.js隐藏
          const isHidden = await categorySelect.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.display === "none";
          });

          if (isHidden) {
            // 使用Chosen.js接口
            this.log.info("检测到Chosen.js选择器，使用Chosen接口");
            const success = await this.selectChosenOption(
              "#cat_chosen",
              params.category,
            );
            if (success) {
              this.log.info("✅ Category选择完成（通过Chosen）");
            } else {
              this.log.warning("Chosen选择失败，尝试直接设置select值");
              await this.simulateSelectOption(categorySelect, params.category);
            }
          } else {
            // 使用普通的select选择
            await this.simulateSelectOption(categorySelect, params.category);
            this.log.info("✅ Category选择完成");
          }
        } else {
          this.log.warning("未找到Category选择器");
        }
      }

      // 5. 选择Country
      if (params.country) {
        this.log.info(`选择Country: ${params.country}`);

        const countrySelect = await this.page.$(
          'select[name="country"], #country_select',
        );
        if (countrySelect) {
          await this.simulateSelectOption(countrySelect, params.country);
          this.log.info("✅ Country选择完成");
        } else {
          this.log.warning("未找到Country选择器");
        }
      }

      // 6. 选择Shipping Country
      if (params.shippingCountry) {
        this.log.info(`选择Shipping Country: ${params.shippingCountry}`);

        const shippingSelect = await this.page.$(
          'select[name="ships_to"], #shipping_select',
        );
        if (shippingSelect) {
          await this.simulateSelectOption(
            shippingSelect,
            params.shippingCountry,
          );
          this.log.info("✅ Shipping Country选择完成");
        } else {
          this.log.warning("未找到Shipping Country选择器");
        }
      }

      // 7. 选择Display Type (单选按钮)
      if (params.displayType) {
        this.log.info(`选择Display Type: ${params.displayType}`);

        const displayRadioSelectors = {
          all: 'input[value="0"], input[value="all"]',
          accepting: 'input[value="1"], input[value="accepting"]',
          not_accepting: 'input[value="2"], input[value="not_accepting"]',
        };

        const radioSelector = displayRadioSelectors[params.displayType];
        if (radioSelector) {
          const radioButton = await this.page.$(radioSelector);
          if (radioButton) {
            await this.simulateMouseMovement(radioButton);
            await radioButton.click();
            await this.humanDelay(200, 400);
            this.log.info("✅ Display Type选择完成");
          } else {
            this.log.warning(
              `未找到Display Type单选按钮: ${params.displayType}`,
            );
          }
        }
      }

      this.log.info("🎉 所有搜索参数填充完成");
      return true;
    } catch (error) {
      this.log.error(`填充搜索参数失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 提交搜索表单
   */
  async submitSearchForm(): Promise<boolean> {
    this.log.info("准备提交搜索表单");

    try {
      // 模拟人类行为：短暂检查填写内容
      await this.humanDelay(1000, 2000);

      // 查找提交按钮
      const submitSelectors = [
        'button.fmtc-primary-btn[type="submit"]', // 更具体的选择器
        'button[type="submit"]',
        '.btn.fmtc-primary-btn[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Search")',
        'button:has-text("查找")',
        ".search-button",
        "#search_submit",
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const buttons = await this.page.$$(selector);
          // 找到可见的按钮
          for (const button of buttons) {
            const isVisible = await button.evaluate((el) => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0" &&
                rect.width > 0 &&
                rect.height > 0
              );
            });

            if (isVisible) {
              submitButton = button;
              this.log.debug(`找到可见的提交按钮: ${selector}`);
              break;
            }
          }
          if (submitButton) break;
        } catch {
          // 继续尝试下一个选择器
        }
      }

      if (!submitButton) {
        this.log.error("未找到可见的提交按钮");
        return false;
      }

      // 确保按钮在视窗内，使用更温和的滚动
      try {
        await submitButton.scrollIntoViewIfNeeded({ timeout: 5000 });
      } catch {
        this.log.warning("滚动到按钮失败，尝试页面滚动");
        // 尝试手动滚动到按钮位置
        await submitButton.evaluate((el) => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        await this.humanDelay(1000, 2000);
      }

      await this.humanDelay(300, 600);

      // 模拟鼠标移动到提交按钮
      await this.simulateMouseMovement(submitButton);

      // 监听页面导航
      const navigationPromise = this.page.waitForURL("**", {
        timeout: 15000,
        waitUntil: "networkidle",
      });

      // 点击提交按钮
      this.log.info("点击提交按钮");
      await submitButton.click();

      // 等待页面导航或加载
      try {
        await navigationPromise;
        this.log.info("搜索表单提交成功，页面已更新");
      } catch {
        this.log.warning("页面导航超时，检查是否已加载结果");
      }

      // 等待页面稳定
      await this.page.waitForLoadState("networkidle", { timeout: 30000 });
      await this.humanDelay(1000, 2000);

      return true;
    } catch (error) {
      this.log.error(`提交搜索表单失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 检测搜索结果
   */
  async detectSearchResults(): Promise<{ hasResults: boolean; count: number }> {
    this.log.info("检测搜索结果");

    try {
      const resultsInfo = await this.page.evaluate(() => {
        // 查找结果表格或列表
        const resultSelectors = [
          "table.results",
          ".program-list",
          ".merchant-list",
          "table tbody tr",
          ".search-results",
          ".program-row",
        ];

        let resultElements = null;
        let resultCount = 0;

        for (const selector of resultSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            resultElements = elements;
            resultCount = elements.length;
            break;
          }
        }

        // 查找结果计数文本
        const countText = document.body.textContent || "";
        const countMatches = [
          /(\d+)\s*results?/i,
          /(\d+)\s*programs?/i,
          /(\d+)\s*merchants?/i,
          /found\s*(\d+)/i,
        ];

        let textCount = 0;
        for (const regex of countMatches) {
          const match = countText.match(regex);
          if (match) {
            textCount = parseInt(match[1]);
            break;
          }
        }

        return {
          hasResultTable: !!resultElements,
          elementCount: resultCount,
          textCount: textCount,
          currentUrl: window.location.href,
          pageTitle: document.title,
        };
      });

      const finalCount = Math.max(
        resultsInfo.elementCount,
        resultsInfo.textCount,
      );
      const hasResults = resultsInfo.hasResultTable && finalCount > 0;

      this.log.info(`搜索结果检测完成:`, {
        hasResults,
        count: finalCount,
        url: resultsInfo.currentUrl,
      });

      return {
        hasResults,
        count: finalCount,
      };
    } catch (error) {
      this.log.error(`检测搜索结果失败: ${(error as Error).message}`);
      return { hasResults: false, count: 0 };
    }
  }

  /**
   * 从环境变量获取搜索参数
   */
  getSearchParamsFromConfig(): SearchParams {
    return {
      searchText: this.config.searchText || undefined,
      networkId: this.config.networkId || undefined,
      opmProvider: this.config.opmProvider || undefined,
      category: this.config.category || undefined,
      country: this.config.country || undefined,
      shippingCountry: this.config.shippingCountry || undefined,
      displayType: this.config.displayType,
    };
  }

  /**
   * 模拟人类滚动查看表单
   */
  private async simulateFormReview(): Promise<void> {
    this.log.debug("模拟查看表单内容");

    // 随机滚动查看表单
    const scrollAmount = Math.floor(Math.random() * 200) + 100;
    await this.page.evaluate((amount) => {
      window.scrollBy(0, amount);
    }, scrollAmount);

    await this.humanDelay(500, 1000);

    // 滚动回到表单顶部
    await this.page.evaluate(() => {
      const form = document.querySelector("form, .search-form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    await this.humanDelay(300, 600);
  }

  /**
   * 模拟思考停顿
   */
  private async simulateThinking(): Promise<void> {
    this.log.debug("模拟思考停顿");
    await this.humanDelay(800, 2000);
  }

  /**
   * 执行搜索操作
   */
  async performSearch(params: SearchParams): Promise<SearchResult> {
    this.log.info("开始执行搜索操作", params);

    try {
      // 1. 检查是否在正确页面
      if (!(await this.isOnProgramDirectoryPage())) {
        return {
          success: false,
          error: "当前不在Program Directory页面",
        };
      }

      // 2. 检测搜索表单
      if (!(await this.detectSearchForm())) {
        return {
          success: false,
          error: "未找到搜索表单",
        };
      }

      // 3. 模拟查看表单
      await this.simulateFormReview();

      // 4. 填充搜索参数
      this.log.info("🖊️ 开始填充搜索参数");
      const fillSuccess = await this.fillSearchParams(params);
      if (!fillSuccess) {
        return {
          success: false,
          error: "填充搜索参数失败",
        };
      }

      // 5. 模拟检查填写内容的思考停顿
      await this.simulateThinking();

      // 6. 提交搜索表单
      this.log.info("🚀 准备提交搜索");
      const submitSuccess = await this.submitSearchForm();
      if (!submitSuccess) {
        return {
          success: false,
          error: "提交搜索表单失败",
        };
      }

      // 7. 检测搜索结果
      this.log.info("🔍 检测搜索结果");
      const results = await this.detectSearchResults();

      const searchResult: SearchResult = {
        success: results.hasResults,
        resultsCount: results.count,
        currentUrl: this.page.url(),
        searchParams: params,
      };

      if (!results.hasResults) {
        searchResult.error = "未找到搜索结果";
      }

      this.log.info("搜索操作完成", searchResult);
      return searchResult;
    } catch (error) {
      this.log.error(`搜索操作失败: ${(error as Error).message}`);
      return {
        success: false,
        error: `搜索失败: ${(error as Error).message}`,
        searchParams: params,
      };
    }
  }

  /**
   * 调试：打印搜索表单结构
   */
  async debugSearchForm(): Promise<void> {
    this.log.info("调试搜索表单结构...");

    const formStructure = await this.page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form"));
      return forms.map((form) => ({
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className,
        inputs: Array.from(form.querySelectorAll("input")).map((input) => ({
          name: input.name,
          type: input.type,
          value: input.value,
          id: input.id,
        })),
        selects: Array.from(form.querySelectorAll("select")).map((select) => ({
          name: select.name,
          id: select.id,
          options: Array.from(select.options).map((option) => ({
            value: option.value,
            text: option.text,
          })),
        })),
        buttons: Array.from(
          form.querySelectorAll('button, input[type="submit"]'),
        ).map((button) => ({
          type: (button as HTMLButtonElement | HTMLInputElement).type,
          value: (button as HTMLInputElement).value || button.textContent,
          id: button.id,
        })),
      }));
    });

    this.log.info("表单结构信息:", formStructure);
  }

  /**
   * 处理Chosen.js选择器
   */
  private async selectChosenOption(
    chosenSelector: string,
    value: string,
  ): Promise<boolean> {
    try {
      this.log.info(`使用Chosen接口选择选项: ${value}`);

      // 1. 找到Chosen容器
      const chosenContainer = await this.page.$(chosenSelector);
      if (!chosenContainer) {
        this.log.warning(`未找到Chosen容器: ${chosenSelector}`);
        return false;
      }

      // 2. 点击Chosen选择器打开下拉列表
      const chosenSingle = await chosenContainer.$(".chosen-single");
      if (!chosenSingle) {
        this.log.warning("未找到Chosen单选触发器");
        return false;
      }

      await chosenSingle.click();
      await this.humanDelay(300, 600);

      // 3. 等待下拉列表出现
      await this.page.waitForSelector(".chosen-drop .chosen-results", {
        timeout: 5000,
      });

      // 4. 查找对应的选项
      const chosenResults = await this.page.$(".chosen-drop .chosen-results");
      if (!chosenResults) {
        this.log.warning("未找到Chosen选项列表");
        return false;
      }

      // 5. 根据值查找选项
      const option = await chosenResults.$(
        `li.active-result[data-option-array-index="${value}"]`,
      );
      if (option) {
        await option.click();
        await this.humanDelay(200, 400);
        this.log.info(`✅ 成功选择Chosen选项: ${value}`);
        return true;
      }

      // 6. 如果找不到精确匹配，尝试文本匹配
      const allOptions = await chosenResults.$$("li.active-result");
      for (const opt of allOptions) {
        const text = await opt.textContent();
        if (text && text.trim().includes("Clothing & Apparel")) {
          await opt.click();
          await this.humanDelay(200, 400);
          this.log.info(`✅ 通过文本匹配选择Chosen选项: ${text.trim()}`);
          return true;
        }
      }

      this.log.warning(`未找到匹配的Chosen选项: ${value}`);
      return false;
    } catch (error) {
      this.log.error(`Chosen选择失败: ${(error as Error).message}`);
      return false;
    }
  }
}
