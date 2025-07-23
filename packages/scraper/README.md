# TrendHub Scraper 🕷️

TrendHub 数据抓取包是一个现代化的网页爬虫系统，专为电商数据采集和商户信息管理而设计。该包提供了完整的爬虫功能模块，支持多站点数据抓取、实时监控和智能数据处理。

## 🎯 核心特性

- **多站点支持**: 支持主流电商平台和代理网络的数据抓取
- **双架构设计**: 同时支持单商户和批量商户抓取模式
- **实时监控**: 通过Server-Sent Events提供实时抓取进度反馈
- **智能反检测**: 内置先进的反检测机制和人类行为模拟
- **数据验证**: 多层数据验证和清洗系统
- **会话管理**: 自动会话持久化和状态恢复
- **容错处理**: 完善的错误处理和重试机制

## 🌐 支持的网站

### 电商平台

1. **Mytheresa** - 奢侈品电商平台
2. **Cettire** - 时尚精品购物平台
3. **Farfetch** - 全球时尚精品平台
4. **Italist** - 意大利时尚购物平台
5. **Yoox** - 设计师品牌折扣店

### 代理网络平台

6. **FMTC (Commission Junction)** - 全功能商户数据抓取系统
   - ✅ 自动化登录与会话管理
   - ✅ reCAPTCHA 智能处理 (手动/自动模式)
   - ✅ 高级搜索与筛选功能
   - ✅ 批量商户数据处理
   - ✅ 实时进度监控
   - ✅ 数据导出 (JSON/CSV)

## 🚀 快速开始

### 📋 环境要求

- Node.js 18+
- pnpm 10.11+
- Playwright 浏览器 (Chromium/Chrome)
- PostgreSQL 14+ (用于数据存储)

### 📦 安装依赖

在 TrendHub 根目录运行以下命令来安装依赖：

```bash
# 安装所有依赖
pnpm install

# 安装 Playwright 浏览器
pnpm --filter="@repo/scraper" exec playwright install chromium
```

### 🔨 构建项目

```bash
# 构建所有包
pnpm -r build

# 仅构建爬虫包
pnpm --filter="@repo/scraper" build
```

### ⚙️ 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

基本配置示例：

```bash
# 浏览器配置
CHROME_EXECUTABLE_PATH=/path/to/chrome  # 可选，自定义Chrome路径
HEADLESS_MODE=true                      # 无头模式运行

# 数据库配置
DATABASE_URL="postgresql://user:pass@localhost:5432/trendhub"

# 性能配置
MAX_CONCURRENCY=3                       # 最大并发数
REQUEST_DELAY=2000                      # 请求延迟(毫秒)
```

## 📖 使用方法

### 🛒 电商平台爬虫

#### Cettire 商品抓取

```typescript
import { scrapeCettire } from "@repo/scraper";

async function fetchProducts() {
  try {
    // 默认抓取 women 和 men 分类
    const products = await scrapeCettire();
    console.log(`抓取到 ${products.length} 个商品`);

    // 处理抓取到的商品数据
    products.forEach((product) => {
      console.log(`商品: ${product.name}, 价格: ${product.price}`);
    });
  } catch (error) {
    console.error("抓取失败:", error);
  }
}

// 自定义配置抓取
async function fetchCustomProducts() {
  const options = {
    maxProducts: 50, // 每个分类最多抓取50个商品
    maxRequests: 100, // 最大请求数
    maxLoadClicks: 5, // 最多点击"加载更多"5次
    storageDir: "./data", // 数据存储目录
  };

  // 只抓取女装分类
  const products = await scrapeCettire(
    "https://www.cettire.com/collections/women",
    options,
    "execution-001", // 执行ID，用于追踪
  );

  console.log(`成功抓取 ${products.length} 个商品`);
}
```

### 🏢 FMTC 商户数据抓取

#### 基础使用示例

