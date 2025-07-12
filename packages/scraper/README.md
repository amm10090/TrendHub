# TrendHub Scraper

TrendHub 爬虫包包含了从各个电商网站抓取产品数据的功能模块。

## 支持的网站

目前支持的电商网站包括：

1. Mytheresa
2. Cettire (新增)
3. Farfetch
4. Italist
5. Yoox
6. FMTC (Commission Junction 代理平台) - 支持商户数据抓取和自动化登录

## 安装

在 TrendHub 根目录运行以下命令来安装依赖：

```bash
pnpm install
```

## 构建

```bash
pnpm -r build
# 或者专门构建爬虫包
pnpm --filter="@repo/scraper" build
```

## 使用方法

### 在代码中使用

```typescript
import { scrapeCettire } from "@repo/scraper";

async function fetchProducts() {
  try {
    // 默认抓取 women 和 men 分类
    const products = await scrapeCettire();
    console.log(`抓取到 ${products.length} 个商品`);

    // 处理抓取到的商品数据...
  } catch (error) {
    console.error("抓取失败:", error);
  }
}

// 使用自定义选项和特定的起始 URL
async function fetchCustomProducts() {
  try {
    const options = {
      maxProducts: 50, // 每个性别分类最多抓取 50 个商品
      maxRequests: 100, // 最大请求数
      maxLoadClicks: 5, // 最多点击 "加载更多" 按钮 5 次
    };

    // 只抓取女装
    const products = await scrapeCettire(
      "https://www.cettire.com/collections/women",
      options,
    );
    console.log(`抓取到 ${products.length} 个商品`);
  } catch (error) {
    console.error("抓取失败:", error);
  }
}
```

### 测试爬虫

你可以使用测试脚本来测试 Cettire 爬虫：

```bash
# 从项目根目录运行
pnpm --filter="@repo/scraper" test:cettire

# 或者进入爬虫包目录后运行
cd packages/scraper
pnpm test:cettire
```

测试结果将保存在 `packages/scraper/test-results` 目录下。

## FMTC 爬虫

FMTC (Commission Junction) 是一个代理平台，提供商户数据抓取功能。该爬虫支持自动化登录、reCAPTCHA 处理和会话持久化。

### 环境变量配置

在使用 FMTC 爬虫之前，需要在 `.env` 文件中配置以下环境变量：

```bash
# FMTC 基本配置
FMTC_USERNAME=your-fmtc-username@example.com
FMTC_PASSWORD=your-fmtc-password
FMTC_MAX_PAGES=10
FMTC_REQUEST_DELAY=2000
FMTC_ENABLE_IMAGE_DOWNLOAD=false
FMTC_HEADLESS_MODE=true
FMTC_DEBUG_MODE=false
FMTC_MAX_CONCURRENCY=1

# reCAPTCHA 配置
FMTC_RECAPTCHA_MODE=manual           # manual | auto | skip
FMTC_RECAPTCHA_MANUAL_TIMEOUT=120000 # 手动验证超时时间(毫秒)
FMTC_RECAPTCHA_AUTO_TIMEOUT=180000   # 自动验证超时时间(毫秒)
FMTC_RECAPTCHA_RETRY_ATTEMPTS=3      # 重试次数
FMTC_RECAPTCHA_RETRY_DELAY=5000      # 重试延迟(毫秒)

# 2captcha.com 配置 (仅在 FMTC_RECAPTCHA_MODE=auto 时需要)
FMTC_2CAPTCHA_API_KEY=your-2captcha-api-key
FMTC_2CAPTCHA_SOFT_ID=4580
FMTC_2CAPTCHA_SERVER_DOMAIN=2captcha.com
```

### 测试登录功能

使用以下命令测试 FMTC 登录功能：

```bash
# 独立登录测试（推荐）
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts

# 调试页面结构
npx tsx packages/scraper/src/sites/fmtc/debug-login-test.ts

# 清理保存的认证状态
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts clear
```

### 使用代码示例

```typescript
import { FMTCLoginHandler } from "@repo/scraper";
import { chromium } from "playwright";

async function testFMTCLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const loginHandler = new FMTCLoginHandler(page, console);

  const result = await loginHandler.login({
    username: process.env.FMTC_USERNAME!,
    password: process.env.FMTC_PASSWORD!,
  });

  if (result.success) {
    console.log("登录成功！");
    // 继续爬取商户数据...
  } else {
    console.error("登录失败:", result.error);
  }

  await browser.close();
}
```

### 功能特性

- **自动化登录**: 支持用户名密码自动填写
- **reCAPTCHA 处理**: 支持手动和自动（2captcha.com）两种模式
- **反检测机制**: 内置浏览器指纹伪装和自动化检测规避
- **会话持久化**: 自动保存和恢复登录状态，避免重复登录
- **错误恢复**: 智能重试机制和详细错误日志

### 搜索功能

FMTC 爬虫现在支持完整的搜索功能，可以根据多种条件搜索和筛选商户数据。

#### 搜索环境变量配置

在 `.env` 文件中添加以下搜索配置：

