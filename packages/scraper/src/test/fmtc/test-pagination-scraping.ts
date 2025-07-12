/**
 * FMTC 分页抓取测试 - 测试多页商家数据抓取
 */

import { chromium } from "playwright";
import { Log } from "crawlee";
import { FMTCLoginHandler } from "../../sites/fmtc/login-handler.js";
import { FMTCNavigationHandler } from "../../sites/fmtc/navigation-handler.js";
import { FMTCSearchHandler } from "../../sites/fmtc/search-handler.js";
import {
  FMTCResultsParser,
  type MerchantInfo,
} from "../../sites/fmtc/results-parser.js";

async function testPaginationScraping() {
  console.log("🧪 开始测试 FMTC 分页抓取功能");
  console.log("=".repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // 适中的延迟以便观察
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

  const allMerchants: MerchantInfo[] = [];
  let currentPage = 1;
  const maxPages = 3; // 最多测试3页，避免过多请求

  try {
    // 1. 登录
    console.log("🔐 步骤1: 执行登录");
    const loginHandler = new FMTCLoginHandler(page, log);

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

    const loginResult = await loginHandler.login({
      username: process.env.FMTC_USERNAME || "alphaskeith@gmail.com",
      password: process.env.FMTC_PASSWORD || "P@$$word!@#",
    });

    if (!loginResult.success) {
      console.error("❌ 登录失败:", loginResult.error);
      return;
    }
    console.log("✅ 登录成功");

    // 2. 导航到Directory页面
    console.log("🧭 步骤2: 导航到Directory页面");
    const navigationHandler = new FMTCNavigationHandler(page, log);
    const navigationResult = await navigationHandler.navigateToDirectory();

    if (!navigationResult.success) {
      console.error("❌ 导航失败:", navigationResult.error);
      return;
    }
    console.log("✅ 成功导航到Directory页面");

    // 3. 执行搜索
    console.log("🔍 步骤3: 执行搜索");
    const searchHandler = new FMTCSearchHandler(page, log);
    const searchParams = searchHandler.getSearchParamsFromConfig();
    console.log("搜索参数:", searchParams);

    const searchResult = await searchHandler.performSearch(searchParams);

    if (!searchResult.success) {
      console.error("❌ 搜索失败:", searchResult.error);
      return;
    }
    console.log(`✅ 搜索成功，找到 ${searchResult.resultsCount} 个结果`);

    // 4. 创建结果解析器
    const resultsParser = new FMTCResultsParser(page, log);

    // 5. 开始分页抓取循环
    console.log("📊 步骤4: 开始分页抓取");
    console.log("-".repeat(50));

    while (currentPage <= maxPages) {
      console.log(`\n📄 处理第 ${currentPage} 页`);

      // 获取当前分页信息
      const paginationInfo = await resultsParser.getPaginationInfo();
      console.log(
        `分页信息: 第${paginationInfo.currentPage}页，共${paginationInfo.totalPages}页，总计${paginationInfo.totalEntries}条记录`,
      );

      // 解析当前页面的商家数据
      const parsedResults = await resultsParser.parseSearchResults();

      if (parsedResults.merchants.length > 0) {
        console.log(
          `✅ 第${currentPage}页解析成功: ${parsedResults.merchants.length} 个商家`,
        );

        // 显示当前页面的商家信息
        console.log(`🏪 第${currentPage}页商家列表:`);
        parsedResults.merchants.forEach((merchant, index) => {
          console.log(
            `  ${currentPage}-${index + 1}. ${merchant.name} | ${merchant.country} | ${merchant.network} | ${merchant.dateAdded}`,
          );
        });

        // 添加到总列表
        allMerchants.push(...parsedResults.merchants);

        console.log(`📈 累计抓取: ${allMerchants.length} 个商家`);
      } else {
        console.log(`⚠️ 第${currentPage}页没有找到商家数据`);
      }

      // 检查是否有下一页
      if (currentPage < maxPages && parsedResults.hasNextPage) {
        console.log(`\n➡️ 准备跳转到第 ${currentPage + 1} 页`);

        // 导航到下一页
        const nextPageSuccess = await resultsParser.navigateToNextPage();

        if (nextPageSuccess) {
          console.log(`✅ 成功跳转到第 ${currentPage + 1} 页`);
          currentPage++;

          // 等待页面稳定
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

    // 6. 显示抓取总结
    console.log("\n" + "=".repeat(60));
    console.log("📊 抓取总结报告");
    console.log("=".repeat(60));
    console.log(`📄 总页数: ${currentPage} 页`);
    console.log(`🏪 总商家数: ${allMerchants.length} 个`);
    console.log(
      `🌍 涉及国家: ${[...new Set(allMerchants.map((m) => m.country))].filter(Boolean).join(", ")}`,
    );
    console.log(
      `🔗 涉及网络: ${[...new Set(allMerchants.map((m) => m.network))].filter(Boolean).join(", ")}`,
    );

    // 7. 按页面分组显示统计
    console.log("\n📈 分页统计:");
    const merchantsByPage = new Map<number, number>();
    allMerchants.forEach((merchant) => {
      const pageNum = Math.floor(allMerchants.indexOf(merchant) / 10) + 1;
      merchantsByPage.set(pageNum, (merchantsByPage.get(pageNum) || 0) + 1);
    });

    merchantsByPage.forEach((count, page) => {
      console.log(`  第${page}页: ${count} 个商家`);
    });

    // 8. 导出数据
    console.log("\n📤 导出抓取数据");

    const mockResults = {
      merchants: allMerchants,
      totalCount: allMerchants.length,
      currentPage: currentPage,
      hasNextPage: false,
    };

    const jsonExport = resultsParser.exportToJson(mockResults);
    const csvExport = resultsParser.exportToCsv(mockResults);

    console.log(`JSON导出: ${jsonExport.length} 字符`);
    console.log(`CSV导出: ${csvExport.length} 字符`);

    // 9. 保存到文件（可选）
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fs = await import("fs");

    try {
      await fs.promises.writeFile(
        `/root/TrendHub/fmtc-pagination-test-${timestamp}.json`,
        jsonExport,
        "utf8",
      );

      await fs.promises.writeFile(
        `/root/TrendHub/fmtc-pagination-test-${timestamp}.csv`,
        csvExport,
        "utf8",
      );

      console.log(`✅ 数据已保存到文件: fmtc-pagination-test-${timestamp}.*`);
    } catch (error) {
      console.log("⚠️ 文件保存失败:", error);
    }

    console.log("\n🎉 分页抓取测试完成！");

    return allMerchants;
  } catch (error) {
    console.error("❌ 分页抓取测试失败:", error);
    throw error;
  } finally {
    // 等待一段时间以便查看结果
    console.log("\n等待5秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  }
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  testPaginationScraping().catch(console.error);
}

export { testPaginationScraping };