```typescript
import {
  FMTCSingleMerchantScraper,
  FMTCBatchMerchantScraper,
} from "@repo/scraper";

// 单商户模式 - 适用于小规模抓取
async function scrapeSingleMerchant() {
  const scraper = new FMTCSingleMerchantScraper({
    headless: true,
    maxPages: 5,
    requestDelay: 2000,
  });

  try {
    const results = await scraper.scrape({
      searchText: "fashion retailers",
      category: "clothing",
      displayType: "accepting",
    });

    console.log(`找到 ${results.merchants.length} 个商户`);
    results.merchants.forEach((merchant) => {
      console.log(`商户: ${merchant.name}, 佣金: ${merchant.commissionRate}`);
    });
  } catch (error) {
    console.error("抓取失败:", error);
  } finally {
    await scraper.close();
  }
}

// 批量模式 - 适用于大规模抓取
async function scrapeBatchMerchants() {
  const scraper = new FMTCBatchMerchantScraper({
    maxConcurrency: 3,
    batchSize: 50,
    enableProgressReporting: true,
  });

  try {
    // 监听进度更新
    scraper.on("progress", (progress) => {
      console.log(
        `进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`,
      );
    });

    const results = await scraper.scrapeMultiple([
      { searchText: "fashion", category: "clothing" },
      { searchText: "electronics", category: "technology" },
      { searchText: "home", category: "home-garden" },
    ]);

    console.log(`总共抓取 ${results.totalMerchants} 个商户`);
  } catch (error) {
    console.error("批量抓取失败:", error);
  } finally {
    await scraper.close();
  }
}
```

## 🧪 测试和调试

### Cettire 爬虫测试

```bash
# 从项目根目录运行
pnpm --filter="@repo/scraper" test:cettire

# 进入爬虫包目录运行
cd packages/scraper
pnpm test:cettire

# 自定义测试参数
pnpm test:cettire -- --max-products=20 --headless=false
```

测试结果将保存在 `packages/scraper/test-results` 目录下。

### FMTC 爬虫测试

```bash
# 完整功能测试
pnpm test:fmtc

# 仅测试登录功能
pnpm test:fmtc:login

# 仅测试搜索功能
pnpm test:fmtc:search

# 批量抓取测试
pnpm test:fmtc:batch
```

## 🏢 FMTC 爬虫详细指南

FMTC (FindMyCashback.com) 是一个领先的代理网络平台，我们的爬虫系统提供完整的商户数据采集解决方案。

### 🎯 核心功能

- **智能登录系统**: 自动化登录与会话管理
- **reCAPTCHA 处理**: 支持手动和自动验证模式
- **高级搜索**: 多维度商户数据筛选
- **批量处理**: 大规模商户数据抓取
- **实时监控**: Server-Sent Events 进度反馈
- **数据导出**: 支持 JSON/CSV 格式导出
- **反检测机制**: 先进的浏览器指纹伪装

### ⚙️ 环境变量配置

#### 📋 基础配置

```bash
# FMTC 账户配置
FMTC_USERNAME=your-fmtc-username@example.com
FMTC_PASSWORD=your-fmtc-password

# 爬虫行为配置
FMTC_MAX_PAGES=10                    # 最大抓取页数
FMTC_REQUEST_DELAY=2000              # 请求间隔(毫秒)
FMTC_MAX_CONCURRENCY=3               # 最大并发数
FMTC_HEADLESS_MODE=true              # 无头模式
FMTC_DEBUG_MODE=false                # 调试模式
FMTC_ENABLE_IMAGE_DOWNLOAD=false     # 启用图片下载
```

#### 🔐 reCAPTCHA 配置

