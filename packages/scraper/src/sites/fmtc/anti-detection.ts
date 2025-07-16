/**
 * FMTC 反检测策略
 */

import type { Page } from "playwright";
import type { Log } from "crawlee";
import type { FMTCAntiDetectionConfig } from "./types.js";
import { FMTC_ERROR_PATTERNS } from "./selectors.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";
import { FMTC_CONFIG } from "./config.js";

/**
 * FMTC 反检测策略类
 */
export class FMTCAntiDetection {
  private page: Page;
  private log: Log;
  private executionId?: string;
  private config: FMTCAntiDetectionConfig;
  private lastActionTime: number = 0;
  private actionCount: number = 0;

  constructor(
    page: Page,
    log: Log,
    config?: Partial<FMTCAntiDetectionConfig>,
    executionId?: string,
  ) {
    this.page = page;
    this.log = log;
    this.executionId = executionId;

    // 默认配置
    this.config = {
      enableRandomDelay: true,
      delayRange: { min: 1000, max: 5000 },
      simulateMouseMovement: true,
      simulateScrolling: true,
      detectAntiBot: true,
      retryAttempts: 3,
      sessionTimeout: 30 * 60 * 1000, // 30分钟
      ...config,
    };
  }

  /**
   * 检查是否应该输出调试日志
   */
  private shouldLogDebug(): boolean {
    return FMTC_CONFIG.DEBUG_MODE;
  }

  /**
   * 模拟真实用户行为
   */
  async simulateRealUserBehavior(): Promise<void> {
    try {
      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "开始模拟真实用户行为",
        );
      }

      // 1. 随机延迟
      if (this.config.enableRandomDelay) {
        await this.randomDelay();
      }

      // 2. 模拟鼠标移动
      if (this.config.simulateMouseMovement) {
        await this.simulateMouseMovement();
      }

      // 3. 模拟滚动
      if (this.config.simulateScrolling) {
        await this.simulateScrolling();
      }

      // 4. 随机页面交互
      await this.randomPageInteraction();

      // 5. 更新行为计数
      this.updateActionMetrics();

