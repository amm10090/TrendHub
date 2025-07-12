/**
 * FMTC 独立登录测试 - 不依赖后端服务
 */

import { chromium, BrowserContext, Page } from "playwright";
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
 * 获取配置
 */
function getConfig() {
  return {
    username: process.env.FMTC_USERNAME,
    password: process.env.FMTC_PASSWORD,
    headless: process.env.FMTC_HEADLESS_MODE !== "false",
    recaptchaMode: process.env.FMTC_RECAPTCHA_MODE || "manual",
  };
}

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
 * 等待用户完成 reCAPTCHA
 */
async function waitForRecaptcha(
  page: Page,
  timeout: number = 120000,
): Promise<boolean> {
  console.log("等待用户手动完成 reCAPTCHA 验证...");
  console.log("请在浏览器中完成验证，然后回到终端按任意键继续");

  try {
    // 等待用户输入或reCAPTCHA完成
    await Promise.race([
      // 等待用户按键
      new Promise<boolean>((resolve) => {
        process.stdin.once("data", () => resolve(true));
      }),
      // 等待reCAPTCHA响应字段有值
      page
        .waitForFunction(
          () => {
            const responseElement = document.querySelector(
              '#g-recaptcha-response, textarea[name="g-recaptcha-response"]',
            ) as HTMLTextAreaElement;
            return (
              responseElement &&
              responseElement.value &&
              responseElement.value.length > 0
            );
          },
          { timeout },
        )
        .then(() => true)
        .catch(() => false),
    ]);

    // 检查reCAPTCHA是否完成
    const recaptchaCompleted = await page.evaluate(() => {
      const responseElement = document.querySelector(
        '#g-recaptcha-response, textarea[name="g-recaptcha-response"]',
      ) as HTMLTextAreaElement;
      return (
        responseElement &&
        responseElement.value &&
        responseElement.value.length > 0
      );
    });

    if (recaptchaCompleted) {
      console.log("✅ reCAPTCHA 验证完成");
      return true;
    } else {
      console.log("⚠️  reCAPTCHA 可能未完成，继续尝试登录");
      return true; // 继续尝试，让服务器验证
    }
  } catch (error) {
    console.error("等待 reCAPTCHA 超时:", error);
    return false;
  }
}

/**
 * 检查是否需要 reCAPTCHA
 */
async function checkRecaptchaRequired(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const recaptchaElement = document.querySelector(
      ".g-recaptcha, #rc-anchor-container, .recaptcha-checkbox",
    );
    return recaptchaElement !== null;
  });
}

/**
 * 执行登录
 */