```bash
# reCAPTCHA 处理模式
FMTC_RECAPTCHA_MODE=manual           # manual | auto | skip
FMTC_RECAPTCHA_MANUAL_TIMEOUT=120000 # 手动验证超时(毫秒)
FMTC_RECAPTCHA_AUTO_TIMEOUT=180000   # 自动验证超时(毫秒)
FMTC_RECAPTCHA_RETRY_ATTEMPTS=3      # 重试次数
FMTC_RECAPTCHA_RETRY_DELAY=5000      # 重试延迟(毫秒)

# 2captcha.com 自动验证配置 (仅在 auto 模式需要)
FMTC_2CAPTCHA_API_KEY=your-2captcha-api-key
FMTC_2CAPTCHA_SOFT_ID=4580
FMTC_2CAPTCHA_SERVER_DOMAIN=2captcha.com
```

#### 🔍 搜索配置

```bash
# 搜索参数
FMTC_SEARCH_TEXT=                    # 搜索关键词
FMTC_SEARCH_NETWORK_ID=              # Network ID
FMTC_SEARCH_OPM_PROVIDER=            # OPM Provider
FMTC_SEARCH_CATEGORY=                # 商户分类
FMTC_SEARCH_COUNTRY=                 # 国家/地区
FMTC_SEARCH_SHIPPING_COUNTRY=        # 配送国家
FMTC_SEARCH_DISPLAY_TYPE=all         # all | accepting | not_accepting

# 行为模拟配置
FMTC_SEARCH_ENABLE_RANDOM_DELAY=true # 启用随机延迟
FMTC_SEARCH_MIN_DELAY=500            # 最小延迟(毫秒)
FMTC_SEARCH_MAX_DELAY=2000           # 最大延迟(毫秒)
FMTC_SEARCH_TYPING_DELAY_MIN=50      # 输入最小延迟
FMTC_SEARCH_TYPING_DELAY_MAX=200     # 输入最大延迟
FMTC_SEARCH_MOUSE_MOVEMENT=true      # 启用鼠标移动模拟
```

### 🧪 功能测试

#### 登录功能测试

```bash
# 独立登录测试 (推荐)
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts

# 调试页面结构
npx tsx packages/scraper/src/sites/fmtc/debug-login-test.ts

# 清理保存的认证状态
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts clear
```

#### 搜索功能测试

```bash
# 完整搜索测试 (登录 + 导航 + 搜索 + 解析)
npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts

# 仅测试搜索功能 (假设已登录)
npx tsx packages/scraper/src/sites/fmtc/complete-search-test.ts search-only

# 完整导航测试 (登录 + 导航到目录页面)
npx tsx packages/scraper/src/sites/fmtc/complete-navigation-test.ts
```

### 🏗️ 架构设计

#### 核心组件

```typescript
// 登录和会话管理
interface LoginHandler {
  login(credentials: Credentials): Promise<LoginResult>;
  restoreSession(): Promise<boolean>;
  saveSession(): Promise<void>;
}

// 搜索和筛选
interface SearchHandler {
  performSearch(params: SearchParams): Promise<SearchResult>;
  getSearchParamsFromConfig(): SearchParams;
}

// 数据解析和导出
interface ResultsParser {
  parseSearchResults(): Promise<ParsedResults>;
  exportToCsv(results: ParsedResults): string;
  exportToJson(results: ParsedResults): string;
}

// 批量处理
interface BatchProcessor {
  processBatch(items: BatchItem[]): Promise<BatchResult>;
  on(event: "progress", callback: ProgressCallback): void;
}
```

#### 单商户爬虫示例

