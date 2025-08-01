#!/usr/bin/env tsx
// 基于手动测试成功经验的模拟点击导航版本
import { chromium, type Page } from "playwright";
import * as fs from "fs";
// import { fileURLToPath } from 'url'; // unused
import { SELECTORS } from "../sites/mytheresa/selectors.js";

// Type definition for Battery API
interface BatteryManager {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

async function testSimulatedClicks() {
  console.log("🖱️  Simulated Click Navigation Test");
  console.log("===================================");
  console.log("💡 基于手动测试的成功经验，模拟真实点击行为");
  console.log("🖥️  运行在可见浏览器模式 - 避免无头检测");
  console.log("🔒 集成高级反检测技术 - Canvas/WebGL/字体/时间混淆");
  console.log("⚡ 高效模式 - 已移除截图功能以提升性能");

  try {
    console.log("\n🚀 启动模拟点击测试...");

    const browser = await chromium.launch({
      headless: false, // 关闭无头模式 - 显示浏览器界面
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 高级反检测脚本 - 基于最新反爬虫技术
    await page.addInitScript(() => {
      console.log("🛡️ 加载高级反检测脚本...");

      // ========== 基础WebDriver隐藏 ==========
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        configurable: true,
      });

      // 删除所有自动化相关变量
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
          delete (window as unknown as any)[varName];
          delete (document as unknown as any)[varName];
        } catch {
          // Ignore deletion errors
        }
      });

      // ========== Canvas指纹混淆（关键技术）==========
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
                // 在Canvas上添加微小的噪声
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
                    // 1/1000 的像素点添加噪声
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

      // ========== WebGL指纹混淆 ==========
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // 混淆一些关键的WebGL参数
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

      // ========== 完善Navigator属性伪造 ==========

      // 创建真实的 Chrome 对象
      if (!(window as any).chrome) {
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

      // 模拟真实的 permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (
        parameters: PermissionDescriptor,
      ) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              state: Notification.permission,
            } as PermissionStatus)
          : originalQuery(parameters);

      // 模拟真实的 plugins
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

      // 隐藏自动化相关属性
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "MacIntel",
      });

      // 模拟真实的屏幕信息
      Object.defineProperty(screen, "width", { get: () => 1920 });
      Object.defineProperty(screen, "height", { get: () => 1080 });
      Object.defineProperty(screen, "availWidth", { get: () => 1920 });
      Object.defineProperty(screen, "availHeight", { get: () => 1080 });
      Object.defineProperty(screen, "colorDepth", { get: () => 24 });
      Object.defineProperty(screen, "pixelDepth", { get: () => 24 });

      // 隐藏无头浏览器的特征
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 8,
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8,
      });

      // 模拟真实的连接信息
      Object.defineProperty(navigator, "connection", {
        get: () => ({
          effectiveType: "4g",
          rtt: 100,
          downlink: 2.0,
        }),
      });

      // ========== 时间戳和行为模拟 ==========

      // 覆盖Date对象以避免时间检测
      // const originalDate = Date; // Currently unused, but kept for future Date override implementation

      // 重写performance.now()以模拟真实的性能时间
      const originalPerformanceNow = performance.now;
      const performanceOffset = Math.random() * 1000;
      performance.now = function () {
        return originalPerformanceNow.call(this) + performanceOffset;
      };

      // 模拟鼠标轨迹缓存
      (window as any).__mouseTrajectoryCache = [];
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (
        type,
        listener,
        options,
      ) {
        if (type === "mousemove" && Math.random() < 0.1) {
          // 10%的概率记录鼠标移动
          (window as any).__mouseTrajectoryCache.push({
            timestamp: Date.now(),
            x: Math.floor(Math.random() * 1920),
            y: Math.floor(Math.random() * 1080),
          });

          // 限制缓存大小
          if ((window as any).__mouseTrajectoryCache.length > 50) {
            (window as any).__mouseTrajectoryCache.shift();
          }
        }
        return originalAddEventListener.call(this, type, listener, options);
      };

      // ========== 字体检测绕过 ==========

      // 伪造字体列表以模拟真实系统
      const fakeFonts = [
        "Arial",
        "Arial Black",
        "Arial Narrow",
        "Arial Rounded MT Bold",
        "Calibri",
        "Cambria",
        "Century Gothic",
        "Comic Sans MS",
        "Courier New",
        "Georgia",
        "Helvetica",
        "Impact",
        "Lucida Console",
        "Lucida Sans Unicode",
        "Microsoft Sans Serif",
        "Palatino Linotype",
        "Tahoma",
        "Times New Roman",
        "Trebuchet MS",
        "Verdana",
        "Webdings",
        "Wingdings",
        "MS Sans Serif",
      ];

      // 重写字体检测方法
      const originalOffsetWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetWidth",
      );
      const originalOffsetHeight = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetHeight",
      );

      function addFontNoise(value: number) {
        return Math.floor(value + (Math.random() - 0.5) * 2); // 添加±1像素的噪声
      }

      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
          get: function () {
            const element = this as HTMLElement;
            if (
              element.style &&
              element.style.fontFamily &&
              fakeFonts.includes(element.style.fontFamily)
            ) {
              const originalValue = originalOffsetWidth.get?.call(this) || 0;
              return addFontNoise(originalValue as number);
            }
            return originalOffsetWidth.get?.call(this);
          },
        });
      }

      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
          get: function () {
            const element = this as HTMLElement;
            if (
              element.style &&
              element.style.fontFamily &&
              fakeFonts.includes(element.style.fontFamily)
            ) {
              const originalValue = originalOffsetHeight.get?.call(this) || 0;
              return addFontNoise(originalValue as number);
            }
            return originalOffsetHeight.get?.call(this);
          },
        });
      }

      // ========== 增强WebGL指纹混淆 ==========

      // 重写更多WebGL方法以增强混淆
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // 伪造更多WebGL参数
        const fakeParams: { [key: number]: string | number | number[] } = {
          7936: "Intel Inc.", // VENDOR
          7937: "Intel Iris Pro OpenGL Engine", // RENDERER
          7938: "4.1 INTEL-18.2.12", // VERSION
          35724: "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)", // SHADING_LANGUAGE_VERSION
          37445: "Intel Inc.", // UNMASKED_VENDOR_WEBGL
          37446: "Intel Iris Pro OpenGL Engine", // UNMASKED_RENDERER_WEBGL
          34047: 16, // MAX_VERTEX_ATTRIBS
          34076: 16, // MAX_TEXTURE_IMAGE_UNITS
          34024: 8, // MAX_VERTEX_TEXTURE_IMAGE_UNITS
          3379: 16384, // MAX_TEXTURE_SIZE
          34930: 16384, // MAX_CUBE_MAP_TEXTURE_SIZE
          35071: 8, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
          3386: [1, 1], // ALIASED_POINT_SIZE_RANGE
          33901: [1, 1], // ALIASED_LINE_WIDTH_RANGE
          33902: 1, // MAX_VIEWPORT_DIMS
        };

        if (Object.prototype.hasOwnProperty.call(fakeParams, parameter)) {
          return fakeParams[parameter];
        }

        return originalGetParameter.call(this, parameter);
      };

      // 重写getExtension方法以控制扩展的可见性
      const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
      WebGLRenderingContext.prototype.getExtension = function (name) {
        // 伪造一些常见的扩展支持状态
        const fakeExtensions = [
          "WEBKIT_EXT_texture_filter_anisotropic",
          "EXT_texture_filter_anisotropic",
          "WEBKIT_WEBGL_lose_context",
          "WEBGL_lose_context",
          "OES_standard_derivatives",
          "OES_vertex_array_object",
          "WEBGL_debug_renderer_info",
        ];

        if (fakeExtensions.includes(name)) {
          return {}; // 返回伪造的扩展对象
        }

        return originalGetExtension.call(this, name);
      };

      // ========== 高级Canvas指纹混淆增强 ==========

      // 增强Canvas 2D渲染上下文混淆
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      (HTMLCanvasElement.prototype as any).getContext = function (
        contextType: string,
        contextAttributes: unknown,
      ) {
        const context = originalGetContext.call(
          this,
          contextType,
          contextAttributes,
        );

        if (contextType === "2d" && context) {
          // 重写fillText和strokeText方法添加微小偏移
          const originalFillText = (context as any).fillText;
          const originalStrokeText = (context as any).strokeText;

          (context as any).fillText = function (
            text: unknown,
            x: unknown,
            y: unknown,
            maxWidth: unknown,
          ) {
            const offsetX = (x as number) + (Math.random() - 0.5) * 0.001;
            const offsetY = (y as number) + (Math.random() - 0.5) * 0.001;
            return originalFillText.call(
              this,
              text,
              offsetX,
              offsetY,
              maxWidth,
            );
          };

          (context as any).strokeText = function (
            text: unknown,
            x: unknown,
            y: unknown,
            maxWidth: unknown,
          ) {
            const offsetX = (x as number) + (Math.random() - 0.5) * 0.001;
            const offsetY = (y as number) + (Math.random() - 0.5) * 0.001;
            return originalStrokeText.call(
              this,
              text,
              offsetX,
              offsetY,
              maxWidth,
            );
          };
        }

        return context;
      };

      // ========== 媒体设备混淆 ==========

      // 伪造媒体设备信息
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const originalEnumerateDevices =
          navigator.mediaDevices.enumerateDevices;
        (navigator.mediaDevices as any).enumerateDevices = function () {
          return originalEnumerateDevices
            .call(this)
            .then((devices: MediaDeviceInfo[]) => {
              // 添加一些常见的虚假设备
              const fakeDevices = [
                {
                  deviceId: "default",
                  groupId: "5f4e2c3b8a1d7f9e6c4a8b2d1e3f5a7c",
                  kind: "audioinput" as MediaDeviceKind,
                  label: "Built-in Microphone",
                  toJSON: function () {
                    return this;
                  },
                },
                {
                  deviceId: "communications",
                  groupId: "5f4e2c3b8a1d7f9e6c4a8b2d1e3f5a7c",
                  kind: "audiooutput" as MediaDeviceKind,
                  label: "Built-in Output",
                  toJSON: function () {
                    return this;
                  },
                },
              ];

              return [...devices, ...fakeDevices];
            });
        };
      }

      // ========== 电池API混淆 ==========

      // 如果存在电池API，进行混淆
      if ((navigator as any).getBattery) {
        const originalGetBattery = (navigator as any).getBattery;
        (navigator as any).getBattery = function () {
          return (originalGetBattery as () => Promise<BatteryManager>)
            .call(this)
            .then((battery: BatteryManager) => {
              // 创建伪造的电池状态
              const fakeBattery = {
                ...battery,
                level: 0.87 + Math.random() * 0.1, // 87-97%的电量
                charging: Math.random() > 0.5,
                chargingTime:
                  Math.random() > 0.5
                    ? Infinity
                    : Math.floor(Math.random() * 7200),
                dischargingTime: Math.floor(Math.random() * 28800) + 3600, // 1-9小时
              };

              return fakeBattery;
            });
        };
      }

      // ========== 存储API混淆 ==========

      // 添加localStorage访问延迟模拟真实使用
      const originalSetItem = Storage.prototype.setItem;
      const originalGetItem = Storage.prototype.getItem;

      Storage.prototype.setItem = function (key, value) {
        // 添加微小的延迟
        setTimeout(() => {
          originalSetItem.call(this, key, value);
        }, Math.random() * 2);
      };

      Storage.prototype.getItem = function (key) {
        const result = originalGetItem.call(this, key);
        // 模拟访问延迟
        if (Math.random() < 0.1) {
          // 10%的概率添加延迟
          setTimeout(() => {}, Math.random());
        }
        return result;
      };

      console.log(
        "🛡️ 高级反检测脚本已完全加载 - 包含Canvas、WebGL、字体、时间戳、媒体设备、电池和存储混淆",
      );
      console.log("🖥️ 运行在可见浏览器模式 - 最大程度避免反爬检测");
    });

    // 1. 直接导航到 women 页面作为起始点
    console.log("\n🏠 导航到 women 页面...");
    try {
      await page.goto("https://www.mytheresa.com/us/en/women", {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });

      // 等待页面稳定
      await page.waitForTimeout(5000);
    } catch (gotoError: unknown) {
      const error = gotoError as Error;
      console.log(`⚠️ 首次导航失败: ${error.message}`);
      console.log("🔄 尝试重新导航...");

      try {
        await page.goto("https://www.mytheresa.com/us/en/women", {
          waitUntil: "load",
          timeout: 120000,
        });
        await page.waitForTimeout(3000);
      } catch (retryError: unknown) {
        const retryErr = retryError as Error;
        console.log(`❌ 重试导航也失败: ${retryErr.message}`);
        throw retryError;
      }
    }

    console.log(`📋 Women页面标题: "${await page.title()}"`);
    console.log("✅ Women页面加载成功");

    // 2. 模拟真实用户行为 - 阅读页面
    console.log("\n👤 模拟真实用户浏览行为...");
    await simulateRealUserBehavior(page);

    // 3. 点击导航中的 New Arrivals 链接
    console.log("\n🖱️  寻找并点击导航中的 'New Arrivals' 链接...");

    try {
      // 等待导航栏加载完成
      await page.waitForSelector(".headerdesktop__section__wrapper__nav", {
        timeout: 10000,
      });
      console.log("✅ 导航栏已加载");

      // 根据你提供的精确HTML结构定位New Arrivals
      const newArrivalsSelectors = [
        // 最精确的选择器 - 基于你提供的HTML结构
        '.headerdesktop__section__wrapper__nav .nav .nav__item[data-nav-id="0"] .nav__item__text__link__label:has-text("New Arrivals")',
        '.nav__item[data-nav-id="0"] .nav__item__text__link[data-tracking-label="fo_ww=new-arrivals_main"]',
        'a[data-tracking-label="fo_ww=new-arrivals_main"][href="/us/en/women/new-arrivals/current-week"]',
        // 备用选择器
        '.nav__item__text__link__label:has-text("New Arrivals")',
        'a[href="/us/en/women/new-arrivals/current-week"]',
        '.nav__item[data-nav-id="0"] a',
      ];

      let newArrivalsLink = null;
      let usedSelector = "";

      for (const selector of newArrivalsSelectors) {
        try {
          console.log(`🔍 尝试选择器: ${selector}`);
          newArrivalsLink = await page.locator(selector).first();
          if (await newArrivalsLink.isVisible({ timeout: 3000 })) {
            console.log(`📍 找到New Arrivals链接: ${selector}`);
            usedSelector = selector;
            break;
          }
        } catch (err: unknown) {
          const error = err as Error;
          console.log(`❌ 选择器失败: ${selector} - ${error.message}`);
          continue;
        }
      }

      if (newArrivalsLink && (await newArrivalsLink.isVisible())) {
        console.log(
          `🎯 准备点击New Arrivals链接 (使用选择器: ${usedSelector})`,
        );

        // 先滚动到导航区域确保可见
        await page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 模拟真实的鼠标移动和点击
        const box = await newArrivalsLink.boundingBox();
        if (box) {
          console.log(
            `📍 链接位置: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`,
          );

          // 慢慢移动鼠标到链接位置
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
            steps: 10,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 1000),
          );

          // 悬停一下
          await newArrivalsLink.hover();
          console.log("🖱️  鼠标悬停在New Arrivals上");
          await new Promise((resolve) =>
            setTimeout(resolve, 500 + Math.random() * 500),
          );

          // 点击并等待导航
          console.log("🖱️  执行点击...");
          await Promise.all([
            page
              .waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 15000,
              })
              .catch(() => {
                console.log("⚠️ 导航等待超时，但可能已经成功跳转");
              }),
            newArrivalsLink.click(),
          ]);

          console.log("✅ 成功点击 New Arrivals 导航");

          // 给页面一些时间稳定
          await page.waitForTimeout(3000);
        } else {
          throw new Error("无法获取New Arrivals链接位置");
        }
      } else {
        throw new Error("未找到New Arrivals链接");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.log(`⚠️  点击New Arrivals导航过程中出现问题: ${err.message}`);

      // 检查当前URL，可能实际上已经跳转成功了
      const currentUrl = page.url();
      console.log(`🔍 当前页面URL: ${currentUrl}`);

      if (currentUrl.includes("new-arrivals")) {
        console.log("✅ 尽管出现错误，但实际上已经成功跳转到New Arrivals页面");
      } else {
        console.log("❌ 点击导航失败且未成功跳转");
        console.log("💡 提示：避免使用直接导航以防触发反爬检测");
        // 不进行直接导航，保持在当前页面
      }
    }

    console.log(`📍 最终页面: ${page.url()}`);
    console.log(`📋 最终页面标题: "${await page.title()}"`);

    // 等待页面稳定
    await page.waitForTimeout(2000);

    // 6. 检查是否到达目标页面
    const finalUrl = page.url();
    const targetReached =
      finalUrl.includes("new-arrivals") || finalUrl.includes("newin");

    if (targetReached) {
      console.log("🎉 成功到达目标页面！");

      // 模拟用户浏览产品页面
      console.log("\n👀 浏览产品页面...");
      await simulateProductBrowsing(page);

      // 提取产品信息
      console.log("\n📦 提取产品信息...");
      const products = await extractProducts(page);

      if (products.length > 0) {
        console.log(`✅ 成功提取 ${products.length} 个产品！`);

        console.log("\n📋 产品样例:");
        products.slice(0, 3).forEach((product, index) => {
          console.log(`${index + 1}. ${product.brand} - ${product.title}`);
          console.log(`   💰 价格: ${product.price}`);
          console.log(`   🔗 链接: ${product.link}`);
          console.log("");
        });

        // 开始详情页抓取 (测试阶段，只抓取前3个)
        console.log("\n🚀 开始商品详情页抓取...");
        const detailedProducts = await extractProductDetails(page, products, 3); // 测试阶段：只抓取前3个商品的详情

        // 保存结果
        const results = {
          listPageProducts: products,
          detailedProducts: detailedProducts,
          summary: {
            totalProducts: products.length,
            detailedCount: detailedProducts.filter((p) => p.hasDetailData)
              .length,
            timestamp: new Date().toISOString(),
          },
        };

        fs.writeFileSync(
          "simulated-clicks-results.json",
          JSON.stringify(results, null, 2),
        );
        console.log("💾 完整结果已保存到 simulated-clicks-results.json");

        // 显示详情抓取结果
        const successfulDetails = detailedProducts.filter(
          (p) => p.hasDetailData,
        );
        console.log("\n🔍 商品详情抓取样例:");
        successfulDetails.slice(0, 2).forEach((product, index) => {
          console.log(`${index + 1}. ${product.brand} - ${product.name}`);
          console.log(`   💰 当前价格: ${product.currentPrice || "N/A"}`);
          console.log(`   💰 原价: ${product.originalPrice || "N/A"}`);
          console.log(`   🎨 颜色: ${product.color || "N/A"}`);
          console.log(`   📝 材质: ${product.material || "N/A"}`);
          console.log(`   🔗 详情页: ${product.detailPageUrl}`);
          console.log("");
        });

        console.log("\n🎯 完整抓取测试成功分析:");
        console.log("- 模拟鼠标移动: ✅ 真实轨迹");
        console.log("- 模拟点击导航: ✅ 自然交互");
        console.log("- 多页商品抓取: ✅ 正常工作");
        console.log("- 商品详情抓取: ✅ 成功获取");
        console.log("- 反爬虫绕过: ✅ 完全成功");
        console.log(
          `- 详情页成功率: ${successfulDetails.length}/${detailedProducts.length} (${Math.round((successfulDetails.length / detailedProducts.length) * 100)}%)`,
        );

        console.log("🎉 完整抓取测试成功完成！");
      } else {
        console.log("⚠️  到达页面但未提取到产品数据");

        // 保存页面内容用于分析
        const pageContent = await page.content();
        fs.writeFileSync("simulated-clicks-page.html", pageContent);
        console.log("💾 页面内容已保存用于分析");
      }
    } else {
      console.log("❌ 未能到达目标页面");
      console.log(`📍 当前位置: ${finalUrl}`);
    }

    // 保持浏览器开启观察
    console.log("\n⏰ 保持浏览器开启30秒供观察...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    await browser.close();
  } catch (error: unknown) {
    console.error("\n❌ 模拟点击测试失败:");
    console.error(error);
  }
}

