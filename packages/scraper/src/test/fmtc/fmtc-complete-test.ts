/**
 * FMTC 完整集成测试 - 统一的端到端测试流程
 * 整合了所有功能：环境检查 + 登录 + 导航 + 搜索 + 分页抓取 + 数据导出
 */

// 加载环境变量
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, join } from "path";

// 手动解析 .env 文件
try {
  // 从当前测试目录向上查找项目根目录的 .env 文件
  const projectRoot = process.cwd();
  const envPath = resolve(projectRoot, ".env");
  const envContent = readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n");

  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
  console.log("✅ 环境变量加载成功");
} catch (error) {
  console.warn("⚠️ 环境变量加载失败:", error);
}

import { chromium, type BrowserContext, type Page } from "playwright";
import { Log } from "crawlee";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import { FMTCNavigationHandler } from "../../sites/fmtc/navigation-handler.js";
import { FMTCSearchHandler } from "../../sites/fmtc/search-handler.js";
import {
  FMTCResultsParser,
  type MerchantInfo,
} from "../../sites/fmtc/results-parser.js";
import { FMTCMerchantDetailHandler } from "../../sites/fmtc/merchant-detail-handler.js";
import {
  getRecaptchaConfig,
  getEnvironmentConfig,
  getSearchConfig,
  validateConfig,
  validateRecaptchaConfig,
  validateSearchConfig,
} from "../../sites/fmtc/config.js";

/**
 * 测试统计数据
 */
interface TestStats {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  loginTime?: number;
  navigationTime?: number;
  searchTime?: number;
  scrapingTime?: number;
  detailScrapingTime?: number; // 详情抓取耗时
  totalPages: number;
  totalMerchants: number;
  detailsScraped: number; // 成功抓取详情的商户数
  detailsFailed: number; // 详情抓取失败的商户数
  countries: string[];
  networks: string[];
  categories: string[]; // 商户分类
  totalNetworks: number; // 网络关联总数
  reCAPTCHAMethod?: string;
  reCAPTCHACost?: number;
  errors: string[];
  sessionRestored?: boolean; // 是否从保存的会话恢复
}

/**
 * 会话管理配置
 */
interface SessionConfig {
  sessionFile: string;
  maxAge: number; // 会话最大有效期（毫秒）
  autoSave: boolean;
}

// 默认会话配置
const SESSION_CONFIG: SessionConfig = {
  sessionFile: join(
    resolve(process.cwd(), "../../../../../"),
    "fmtc-session.json",
  ),
  maxAge: 4 * 60 * 60 * 1000, // 4小时
  autoSave: true,
};

/**
 * 保存浏览器会话状态
 */
async function saveSessionState(context: BrowserContext): Promise<boolean> {
  try {
    const state = await context.storageState();
    const sessionData = {
      state,
      timestamp: Date.now(),
      username: process.env.FMTC_USERNAME,
    };

    writeFileSync(
      SESSION_CONFIG.sessionFile,
      JSON.stringify(sessionData, null, 2),
    );
    console.log("💾 会话状态已保存");
    return true;
  } catch (error) {
    console.warn("⚠️ 保存会话状态失败:", error);
    return false;
  }
}

/**
 * 加载保存的会话状态
 */
function loadSessionState(): unknown | null {
  try {
    if (!existsSync(SESSION_CONFIG.sessionFile)) {
      console.log("📂 未找到保存的会话状态");
      return null;
    }

    const sessionData = JSON.parse(
      readFileSync(SESSION_CONFIG.sessionFile, "utf8"),
    );

    // 检查会话是否过期
    const age = Date.now() - sessionData.timestamp;
    if (age > SESSION_CONFIG.maxAge) {
      console.log("⏰ 会话状态已过期，将重新登录");
      cleanupSessionState();
      return null;
    }

    // 检查用户名是否匹配
    if (sessionData.username !== process.env.FMTC_USERNAME) {
      console.log("👤 用户名不匹配，将重新登录");
      cleanupSessionState();
      return null;
    }

    console.log(
      `💾 找到有效的会话状态 (${Math.round(age / 1000 / 60)}分钟前保存)`,
    );
    return sessionData.state;
  } catch (error) {
    console.warn("⚠️ 加载会话状态失败:", error);
    cleanupSessionState();
    return null;
  }
}

/**
 * 清理会话状态
 */
function cleanupSessionState(): void {
  try {
    if (existsSync(SESSION_CONFIG.sessionFile)) {
      unlinkSync(SESSION_CONFIG.sessionFile);
      console.log("🗑️ 已清理会话状态");
    }
  } catch (error) {
    console.warn("⚠️ 清理会话状态失败:", error);
  }
}

/**
 * 检查当前是否已登录
 */
