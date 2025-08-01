// Enhanced Anti-Detection System for Mytheresa - Complete Implementation
import { type Page, type Cookie } from "playwright";
import type { Log } from "crawlee";

export interface EnhancedAntiDetectionConfig {
  enableAdvancedFingerprinting?: boolean;
  enableRequestHeaderRotation?: boolean;
  enableBehavioralPatterns?: boolean;
  enableSessionPersistence?: boolean;
  timingVariationFactor?: number;
}

export interface UserAgentData {
  userAgent: string;
  viewport: { width: number; height: number };
  platform: string;
  acceptLanguage: string;
  timezone: string;
}

export class EnhancedAntiDetection {
  private config: Required<EnhancedAntiDetectionConfig>;
  private sessionCookies: Cookie[] = [];
  private lastRequestTime = 0;
  private consecutiveRequests = 0;

  // Extended User Agent pool with matching metadata
  private readonly userAgentPool: UserAgentData[] = [
    {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      platform: "MacIntel",
      acceptLanguage: "en-US,en;q=0.9",
      timezone: "America/New_York",
    },
    {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      platform: "Win32",
      acceptLanguage: "en-US,en;q=0.9",
      timezone: "America/Los_Angeles",
    },
  ];

  constructor(config: EnhancedAntiDetectionConfig = {}) {
    this.config = {
      enableAdvancedFingerprinting: true,
      enableRequestHeaderRotation: true,
      enableBehavioralPatterns: true,
      enableSessionPersistence: true,
      timingVariationFactor: 0.4,
      ...config,
    };
  }

  /**
   * Initialize enhanced anti-detection for a page - Complete Implementation
   */
  async initializePage(page: Page, log: Log): Promise<void> {
    try {
      // Apply user agent profile
      await this.applyUserAgentProfile(page, log);

      // Inject the complete advanced fingerprint spoofing from test file
      await this.injectCompleteAntiDetection(page, log);

      // Set up request interception for header rotation
      if (this.config.enableRequestHeaderRotation) {
        await this.setupRequestInterception(page, log);
      }

      // Restore session if available
      if (
        this.config.enableSessionPersistence &&
        this.sessionCookies.length > 0
      ) {
        await this.restoreSession(page, log);
      }

      log.info("🛡️  Complete enhanced anti-detection initialized successfully");
    } catch {
      // Ignore error
    }
  }

  /**
   * Apply comprehensive user agent profile with matching attributes
   */
  private async applyUserAgentProfile(page: Page, log: Log): Promise<void> {
    const profile =
      this.userAgentPool[Math.floor(Math.random() * this.userAgentPool.length)];

    // Set viewport
    await page.setViewportSize(profile.viewport);

    // Set consistent user agent and platform
    await page.setExtraHTTPHeaders({
      "User-Agent": profile.userAgent,
      "Accept-Language": profile.acceptLanguage,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
    });

    log.debug(
      `Applied user agent profile: ${profile.platform} ${profile.viewport.width}x${profile.viewport.height}`,
    );
  }