/**
 * 模拟真实用户浏览行为
 */
async function simulateRealUserBehavior(page: Page): Promise<void> {
  // 阅读时间
  const readingTime = 3000 + Math.random() * 4000;
  await new Promise((resolve) => setTimeout(resolve, readingTime));

  // 随机滚动
  await page.evaluate(() => {
    window.scrollBy({
      top: window.innerHeight * (0.2 + Math.random() * 0.3),
      behavior: "smooth",
    });
  });

  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000),
  );

  // 随机鼠标移动
  const viewport = (await page.viewportSize()) || { width: 1920, height: 1080 };
  await page.mouse.move(
    Math.random() * viewport.width,
    Math.random() * viewport.height,
    { steps: 5 },
  );
}

/**
 * 模拟产品页面浏览行为
 */
async function simulateProductBrowsing(page: Page): Promise<void> {
  // 更长的浏览时间
  const browsingTime = 5000 + Math.random() * 5000;
  await new Promise((resolve) => setTimeout(resolve, browsingTime));

  // 多次滚动查看产品
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * 0.4,
        behavior: "smooth",
      });
    });
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 1000),
    );
  }
}

/**
 * 提取产品信息 - 支持多页抓取
 */
async function extractProducts(page: Page): Promise<Record<string, unknown>[]> {
  try {
    console.log("🔍 开始多页商品抓取...");
    console.log("🎯 目标: 抓取180个商品");

    const TARGET_PRODUCTS = 180;
    const products: Record<string, unknown>[] = [];
    let currentPage = 1;

    while (products.length < TARGET_PRODUCTS) {
      console.log(`\n📄 第${currentPage}页商品抓取...`);

      // 等待当前页面商品加载
      await page.waitForTimeout(3000);

      // 获取当前页面的所有商品
      const currentPageProducts = await extractCurrentPageProducts(page);

      if (currentPageProducts.length === 0) {
        console.log("⚠️ 当前页面未找到商品，停止抓取");
        break;
      }

      // 添加新商品到结果中（避免重复）
      let newProductsCount = 0;
      for (const product of currentPageProducts) {
        if (products.length >= TARGET_PRODUCTS) break;

        // 检查是否已存在（通过链接判断）
        const exists = products.some((p) => p.link === product.link);
        if (!exists) {
          products.push(product);
          newProductsCount++;
          console.log(
            `✅ 商品 ${products.length}: ${product.brand} - ${product.name || product.title}`,
          );
        }
      }

      console.log(
        `📊 第${currentPage}页新增 ${newProductsCount} 个商品，总计 ${products.length} 个商品`,
      );

      // 如果已达到目标数量，停止抓取
      if (products.length >= TARGET_PRODUCTS) {
        console.log(`🎉 已达到目标数量 ${TARGET_PRODUCTS} 个商品！`);
        break;
      }

      // 尝试加载更多商品
      const hasMore = await loadMoreProducts(page);
      if (!hasMore) {
        console.log("📋 没有更多商品可加载");
        break;
      }

      currentPage++;
    }

    console.log(`🎉 多页抓取完成，共获取 ${products.length} 个商品`);
    return products.slice(0, TARGET_PRODUCTS); // 确保不超过目标数量
  } catch (error: unknown) {
    console.error("💥 多页抓取失败:", error);
    return [];
  }
}

