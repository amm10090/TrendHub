#!/usr/bin/env ts-node

import scrapeItalist from "../sites/italist.js";

async function quickTestItalist() {
  console.log("🔧 快速测试更新后的选择器...");

  const options = {
    maxProducts: 5, // 增加到5个产品测试
    maxRequests: 10,
    maxConcurrency: 1,
    headless: false, // 显示浏览器便于调试
    maxLoadClicks: 1,
  };

  try {
    const results = await scrapeItalist(
      "https://www.italist.com/us/women/shoes/108/", // 使用鞋子页面
      options,
      "quick-test-shoes",
    );

    if (results && results.length > 0) {
      console.log(`✅ 成功！获取到 ${results.length} 个产品`);
      results.forEach((product, i) => {
        console.log(`\n产品 ${i + 1}:`);
        console.log(`  品牌: ${product.brand || "未提取"}`);
        console.log(`  名称: ${product.name || "未提取"}`);
        console.log(`  现价: $${product.currentPrice?.amount || "未提取"}`);
        console.log(`  原价: $${product.originalPrice?.amount || "未提取"}`);
        console.log(
          `  折扣: ${product.discount ? (product.discount * 100).toFixed(1) + "%" : "无"}`,
        );
        console.log(`  URL: ${product.url}`);
      });
    } else {
      console.log("❌ 仍然没有获取到产品");
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

quickTestItalist();
