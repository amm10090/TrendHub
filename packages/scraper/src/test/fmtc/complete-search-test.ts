/**
 * FMTC 完整搜索测试 - 登录 + 导航 + 搜索 + 结果解析
 */

import { chromium, BrowserContext, Page } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import { FMTCNavigationHandler } from "../../sites/fmtc/navigation-handler.js";
import { FMTCSearchHandler } from "../../sites/fmtc/search-handler.js";
import { FMTCResultsParser } from "../../sites/fmtc/results-parser.js";
import {
  getEnvironmentConfig,
  getRecaptchaConfig,
  getSearchConfig,
} from "../../sites/fmtc/config.js";

// 手动加载环境变量
try {
  const envPath = join(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf8");
  const envLines = envFile.split("\\n");

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
 * 保存搜索结果
 */
async function saveSearchResults(
  results: unknown,
  format: "json" | "csv" = "json",
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `fmtc-search-results-${timestamp}.${format}`;
  const filePath = join(process.cwd(), fileName);

  try {
    let content: string;

    if (format === "csv") {
      const parser = new FMTCResultsParser(null as never, log as never);
      content = parser.exportToCsv(results);
    } else {
      content = JSON.stringify(results, null, 2);
    }

    writeFileSync(filePath, content, "utf8");
    console.log(`💾 搜索结果已保存到: ${filePath}`);
  } catch (error) {
    console.error(`保存搜索结果失败: ${error}`);
  }
}

/**
 * 主要测试函数：完整的搜索流程
 */
async function testCompleteSearch(): Promise<void> {
  console.log("🚀 开始 FMTC 完整搜索测试（登录 + 导航 + 搜索 + 结果解析）...");

  const config = getEnvironmentConfig();
  const recaptchaConfig = getRecaptchaConfig();
  const searchConfig = getSearchConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  console.log("📋 配置信息:");
  console.log("- 用户名:", config.username);
  console.log("- reCAPTCHA 模式:", recaptchaConfig.mode);
  console.log("- 无头模式:", config.headlessMode);
  console.log("- 搜索配置:", {
    searchText: searchConfig.searchText || "未设置",
    networkId: searchConfig.networkId || "未设置",
    displayType: searchConfig.displayType,
  });

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
    } as const;

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
      "complete-search-test",
      recaptchaConfig,
    );
    const navigationHandler = new FMTCNavigationHandler(page, log);
    const searchHandler = new FMTCSearchHandler(page, log);
    const resultsParser = new FMTCResultsParser(page, log);

    let needLogin = true;

    // === 第一步：登录检查 ===
    if (savedAuthState) {
      console.log("\\n🔍 检查保存的登录状态是否仍然有效...");

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

    // === 第二步：登录（如果需要）===
    if (needLogin) {
      console.log("\\n🔐 开始登录流程...");

      const loginResult = await loginHandler.login({
        username: config.username!,
        password: config.password!,
      });

      console.log("📊 登录结果:", loginResult);

      if (!loginResult.success) {
        console.log("❌ 登录失败，无法继续搜索测试");
        console.log("错误:", loginResult.error);
        return;
      }

      console.log("🎉 登录成功！");

      // 保存认证状态
      await saveAuthState(context, authStateFile);
    }

    // === 第三步：导航到目录页面 ===
    console.log("\\n🧭 开始导航到目录页面...");

    const currentPageStatus = await navigationHandler.detectCurrentPage();
    console.log("当前页面状态:", currentPageStatus);

    if (!currentPageStatus.isDirectory) {
      console.log("🎯 开始导航到目录页面...");
      const navigationResult = await navigationHandler.navigateToDirectory();

      console.log("📊 导航结果:", navigationResult);

      if (!navigationResult.success) {
        console.log("❌ 导航到目录页面失败，无法继续搜索");
        console.log("错误:", navigationResult.error);
        return;
      }

      console.log("🎉 成功导航到目录页面！");
    } else {
      console.log("✅ 已经在目录页面");
    }

    // === 第四步：执行搜索 ===
    console.log("\\n🔍 开始执行搜索...");

    // 从配置获取搜索参数
    const searchParams = searchHandler.getSearchParamsFromConfig();
    console.log("搜索参数:", searchParams);

    // 检查是否有搜索条件
    const hasSearchCriteria = Object.values(searchParams).some(
      (value) => value && value !== "all" && value.toString().length > 0,
    );

    if (!hasSearchCriteria) {
      console.log("⚠️ 未设置搜索条件，将显示所有结果");
    }

    const searchResult = await searchHandler.performSearch(searchParams);
    console.log("📊 搜索结果:", searchResult);

    if (!searchResult.success) {
      console.log("❌ 搜索失败");
      console.log("错误:", searchResult.error);

      // 调试搜索表单
      console.log("\\n🔧 调试搜索表单结构...");
      await searchHandler.debugSearchForm();
      return;
    }

    console.log(`🎉 搜索成功！找到 ${searchResult.resultsCount} 个结果`);

    // === 第五步：解析搜索结果 ===
    console.log("\\n📊 开始解析搜索结果...");

    const parsedResults = await resultsParser.parseSearchResults();
    console.log(
      `✅ 解析完成，提取到 ${parsedResults.merchants.length} 个商户信息`,
    );

    // 显示前5个商户的详细信息
    if (parsedResults.merchants.length > 0) {
      console.log("\\n📋 前5个商户信息:");
      parsedResults.merchants.slice(0, 5).forEach((merchant, index) => {
        console.log(`${index + 1}. ${merchant.name}`);
        console.log(`   网络: ${merchant.network || "N/A"}`);
        console.log(`   分类: ${merchant.category || "N/A"}`);
        console.log(`   国家: ${merchant.country || "N/A"}`);
        console.log(`   佣金: ${merchant.commissionRate || "N/A"}`);
        console.log(`   状态: ${merchant.status || "N/A"}`);
        console.log(`   链接: ${merchant.url || "N/A"}`);
        console.log("");
      });
    }

    // === 第六步：保存结果 ===
    console.log("\\n💾 保存搜索结果...");

    const finalResults = {
      searchParams: searchParams,
      searchResult: searchResult,
      parsedResults: parsedResults,
      timestamp: new Date().toISOString(),
      config: {
        searchConfig: searchConfig,
        userAgent: contextOptions.userAgent,
      },
    };

    // 保存为JSON和CSV格式
    await saveSearchResults(finalResults, "json");
    await saveSearchResults(parsedResults, "csv");

    console.log("\\n🎊 完整搜索测试成功完成！");
    console.log("📊 统计信息:");
    console.log(`- 搜索结果数量: ${searchResult.resultsCount}`);
    console.log(`- 解析商户数量: ${parsedResults.merchants.length}`);
    console.log(`- 当前页面: ${parsedResults.currentPage}`);
    console.log(`- 是否有下一页: ${parsedResults.hasNextPage ? "是" : "否"}`);

    // 检查分页
    if (parsedResults.hasNextPage) {
      console.log("\\n📄 检测到分页，可以继续抓取下一页");
      console.log("下一页链接:", parsedResults.nextPageUrl);
    }

    console.log("\\n测试完成，15秒后关闭浏览器...");
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
 * 仅测试搜索功能（假设已登录）
 */
async function testSearchOnly(): Promise<void> {
  console.log("🔍 开始测试仅搜索功能...");

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

    const searchHandler = new FMTCSearchHandler(page, log);
    const resultsParser = new FMTCResultsParser(page, log);

    // 直接导航到目录页面
    await page.goto("https://account.fmtc.co/cp/program_directory", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 执行搜索
    const searchParams = searchHandler.getSearchParamsFromConfig();
    const searchResult = await searchHandler.performSearch(searchParams);
    console.log("搜索结果:", searchResult);

    if (searchResult.success) {
      console.log("✅ 搜索测试成功！");

      // 解析结果
      const parsedResults = await resultsParser.parseSearchResults();
      console.log(`解析到 ${parsedResults.merchants.length} 个商户`);

      // 保存结果
      await saveSearchResults(parsedResults, "json");
    } else {
      console.log("❌ 搜索测试失败");
    }

    console.log("测试完成，10秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("❌ 搜索测试出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
const testType = process.argv[2];

if (testType === "clear") {
  clearAuthState();
} else if (testType === "search-only") {
  testSearchOnly();
} else {
  testCompleteSearch();
}