```typescript
import {
  FMTCLoginHandler,
  FMTCSearchHandler,
  FMTCResultsParser,
} from "@repo/scraper";
import { chromium } from "playwright";

async function singleMerchantScraping() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. 登录处理
    const loginHandler = new FMTCLoginHandler(page, console);
    const loginResult = await loginHandler.login({
      username: process.env.FMTC_USERNAME!,
      password: process.env.FMTC_PASSWORD!,
    });

    if (!loginResult.success) {
      throw new Error(`登录失败: ${loginResult.error}`);
    }

    // 2. 搜索处理
    const searchHandler = new FMTCSearchHandler(page, console);
    const searchResult = await searchHandler.performSearch({
      searchText: "fashion retailers",
      category: "clothing",
      displayType: "accepting",
    });

    if (!searchResult.success) {
      throw new Error(`搜索失败: ${searchResult.error}`);
    }

    // 3. 结果解析
    const resultsParser = new FMTCResultsParser(page, console);
    const parsedResults = await resultsParser.parseSearchResults();

    console.log(`成功抓取 ${parsedResults.merchants.length} 个商户`);

    // 4. 数据导出
    const csvData = resultsParser.exportToCsv(parsedResults);
    const jsonData = resultsParser.exportToJson(parsedResults);

    // 保存到文件
    await writeFile("merchants.csv", csvData);
    await writeFile("merchants.json", jsonData);
  } catch (error) {
    console.error("抓取过程出错:", error);
  } finally {
    await browser.close();
  }
}
```

### 📊 数据结构定义

#### 商户信息数据结构

```typescript
interface MerchantInfo {
  id?: string; // 商户唯一ID
  name: string; // 商户名称
  network?: string; // 关联网络
  category?: string; // 商户分类
  country?: string; // 所在国家
  commissionRate?: string; // 佣金率
  cookieDuration?: string; // Cookie有效期
  ecdDuration?: string; // ECD持续时间
  status?: "accepting" | "not_accepting" | "unknown"; // 申请状态
  url?: string; // 商户官网
  description?: string; // 商户描述
  joinUrl?: string; // 申请加入链接
  logoUrl?: string; // 商户Logo
  lastUpdated?: Date; // 最后更新时间
}
```

#### 搜索参数配置

```typescript
interface SearchParams {
  searchText?: string; // 搜索关键词
  networkId?: string; // Network ID
  opmProvider?: string; // OPM Provider
  category?: string; // 商户分类
  country?: string; // 国家筛选
  shippingCountry?: string; // 配送国家
  displayType?: "all" | "accepting" | "not_accepting"; // 显示类型
}
```

#### 抓取结果数据结构

```typescript
interface ScrapingResult {
  success: boolean; // 操作是否成功
  merchants: MerchantInfo[]; // 商户数据数组
  totalResults: number; // 搜索结果总数
  pagesProcessed: number; // 处理的页面数
  searchParams: SearchParams; // 使用的搜索参数
  executionTime: number; // 执行时间(毫秒)
  errors?: string[]; // 错误信息数组
  warnings?: string[]; // 警告信息数组
}
```

### 🚀 高级功能

#### 批量处理示例

```typescript
import { FMTCBatchMerchantScraper } from "@repo/scraper";

async function advancedBatchScraping() {
  const scraper = new FMTCBatchMerchantScraper({
    maxConcurrency: 3, // 最大并发数
    batchSize: 50, // 批次大小
    retryAttempts: 3, // 重试次数
    retryDelay: 5000, // 重试延迟
    enableProgressReporting: true, // 启用进度报告
    enableDataValidation: true, // 启用数据验证
  });

  try {
    // 定义多个搜索任务
    const searchTasks = [
      { searchText: "fashion", category: "clothing" },
      { searchText: "electronics", category: "technology" },
      { searchText: "home decor", category: "home-garden" },
      { searchText: "beauty", category: "health-beauty" },
    ];

    // 设置进度监听器
    scraper.on("progress", (progress) => {
      console.log(`总体进度: ${progress.percentage}%`);
      console.log(`已完成: ${progress.completed}/${progress.total}`);
      console.log(`当前批次: ${progress.currentBatch}`);
    });

    // 设置错误监听器
    scraper.on("error", (error) => {
      console.error(`批量处理错误: ${error.message}`);
    });

    // 执行批量抓取
    const results = await scraper.scrapeMultiple(searchTasks);

    console.log(`批量抓取完成:`);
    console.log(`- 总商户数: ${results.totalMerchants}`);
    console.log(`- 成功任务: ${results.successfulTasks}`);
    console.log(`- 失败任务: ${results.failedTasks}`);
    console.log(`- 总执行时间: ${results.totalExecutionTime}ms`);

    // 导出合并结果
    await scraper.exportResults(results, {
      format: ["json", "csv"],
      outputDir: "./output",
      includeMetadata: true,
    });
  } catch (error) {
    console.error("批量抓取失败:", error);
  } finally {
    await scraper.close();
  }
}
```