/**
 * 提取当前页面的商品
 */
async function extractCurrentPageProducts(
  page: Page,
): Promise<Record<string, unknown>[]> {
  try {
    let productItems: unknown[] = [];

    // 使用已有的产品项选择器
    for (const selector of SELECTORS.PLP_PRODUCT_ITEM_SELECTORS) {
      try {
        const items = await page.locator(selector).all();
        if (items.length > 0) {
          console.log(
            `📦 找到 ${items.length} 个商品项，使用选择器: ${selector}`,
          );
          productItems = items;
          break;
        }
      } catch {
        continue;
      }
    }

    if (productItems.length === 0) {
      return [];
    }

    const products: Record<string, unknown>[] = [];

    for (let i = 0; i < productItems.length; i++) {
      const item = productItems[i];

      try {
        const productData = await extractSingleProduct(item, page);

        if (
          productData &&
          (productData.brand || productData.name || productData.title)
        ) {
          products.push(productData);
        }
      } catch {
        // 跳过失败的商品
        continue;
      }
    }

    return products;
  } catch (error: unknown) {
    console.error("💥 提取当前页面商品失败:", error);
    return [];
  }
}

/**
 * 加载更多商品
 */
async function loadMoreProducts(page: Page): Promise<boolean> {
  try {
    console.log("\n🔄 寻找并点击'Show more'按钮...");

    // 滑动到页面底部
    console.log("📜 滑动到页面底部...");
    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    });

    // 等待滑动完成
    await page.waitForTimeout(2000);

    // 尝试找到"Show more"按钮
    let showMoreButton = null;
    const showMoreSelectors = [
      SELECTORS.PLP_LOAD_MORE_BUTTON,
      "div.loadmore__button > a.button--active",
      '.loadmore__button a:has-text("Show more")',
      'a:has-text("Show more")',
    ];

    for (const selector of showMoreSelectors) {
      try {
        console.log(`🔍 尝试Show more选择器: ${selector}`);
        showMoreButton = await page.locator(selector).first();
        if (await showMoreButton.isVisible({ timeout: 3000 })) {
          console.log(`📍 找到Show more按钮: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }

    if (!showMoreButton || !(await showMoreButton.isVisible())) {
      console.log("⚠️ 未找到Show more按钮，可能已到最后一页");
      return false;
    }

    // 检查按钮状态信息
    let loadInfo = "";
    try {
      const info = await page
        .locator(SELECTORS.PLP_LOAD_MORE_INFO)
        .textContent();
      if (info) {
        loadInfo = info.trim();
        console.log(`📊 加载信息: ${loadInfo}`);
      }
    } catch {
      // 信息获取失败不影响主流程
    }

    // 模拟真实用户点击
    const box = await showMoreButton.boundingBox();
    if (box) {
      // 移动鼠标到按钮位置
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(500);

      // 悬停
      await showMoreButton.hover();
      await page.waitForTimeout(300);
    }

    // 点击Show more按钮
    console.log("🖱️  点击Show more按钮...");
    await showMoreButton.click();

    console.log("⏰ 等待新商品加载...");
    // 等待3-5秒让新商品渲染
    const waitTime = 3000 + Math.random() * 2000;
    await page.waitForTimeout(waitTime);

    console.log("✅ 成功加载更多商品");
    return true;
  } catch (error: unknown) {
    console.error("💥 加载更多商品失败:", error);
    return false;
  }
}

/*
async function debugPdpStructure(page: Page): Promise<void> {
  try {
    console.log("🔍 开始分析详情页DOM结构...");
    
    const structure = await page.evaluate(() => {
      const info = {
        url: window.location.href,
        title: document.title,
        bodyClasses: document.body?.className || '',
        // 查找可能包含品牌信息的元素
        brandSelectors: [
          '.product__area__branding__designer__link',
          '.product__branding__designer',
          '.designer',
          '[class*="brand"]',
          '[class*="designer"]',
          'h1', 'h2', 'h3'
        ].map(selector => ({
          selector,
          count: document.querySelectorAll(selector).length,
          firstText: document.querySelector(selector)?.textContent?.trim().substring(0, 50) || 'not found',
          firstClass: document.querySelector(selector)?.className || 'no class'
        })),
        // 查找可能包含商品名称的元素
        nameSelectors: [
          '.product__area__branding__name',
          '.product__name',
          '.product-name',
          '[class*="product"][class*="name"]',
          '[class*="title"]'
        ].map(selector => ({
          selector,
          count: document.querySelectorAll(selector).length,
          firstText: document.querySelector(selector)?.textContent?.trim().substring(0, 50) || 'not found',
          firstClass: document.querySelector(selector)?.className || 'no class'
        })),
        // 查找可能包含价格的元素
        priceSelectors: [
          'div.productinfo__price',
          '.price',
          '[class*="price"]',
          '[class*="pricing"]'
        ].map(selector => ({
          selector,
          count: document.querySelectorAll(selector).length,
          firstText: document.querySelector(selector)?.textContent?.trim().substring(0, 50) || 'not found',
          firstClass: document.querySelector(selector)?.className || 'no class'
        })),
        // 查找主要的容器元素
        mainContainers: [
          '.product__area',
          '.product-details',
          '.product-info',
          '.productinfo',
          '[class*="product"]'
        ].map(selector => ({
          selector,
          count: document.querySelectorAll(selector).length,
          firstClass: document.querySelector(selector)?.className || 'no class'
        }))
      };
      
      return info;
    });
    
    console.log("🔍 详情页DOM结构分析:");
    console.log(`   📄 页面标题: ${structure.title}`);
    console.log(`   🔗 页面URL: ${structure.url}`);
    console.log(`   📦 Body类名: ${structure.bodyClasses}`);
    
    console.log("\n🏷️  品牌选择器分析:");
    structure.brandSelectors.forEach((item: any) => {
      if (item.count > 0) {
        console.log(`   ✅ ${item.selector}: ${item.count}个 - "${item.firstText}"`);
      }
    });
    
    console.log("\n📝 商品名称选择器分析:");
    structure.nameSelectors.forEach((item: any) => {
      if (item.count > 0) {
        console.log(`   ✅ ${item.selector}: ${item.count}个 - "${item.firstText}"`);
      }
    });
    
    console.log("\n💰 价格选择器分析:");
    structure.priceSelectors.forEach((item: any) => {
      if (item.count > 0) {
        console.log(`   ✅ ${item.selector}: ${item.count}个 - "${item.firstText}"`);
      }
    });
    
    console.log("\n📦 主要容器分析:");
    structure.mainContainers.forEach((item: any) => {
      if (item.count > 0) {
        console.log(`   ✅ ${item.selector}: ${item.count}个`);
      }
    });
    
  } catch (error: unknown) {
    console.error("💥 DOM结构分析失败:", error);
  }
}
*/

/**
 * 提取商品详情页数据
 */
async function extractPdpData(
  page: Page,
): Promise<Record<string, unknown> | null> {
  try {
    console.log("📦 开始提取商品详情页数据...");

    // 改进的等待策略
    console.log("⏰ 等待页面完全加载...");
    try {
      // 首先等待DOM加载
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
      console.log("✅ DOM加载完成");

      // 等待一些关键元素出现
      const keySelectors = [
        ".product__area__branding__designer__link",
        ".product__area__branding__name",
        "div.productinfo__price",
        ".product__area",
        "h1",
        "h2",
      ];

      let foundKeyElement = false;
      for (const selector of keySelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ 找到关键元素: ${selector}`);
          foundKeyElement = true;
          break;
        } catch {
          console.log(`⏰ 等待元素超时: ${selector}`);
        }
      }

      if (!foundKeyElement) {
        console.log("⚠️ 未找到任何关键元素，继续尝试数据提取");
      }

      // 减少页面稳定等待时间
      await page.waitForTimeout(1500);
    } catch {
      console.log("⚠️ 页面加载等待超时，尝试继续");
    }

    // 生产模式：跳过DOM调试以提升速度
    // await debugPdpStructure(page); // 仅开发时启用

    const productDetails: Record<string, unknown> = {};

    // 快速提取品牌 - 优化选择器顺序，减少超时时间
    console.log("🏷️  快速提取品牌信息...");
    const brandSelectors = [
      SELECTORS.PDP_BRAND, // 最可能成功的原选择器
      "h1",
      "h2", // 快速简单选择器
      ".product__branding__designer",
      ".designer",
      '[class*="brand"]',
      '[class*="designer"]',
    ];

    for (const selector of brandSelectors) {
      try {
        const brand = await page
          .locator(selector)
          .first()
          .textContent({ timeout: 1000 }); // 减少到1秒
        if (brand && brand.trim().length > 0) {
          productDetails.brand = brand.trim();
          console.log(`✅ 品牌提取成功 (${selector}): ${productDetails.brand}`);
          break;
        }
      } catch {
        // 静默失败，不打印日志以提升速度
        continue;
      }
    }

    if (!productDetails.brand) {
      console.log("❌ 所有品牌选择器都失败");
    }

    // 快速提取商品名称
    console.log("📝 快速提取商品名称...");
    const nameSelectors = [
      SELECTORS.PDP_NAME, // 最可能成功的原选择器
      "h1",
      "h2", // 快速选择器
      ".product__name",
      ".product-name",
      '[class*="product"][class*="name"]',
      '[class*="title"]',
    ];

    for (const selector of nameSelectors) {
      try {
        const name = await page
          .locator(selector)
          .first()
          .textContent({ timeout: 1000 }); // 减少到1秒
        if (
          name &&
          name.trim().length > 0 &&
          name.trim() !== productDetails.brand
        ) {
          productDetails.name = name.trim();
          console.log(
            `✅ 商品名称提取成功 (${selector}): ${productDetails.name}`,
          );
          break;
        }
      } catch {
        continue; // 静默失败
      }
    }

    // 快速提取价格信息 - 大幅优化
    console.log("💰 快速提取价格信息...");
    const priceContainerSelectors = [
      SELECTORS.PDP_PRICE_CONTAINER, // 最可能成功的原选择器
      ".price",
      '[class*="price"]',
      '[class*="pricing"]',
    ];

    for (const containerSelector of priceContainerSelectors) {
      try {
        const priceContainer = page.locator(containerSelector).first();

        if (
          await priceContainer.isVisible({ timeout: 800 }).catch(() => false)
        ) {
          // 减少到800ms
          // 快速策略：直接提取容器文本并用正则解析
          try {
            const containerText = await priceContainer.textContent({
              timeout: 500,
            });
            if (containerText && containerText.trim()) {
              // 使用正则表达式快速提取价格
              const priceMatches = containerText.match(
                /\$[\d,.]+|\$\s*[\d,.]+|USD\s*[\d,.]+|[\d,.]+\s*USD/gi,
              );
              if (priceMatches && priceMatches.length > 0) {
                if (priceMatches.length === 1) {
                  productDetails.currentPrice = priceMatches[0].trim();
                } else {
                  // 多个价格，第一个通常是当前价格，第二个是原价
                  productDetails.currentPrice = priceMatches[0].trim();
                  productDetails.originalPrice = priceMatches[1].trim();
                }
                console.log(`✅ 快速提取价格: ${productDetails.currentPrice}`);
                // priceExtracted = true;
                break;
              }
            }
          } catch {
            continue;
          }
        }
      } catch {
        continue; // 静默失败
      }
    }

    // 快速提取其他关键信息
    console.log("📝 快速提取其他信息...");

    // 并行提取描述和图片以节省时间
    const [description, mainImage] = await Promise.allSettled([
      // 快速提取描述
      (async () => {
        const descSelectors = [
          SELECTORS.PDP_DETAILS_ACCORDION_CONTENT + " p",
          ".product-description",
          "p",
        ];
        for (const selector of descSelectors) {
          try {
            const desc = await page
              .locator(selector)
              .first()
              .textContent({ timeout: 500 });
            if (desc && desc.trim().length > 10) {
              return desc.trim().substring(0, 150); // 进一步缩短
            }
          } catch {
            continue;
          }
        }
        return null;
      })(),

      // 快速提取主图片
      (async () => {
        const imgSelectors = [
          SELECTORS.PDP_IMAGES,
          ".product-image img",
          "img",
        ];
        for (const selector of imgSelectors) {
          try {
            const img = await page
              .locator(selector)
              .first()
              .getAttribute("src", { timeout: 500 });
            if (img) return img.trim();
          } catch {
            continue;
          }
        }
        return null;
      })(),
    ]);

    if (description.status === "fulfilled" && description.value) {
      productDetails.description = description.value;
      console.log(`✅ 描述: ${description.value.substring(0, 30)}...`);
    }

    if (mainImage.status === "fulfilled" && mainImage.value) {
      productDetails.detailImages = [mainImage.value];
      console.log(`✅ 主图片提取成功`);
    }

    // 提取SKU
    try {
      const url = page.url();
      const urlPath = new URL(url).pathname;
      const pathSegments = urlPath.split("-");
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const skuMatch = lastSegment.match(/^(p\d+)$/i);
        if (skuMatch && skuMatch[1]) {
          productDetails.sku = skuMatch[1].toLowerCase();
        }
      }
    } catch {
      console.log("⚠️ SKU提取失败");
    }

    productDetails.detailPageUrl = page.url();
    productDetails.scrapedAt = new Date().toISOString();

    console.log(
      `✅ 详情页数据提取完成: ${productDetails.brand} - ${productDetails.name}`,
    );

    return productDetails;
  } catch (error: unknown) {
    console.error("💥 详情页数据提取失败:", error);
    return null;
  }
}

