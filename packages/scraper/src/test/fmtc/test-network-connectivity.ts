/**
 * FMTC 网络连接测试 - 验证网络连接和页面加载
 */

import { chromium } from "playwright";

async function testNetworkConnectivity() {
  console.log("🌐 开始测试 FMTC 网络连接");
  console.log("=".repeat(50));

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  // 设置较长的超时时间
  page.setDefaultTimeout(120000); // 2分钟
  page.setDefaultNavigationTimeout(120000);

  try {
    console.log("🔍 测试基本网络连接...");

    // 1. 测试基本网络连接
    console.log("1️⃣ 测试访问 Google (connectivity check)");
    try {
      await page.goto("https://www.google.com", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log("✅ 基本网络连接正常");
    } catch (error) {
      console.log("❌ 基本网络连接失败:", (error as Error).message);
      throw new Error("网络连接问题，请检查网络设置");
    }

    // 2. 测试 FMTC 主站访问
    console.log("\n2️⃣ 测试 FMTC 主站访问");
    try {
      await page.goto("https://www.fmtc.co", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const title = await page.title();
      console.log(`✅ FMTC 主站访问成功: ${title}`);
    } catch (error) {
      console.log("❌ FMTC 主站访问失败:", (error as Error).message);
    }

    // 3. 测试 FMTC 账户系统访问
    console.log("\n3️⃣ 测试 FMTC 账户系统访问");
    let accountSystemLoaded = false;
    let retryCount = 0;
    const maxRetries = 5;

    while (!accountSystemLoaded && retryCount < maxRetries) {
      try {
        console.log(`第 ${retryCount + 1} 次尝试访问账户系统...`);

        await page.goto("https://account.fmtc.co/cp/login", {
          waitUntil: "domcontentloaded",
          timeout: 120000, // 2分钟超时
        });

        // 等待页面稳定
        console.log("⏳ 等待页面稳定...");
        await page.waitForTimeout(5000);

        // 检查页面内容
        const title = await page.title();
        const url = page.url();

        console.log(`页面标题: ${title}`);
        console.log(`当前URL: ${url}`);

        // 检查是否有登录表单
        const hasLoginForm = await page.$('#username, input[name="username"]');

        if (hasLoginForm) {
          accountSystemLoaded = true;
          console.log("✅ FMTC 账户系统访问成功，找到登录表单");

          // 显示页面基本信息
          const formElements = await page.evaluate(() => {
            const forms = Array.from(document.querySelectorAll("form"));
            return forms.map((form) => ({
              action: form.action,
              method: form.method,
              inputs: Array.from(form.querySelectorAll("input")).map(
                (input) => ({
                  name: input.name,
                  type: input.type,
                  id: input.id,
                }),
              ),
            }));
          });

          console.log(
            "📋 找到的表单信息:",
            JSON.stringify(formElements, null, 2),
          );
        } else {
          throw new Error("未找到登录表单");
        }
      } catch (error) {
        retryCount++;
        console.log(
          `❌ 第 ${retryCount} 次尝试失败:`,
          (error as Error).message,
        );

        if (retryCount < maxRetries) {
          const waitTime = Math.min(retryCount * 10, 30); // 递增等待时间，最多30秒
          console.log(`⏳ 等待 ${waitTime} 秒后重试...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        }
      }
    }

    if (!accountSystemLoaded) {
      console.log("❌ 无法访问 FMTC 账户系统");
      console.log("💡 建议:");
      console.log("  1. 检查网络连接");
      console.log("  2. 检查防火墙设置");
      console.log("  3. 尝试使用VPN");
      console.log("  4. 检查DNS设置");
    }

    // 4. 网络诊断信息
    console.log("\n4️⃣ 网络诊断信息");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`User Agent: ${userAgent}`);

    const connectionInfo = await page.evaluate(() => ({
      onLine: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
    }));
    console.log("连接信息:", connectionInfo);
  } catch (error) {
    console.error("❌ 网络连接测试失败:", error);
  } finally {
    console.log("\n等待10秒后关闭浏览器...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await browser.close();
  }
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  testNetworkConnectivity().catch(console.error);
}

export { testNetworkConnectivity };