#### 实时进度监控

```typescript
import { FMTCProgressMonitor } from "@repo/scraper";

// Server-Sent Events 进度监控
async function setupProgressMonitoring() {
  const monitor = new FMTCProgressMonitor();

  // 启动进度监控服务器
  await monitor.startServer(3001);

  // 在抓取过程中发送进度更新
  monitor.updateProgress({
    taskId: "batch-001",
    currentStep: "搜索商户数据",
    progress: 45,
    totalSteps: 100,
    estimatedTimeRemaining: 120000, // 毫秒
    data: {
      merchantsFound: 125,
      pagesProcessed: 3,
      errorsCount: 2,
    },
  });
}
```

### 📈 性能优化建议

#### 1. 并发控制

```typescript
// 推荐配置
const config = {
  maxConcurrency: 3, // 避免过高并发触发反爬虫
  requestDelay: 2000, // 请求间隔至少2秒
  batchSize: 50, // 每批次处理50个项目
  enableRandomDelay: true, // 启用随机延迟增加真实性
};
```

#### 2. 会话管理优化

```typescript
// 会话复用策略
const sessionConfig = {
  enableSessionReuse: true, // 启用会话复用
  sessionTimeout: 3600000, // 会话超时时间(1小时)
  maxSessionReuse: 100, // 最大会话复用次数
  validateSession: true, // 验证会话有效性
};
```

#### 3. 错误处理和重试

```typescript
// 智能重试配置
const retryConfig = {
  maxRetries: 3, // 最大重试次数
  retryDelay: 5000, // 重试延迟
  exponentialBackoff: true, // 指数退避
  retryOnCaptcha: true, // reCAPTCHA出现时重试
  retryOnNetworkError: true, // 网络错误时重试
};
```

### 🔧 开发和调试

#### 调试模式

```bash
# 启用调试模式
export FMTC_DEBUG_MODE=true
export FMTC_HEADLESS_MODE=false

# 运行调试测试
npx tsx packages/scraper/src/sites/fmtc/debug-comprehensive-test.ts
```

#### 日志配置

```typescript
import { FMTCLogger } from "@repo/scraper";

const logger = new FMTCLogger({
  level: "debug", // 日志级别
  outputFile: "./logs/fmtc.log", // 输出文件
  enableConsole: true, // 控制台输出
  enableFileRotation: true, // 日志轮转
  maxFileSize: "10MB", // 最大文件大小
});
```

### ⚠️ 重要注意事项

1. **合规性**:

   - 遵守网站的robots.txt和使用条款
   - 尊重网站的请求频率限制
   - 不要用于商业目的的大规模抓取

2. **技术限制**:

   - reCAPTCHA自动模式需要2captcha.com API密钥
   - 每次验证费用约$0.001-$0.003
   - 建议使用手动模式进行开发测试

3. **数据质量**:

   - 定期验证抓取数据的准确性
   - 实施数据去重和清洗机制
   - 监控数据结构变化

4. **安全性**:

   - 妥善保管FMTC账户凭据
   - 使用环境变量存储敏感信息
   - 定期更新依赖包版本

5. **性能考虑**:
   - 避免过高的并发设置
   - 合理设置请求延迟
   - 监控内存和CPU使用情况

## 📚 API 参考

### scrapeCettire(startUrls, options, executionId)

抓取 Cettire 网站的商品数据。

**参数**：

- **startUrls** (可选): `string | string[]` - 起始 URL
  - 默认: `["https://www.cettire.com/collections/women", "https://www.cettire.com/collections/men"]`
