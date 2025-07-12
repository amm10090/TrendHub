/**
 * FMTC 调试登录测试 - 检查页面内容和 reCAPTCHA 状态 (支持自动验证)
 */

import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join } from "path";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import {
  getEnvironmentConfig,
  getRecaptchaConfig,
} from "../../sites/fmtc/config.js";

// 手动加载环境变量
try {
  const envPath = join(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf8");
  const envLines = envFile.split("\n");

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=");
        process.env[key] = value;
      }
    }
  }
} catch (error) {
  console.warn("无法加载 .env 文件:", error);
}

/**
 * 简单的日志实现
 */
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warning: (message: string) => console.log(`[WARN] ${message}`),
  error: (message: string) => console.log(`[ERROR] ${message}`),
  debug: (message: string) => console.log(`[DEBUG] ${message}`),
};

/**
 * 使用完整登录处理器测试自动验证
 */
async function testAutoLoginWithHandler(): Promise<void> {
  console.log("🤖 开始测试 FMTC 自动登录（使用登录处理器）...");

  const config = getEnvironmentConfig();
  const recaptchaConfig = getRecaptchaConfig();

  console.log("配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", recaptchaConfig.mode);
  console.log("- 无头模式:", config.headlessMode);

  if (!config.username || !config.password) {
    console.error("❌ 请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  // 获取 reCAPTCHA 余额（如果是自动模式）
  if (recaptchaConfig.mode === "auto" && recaptchaConfig.twoCaptcha?.apiKey) {
    try {
      console.log("💰 检查 2captcha 余额...");
      // 简单的余额检查
      const params = new URLSearchParams({
        key: recaptchaConfig.twoCaptcha.apiKey,
        action: "getbalance",
        json: "1",
      });

      const response = await fetch(
        `https://2captcha.com/res.php?${params.toString()}`,
      );
      const result = await response.json();

      if (result.status === 1) {
        console.log(`✅ 2captcha 余额: $${result.request}`);
      } else {
        console.error("❌ 获取余额失败:", result.error_text);
        return;
      }
    } catch (error) {
      console.error("❌ 检查余额时出错:", error);
      return;
    }
  }

  const browser = await chromium.launch({
    headless: false, // 显示浏览器以便观察
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // 设置反检测
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // 创建登录处理器
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      "debug-auto-test",
      recaptchaConfig,
    );

    console.log("🚀 开始自动登录流程...");

    // 执行登录
    const loginResult = await loginHandler.login({
      username: config.username!,
      password: config.password!,
    });

    console.log("📊 登录结果:", loginResult);

    if (loginResult.success) {
      console.log("🎉 自动登录成功！");

      // 测试会话持久化
      console.log("🧪 测试会话持久化...");

      // 访问仪表盘
      await page.goto("https://account.fmtc.co/cp/program_directory/index", {
        waitUntil: "networkidle",
      });

      const dashboardUrl = page.url();
      console.log("📍 仪表盘 URL:", dashboardUrl);

      if (!dashboardUrl.includes("login")) {
        console.log("✅ 成功访问仪表盘，会话保持正常");

        // 访问商户列表
        await page.goto(
          "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
          {
            waitUntil: "networkidle",
          },
        );

        const merchantListUrl = page.url();
        console.log("📍 商户列表 URL:", merchantListUrl);

        if (!merchantListUrl.includes("login")) {
          console.log("🎉 成功访问商户列表，自动登录完全成功！");
        } else {
          console.log("⚠️  访问商户列表时被重定向到登录页");
        }
      } else {
        console.log("❌ 访问仪表盘时被重定向到登录页");
      }
    } else {
      console.log("❌ 自动登录失败:", loginResult.error);

      if (loginResult.requiresCaptcha) {
        console.log("🔄 需要处理验证码");
      }
    }

    console.log("🔚 测试完成，浏览器将保持打开30秒以便检查...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("❌ 测试过程出错:", error);
  } finally {
    await browser.close();
  }
}

/**
 * 调试页面内容（原始调试功能保留）
 */
async function debugPageContent(): Promise<void> {
  console.log("🔍 开始调试 FMTC 登录页面...");

  const config = getEnvironmentConfig();

  if (!config.username || !config.password) {
    console.error("❌ 请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  const browser = await chromium.launch({
    headless: false, // 强制显示浏览器以便调试
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // 设置反检测
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // 导航到登录页面
    console.log("📍 导航到登录页面...");
    await page.goto("https://account.fmtc.co/cp/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log("✅ 页面加载完成");
    console.log("🔗 当前 URL:", page.url());
    console.log("📄 页面标题:", await page.title());

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    // 检查登录表单元素
    console.log("\n🔍 检查登录表单元素...");

    const formElements = await page.evaluate(() => {
      return {
        // 表单
        hasForm: !!document.querySelector("form"),
        formAction: document.querySelector("form")?.getAttribute("action"),
        formMethod: document.querySelector("form")?.getAttribute("method"),

        // 输入框
        hasUsernameInput: !!document.querySelector(
          '#username, input[name="username"], input[type="email"]',
        ),
        usernameInputType: document
          .querySelector(
            '#username, input[name="username"], input[type="email"]',
          )
          ?.getAttribute("type"),
        usernameInputName: document
          .querySelector(
            '#username, input[name="username"], input[type="email"]',
          )
          ?.getAttribute("name"),

        hasPasswordInput: !!document.querySelector(
          '#password, input[name="password"], input[type="password"]',
        ),
        passwordInputType: document
          .querySelector(
            '#password, input[name="password"], input[type="password"]',
          )
          ?.getAttribute("type"),
        passwordInputName: document
          .querySelector(
            '#password, input[name="password"], input[type="password"]',
          )
          ?.getAttribute("name"),

        // 提交按钮
        hasSubmitButton: !!document.querySelector(
          'button[type="submit"], input[type="submit"], .btn',
        ),
        submitButtonText: document
          .querySelector('button[type="submit"], input[type="submit"], .btn')
          ?.textContent?.trim(),

        // reCAPTCHA 相关
        hasGRecaptcha: !!document.querySelector(".g-recaptcha"),
        hasRcAnchor: !!document.querySelector("#rc-anchor-container"),
        hasRecaptchaCheckbox: !!document.querySelector(".recaptcha-checkbox"),
        hasRecaptchaResponse: !!document.querySelector(
          '#g-recaptcha-response, textarea[name="g-recaptcha-response"]',
        ),

        // 检查所有可能的 reCAPTCHA 元素
        allRecaptchaElements: Array.from(document.querySelectorAll("*"))
          .filter((el) => {
            const className = el.className || "";
            const id = el.id || "";
            return (
              (typeof className === "string" &&
                className.includes("recaptcha")) ||
              (typeof id === "string" && id.includes("recaptcha")) ||
              (typeof className === "string" &&
                className.includes("captcha")) ||
              (typeof id === "string" && id.includes("captcha"))
            );
          })
          .map((el) => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            innerHTML: (el.innerHTML || "").substring(0, 100), // 只取前100字符
          })),

        // 检查所有脚本
        scriptSrcs: Array.from(document.querySelectorAll("script[src]"))
          .map((script) => script.getAttribute("src"))
          .filter(
            (src) => src?.includes("recaptcha") || src?.includes("captcha"),
          ),
      };
    });

    console.log("表单信息:", {
      hasForm: formElements.hasForm,
      formAction: formElements.formAction,
      formMethod: formElements.formMethod,
    });

    console.log("输入框信息:", {
      hasUsernameInput: formElements.hasUsernameInput,
      usernameInputType: formElements.usernameInputType,
      usernameInputName: formElements.usernameInputName,
      hasPasswordInput: formElements.hasPasswordInput,
      passwordInputType: formElements.passwordInputType,
      passwordInputName: formElements.passwordInputName,
    });

    console.log("提交按钮信息:", {
      hasSubmitButton: formElements.hasSubmitButton,
      submitButtonText: formElements.submitButtonText,
    });

    console.log("reCAPTCHA 检查:", {
      hasGRecaptcha: formElements.hasGRecaptcha,
      hasRcAnchor: formElements.hasRcAnchor,
      hasRecaptchaCheckbox: formElements.hasRecaptchaCheckbox,
      hasRecaptchaResponse: formElements.hasRecaptchaResponse,
    });

    console.log("reCAPTCHA 脚本:", formElements.scriptSrcs);

    if (formElements.allRecaptchaElements.length > 0) {
      console.log("找到的 reCAPTCHA 相关元素:");
      formElements.allRecaptchaElements.forEach((el, index) => {
        console.log(
          `  ${index + 1}. ${el.tagName} - ID: ${el.id}, Class: ${el.className}`,
        );
      });
    } else {
      console.log("❌ 未找到任何 reCAPTCHA 相关元素");
    }

    // 等待一段时间，让 reCAPTCHA 加载
    console.log("\n⏳ 等待 reCAPTCHA 加载...");
    await page.waitForTimeout(5000);

    // 再次检查 reCAPTCHA
    const recaptchaAfterWait = await page.evaluate(() => {
      return {
        hasGRecaptcha: !!document.querySelector(".g-recaptcha"),
        hasRcAnchor: !!document.querySelector("#rc-anchor-container"),
        hasRecaptchaFrame: !!document.querySelector('iframe[src*="recaptcha"]'),
        recaptchaFrameSrcs: Array.from(document.querySelectorAll("iframe"))
          .map((iframe) => iframe.src)
          .filter((src) => src.includes("recaptcha")),
        hasRecaptchaScript: !!document.querySelector(
          'script[src*="recaptcha"]',
        ),
      };
    });

    console.log("等待后的 reCAPTCHA 状态:", recaptchaAfterWait);

    // 尝试填写表单进行测试
    console.log("\n✏️  尝试填写表单...");

    try {
      const usernameInput = await page.$(
        '#username, input[name="username"], input[type="email"]',
      );
      const passwordInput = await page.$(
        '#password, input[name="password"], input[type="password"]',
      );

      if (usernameInput && passwordInput) {
        await usernameInput.fill(config.username!);
        await passwordInput.fill(config.password!);
        console.log("✅ 表单填写完成");

        // 检查是否真的需要 reCAPTCHA
        console.log("🔍 检查提交前的状态...");

        const submitButton = await page.$(
          'button[type="submit"], input[type="submit"], .btn',
        );
        if (submitButton) {
          const isDisabled = await submitButton.getAttribute("disabled");
          console.log("提交按钮状态:", isDisabled ? "禁用" : "可用");
        }

        console.log(
          "\n⚠️  请手动完成 reCAPTCHA（如果有），然后按任意键继续测试提交...",
        );

        // 等待用户输入
        await new Promise((resolve) => {
          process.stdin.once("data", () => resolve(void 0));
        });

        // 尝试提交
        console.log("📤 提交表单...");
        if (submitButton) {
          await submitButton.click();
        } else {
          await page.keyboard.press("Enter");
        }

        // 等待结果
        await page.waitForTimeout(3000);

        const finalUrl = page.url();
        console.log("🔗 提交后 URL:", finalUrl);

        if (finalUrl.includes("login")) {
          // 检查错误消息
          const errorElement = await page.$(
            '.error, .alert-danger, .login-error, [class*="error"]',
          );
          if (errorElement) {
            const errorText = await errorElement.textContent();
            console.log("❌ 错误消息:", errorText?.trim());
          } else {
            console.log("📍 仍在登录页面，但没有明显错误消息");
          }
        } else {
          console.log("✅ 似乎登录成功，已跳转到其他页面");
        }
      } else {
        console.log("❌ 找不到用户名或密码输入框");
      }
    } catch (error) {
      console.error("填写表单时出错:", error);
    }

    console.log("\n🔚 调试完成，浏览器将保持打开30秒以便进一步检查...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("调试过程出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "auto") {
  testAutoLoginWithHandler();
} else {
  debugPageContent();
}
