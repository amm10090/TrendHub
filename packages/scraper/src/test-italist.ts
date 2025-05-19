// packages/scraper/src/test-italist.ts
import scrapeItalist from "./sites/italist.js";
import type { ScraperOptions, Product } from "./main.js"; // Assuming ScraperOptions is exported from main.ts
import { LocalScraperLogLevel, sendLogToBackend } from "./utils.js"; // For logging if needed
import * as fs from "fs";
import * as path from "path";

async function runItalistTest() {
  console.log("开始 Italist 爬虫测试...");
  console.log("可用参数:");
  console.log(
    "  --max <number>        指定最大抓取商品数量 (默认: 5 PLP, 1 PDP)",
  );
  console.log("  --no-headless         使用有界面的浏览器模式运行");
  console.log(
    '示例: pnpm --filter="@repo/scraper" test:italist -- --max 3 --no-headless',
  );
  console.log("");

  // 解析命令行参数
  const args = process.argv.slice(2);
  let maxProductsPlp = 5;
  let maxProductsPdp = 1;
  let headless = true; // 默认使用无头模式

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max" && i + 1 < args.length) {
      const max = parseInt(args[++i], 10);
      if (!isNaN(max) && max > 0) {
        maxProductsPlp = max;
        maxProductsPdp = Math.max(1, Math.floor(max / 2)); // PDP通常只测试少量或1个
      }
    } else if (args[i] === "--no-headless") {
      headless = false; // 设置为非无头模式
    }
  }

  if (!headless) {
    console.log("使用有界面的浏览器模式运行");
  }

  const mockExecutionId = `test-italist-${new Date().getTime()}`;

  await sendLogToBackend(
    mockExecutionId,
    LocalScraperLogLevel.INFO,
    "[TestItalist] 开始测试运行",
    {
      testType: "manual_script",
      headlessMode: headless,
      maxProductsPlp,
      maxProductsPdp,
    },
  );

  const baseOptions: Omit<ScraperOptions, "maxProducts"> = {
    headless: headless,
    maxRequests: 10,
    maxLoadClicks: 2,
  };

  // --- 测试用例 1: 抓取一个男装PLP页面 ---
  const plpUrlMen = "https://www.italist.com/us/men/clothing/125/";
  console.log(
    `\n--- 测试用例 1: 抓取男装 PLP: ${plpUrlMen} (maxProducts: ${maxProductsPlp}) ---`,
  );
  const plpMenOptions: ScraperOptions = {
    ...baseOptions,
    maxProducts: maxProductsPlp,
  };
  let productsFromPlpMen: Product[] = [];

  try {
    const results = await scrapeItalist(
      plpUrlMen,
      plpMenOptions,
      mockExecutionId + "_plp_men",
    );
    productsFromPlpMen = Array.isArray(results) ? results : [];

    if (productsFromPlpMen.length > 0) {
      console.log(
        `从 ${plpUrlMen} 抓取到 ${productsFromPlpMen.length} 个商品:`,
      );
      productsFromPlpMen.slice(0, 2).forEach((p: Product, i: number) => {
        console.log(`  商品 ${i + 1}:`);
        console.log(`    名称: ${p.name}`);
        console.log(`    品牌: ${p.brand}`);
        console.log(`    URL: ${p.url}`);
        console.log(
          `    售价: ${p.currentPrice?.amount} ${p.currentPrice?.currency}`,
        );
        console.log(
          `    原价: ${p.originalPrice?.amount} ${p.originalPrice?.currency}`,
        );
        console.log(`    图片数: ${p.images?.length}`);
        console.log(`    SKU: ${p.sku}`);
      });

      // 保存结果到文件
      saveResultsToFile(productsFromPlpMen, "men", "clothing");

      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.INFO,
        `[TestItalist] PLP Men 测试完成，抓取到 ${productsFromPlpMen.length} 个商品`,
        { url: plpUrlMen, count: productsFromPlpMen.length },
      );
    } else {
      console.warn(
        `[TestItalist] PLP Men 测试未返回预期的商品数组。接收到:`,
        productsFromPlpMen,
      );
      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.WARN,
        `[TestItalist] PLP Men 测试未返回数组或数组为空`,
        { url: plpUrlMen, received: productsFromPlpMen },
      );
    }
  } catch (error) {
    console.error(
      `测试用例 1 (PLP Men) 失败: ${(error as Error).message}`,
      error,
    );
    await sendLogToBackend(
      mockExecutionId,
      LocalScraperLogLevel.ERROR,
      `[TestItalist] PLP Men 测试失败`,
      {
        url: plpUrlMen,
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
    );
  }

  // --- 测试用例 2: 抓取一个女装PLP页面 ---
  const plpUrlWomen = "https://www.italist.com/us/women/clothing/2/";
  console.log(
    `\n--- 测试用例 2: 抓取女装 PLP: ${plpUrlWomen} (maxProducts: ${maxProductsPlp}) ---`,
  );
  const plpWomenOptions: ScraperOptions = {
    ...baseOptions,
    maxProducts: maxProductsPlp,
  };
  let productsFromPlpWomen: Product[] = [];

  try {
    const results = await scrapeItalist(
      plpUrlWomen,
      plpWomenOptions,
      mockExecutionId + "_plp_women",
    );
    productsFromPlpWomen = Array.isArray(results) ? results : [];

    if (productsFromPlpWomen.length > 0) {
      console.log(
        `从 ${plpUrlWomen} 抓取到 ${productsFromPlpWomen.length} 个商品:`,
      );
      productsFromPlpWomen.slice(0, 2).forEach((p: Product, i: number) => {
        console.log(`  商品 ${i + 1}: ${p.name} - ${p.brand}`);
      });

      // 保存结果到文件
      saveResultsToFile(productsFromPlpWomen, "women", "clothing");

      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.INFO,
        `[TestItalist] PLP Women 测试完成，抓取到 ${productsFromPlpWomen.length} 个商品`,
        { url: plpUrlWomen, count: productsFromPlpWomen.length },
      );
    } else {
      console.warn(
        `[TestItalist] PLP Women 测试未返回预期的商品数组或数组为空`,
      );
      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.WARN,
        `[TestItalist] PLP Women 测试未返回数组或数组为空`,
        { url: plpUrlWomen, received: productsFromPlpWomen },
      );
    }
  } catch (error) {
    console.error(
      `测试用例 2 (PLP Women) 失败: ${(error as Error).message}`,
      error,
    );
    await sendLogToBackend(
      mockExecutionId,
      LocalScraperLogLevel.ERROR,
      `[TestItalist] PLP Women 测试失败`,
      {
        url: plpUrlWomen,
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
    );
  }

  // --- 测试用例 3: 抓取单个PDP页面 ---
  const pdpUrlExample =
    "https://www.italist.com/us/women/shoes/sandals/sabot-sandals-in-white-leather/15504608/15671488/gianvito-rossi/";
  console.log(
    `\n--- 测试用例 3: 抓取单个 PDP: ${pdpUrlExample} (maxProducts: ${maxProductsPdp}) ---`,
  );
  const pdpOptions: ScraperOptions = {
    ...baseOptions,
    maxProducts: maxProductsPdp,
  };
  let productsFromPdp: Product[] = [];

  try {
    const results = await scrapeItalist(
      pdpUrlExample,
      pdpOptions,
      mockExecutionId + "_pdp",
    );
    productsFromPdp = Array.isArray(results) ? results : [];

    if (productsFromPdp.length > 0) {
      console.log(
        `从 ${pdpUrlExample} 抓取到 ${productsFromPdp.length} 个商品:`,
      );
      const p: Product = productsFromPdp[0];
      console.log(`    名称: ${p.name}`);
      console.log(`    品牌: ${p.brand}`);
      console.log(`    URL: ${p.url}`);
      console.log(
        `    售价: ${p.currentPrice?.amount} ${p.currentPrice?.currency}`,
      );
      console.log(`    描述 (部分): ${p.description?.substring(0, 100)}...`);
      console.log(`    图片数: ${p.images?.length}`);
      console.log(`    首图URL (示例): ${p.images?.[0]}`);
      console.log(`    尺码: ${p.sizes?.join(", ")}`);
      console.log(`    颜色: ${p.color}`);
      console.log(`    材质: ${p.material}`);
      console.log(`    SKU: ${p.sku}`);
      console.log(`    面包屑: ${p.breadcrumbs?.join(" > ")}`);

      // 保存结果到文件
      saveResultsToFile(productsFromPdp, "women", "pdp");

      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.INFO,
        `[TestItalist] PDP 测试完成，抓取到 ${productsFromPdp.length} 个商品`,
        {
          url: pdpUrlExample,
          count: productsFromPdp.length,
          productSku: productsFromPdp[0]?.sku,
        },
      );
    } else {
      console.warn(
        `[TestItalist] PDP 测试返回了空的商品数组。URL: ${pdpUrlExample}`,
      );
      await sendLogToBackend(
        mockExecutionId,
        LocalScraperLogLevel.WARN,
        `[TestItalist] PDP 测试返回空数组。URL: ${pdpUrlExample}`,
        { url: pdpUrlExample, received: productsFromPdp },
      );
    }
  } catch (error) {
    console.error(`测试用例 3 (PDP) 失败: ${(error as Error).message}`, error);
    await sendLogToBackend(
      mockExecutionId,
      LocalScraperLogLevel.ERROR,
      `[TestItalist] PDP 测试失败`,
      {
        url: pdpUrlExample,
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
    );
  }

  // 创建一个合并的结果集，用于生成完整的测试报告
  const allResults = [
    ...productsFromPlpMen,
    ...productsFromPlpWomen,
    ...productsFromPdp,
  ];
  if (allResults.length > 0) {
    saveResultsToFile(allResults, "all", "combined");
  }

  console.log("\nItalist 爬虫测试结束。");
  await sendLogToBackend(
    mockExecutionId,
    LocalScraperLogLevel.INFO,
    "[TestItalist] 所有测试用例执行完毕",
  );
}

/**
 * 将测试结果保存到文件
 * @param products 抓取的商品数组
 * @param gender 性别标签
 * @param category 类别标签
 */
function saveResultsToFile(
  products: Product[],
  gender: string,
  category: string,
): void {
  try {
    // 创建输出目录（如果不存在）
    const outputDir = path.resolve(process.cwd(), "test-results");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 创建带有时间戳的输出文件名
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const outputFile = path.join(
      outputDir,
      `italist-test-${gender}-${category}-${timestamp}.json`,
    );

    // 将结果写入文件
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), "utf8");

    console.log(`测试结果已保存到: ${outputFile} (${products.length} 个商品)`);
  } catch (error) {
    console.error(`保存测试结果到文件时出错: ${(error as Error).message}`);
  }
}

runItalistTest().catch((error: Error) => {
  console.error("运行 Italist 测试时发生未捕获的错误:", error);
  sendLogToBackend(
    `test-italist-global-error-${new Date().getTime()}`,
    LocalScraperLogLevel.ERROR,
    "[TestItalist] 测试脚本顶层错误",
    { error: error.message, stack: error.stack },
  ).catch((logError: Error) =>
    console.error("Failed to send global error log to backend:", logError),
  );
});