/**
 * 模拟点击商品链接进入详情页
 */
async function simulateProductClick(
  page: Page,
  productElement: any,
): Promise<boolean> {
  try {
    console.log("🖱️  准备点击商品进入详情页...");

    // 滚动到商品位置
    await productElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // 找到商品链接
    const productLink = productElement.locator(SELECTORS.PLP_PRODUCT_LINK);

    if (!(await productLink.isVisible())) {
      console.log("❌ 商品链接不可见");
      return false;
    }

    // 获取链接位置
    const box = await productLink.boundingBox();
    if (!box) {
      console.log("❌ 无法获取商品链接位置");
      return false;
    }

    console.log(`📍 商品链接位置: x=${box.x}, y=${box.y}`);

    // 模拟真实用户鼠标操作
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 8,
    });
    await page.waitForTimeout(500 + Math.random() * 500);

    // 悬停
    await productLink.hover();
    console.log("🖱️  鼠标悬停在商品上");
    await page.waitForTimeout(300 + Math.random() * 300);

    // 点击商品链接
    console.log("🖱️  点击商品链接...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
      productLink.click(),
    ]);

    console.log("✅ 成功进入商品详情页");

    return true;
  } catch (error: unknown) {
    console.error("💥 点击商品失败:", error);
    return false;
  }
}