- **options** (可选): `ScraperOptions` - 爬虫配置选项
  - **maxProducts**: `number` - 每个分类最多抓取的商品数量，默认 50
  - **maxRequests**: `number` - 最大HTTP请求数，默认 90
  - **maxLoadClicks**: `number` - 最多点击"加载更多"次数，默认 10
  - **storageDir**: `string` - 存储目录，用于保存爬虫状态和数据
- **executionId** (可选): `string` - 执行ID，用于日志记录和追踪

**返回**：`Promise<Product[]>` - 抓取到的商品数据数组

### FMTC 核心类

#### FMTCSingleMerchantScraper

```typescript
class FMTCSingleMerchantScraper {
  constructor(config: ScraperConfig);

  async scrape(searchParams: SearchParams): Promise<ScrapingResult>;
  async close(): Promise<void>;
}
```

#### FMTCBatchMerchantScraper

```typescript
class FMTCBatchMerchantScraper extends EventEmitter {
  constructor(config: BatchScraperConfig);

  async scrapeMultiple(tasks: SearchParams[]): Promise<BatchResult>;
  async exportResults(
    results: BatchResult,
    options: ExportOptions,
  ): Promise<void>;
  async close(): Promise<void>;

  // 事件监听
  on(event: "progress", callback: (progress: ProgressInfo) => void): this;
  on(event: "error", callback: (error: Error) => void): this;
}
```

#### FMTCLoginHandler

```typescript
class FMTCLoginHandler {
  constructor(page: Page, logger: Logger);

  async login(credentials: Credentials): Promise<LoginResult>;
  async restoreSession(): Promise<boolean>;
  async saveSession(): Promise<void>;
  async clearSession(): Promise<void>;
}
```

#### FMTCSearchHandler

```typescript
class FMTCSearchHandler {
  constructor(page: Page, logger: Logger);

  async performSearch(params: SearchParams): Promise<SearchResult>;
  getSearchParamsFromConfig(): SearchParams;
  async navigateToDirectory(): Promise<boolean>;
}
```

#### FMTCResultsParser

```typescript
class FMTCResultsParser {
  constructor(page: Page, logger: Logger);

  async parseSearchResults(): Promise<ParsedResults>;
  exportToCsv(results: ParsedResults): string;
  exportToJson(results: ParsedResults): string;
  async saveResults(results: ParsedResults, filename: string): Promise<void>;
}
```

## 🛠️ 开发指南

### 添加新网站支持

1. **创建站点文件**

   ```bash
   mkdir -p src/sites/newsite
   touch src/sites/newsite/scraper.ts
   touch src/sites/newsite/types.ts
   ```

2. **实现爬虫接口**

   ```typescript
   // src/sites/newsite/scraper.ts
   import { BaseScraper } from "../base/scraper";
   import { ScraperConfig, ScrapingResult } from "../types";

   export class NewSiteScraper extends BaseScraper {
     async scrape(config: ScraperConfig): Promise<ScrapingResult> {
       // 实现具体的抓取逻辑
     }
   }
   ```

3. **定义类型**

   ```typescript
   // src/sites/newsite/types.ts
   export interface NewSiteConfig extends ScraperConfig {
     // 站点特定配置
   }

   export interface NewSiteProduct {
     // 产品数据结构
   }
   ```

4. **导出模块**

   ```typescript
   // src/main.ts
   export { NewSiteScraper } from "./sites/newsite/scraper";
   ```

5. **创建测试脚本**

   ```typescript
   // src/sites/newsite/test.ts
   import { NewSiteScraper } from "./scraper";

   async function test() {
     const scraper = new NewSiteScraper(config);
     const results = await scraper.scrape(params);
     console.log(results);
   }
   ```

### 最佳实践

#### 1. 错误处理

