console.log(
  `[DEBUG] Value of process.env.CHROME_EXECUTABLE_PATH at the start of test-cettire.ts: ${process.env.CHROME_EXECUTABLE_PATH}`,
);

import { scrapeCettire } from "./sites/cettire.js";
import * as fs from "fs";
import * as path from "path";

async function testCettireScraper() {
  console.log("开始测试 Cettire 爬虫...");
  console.log("可用参数:");
  console.log("  --gender <men|women>  指定抓取的性别分类");
  console.log("  --max <number>        指定最大抓取商品数量");
  console.log("  --screenshot-only     仅截图模式，不抓取数据");
  console.log("  --no-headless         使用有界面的浏览器模式运行");
  console.log(
    '示例: pnpm --filter="@repo/scraper" test:cettire -- --gender men --max 5 --no-headless',
  );
  console.log("");

  // 解析命令行参数
  const args = process.argv.slice(2);
  let gender: "men" | "women" | null = null;
  let maxProducts = 10;
  let screenshotOnly = false;
  let headless = true; // 默认使用无头模式

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--gender" && i + 1 < args.length) {
      const genderArg = args[++i].toLowerCase();
      if (genderArg === "men" || genderArg === "women") {
        gender = genderArg;
      }
    } else if (args[i] === "--max" && i + 1 < args.length) {
      maxProducts = parseInt(args[++i], 10) || 10;
    } else if (args[i] === "--screenshot-only") {
      screenshotOnly = true;
    } else if (args[i] === "--no-headless") {
      headless = false; // 设置为非无头模式
    }
  }

  if (screenshotOnly) {
    console.log("仅截图模式，将导航到页面并截图但不抓取数据");
  }

  if (!headless) {
    console.log("使用有界面的浏览器模式运行");
  }

  try {
    // 设置抓取选项
    const options = {
      maxProducts: maxProducts,
      screenshotOnly: screenshotOnly,
      headless: headless,
    };

    // 设置起始 URL
    let startUrls: string | string[] | undefined = undefined;
    if (gender) {
      console.log(`指定抓取 ${gender} 分类`);
      startUrls = `https://www.cettire.com/collections/${gender}`;
    } else {
      console.log("将抓取 women 和 men 分类");
    }

    // 执行抓取
    const products = await scrapeCettire(startUrls, options);

    console.log(`成功抓取 ${products.length} 个商品`);

    // 将结果保存到 JSON 文件
    const outputDir = path.resolve(process.cwd(), "test-results");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const genderLabel = gender ? gender : "all";
    const outputFile = path.join(
      outputDir,
      `cettire-test-${genderLabel}-${timestamp}.json`,
    );
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), "utf8");

    console.log(`测试结果已保存到: ${outputFile}`);

    // 简要展示结果
    if (products.length > 0) {
      console.log("\n抓取结果预览:");
      for (let i = 0; i < Math.min(3, products.length); i++) {
        const p = products[i];
        console.log(`---商品 ${i + 1}---`);
        console.log(`名称: ${p.name}`);
        console.log(`品牌: ${p.brand}`);
        console.log(
          `价格: ${p.currentPrice?.amount} ${p.currentPrice?.currency}`,
        );
        console.log(`URL: ${p.url}`);
        console.log(`性别: ${p.gender}`);
        console.log("");
      }
    } else {
      console.log("未抓取到任何商品");
    }

    console.log("测试完成!");
  } catch (error) {
    console.error("测试过程中出错:", error);
  }
}

// 运行测试
testCettireScraper().catch(console.error);
