/**
 * FMTC 简单登录测试
 */

import { chromium } from "playwright";
import {
  FMTC_SELECTORS,
  FMTC_URL_PATTERNS,
} from "../../sites/fmtc/selectors.js";
import type { PageElementCheck, SelectorTestResult } from "./test-types.js";

/**
 * 简单的登录测试
 */
async function testLogin() {
  console.log("开始测试 FMTC 登录...");

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // 设置用户代理
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });

    // 导航到登录页面
    console.log("导航到登录页面...");
    await page.goto(FMTC_URL_PATTERNS.LOGIN);

    // 等待页面加载
    console.log("等待页面加载...");
    await page.waitForSelector(FMTC_SELECTORS.login.usernameInput);
    await page.waitForSelector(FMTC_SELECTORS.login.passwordInput);
    await page.waitForSelector(FMTC_SELECTORS.login.submitButton);

    // 检查页面元素
    console.log("检查页面元素...");
    const elements: PageElementCheck = await page.evaluate(() => {
      return {
        hasUsernameInput: !!document.querySelector(
          '#username, input[name="username"]',
        ),
        hasPasswordInput: !!document.querySelector(
          '#password, input[name="password"]',
        ),
        hasSubmitButton: !!document.querySelector(
          'button[type="submit"], .btn.fmtc-primary-btn',
        ),
        hasRecaptcha: !!document.querySelector(
          ".g-recaptcha, #rc-anchor-container",
        ),
        hasForm: !!document.querySelector(
          'form#form, form[action="/cp/login"]',
        ),
      };
    });

    console.log("页面元素检查结果:", elements);

    // 如果设置了凭据，尝试登录
    const username = process.env.FMTC_USERNAME;
    const password = process.env.FMTC_PASSWORD;

    if (username && password) {
      console.log("尝试登录...");

      // 填写用户名
      await page.fill(FMTC_SELECTORS.login.usernameInput, username);
      await page.waitForTimeout(500);

      // 填写密码
      await page.fill(FMTC_SELECTORS.login.passwordInput, password);
      await page.waitForTimeout(500);

      // 检查是否有reCAPTCHA
      const hasRecaptcha = await page.$(FMTC_SELECTORS.login.recaptcha!);
      if (hasRecaptcha) {
        console.log("检测到 reCAPTCHA，需要手动完成...");
        console.log("请在浏览器中完成验证码验证，然后按回车键继续...");

        // 等待用户输入
        await new Promise((resolve) => {
          process.stdin.once("data", () => resolve(void 0));
        });
      }

      // 提交表单
      console.log("提交表单...");
      await page.click(FMTC_SELECTORS.login.submitButton);

      // 等待页面跳转
      await page.waitForTimeout(3000);

      // 检查是否登录成功
      const currentUrl = page.url();
      console.log("当前 URL:", currentUrl);

      if (currentUrl.includes("login")) {
        console.log("可能登录失败，仍在登录页面");

        // 检查错误消息
        const errorElement = await page.$(FMTC_SELECTORS.login.errorMessage!);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log("错误消息:", errorText);
        }
      } else {
        console.log("可能登录成功，已跳转到其他页面");
      }
    } else {
      console.log("未设置登录凭据，跳过登录测试");
      console.log("请设置环境变量 FMTC_USERNAME 和 FMTC_PASSWORD");
    }

    console.log("测试完成，按回车键关闭浏览器...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(void 0));
    });
  } catch (error) {
    console.error("测试失败:", error);
  } finally {
    await browser.close();
  }
}

/**
 * 测试页面选择器
 */
async function testSelectors() {
  console.log("开始测试页面选择器...");

  const browser = await chromium.launch({
    headless: false,
  });

  try {
    const page = await browser.newPage();

    // 导航到登录页面
    await page.goto(FMTC_URL_PATTERNS.LOGIN);

    // 等待页面加载
    await page.waitForLoadState("networkidle");

    // 测试所有选择器
    const selectorTests: SelectorTestResult = await page.evaluate(
      (selectors) => {
        return {
          usernameInput: !!document.querySelector(
            selectors.login.usernameInput,
          ),
          passwordInput: !!document.querySelector(
            selectors.login.passwordInput,
          ),
          submitButton: !!document.querySelector(selectors.login.submitButton),
          loginForm: !!document.querySelector(selectors.login.loginForm),
          recaptcha: !!document.querySelector(selectors.login.recaptcha || ""),
          recaptchaResponse: !!document.querySelector(
            selectors.login.recaptchaResponse || "",
          ),
          forgotPasswordLink: !!document.querySelector(
            selectors.login.forgotPasswordLink || "",
          ),
          signUpLink: !!document.querySelector(
            selectors.login.signUpLink || "",
          ),
        };
      },
      FMTC_SELECTORS,
    );

    console.log("选择器测试结果:");
    Object.entries(selectorTests).forEach(([selector, found]) => {
      console.log(`  ${selector}: ${found ? "✅" : "❌"}`);
    });

    // 计算成功率
    const successRate =
      Object.values(selectorTests).filter(Boolean).length /
      Object.keys(selectorTests).length;
    console.log(`选择器成功率: ${(successRate * 100).toFixed(1)}%`);
  } catch (error) {
    console.error("选择器测试失败:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "selectors") {
  testSelectors();
} else {
  testLogin();
}

export { testLogin, testSelectors };