      if (this.shouldLogDebug()) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "用户行为模拟完成");
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "模拟用户行为时出错", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 处理验证码
   */
  async handleCaptcha(): Promise<boolean> {
    try {
      await this.logMessage(LocalScraperLogLevel.WARN, "检测到验证码挑战");

      // 检查验证码类型
      const captchaType = await this.detectCaptchaType();

      switch (captchaType) {
        case "recaptcha":
          return await this.handleReCaptcha();
        case "image":
          return await this.handleImageCaptcha();
        case "text":
          return await this.handleTextCaptcha();
        default:
          await this.logMessage(LocalScraperLogLevel.ERROR, "未知验证码类型");
          return false;
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "处理验证码失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 检测是否被封禁
   */
  async detectBlocking(): Promise<boolean> {
    try {
      if (this.shouldLogDebug()) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "检测反爬虫机制");
      }

      // 1. 检查HTTP状态码
      const response = await this.page
        .waitForResponse((response) => response.url().includes("fmtc.co"), {
          timeout: 5000,
        })
        .catch(() => null);

      if (
        response &&
        (response.status() === 403 || response.status() === 429)
      ) {
        await this.logMessage(LocalScraperLogLevel.WARN, `检测到HTTP封禁`, {
          status: response.status(),
          url: response.url(),
        });
        return true;
      }

      // 2. 检查页面内容中的封禁指示器
      const pageContent = await this.page.content();

      for (const [errorType, patterns] of Object.entries(FMTC_ERROR_PATTERNS)) {
        for (const pattern of patterns) {
          if (pageContent.toLowerCase().includes(pattern)) {
            await this.logMessage(LocalScraperLogLevel.WARN, `检测到封禁信号`, {
              errorType,
              pattern,
            });
            return true;
          }
        }
      }

      // 3. 检查特定的封禁页面元素
      const blockingIndicators = [
        ".blocked",
        ".banned",
        ".access-denied",
        ".rate-limit",
        '[class*="captcha"]',
        "#captcha",
      ];

      for (const indicator of blockingIndicators) {
        const element = await this.page.$(indicator);
        if (element) {
          await this.logMessage(LocalScraperLogLevel.WARN, `检测到封禁元素`, {
            selector: indicator,
          });
          return true;
        }
      }

      // 4. 检查页面标题
      const title = await this.page.title();
      const suspiciousTitles = [
        "blocked",
        "access denied",
        "forbidden",
        "403",
        "429",
      ];

      if (suspiciousTitles.some((term) => title.toLowerCase().includes(term))) {
        await this.logMessage(LocalScraperLogLevel.WARN, `检测到可疑页面标题`, {
          title,
        });
        return true;
      }

      return false;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "检测封禁状态时出错", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 重新建立会话
   */
  async recreateSession(): Promise<boolean> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "开始重新建立会话");

      // 1. 清除cookies和存储
      await this.clearBrowserData();

      // 2. 等待较长时间 (模拟用户离开后重新访问)
      const waitTime = Math.random() * 300000 + 60000; // 1-6分钟
      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          `等待 ${Math.round(waitTime / 1000)} 秒后重新建立会话`,
        );
      }
      await delay(waitTime);

      // 3. 更换User-Agent (如果可能)
      await this.rotateUserAgent();

      // 4. 重新访问首页建立新会话
      await this.page.goto("https://account.fmtc.co", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // 5. 模拟正常浏览行为
      await this.simulateNormalBrowsing();

      await this.logMessage(LocalScraperLogLevel.INFO, "会话重建完成");
      return true;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "重建会话失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 随机延迟
   */
  private async randomDelay(): Promise<void> {
    const delayTime =
      Math.random() *
        (this.config.delayRange.max - this.config.delayRange.min) +
      this.config.delayRange.min;

    await delay(delayTime);
  }

  /**
   * 模拟鼠标移动
   */
  private async simulateMouseMovement(): Promise<void> {
    try {
      const viewport = (await this.page.viewportSize()) || {
        width: 1920,
        height: 1080,
      };

      // 生成多个随机鼠标移动
      const movements = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < movements; i++) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;

        await this.page.mouse.move(x, y, {
          steps: Math.floor(Math.random() * 10) + 5,
        });

        await delay(Math.random() * 1000 + 200);
      }

      // 偶尔点击空白区域
      if (Math.random() < 0.3) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;

        // 确保不点击到链接或按钮
        try {
          const element = await this.page.locator(`body`).first();
          const tagName = await element.evaluate(
            (el: HTMLElement, coords: { x: number; y: number }) => {
              const elementAtPoint = document.elementFromPoint(
                coords.x,
                coords.y,
              );
              return elementAtPoint
                ? elementAtPoint.tagName.toLowerCase()
                : "body";
            },
            { x, y },
          );

          if (!["a", "button", "input"].includes(tagName)) {
            await this.page.mouse.click(x, y);
            await delay(500);
          }
        } catch {
          // 忽略点击错误
        }
      }
    } catch {
      // 忽略鼠标移动错误
    }
  }

  /**
   * 模拟滚动
   */
  private async simulateScrolling(): Promise<void> {
    try {
      const viewport = (await this.page.viewportSize()) || {
        width: 1920,
        height: 1080,
      };

      // 随机滚动方向和距离
      const scrolls = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < scrolls; i++) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const distance = Math.random() * viewport.height * 0.5;

        await this.page.evaluate((scrollDistance) => {
          window.scrollBy({
            top: scrollDistance,
            behavior: "smooth",
          });
        }, direction * distance);

        await delay(Math.random() * 2000 + 1000);
      }
    } catch {
      // 忽略滚动错误
    }
  }

  /**
   * 随机页面交互
   */
  private async randomPageInteraction(): Promise<void> {
    try {
      // 30% 概率进行额外交互
      if (Math.random() < 0.3) {
        // 尝试悬停在随机元素上
        const elements = await this.page.$$("a, button, .clickable, [onclick]");
        if (elements.length > 0) {
          const randomElement =
            elements[Math.floor(Math.random() * elements.length)];
          await randomElement.hover();
          await delay(Math.random() * 1000 + 500);
        }
      }

      // 20% 概率按随机键
      if (Math.random() < 0.2) {
        const keys = [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
        ];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        await this.page.keyboard.press(randomKey);
        await delay(500);
      }
    } catch {
      // 忽略交互错误
    }
  }

  /**
   * 检测验证码类型
   */
  private async detectCaptchaType(): Promise<string> {
    try {
      // 检查 reCAPTCHA
      const recaptcha = await this.page.$(
        ".g-recaptcha, .recaptcha, [data-sitekey]",
      );
      if (recaptcha) return "recaptcha";

      // 检查图片验证码
      const imageCaptcha = await this.page.$(
        'img[src*="captcha"], .captcha img',
      );
      if (imageCaptcha) return "image";

      // 检查文本验证码
      const textCaptcha = await this.page.$('input[name*="captcha"], #captcha');
      if (textCaptcha) return "text";

      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * 处理 reCAPTCHA
   */
  private async handleReCaptcha(): Promise<boolean> {
    await this.logMessage(
      LocalScraperLogLevel.WARN,
      "检测到 reCAPTCHA，需要人工处理",
    );
    // reCAPTCHA 需要人工处理或第三方服务
    return false;
  }

  /**
   * 处理图片验证码
   */
  private async handleImageCaptcha(): Promise<boolean> {
    await this.logMessage(
      LocalScraperLogLevel.WARN,
      "检测到图片验证码，需要人工处理",
    );
    // 图片验证码需要OCR或人工处理
    return false;
  }

  /**
   * 处理文本验证码
   */
  private async handleTextCaptcha(): Promise<boolean> {
    await this.logMessage(
      LocalScraperLogLevel.WARN,
      "检测到文本验证码，需要人工处理",
    );
    // 文本验证码需要人工处理
    return false;
  }

  /**
   * 清除浏览器数据
   */
  private async clearBrowserData(): Promise<void> {
    try {
      // 清除cookies
      const context = this.page.context();
      await context.clearCookies();

      // 清除localStorage和sessionStorage
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      if (this.shouldLogDebug()) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "浏览器数据清除完成");
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "清除浏览器数据失败", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 轮换User-Agent
   */
  private async rotateUserAgent(): Promise<void> {
    try {
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
      ];

      const randomUA =
        userAgents[Math.floor(Math.random() * userAgents.length)];
      await this.page.setExtraHTTPHeaders({
        "User-Agent": randomUA,
      });

      if (this.shouldLogDebug()) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "User-Agent 已轮换");
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.WARN, "轮换 User-Agent 失败", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 模拟正常浏览行为
   */
  private async simulateNormalBrowsing(): Promise<void> {
    try {
      // 在首页停留一段时间
      await delay(Math.random() * 5000 + 3000);

      // 模拟浏览行为
      await this.simulateScrolling();
      await delay(2000);
      await this.simulateMouseMovement();
      await delay(1000);

      if (this.shouldLogDebug()) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "正常浏览行为模拟完成",
        );
      }
    } catch {
      // 忽略错误
    }
  }

  /**
   * 更新行为指标
   */
  private updateActionMetrics(): void {
    this.lastActionTime = Date.now();
    this.actionCount++;
  }

  /**
   * 获取会话健康状态
   */
  async getSessionHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查会话是否过期
      const sessionAge = Date.now() - this.lastActionTime;
      if (sessionAge > this.config.sessionTimeout) {
        issues.push("会话可能已过期");
        recommendations.push("重新建立会话");
      }

      // 检查行为频率
      if (this.actionCount > 100) {
        issues.push("行为频率过高");
        recommendations.push("增加延迟时间");
      }

      // 检查是否被封禁
      const isBlocked = await this.detectBlocking();
      if (isBlocked) {
        issues.push("检测到反爬虫机制");
        recommendations.push("等待后重新尝试");
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch {
      return {
        isHealthy: false,
        issues: ["健康检查失败"],
        recommendations: ["重新建立会话"],
      };
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
    this.log.info(`[FMTC AntiDetection] ${message}`);

    if (this.executionId) {
      await sendLogToBackend(
        this.executionId,
        level,
        `[FMTC AntiDetection] ${message}`,
        context,
      );
    }
  }
}
