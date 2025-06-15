import { chromium, type Browser, type Page } from "playwright";

async function testMytheresaPageStructure() {
  const browser: Browser = await chromium.launch({
    headless: false, // 设置为 false 以便可以看到浏览器
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH ||
      "/Users/amm10090/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
  });

  try {
    const page: Page = await browser.newPage();

    // 设置 User-Agent 来模拟真实浏览器
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    console.log("📦 正在访问 Mytheresa 页面...");
    const testUrl = "https://www.mytheresa.com/us/en/women/clothing";

    await page.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    console.log("📄 页面标题:", await page.title());

    // 检查旧的选择器
    const oldSelector = "div.item";
    const oldItems = await page.locator(oldSelector).count();
    console.log(`🔍 旧选择器 "${oldSelector}" 找到了 ${oldItems} 个元素`);

    // 尝试一些可能的新选择器
    const possibleSelectors = [
      "div.item",
      '[data-testid="product-card"]',
      '[data-testid="product-item"]',
      'div[class*="product"]',
      'div[class*="item"]',
      "article",
      ".product-card",
      ".product-item",
      ".product-tile",
      'div[data-cy*="product"]',
      'div[itemscope][itemtype*="Product"]',
      'a[href*="/product"]',
      'a[href*="/p"]',
    ];

    console.log("\n🔍 测试可能的产品选择器:");
    for (const selector of possibleSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ "${selector}": ${count} 个元素`);

          // 如果找到元素，获取第一个元素的详细信息
          if (count > 0) {
            const firstElement = page.locator(selector).first();
            const innerHTML = await firstElement.innerHTML().catch(() => "N/A");

            console.log(
              `   第一个元素的类名: ${await firstElement.getAttribute("class").catch(() => "N/A")}`,
            );
            console.log(
              `   第一个元素的HTML片段 (前100字符): ${innerHTML.substring(0, 100)}...`,
            );
          }
        } else {
          console.log(`❌ "${selector}": 0 个元素`);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(`❌ "${selector}": 错误 - ${errorMessage}`);
      }
    }

    // 检查页面是否有反爬虫检测
    console.log("\n🛡️ 检查反爬虫机制:");
    const bodyText = await page.textContent("body");
    const suspiciousTexts = [
      "Access denied",
      "Cloudflare",
      "Ray ID",
      "Security check",
      "Please wait",
      "Checking your browser",
      "robot",
    ];

    for (const text of suspiciousTexts) {
      if (bodyText?.toLowerCase().includes(text.toLowerCase())) {
        console.log(`⚠️ 检测到可能的反爬虫: "${text}"`);
      }
    }

    // 尝试获取页面的主要容器
    console.log("\n📦 检查页面主要容器:");
    const containers = [
      "main",
      '[role="main"]',
      ".main-content",
      "#main-content",
      ".product-list",
      ".products",
      ".items",
      ".grid",
    ];

    for (const container of containers) {
      const exists = await page.locator(container).count();
      if (exists > 0) {
        console.log(`✅ 找到容器: "${container}"`);
      }
    }

    // 保存页面截图以便调试
    await page.screenshot({ path: "mytheresa-debug.png", fullPage: true });
    console.log("\n📸 页面截图已保存为 mytheresa-debug.png");

    // 等待一段时间以便手动检查页面
    console.log("\n⏸️ 浏览器将保持打开30秒以便手动检查...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("❌ 测试过程中出错:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
testMytheresaPageStructure().catch(console.error);
