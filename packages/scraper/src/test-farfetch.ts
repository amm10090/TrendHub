import scrapeFarfetch from "./sites/farfetch.js"; // Corrected: Use default import
import * as fs from "fs";
import * as path from "path";
import type { ScraperOptions } from "./main.js"; // Import ScraperOptions type

// 定义产品类别映射
const CATEGORY_PATHS: Record<string, string> = {
  clothing: "clothing-1/items.aspx",
  shoes: "shoes-1/items.aspx",
  bags: "bags-purses-1/items.aspx",
  accessories: "accessories-all-1/items.aspx",
  jewelry: "jewellery-1/items.aspx",
  // 可以添加更多类别
};

async function testFarfetchScraper() {
  console.log("开始测试 Farfetch 爬虫...");
  console.log("可用参数:");
  console.log("  --gender <men|women>  指定抓取的性别分类 (例如: women)");
  console.log(
    "  --category <category> 指定抓取的产品类别 (clothing|shoes|bags|accessories|jewelry)",
  );
  console.log(
    "  --custom-path <path>  指定自定义分类路径 (会覆盖--category参数)",
  );
  console.log("  --max <number>        指定最大抓取商品数量 (默认: 10)");
  console.log("  --startPage <number>  指定起始页码 (默认: 1)");
  console.log("  --no-headless         使用有界面的浏览器模式运行");
  console.log(
    '示例: pnpm --filter="@repo/scraper" test:farfetch -- --gender women --category clothing --max 5 --no-headless',
  );
  console.log("");

  const args = process.argv.slice(2);
  let gender: "men" | "women" | null = null;
  let category: string | null = "clothing"; // 默认类别：衣服
  let customPath: string | null = null; // 自定义路径
  let maxProducts = 10;
  let headless = true;
  let startPage = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--gender" && i + 1 < args.length) {
      const genderArg = args[++i].toLowerCase();
      if (genderArg === "men" || genderArg === "women") {
        gender = genderArg;
      }
    } else if (args[i] === "--category" && i + 1 < args.length) {
      const categoryArg = args[++i].toLowerCase();
      if (Object.keys(CATEGORY_PATHS).includes(categoryArg)) {
        category = categoryArg;
      } else {
        console.warn(`未知类别: ${categoryArg}，使用默认类别: clothing`);
      }
    } else if (args[i] === "--custom-path" && i + 1 < args.length) {
      customPath = args[++i];
    } else if (args[i] === "--max" && i + 1 < args.length) {
      maxProducts = parseInt(args[++i], 10) || 10;
    } else if (args[i] === "--startPage" && i + 1 < args.length) {
      startPage = parseInt(args[++i], 10) || 1;
    } else if (args[i] === "--no-headless") {
      headless = false;
    }
  }

  gender = gender || "women"; // 如果未指定性别，默认为women

  console.log(`使用性别: ${gender}`);
  console.log(
    `使用类别: ${category}${customPath ? " (已被自定义路径覆盖)" : ""}`,
  );

  if (!headless) {
    console.log("使用有界面的浏览器模式运行");
  }

  try {
    const options: ScraperOptions = {
      maxProducts: maxProducts,
      headless: headless,
    };

    let startUrlBase = "https://www.farfetch.com/tw/shopping/";
    let startUrls: string | string[];

    // 确定URL路径
    let categoryPath;
    if (customPath) {
      categoryPath = customPath;
    } else if (category && CATEGORY_PATHS[category]) {
      categoryPath = CATEGORY_PATHS[category];
    } else {
      categoryPath = CATEGORY_PATHS.clothing; // 默认为clothing
    }

    startUrlBase += `${gender}/${categoryPath}`;

    if (startPage > 1) {
      startUrls = `${startUrlBase}?page=${startPage}`;
    } else {
      startUrls = startUrlBase;
    }

    console.log(`开始使用URL抓取: ${startUrls}`);

    const executionId = `test-farfetch-${gender}-${category || "custom"}-${new Date().getTime()}`;
    const products = await scrapeFarfetch(startUrls, options, executionId);

    if (!products) {
      console.log("爬虫未返回任何产品。");
      return;
    }

    console.log(`成功抓取 ${products.length} 个商品`);

    const outputDir = path.resolve(process.cwd(), "test-results");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const genderLabel = gender || "default";
    const categoryLabel = category || (customPath ? "custom" : "general");
    const outputFile = path.join(
      outputDir,
      `farfetch-test-${genderLabel}-${categoryLabel}-p${startPage}-${timestamp}.json`,
    );
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), "utf8");

    console.log(`测试结果已保存到: ${outputFile}`);

    if (products.length > 0) {
      console.log("\n抓取结果预览 (最多3个):");
      for (let i = 0; i < Math.min(3, products.length); i++) {
        const p = products[i];
        console.log(`---商品 ${i + 1}---`);
        console.log(`  名称: ${p.name}`);
        console.log(`  品牌: ${p.brand}`);
        console.log(
          `  价格: ${p.currentPrice?.amount} ${p.currentPrice?.currency}`,
        );
        console.log(`  URL: ${p.url}`);
        console.log(`  性别: ${p.gender}`);
        console.log("");
      }
    } else {
      console.log("未抓取到任何商品。");
    }

    console.log("测试完成!");
  } catch (error) {
    console.error("测试过程中出错:", error);
  }
}

testFarfetchScraper().catch(console.error);
