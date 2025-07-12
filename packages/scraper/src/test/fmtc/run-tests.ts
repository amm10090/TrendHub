/**
 * FMTC 测试运行器
 */

import { testResultsParser } from "./test-results-parser.js";
import { testIntegratedFlow } from "./test-integrated-flow.js";
import { testPaginationScraping } from "./test-pagination-scraping.js";

async function runAllTests() {
  console.log("🧪 开始运行所有FMTC测试");
  console.log("=".repeat(60));

  try {
    // 1. 运行结果解析器测试
    console.log("1️⃣ 运行结果解析器测试");
    await testResultsParser();
    console.log("✅ 结果解析器测试完成\n");

    // 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. 运行整合流程测试（需要真实登录）
    const runIntegrated =
      process.argv.includes("--full") || process.argv.includes("--integrated");
    const runPagination =
      process.argv.includes("--pagination") || process.argv.includes("--full");

    if (runIntegrated) {
      console.log("2️⃣ 运行整合流程测试（包含真实登录）");
      console.log("⚠️  注意：这将使用真实的FMTC账户进行测试");
      await testIntegratedFlow();
      console.log("✅ 整合流程测试完成\n");
    } else {
      console.log(
        "2️⃣ 跳过整合流程测试（使用 --full 或 --integrated 参数来运行）",
      );
    }

    // 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. 运行分页抓取测试
    if (runPagination) {
      console.log("3️⃣ 运行分页抓取测试（包含真实登录和多页抓取）");
      console.log("⚠️  注意：这将抓取多页商家数据，可能需要较长时间");
      await testPaginationScraping();
      console.log("✅ 分页抓取测试完成\n");
    } else {
      console.log(
        "3️⃣ 跳过分页抓取测试（使用 --pagination 或 --full 参数来运行）",
      );
    }

    console.log("🎉 所有测试完成！");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    process.exit(1);
  }
}

// 显示使用说明
function showUsage() {
  console.log("FMTC 测试运行器使用说明:");
  console.log("");
  console.log("基础测试（仅模拟数据）:");
  console.log("  npm run test:fmtc");
  console.log("  或");
  console.log("  tsx src/test/fmtc/run-tests.ts");
  console.log("");
  console.log("完整测试（包含真实登录）:");
  console.log("  npm run test:fmtc -- --full");
  console.log("  或");
  console.log("  tsx src/test/fmtc/run-tests.ts --full");
  console.log("");
  console.log("分页抓取测试:");
  console.log("  npm run test:fmtc -- --pagination");
  console.log("  或");
  console.log("  npm run test:fmtc:pagination");
  console.log("");
  console.log("参数说明:");
  console.log("  --full               运行所有测试（基础+整合+分页）");
  console.log("  --integrated         仅运行整合流程测试");
  console.log("  --pagination         仅运行分页抓取测试");
  console.log("  --help               显示此帮助信息");
  console.log("");
}

// 处理命令行参数
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  showUsage();
  process.exit(0);
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  runAllTests().catch(console.error);
}

export { runAllTests };