  /**
   * Inject complete anti-detection script from successful test implementation
   * This is the exact same script that proved successful in test-simulated-clicks.ts
   */
  private async injectCompleteAntiDetection(
    page: Page,
    log: Log,
  ): Promise<void> {
    await page.addInitScript(() => {
      console.log("🛡️ Loading complete advanced anti-detection script...");

      // ========== Basic WebDriver Hiding ==========
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        configurable: true,
      });

      // Delete all automation-related variables
      const automationVars = [
        "cdc_adoQpoasnfa76pfcZLmcfl_Array",
        "cdc_adoQpoasnfa76pfcZLmcfl_Promise",
        "cdc_adoQpoasnfa76pfcZLmcfl_Symbol",
        "$cdc_asdjflasutopfhvcZLmcfl_",
        "__webdriver_script_fn",
        "__webdriver_script_func",
        "__webdriver_script_function",
        "__fxdriver_id",
        "__fxdriver_unwrapped",
        "__driver_evaluate",
        "__webdriver_evaluate",
        "__selenium_evaluate",
        "__fxdriver_evaluate",
        "__driver_unwrapped",
        "__webdriver_unwrapped",
        "__selenium_unwrapped",
        "_Selenium_IDE_Recorder",
        "_selenium",
        "calledSelenium",
        "$chrome_asyncScriptInfo",
        "__$webdriverAsyncExecutor",
        "webdriver",
        "driver-evaluate",
        "webdriver-evaluate",
        "selenium-evaluate",
        "webdriverCommand",
        "webdriver-evaluate-response",
      ];

      automationVars.forEach((varName) => {
        try {
          delete (window as Record<string, unknown>)[varName];
          delete (document as Record<string, unknown>)[varName];
        } catch {
          // Ignore error
        }
      });

      // ========== Canvas Fingerprint Obfuscation (Key Technology) ==========
      const canvasNoise = () => {
        const shift = {
          r: Math.floor(Math.random() * 10) - 5,
          g: Math.floor(Math.random() * 10) - 5,
          b: Math.floor(Math.random() * 10) - 5,
          a: Math.floor(Math.random() * 10) - 5,
        };
        return shift;
      };

      const injectCanvasNoise = function () {
        const overwriteCanvasMethod = function (name: string) {
          const originalMethod =
            HTMLCanvasElement.prototype[name as keyof HTMLCanvasElement];
          Object.defineProperty(HTMLCanvasElement.prototype, name, {
            value: function (this: HTMLCanvasElement, ...args: unknown[]) {
              const context = this.getContext("2d");
              if (context) {
                // Add subtle noise to Canvas
                const imageData = context.getImageData(
                  0,
                  0,
                  this.width,
                  this.height,
                );
                const data = imageData.data;
                const noise = canvasNoise();

                for (let i = 0; i < data.length; i += 4) {
                  if (Math.random() < 0.001) {
                    // 1/1000 pixels get noise
                    data[i] = Math.max(0, Math.min(255, data[i] + noise.r)); // R
                    data[i + 1] = Math.max(
                      0,
                      Math.min(255, data[i + 1] + noise.g),
                    ); // G
                    data[i + 2] = Math.max(
                      0,
                      Math.min(255, data[i + 2] + noise.b),
                    ); // B
                    data[i + 3] = Math.max(
                      0,
                      Math.min(255, data[i + 3] + noise.a),
                    ); // A
                  }
                }
                context.putImageData(imageData, 0, 0);
              }
              return (originalMethod as (...args: unknown[]) => unknown).apply(
                this,
                args,
              );
            },
          });
        };

        overwriteCanvasMethod("toBlob");
        overwriteCanvasMethod("toDataURL");
      };

      injectCanvasNoise();

      // ========== WebGL Fingerprint Obfuscation ==========
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // Obfuscate key WebGL parameters
        if (parameter === 37445) {
          // UNMASKED_VENDOR_WEBGL
          return "Intel Inc.";
        }
        if (parameter === 37446) {
          // UNMASKED_RENDERER_WEBGL
          return "Intel Iris Pro OpenGL Engine";
        }
        return getParameter.call(this, parameter);
      };

      // ========== Complete Navigator Property Spoofing ==========

      // Create real Chrome object
      if (!(window as Record<string, unknown>).chrome) {
        Object.defineProperty(window, "chrome", {
          writable: true,
          enumerable: true,
          configurable: false,
          value: {
            runtime: {
              onConnect: null,
              onMessage: null,
              onStartup: null,
              onInstalled: null,
              onSuspend: null,
              onSuspendCanceled: null,
              connect: function () {},
              sendMessage: function () {},
              getURL: function () {},
              getManifest: function () {
                return {};
              },
              reload: function () {},
              requestUpdateCheck: function () {},
              restart: function () {},
              restartAfterDelay: function () {},
              setUninstallURL: function () {},
              openOptionsPage: function () {},
            },
            app: {
              isInstalled: false,
              InstallState: {
                DISABLED: "disabled",
                INSTALLED: "installed",
                NOT_INSTALLED: "not_installed",
              },
              RunningState: {
                CANNOT_RUN: "cannot_run",
                READY_TO_RUN: "ready_to_run",
                RUNNING: "running",
              },
            },
            csi: function () {},
            loadTimes: function () {
              return {
                requestTime: Date.now() / 1000 - Math.random(),
                startLoadTime: Date.now() / 1000 - Math.random(),
                commitLoadTime: Date.now() / 1000 - Math.random(),
                finishDocumentLoadTime: Date.now() / 1000 - Math.random(),
                finishLoadTime: Date.now() / 1000 - Math.random(),
                firstPaintTime: Date.now() / 1000 - Math.random(),
                firstPaintAfterLoadTime: 0,
                navigationType: "Other",
              };
            },
          },
        });
      }

