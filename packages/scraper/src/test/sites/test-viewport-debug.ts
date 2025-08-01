import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

async function debugViewportSettings() {
  console.log("🔍 调试Viewport设置...");

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=2560,1547",
      "--start-maximized",
      "--force-device-scale-factor=1",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    // 测试目标viewport设置 2560x1547
    const viewportConfig = { width: 2560, height: 1547, deviceScaleFactor: 1 };

    console.log(
      `\n📐 测试 Viewport: ${viewportConfig.width}x${viewportConfig.height}`,
    );

    const context = await browser.newContext({
      viewport: viewportConfig,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      screen: { width: viewportConfig.width, height: viewportConfig.height },
    });

    const page = await context.newPage();

    // 覆盖窗口和屏幕属性
    await page.addInitScript(() => {
      const width = 2560;
      const height = 1547;

      // 覆盖所有相关属性
      Object.defineProperty(window.screen, "width", { get: () => width });
      Object.defineProperty(window.screen, "height", { get: () => height });
      Object.defineProperty(window.screen, "availWidth", { get: () => width });
      Object.defineProperty(window.screen, "availHeight", {
        get: () => height - 40,
      });
      Object.defineProperty(window, "innerWidth", { get: () => width });
      Object.defineProperty(window, "innerHeight", { get: () => height - 100 });
      Object.defineProperty(window, "outerWidth", { get: () => width });
      Object.defineProperty(window, "outerHeight", { get: () => height });
      Object.defineProperty(window, "devicePixelRatio", { get: () => 1 });

      // 覆盖 matchMedia 以返回桌面端媒体查询结果
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = function (query: string) {
        // 强制返回桌面端结果
        if (query.includes("max-width") && query.includes("1024")) {
          return {
            matches: false,
            media: query,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
            onchange: null,
          } as MediaQueryList;
        }
        if (query.includes("min-width") && query.includes("1025")) {
          return {
            matches: true,
            media: query,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
            onchange: null,
          } as MediaQueryList;
        }
        return originalMatchMedia.call(window, query);
      };
    });

    // 增加超时时间并使用更简单的等待策略
    console.log("🌐 正在访问 Mytheresa...");
    await page.goto("https://www.mytheresa.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(5000);

    // 获取窗口信息
    const windowInfo = await page.evaluate(() => {
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
        },
        devicePixelRatio: window.devicePixelRatio,
        outerDimensions: {
          width: window.outerWidth,
          height: window.outerHeight,
        },
        // 检查媒体查询
        mediaQueries: {
          isDesktop: window.matchMedia("(min-width: 1025px)").matches,
          isLaptop: window.matchMedia("(max-width: 1024px)").matches,
          isTablet: window.matchMedia("(max-width: 768px)").matches,
          isMobile: window.matchMedia("(max-width: 480px)").matches,
        },
        // 检查CSS类
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className,
      };
    });

    console.log("窗口信息:", JSON.stringify(windowInfo, null, 2));

    // 截图
    await page.screenshot({
      path: `mytheresa-viewport-${viewportConfig.width}x${viewportConfig.height}.png`,
      fullPage: false,
    });
    console.log(`📸 截图已保存`);

    await context.close();

    console.log("\n⏸️ 保持浏览器打开10秒...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("❌ 错误:", error);
  } finally {
    await browser.close();
  }
}

debugViewportSettings().catch(console.error);
