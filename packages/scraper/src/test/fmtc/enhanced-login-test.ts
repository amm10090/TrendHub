/**
 * FMTC 增强登录测试 - 包含反检测和会话管理
 */

import { chromium, BrowserContext, Page } from "playwright";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import {
  getEnvironmentConfig,
  getRecaptchaConfig,
} from "../../sites/fmtc/config.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
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
 * 获取最新的 Chrome 用户代理
 */
function getLatestUserAgent(): string {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * 创建反检测浏览器配置
 */
function getStealthBrowserConfig(headless: boolean = false) {
  return {
    headless,
    args: [
      // 关键反检测参数
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
      "--disable-back-forward-cache",
      "--disable-background-networking",
      "--disable-features=TranslateUI,BlinkGenPropertyTrees,ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate",
      "--disable-ipc-flooding-protection",
      "--enable-features=NetworkService,NetworkServiceInProcess",
      "--aggressive-cache-discard",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-images", // 可选：禁用图片加载以提高速度
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
  // 注入反检测脚本
  await page.addInitScript(() => {
    // 删除 webdriver 属性
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // 修改 permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: unknown) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);

    // 修改 plugins 长度
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

    // 隐藏自动化痕迹
    const originalCall = Function.prototype.call;
    Function.prototype.call = function (...args) {
      if (args && args[0] && args[0].toString().includes("webdriver")) {
        return false;
      }
      return originalCall.apply(this, args);
    };
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
    console.log(`认证状态已保存到: ${filePath}`);
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
      console.log(`从 ${filePath} 加载认证状态`);
      return state;
    }
  } catch (error) {
    console.error("加载认证状态失败:", error);
  }
  return null;
}

/**
 * 测试会话持久化
 */
async function testSessionPersistence(): Promise<void> {
  console.log("开始测试会话持久化...");

  const config = getEnvironmentConfig();
  const recaptchaConfig = getRecaptchaConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  console.log("配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", recaptchaConfig.mode);
  console.log("- 无头模式:", config.headlessMode);
  console.log("- 认证状态文件:", authStateFile);

  if (!config.username || !config.password) {
    console.error("请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  // 检查是否有保存的认证状态
  const savedAuthState = await loadAuthState(authStateFile);

  const browserConfig = getStealthBrowserConfig(config.headlessMode);
  const browser = await chromium.launch(browserConfig);

  try {
    // 创建浏览器上下文
    const contextOptions: unknown = {
      userAgent: getLatestUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
      permissions: ["notifications"],
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    };

    // 如果有保存的状态，加载它
    if (savedAuthState) {
      contextOptions.storageState = savedAuthState;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // 设置反检测
    await setupAntiDetection(page);

    // 如果有保存的状态，先测试是否仍然有效
    if (savedAuthState) {
      console.log("检查保存的登录状态是否仍然有效...");

      await page.goto("https://account.fmtc.co/cp/program_directory/index", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const currentUrl = page.url();
      console.log("当前 URL:", currentUrl);

      if (!currentUrl.includes("login")) {
        console.log("✅ 保存的登录状态仍然有效！");

        // 测试访问其他页面
        console.log("测试访问商户列表页面...");
        await page.goto(
          "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
          {
            waitUntil: "networkidle",
          },
        );

        console.log("最终 URL:", page.url());

        if (!page.url().includes("login")) {
          console.log("✅ 会话持久化测试成功！");
        } else {
          console.log("❌ 访问其他页面时被重定向到登录页");
        }

        console.log("测试完成，5秒后关闭浏览器...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return;
      } else {
        console.log("❌ 保存的登录状态已失效，需要重新登录");
      }
    }

    // 创建登录处理器
    const loginHandler = new FMTCLoginHandler(
      page,
      log,
      "enhanced-test",
      recaptchaConfig,
    );

    // 执行登录
    console.log("开始登录流程...");
    const loginResult = await loginHandler.login({
      username: config.username!,
      password: config.password!,
    });

    console.log("登录结果:", loginResult);

    if (loginResult.success) {
      console.log("✅ 登录成功！");

      // 保存认证状态
      await saveAuthState(context, authStateFile);

      // 测试会话持久化
      console.log("测试会话持久化...");

      // 访问仪表盘
      await page.goto("https://account.fmtc.co/cp/program_directory/index", {
        waitUntil: "networkidle",
      });

      const dashboardUrl = page.url();
      console.log("仪表盘 URL:", dashboardUrl);

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
        console.log("商户列表 URL:", merchantListUrl);

        if (!merchantListUrl.includes("login")) {
          console.log("✅ 成功访问商户列表，会话持久化成功");
        } else {
          console.log("❌ 访问商户列表时被重定向到登录页");
        }
      } else {
        console.log("❌ 访问仪表盘时被重定向到登录页");
      }
    } else {
      console.log("❌ 登录失败:", loginResult.error);
    }

    console.log("测试完成，10秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("测试失败:", error);
  } finally {
    await browser.close();
  }
}

/**
 * 清理认证状态
 */
async function clearAuthState(): Promise<void> {
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");
  try {
    if (existsSync(authStateFile)) {
      writeFileSync(authStateFile, "");
      console.log("认证状态已清理");
    }
  } catch (error) {
    console.error("清理认证状态失败:", error);
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "clear") {
  clearAuthState();
} else {
  testSessionPersistence();
}

export { testSessionPersistence, clearAuthState };
