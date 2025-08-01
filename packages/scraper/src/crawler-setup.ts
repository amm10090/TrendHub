// packages/scraper/src/crawler-setup.ts
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import {
  PlaywrightCrawler,
  Configuration,
  type PlaywrightCrawlerOptions,
  type PlaywrightLaunchContext,
  type PlaywrightCrawlingContext,
  type Log,
} from "crawlee";
import type { Page, BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";

// Apply stealth plugin to playwright-extra
chromium.use(stealth());

// --- Anti-Detection Utility Belt ---

// A pool of realistic, up-to-date User-Agent strings
export const USER_AGENTS = [
  // Chrome on Windows - Most recent versions
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  // Chrome on macOS - Most recent versions
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  // Edge on Windows - Most recent versions
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  // Firefox on Windows - Most recent versions
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  // Safari on macOS - Most recent versions
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
];

import { fileURLToPath } from "url";

// 读取 stealth.min.js 文件内容
let stealthScript: string | null = null;
try {
  // 在 ESM 模块中获取当前文件目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const stealthPath = path.join(__dirname, "../stealth.min.js");
  if (fs.existsSync(stealthPath)) {
    stealthScript = fs.readFileSync(stealthPath, "utf8");
  }
} catch (error) {
  console.warn("Failed to load stealth.min.js:", error);
}

/**
 * Generates a random delay within a given range, using a more natural distribution.
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 * @returns A random delay time.
 */
export function getRandomDelay(min: number = 2000, max: number = 7000): number {
  const mean = (min + max) / 2;
  const stdDev = (max - min) / 6;
  const delay = mean + stdDev * (Math.random() * 2 - 1);
  return Math.max(min, Math.min(max, Math.floor(delay)));
}

/**
 * Selects a random User-Agent from the pool.
 * @returns A User-Agent string.
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Simulates human-like interactions on the page to avoid bot detection.
 * @param page The Playwright Page object.
 * @param log Crawlee logger instance.
 */
export async function simulateHumanBehavior(
  page: Page,
  log: Log,
): Promise<void> {
  try {
    await page.waitForTimeout(getRandomDelay(1000, 3000));

    const viewportSize = await page.viewportSize();
    if (viewportSize) {
      const scrollType = Math.random();
      if (scrollType < 0.6) {
        // More likely to scroll
        const scrollDistance = Math.random() * viewportSize.height * 0.7;
        await page.evaluate((distance) => {
          window.scrollBy({ top: distance, behavior: "smooth" });
        }, scrollDistance);
      }
    }

    await page.waitForTimeout(getRandomDelay(500, 2000));

    if (Math.random() < 0.4) {
      // 40% chance to move the mouse
      const x = Math.random() * (viewportSize?.width || 1920);
      const y = Math.random() * (viewportSize?.height || 1080);
      await page.mouse.move(x, y, { steps: 5 });
    }
  } catch (error) {
    log.warning(`Error simulating human behavior: ${(error as Error).message}`);
  }
}

/**
 * Provides a comprehensive set of command-line arguments for launching a stealthy browser.
 * @returns An array of browser arguments.
 */
function getUltimateStealthBrowserArgs(): string[] {
  return [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled",
    "--disable-infobars",
    "--disable-automation",
    "--exclude-switches=enable-automation",
    "--disable-default-apps",
    "--disable-component-extensions-with-background-pages",
    "--window-size=2560,1547",
    "--start-maximized",
    "--force-device-scale-factor=1",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests",
    "--disable-extensions",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-ipc-flooding-protection",
    "--force-color-profile=srgb",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-background-networking",
    "--disable-sync",
    "--no-first-run",
    "--disable-domain-reliability",
    "--no-pings",
    "--no-default-browser-check",
    "--disable-client-side-phishing-detection",
    "--password-store=basic",
    "--use-mock-keychain",
    "--lang=en-US,en",
    "--accept-lang=en-US,en;q=0.9",
    "--log-level=3",
    "--silent",
    "--disable-prompt-on-repost",
    "--disable-hang-monitor",
    "--disable-backgrounding-occluded-windows",
    "--disable-background-networking",
    "--enable-features=NetworkService",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--enable-features=NetworkService",
    "--force-fieldtrials=SiteIsolationExtensions/Control",
    "--disable-blink-features=AutomationControlled",
  ];
}

/**
 * Injects scripts into the browser context to mask automation signs.
 * @param context The Playwright BrowserContext.
 */
async function injectUltimateStealthScripts(
  context: BrowserContext,
): Promise<void> {
  // 首先注入 stealth.min.js 文件
  if (stealthScript) {
    await context.addInitScript(stealthScript);
  }

  // 然后添加其他自定义脚本
  await context.addInitScript(() => {
    // 覆盖 webdriver 属性
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    // 修改权限查询
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) => {
      if (parameters.name === "notifications") {
        return Promise.resolve({ state: "denied" } as PermissionStatus);
      }
      return originalQuery.apply(window.navigator.permissions, [parameters]);
    };

    // 修改插件数组
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });

    // 修改语言
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // 修改 Chrome 对象
    interface WindowWithChrome extends Window {
      chrome?: Record<string, unknown>;
    }
    const windowWithChrome = window as WindowWithChrome;
    if (!windowWithChrome.chrome) {
      Object.defineProperty(window, "chrome", {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {},
      });
    }

    // 修改自动化相关属性
    delete Object.getPrototypeOf(navigator).webdriver;

    // 修改 navigator.platform
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });

    // 修改时区
    Date.prototype.getTimezoneOffset = function () {
      return -480; // UTC+8
    };

    // 修改屏幕分辨率 - 使用桌面端尺寸 2560x1547
    Object.defineProperty(screen, "availWidth", { get: () => 2560 });
    Object.defineProperty(screen, "availHeight", { get: () => 1507 });
    Object.defineProperty(screen, "width", { get: () => 2560 });
    Object.defineProperty(screen, "height", { get: () => 1547 });
    Object.defineProperty(window, "innerWidth", { get: () => 2560 });
    Object.defineProperty(window, "innerHeight", { get: () => 1507 });
    Object.defineProperty(window, "outerWidth", { get: () => 2560 });
    Object.defineProperty(window, "outerHeight", { get: () => 1547 });

    // 添加电池状态
    if ("getBattery" in navigator) {
      navigator.getBattery = async () => ({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
      });
    }

    // 修改内存信息
    if (performance && "memory" in performance) {
      Object.defineProperty(performance, "memory", {
        get: () => ({
          jsHeapSizeLimit: 2147483648,
          totalJSHeapSize: 35663951,
          usedJSHeapSize: 20663951,
        }),
      });
    }

    // 修改 WebGL 信息
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel Iris OpenGL Engine";
      }
      return getParameter.apply(this, [parameter]);
    };

    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel Iris OpenGL Engine";
      }
      return getParameter2.apply(this, [parameter]);
    };
  });
}

