#!/usr/bin/env ts-node

import scrapeItalist from "../sites/italist.js";
import type { Product } from "@repo/types";

async function testItalistUpdated() {
  console.log("🚀 开始测试更新后的 Italist 爬虫...");

  try {
    const testUrls = ["https://www.italist.com/us/women/clothing/2/"];

    const options = {
      maxProducts: 5, // 测试少量产品
      maxRequests: 10,
      maxConcurrency: 1,
      headless: false, // 显示浏览器以便调试
      maxLoadClicks: 2,
    };

    console.log("📍 开始爬取:", testUrls[0]);
    console.log("⚙️ 配置:", options);

    const results = await scrapeItalist(
      testUrls,
      options,
      "test-italist-updated",
    );

    if (!results || !Array.isArray(results)) {
      console.log("❌ 未获取到有效结果");
      return;
    }

    console.log("\n✅ 爬取完成!");
    console.log(`📊 总共获取到 ${results.length} 个产品`);

    // 显示前几个产品的详细信息
    results.slice(0, 3).forEach((product: Product, index: number) => {
      console.log(`\n🛍️ 产品 ${index + 1}:`);
      console.log(`   品牌: ${product.brand || "未提取"}`);
      console.log(`   名称: ${product.name || "未提取"}`);
      console.log(`   现价: $${product.currentPrice?.amount || "未提取"}`);
      console.log(`   原价: $${product.originalPrice?.amount || "未提取"}`);
      console.log(`   图片数: ${product.images?.length || 0}`);
      console.log(`   URL: ${product.url}`);
      console.log(`   性别: ${product.gender || "未确定"}`);
      console.log(`   尺寸: ${product.sizes?.join(", ") || "未提取"}`);
      console.log(
        `   折扣: ${product.discount ? (product.discount * 100).toFixed(1) + "%" : "无"}`,
      );
    });

    // 验证数据质量
    const validProducts = results.filter(
      (p: Product) => p.brand && p.name && p.currentPrice,
    );
    console.log(`\n📈 数据质量:`);
    console.log(
      `   有效产品 (有品牌、名称、价格): ${validProducts.length}/${results.length}`,
    );
    console.log(
      `   有图片的产品: ${results.filter((p: Product) => p.images && p.images.length > 0).length}/${results.length}`,
    );
    console.log(
      `   有尺寸信息的产品: ${results.filter((p: Product) => p.sizes && p.sizes.length > 0).length}/${results.length}`,
    );
  } catch (error) {
    console.error("❌ 测试失败:", error);
    console.error("错误堆栈:", (error as Error).stack);
  }
}

// 运行测试
testItalistUpdated();