/**
 * 返回商品列表页
 */
async function navigateBackToList(page: Page): Promise<boolean> {
  try {
    console.log("🔙 返回商品列表页...");

    // 使用浏览器后退按钮
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });

    // 等待页面稳定
    await page.waitForTimeout(2000);

    console.log("✅ 成功返回商品列表页");

    return true;
  } catch (error: unknown) {
    console.error("💥 返回列表页失败:", error);
    return false;
  }
}

/**
 * 提取商品详情信息（主函数）
 */
async function extractProductDetails(
  page: Page,
  products: Record<string, unknown>[],
  maxDetailsCount = 20,
): Promise<Record<string, unknown>[]> {
  try {
    console.log(`\n🔍 开始抓取商品详情信息 (目标: ${maxDetailsCount}个)`);

    const detailedProducts: Record<string, unknown>[] = [];
    const targetProducts = products.slice(0, maxDetailsCount);

    for (let i = 0; i < targetProducts.length; i++) {
      const product = targetProducts[i];
      console.log(
        `\n📦 处理商品 ${i + 1}/${targetProducts.length}: ${product.brand} - ${product.name}`,
      );

      try {
        // 重新获取商品元素（因为页面可能已经变化）
        const productItems = await page
          .locator(SELECTORS.PLP_PRODUCT_ITEM_SELECTORS[0])
          .all();

        if (i >= productItems.length) {
          console.log("⚠️ 商品元素索引超出范围，跳过");
          continue;
        }

        const productElement = productItems[i];

        // 点击进入详情页
        const clickSuccess = await simulateProductClick(page, productElement);
        if (!clickSuccess) {
          console.log("❌ 点击失败，跳过该商品");
          continue;
        }

        // 模拟用户在详情页的浏览行为
        await simulateDetailPageBrowsing(page);

        // 提取详情页数据
        const detailData = await extractPdpData(page);

        if (detailData) {
          // 合并列表页和详情页数据
          const combinedProduct = {
            ...(product as any),
            ...(detailData as any),
            listPageData: product,
            hasDetailData: true,
          };

          detailedProducts.push(combinedProduct);
          console.log(`✅ 商品详情提取成功 ${i + 1}/${targetProducts.length}`);
        } else {
          console.log(`⚠️ 商品详情提取失败 ${i + 1}/${targetProducts.length}`);
          // 仍然保存基础数据
          detailedProducts.push({
            ...(product as any),
            hasDetailData: false,
          });
        }

        // 返回列表页
        const backSuccess = await navigateBackToList(page);
        if (!backSuccess) {
          console.log("❌ 返回列表页失败，尝试刷新页面");
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3000);
        }

        // 优化等待时间：1-3秒（原来3-8秒）
        const waitTime = 1000 + Math.random() * 2000;
        console.log(`⏰ 快速等待 ${Math.round(waitTime / 1000)} 秒...`);
        await page.waitForTimeout(waitTime);
      } catch (error: unknown) {
        console.error(`💥 处理商品 ${i + 1} 时发生错误:`, error);
        // 尝试返回列表页
        try {
          await navigateBackToList(page);
        } catch {
          console.log("尝试返回列表页失败，刷新页面");
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3000);
        }
        continue;
      }
    }

    console.log(
      `\n🎉 商品详情抓取完成，成功获取 ${detailedProducts.length} 个商品的详细信息`,
    );
    return detailedProducts;
  } catch (error: unknown) {
    console.error("💥 商品详情抓取主流程失败:", error);
    return products; // 返回原始数据
  }
}

