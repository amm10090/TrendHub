/**
 * FMTC 登录处理器
 */

import type { Page, ElementHandle } from "playwright";
import type { Log } from "crawlee";
import type { FMTCCredentials, FMTCLoginResult } from "./types.js";
import {
  FMTC_SELECTORS,
  FMTC_URL_PATTERNS,
  FMTC_PAGE_FEATURES,
  FMTC_ERROR_PATTERNS,
} from "./selectors.js";
import { sendLogToBackend, LocalScraperLogLevel, delay } from "../../utils.js";
import {
  ReCAPTCHAService,
  ReCAPTCHAMode,
  type ReCAPTCHAConfig,
} from "./recaptcha-service.js";

/**
 * FMTC 登录处理器类
 */
export class FMTCLoginHandler {
  private page: Page;
  private log: Log;
  private executionId?: string;
  private recaptchaService: ReCAPTCHAService;

  constructor(
    page: Page,
    log: Log,
    executionId?: string,
    recaptchaConfig?: ReCAPTCHAConfig,
  ) {
    this.page = page;
    this.log = log;
    this.executionId = executionId;

    // 创建默认的reCAPTCHA配置
    const defaultRecaptchaConfig: ReCAPTCHAConfig = {
      mode: ReCAPTCHAMode.MANUAL,
      manualTimeout: 60000, // 60秒
      autoTimeout: 120000, // 2分钟
      retryAttempts: 3,
      retryDelay: 5000,
      ...recaptchaConfig,
    };

    this.recaptchaService = new ReCAPTCHAService(
      page,
      log,
      defaultRecaptchaConfig,
    );
  }

