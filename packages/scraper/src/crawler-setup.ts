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
    "--window-size=1920,1080",
    "--start-maximized",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
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
  ];
}

/**
 * Injects scripts into the browser context to mask automation signs.
 * @param context The Playwright BrowserContext.
 */
async function injectUltimateStealthScripts(
  context: BrowserContext,
): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) => {
      if (parameters.name === "notifications") {
        return Promise.resolve({ state: "denied" } as PermissionStatus);
      }
      return originalQuery.apply(window.navigator.permissions, [parameters]);
    };

    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });
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
  const { headless = true, ...restLaunchOptions } =
    options.launchContext?.launchOptions || {};

  const launchContext: PlaywrightLaunchContext = {
    launcher: chromium,
    launchOptions: {
      headless,
      args: getUltimateStealthBrowserArgs(),
      ignoreDefaultArgs: ["--enable-automation"],
      ...restLaunchOptions,
    },
    useChrome: !!process.env.CHROME_EXECUTABLE_PATH,
    ...options.launchContext,
  };

  const preNavigationHooks = [
    async (crawlingContext: PlaywrightCrawlingContext) => {
      const { page, log } = crawlingContext;
      const context = page.context();

      await injectUltimateStealthScripts(context);

      try {
        const viewportSizes = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 1536, height: 864 },
        ];
        const randomViewport =
          viewportSizes[Math.floor(Math.random() * viewportSizes.length)];
        await page.setViewportSize(randomViewport);

        const randomUserAgent = getRandomUserAgent();
        await page.setExtraHTTPHeaders({
          "User-Agent": randomUserAgent,
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        });

        log.debug(`Set User-Agent: ${randomUserAgent}`);
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
