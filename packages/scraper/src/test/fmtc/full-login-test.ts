/**
 * FMTC 完整登录测试（使用登录处理器）
 */

import { chromium } from "playwright";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import {
  getEnvironmentConfig,
  getRecaptchaConfig,
} from "../../sites/fmtc/config.js";
import { readFileSync } from "fs";
import { join } from "path";

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
 * 完整的登录测试
 */
async function testFullLogin() {
  console.log("开始测试 FMTC 完整登录流程...");

  // 获取环境配置
  const config = getEnvironmentConfig();
  const recaptchaConfig = getRecaptchaConfig();

  console.log("配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", recaptchaConfig.mode);
  console.log("- 无头模式:", config.headlessMode);

  if (!config.username || !config.password) {
    console.error("请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  const browser = await chromium.launch({
    headless: config.headlessMode,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // 设置视口和用户代理
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });

    // 创建登录处理器
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      "test-execution",
      recaptchaConfig,
    );

    // 获取 reCAPTCHA 余额（如果是自动模式）
    if (recaptchaConfig.mode === "auto" && recaptchaConfig.twoCaptcha?.apiKey) {
      try {
        const balance = await loginHandler.getRecaptchaBalance();
        console.log(`2captcha 余额: $${balance}`);
      } catch (error) {
        console.error("获取 2captcha 余额失败:", error);
      }
    }

    // 执行登录
    console.log("开始登录...");
    const loginResult = await loginHandler.login({
      username: config.username!,
      password: config.password!,
    });

    console.log("登录结果:", loginResult);

    if (loginResult.success) {
      console.log("✅ 登录成功！");

      // 测试会话刷新
      console.log("测试会话刷新...");
      const refreshResult = await loginHandler.refreshSession();
      console.log("会话刷新结果:", refreshResult);

      // 测试登出
      console.log("测试登出...");
      const logoutResult = await loginHandler.logout();
      console.log("登出结果:", logoutResult);
    } else {
      console.log("❌ 登录失败:", loginResult.error);

      if (loginResult.requiresCaptcha) {
        console.log("需要验证码处理");
      }
    }

    // 保持浏览器打开一段时间以便观察
    console.log("测试完成，5秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error("测试失败:", error);
  } finally {
    await browser.close();
  }
}

/**
 * 测试 reCAPTCHA 服务
 */
async function testRecaptchaService() {
  console.log("开始测试 reCAPTCHA 服务...");

  const recaptchaConfig = getRecaptchaConfig();

  const browser = await chromium.launch({
    headless: false, // 显示浏览器以便观察
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // 创建登录处理器
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      "recaptcha-test",
      recaptchaConfig,
    );

    // 导航到登录页面
    await page.goto("https://account.fmtc.co/cp/login");
    await page.waitForLoadState("networkidle");

    // 检查是否需要 reCAPTCHA
    const needsRecaptcha = await loginHandler.checkRecaptchaRequired();
    console.log("需要 reCAPTCHA:", needsRecaptcha);

    if (needsRecaptcha) {
      console.log("开始处理 reCAPTCHA...");
      const recaptchaResult = await loginHandler.handleRecaptcha();
      console.log("reCAPTCHA 处理结果:", recaptchaResult);
    }

    console.log("测试完成，按回车键关闭浏览器...");
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(void 0));
    });
  } catch (error) {
    console.error("reCAPTCHA 测试失败:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "recaptcha") {
  testRecaptchaService();
} else {
  testFullLogin();
}

export { testFullLogin, testRecaptchaService };