  /**
   * 执行登录流程
   */
  async login(credentials: FMTCCredentials): Promise<FMTCLoginResult> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "开始 FMTC 登录流程", {
        username: credentials.username,
      });

      // 1. 检查是否已经登录
      const alreadyLoggedIn = await this.isLoggedIn();
      if (alreadyLoggedIn) {
        await this.logMessage(LocalScraperLogLevel.INFO, "用户已经登录", {
          username: credentials.username,
        });
        return {
          success: true,
          sessionInfo: {
            username: credentials.username,
            loginTime: new Date(),
          },
        };
      }

      // 2. 导航到登录页面
      await this.navigateToLoginPage();

      // 3. 等待登录页面加载
      await this.waitForLoginPageLoad();

      // 3.1. 验证登录表单
      const formValid = await this.validateLoginForm();
      if (!formValid) {
        return {
          success: false,
          error: "登录表单验证失败，页面结构可能已更改",
        };
      }

      // 4. 处理 reCAPTCHA 验证
      const recaptchaResult = await this.recaptchaService.solveWithRetry();
      if (!recaptchaResult.success) {
        await this.logMessage(
          LocalScraperLogLevel.ERROR,
          "reCAPTCHA 验证失败",
          {
            username: credentials.username,
            error: recaptchaResult.error,
            method: recaptchaResult.method,
            duration: recaptchaResult.duration,
            cost: recaptchaResult.cost,
          },
        );

        return {
          success: false,
          error: recaptchaResult.error || "reCAPTCHA 验证失败",
          requiresCaptcha: true,
        };
      } else if (recaptchaResult.method !== "skip") {
        await this.logMessage(LocalScraperLogLevel.INFO, "reCAPTCHA 验证成功", {
          username: credentials.username,
          method: recaptchaResult.method,
          duration: recaptchaResult.duration,
          cost: recaptchaResult.cost,
        });
      }

      // 5. 填写登录表单
      await this.fillLoginForm(credentials);

      // 6. 提交表单
      await this.submitLoginForm();

      // 6.1 检查提交后是否出现新的reCAPTCHA
      await delay(2000); // 等待页面加载
      const needsRecaptchaAgain = await this.recaptchaService.detectReCAPTCHA();

      if (needsRecaptchaAgain) {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          "提交后出现新的reCAPTCHA，重新处理",
          {
            username: credentials.username,
          },
        );

        const secondRecaptchaResult =
          await this.recaptchaService.solveWithRetry();
        if (!secondRecaptchaResult.success) {
          await this.logMessage(
            LocalScraperLogLevel.ERROR,
            "第二次reCAPTCHA验证失败",
            {
              username: credentials.username,
              error: secondRecaptchaResult.error,
            },
          );
          return {
            success: false,
            error: secondRecaptchaResult.error || "第二次reCAPTCHA验证失败",
            requiresCaptcha: true,
          };
        }

        await this.logMessage(
          LocalScraperLogLevel.INFO,
          "第二次reCAPTCHA验证成功",
          {
            username: credentials.username,
            method: secondRecaptchaResult.method,
            duration: secondRecaptchaResult.duration,
            cost: secondRecaptchaResult.cost,
          },
        );

        // 重新提交表单
        await this.submitLoginForm();
      }

      // 7. 等待登录结果
      const loginResult = await this.waitForLoginResult();

      if (loginResult.success) {
        await this.logMessage(LocalScraperLogLevel.INFO, "FMTC 登录成功", {
          username: credentials.username,
          loginTime: new Date(),
        });

        return {
          success: true,
          sessionInfo: {
            username: credentials.username,
            loginTime: new Date(),
            sessionTimeout: 30 * 60 * 1000, // 30分钟
          },
        };
      } else {
        await this.logMessage(LocalScraperLogLevel.ERROR, "FMTC 登录失败", {
          username: credentials.username,
          error: loginResult.error,
        });

        return loginResult;
      }
    } catch (error) {
      const errorMessage = `登录过程中发生错误: ${(error as Error).message}`;
      await this.logMessage(LocalScraperLogLevel.ERROR, errorMessage, {
        username: credentials.username,
        stack: (error as Error).stack,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 检查是否已经登录
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // 注入页面特征检测函数
      const isLoggedIn = await this.page.evaluate(
        FMTC_PAGE_FEATURES.isLoggedIn,
      );

      // 也检查 URL 是否包含登录后的特征
      const currentUrl = this.page.url();
      const isLoginUrl = currentUrl.includes("login");

      return isLoggedIn && !isLoginUrl;
    } catch (error) {
      this.log.warning(`检查登录状态时出错: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 导航到登录页面 - 使用与测试文件一致的重试机制
   */
  private async navigateToLoginPage(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "导航到 FMTC 登录页面");

    let loginPageLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!loginPageLoaded && retryCount < maxRetries) {
      try {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          `尝试第 ${retryCount + 1} 次加载登录页面`,
        );

        await this.page.goto(FMTC_URL_PATTERNS.LOGIN, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });

        // 与测试文件一致的等待时间
        await delay(3000);

        // 验证页面是否正确加载
        const title = await this.page.title();
        if (title.includes("Login") || title.includes("FMTC")) {
          loginPageLoaded = true;
          await this.logMessage(LocalScraperLogLevel.DEBUG, "登录页面加载成功");
        } else {
          throw new Error(`页面标题不正确: ${title}`);
        }
      } catch (error) {
        retryCount++;
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          `第 ${retryCount} 次尝试失败: ${(error as Error).message}`,
        );

        if (retryCount < maxRetries) {
          await this.logMessage(LocalScraperLogLevel.DEBUG, "等待 5 秒后重试");
          await delay(5000);
        }
      }
    }

    if (!loginPageLoaded) {
      throw new Error("无法加载登录页面，已达到最大重试次数");
    }
  }

  /**
   * 等待登录页面加载完成
   */
  private async waitForLoginPageLoad(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "等待登录页面加载");

    try {
      // 等待用户名输入框出现
      await this.page.waitForSelector(FMTC_SELECTORS.login.usernameInput, {
        timeout: 15000,
      });

      // 等待密码输入框出现
      await this.page.waitForSelector(FMTC_SELECTORS.login.passwordInput, {
        timeout: 10000,
      });

      // 等待提交按钮出现
      await this.page.waitForSelector(FMTC_SELECTORS.login.submitButton, {
        timeout: 10000,
      });

      await this.logMessage(LocalScraperLogLevel.DEBUG, "登录页面加载完成");
    } catch (error) {
      throw new Error(`登录页面加载超时: ${(error as Error).message}`);
    }
  }

  /**
   * 检查是否需要验证码
   */
  private async checkCaptchaRequired(): Promise<boolean> {
    try {
      // 检查 reCAPTCHA 是否存在
      const recaptchaElement = await this.page.$(
        FMTC_SELECTORS.login.recaptcha!,
      );

      if (recaptchaElement) {
        await this.logMessage(LocalScraperLogLevel.WARN, "检测到 reCAPTCHA");

        // 检查 reCAPTCHA 是否已经完成
        const recaptchaResponse = await this.page.$(
          FMTC_SELECTORS.login.recaptchaResponse!,
        );
        if (recaptchaResponse) {
          const responseValue = await recaptchaResponse.getAttribute("value");
          if (responseValue && responseValue.length > 0) {
            await this.logMessage(
              LocalScraperLogLevel.INFO,
              "reCAPTCHA 已完成",
            );
            return false;
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      this.log.warning(`检查验证码时出错: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 等待 reCAPTCHA 完成
   */
  private async waitForCaptchaCompletion(
    timeout: number = 60000,
  ): Promise<boolean> {
    await this.logMessage(LocalScraperLogLevel.INFO, "等待 reCAPTCHA 完成", {
      timeout: timeout / 1000,
    });

    try {
      // 等待 reCAPTCHA 响应字段有值
      await this.page.waitForFunction(
        (selector) => {
          const element = document.querySelector(
            selector,
          ) as HTMLTextAreaElement;
          return element && element.value && element.value.length > 0;
        },
        FMTC_SELECTORS.login.recaptchaResponse!,
        { timeout },
      );

      await this.logMessage(LocalScraperLogLevel.INFO, "reCAPTCHA 完成");
      return true;
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "等待 reCAPTCHA 完成超时",
        {
          error: (error as Error).message,
        },
      );
      return false;
    }
  }

  /**
   * 填写登录表单
   */
  private async fillLoginForm(credentials: FMTCCredentials): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "填写登录表单");

    try {
      // 清空并填写用户名
      const usernameInput = await this.page.$(
        FMTC_SELECTORS.login.usernameInput,
      );
      if (usernameInput) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "找到用户名输入框，开始填写",
        );
        await usernameInput.click({ clickCount: 3 }); // 选中全部文本
        await usernameInput.fill(credentials.username);
        await delay(500);

        // 验证用户名是否填写成功
        const usernameValue = await usernameInput.inputValue();
        await this.logMessage(LocalScraperLogLevel.DEBUG, "用户名填写完成", {
          expectedUsername: credentials.username,
          actualUsername: usernameValue,
        });
      } else {
        throw new Error("未找到用户名输入框");
      }

      // 清空并填写密码
      const passwordInput = await this.page.$(
        FMTC_SELECTORS.login.passwordInput,
      );
      if (passwordInput) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "找到密码输入框，开始填写",
        );
        await passwordInput.click({ clickCount: 3 }); // 选中全部文本
        await passwordInput.fill(credentials.password);
        await delay(500);

        // 验证密码是否填写成功（不记录实际密码）
        const passwordValue = await passwordInput.inputValue();
        await this.logMessage(LocalScraperLogLevel.DEBUG, "密码填写完成", {
          passwordLength: credentials.password.length,
          actualPasswordLength: passwordValue.length,
        });
      } else {
        throw new Error("未找到密码输入框");
      }

      await this.logMessage(LocalScraperLogLevel.DEBUG, "登录表单填写完成");
    } catch (error) {
      throw new Error(`填写登录表单失败: ${(error as Error).message}`);
    }
  }

  /**
   * 提交登录表单 - 使用与测试文件一致的方式
   */
  private async submitLoginForm(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "提交登录表单");

    try {
      // 查找提交按钮
      const submitButton = await this.page.$(FMTC_SELECTORS.login.submitButton);
      if (submitButton) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "找到提交按钮，准备点击",
        );

        // 确保按钮可见并可点击
        await submitButton.scrollIntoViewIfNeeded();
        await delay(1000); // 等待更长时间确保页面稳定

        // 使用简单的点击，不并发等待网络状态
        await submitButton.click();

        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "已点击提交按钮，等待页面响应",
        );

        // 等待更长时间让服务器处理请求
        await delay(5000);

        // 尝试等待页面稳定，但不强制
        try {
          await this.page.waitForLoadState("domcontentloaded", {
            timeout: 10000,
          });
        } catch {
          // 忽略超时，继续执行
          await this.logMessage(
            LocalScraperLogLevel.DEBUG,
            "页面加载状态等待超时，继续执行",
          );
        }
      } else {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "未找到提交按钮，尝试按Enter键",
        );

        // 如果找不到按钮，尝试按 Enter 键提交
        await this.page.keyboard.press("Enter");
        await delay(5000);

        try {
          await this.page.waitForLoadState("domcontentloaded", {
            timeout: 10000,
          });
        } catch {
          await this.logMessage(
            LocalScraperLogLevel.DEBUG,
            "Enter提交后页面加载等待超时",
          );
        }
      }

      await this.logMessage(
        LocalScraperLogLevel.DEBUG,
        "登录表单提交完成，即将检查结果",
      );
    } catch (error) {
      throw new Error(`提交登录表单失败: ${(error as Error).message}`);
    }
  }

  /**
   * 等待登录结果 - 优化页面状态检测
   */
  private async waitForLoginResult(): Promise<FMTCLoginResult> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "等待登录结果");

    try {
      // 等待更长时间让页面充分反应
      await delay(5000);

      // 获取当前页面信息
      let currentUrl = this.page.url();
      let pageTitle = await this.page.title();

      await this.logMessage(LocalScraperLogLevel.DEBUG, "初始页面状态检查", {
        currentUrl,
        pageTitle,
      });

      // 如果页面仍在加载，再等待一下
      if (currentUrl.includes("login") && pageTitle.includes("Login")) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "页面可能仍在处理，额外等待",
        );
        await delay(3000);

        // 重新获取页面信息
        currentUrl = this.page.url();
        pageTitle = await this.page.title();

        await this.logMessage(LocalScraperLogLevel.DEBUG, "重新检查页面状态", {
          currentUrl,
          pageTitle,
        });
      }

      // 1. 先检查是否被重定向到登录页（可能触发了反爬）
      if (
        currentUrl.includes("login") &&
        currentUrl !== "https://account.fmtc.co/cp/login"
      ) {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          "检测到可能的反爬重定向",
          {
            currentUrl,
          },
        );

        // 检查页面内容是否包含反爬指示器
        const pageContent = await this.page.content();
        const antiSpamPatterns = [
          "rate limit",
          "too many requests",
          "blocked",
          "suspicious activity",
          "please try again later",
        ];

        for (const pattern of antiSpamPatterns) {
          if (pageContent.toLowerCase().includes(pattern)) {
            return {
              success: false,
              error: `可能触发了反爬机制: ${pattern}`,
            };
          }
        }
      }

      // 2. 检查是否出现新的reCAPTCHA
      const stillNeedsRecaptcha = await this.checkRecaptchaRequired();
      if (stillNeedsRecaptcha && currentUrl.includes("login")) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "提交后检测到新的reCAPTCHA",
        );
        return {
          success: false,
          error: "登录后出现新的reCAPTCHA验证",
          requiresCaptcha: true,
        };
      }

      // 3. 检查是否出现显式错误消息
      const errorMessage = await this.checkForErrorMessage();
      if (errorMessage) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "检测到错误消息", {
          errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }

      // 4. 检查是否登录成功 (通过 URL 变化)
      const isStillOnLoginPage = currentUrl.includes("login");

      await this.logMessage(LocalScraperLogLevel.DEBUG, "URL变化检查", {
        isStillOnLoginPage,
        currentUrl,
      });

      if (!isStillOnLoginPage) {
        // URL 已改变，进一步验证登录状态
        const loginSuccess = await this.isLoggedIn();
        await this.logMessage(LocalScraperLogLevel.DEBUG, "登录状态验证", {
          loginSuccess,
        });
        if (loginSuccess) {
          return { success: true };
        } else {
          return {
            success: false,
            error: "页面跳转但登录状态验证失败",
          };
        }
      }

      // 5. 检查页面是否有登录成功的指示器
      const hasUserMenu = await this.page.$(
        '.user-menu, .logout, [href*="logout"], .dashboard',
      );
      if (hasUserMenu) {
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          "找到用户菜单或仪表板，登录成功",
        );
        return { success: true };
      }

      // 6. 检查页面内容中的错误模式
      const pageContent = await this.page.content();
      for (const [errorType, patterns] of Object.entries(FMTC_ERROR_PATTERNS)) {
        for (const pattern of patterns) {
          if (pageContent.toLowerCase().includes(pattern)) {
            await this.logMessage(
              LocalScraperLogLevel.DEBUG,
              "匹配到错误模式",
              {
                errorType,
                pattern,
              },
            );
            return {
              success: false,
              error: `登录失败: ${errorType}`,
            };
          }
        }
      }

      // 7. 默认情况 - 仍在登录页面且无明确错误
      await this.logMessage(LocalScraperLogLevel.WARN, "登录状态不明确", {
        currentUrl,
        pageTitle,
      });

      return {
        success: false,
        error: `登录状态不明确 - URL: ${currentUrl}, 标题: ${pageTitle}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `等待登录结果时出错: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 检查错误消息
   */
  private async checkForErrorMessage(): Promise<string | null> {
    try {
      const errorElement = await this.page.$(
        FMTC_SELECTORS.login.errorMessage!,
      );
      if (errorElement) {
        const errorText = await errorElement.textContent();
        return errorText?.trim() || "未知登录错误";
      }
      return null;
    } catch (error) {
      this.log.warning(`检查错误消息时出错: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 获取登录表单元素
   */
  async getLoginForm(): Promise<ElementHandle | null> {
    try {
      return await this.page.$(FMTC_SELECTORS.login.loginForm);
    } catch (error) {
      this.log.warning(`获取登录表单时出错: ${(error as Error).message}`);
      return null;
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
    this.log.info(`[FMTC Login] ${message}`);

    if (this.executionId) {
      try {
        await sendLogToBackend(
          this.executionId,
          level,
          `[FMTC Login] ${message}`,
          context,
        );
      } catch {
        // 静默处理日志发送失败，不影响主流程
        console.debug(`日志发送失败（忽略）: ${message}`);
      }
    }
  }

  /**
   * 清理会话 (登出)
   */
  async logout(): Promise<boolean> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "开始登出流程");

      // 查找登出链接
      const logoutLink = await this.page.$('a[href*="logout"], .logout');
      if (logoutLink) {
        await logoutLink.click();
        await this.page.waitForLoadState("networkidle");

        await this.logMessage(LocalScraperLogLevel.INFO, "登出成功");
        return true;
      } else {
        await this.logMessage(LocalScraperLogLevel.WARN, "未找到登出链接");
        return false;
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "登出失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 刷新会话 (保持登录状态)
   */
  async refreshSession(): Promise<boolean> {
    try {
      await this.logMessage(LocalScraperLogLevel.DEBUG, "刷新会话");

      // 简单地访问一个受保护的页面来刷新会话
      await this.page.goto(FMTC_URL_PATTERNS.DEFAULT_MERCHANT_LIST, {
        waitUntil: "networkidle",
        timeout: 15000,
      });

      const isStillLoggedIn = await this.isLoggedIn();
      if (isStillLoggedIn) {
        await this.logMessage(LocalScraperLogLevel.DEBUG, "会话刷新成功");
        return true;
      } else {
        await this.logMessage(LocalScraperLogLevel.WARN, "会话已过期");
        return false;
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "刷新会话失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 尝试解决 reCAPTCHA (如果可能)
   */
  async handleRecaptcha(): Promise<boolean> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "尝试处理 reCAPTCHA");

      const result = await this.recaptchaService.solveWithRetry();

      if (result.success) {
        await this.logMessage(LocalScraperLogLevel.INFO, "reCAPTCHA 处理成功", {
          method: result.method,
          duration: result.duration,
          cost: result.cost,
        });
        return true;
      } else {
        await this.logMessage(
          LocalScraperLogLevel.ERROR,
          "reCAPTCHA 处理失败",
          {
            error: result.error,
            method: result.method,
          },
        );
        return false;
      }
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "处理 reCAPTCHA 失败", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 验证登录表单是否有效
   */
  async validateLoginForm(): Promise<boolean> {
    try {
      const form = await this.page.$(FMTC_SELECTORS.login.loginForm);
      const usernameInput = await this.page.$(
        FMTC_SELECTORS.login.usernameInput,
      );
      const passwordInput = await this.page.$(
        FMTC_SELECTORS.login.passwordInput,
      );
      const submitButton = await this.page.$(FMTC_SELECTORS.login.submitButton);

      const isValid = form && usernameInput && passwordInput && submitButton;

      if (!isValid) {
        await this.logMessage(LocalScraperLogLevel.ERROR, "登录表单验证失败", {
          form: !!form,
          usernameInput: !!usernameInput,
          passwordInput: !!passwordInput,
          submitButton: !!submitButton,
        });
      }

      return !!isValid;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "验证登录表单时出错", {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 获取当前 reCAPTCHA 服务的余额
   */
  async getRecaptchaBalance(): Promise<number> {
    try {
      return await this.recaptchaService.getBalance();
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "获取 reCAPTCHA 余额失败",
        {
          error: (error as Error).message,
        },
      );
      throw error;
    }
  }

  /**
   * 检查是否需要 reCAPTCHA 验证
   */
  async checkRecaptchaRequired(): Promise<boolean> {
    try {
      return await this.recaptchaService.detectReCAPTCHA();
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "检查 reCAPTCHA 状态失败",
        {
          error: (error as Error).message,
        },
      );
      return false;
    }
  }

  /**
   * 检查 reCAPTCHA 是否已完成
   */
  async checkRecaptchaCompleted(): Promise<boolean> {
    try {
      return await this.recaptchaService.isReCAPTCHACompleted();
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.ERROR,
        "检查 reCAPTCHA 完成状态失败",
        {
          error: (error as Error).message,
        },
      );
      return false;
    }
  }

  /**
   * 获取当前 reCAPTCHA 服务实例
   */
  getRecaptchaService(): ReCAPTCHAService {
    return this.recaptchaService;
  }
}