async function performLogin(
  page: Page,
  username: string,
  password: string,
): Promise<boolean> {
  try {
    console.log("开始登录流程...");

    // 1. 导航到登录页面
    console.log("导航到登录页面...");
    await page.goto("https://account.fmtc.co/cp/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 2. 等待登录表单加载
    console.log("等待登录表单加载...");
    await page.waitForSelector('#username, input[name="username"]', {
      timeout: 15000,
    });
    await page.waitForSelector('#password, input[name="password"]', {
      timeout: 10000,
    });
    await page.waitForSelector('button[type="submit"], .btn.fmtc-primary-btn', {
      timeout: 10000,
    });

    // 3. 检查是否需要reCAPTCHA
    const needsRecaptcha = await checkRecaptchaRequired(page);
    console.log("是否需要 reCAPTCHA:", needsRecaptcha);

    if (needsRecaptcha) {
      console.log("⚠️  检测到 reCAPTCHA，需要手动完成");
      const recaptchaSuccess = await waitForRecaptcha(page);
      if (!recaptchaSuccess) {
        console.log("❌ reCAPTCHA 验证失败或超时");
        return false;
      }
    }

    // 4. 填写登录表单
    console.log("填写登录表单...");
    const usernameInput = await page.$('#username, input[name="username"]');
    const passwordInput = await page.$('#password, input[name="password"]');

    if (!usernameInput || !passwordInput) {
      console.log("❌ 找不到用户名或密码输入框");
      return false;
    }

    await usernameInput.click({ clickCount: 3 });
    await usernameInput.fill(username);
    await page.waitForTimeout(500);

    await passwordInput.click({ clickCount: 3 });
    await passwordInput.fill(password);
    await page.waitForTimeout(500);

    console.log("表单填写完成");

    // 5. 提交表单
    console.log("提交登录表单...");
    const submitButton = await page.$(
      'button[type="submit"], .btn.fmtc-primary-btn',
    );
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    // 6. 等待登录结果
    console.log("等待登录结果...");
    await page.waitForTimeout(3000);

    // 检查是否仍在登录页面
    const currentUrl = page.url();
    console.log("当前 URL:", currentUrl);

    if (currentUrl.includes("login")) {
      // 检查错误消息
      const errorElement = await page.$(
        '.error, .alert-danger, .login-error, [class*="error"]',
      );
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log("❌ 登录错误:", errorText?.trim());
        return false;
      }

      // 检查是否需要新的reCAPTCHA
      const needsNewRecaptcha = await checkRecaptchaRequired(page);
      if (needsNewRecaptcha) {
        console.log("⚠️  提交后出现新的 reCAPTCHA");
        const recaptchaSuccess = await waitForRecaptcha(page);
        if (recaptchaSuccess) {
          // 重新提交
          const newSubmitButton = await page.$(
            'button[type="submit"], .btn.fmtc-primary-btn',
          );
          if (newSubmitButton) {
            await newSubmitButton.click();
          }
          await page.waitForTimeout(3000);
        }
      }

      const finalUrl = page.url();
      if (finalUrl.includes("login")) {
        console.log("❌ 登录失败，仍在登录页面");
        return false;
      }
    }

    console.log("✅ 登录成功！");
    return true;
  } catch (error) {
    console.error("登录过程出错:", error);
    return false;
  }
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
 * 主测试函数
 */
async function main(): Promise<void> {
  console.log("🚀 开始 FMTC 独立登录测试...");

  const config = getConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  console.log("配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", config.recaptchaMode);
  console.log("- 无头模式:", config.headless);
  console.log("- 认证状态文件:", authStateFile);

  if (!config.username || !config.password) {
    console.error("❌ 请在环境变量中设置 FMTC_USERNAME 和 FMTC_PASSWORD");
    return;
  }

  // 检查是否有保存的认证状态
  const savedAuthState = await loadAuthState(authStateFile);

  const browserConfig = getStealthBrowserConfig(config.headless);
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
      console.log("🔍 检查保存的登录状态是否仍然有效...");

      await page.goto("https://account.fmtc.co/cp/program_directory/index", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const currentUrl = page.url();
      console.log("当前 URL:", currentUrl);

      if (!currentUrl.includes("login")) {
        console.log("✅ 保存的登录状态仍然有效！");

        // 测试访问其他页面
        console.log("🧪 测试访问商户列表页面...");
        await page.goto(
          "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
          {
            waitUntil: "networkidle",
          },
        );

        console.log("最终 URL:", page.url());

        if (!page.url().includes("login")) {
          console.log("🎉 会话持久化测试成功！");
        } else {
          console.log("⚠️  访问其他页面时被重定向到登录页");
        }

        console.log("测试完成，10秒后关闭浏览器...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return;
      } else {
        console.log("❌ 保存的登录状态已失效，需要重新登录");
      }
    }

    // 执行登录
    const loginSuccess = await performLogin(
      page,
      config.username!,
      config.password!,
    );

    if (loginSuccess) {
      console.log("🎉 登录成功！");

      // 保存认证状态
      await saveAuthState(context, authStateFile);

      // 测试会话持久化
      console.log("🧪 测试会话持久化...");

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
          console.log("🎉 成功访问商户列表，会话持久化成功");
        } else {
          console.log("⚠️  访问商户列表时被重定向到登录页");
        }
      } else {
        console.log("❌ 访问仪表盘时被重定向到登录页");
      }
    } else {
      console.log("❌ 登录失败");
    }

    console.log("测试完成，10秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("测试过程出错:", error);
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

// 运行测试
const testType = process.argv[2];

if (testType === "clear") {
  clearAuthState();
} else {
  main();
}