async function checkAuthenticationStatus(page: Page): Promise<boolean> {
  try {
    console.log("🔍 检查认证状态...");

    // 尝试访问受保护的页面
    await page.goto("https://account.fmtc.co/cp/dash", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 等待页面稳定
    await page.waitForTimeout(3000);

    // 检查是否被重定向到登录页
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes("login");

    // 进一步验证页面内容
    if (isLoggedIn) {
      try {
        const pageTitle = await page.title();
        const hasDashboard =
          pageTitle.includes("Dashboard") || pageTitle.includes("FMTC");

        if (hasDashboard) {
          console.log("✅ 认证状态有效，已登录");
          return true;
        }
      } catch (error) {
        console.log("⚠️ 页面内容验证失败:", error);
      }
    }

    console.log("❌ 认证状态无效，需要重新登录");
    return false;
  } catch (error) {
    console.log("❌ 认证状态检查失败:", (error as Error).message);
    return false;
  }
}

/**
 * 网络连接检查
 */
async function checkNetworkConnectivity(page: Page): Promise<boolean> {
  console.log("🌐 检查网络连接...");

  try {
    // 测试基本网络连接
    await page.goto("https://www.google.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    console.log("✅ 基本网络连接正常");

    // 测试 FMTC 主站访问
    await page.goto("https://www.fmtc.co", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log("✅ FMTC 主站访问正常");

    return true;
  } catch (error) {
    console.error("❌ 网络连接检查失败:", (error as Error).message);
    return false;
  }
}

/**
 * 配置验证
 */
function validateAllConfigs(): { valid: boolean; errors: string[] } {
  console.log("🔍 验证配置...");

  const allErrors: string[] = [];

  // 验证环境配置
  const envConfig = getEnvironmentConfig();
  const envValidation = validateConfig(envConfig);
  if (!envValidation.valid) {
    allErrors.push(...envValidation.errors);
  }

  // 验证 reCAPTCHA 配置
  const recaptchaConfig = getRecaptchaConfig();
  const recaptchaValidation = validateRecaptchaConfig(recaptchaConfig);
  if (!recaptchaValidation.valid) {
    allErrors.push(...recaptchaValidation.errors);
  }

  // 验证搜索配置
  const searchConfig = getSearchConfig();
  const searchValidation = validateSearchConfig(searchConfig);
  if (!searchValidation.valid) {
    allErrors.push(...searchValidation.errors);
  }

  if (allErrors.length === 0) {
    console.log("✅ 所有配置验证通过");
    console.log(`  - reCAPTCHA模式: ${recaptchaConfig.mode}`);
    console.log(`  - 最大页数: ${envConfig.maxPages}`);
    console.log(`  - 搜索分类: ${searchConfig.category || "未设置"}`);
  } else {
    console.error("❌ 配置验证失败:");
    allErrors.forEach((error) => console.error(`  - ${error}`));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * 生成测试报告
 */
function generateTestReport(stats: TestStats): string {
  const report = {
    "🧪 FMTC 完整集成测试报告": "=".repeat(60),
    "⏱️ 测试时间": {
      开始时间: stats.startTime.toISOString(),
      结束时间: stats.endTime?.toISOString() || "未完成",
      总耗时: stats.duration
        ? `${(stats.duration / 1000).toFixed(2)}秒`
        : "未知",
      登录耗时: stats.loginTime
        ? `${(stats.loginTime / 1000).toFixed(2)}秒`
        : "未记录",
      导航耗时: stats.navigationTime
        ? `${(stats.navigationTime / 1000).toFixed(2)}秒`
        : "未记录",
      搜索耗时: stats.searchTime
        ? `${(stats.searchTime / 1000).toFixed(2)}秒`
        : "未记录",
      抓取耗时: stats.scrapingTime
        ? `${(stats.scrapingTime / 1000).toFixed(2)}秒`
        : "未记录",
    },
    "📊 抓取统计": {
      总页数: stats.totalPages,
      总商家数: stats.totalMerchants,
      详情抓取成功: stats.detailsScraped,
      详情抓取失败: stats.detailsFailed,
      详情抓取成功率:
        stats.totalMerchants > 0
          ? `${((stats.detailsScraped / stats.totalMerchants) * 100).toFixed(1)}%`
          : "0%",
      涉及国家: stats.countries.join(", ") || "无",
      涉及网络: stats.networks.join(", ") || "无",
      涉及分类: stats.categories.join(", ") || "无",
      总网络关联数: stats.totalNetworks,
      平均每页商家数:
        stats.totalPages > 0
          ? Math.round(stats.totalMerchants / stats.totalPages)
          : 0,
    },
    "🤖 reCAPTCHA信息": {
      处理方式: stats.reCAPTCHAMethod || "未使用",
      费用: stats.reCAPTCHACost ? `$${stats.reCAPTCHACost.toFixed(4)}` : "免费",
    },
    "💾 会话信息": {
      会话状态: stats.sessionRestored ? "从保存状态恢复" : "全新登录",
      状态保存: SESSION_CONFIG.autoSave ? "已启用" : "已禁用",
      会话有效期: `${SESSION_CONFIG.maxAge / (60 * 60 * 1000)} 小时`,
    },
    "⚠️ 错误记录": stats.errors.length > 0 ? stats.errors : ["无错误"],
    "🎯 测试结果": stats.errors.length === 0 ? "✅ 全部通过" : "❌ 存在错误",
  };

  return JSON.stringify(report, null, 2);
}

/**
 * 单独测试商户详情页面
 */
async function runDetailUrlTest(
  detailUrl: string,
  options: {
    clearSession: boolean;
    forceLogin: boolean;
    savedState: unknown;
    browser: import("playwright").Browser;
    context: BrowserContext;
    page: Page;
    log: Log;
    stats: TestStats;
  },
): Promise<unknown> {
  const { browser, context, page, log, stats, savedState } = options;
  // clearSession, forceLogin 变量已移除，因为未使用

  try {
    // 阶段1: 环境准备
    console.log("\n📋 阶段1: 环境准备");
    console.log("-".repeat(50));

    // 网络连接检查
    const networkOk = await checkNetworkConnectivity(page);
    if (!networkOk) {
      stats.errors.push("网络连接检查失败");
      throw new Error("网络连接问题，无法继续测试");
    }

    // 阶段2: 用户认证
    console.log("\n🔐 阶段2: 用户认证");
    console.log("-".repeat(50));

    const authStartTime = Date.now();
    let needsLogin = true;

    // 如果有保存的会话状态，先检查认证是否仍然有效
    if (savedState) {
      console.log("🔍 验证保存的会话状态...");
      stats.sessionRestored = true;

      const isAuthenticated = await checkAuthenticationStatus(page);
      if (isAuthenticated) {
        needsLogin = false;
        console.log("✅ 会话状态有效，跳过登录步骤");
        stats.loginTime = Date.now() - authStartTime;
        stats.reCAPTCHAMethod = "session_restored";
        stats.reCAPTCHACost = 0;
      } else {
        console.log("❌ 会话状态无效，需要重新登录");
        // 清理无效的会话状态
        cleanupSessionState();
        stats.sessionRestored = false;
      }
    }

    // 如果需要登录，执行完整的登录流程
    if (needsLogin) {
      console.log("🚀 开始登录流程...");

      const recaptchaConfig = getRecaptchaConfig();
      const loginHandler = new FMTCLoginHandler(
        page,
        log,
        undefined,
        recaptchaConfig,
      );

      // 导航到登录页面
      console.log("🌐 导航到登录页面...");
      await page.goto("https://account.fmtc.co/cp/login", {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await page.waitForTimeout(3000);

      // 执行登录
      const loginResult = await loginHandler.login({
        username: process.env.FMTC_USERNAME || "",
        password: process.env.FMTC_PASSWORD || "",
      });

      if (!loginResult.success) {
        stats.errors.push(`登录失败: ${loginResult.error}`);
        throw new Error(`登录失败: ${loginResult.error}`);
      }

      stats.loginTime = Date.now() - authStartTime;
      console.log(
        `✅ 登录成功 (耗时: ${(stats.loginTime / 1000).toFixed(2)}秒)`,
      );

      // 保存会话状态
      if (SESSION_CONFIG.autoSave) {
        console.log("💾 保存会话状态...");
        await saveSessionState(context);
      }

      // 记录 reCAPTCHA 信息
      if (recaptchaConfig.mode === "auto") {
        stats.reCAPTCHAMethod = "auto";
        stats.reCAPTCHACost = 0.001; // 标准费用
      } else {
        stats.reCAPTCHAMethod = "manual";
        stats.reCAPTCHACost = 0;
      }
    }

    // 阶段3: 商户详情抓取
    console.log("\n🔍 阶段3: 商户详情抓取");
    console.log("-".repeat(50));

    const detailStartTime = Date.now();
    const detailHandler = new FMTCMerchantDetailHandler(page, log);

    // 提取商户名称
    let merchantName = "Unknown";
    const urlMatch = detailUrl.match(/\/m\/\d+\/(.+)$/);
    if (urlMatch) {
      merchantName = urlMatch[1].replace(/-/g, " ");
    }

    console.log(`🔍 开始抓取商户详情: ${merchantName}`);
    console.log(`📄 详情页面URL: ${detailUrl}`);

    const detailResult = await detailHandler.scrapeMerchantDetails(
      detailUrl,
      merchantName,
    );

    stats.detailScrapingTime = Date.now() - detailStartTime;

    if (detailResult.success && detailResult.merchantDetail) {
      stats.detailsScraped = 1;
      stats.detailsFailed = 0;

      // 更新统计信息
      if (detailResult.merchantDetail.primaryCategory) {
        stats.categories.push(detailResult.merchantDetail.primaryCategory);
      }

      if (detailResult.merchantDetail.networks) {
        stats.totalNetworks = detailResult.merchantDetail.networks.length;
        detailResult.merchantDetail.networks.forEach((network) => {
          if (
            network.networkName &&
            !stats.networks.includes(network.networkName)
          ) {
            stats.networks.push(network.networkName);
          }
        });
      }

      if (detailResult.merchantDetail.primaryCountry) {
        stats.countries.push(detailResult.merchantDetail.primaryCountry);
      }

      console.log(
        `✅ 详情抓取成功 (耗时: ${(stats.detailScrapingTime / 1000).toFixed(2)}秒)`,
      );
      console.log(`📊 抓取结果:`);
      console.log(
        `  - 分类: ${detailResult.merchantDetail.primaryCategory || "无"}`,
      );
      console.log(
        `  - 国家: ${detailResult.merchantDetail.primaryCountry || "无"}`,
      );
      console.log(
        `  - 网络关联: ${detailResult.merchantDetail.networks?.length || 0}个`,
      );
      console.log(`  - 官网: ${detailResult.merchantDetail.homepage || "无"}`);
      console.log(
        `  - FreshReach: ${detailResult.merchantDetail.freshReachSupported ? "支持" : "不支持"}`,
      );

      // 显示联盟链接信息
      if (detailResult.merchantDetail.affiliateLinks) {
        const networks = Object.keys(
          detailResult.merchantDetail.affiliateLinks,
        );
        const totalLinks = Object.values(
          detailResult.merchantDetail.affiliateLinks,
        ).flat().length;
        console.log(
          `  - 联盟链接: ${totalLinks}个 (网络: ${networks.join(", ")})`,
        );
      } else {
        console.log(`  - 联盟链接: 0个`);
      }

      console.log(
        `  - FreshReach链接: ${detailResult.merchantDetail.freshReachUrls?.length || 0}个`,
      );

      // 数据导出
      console.log("\n📤 阶段4: 数据导出");
      console.log("-".repeat(50));

      const merchantData = {
        name: merchantName,
        detailUrl: detailUrl,
        ...detailResult.merchantDetail,
        scrapedAt: new Date().toISOString(),
      };

      const jsonExport = JSON.stringify(merchantData, null, 2);

      console.log(`JSON导出: ${jsonExport.length} 字符`);

      // 保存到文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fs = await import("fs");

      try {
        await fs.promises.writeFile(
          `/root/TrendHub/fmtc-detail-test-${timestamp}.json`,
          jsonExport,
          "utf8",
        );

        console.log(`✅ 数据已保存到文件: fmtc-detail-test-${timestamp}.json`);
      } catch (error) {
        console.log("⚠️ 文件保存失败:", error);
        stats.errors.push(`文件保存失败: ${(error as Error).message}`);
      }

      return merchantData;
    } else {
      stats.detailsScraped = 0;
      stats.detailsFailed = 1;
      console.log(`❌ 详情抓取失败: ${detailResult.error || "未知错误"}`);
      stats.errors.push(`详情抓取失败: ${detailResult.error || "未知错误"}`);
      throw new Error(`详情抓取失败: ${detailResult.error || "未知错误"}`);
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
    stats.errors.push((error as Error).message);
    throw error;
  } finally {
    // 生成最终报告
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
    stats.totalPages = 1;
    stats.totalMerchants = 1;

    console.log("\n" + "=".repeat(80));
    console.log("📋 商户详情测试完成 - 生成报告");
    console.log("=".repeat(80));

    const report = generateTestReport(stats);
    console.log(report);

    // 保存报告
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fs = await import("fs");
      await fs.promises.writeFile(
        `/root/TrendHub/fmtc-detail-test-report-${timestamp}.json`,
        report,
        "utf8",
      );
      console.log(
        `\n📄 测试报告已保存: fmtc-detail-test-report-${timestamp}.json`,
      );
    } catch (error) {
      console.log("⚠️ 报告保存失败:", error);
    }

    console.log("\n等待5秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  }
}

/**
 * 主测试函数
 */
async function runCompleteTest() {
  const stats: TestStats = {
    startTime: new Date(),
    totalPages: 0,
    totalMerchants: 0,
    detailsScraped: 0,
    detailsFailed: 0,
    countries: [],
    networks: [],
    categories: [],
    totalNetworks: 0,
    errors: [],
    sessionRestored: false,
  };

  // 检查命令行参数
  const clearSession = process.argv.includes("--clear-session");
  const forceLogin = process.argv.includes("--force-login");
  const enableDetailScraping =
    process.argv.includes("--enable-details") ||
    process.env.FMTC_ENABLE_DETAIL_SCRAPING === "true";
  const maxDetailsPerPage = parseInt(
    process.env.FMTC_MAX_DETAILS_PER_PAGE || "5",
  ); // 每页最多抓取详情的商户数

  // 检查是否是单独测试商户详情页面
  const testDetailUrlIndex = process.argv.findIndex(
    (arg) => arg === "--test-detail-url",
  );
  const testDetailUrl =
    testDetailUrlIndex !== -1 && testDetailUrlIndex + 1 < process.argv.length
      ? process.argv[testDetailUrlIndex + 1]
      : null;

  if (clearSession) {
    console.log("🗑️ 清理会话状态...");
    cleanupSessionState();
  }

  // 尝试加载保存的会话状态
  let savedState = null;
  if (!forceLogin) {
    savedState = loadSessionState();
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // 创建浏览器上下文，如果有保存的状态则加载
  const context = savedState
    ? await browser.newContext({
        storageState:
          savedState as import("playwright").BrowserContextOptions["storageState"],
      })
    : await browser.newContext();

  const page = await context.newPage();
  const log = new Log({ level: 4 });

  // 如果是单独测试商户详情
  if (testDetailUrl) {
    console.log("🧪 开始 FMTC 商户详情单独测试");
    console.log("=".repeat(80));
    console.log(`开始时间: ${stats.startTime.toISOString()}`);
    console.log(`测试URL: ${testDetailUrl}`);
    if (clearSession) console.log("🗑️ 已清理保存的会话状态");
    if (forceLogin) console.log("🔄 强制重新登录模式");
    console.log("=".repeat(80));

    return await runDetailUrlTest(testDetailUrl, {
      clearSession,
      forceLogin,
      savedState,
      browser,
      context,
      page,
      log,
      stats,
    });
  }

  console.log("🧪 开始 FMTC 完整集成测试");
  console.log("=".repeat(80));
  console.log(`开始时间: ${stats.startTime.toISOString()}`);
  if (clearSession) console.log("🗑️ 已清理保存的会话状态");
  if (forceLogin) console.log("🔄 强制重新登录模式");
  if (enableDetailScraping) {
    console.log(`📋 详情抓取已启用 (每页最多 ${maxDetailsPerPage} 个商户)`);
  } else {
    console.log("📋 详情抓取已禁用 (仅抓取基本信息)");
  }
  console.log("=".repeat(80));

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  const allMerchants: MerchantInfo[] = [];
  let currentPage = 1;
  const maxPages = parseInt(process.env.FMTC_MAX_PAGES || "3");

  try {
    // 阶段1: 环境准备
    console.log("\n📋 阶段1: 环境准备");
    console.log("-".repeat(50));

    // 网络连接检查
    const networkOk = await checkNetworkConnectivity(page);
    if (!networkOk) {
      stats.errors.push("网络连接检查失败");
      throw new Error("网络连接问题，无法继续测试");
    }

    // 配置验证
    const configValidation = validateAllConfigs();
    if (!configValidation.valid) {
      stats.errors.push(...configValidation.errors);
      throw new Error("配置验证失败，无法继续测试");
    }

    // 阶段2: 用户认证
    console.log("\n🔐 阶段2: 用户认证");
    console.log("-".repeat(50));

    const authStartTime = Date.now();
    let needsLogin = true;

    // 如果有保存的会话状态，先检查认证是否仍然有效
    if (savedState) {
      console.log("🔍 验证保存的会话状态...");
      stats.sessionRestored = true;

      const isAuthenticated = await checkAuthenticationStatus(page);
      if (isAuthenticated) {
        needsLogin = false;
        console.log("✅ 会话状态有效，跳过登录步骤");
        stats.loginTime = Date.now() - authStartTime;
        stats.reCAPTCHAMethod = "session_restored";
        stats.reCAPTCHACost = 0;
      } else {
        console.log("❌ 会话状态无效，需要重新登录");
        // 清理无效的会话状态
        cleanupSessionState();
        stats.sessionRestored = false;
      }
    }

    // 如果需要登录，执行完整的登录流程
    if (needsLogin) {
      console.log("🚀 开始登录流程...");

      const recaptchaConfig = getRecaptchaConfig();
      const loginHandler = new FMTCLoginHandler(
        page,
        log,
        undefined,
        recaptchaConfig,
      );

      // 导航到登录页面
      console.log("🌐 导航到登录页面...");
      let loginPageLoaded = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!loginPageLoaded && retryCount < maxRetries) {
        try {
          console.log(`尝试第 ${retryCount + 1} 次加载登录页面...`);
          await page.goto("https://account.fmtc.co/cp/login", {
            waitUntil: "domcontentloaded",
            timeout: 90000,
          });
          await page.waitForTimeout(3000);

          const title = await page.title();
          if (title.includes("Login") || title.includes("FMTC")) {
            loginPageLoaded = true;
            console.log("✅ 登录页面加载成功");
          } else {
            throw new Error(`页面标题不正确: ${title}`);
          }
        } catch (error) {
          retryCount++;
          console.log(
            `❌ 第 ${retryCount} 次尝试失败:`,
            (error as Error).message,
          );
          if (retryCount < maxRetries) {
            console.log(`⏳ 等待 5 秒后重试...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      }

      if (!loginPageLoaded) {
        throw new Error("无法加载登录页面，已达到最大重试次数");
      }

      // 执行登录
      const loginResult = await loginHandler.login({
        username: process.env.FMTC_USERNAME || "",
        password: process.env.FMTC_PASSWORD || "",
      });

      if (!loginResult.success) {
        stats.errors.push(`登录失败: ${loginResult.error}`);
        throw new Error(`登录失败: ${loginResult.error}`);
      }

      stats.loginTime = Date.now() - authStartTime;
      console.log(
        `✅ 登录成功 (耗时: ${(stats.loginTime / 1000).toFixed(2)}秒)`,
      );

      // 保存会话状态
      if (SESSION_CONFIG.autoSave) {
        console.log("💾 保存会话状态...");
        await saveSessionState(context);
      }

      // 记录 reCAPTCHA 信息
      if (recaptchaConfig.mode === "auto") {
        stats.reCAPTCHAMethod = "auto";
        stats.reCAPTCHACost = 0.001; // 标准费用
      } else {
        stats.reCAPTCHAMethod = "manual";
        stats.reCAPTCHACost = 0;
      }
    }

    // 阶段3: 导航
    console.log("\n🧭 阶段3: 页面导航");
    console.log("-".repeat(50));

    const navStartTime = Date.now();
    const navigationHandler = new FMTCNavigationHandler(page, log);
    const navigationResult = await navigationHandler.navigateToDirectory();

    if (!navigationResult.success) {
      stats.errors.push(`导航失败: ${navigationResult.error}`);
      throw new Error(`导航失败: ${navigationResult.error}`);
    }

    stats.navigationTime = Date.now() - navStartTime;
    console.log(
      `✅ 成功导航到Directory页面 (耗时: ${(stats.navigationTime / 1000).toFixed(2)}秒)`,
    );

    // 阶段4: 搜索
    console.log("\n🔍 阶段4: 执行搜索");
    console.log("-".repeat(50));

    const searchStartTime = Date.now();
    const searchHandler = new FMTCSearchHandler(page, log);
    const searchParams = searchHandler.getSearchParamsFromConfig();
    console.log("搜索参数:", JSON.stringify(searchParams, null, 2));

    const searchResult = await searchHandler.performSearch(searchParams);

    if (!searchResult.success) {
      stats.errors.push(`搜索失败: ${searchResult.error}`);
      throw new Error(`搜索失败: ${searchResult.error}`);
    }

    stats.searchTime = Date.now() - searchStartTime;
    console.log(
      `✅ 搜索成功，找到 ${searchResult.resultsCount} 个结果 (耗时: ${(stats.searchTime / 1000).toFixed(2)}秒)`,
    );

    // 阶段5: 数据抓取
    console.log("\n📊 阶段5: 分页数据抓取");
    console.log("-".repeat(50));

    const scrapingStartTime = Date.now();
    const resultsParser = new FMTCResultsParser(page, log);
    const detailHandler = new FMTCMerchantDetailHandler(page, log);

    while (currentPage <= maxPages) {
      console.log(`\n📄 处理第 ${currentPage} 页`);

      const paginationInfo = await resultsParser.getPaginationInfo();
      console.log(
        `分页信息: 第${paginationInfo.currentPage}页，共${paginationInfo.totalPages}页，总计${paginationInfo.totalEntries}条记录`,
      );

      const parsedResults = await resultsParser.parseSearchResults();

      if (parsedResults.merchants.length > 0) {
        console.log(
          `✅ 第${currentPage}页解析成功: ${parsedResults.merchants.length} 个商家`,
        );

        console.log(`🏪 第${currentPage}页商家列表:`);
        parsedResults.merchants.forEach((merchant, index) => {
          console.log(
            `  ${currentPage}-${index + 1}. ${merchant.name} | ${merchant.country} | ${merchant.network} | ${merchant.dateAdded}`,
          );
        });

        // 如果启用详情抓取，为当前页的商户抓取详情信息
        if (enableDetailScraping) {
          console.log(`\n🔍 开始抓取第${currentPage}页商户详情信息...`);
          const detailStartTime = Date.now();

          // 限制每页抓取详情的商户数量
          const merchantsToDetail = parsedResults.merchants.slice(
            0,
            maxDetailsPerPage,
          );

          for (let i = 0; i < merchantsToDetail.length; i++) {
            const merchant = merchantsToDetail[i];

            if (!merchant.detailUrl) {
              console.log(
                `  ⏭️  ${i + 1}/${merchantsToDetail.length}. ${merchant.name} - 无详情链接，跳过`,
              );
              stats.detailsFailed++;
              continue;
            }

            try {
              console.log(
                `  🔍 ${i + 1}/${merchantsToDetail.length}. 抓取 ${merchant.name} 详情...`,
              );

              const detailResult = await detailHandler.scrapeMerchantDetails(
                merchant.detailUrl,
                merchant.name,
              );

              if (detailResult.success && detailResult.merchantDetail) {
                // 合并基本信息和详情信息
                const mergedMerchant = {
                  ...merchant,
                  ...detailResult.merchantDetail,
                  detailUrl: merchant.detailUrl, // 保留原有的详情链接
                };

                // 替换allMerchants中对应的商户信息
                const existingIndex = allMerchants.findIndex(
                  (m) => m.name === merchant.name,
                );
                if (existingIndex >= 0) {
                  allMerchants[existingIndex] = mergedMerchant;
                } else {
                  allMerchants.push(mergedMerchant);
                }

                stats.detailsScraped++;

                // 更新统计信息
                if (detailResult.merchantDetail.primaryCategory) {
                  if (
                    !stats.categories.includes(
                      detailResult.merchantDetail.primaryCategory,
                    )
                  ) {
                    stats.categories.push(
                      detailResult.merchantDetail.primaryCategory,
                    );
                  }
                }

                if (detailResult.merchantDetail.networks) {
                  stats.totalNetworks +=
                    detailResult.merchantDetail.networks.length;
                  detailResult.merchantDetail.networks.forEach((network) => {
                    if (
                      network.networkName &&
                      !stats.networks.includes(network.networkName)
                    ) {
                      stats.networks.push(network.networkName);
                    }
                  });
                }

                console.log(
                  `    ✅ 成功 - 分类: ${detailResult.merchantDetail.primaryCategory || "无"}, 网络: ${detailResult.merchantDetail.networks?.length || 0}个`,
                );
              } else {
                stats.detailsFailed++;
                console.log(
                  `    ❌ 失败 - ${detailResult.error || "未知错误"}`,
                );
                // 即使详情抓取失败，也保留基本信息
                allMerchants.push(merchant);
              }

              // 详情抓取间隔，避免过于频繁的请求
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 + Math.random() * 2000),
              );
            } catch (error) {
              stats.detailsFailed++;
              console.log(`    ❌ 异常 - ${(error as Error).message}`);
              // 即使出现异常，也保留基本信息
              allMerchants.push(merchant);
            }
          }

          const detailEndTime = Date.now();
          const detailDuration = (detailEndTime - detailStartTime) / 1000;
          stats.detailScrapingTime =
            (stats.detailScrapingTime || 0) + (detailEndTime - detailStartTime);

          console.log(
            `  📊 第${currentPage}页详情抓取完成 (耗时: ${detailDuration.toFixed(2)}秒)`,
          );
          console.log(
            `    成功: ${stats.detailsScraped}个, 失败: ${stats.detailsFailed}个`,
          );

          // 将剩余未抓取详情的商户添加到结果中
          if (parsedResults.merchants.length > maxDetailsPerPage) {
            const remainingMerchants =
              parsedResults.merchants.slice(maxDetailsPerPage);
            allMerchants.push(...remainingMerchants);
            console.log(
              `  📝 剩余 ${remainingMerchants.length} 个商户仅保留基本信息`,
            );
          }
        } else {
          // 如果未启用详情抓取，直接添加基本信息
          allMerchants.push(...parsedResults.merchants);
        }

        console.log(`📈 累计抓取: ${allMerchants.length} 个商家`);
      } else {
        console.log(`⚠️ 第${currentPage}页没有找到商家数据`);
      }

      if (currentPage < maxPages && parsedResults.hasNextPage) {
        console.log(`\n➡️ 准备跳转到第 ${currentPage + 1} 页`);
        const nextPageSuccess = await resultsParser.navigateToNextPage();

        if (nextPageSuccess) {
          console.log(`✅ 成功跳转到第 ${currentPage + 1} 页`);
          currentPage++;
          await page.waitForTimeout(2000);
        } else {
          console.log("❌ 无法跳转到下一页，结束抓取");
          break;
        }
      } else {
        if (currentPage >= maxPages) {
          console.log(`\n⏹️ 已达到最大页数限制 (${maxPages})，停止抓取`);
        } else {
          console.log("\n⏹️ 没有更多页面，抓取完成");
        }
        break;
      }
    }

    stats.scrapingTime = Date.now() - scrapingStartTime;
    stats.totalPages = currentPage;
    stats.totalMerchants = allMerchants.length;

    // 更新统计信息（合并基本信息和详情信息）
    const countries = new Set<string>();
    const networks = new Set<string>();
    const categories = new Set<string>();
    let totalNetworkConnections = 0;

    allMerchants.forEach((merchant) => {
      if (merchant.country) countries.add(merchant.country);
      if (merchant.network) networks.add(merchant.network);
      if (merchant.primaryCategory) categories.add(merchant.primaryCategory);
      if (merchant.networks) {
        totalNetworkConnections += merchant.networks.length;
        merchant.networks.forEach((network) => {
          if (network.networkName) networks.add(network.networkName);
        });
      }
    });

    stats.countries = Array.from(countries);
    stats.networks = Array.from(networks);
    stats.categories = Array.from(categories);
    stats.totalNetworks = totalNetworkConnections;

    // 阶段6: 数据导出
    console.log("\n📤 阶段6: 数据导出");
    console.log("-".repeat(50));

    const exportResults = {
      merchants: allMerchants,
      totalCount: allMerchants.length,
      currentPage: currentPage,
      hasNextPage: false,
    };

    const jsonExport = resultsParser.exportToJson(exportResults);
    const csvExport = resultsParser.exportToCsv(exportResults);

    console.log(`JSON导出: ${jsonExport.length} 字符`);
    console.log(`CSV导出: ${csvExport.length} 字符`);

    // 保存到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fs = await import("fs");

    try {
      await fs.promises.writeFile(
        `/root/TrendHub/fmtc-complete-test-${timestamp}.json`,
        jsonExport,
        "utf8",
      );

      await fs.promises.writeFile(
        `/root/TrendHub/fmtc-complete-test-${timestamp}.csv`,
        csvExport,
        "utf8",
      );

      console.log(`✅ 数据已保存到文件: fmtc-complete-test-${timestamp}.*`);
    } catch (error) {
      console.log("⚠️ 文件保存失败:", error);
      stats.errors.push(`文件保存失败: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
    stats.errors.push((error as Error).message);
  } finally {
    // 生成最终报告
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log("\n" + "=".repeat(80));
    console.log("📋 测试完成 - 生成报告");
    console.log("=".repeat(80));

    const report = generateTestReport(stats);
    console.log(report);

    // 保存报告
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fs = await import("fs");
      await fs.promises.writeFile(
        `${process.cwd()}/fmtc-test-report-${timestamp}.json`,
        report,
        "utf8",
      );
      console.log(`\n📄 测试报告已保存: fmtc-test-report-${timestamp}.json`);
    } catch (error) {
      console.log("⚠️ 报告保存失败:", error);
    }

    console.log("\n等待5秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  }

  return allMerchants;
}

// 处理命令行参数
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  // 显示帮助信息
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("FMTC 完整集成测试使用说明:");
    console.log("");
    console.log("基本用法:");
    console.log("  npx tsx fmtc-complete-test.ts");
    console.log("");
    console.log("参数选项:");
    console.log("  --clear-session    清理保存的会话状态");
    console.log("  --force-login      强制重新登录（忽略保存的会话）");
    console.log("  --enable-details   启用商户详情抓取");
    console.log("  --test-detail-url <URL>  单独测试指定的商户详情页面");
    console.log("  --help, -h         显示此帮助信息");
    console.log("");
    console.log("会话管理:");
    console.log("  • 测试会自动保存登录会话状态");
    console.log("  • 下次运行时会尝试恢复会话，避免重复登录");
    console.log("  • 会话有效期: 4小时");
    console.log("  • 会话文件: fmtc-session.json");
    console.log("");
    console.log("示例:");
    console.log("  # 完整集成测试");
    console.log("  npx tsx fmtc-complete-test.ts --clear-session");
    console.log("  npx tsx fmtc-complete-test.ts --force-login");
    console.log("  npx tsx fmtc-complete-test.ts --enable-details");
    console.log("");
    console.log("  # 单独测试商户详情页面");
    console.log(
      '  npx tsx fmtc-complete-test.ts --test-detail-url "https://account.fmtc.co/cp/program_directory/details/m/1032/Macys"',
    );
    console.log(
      '  npx tsx fmtc-complete-test.ts --test-detail-url "https://account.fmtc.co/cp/program_directory/details/m/1032/Macys" --force-login',
    );
    process.exit(0);
  }

  // 仅清理会话状态
  if (process.argv.includes("--clear-session-only")) {
    console.log("🗑️ 清理会话状态...");
    cleanupSessionState();
    console.log("✅ 会话状态已清理");
    process.exit(0);
  }

  // 运行完整测试
  runCompleteTest().catch(console.error);
}

export { runCompleteTest, cleanupSessionState, SESSION_CONFIG };
