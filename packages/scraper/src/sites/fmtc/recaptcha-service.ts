/**
 * FMTC reCAPTCHA 处理服务
 * 支持手动处理和自动处理（使用2captcha.com）
 */

import type { Page } from "playwright";
import type { Log } from "crawlee";
import { FMTC_SELECTORS } from "./selectors.js";
import { delay } from "../../utils.js";

/**
 * reCAPTCHA 处理模式
 */
export enum ReCAPTCHAMode {
  MANUAL = "manual",
  AUTO = "auto",
  SKIP = "skip",
}

/**
 * reCAPTCHA 处理结果
 */
export interface ReCAPTCHAResult {
  success: boolean;
  method: "manual" | "auto" | "skip";
  error?: string;
  duration?: number;
  cost?: number; // 自动处理的费用（美分）
}

/**
 * 2captcha.com API 配置
 */
export interface TwoCaptchaConfig {
  apiKey: string;
  softId?: number;
  callback?: string;
  serverDomain?: string;
}

/**
 * reCAPTCHA 处理器配置
 */
export interface ReCAPTCHAConfig {
  mode: ReCAPTCHAMode;
  manualTimeout: number; // 手动处理超时时间（毫秒）
  autoTimeout: number; // 自动处理超时时间（毫秒）
  twoCaptcha?: TwoCaptchaConfig;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * 2captcha.com API 响应
 */
interface TwoCaptchaSubmitResponse {
  status: number;
  request: string;
  error_text?: string;
}

interface TwoCaptchaResultResponse {
  status: number;
  request: string;
  error_text?: string;
}

/**
 * reCAPTCHA 处理服务
 */
export class ReCAPTCHAService {
  private page: Page;
  private log: Log;
  private config: ReCAPTCHAConfig;

  constructor(page: Page, log: Log, config: ReCAPTCHAConfig) {
    this.page = page;
    this.log = log;
    this.config = config;
  }