/**
 * Injects stealth scripts into a page
 * @param page The Playwright Page object.
 */
export async function injectStealthIntoPage(page: Page): Promise<void> {
  // 注入 stealth.min.js
  if (stealthScript) {
    await page.addInitScript(stealthScript);
  }
}

/**
 * Creates a PlaywrightCrawler instance with pre-configured stealth and anti-detection settings.
 * @param options User-defined PlaywrightCrawlerOptions.
 * @param config Optional Crawlee Configuration object.
 * @returns A new PlaywrightCrawler instance.
 */
export function createStealthCrawler(
  options: PlaywrightCrawlerOptions,
  config?: Configuration,
) {
  const { headless = false, ...restLaunchOptions } =
    options.launchContext?.launchOptions || {};

  const launchContext: PlaywrightLaunchContext = {
    launcher: chromium as any,
    launchOptions: {
      headless,
      args: getUltimateStealthBrowserArgs(),
      ignoreDefaultArgs: [
        "--enable-automation",
        "--enable-blink-features=AutomationControlled",
        "--disable-component-extensions-with-background-pages",
        "--disable-default-apps",
      ],
      ...restLaunchOptions,
    },
    ...options.launchContext,
  };

  const preNavigationHooks = [
    async (crawlingContext: PlaywrightCrawlingContext) => {
      const { page, log } = crawlingContext;
      const context = page.context();

      // 在页面级别注入 stealth.min.js
      if (stealthScript) {
        await page.addInitScript(stealthScript);
      }

      // 注入其他反检测脚本到 context
      await injectUltimateStealthScripts(context);

      try {
        // 强制使用超大桌面端尺寸，确保得到桌面布局而非笔记本布局
        const desktopViewport = { width: 2560, height: 1547 }; // 固定使用桌面端尺寸
        await page.setViewportSize(desktopViewport);

        // 等待一下确保viewport生效
        await page.waitForTimeout(100);

        // 强制刷新媒体查询
        await page.evaluate(() => {
          // 触发resize事件
          window.dispatchEvent(new Event("resize"));
        });

        const randomUserAgent = getRandomUserAgent();
        await page.setExtraHTTPHeaders({
          "User-Agent": randomUserAgent,
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Ch-Ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
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

        // Removed debug log for User-Agent to reduce verbose output
      } catch (error) {
        log.warning(
          `Error setting browser context options: ${(error as Error).message}`,
        );
      }
    },
    ...(options.preNavigationHooks || []),
  ];

  const finalOptions: PlaywrightCrawlerOptions = {
    requestHandlerTimeoutSecs: 300,
    navigationTimeoutSecs: 120,
    maxRequestRetries: 3,
    ...options,
    browserPoolOptions: {
      retireBrowserAfterPageCount: 10,
      ...options.browserPoolOptions,
    },
    useSessionPool: true,
    sessionPoolOptions: {
      maxPoolSize: 1, // Reduces fingerprinting by using the same session
      ...options.sessionPoolOptions,
    },
    launchContext,
    preNavigationHooks,
  };

  return new PlaywrightCrawler(finalOptions, config);
}