```typescript
try {
  const results = await scraper.scrape(params);
} catch (error) {
  if (error instanceof NetworkError) {
    // 网络错误处理
    await handleNetworkError(error);
  } else if (error instanceof ValidationError) {
    // 数据验证错误
    await handleValidationError(error);
  } else {
    // 其他错误
    logger.error("Unexpected error:", error);
  }
}
```

#### 2. 性能监控

```typescript
import { PerformanceMonitor } from "./utils/performance";

const monitor = new PerformanceMonitor();
monitor.start("scraping-task");

// 执行抓取任务
const results = await scraper.scrape(params);

const metrics = monitor.end("scraping-task");
console.log(`执行时间: ${metrics.duration}ms`);
console.log(`内存使用: ${metrics.memory}MB`);
```

#### 3. 数据验证

```typescript
import { validateMerchantData } from "./utils/validation";

const results = await scraper.scrape(params);
const validatedData = results.merchants.filter((merchant) =>
  validateMerchantData(merchant),
);
```

## 🚨 故障排除

### 常见问题

#### 1. 登录失败

```bash
# 检查环境变量
echo "FMTC账户: $FMTC_USERNAME"
echo "密码设置: ${FMTC_PASSWORD:+已设置}"

# 清理会话状态
rm -f fmtc-auth-state.json

# 手动验证登录
npx tsx packages/scraper/src/sites/fmtc/standalone-login-test.ts
```

#### 2. reCAPTCHA 问题

```bash
# 检查reCAPTCHA配置
echo "reCAPTCHA模式: $FMTC_RECAPTCHA_MODE"
echo "2captcha密钥: ${FMTC_2CAPTCHA_API_KEY:+已设置}"

# 切换到手动模式测试
export FMTC_RECAPTCHA_MODE=manual
```

#### 3. 浏览器启动失败

```bash
# 安装/更新Chromium
pnpm --filter="@repo/scraper" exec playwright install chromium

# 检查Chrome路径
which google-chrome-stable
```

#### 4. 内存使用过高

```bash
# 降低并发数
export FMTC_MAX_CONCURRENCY=1

# 启用垃圾回收
node --max-old-space-size=4096 --expose-gc script.js
```

### 调试技巧

1. **启用详细日志**

   ```bash
   export DEBUG=scraper:*
   export FMTC_DEBUG_MODE=true
   ```

2. **保存页面截图**

   ```typescript
   await page.screenshot({ path: "debug-screenshot.png" });
   ```

3. **检查元素选择器**
   ```typescript
   const element = await page.locator("selector").first();
   const isVisible = await element.isVisible();
   console.log(`元素可见: ${isVisible}`);
   ```

## 📊 性能基准

### 典型性能指标

| 操作类型        | 平均时间  | 内存使用  | 成功率 |
| --------------- | --------- | --------- | ------ |
| FMTC登录        | 15-30秒   | 50-80MB   | 98%    |
| 单页搜索        | 5-10秒    | 30-50MB   | 95%    |
| 批量抓取(100项) | 10-20分钟 | 200-400MB | 92%    |
| 数据导出        | 1-3秒     | 10-20MB   | 99%    |

### 优化建议

- **并发控制**: 保持并发数在3以下
- **请求延迟**: 设置2-5秒的请求间隔
- **内存管理**: 定期清理不需要的页面对象
- **会话复用**: 启用会话持久化减少登录次数

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/new-scraper`)
3. 提交更改 (`git commit -m 'Add new scraper for XYZ'`)
4. 推送到分支 (`git push origin feature/new-scraper`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 编写单元测试覆盖核心功能
- 更新相关文档

## 📄 许可证

本项目是 TrendHub 生态系统的一部分，遵循 MIT 许可证。

---

🔗 **相关文档**:

- [FMTC开发指南](../../docs/fmtc-development-guide.md)
- [FMTC架构深度分析](../../docs/fmtc-architecture-deep-dive.md)
- [FMTC API参考](../../docs/fmtc-api-reference.md)
- [主项目README](../../README.md)
