/**
 * FMTC 完整导航测试 - 登录 + 目录页面导航
 */

import { chromium, BrowserContext, Page } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import { FMTCNavigationHandler } from "../../sites/fmtc/navigation-handler.js";
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
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`);
    if (data) console.log(data);
  },
  warning: (message: string, data?: unknown) => {
    console.log(`[WARN] ${message}`);
    if (data) console.log(data);
  },
  error: (message: string, data?: unknown) => {
    console.log(`[ERROR] ${message}`);
    if (data) console.log(data);
  },
  debug: (message: string, data?: unknown) => {
    console.log(`[DEBUG] ${message}`);
    if (data) console.log(data);
  },
};

/**
 * 获取反检测浏览器配置
 */
function getStealthBrowserConfig(headless: boolean = false) {
  return {
    headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-default-apps",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-field-trial-config",
    ],
    ignoreDefaultArgs: [
      "--enable-automation",
      "--enable-blink-features=IdleDetection",
    ],
  };
}

/**
 * 设置页面反检测脚本
 */
async function setupAntiDetection(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // 删除 webdriver 属性
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // 修改 plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // 修改语言设置
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // 伪装 Chrome 特征
    Object.defineProperty(window, "chrome", {
      get: () => ({
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      }),
    });
  });
}

/**
 * 保存浏览器状态
 */
async function saveAuthState(
  context: BrowserContext,
  filePath: string,
): Promise<void> {
  try {
    await context.storageState({ path: filePath });
    console.log(`✅ 认证状态已保存到: ${filePath}`);
  } catch (error) {
    console.error("保存认证状态失败:", error);
  }
}

/**
 * 加载浏览器状态
 */
async function loadAuthState(filePath: string): Promise<unknown> {
  try {
    if (existsSync(filePath)) {
      const state = JSON.parse(readFileSync(filePath, "utf8"));
      console.log(`📂 从 ${filePath} 加载认证状态`);
      return state;
    }
  } catch (error) {
    console.error("加载认证状态失败:", error);
  }
  return null;
}

/**
 * 主要测试函数：完整的登录和导航流程
 */
async function testCompleteNavigation(): Promise<void> {
  console.log("🚀 开始 FMTC 完整导航测试（登录 + 目录页面）...");

  const config = getEnvironmentConfig();
  const recaptchaConfig = getRecaptchaConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  console.log("📋 配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", recaptchaConfig.mode);
  console.log("- 无头模式:", config.headlessMode);
  console.log("- 认证状态文件:", authStateFile);

  if (!config.username || !config.password) {
    console.error("❌ 请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  // 检查是否有保存的认证状态
  const savedAuthState = await loadAuthState(authStateFile);

  const browserConfig = getStealthBrowserConfig(config.headlessMode);
  const browser = await chromium.launch(browserConfig);

  try {
    // 创建浏览器上下文
    const contextOptions = {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
      permissions: ["notifications"],
    };

    // 如果有保存的状态，加载它
    if (savedAuthState) {
      contextOptions.storageState = savedAuthState;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // 设置反检测
    await setupAntiDetection(page);

    // 创建处理器
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      "complete-nav-test",
      recaptchaConfig,
    );
    const navigationHandler = new FMTCNavigationHandler(page, log);

    let needLogin = true;

    // 如果有保存的状态，先测试是否仍然有效
    if (savedAuthState) {
      console.log("🔍 检查保存的登录状态是否仍然有效...");

      try {
        await page.goto("https://account.fmtc.co/cp/", {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        const pageStatus = await navigationHandler.detectCurrentPage();

        if (pageStatus.isLoggedIn) {
          console.log("✅ 保存的登录状态仍然有效！");
          needLogin = false;
        } else {
          console.log("❌ 保存的登录状态已失效，需要重新登录");
        }
      } catch {
        console.log("⚠️ 检查登录状态时出错，将重新登录");
      }
    }

    // 如果需要登录
    if (needLogin) {
      console.log("🔐 开始登录流程...");

      const loginResult = await loginHandler.login({
        username: config.username!,
        password: config.password!,
      });

      console.log("📊 登录结果:", loginResult);

      if (!loginResult.success) {
        console.log("❌ 登录失败，无法继续导航测试");
        console.log("错误:", loginResult.error);
        if (loginResult.requiresCaptcha) {
          console.log("需要处理验证码");
        }
        return;
      }

      console.log("🎉 登录成功！");

      // 保存认证状态
      await saveAuthState(context, authStateFile);
    }

    // 开始导航测试
    console.log("\n🧭 开始导航测试...");

    // 1. 检测当前页面状态
    console.log("📍 检测当前页面状态...");
    const currentPageStatus = await navigationHandler.detectCurrentPage();
    console.log("当前页面状态:", currentPageStatus);

    // 2. 如果已经在目录页面，跳过导航
    if (currentPageStatus.isDirectory) {
      console.log("✅ 已经在目录页面，导航测试完成！");

      // 验证页面内容
      console.log("🔍 验证目录页面内容...");
      await navigationHandler.debugPageStructure();

      console.log("测试完成，10秒后关闭浏览器...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return;
    }

    // 3. 导航到目录页面
    console.log("🎯 开始导航到目录页面...");
    const navigationResult = await navigationHandler.navigateToDirectory();

    console.log("📊 导航结果:", navigationResult);

    if (navigationResult.success) {
      console.log("🎉 成功导航到目录页面！");
      console.log("📍 当前 URL:", navigationResult.currentUrl);

      // 验证页面内容
      console.log("🔍 验证目录页面内容...");
      await navigationHandler.debugPageStructure();

      // 检查页面是否包含商户数据
      console.log("📊 检查页面商户数据...");
      const merchantData = await page.evaluate(() => {
        return {
          hasMerchantTable: !!document.querySelector(
            "table, .merchant-row, .program-row",
          ),
          merchantCount: document.querySelectorAll(
            "tr, .merchant-item, .program-item",
          ).length,
          hasSearchForm: !!document.querySelector(
            'form, .search, input[type="search"]',
          ),
          hasFilters: !!document.querySelector(".filter, .category, .network"),
          pageContent: document
            .querySelector("main, .content, .container")
            ?.textContent?.substring(0, 200),
        };
      });

      console.log("商户数据检查:", merchantData);

      if (merchantData.hasMerchantTable) {
        console.log("✅ 目录页面包含商户数据表格");
      } else {
        console.log("⚠️ 未检测到商户数据表格");
      }

      console.log("\n🎊 完整导航测试成功完成！");
    } else {
      console.log("❌ 导航到目录页面失败");
      console.log("错误:", navigationResult.error);
      console.log("当前 URL:", navigationResult.currentUrl);

      // 调试页面结构
      console.log("🔍 调试当前页面结构...");
      await navigationHandler.debugPageStructure();
    }

    console.log("测试完成，15秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 15000));
  } catch (error) {
    console.error("❌ 测试过程出错:", error);
  } finally {
    await browser.close();
  }
}

/**
 * 清理认证状态
 */
function clearAuthState(): void {
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");
  try {
    if (existsSync(authStateFile)) {
      writeFileSync(authStateFile, "");
      console.log("🧹 认证状态已清理");
    }
  } catch (error) {
    console.error("清理认证状态失败:", error);
  }
}

/**
 * 仅测试导航功能（假设已登录）
 */
async function testNavigationOnly(): Promise<void> {
  console.log("🧭 开始测试仅导航功能...");

  const config = getEnvironmentConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  // 检查是否有保存的认证状态
  const savedAuthState = await loadAuthState(authStateFile);

  if (!savedAuthState) {
    console.error("❌ 未找到保存的认证状态，请先执行完整测试");
    return;
  }

  const browserConfig = getStealthBrowserConfig(config.headlessMode);
  const browser = await chromium.launch(browserConfig);

  try {
    const context = await browser.newContext({
      storageState: savedAuthState,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    await setupAntiDetection(page);

    const navigationHandler = new FMTCNavigationHandler(page, log);

    // 导航到仪表盘
    await page.goto("https://account.fmtc.co/cp/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 执行导航
    const result = await navigationHandler.navigateToDirectory();
    console.log("导航结果:", result);

    if (result.success) {
      console.log("✅ 导航测试成功！");
      await navigationHandler.debugPageStructure();
    } else {
      console.log("❌ 导航测试失败");
    }

    console.log("测试完成，10秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("❌ 导航测试出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "clear") {
  clearAuthState();
} else if (testType === "nav-only") {
  testNavigationOnly();
} else {
  testCompleteNavigation();
}
