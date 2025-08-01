import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

async function analyzeMytheresaProtection() {
  console.log("🔍 分析Mytheresa防护机制...");

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 监听网络请求
    const requests: string[] = [];
    const responses: Array<{
      url: string;
      status: number;
      headers: Record<string, string>;
    }> = [];

    page.on("request", (request) => {
      if (request.url().includes("mytheresa.com")) {
        requests.push(`${request.method()} ${request.url()}`);
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("mytheresa.com")) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
        });
      }
    });

    console.log("🌐 访问Mytheresa主页...");
    await page.goto("https://www.mytheresa.com/us/en/women", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 检查页面内容
    const pageContent = await page.content();
    const title = await page.title();
    const url = page.url();

    console.log(`\n📄 页面信息:`);
    console.log(`标题: ${title}`);
    console.log(`URL: ${url}`);
    console.log(`页面大小: ${pageContent.length} 字符`);

    // 检查我们的反爬虫检测指标
    const antiDetectionIndicators = [
      "Access to this page has been denied",
      "blocked",
      "captcha",
      "Just a moment",
      "Checking your browser",
      "Please wait while we check your browser",
      "DDoS protection by Cloudflare",
      "Ray ID:",
      "cf-ray",
      "SOMETHING WENT WRONG",
    ];

    console.log(`\n🛡️ 反爬虫检测结果:`);
    let hasAntiBot = false;
    for (const indicator of antiDetectionIndicators) {
      const found = pageContent.toLowerCase().includes(indicator.toLowerCase());
      if (found) {
        console.log(`❌ 检测到: "${indicator}"`);
        hasAntiBot = true;
      } else {
        console.log(`✅ 未检测到: "${indicator}"`);
      }
    }

    if (!hasAntiBot) {
      console.log("🎉 没有检测到传统的反爬虫保护");
    }

    // 检查页面是否正常加载
    console.log(`\n🔍 页面加载分析:`);

    // 检查是否有产品内容
    const productElements = await page
      .locator('div.item, [data-testid="product-card"], div[class*="product"]')
      .count();
    console.log(`产品元素数量: ${productElements}`);

    // 检查导航元素
    const navElements = await page.locator("nav, .nav, .navigation").count();
    console.log(`导航元素数量: ${navElements}`);

    // 检查脚本和样式
    const scripts = await page.locator("script").count();
    const styles = await page.locator('link[rel="stylesheet"], style').count();
    console.log(`脚本数量: ${scripts}`);
    console.log(`样式数量: ${styles}`);

    // 检查特殊的防护机制
    console.log(`\n🔒 特殊防护机制检查:`);

    // 检查JS挑战
    const jsChallenge =
      pageContent.includes("challenge") || pageContent.includes("verification");
    console.log(`JS挑战: ${jsChallenge ? "检测到" : "未检测到"}`);

    // 检查重定向
    const redirects = responses.filter(
      (r) => r.status >= 300 && r.status < 400,
    );
    console.log(`重定向数量: ${redirects.length}`);

    // 检查错误页面
    const errorStatuses = responses.filter((r) => r.status >= 400);
    console.log(`错误响应数量: ${errorStatuses.length}`);

    if (errorStatuses.length > 0) {
      console.log("错误响应详情:");
      errorStatuses.forEach((r) => {
        console.log(`  ${r.status} - ${r.url}`);
      });
    }

    // 检查网络连接问题
    console.log(`\n🌐 网络连接分析:`);
    console.log(`总请求数量: ${requests.length}`);
    console.log(`总响应数量: ${responses.length}`);

    // 检查是否有CORS问题
    const corsHeaders = responses.filter(
      (r) =>
        r.headers["access-control-allow-origin"] ||
        r.headers["access-control-allow-credentials"],
    );
    console.log(`CORS相关响应: ${corsHeaders.length}`);

    // 保存页面截图和内容用于分析
    await page.screenshot({ path: "mytheresa-analysis.png", fullPage: true });

    // 保存页面源码用于详细分析
    const fs = await import("fs");
    fs.writeFileSync("mytheresa-content-analysis.html", pageContent);

    console.log(`\n💾 分析结果已保存:`);
    console.log(`- 截图: mytheresa-analysis.png`);
    console.log(`- 页面源码: mytheresa-content-analysis.html`);

    // 尝试具体的导航操作
    console.log(`\n🖱️ 测试导航操作:`);
    try {
      const womenMenu = page.locator('nav a[href*="/women"]:has-text("Women")');
      const isVisible = await womenMenu.isVisible({ timeout: 5000 });
      console.log(`Women菜单可见: ${isVisible}`);

      if (isVisible) {
        await womenMenu.hover();
        console.log("✅ 成功悬停在Women菜单");
        await page.waitForTimeout(2000);

        const newArrivalsLink = page.locator(
          'a[href*="/women/new-arrivals"]:has-text("New Arrivals")',
        );
        const newArrivalsVisible = await newArrivalsLink.isVisible({
          timeout: 3000,
        });
        console.log(`New Arrivals链接可见: ${newArrivalsVisible}`);
      }
    } catch (navError) {
      console.log(`❌ 导航测试失败: ${(navError as Error).message}`);
    }

    console.log(`\n⏸️ 保持浏览器打开30秒以便手动检查...`);
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("❌ 分析过程出错:", error);
  } finally {
    await browser.close();
  }
}

analyzeMytheresaProtection().catch(console.error);
