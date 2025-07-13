/**
 * FMTC 测试运行器
 */

import { testResultsParser } from "./test-results-parser.js";
import { runCompleteTest } from "./fmtc-complete-test.js";

async function runAllTests() {
  console.log("🧪 开始运行 FMTC 测试套件");
  console.log("=".repeat(80));

  try {
    // 检查运行参数
    const runUnit =
      process.argv.includes("--unit") || process.argv.includes("--all");
    const runComplete =
      process.argv.includes("--complete") || process.argv.includes("--all");
    const showHelp =
      process.argv.includes("--help") || process.argv.includes("-h");

    if (showHelp) {
      console.log("FMTC 测试运行器使用说明:");
      console.log("  --unit         运行单元测试 (结果解析器测试)");
      console.log("  --complete     运行完整集成测试 (登录+抓取+导出)");
      console.log("  --all          运行所有测试");
      console.log("  --help, -h     显示此帮助信息");
      console.log("");
      console.log("会话管理选项 (仅完整测试):");
      console.log("  --clear-session    清理保存的会话状态后运行");
      console.log("  --force-login      强制重新登录（忽略保存的会话）");
      console.log("");
      console.log("示例:");
      console.log("  npx tsx run-tests.ts --unit");
      console.log("  npx tsx run-tests.ts --complete");
      console.log("  npx tsx run-tests.ts --complete --clear-session");
      console.log("  npx tsx run-tests.ts --complete --force-login");
      console.log("  npx tsx run-tests.ts --all");
      console.log("");
      console.log("💡 会话管理说明:");
      console.log("  • 完整测试会自动保存登录会话状态");
      console.log("  • 下次运行时会尝试恢复会话，避免重复登录和reCAPTCHA费用");
      console.log("  • 会话有效期: 4小时");
      return;
    }

    if (!runUnit && !runComplete) {
      console.log("⚠️  请指定要运行的测试类型:");
      console.log("  --unit      运行单元测试");
      console.log("  --complete  运行完整集成测试");
      console.log("  --all       运行所有测试");
      console.log("  --help      显示帮助信息");
      return;
    }

    // 1. 运行单元测试
    if (runUnit) {
      console.log("\n1️⃣ 运行单元测试");
      console.log("-".repeat(40));
      console.log("🧪 结果解析器测试");
      await testResultsParser();
      console.log("✅ 单元测试完成\n");

      if (runComplete) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // 2. 运行完整集成测试
    if (runComplete) {
      console.log("\n2️⃣ 运行完整集成测试");
      console.log("-".repeat(40));
      console.log("⚠️  注意：这将使用真实的FMTC账户进行完整的端到端测试");
      console.log("⚠️  包括：登录 + 导航 + 搜索 + 分页抓取 + 数据导出");
      console.log("⚠️  可能需要较长时间，请耐心等待...\n");

      await runCompleteTest();
      console.log("✅ 完整集成测试完成\n");
    }

    console.log("🎉 所有测试完成！");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  runAllTests().catch(console.error);
}

export { runAllTests };