```bash
# FMTC 搜索配置
FMTC_SEARCH_TEXT=                      # 搜索关键词（商户名称、FMTC ID等）
FMTC_SEARCH_NETWORK_ID=                # Network ID
FMTC_SEARCH_OPM_PROVIDER=              # OPM Provider
FMTC_SEARCH_CATEGORY=                  # 分类
FMTC_SEARCH_COUNTRY=                   # 国家
FMTC_SEARCH_SHIPPING_COUNTRY=          # 配送国家
FMTC_SEARCH_DISPLAY_TYPE=all           # 显示类型: all | accepting | not_accepting

# FMTC 搜索行为配置
FMTC_SEARCH_ENABLE_RANDOM_DELAY=true   # 启用随机延迟
FMTC_SEARCH_MIN_DELAY=500              # 最小延迟(毫秒)
FMTC_SEARCH_MAX_DELAY=2000             # 最大延迟(毫秒)
FMTC_SEARCH_TYPING_DELAY_MIN=50        # 输入最小延迟(毫秒)
FMTC_SEARCH_TYPING_DELAY_MAX=200       # 输入最大延迟(毫秒)
FMTC_SEARCH_MOUSE_MOVEMENT=true        # 启用鼠标移动模拟
```

#### 测试搜索功能

使用以下命令测试完整的搜索流程：

```bash
# 完整搜索测试（登录 + 导航 + 搜索 + 结果解析）
npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts

# 仅测试搜索功能（假设已登录）
npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts search-only

# 清理认证状态
npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts clear

# 完整导航测试（登录 + 导航到目录页面）
npx tsx packages/scraper/src/sites/fmtc/complete-navigation-test.ts
```

#### 搜索代码示例

```typescript
import { FMTCSearchHandler, FMTCResultsParser } from "@repo/scraper";
import { chromium } from "playwright";

async function searchFMTCMerchants() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const searchHandler = new FMTCSearchHandler(page, console);
  const resultsParser = new FMTCResultsParser(page, console);

  // 使用环境变量中的搜索参数
  const searchParams = searchHandler.getSearchParamsFromConfig();

  // 或者手动指定搜索参数
  const customParams = {
    searchText: "fashion",
    category: "clothing",
    displayType: "accepting" as const,
  };

  const searchResult = await searchHandler.performSearch(customParams);

  if (searchResult.success) {
    console.log(`搜索成功，找到 ${searchResult.resultsCount} 个结果`);

    // 解析搜索结果
    const parsedResults = await resultsParser.parseSearchResults();
    console.log(`解析到 ${parsedResults.merchants.length} 个商户信息`);

    // 导出为CSV
    const csvData = resultsParser.exportToCsv(parsedResults);
    console.log("CSV数据:", csvData);
  } else {
    console.error("搜索失败:", searchResult.error);
  }

  await browser.close();
}
```

#### 搜索结果数据结构

解析的商户数据包含以下字段：

```typescript
interface MerchantInfo {
  id?: string; // 商户ID
  name: string; // 商户名称
  network?: string; // Network
  category?: string; // 分类
  country?: string; // 国家
  commissionRate?: string; // 佣金率
  cookieDuration?: string; // Cookie持续时间
  ecdDuration?: string; // ECD持续时间
  status?: "accepting" | "not_accepting" | "unknown"; // 状态
  url?: string; // 商户链接
  description?: string; // 描述
  joinUrl?: string; // 加入链接
}
```

#### 输出文件

搜索完成后，结果将自动保存为：

- `fmtc-search-results-[时间戳].json` - 完整搜索结果（包括搜索参数和配置）
- `fmtc-search-results-[时间戳].csv` - 商户数据CSV格式

### 注意事项

1. **反检测**: 使用了先进的反检测技术，包括浏览器指纹伪装
2. **reCAPTCHA**: 自动模式需要 2captcha.com API 密钥，每次验证约花费 $0.001
3. **会话保存**: 登录状态会自动保存到 `fmtc-auth-state.json` 文件
4. **速率限制**: 请合理设置请求延迟，避免触发网站防护机制
5. **人类行为模拟**: 搜索过程包含鼠标移动、输入延迟、滚动等人类行为模拟
6. **分页支持**: 自动检测和处理分页结果

## 参数说明

### scrapeCettire(startUrls, options, executionId)

抓取 Cettire 网站的商品数据。

**参数**：

- **startUrls** (可选): `string | string[]` - 起始 URL。默认为 `["https://www.cettire.com/collections/women", "https://www.cettire.com/collections/men"]`。
- **options** (可选): `ScraperOptions` - 爬虫配置选项。
  - **maxProducts**: 每个分类最多抓取的商品数量，默认为 50。
  - **maxRequests**: 最大 HTTP 请求数，默认为 90。
  - **maxLoadClicks**: 最多点击 "加载更多" 按钮的次数，默认为 10。
  - **storageDir**: 存储目录，用于保存爬虫运行状态和数据。
- **executionId** (可选): `string` - 执行 ID，用于日志记录和追踪。

**返回**：`Promise<Product[]>` - 抓取到的商品数据数组。

## 注意事项

1. 爬虫需要安装 Playwright 和 Chromium 浏览器。默认情况下，Playwright 会自动安装所需的浏览器。

2. 如果需要指定自定义的 Chrome 可执行文件路径，请设置环境变量 `CHROME_EXECUTABLE_PATH`。

3. 爬虫可能受到目标网站反爬虫措施的影响。如遇到问题，可尝试调整爬取速度和使用代理。

## 开发

添加对新网站的支持：

1. 在 `src/sites/` 目录下创建新文件，例如 `newsite.ts`
2. 按照现有站点爬虫的模式实现抓取逻辑
3. 在 `src/main.ts` 中导出新的爬虫函数
4. 创建测试脚本进行测试

## 许可证

TrendHub 项目的一部分。