  /**
   * 检查页面是否存在 reCAPTCHA
   */
  async detectReCAPTCHA(): Promise<boolean> {
    try {
      const recaptchaElement = await this.page.$(
        FMTC_SELECTORS.login.recaptcha!,
      );
      return recaptchaElement !== null;
    } catch (error) {
      this.log.warning(`检测 reCAPTCHA 时出错: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 检查 reCAPTCHA 是否已经完成
   */
  async isReCAPTCHACompleted(): Promise<boolean> {
    try {
      const recaptchaResponse = await this.page.$(
        FMTC_SELECTORS.login.recaptchaResponse!,
      );
      if (recaptchaResponse) {
        const responseValue = await recaptchaResponse.getAttribute("value");
        return responseValue !== null && responseValue.length > 0;
      }
      return false;
    } catch (error) {
      this.log.warning(
        `检查 reCAPTCHA 状态时出错: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * 处理 reCAPTCHA
   */
  async solveReCAPTCHA(): Promise<ReCAPTCHAResult> {
    const startTime = Date.now();

    try {
      // 检查是否存在 reCAPTCHA
      const hasReCAPTCHA = await this.detectReCAPTCHA();
      if (!hasReCAPTCHA) {
        return {
          success: true,
          method: "skip",
          duration: Date.now() - startTime,
        };
      }

      // 检查是否已经完成
      const isCompleted = await this.isReCAPTCHACompleted();
      if (isCompleted) {
        this.log.info("reCAPTCHA 已经完成");
        return {
          success: true,
          method: "skip",
          duration: Date.now() - startTime,
        };
      }

      // 根据配置选择处理模式
      switch (this.config.mode) {
        case ReCAPTCHAMode.MANUAL:
          return await this.solveManually();
        case ReCAPTCHAMode.AUTO:
          return await this.solveAutomatically();
        case ReCAPTCHAMode.SKIP:
          return {
            success: false,
            method: "skip",
            error: "reCAPTCHA 处理已禁用",
            duration: Date.now() - startTime,
          };
        default:
          throw new Error(`不支持的 reCAPTCHA 处理模式: ${this.config.mode}`);
      }
    } catch (error) {
      return {
        success: false,
        method: this.config.mode === ReCAPTCHAMode.MANUAL ? "manual" : "auto",
        error: `reCAPTCHA 处理失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 手动处理 reCAPTCHA
   */
  private async solveManually(): Promise<ReCAPTCHAResult> {
    const startTime = Date.now();
    this.log.info("等待用户手动完成 reCAPTCHA 验证");

    try {
      // 等待用户完成验证
      await this.page.waitForFunction(
        (selector) => {
          const element = document.querySelector(
            selector,
          ) as HTMLTextAreaElement;
          return element && element.value && element.value.length > 0;
        },
        FMTC_SELECTORS.login.recaptchaResponse!,
        { timeout: this.config.manualTimeout },
      );

      return {
        success: true,
        method: "manual",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        method: "manual",
        error: `手动处理 reCAPTCHA 超时: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 自动处理 reCAPTCHA（使用 2captcha.com）
   */
  private async solveAutomatically(): Promise<ReCAPTCHAResult> {
    const startTime = Date.now();

    if (!this.config.twoCaptcha?.apiKey) {
      return {
        success: false,
        method: "auto",
        error: "2captcha API 密钥未配置",
        duration: Date.now() - startTime,
      };
    }

    this.log.info("使用 2captcha.com 自动处理 reCAPTCHA");

    try {
      // 获取 reCAPTCHA 站点密钥
      const siteKey = await this.extractSiteKey();
      if (!siteKey) {
        throw new Error("无法提取 reCAPTCHA 站点密钥");
      }

      // 获取页面 URL
      const pageUrl = this.page.url();

      // 提交验证码任务到 2captcha
      const taskId = await this.submitCaptchaTask(siteKey, pageUrl);

      // 等待解决结果
      const solution = await this.waitForSolution(taskId);

      // 在页面中应用解决方案
      await this.applySolution(solution);

      return {
        success: true,
        method: "auto",
        duration: Date.now() - startTime,
        cost: this.calculateCost(), // reCAPTCHA v2 通常花费 $0.001
      };
    } catch (error) {
      return {
        success: false,
        method: "auto",
        error: `自动处理 reCAPTCHA 失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 提取 reCAPTCHA 站点密钥
   */
  private async extractSiteKey(): Promise<string | null> {
    try {
      return await this.page.evaluate(() => {
        // 方法1: 从 g-recaptcha 元素的 data-sitekey 属性获取
        const recaptchaElement = document.querySelector(
          ".g-recaptcha",
        ) as HTMLElement;
        if (recaptchaElement) {
          const siteKey = recaptchaElement.getAttribute("data-sitekey");
          if (siteKey) return siteKey;
        }

        // 方法2: 从 reCAPTCHA 脚本中提取
        const scripts = document.querySelectorAll("script");
        for (const script of scripts) {
          const content = script.textContent || script.innerHTML;
          const match = content.match(/['"](6[0-9A-Za-z_-]{39})['"]/);
          if (match) {
            return match[1];
          }
        }

        // 方法3: 从 grecaptcha.render 调用中提取
        if (
          typeof (window as unknown as { grecaptcha?: unknown }).grecaptcha !==
          "undefined"
        ) {
          // 这需要更复杂的逻辑来拦截 grecaptcha.render 调用
          // 暂时返回 null
        }

        return null;
      });
    } catch (error) {
      this.log.warning(`提取站点密钥时出错: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 提交验证码任务到 2captcha
   */
  private async submitCaptchaTask(
    siteKey: string,
    pageUrl: string,
  ): Promise<string> {
    const { apiKey, softId = 4580 } = this.config.twoCaptcha!;

    const params = new URLSearchParams({
      key: apiKey,
      method: "userrecaptcha",
      googlekey: siteKey,
      pageurl: pageUrl,
      json: "1",
      soft_id: softId.toString(),
    });

    const response = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result: TwoCaptchaSubmitResponse = await response.json();

    if (result.status !== 1) {
      throw new Error(
        `2captcha 任务提交失败: ${result.error_text || "未知错误"}`,
      );
    }

    this.log.info(`2captcha 任务已提交，ID: ${result.request}`);
    return result.request;
  }

  /**
   * 等待 2captcha 解决结果
   */
  private async waitForSolution(taskId: string): Promise<string> {
    const { apiKey } = this.config.twoCaptcha!;
    const startTime = Date.now();
    const maxAttempts = Math.floor(this.config.autoTimeout / 5000); // 每5秒检查一次

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 等待5秒后再检查（2captcha 建议的最小间隔）
      if (attempt > 0) {
        await delay(5000);
      } else {
        await delay(20000); // 首次检查等待20秒
      }

      const params = new URLSearchParams({
        key: apiKey,
        action: "get",
        id: taskId,
        json: "1",
      });

      try {
        const response = await fetch(
          `https://2captcha.com/res.php?${params.toString()}`,
        );
        const result: TwoCaptchaResultResponse = await response.json();

        if (result.status === 1) {
          this.log.info(
            `2captcha 验证码已解决，耗时: ${Date.now() - startTime}ms`,
          );
          return result.request;
        }

        if (result.request === "CAPCHA_NOT_READY") {
          this.log.debug(
            `2captcha 验证码处理中... (尝试 ${attempt + 1}/${maxAttempts})`,
          );
          continue;
        }

        // 其他错误
        throw new Error(
          `2captcha 处理失败: ${result.error_text || result.request}`,
        );
      } catch (error) {
        this.log.warning(
          `检查 2captcha 结果时出错: ${(error as Error).message}`,
        );

        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error("2captcha 处理超时");
  }

  /**
   * 在页面中应用解决方案 - 改进版本，增强稳定性
   */
  private async applySolution(solution: string): Promise<void> {
    try {
      this.log.info("开始应用 reCAPTCHA 解决方案");

      // 应用解决方案到页面
      const applyResult = await this.page.evaluate(
        (args: { token: string; responseSelector: string }) => {
          const { token, responseSelector } = args;

          // 设置 reCAPTCHA 响应值
          const responseElement = document.querySelector(
            responseSelector,
          ) as HTMLTextAreaElement;
          if (!responseElement) {
            return { success: false, error: "未找到reCAPTCHA响应元素" };
          }

          try {
            // 设置token值
            responseElement.value = token;

            // 触发多个事件确保被识别
            responseElement.dispatchEvent(
              new Event("input", { bubbles: true }),
            );
            responseElement.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
            responseElement.dispatchEvent(
              new Event("keyup", { bubbles: true }),
            );

            // 尝试触发 reCAPTCHA 回调
            const windowWithGrecaptcha = window as unknown as {
              grecaptcha?: {
                getResponse?: (widgetId?: string) => string;
                [key: string]: unknown;
              };
            };

            if (typeof windowWithGrecaptcha.grecaptcha !== "undefined") {
              try {
                // 查找 reCAPTCHA 小部件
                const recaptchaElement = document.querySelector(
                  ".g-recaptcha",
                ) as HTMLElement;
                if (recaptchaElement) {
                  const widgetId =
                    recaptchaElement.getAttribute("data-widget-id");

                  // 尝试多种回调方式
                  if (windowWithGrecaptcha.grecaptcha.getResponse) {
                    if (widgetId) {
                      windowWithGrecaptcha.grecaptcha.getResponse(widgetId);
                    } else {
                      windowWithGrecaptcha.grecaptcha.getResponse();
                    }
                  }

                  // 尝试执行回调函数
                  const callback =
                    recaptchaElement.getAttribute("data-callback");
                  if (
                    callback &&
                    (window as unknown as Record<string, unknown>)[callback]
                  ) {
                    (
                      (window as unknown as Record<string, unknown>)[callback] as (
                        token: string,
                      ) => void
                    )(token);
                  }
                }
              } catch (cbError) {
                console.warn("触发 reCAPTCHA 回调时出错:", cbError);
              }
            }

            return { success: true, tokenLength: token.length };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        {
          token: solution,
          responseSelector: FMTC_SELECTORS.login.recaptchaResponse!,
        },
      );

      if (!applyResult.success) {
        throw new Error(`应用token失败: ${applyResult.error}`);
      }

      this.log.info(`reCAPTCHA token已设置 (长度: ${applyResult.tokenLength})`);

      // 等待更长时间确保reCAPTCHA状态更新
      await delay(3000);

      // 直接验证token值，而不依赖复杂的状态检测
      const finalValue = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector) as HTMLTextAreaElement;
        return element ? element.value : null;
      }, FMTC_SELECTORS.login.recaptchaResponse!);

      if (!finalValue || finalValue.length < 100) {
        // 记录警告但不失败，让登录流程继续
        this.log.warning(
          `reCAPTCHA token 可能有问题: ${finalValue ? finalValue.length : 0} 字符`,
        );
        this.log.info("尽管验证可能有问题，但将继续尝试提交");
      } else {
        this.log.info(`reCAPTCHA token 验证成功: ${finalValue.length} 字符`);
      }

      this.log.info("reCAPTCHA 解决方案已应用，准备继续登录流程");
    } catch (error) {
      throw new Error(
        `应用 reCAPTCHA 解决方案失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 计算 reCAPTCHA 解决费用
   */
  private calculateCost(): number {
    // reCAPTCHA v2 的标准费用是 $0.001 (0.1美分)
    return 0.1;
  }

  /**
   * 获取余额（从 2captcha API）
   */
  async getBalance(): Promise<number> {
    if (!this.config.twoCaptcha?.apiKey) {
      throw new Error("2captcha API 密钥未配置");
    }

    const params = new URLSearchParams({
      key: this.config.twoCaptcha.apiKey,
      action: "getbalance",
      json: "1",
    });

    const response = await fetch(
      `https://2captcha.com/res.php?${params.toString()}`,
    );
    const result = await response.json();

    if (result.status !== 1) {
      throw new Error(`获取余额失败: ${result.error_text || "未知错误"}`);
    }

    return parseFloat(result.request);
  }

  /**
   * 重试处理 reCAPTCHA
   */
  async solveWithRetry(): Promise<ReCAPTCHAResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      if (attempt > 0) {
        this.log.info(
          `重试 reCAPTCHA 处理 (${attempt + 1}/${this.config.retryAttempts})`,
        );
        await delay(this.config.retryDelay);
      }

      const result = await this.solveReCAPTCHA();

      if (result.success) {
        return result;
      }

      lastError = result.error;
      this.log.warning(
        `reCAPTCHA 处理失败 (尝试 ${attempt + 1}): ${result.error}`,
      );
    }

    return {
      success: false,
      method: this.config.mode === ReCAPTCHAMode.MANUAL ? "manual" : "auto",
      error: `所有重试都失败了。最后错误: ${lastError}`,
    };
  }
}