      // Mock real permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (
        parameters: PermissionDescriptor,
      ) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              state: Notification.permission,
            } as PermissionStatus)
          : originalQuery(parameters);

      // Mock real plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: null,
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin",
          },
          {
            0: {
              type: "application/pdf",
              suffixes: "pdf",
              description: "",
              enabledPlugin: null,
            },
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer",
          },
        ],
      });

      // Hide automation-related properties
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "MacIntel",
      });

      // Mock real screen information
      Object.defineProperty(screen, "width", { get: () => 1920 });
      Object.defineProperty(screen, "height", { get: () => 1080 });
      Object.defineProperty(screen, "availWidth", { get: () => 1920 });
      Object.defineProperty(screen, "availHeight", { get: () => 1080 });
      Object.defineProperty(screen, "colorDepth", { get: () => 24 });
      Object.defineProperty(screen, "pixelDepth", { get: () => 24 });

      // Hide headless browser characteristics
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 8,
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8,
      });

      // Mock real connection information
      Object.defineProperty(navigator, "connection", {
        get: () => ({
          effectiveType: "4g",
          rtt: 100,
          downlink: 2.0,
        }),
      });

      console.log(
        "🛡️ Complete advanced anti-detection script fully loaded - maximum stealth mode",
      );
      console.log(
        "🖥️ Running in visible browser mode - maximum anti-crawler detection avoidance",
      );
    });

    log.info(
      "🛡️ Complete advanced fingerprinting countermeasures injected from successful test implementation",
    );
  }

  /**
   * Set up intelligent request interception for header rotation
   */
  private async setupRequestInterception(page: Page, log: Log): Promise<void> {
    await page.route("**/*", (route) => {
      const request = route.request();

      // Skip non-document requests to avoid breaking resources
      if (request.resourceType() !== "document") {
        return route.continue();
      }

      const headers = { ...request.headers() };

      // Ensure referer consistency
      if (request.url().includes("mytheresa.com")) {
        headers["referer"] = "https://www.mytheresa.com/";
      }

      route.continue({ headers });
    });

    log.debug("Request header rotation enabled");
  }

  /**
   * Enhanced human behavior simulation with realistic patterns from test file
   */
  async simulateAdvancedHumanBehavior(page: Page, log: Log): Promise<void> {
    if (!this.config.enableBehavioralPatterns) return;

    try {
      // Implement reading pattern simulation
      await this.simulateReadingPattern(page, log);

      // Add realistic mouse movements
      await this.simulateMouseMovements(page, log);

      // Add natural pauses
      await this.addNaturalPauses(page, log);
    } catch {
      // Ignore error
    }
  }

  /**
   * Simulate realistic reading patterns from test file
   */
  private async simulateReadingPattern(page: Page, log: Log): Promise<void> {
    const viewport = await page.viewportSize();
    if (!viewport) return;

    // Reading time
    const readingTime = 3000 + Math.random() * 4000;
    await new Promise((resolve) => setTimeout(resolve, readingTime));

    // Random scroll
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * (0.2 + Math.random() * 0.3),
        behavior: "smooth",
      });
    });

    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000),
    );

    // Random mouse movement
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 5 },
    );

    log.debug("Reading pattern simulation completed");
  }

  /**
   * Add realistic mouse movements from test file
   */
  private async simulateMouseMovements(page: Page, log: Log): Promise<void> {
    const viewport = await page.viewportSize();
    if (!viewport) return;

    // Generate bezier curve for natural mouse movement
    const startX = Math.random() * viewport.width;
    const startY = Math.random() * viewport.height;
    const endX = Math.random() * viewport.width;
    const endY = Math.random() * viewport.height;

    const steps = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      await page.mouse.move(x, y);
      await this.randomDelay(20, 50);
    }

    log.debug("Natural mouse movement completed");
  }

  /**
   * Add natural pauses between actions from test file
   */
  private async addNaturalPauses(page: Page, log: Log): Promise<void> {
    // Implement request frequency control
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Increase delay if making consecutive requests
    if (timeSinceLastRequest < 30000) {
      // Less than 30 seconds
      this.consecutiveRequests++;
    } else {
      this.consecutiveRequests = 0;
    }

    // Progressive delay for consecutive requests
    const baseDelay = 2000;
    const additionalDelay = this.consecutiveRequests * 1000;
    const variation = Math.random() * this.config.timingVariationFactor;

    const totalDelay = (baseDelay + additionalDelay) * (1 + variation);
    await this.randomDelay(totalDelay, totalDelay + 1000);

    this.lastRequestTime = now;
    log.debug(
      `Applied natural pause: ${Math.round(totalDelay)}ms (consecutive: ${this.consecutiveRequests})`,
    );
  }

  /**
   * Save session cookies for persistence
   */
  async saveSession(page: Page, log: Log): Promise<void> {
    if (!this.config.enableSessionPersistence) return;

    try {
      this.sessionCookies = await page.context().cookies();
      log.debug(
        `Saved ${this.sessionCookies.length} cookies for session persistence`,
      );
    } catch {
      // Ignore error
    }
  }

  /**
   * Restore saved session cookies
   */
  private async restoreSession(page: Page, log: Log): Promise<void> {
    try {
      await page.context().addCookies(this.sessionCookies);
      log.debug(
        `Restored ${this.sessionCookies.length} cookies from previous session`,
      );
    } catch {
      // Ignore error
    }
  }

  /**
   * Generate random delay with natural distribution
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    // Add slight normal distribution to make timing more human-like
    const normalizedDelay = delay + (Math.random() - 0.5) * (delay * 0.1);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(100, normalizedDelay)),
    );
  }

  /**
   * Detect if page shows anti-bot protection - improved precision
   */
  async detectAntiBot(page: Page, log: Log): Promise<boolean> {
    try {
      const content = await page.content();
      const title = await page.title().catch(() => "");

      // More specific indicators that actually mean anti-bot protection
      const strongIndicators = [
        "Access to this page has been denied",
        "Just a moment, we are checking your browser",
        "Checking your browser before accessing",
        "Please wait while we check your browser",
        "DDoS protection by Cloudflare",
        "Ray ID:",
        "cf-ray",
        "Please complete the security check",
        "Enable JavaScript and cookies to continue",
        "Browser check complete",
        "Attention Required! | Cloudflare",
      ];

      // Check title for common anti-bot titles
      const titleIndicators = [
        "Just a moment",
        "Attention Required",
        "Access denied",
        "Security check",
      ];

      const titleDetected = titleIndicators.some((indicator) =>
        title.toLowerCase().includes(indicator.toLowerCase()),
      );

      const contentDetected = strongIndicators.some((indicator) => {
        const regex = new RegExp(
          indicator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi",
        );
        return regex.test(content);
      });

      // Additional check: if page has very little content (typical of block pages)
      const bodyText = (await page.textContent("body").catch(() => "")) || "";
      const isMinimalContent = bodyText.length < 1000;

      // Only detect as anti-bot if we have strong indicators AND (title match OR minimal content)
      const detected = contentDetected && (titleDetected || isMinimalContent);

      if (detected) {
        log.warning(
          `Anti-bot protection detected: title="${title}", content_length=${bodyText.length}`,
        );
        return true;
      }

      // Log false positive prevention
      if (
        strongIndicators.some((indicator) =>
          content.toLowerCase().includes(indicator.toLowerCase()),
        )
      ) {
        log.debug(
          `Potential anti-bot indicator found but page seems normal: title="${title}", content_length=${bodyText.length}`,
        );
      }

      return false;
    } catch {
      // Ignore error
      return false;
    }
  }

  /**
   * Handle anti-bot protection with intelligent recovery - optimized for speed
   */
  async handleAntiBot(page: Page, log: Log): Promise<boolean> {
    log.info("Attempting to bypass anti-bot protection");

    try {
      // Strategy 1: Quick wait and reload (reduced time)
      await this.randomDelay(3000, 5000); // 减少到3-5秒

      // Check if we can reload the page first
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
        await this.randomDelay(2000, 3000); // 减少等待时间

        if (!(await this.detectAntiBot(page, log))) {
          log.info("Successfully bypassed anti-bot protection");
          return true;
        }
      } catch {
        // Ignore error
        return false; // 如果页面已关闭，直接返回失败
      }

      // Strategy 2: Clear cache and retry (more aggressive)
      try {
        await page.context().clearCookies();
        await this.randomDelay(5000, 8000); // 减少到5-8秒
        await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
        await this.randomDelay(2000, 3000);

        if (!(await this.detectAntiBot(page, log))) {
          log.info("Bypassed anti-bot protection after cache clear");
          return true;
        }
      } catch {
        // Ignore error
        return false;
      }

      log.error("Failed to bypass anti-bot protection");
      return false;
    } catch {
      // Ignore error
      return false;
    }
  }
}

export default EnhancedAntiDetection;
