/**
 * FMTC 分类选项调试脚本 - 获取所有可用的分类选项值
 */

import { chromium, Page } from "playwright";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getEnvironmentConfig } from "../../sites/fmtc/config.js";

// 手动加载环境变量
try {
  const envPath = join(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf8");
  const envLines = envFile.split("\\n");

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=");
        process.env[key] = value;
      }
    }
  }
} catch (error) {
  console.warn("无法加载 .env 文件:", error);
}

/**
 * 获取反检测浏览器配置
 */
function getStealthBrowserConfig(headless: boolean = false) {
  return {
    headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  };
}

/**
 * 设置页面反检测脚本
 */
async function setupAntiDetection(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });
}

/**
 * 加载认证状态
 */
async function loadAuthState(filePath: string): Promise<unknown> {
  try {
    if (existsSync(filePath)) {
      const state = JSON.parse(readFileSync(filePath, "utf8"));
      console.log(`📂 从 ${filePath} 加载认证状态`);
      return state;
    }
  } catch (error) {
    console.error("加载认证状态失败:", error);
  }
  return null;
}

/**
 * 调试分类选项
 */
async function debugCategoryOptions(): Promise<void> {
  console.log("🔍 开始调试FMTC分类选项...");

  const config = getEnvironmentConfig();
  const authStateFile = join(process.cwd(), "fmtc-auth-state.json");

  // 检查认证状态
  const savedAuthState = await loadAuthState(authStateFile);
  if (!savedAuthState) {
    console.error("❌ 未找到保存的认证状态，请先运行完整登录测试");
    console.log(
      "运行: npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts",
    );
    return;
  }

  const browserConfig = getStealthBrowserConfig(config.headlessMode);
  const browser = await chromium.launch(browserConfig);

  try {
    const context = await browser.newContext({
      storageState: savedAuthState,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    await setupAntiDetection(page);

    console.log("🧭 导航到Program Directory页面...");
    await page.goto("https://account.fmtc.co/cp/program_directory", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log("🔍 分析分类选择器...");

    // 等待页面加载完成
    await page.waitForTimeout(3000);

    const categoryOptions = await page.evaluate(() => {
      const results: unknown = {};

      // 查找原始的select元素
      const selects = Array.from(document.querySelectorAll("select"));
      const categorySelect = selects.find(
        (select) =>
          select.name?.includes("cat") ||
          select.id?.includes("cat") ||
          select.name?.includes("vertical") ||
          select.id?.includes("vertical"),
      );

      if (categorySelect) {
        results.originalSelect = {
          name: categorySelect.name,
          id: categorySelect.id,
          options: Array.from(categorySelect.options).map((option) => ({
            value: option.value,
            text: option.text.trim(),
            selected: option.selected,
          })),
        };
      }

      // 查找Chosen容器
      const chosenContainer = document.querySelector(
        "#cat_chosen, .chosen-container",
      );
      if (chosenContainer) {
        results.chosenContainer = {
          id: chosenContainer.id,
          currentText: chosenContainer
            .querySelector(".chosen-single span")
            ?.textContent?.trim(),
        };

        // 尝试点击打开下拉列表
        const chosenSingle = chosenContainer.querySelector(".chosen-single");
        if (chosenSingle) {
          (chosenSingle as HTMLElement).click();
        }
      }

      return results;
    });

    console.log("📋 分类选择器信息:", JSON.stringify(categoryOptions, null, 2));

    // 等待下拉列表打开
    await page.waitForTimeout(1000);

    // 获取下拉选项
    const dropdownOptions = await page.evaluate(() => {
      const chosenResults = document.querySelector(".chosen-results");
      if (chosenResults) {
        const options = Array.from(
          chosenResults.querySelectorAll("li.active-result"),
        );
        return options.map((option, index) => ({
          index: index,
          dataIndex: option.getAttribute("data-option-array-index"),
          text: option.textContent?.trim(),
          innerHTML: option.innerHTML,
        }));
      }
      return [];
    });

    console.log("\\n🎯 所有可用的分类选项:");
    console.log("=".repeat(60));
    dropdownOptions.forEach((option, i) => {
      console.log(`${i + 1}. 文本: "${option.text}"`);
      console.log(`   数据索引: ${option.dataIndex}`);
      console.log(
        `   建议环境变量值: FMTC_SEARCH_CATEGORY=${option.dataIndex || i}`,
      );
      if (option.text?.toLowerCase().includes("clothing")) {
        console.log(`   🎯 这个可能是你要的选项！`);
      }
      console.log("");
    });

    // 查找原始select的所有选项
    const allSelectOptions = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      const categorySelect = selects.find(
        (select) =>
          select.name?.includes("cat") ||
          select.id?.includes("cat") ||
          select.name?.includes("vertical"),
      );

      if (categorySelect && categorySelect.options) {
        return Array.from(categorySelect.options)
          .map((option) => ({
            value: option.value,
            text: option.text.trim(),
            selected: option.selected,
          }))
          .filter((option) => option.text.length > 0);
      }
      return [];
    });

    if (allSelectOptions.length > 0) {
      console.log("\\n📝 原始select选项 (推荐使用这些值):");
      console.log("=".repeat(60));
      allSelectOptions.forEach((option, i) => {
        console.log(`${i + 1}. 值: "${option.value}"`);
        console.log(`   文本: "${option.text}"`);
        console.log(`   环境变量: FMTC_SEARCH_CATEGORY=${option.value}`);
        if (option.text.toLowerCase().includes("clothing")) {
          console.log(`   🎯 这个可能是你要的选项！`);
        }
        console.log("");
      });
    }

    console.log("\\n💡 使用建议:");
    console.log("1. 优先使用原始select的value值");
    console.log("2. 如果不行，尝试使用data-option-array-index");
    console.log("3. 最后尝试使用选项文本的小写形式");

    console.log("\\n5秒后关闭浏览器...");
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error("❌ 调试过程出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行调试
debugCategoryOptions();
