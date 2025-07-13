import { chromium } from "playwright-extra";
import type { Browser, Page } from "playwright";
import stealth from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// 获取 __dirname 的 ESM 等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 stealth 插件
chromium.use(stealth());

async function testMytheresaWithEnhancedStealth() {
  console.log("🚀 启动增强版反检测测试...");

  // 读取 stealth.min.js 文件
  const stealthPath = path.join(__dirname, "../../stealth.min.js");
  let stealthScript: string | null = null;

  try {
    if (fs.existsSync(stealthPath)) {
      stealthScript = fs.readFileSync(stealthPath, "utf8");
      console.log("✅ 成功加载 stealth.min.js");
    } else {
      console.warn("⚠️ 未找到 stealth.min.js 文件");
    }
  } catch (error) {
    console.error("❌ 加载 stealth.min.js 失败:", error);
  }

  const browser: Browser = await chromium.launch({
    headless: false, // 设置为 false 以便可以看到浏览器
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=2560,1547",
      "--start-maximized",
      "--force-device-scale-factor=1",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-ipc-flooding-protection",
      "--lang=en-US,en",
      "--accept-lang=en-US,en;q=0.9",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 2560, height: 1547 }, // 使用桌面端尺寸
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    const page: Page = await context.newPage();

    // 在页面加载前注入 stealth.min.js
    if (stealthScript) {
      await page.addInitScript(stealthScript);
      console.log("✅ 已注入 stealth.min.js 到页面");
    }

    // 设置屏幕属性以确保桌面端布局
    await page.addInitScript(() => {
      const screenWidth = 2560;
      const screenHeight = 1547;
      const availHeight = 1507;

      Object.defineProperty(window.screen, "width", {
        get: function () {
          return screenWidth;
        },
        configurable: true,
      });
      Object.defineProperty(window.screen, "height", {
        get: function () {
          return screenHeight;
        },
        configurable: true,
      });
      Object.defineProperty(window.screen, "availWidth", {
        get: function () {
          return screenWidth;
        },
        configurable: true,
      });
      Object.defineProperty(window.screen, "availHeight", {
        get: function () {
          return availHeight;
        },
        configurable: true,
      });
      Object.defineProperty(window, "devicePixelRatio", {
        get: function () {
          return 1;
        },
        configurable: true,
      });
    });

    // 设置额外的 HTTP 头
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      DNT: "1",
      Connection: "keep-alive",
    });

    console.log("📦 正在访问 Mytheresa 女装主页...");

    // 尝试直接访问女装主页
    await page.goto("https://www.mytheresa.com/us/en/women", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(Math.random() * 2000 + 2000);

    // 检查是否为错误页面，如果是，则回退到全局主页
    const initialPageContent = await page.content();
    if (initialPageContent.includes("SOMETHING WENT WRONG")) {
      console.log("⚠️ 检测到错误页面，回退到全局主页...");
      await page.goto("https://www.mytheresa.com/", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      console.log("🏠 已成功导航至全局主页，继续执行操作。");
      await page.waitForTimeout(Math.random() * 3000 + 2000);
    } else {
      console.log("✅ 成功访问女装主页。");
    }

    // 检查并关闭可能的弹窗
    try {
      const cookieAcceptButton = page
        .locator('button:has-text("Accept")')
        .first();
      if (await cookieAcceptButton.isVisible({ timeout: 3000 })) {
        await cookieAcceptButton.click();
        console.log("✅ 已点击 Cookie 接受按钮");
        await page.waitForTimeout(1000);
      }
    } catch {
      console.log("ℹ️ 没有发现 Cookie 弹窗");
    }

    // 模拟人类行为
    await page.evaluate(() => {
      window.scrollBy({ top: Math.random() * 300, behavior: "smooth" });
    });

    await page.waitForTimeout(Math.random() * 2000 + 2000);

    // 通过导航菜单进入目标页面
    console.log("🎯 现在通过导航菜单进入商品列表页面...");

    try {
      // 悬停在 Women 菜单上
      console.log("🖱️ 悬停在 Women 菜单上...");
      await page.hover('nav a[href*="/women"]:has-text("Women")', {
        timeout: 10000,
      });
      await page.waitForTimeout(Math.random() * 1000 + 1500);

      // 点击 New Arrivals
      console.log("🖱️ 点击 New Arrivals...");
      const newArrivalsLink = page
        .locator('a[href*="/women/new-arrivals"]:has-text("New Arrivals")')
        .first();

      if (await newArrivalsLink.isVisible({ timeout: 5000 })) {
        await newArrivalsLink.click();
        console.log("✅ 成功点击 New Arrivals 链接");
      } else {
        // 如果找不到，尝试其他选择器
        console.log("⚠️ 尝试备用选择器...");
        await page.click('text="New Arrivals"', { timeout: 5000 });
      }

      // 等待页面加载
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      console.log("📄 当前页面URL:", page.url());
      console.log("📄 页面标题:", await page.title());
    } catch (navError) {
      console.error("❌ 导航过程中出错:", navError);

      // 如果导航失败，保存截图
      await page.screenshot({
        path: "mytheresa-nav-error.png",
        fullPage: true,
      });
      console.log("📸 导航错误截图已保存");
    }

    // 检查是否被检测为爬虫
    const finalPageContent = await page.content();
    const isBlocked =
      finalPageContent.includes("Access to this page has been denied") ||
      finalPageContent.includes("blocked") ||
      finalPageContent.includes("captcha") ||
      finalPageContent.includes("Just a moment") ||
      finalPageContent.includes("Checking your browser") ||
      finalPageContent.includes("SOMETHING WENT WRONG");

    if (isBlocked) {
      console.log("❌ 被检测为爬虫！页面包含反爬虫内容");

      // 保存页面截图
      await page.screenshot({
        path: "mytheresa-blocked-enhanced.png",
        fullPage: true,
      });
      console.log("📸 已保存被阻止页面的截图");

      // 尝试等待并刷新
      console.log("⏳ 等待 15 秒后尝试刷新...");
      await page.waitForTimeout(15000);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);

      const newContent = await page.content();
      const stillBlocked =
        newContent.includes("Access to this page has been denied") ||
        newContent.includes("blocked") ||
        newContent.includes("captcha") ||
        newContent.includes("SOMETHING WENT WRONG");

      if (stillBlocked) {
        console.log("❌ 刷新后仍然被阻止");
      } else {
        console.log("✅ 刷新后成功加载页面！");
      }
    } else {
      console.log("✅ 成功加载页面，未被检测为爬虫！");
    }

    // 检查商品选择器
    const selectors = [
      "div.item",
      '[data-testid="product-card"]',
      'div[class*="product"]',
      'div[class*="item"]',
    ];

    console.log("\n🔍 检查商品选择器:");
    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ "${selector}": ${count} 个元素`);
        } else {
          console.log(`❌ "${selector}": 0 个元素`);
        }
      } catch (error) {
        console.log(`❌ "${selector}": 错误 - ${(error as Error).message}`);
      }
    }

    // 检查 webdriver 属性
    console.log("\n🔍 检查浏览器检测属性:");
    const detectionResults = await page.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        chrome: "chrome" in window,
        permissions: typeof navigator.permissions?.query === "function",
        plugins: navigator.plugins.length,
        languages: navigator.languages,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      };
    });

    console.log("检测结果:", JSON.stringify(detectionResults, null, 2));

    // 保存最终截图
    await page.screenshot({
      path: "mytheresa-enhanced-final.png",
      fullPage: true,
    });
    console.log("\n📸 页面截图已保存为 mytheresa-enhanced-final.png");

    // 等待一段时间以便手动检查
    console.log("\n⏸️ 浏览器将保持打开30秒以便手动检查...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("❌ 测试过程中出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
testMytheresaWithEnhancedStealth().catch(console.error);