/**
 * 优化的详情页浏览行为 - 减少不必要的等待时间
 */
async function simulateDetailPageBrowsing(page: Page): Promise<void> {
  try {
    console.log("👀 快速浏览详情页...");

    // 大幅减少浏览时间：500-1500ms（原来2000-5000ms）
    const browsingTime = 500 + Math.random() * 1000;
    await page.waitForTimeout(browsingTime);

    // 减少滚动次数和等待时间
    await page.evaluate(() => {
      window.scrollBy({
        top: window.innerHeight * 0.5,
        behavior: "smooth",
      });
    });
    await page.waitForTimeout(300); // 减少到300ms

    // 简化鼠标移动
    const viewport = (await page.viewportSize()) || {
      width: 1920,
      height: 1080,
    };
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 1 }, // 减少步数
    );
  } catch (error: unknown) {
    console.log("⚠️ 详情页浏览模拟失败:", error);
  }
}

/**
 * 提取单个产品的信息
 */
async function extractSingleProduct(
  item: any,
  page: Page,
): Promise<Record<string, unknown> | null> {
  try {
    // 提取链接
    const link = await item
      .locator(SELECTORS.PLP_PRODUCT_LINK)
      .getAttribute("href")
      .catch(() => null);
    const fullUrl = link ? new URL(link, page.url()).toString() : "";

    // 提取品牌
    const brand = await item
      .locator(SELECTORS.PLP_BRAND)
      .textContent()
      .catch(() => "");

    // 提取产品名称
    const name = await item
      .locator(SELECTORS.PLP_NAME)
      .textContent()
      .catch(() => "");

    // 提取图片
    const image = await item
      .locator(SELECTORS.PLP_IMAGE)
      .first()
      .getAttribute("src")
      .catch(() => "");

    // 提取尺寸
    const sizeLocators = await item
      .locator(SELECTORS.PLP_SIZES)
      .all()
      .catch(() => []);
    const sizes: string[] = [];
    for (const sizeLocator of sizeLocators) {
      const sizeText = await sizeLocator.textContent().catch(() => "");
      if (
        sizeText &&
        sizeText.trim() &&
        sizeText.toLowerCase() !== "available sizes:"
      ) {
        const isNotAvailable = (
          await sizeLocator.getAttribute("class").catch(() => "")
        )?.includes("item__sizes__size--notavailable");
        if (!isNotAvailable) {
          sizes.push(sizeText.trim());
        }
      }
    }

    // 提取标签
    const tagLocators = await item
      .locator(SELECTORS.PLP_TAG)
      .all()
      .catch(() => []);
    const tags: string[] = [];
    for (const tagLocator of tagLocators) {
      const tagText = await tagLocator.textContent().catch(() => "");
      if (tagText && tagText.trim()) {
        tags.push(tagText.trim());
      }
    }

    return {
      brand: brand?.trim() || "",
      name: name?.trim() || "",
      title: name?.trim() || "", // 兼容字段
      link: fullUrl,
      image: image?.trim() || "",
      sizes,
      tags,
      source: "Mytheresa",
    };
  } catch (error: unknown) {
    console.error("提取单个产品失败:", error);
    return null;
  }
}

// 运行模拟点击测试
testSimulatedClicks()
  .then(() => {
    console.log("\n🎉 模拟点击测试完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 模拟点击测试失败:");
    console.error(error);
    process.exit(1);
  });
