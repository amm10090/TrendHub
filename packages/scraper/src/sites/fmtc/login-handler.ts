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

/**
 * FMTC 登录处理器类
 */
export class FMTCLoginHandler {
  private page: Page;
  private log: Log;
  private executionId?: string;

  constructor(page: Page, log: Log, executionId?: string) {
    this.page = page;
    this.log = log;
    this.executionId = executionId;
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

      // 4. 检测是否需要验证码
      const requiresCaptcha = await this.checkCaptchaRequired();
      if (requiresCaptcha) {
        await this.logMessage(
          LocalScraperLogLevel.WARN,
          "检测到 reCAPTCHA 要求",
          {
            username: credentials.username,
          },
        );

        // 尝试等待用户手动完成验证码
        const captchaCompleted = await this.waitForCaptchaCompletion();
        if (!captchaCompleted) {
          return {
            success: false,
            error: "需要手动完成 reCAPTCHA 验证",
            requiresCaptcha: true,
          };
        }
      }

      // 5. 填写登录表单
      await this.fillLoginForm(credentials);

      // 6. 提交表单
      await this.submitLoginForm();

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
   * 导航到登录页面
   */
  private async navigateToLoginPage(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "导航到 FMTC 登录页面");

    await this.page.goto(FMTC_URL_PATTERNS.LOGIN, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 额外等待确保页面完全加载
    await delay(2000);
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
        await usernameInput.click({ clickCount: 3 }); // 选中全部文本
        await usernameInput.fill(credentials.username);
        await delay(500);
      } else {
        throw new Error("未找到用户名输入框");
      }

      // 清空并填写密码
      const passwordInput = await this.page.$(
        FMTC_SELECTORS.login.passwordInput,
      );
      if (passwordInput) {
        await passwordInput.click({ clickCount: 3 }); // 选中全部文本
        await passwordInput.fill(credentials.password);
        await delay(500);
      } else {
        throw new Error("未找到密码输入框");
      }

      await this.logMessage(LocalScraperLogLevel.DEBUG, "登录表单填写完成");
    } catch (error) {
      throw new Error(`填写登录表单失败: ${(error as Error).message}`);
    }
  }

  /**
   * 提交登录表单
   */
  private async submitLoginForm(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "提交登录表单");

    try {
      // 再次检查 reCAPTCHA 是否已完成
      const recaptchaRequired = await this.checkCaptchaRequired();
      if (recaptchaRequired) {
        throw new Error("reCAPTCHA 未完成，无法提交表单");
      }

      // 查找并点击提交按钮
      const submitButton = await this.page.$(FMTC_SELECTORS.login.submitButton);
      if (submitButton) {
        // 确保按钮可点击
        await submitButton.scrollIntoViewIfNeeded();
        await delay(500);

        // 等待网络请求完成
        await Promise.all([
          this.page.waitForLoadState("networkidle"),
          submitButton.click(),
        ]);

        await delay(3000); // 额外等待处理时间
      } else {
        // 如果找不到按钮，尝试按 Enter 键提交
        await this.page.keyboard.press("Enter");
        await this.page.waitForLoadState("networkidle");
        await delay(3000);
      }

      await this.logMessage(LocalScraperLogLevel.DEBUG, "登录表单提交完成");
    } catch (error) {
      throw new Error(`提交登录表单失败: ${(error as Error).message}`);
    }
  }

  /**
   * 等待登录结果
   */
  private async waitForLoginResult(): Promise<FMTCLoginResult> {
    await this.logMessage(LocalScraperLogLevel.DEBUG, "等待登录结果");

    try {
      // 等待一段时间让页面反应
      await delay(3000);

      // 检查是否出现错误消息
      const errorMessage = await this.checkForErrorMessage();
      if (errorMessage) {
        return {
          success: false,
          error: errorMessage,
        };
      }

      // 检查是否登录成功 (通过 URL 变化或页面内容)
      const currentUrl = this.page.url();
      const isStillOnLoginPage = currentUrl.includes("login");

      if (!isStillOnLoginPage) {
        // URL 已改变，可能登录成功
        const loginSuccess = await this.isLoggedIn();
        if (loginSuccess) {
          return { success: true };
        }
      }

      // 检查页面是否有登录成功的指示器
      const hasUserMenu = await this.page.$(
        '.user-menu, .logout, [href*="logout"]',
      );
      if (hasUserMenu) {
        return { success: true };
      }

      // 如果仍在登录页面，检查具体错误
      const pageContent = await this.page.content();
      for (const [errorType, patterns] of Object.entries(FMTC_ERROR_PATTERNS)) {
        for (const pattern of patterns) {
          if (pageContent.toLowerCase().includes(pattern)) {
            return {
              success: false,
              error: `登录失败: ${errorType}`,
            };
          }
        }
      }

      // 默认错误
      return {
        success: false,
        error: "登录状态未知，请检查凭据",
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
      await sendLogToBackend(
        this.executionId,
        level,
        `[FMTC Login] ${message}`,
        context,
      );
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

      // 检查是否有 reCAPTCHA 复选框
      const recaptchaCheckbox = await this.page.$(
        FMTC_SELECTORS.login.recaptchaCheckbox!,
      );
      if (recaptchaCheckbox) {
        // 点击 reCAPTCHA 复选框
        await recaptchaCheckbox.click();
        await delay(2000);

        // 等待 reCAPTCHA 完成
        const completed = await this.waitForCaptchaCompletion(30000);
        if (completed) {
          await this.logMessage(
            LocalScraperLogLevel.INFO,
            "reCAPTCHA 处理成功",
          );
          return true;
        }
      }

      await this.logMessage(
        LocalScraperLogLevel.WARN,
        "无法自动处理 reCAPTCHA",
      );
      return false;
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
}
