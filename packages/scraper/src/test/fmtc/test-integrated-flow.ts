/**
 * FMTC 整合流程测试 - 测试从登录到搜索结果解析的完整流程
 */

import { chromium } from "playwright";
import { Log } from "crawlee";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import { FMTCNavigationHandler } from "../../sites/fmtc/navigation-handler.js";
import { FMTCSearchHandler } from "../../sites/fmtc/search-handler.js";
import { FMTCResultsParser } from "../../sites/fmtc/results-parser.js";
// import { getSearchConfig, getRecaptchaConfig } from "../../sites/fmtc/config.js";

async function testIntegratedFlow() {
  console.log("🧪 开始测试 FMTC 整合流程");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // 添加延迟以便观察
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  const log = new Log({ level: 4 }); // DEBUG level

  // 设置页面超时时间
  page.setDefaultTimeout(60000); // 60秒超时
  page.setDefaultNavigationTimeout(60000);

  try {
    // 1. 测试登录
    console.log("🔐 测试登录功能");
    const loginHandler = new FMTCLoginHandler(page, log);
    // Get config for reference (currently unused in this test)
    // const searchConfig = getSearchConfig();
    // const recaptchaConfig = getRecaptchaConfig();

    // 导航到登录页面（带重试机制）
    console.log("🌐 开始导航到登录页面...");
    let loginPageLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!loginPageLoaded && retryCount < maxRetries) {
      try {
        console.log(`尝试第 ${retryCount + 1} 次加载登录页面...`);

        await page.goto("https://account.fmtc.co/cp/login", {
          waitUntil: "domcontentloaded", // 改为更宽松的等待条件
          timeout: 90000, // 增加到90秒
        });

        // 等待页面稳定
        await page.waitForTimeout(3000);

        // 检查是否成功加载
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

    console.log("📍 已到达登录页面");

    // 执行登录
    const loginResult = await loginHandler.login({
      username: process.env.FMTC_USERNAME || "alphaskeith@gmail.com",
      password: process.env.FMTC_PASSWORD || "P@$$word!@#",
    });

    if (!loginResult.success) {
      console.error("❌ 登录失败:", loginResult.error);
      return;
    }

    console.log("✅ 登录成功");

    // 2. 测试导航
    console.log("🧭 测试页面导航");
    const navigationHandler = new FMTCNavigationHandler(page, log);

    const navigationResult = await navigationHandler.navigateToDirectory();

    if (!navigationResult.success) {
      console.error("❌ 导航失败:", navigationResult.error);
      return;
    }

    console.log("✅ 成功导航到Directory页面");

    // 3. 测试搜索
    console.log("🔍 测试搜索功能");
    const searchHandler = new FMTCSearchHandler(page, log);

    // 获取搜索参数
    const searchParams = searchHandler.getSearchParamsFromConfig();
    console.log("搜索参数:", searchParams);

    // 执行搜索
    const searchResult = await searchHandler.performSearch(searchParams);

    if (!searchResult.success) {
      console.error("❌ 搜索失败:", searchResult.error);
      return;
    }

    console.log("✅ 搜索成功，找到", searchResult.resultsCount, "个结果");

    // 4. 测试结果解析
    console.log("📊 测试结果解析");
    const resultsParser = new FMTCResultsParser(page, log);

    // 调试结果页面结构
    await resultsParser.debugResultsStructure();

    // 解析结果
    const parsedResults = await resultsParser.parseSearchResults();

    console.log("📋 解析结果:");
    console.log("- 商户数量:", parsedResults.merchants.length);
    console.log("- 总数:", parsedResults.totalCount);
    console.log("- 当前页:", parsedResults.currentPage);
    console.log("- 有下一页:", parsedResults.hasNextPage);

    // 显示前几个商户信息
    if (parsedResults.merchants.length > 0) {
      console.log("🏪 前几个商户:");
      parsedResults.merchants.slice(0, 3).forEach((merchant, index) => {
        console.log(
          `${index + 1}. ${merchant.name} | ${merchant.country} | ${merchant.network} | ${merchant.dateAdded}`,
        );
      });

      console.log("✅ 结果解析成功");

      // 5. 测试分页（如果有下一页）
      if (parsedResults.hasNextPage) {
        console.log("📄 测试分页功能");

        const paginationInfo = await resultsParser.getPaginationInfo();
        console.log("分页信息:", paginationInfo);

        // 注释掉实际的分页测试，避免过多请求
        // const nextPageSuccess = await resultsParser.navigateToNextPage();
        // console.log("下一页导航:", nextPageSuccess ? "成功" : "失败");
      }

      // 6. 测试导出功能
      console.log("📤 测试导出功能");

      const jsonExport = resultsParser.exportToJson(parsedResults);
      console.log("JSON导出长度:", jsonExport.length, "字符");

      const csvExport = resultsParser.exportToCsv(parsedResults);
      console.log("CSV导出长度:", csvExport.length, "字符");
      console.log("CSV头部预览:", csvExport.substring(0, 100) + "...");

      console.log("✅ 导出功能测试成功");
    } else {
      console.log("⚠️ 未解析到商户数据");
    }

    console.log("🎉 整合流程测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    // 等待一段时间以便查看结果
    console.log("等待5秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  }
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  testIntegratedFlow().catch(console.error);
}

export { testIntegratedFlow };
