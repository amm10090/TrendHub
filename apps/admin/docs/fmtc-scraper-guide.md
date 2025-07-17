# FMTC 商户信息爬虫完整实现指南

## 📋 目录

1. [概述](#概述)
2. [系统架构](#系统架构)
3. [数据库设计](#数据库设计)
4. [后端API实现](#后端api实现)
5. [爬虫核心实现](#爬虫核心实现)
6. [配置管理](#配置管理)
7. [部署和使用](#部署和使用)
8. [故障排除](#故障排除)
9. [最佳实践](#最佳实践)

## 概述

FMTC（FindMyCashback.com）商户信息爬虫是一个全栈解决方案，用于自动化抓取和管理FMTC平台的商户数据。系统包括：

- **前端管理界面**：基于Next.js的仪表盘
- **后端API**：RESTful API用于任务管理和数据处理
- **爬虫引擎**：基于Playwright和Crawlee的智能爬虫
- **实时通信**：WebSocket支持的实时状态更新
- **数据存储**：PostgreSQL数据库存储任务和结果

### 核心功能

- ✅ **自动登录**：支持reCAPTCHA自动识别
- ✅ **会话管理**：智能会话保存和恢复
- ✅ **分页抓取**：支持大量数据的分页处理
- ✅ **详情抓取**：深度抓取商户详细信息
- ✅ **实时监控**：WebSocket实时状态推送
- ✅ **错误处理**：完善的错误恢复机制
- ✅ **品牌匹配**：自动匹配系统内品牌

## 系统架构

```mermaid
graph TB
    A[前端仪表盘] --> B[后端API]
    B --> C[爬虫服务]
    B --> D[数据库]
    B --> E[WebSocket服务]
    C --> F[FMTC网站]
    C --> G[2captcha服务]

    subgraph "爬虫组件"
        C --> H[登录处理器]
        C --> I[搜索处理器]
        C --> J[结果解析器]
        C --> K[详情处理器]
        C --> L[会话管理器]
    end

    subgraph "数据流"
        F --> M[原始数据]
        M --> N[数据清洗]
        N --> O[品牌匹配]
        O --> D
    end
```

## 数据库设计

### 核心表结构

#### FMTCScraperTask (任务定义表)

```sql
CREATE TABLE "FMTCScraperTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credentials" JSONB NOT NULL,  -- 登录凭据
    "config" JSONB DEFAULT '{}',   -- 抓取配置
    "isEnabled" BOOLEAN DEFAULT true,
    "cronExpression" TEXT,         -- 定时任务表达式
    "lastExecutedAt" TIMESTAMP(3),
    "nextExecuteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FMTCScraperTask_pkey" PRIMARY KEY ("id")
);
```

#### FMTCScraperExecution (执行记录表)

```sql
CREATE TABLE "FMTCScraperExecution" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "ScraperTaskStatus" DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "merchantsCount" INTEGER DEFAULT 0,
    "newMerchantsCount" INTEGER DEFAULT 0,
    "updatedMerchantsCount" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "metrics" JSONB,              -- 执行指标
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FMTCScraperExecution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FMTCScraperExecution_taskId_fkey"
        FOREIGN KEY ("taskId") REFERENCES "FMTCScraperTask"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
```

#### FMTCMerchant (商户信息表)

```sql
CREATE TABLE "FMTCMerchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fmtcId" TEXT,                -- FMTC内部ID
    "country" TEXT,
    "network" TEXT,
    "homepage" TEXT,
    "description" TEXT,
    "primaryCategory" TEXT,
    "primaryCountry" TEXT,
    "logo120x60" TEXT,            -- Logo URL
    "logo88x31" TEXT,
    "screenshot280x210" TEXT,     -- 截图URL
    "screenshot600x450" TEXT,
    "networks" JSONB,             -- 网络联盟信息
    "affiliateLinks" JSONB,       -- 联盟链接
    "freshReachSupported" BOOLEAN DEFAULT false,
    "freshReachUrls" JSONB,
    "sourceUrl" TEXT,             -- 源页面URL
    "lastScrapedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT,               -- 关联的品牌ID
    "isActive" BOOLEAN DEFAULT true,
    "rawData" JSONB,              -- 原始抓取数据
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FMTCMerchant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FMTCMerchant_brandId_fkey"
        FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);
```

## 后端API实现

### 1. 任务管理API

#### 获取任务列表

```typescript
// GET /api/fmtc-merchants/scraper
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const [tasks, totalCount] = await Promise.all([
    db.fMTCScraperTask.findMany({
      orderBy: { lastExecutedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    db.fMTCScraperTask.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: { tasks, pagination: { page, limit, totalCount } },
  });
}
```

#### 创建抓取任务

```typescript
// POST /api/fmtc-merchants/scraper
export async function POST(request: NextRequest) {
  const { action, taskData } = await request.json();

  if (action === "create_task") {
    const newTask = await db.fMTCScraperTask.create({
      data: {
        name: taskData.name,
        description: taskData.description,
        credentials: taskData.credentials,
        config: taskData.config || {},
        isEnabled: taskData.isEnabled !== false,
      },
    });

    return NextResponse.json({ success: true, data: newTask });
  }
}
```

### 2. 执行管理API

#### 启动抓取任务

```typescript
// POST /api/fmtc-merchants/scraper/[taskId]
export async function POST(request: NextRequest, { params }) {
  const { taskId } = await params;
  const { action } = await request.json();

  if (action === "start") {
    const execution = await fmtcScraperService.startScrapingTask(taskId);

    return NextResponse.json({
      success: true,
      data: { executionId: execution.id },
    });
  }
}
```

### 3. 爬虫服务核心

#### FMTCScraperService

```typescript
export class FMTCScraperService {
  async startScrapingTask(taskId: string) {
    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task?.isEnabled) {
      throw new Error("任务未启用");
    }

    // 创建执行记录
    const execution = await db.fMTCScraperExecution.create({
      data: {
        taskId,
        status: ScraperTaskStatus.QUEUED,
        startedAt: new Date(),
      },
    });

    // 异步执行爬虫
    this.executeScrapingTask(execution.id, task).catch(async (error) => {
      await db.fMTCScraperExecution.update({
        where: { id: execution.id },
        data: {
          status: ScraperTaskStatus.FAILED,
          errorMessage: error.message,
        },
      });
    });

    return execution;
  }

  private async executeScrapingTask(executionId: string, task: any) {
    const scraperOptions: FMTCScraperOptions = {
      credentials: task.credentials,
      maxPages: task.config.maxPages || 5,
      includeDetails: task.config.includeDetails !== false,
      headless: false, // 强制非无头模式
    };

    // 调用实际爬虫
    const merchants = await fmtcScraper(scraperOptions, executionId);

    // 更新执行结果
    await db.fMTCScraperExecution.update({
      where: { id: executionId },
      data: {
        status: ScraperTaskStatus.COMPLETED,
        merchantsCount: merchants.length,
        metrics: {
          totalMerchants: merchants.length,
          withDetails: merchants.filter((m) => m.homepage).length,
        },
      },
    });
  }
}
```

## 爬虫核心实现

### 1. 主入口文件

#### packages/scraper/src/sites/fmtc/index.ts

```typescript
export default async function scrapeFMTC(
  options: FMTCScraperOptions,
  executionId?: string,
): Promise<FMTCMerchantData[]> {
  // 创建会话管理器
  const sessionManager = createSessionManager(crawleeLog, {
    sessionFile: `fmtc-session-${options.credentials.username}.json`,
    maxAge: 4 * 60 * 60 * 1000, // 4小时
  });

  // 创建简单的Playwright爬虫
  const crawler = new PlaywrightCrawler({
    requestHandler: createFMTCRequestHandler({
      allScrapedMerchants,
      scraperOptions: options,
      sessionManager,
    }),
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: false, // 与测试文件一致
        slowMo: 500, // 与测试文件一致
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-blink-features=AutomationControlled",
        ],
      },
    },
    maxConcurrency: 1,
  });

  await crawler.run([
    {
      url: "https://account.fmtc.co/cp/login",
      label: "LOGIN",
      userData: {
        executionId,
        credentials: options.credentials,
        options: options,
      },
    },
  ]);

  return allScrapedMerchants;
}
```

### 2. 登录处理器

#### FMTCLoginHandler

```typescript
export class FMTCLoginHandler {
  async login(credentials: FMTCCredentials): Promise<FMTCLoginResult> {
    // 1. 检查是否已登录
    const alreadyLoggedIn = await this.isLoggedIn();
    if (alreadyLoggedIn) {
      return { success: true };
    }

    // 2. 导航到登录页面（带重试）
    await this.navigateToLoginPage();

    // 3. 等待页面加载
    await this.waitForLoginPageLoad();

    // 4. 处理reCAPTCHA
    const recaptchaResult = await this.recaptchaService.solveWithRetry();
    if (!recaptchaResult.success) {
      return {
        success: false,
        error: recaptchaResult.error,
        requiresCaptcha: true,
      };
    }

    // 5. 填写并提交表单
    await this.fillLoginForm(credentials);
    await this.submitLoginForm();

    // 6. 等待并验证登录结果
    return await this.waitForLoginResult();
  }

  private async navigateToLoginPage(): Promise<void> {
    let loginPageLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!loginPageLoaded && retryCount < maxRetries) {
      try {
        await this.page.goto(FMTC_URL_PATTERNS.LOGIN, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });

        await delay(3000);

        const title = await this.page.title();
        if (title.includes("Login") || title.includes("FMTC")) {
          loginPageLoaded = true;
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await delay(5000);
        }
      }
    }

    if (!loginPageLoaded) {
      throw new Error("无法加载登录页面");
    }
  }
}
```

### 3. reCAPTCHA处理

#### ReCAPTCHAService

```typescript
export class ReCAPTCHAService {
  async solveAutomatically(): Promise<ReCAPTCHAResult> {
    // 1. 获取站点密钥
    const siteKey = await this.extractSiteKey();

    // 2. 提交到2captcha
    const taskId = await this.submitCaptchaTask(siteKey, this.page.url());

    // 3. 等待解决结果
    const solution = await this.waitForSolution(taskId);

    // 4. 应用解决方案
    await this.applySolution(solution);

    return { success: true, method: "auto" };
  }

  private async applySolution(solution: string): Promise<void> {
    // 查找reCAPTCHA响应元素
    const responseElement = await this.page.$(
      FMTC_SELECTORS.login.recaptchaResponse!,
    );

    if (!responseElement) {
      throw new Error("未找到reCAPTCHA响应元素");
    }

    // 设置token值
    await responseElement.evaluate((el: HTMLTextAreaElement, token: string) => {
      el.value = token;
      el.style.display = "none";
    }, solution);

    // 触发回调
    await this.page.evaluate((token) => {
      const windowWithGrecaptcha = window as any;
      const recaptchaContainer = document.querySelector(".g-recaptcha");

      if (recaptchaContainer && windowWithGrecaptcha.grecaptcha) {
        const callback = recaptchaContainer.getAttribute("data-callback");
        if (callback && windowWithGrecaptcha[callback]) {
          windowWithGrecaptcha[callback](token);
        }
      }
    }, solution);

    await delay(2000);

    // 验证token设置
    const finalValue = await responseElement.evaluate(
      (el: HTMLTextAreaElement) => el.value,
    );

    if (finalValue !== solution) {
      throw new Error("Token设置验证失败");
    }
  }
}
```

### 4. 搜索和解析

#### FMTCSearchHandler

```typescript
export class FMTCSearchHandler {
  async performSearch(params: FMTCSearchParams): Promise<FMTCSearchResult> {
    // 构建搜索URL
    const searchUrl = this.buildSearchUrl(params);

    // 导航到搜索页面
    await this.page.goto(searchUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 等待结果加载
    await this.page.waitForSelector(".result-item, .no-results", {
      timeout: 15000,
    });

    // 获取结果计数
    const resultsCount = await this.getResultsCount();

    return {
      success: true,
      resultsCount,
      hasResults: resultsCount > 0,
    };
  }

  private buildSearchUrl(params: FMTCSearchParams): string {
    const baseUrl = "https://account.fmtc.co/cp/program_directory";
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.set("cat", params.category);
    if (params.country) searchParams.set("cntry", params.country);
    if (params.network) searchParams.set("net", params.network);

    return `${baseUrl}?${searchParams.toString()}`;
  }
}
```

#### FMTCResultsParser

```typescript
export class FMTCResultsParser {
  async parseSearchResults(): Promise<FMTCParseResult> {
    const merchants: MerchantInfo[] = [];

    // 获取商户列表元素
    const merchantElements = await this.page.$$(
      FMTC_SELECTORS.searchResults.merchantItem,
    );

    for (const element of merchantElements) {
      try {
        const merchant = await this.extractMerchantInfo(element);
        if (merchant) {
          merchants.push(merchant);
        }
      } catch (error) {
        this.log.warning(`解析商户失败: ${error.message}`);
      }
    }

    // 检查是否有下一页
    const hasNextPage = await this.checkHasNextPage();

    return {
      merchants,
      totalFound: merchants.length,
      hasNextPage,
    };
  }

  private async extractMerchantInfo(
    element: ElementHandle,
  ): Promise<MerchantInfo> {
    return await element.evaluate((el) => {
      const nameEl = el.querySelector(".merchant-name");
      const countryEl = el.querySelector(".merchant-country");
      const networkEl = el.querySelector(".merchant-network");
      const linkEl = el.querySelector('a[href*="/details/"]');

      return {
        name: nameEl?.textContent?.trim() || "",
        country: countryEl?.textContent?.trim() || "",
        network: networkEl?.textContent?.trim() || "",
        detailUrl: linkEl ? new URL(linkEl.href).href : null,
        dateAdded: new Date().toISOString(),
      };
    });
  }
}
```

### 5. 商户详情处理

#### FMTCMerchantDetailHandler

```typescript
export class FMTCMerchantDetailHandler {
  async scrapeMerchantDetails(
    merchantUrl: string,
    merchantName: string,
  ): Promise<FMTCDetailResult> {
    try {
      // 导航到详情页面
      await this.page.goto(merchantUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // 等待关键元素加载
      await this.page.waitForSelector(FMTC_SELECTORS.merchantDetail.container, {
        timeout: 15000,
      });

      // 提取详细信息
      const merchantDetail = await this.extractDetailedInfo();

      return {
        success: true,
        merchantDetail,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async extractDetailedInfo(): Promise<FMTCMerchantData> {
    return await this.page.evaluate(() => {
      // 基本信息
      const name = document
        .querySelector(".merchant-title")
        ?.textContent?.trim();
      const description = document
        .querySelector(".merchant-description")
        ?.textContent?.trim();
      const homepage = document.querySelector('a[href*="http"]')?.href;

      // 分类信息
      const categoryEl = document.querySelector(".category-info");
      const primaryCategory = categoryEl?.textContent?.trim();

      // Logo和截图
      const logo120x60 = document.querySelector('img[src*="120x60"]')?.src;
      const logo88x31 = document.querySelector('img[src*="88x31"]')?.src;
      const screenshot280x210 = document.querySelector(
        'img[src*="280x210"]',
      )?.src;
      const screenshot600x450 = document.querySelector(
        'img[src*="600x450"]',
      )?.src;

      // 网络信息
      const networkElements = document.querySelectorAll(".network-item");
      const networks = Array.from(networkElements).map((el) => ({
        networkName: el.querySelector(".network-name")?.textContent?.trim(),
        commission: el.querySelector(".commission")?.textContent?.trim(),
        cookieDuration: el
          .querySelector(".cookie-duration")
          ?.textContent?.trim(),
      }));

      // 联盟链接
      const affiliateLinks: Record<string, string[]> = {};
      document.querySelectorAll(".affiliate-section").forEach((section) => {
        const networkName = section
          .querySelector(".network-title")
          ?.textContent?.trim();
        const links = Array.from(section.querySelectorAll("a[href]")).map(
          (a) => a.href,
        );
        if (networkName && links.length > 0) {
          affiliateLinks[networkName] = links;
        }
      });

      // FreshReach支持
      const freshReachEl = document.querySelector(".freshreach-status");
      const freshReachSupported =
        freshReachEl?.textContent?.includes("Supported") || false;

      return {
        name: name || "",
        description,
        homepage,
        primaryCategory,
        logo120x60,
        logo88x31,
        screenshot280x210,
        screenshot600x450,
        networks,
        affiliateLinks,
        freshReachSupported,
      };
    });
  }
}
```

## 配置管理

### 1. 环境配置

#### .env配置

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/trendhub"

# 2captcha API
TWOCAPTCHA_API_KEY="your_api_key_here"

# FMTC登录凭据
FMTC_USERNAME="your_username"
FMTC_PASSWORD="your_password"

# 爬虫配置
FMTC_MAX_PAGES=10
FMTC_ENABLE_DETAIL_SCRAPING=true
FMTC_MAX_DETAILS_PER_PAGE=5

# 会话配置
FMTC_SESSION_MAX_AGE=14400000  # 4小时
```

### 2. 爬虫配置

#### packages/scraper/src/sites/fmtc/config.ts

```typescript
export interface FMTCScraperOptions {
  credentials: {
    username: string;
    password: string;
  };
  maxPages?: number;
  includeDetails?: boolean;
  downloadImages?: boolean;
  maxConcurrency?: number;
  requestDelay?: number;
  headless?: boolean;
  searchParams?: Record<string, any>;
  sessionConfig?: {
    autoSave?: boolean;
    maxAge?: number;
  };
}

export function getRecaptchaConfig(): ReCAPTCHAConfig {
  return {
    mode: process.env.TWOCAPTCHA_API_KEY
      ? ReCAPTCHAMode.AUTO
      : ReCAPTCHAMode.MANUAL,
    manualTimeout: 60000,
    autoTimeout: 120000,
    retryAttempts: 3,
    retryDelay: 5000,
    twoCaptcha: process.env.TWOCAPTCHA_API_KEY
      ? {
          apiKey: process.env.TWOCAPTCHA_API_KEY,
          softId: 4580,
        }
      : undefined,
  };
}

export function getSearchConfig(): FMTCSearchParams {
  return {
    category: process.env.FMTC_SEARCH_CATEGORY || "",
    country: process.env.FMTC_SEARCH_COUNTRY || "",
    network: process.env.FMTC_SEARCH_NETWORK || "",
    maxPages: parseInt(process.env.FMTC_MAX_PAGES || "10"),
  };
}
```

### 3. 选择器配置

#### packages/scraper/src/sites/fmtc/selectors.ts

```typescript
export const FMTC_SELECTORS = {
  login: {
    loginForm: 'form[action*="login"]',
    usernameInput: 'input[name="username"], input[type="email"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    submitButton: 'button[type="submit"], input[type="submit"]',
    recaptcha: ".g-recaptcha, [data-sitekey]",
    recaptchaResponse: 'textarea[name="g-recaptcha-response"]',
    errorMessage: ".error-message, .alert-danger, .login-error",
  },
  searchResults: {
    container: ".search-results, .merchant-list",
    merchantItem: ".merchant-item, .result-item",
    merchantName: ".merchant-name, .company-name",
    merchantCountry: ".merchant-country, .country",
    merchantNetwork: ".merchant-network, .network-name",
    merchantLink: 'a[href*="/details/"], a[href*="/merchant/"]',
    pagination: ".pagination, .paging",
    nextPageLink: 'a[href*="page="]:last-child, .next-page',
    resultsCount: ".results-count, .total-results",
  },
  merchantDetail: {
    container: ".merchant-details, .company-details",
    title: ".merchant-title, .company-title",
    description: ".merchant-description, .company-description",
    homepage: 'a[href*="http"]:not([href*="fmtc.co"])',
    category: ".category-info, .merchant-category",
    networkList: ".network-list, .affiliate-networks",
    networkItem: ".network-item, .network-row",
    logo: 'img[src*="logo"], img[alt*="logo"]',
    screenshot: 'img[src*="screenshot"], img[src*="thumb"]',
  },
};

export const FMTC_URL_PATTERNS = {
  LOGIN: "https://account.fmtc.co/cp/login",
  DIRECTORY: "https://account.fmtc.co/cp/program_directory",
  DEFAULT_MERCHANT_LIST:
    "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
};
```

## 部署和使用

### 1. 开发环境设置

```bash
# 1. 安装依赖
cd /root/TrendHub
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量

# 3. 初始化数据库
cd apps/admin
pnpm db:push
pnpm db:seed

# 4. 构建爬虫包
cd ../../packages/scraper
pnpm build

# 5. 启动开发服务器
cd ../../
pnpm dev:admin  # 启动管理后台 (端口3001)
```

### 2. 创建抓取任务

#### 通过API创建

```bash
curl -X POST http://localhost:3001/api/fmtc-merchants/scraper \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_task",
    "taskData": {
      "name": "每日FMTC抓取",
      "description": "每日自动抓取FMTC商户信息",
      "credentials": {
        "username": "your_username",
        "password": "your_password"
      },
      "config": {
        "maxPages": 10,
        "includeDetails": true,
        "searchParams": {
          "category": "2",
          "country": "0"
        }
      }
    }
  }'
```

#### 通过前端界面

1. 访问 `http://localhost:3001/fmtc-merchants`
2. 点击"新建任务"按钮
3. 填写任务配置信息
4. 设置登录凭据
5. 配置抓取参数
6. 保存并启动任务

### 3. 监控任务执行

#### 实时日志监控

FMTC爬虫现在支持基于Server-Sent Events (SSE)的实时日志监控系统，让你能够实时观察爬虫任务的执行过程。

##### 前端实时日志查看器

```typescript
// 启动实时日志流
const eventSource = new EventSource(
  `/api/admin/scraper-tasks/logs/stream?executionId=${executionId}&level=INFO`,
);

// 监听连接确认
eventSource.addEventListener("connected", (event) => {
  const data = JSON.parse(event.data);
  console.log("已连接到实时日志流:", data.taskName);
});

// 监听新日志
eventSource.addEventListener("logs", (event) => {
  const logs = JSON.parse(event.data);
  logs.forEach((log) => {
    console.log(`[${log.level}] ${log.timestamp}: ${log.message}`);
    if (log.context) {
      console.log("上下文:", log.context);
    }
  });
});

// 监听状态变化
eventSource.addEventListener("status", (event) => {
  const data = JSON.parse(event.data);
  console.log("任务状态更新:", data.status);

  if (data.isFinished) {
    console.log("任务已完成");
    eventSource.close();
  }
});

// 错误处理
eventSource.addEventListener("error", (event) => {
  const data = JSON.parse(event.data);
  console.error("日志流错误:", data.message);
});

// 连接关闭
eventSource.addEventListener("close", (event) => {
  const data = JSON.parse(event.data);
  console.log("连接已关闭:", data.reason);
});
```

##### 在管理界面中使用

1. **访问爬虫任务管理页面**

   ```
   http://localhost:3001/[locale]/scraper-management
   ```

2. **查看实时日志**

   - 在任务执行列表中，找到正在运行的任务
   - 点击操作菜单（三个点图标）
   - 选择"实时日志"选项
   - 实时日志查看器将在侧边栏中打开

3. **实时日志功能特性**
   - ✅ **实时连接状态**：显示连接状态和重连机制
   - ✅ **日志级别过滤**：支持按ERROR、WARN、INFO、DEBUG筛选
   - ✅ **自动滚动控制**：可开启/关闭自动滚动到最新日志
   - ✅ **暂停/恢复功能**：暂停日志更新，恢复后继续接收
   - ✅ **日志导出**：将当前日志导出为JSON文件
   - ✅ **上下文信息**：展开查看详细的上下文数据
   - ✅ **自动重连**：网络中断后自动重连，支持断点续传

##### API接口详细说明

```typescript
// GET /api/admin/scraper-tasks/logs/stream
// 支持的查询参数：
interface StreamLogsParams {
  executionId: string; // 必需：任务执行ID
  level?: "ERROR" | "WARN" | "INFO" | "DEBUG"; // 可选：日志级别过滤
  lastTimestamp?: string; // 可选：断点续传的时间戳
  includeContext?: boolean; // 可选：是否包含上下文信息
}

// 响应事件类型：
interface SSEEvents {
  connected: {
    executionId: string;
    timestamp: string;
    taskName: string;
    taskSite: string;
  };

  logs: Array<{
    id: string;
    level: "ERROR" | "WARN" | "INFO" | "DEBUG";
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
  }>;

  status: {
    status: string;
    completedAt?: string;
    errorMessage?: string;
    isFinished: boolean;
  };

  error: {
    message: string;
    timestamp: string;
  };

  close: {
    reason: string;
    timestamp: string;
  };
}
```

#### 传统日志查看方式

```bash
# 查看特定执行的历史日志（分页）
curl "http://localhost:3001/api/admin/scraper-tasks/logs?executionId=[executionId]&page=1&limit=50"

# 查看文件系统中的日志
tail -f scraper_storage_runs/FMTC/[executionId]/debug.log

# 使用jq格式化JSON日志
curl -s "http://localhost:3001/api/admin/scraper-tasks/logs?executionId=[executionId]" | jq '.data'
```

#### 日志级别说明

- **ERROR**: 致命错误，如登录失败、网络连接错误
- **WARN**: 警告信息，如解析失败、重试操作
- **INFO**: 重要信息，如登录成功、页面导航、数据保存
- **DEBUG**: 详细调试信息，如DOM操作、数据解析过程

### 4. 生产环境部署

#### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build

# 安装Playwright依赖
RUN npx playwright install --with-deps chromium

EXPOSE 3001

CMD ["pnpm", "start:admin"]
```

#### PM2部署

```bash
# 构建生产版本
pnpm build

# 使用PM2启动
pnpm pm2:start:prod

# 查看日志
pnpm pm2:logs

# 查看状态
pnpm pm2:status
```

## 故障排除

### 1. 常见问题

#### 登录失败

**问题**: reCAPTCHA验证失败
**解决**:

- 检查2captcha API密钥是否正确
- 确认账户余额充足
- 验证网络连接是否正常

**问题**: 用户名或密码错误
**解决**:

- 验证环境变量配置
- 检查FMTC账户是否正常
- 确认登录凭据格式正确

#### 抓取中断

**问题**: 会话过期
**解决**:

- 检查会话文件是否存在
- 清理过期的会话文件
- 调整会话有效期配置

**问题**: 反爬虫检测
**解决**:

- 降低抓取频率
- 增加随机延迟
- 使用不同的User-Agent

#### 数据解析错误

**问题**: 选择器失效
**解决**:

- 更新选择器配置
- 检查FMTC页面结构变化
- 添加备用选择器

### 2. 调试工具

#### 启用调试模式

```typescript
// 设置环境变量
process.env.NODE_ENV = "development";
process.env.DEBUG = "fmtc:*";

// 启用详细日志
const crawler = new PlaywrightCrawler({
  // ... 其他配置
  launchContext: {
    launchOptions: {
      headless: false, // 显示浏览器窗口
      devtools: true, // 开启开发者工具
    },
  },
});
```

#### 查看抓取过程

```bash
# 运行测试文件查看完整流程
cd packages/scraper
npx tsx src/test/fmtc/fmtc-complete-test.ts

# 启用详细日志
DEBUG=fmtc:* npx tsx src/test/fmtc/fmtc-complete-test.ts
```

#### 分析性能指标

```typescript
// 检查执行指标
const execution = await db.fMTCScraperExecution.findUnique({
  where: { id: executionId },
  include: { metrics: true },
});

console.log("执行指标:", {
  duration: execution.completedAt - execution.startedAt,
  merchantsPerMinute: execution.merchantsCount / (duration / 60000),
  successRate: execution.merchantsCount / execution.metrics.totalAttempted,
});
```

### 3. 日志分析

#### 日志级别说明

- **ERROR**: 致命错误，需要立即处理
- **WARN**: 警告信息，可能影响结果
- **INFO**: 一般信息，用于跟踪进度
- **DEBUG**: 详细调试信息

#### 关键日志模式

```bash
# 查找登录相关错误
grep "Login.*fail\|reCAPTCHA.*fail" debug.log

# 查找抓取错误
grep "scrape.*error\|parse.*fail" debug.log

# 查找性能问题
grep "timeout\|slow\|retry" debug.log
```

## 最佳实践

### 1. 性能优化

#### 并发控制

```typescript
const scraperOptions: FMTCScraperOptions = {
  maxConcurrency: 1, // FMTC建议单线程
  requestDelay: 2000, // 请求间隔2秒
  maxPages: 10, // 限制页数避免过长运行
};
```

#### 会话复用

```typescript
// 启用会话自动保存
const sessionConfig = {
  autoSave: true,
  maxAge: 4 * 60 * 60 * 1000, // 4小时有效期
};

// 检查会话有效性
if (savedSessionState) {
  const isValid = await sessionManager.checkAuthenticationStatus(page);
  if (!isValid) {
    sessionManager.cleanupSessionState();
  }
}
```

#### 资源管理

```typescript
// 限制浏览器资源使用
const launchOptions = {
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--memory-pressure-off",
    "--max_old_space_size=4096",
  ],
};
```

### 2. 数据质量

#### 数据验证

```typescript
function validateMerchantData(merchant: FMTCMerchantData): boolean {
  // 必需字段检查
  if (!merchant.name || !merchant.country) {
    return false;
  }

  // URL格式验证
  if (merchant.homepage && !isValidUrl(merchant.homepage)) {
    return false;
  }

  // 数据完整性检查
  if (merchant.networks && merchant.networks.length === 0) {
    return false;
  }

  return true;
}
```

#### 重复数据处理

```typescript
async function deduplicateMerchants(merchants: FMTCMerchantData[]) {
  const seen = new Set<string>();
  const unique: FMTCMerchantData[] = [];

  for (const merchant of merchants) {
    const key = `${merchant.name}:${merchant.country}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(merchant);
    }
  }

  return unique;
}
```

### 3. 错误处理

#### 重试策略

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}
```

#### 优雅降级

```typescript
async function scrapeWithFallback(url: string) {
  try {
    // 尝试详细抓取
    return await scrapeDetailedInfo(url);
  } catch (error) {
    log.warning(`详细抓取失败，使用基础抓取: ${error.message}`);

    try {
      // 降级到基础抓取
      return await scrapeBasicInfo(url);
    } catch (fallbackError) {
      log.error(`基础抓取也失败: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
}
```

### 4. 实时监控和告警

#### 实时监控最佳实践

##### 监控仪表盘设置

```typescript
// 创建实时监控仪表盘
class FMTCMonitoringDashboard {
  private connections = new Map<string, EventSource>();
  private metrics = {
    activeTasks: 0,
    totalLogs: 0,
    errorRate: 0,
    avgResponseTime: 0,
  };

  // 监控多个任务执行
  async monitorMultipleTasks(executionIds: string[]) {
    for (const executionId of executionIds) {
      const eventSource = new EventSource(
        `/api/admin/scraper-tasks/logs/stream?executionId=${executionId}`,
      );

      // 设置统一的事件处理器
      this.setupEventHandlers(eventSource, executionId);
      this.connections.set(executionId, eventSource);
    }
  }

  private setupEventHandlers(eventSource: EventSource, executionId: string) {
    eventSource.addEventListener("connected", (event) => {
      this.metrics.activeTasks++;
      this.updateDashboard();
    });

    eventSource.addEventListener("logs", (event) => {
      const logs = JSON.parse(event.data);
      this.processLogs(logs, executionId);
      this.updateDashboard();
    });

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      if (data.isFinished) {
        this.metrics.activeTasks--;
        eventSource.close();
        this.connections.delete(executionId);
      }
    });

    eventSource.addEventListener("error", (event) => {
      this.handleConnectionError(executionId, event);
    });
  }

  private processLogs(logs: any[], executionId: string) {
    this.metrics.totalLogs += logs.length;

    // 计算错误率
    const errorLogs = logs.filter((log) => log.level === "ERROR");
    if (errorLogs.length > 0) {
      this.metrics.errorRate = (errorLogs.length / logs.length) * 100;

      // 触发告警
      this.triggerAlert({
        type: "HIGH_ERROR_RATE",
        executionId,
        errorRate: this.metrics.errorRate,
        errors: errorLogs,
      });
    }
  }

  private triggerAlert(alert: {
    type: string;
    executionId: string;
    errorRate?: number;
    errors?: any[];
  }) {
    // 发送告警通知
    console.warn(`🚨 告警: ${alert.type}`, alert);

    // 可以集成Slack、Email或其他通知服务
    this.sendNotification(alert);
  }
}
```

##### 性能监控

```typescript
// 性能指标收集器
class PerformanceMonitor {
  private startTime = Date.now();
  private checkpoints = new Map<string, number>();

  // 记录检查点
  checkpoint(name: string) {
    this.checkpoints.set(name, Date.now() - this.startTime);
  }

  // 获取性能报告
  getReport() {
    const totalTime = Date.now() - this.startTime;
    const report = {
      totalExecutionTime: totalTime,
      checkpoints: Object.fromEntries(this.checkpoints),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    return report;
  }

  // 监控网络请求性能
  monitorNetworkRequests() {
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      const start = Date.now();
      const response = await originalFetch(...args);
      const duration = Date.now() - start;

      this.recordNetworkMetrics({
        url: args[0]?.toString(),
        duration,
        status: response.status,
        size: response.headers.get("content-length"),
      });

      return response;
    };
  }
}
```

##### 智能告警规则

```typescript
// 告警规则引擎
class AlertRuleEngine {
  private rules = [
    {
      name: "HIGH_ERROR_RATE",
      condition: (metrics: any) => metrics.errorRate > 10,
      action: (data: any) => this.sendSlackAlert("错误率过高", data),
      cooldown: 5 * 60 * 1000, // 5分钟冷却
    },
    {
      name: "LONG_EXECUTION_TIME",
      condition: (metrics: any) => metrics.executionTime > 30 * 60 * 1000,
      action: (data: any) => this.sendEmailAlert("执行时间过长", data),
      cooldown: 10 * 60 * 1000, // 10分钟冷却
    },
    {
      name: "CAPTCHA_FAILURE",
      condition: (logs: any[]) =>
        logs.some(
          (log) => log.message.includes("reCAPTCHA") && log.level === "ERROR",
        ),
      action: (data: any) => this.escalateToOperator(data),
      cooldown: 2 * 60 * 1000, // 2分钟冷却
    },
  ];

  private alertHistory = new Map<string, number>();

  checkRules(metrics: any, logs: any[], executionId: string) {
    for (const rule of this.rules) {
      const lastAlertTime =
        this.alertHistory.get(`${rule.name}_${executionId}`) || 0;
      const now = Date.now();

      // 检查冷却期
      if (now - lastAlertTime < rule.cooldown) {
        continue;
      }

      // 检查条件
      if (rule.condition(metrics) || rule.condition(logs)) {
        rule.action({ metrics, logs, executionId, rule: rule.name });
        this.alertHistory.set(`${rule.name}_${executionId}`, now);
      }
    }
  }

  private async sendSlackAlert(title: string, data: any) {
    // Slack Webhook集成
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 FMTC爬虫告警: ${title}`,
          attachments: [
            {
              color: "danger",
              fields: [
                { title: "执行ID", value: data.executionId, short: true },
                {
                  title: "错误率",
                  value: `${data.metrics?.errorRate}%`,
                  short: true,
                },
                { title: "时间", value: new Date().toISOString(), short: true },
              ],
            },
          ],
        }),
      });
    }
  }
}
```

#### 健康检查和服务监控

```typescript
// 增强的健康检查
async function comprehensiveHealthCheck(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabaseConnection(),
    fmtcSite: await checkFMTCAvailability(),
    twoCaptcha: await check2CaptchaService(),
    diskSpace: await checkDiskSpace(),
    memory: await checkMemoryUsage(),
    activeConnections: await checkSSEConnections(),
    queueHealth: await checkTaskQueue(),
  };

  const criticalFailures = ["database", "fmtcSite"].filter(
    (key) => !checks[key],
  );

  return {
    status: criticalFailures.length === 0 ? "healthy" : "critical",
    checks,
    criticalFailures,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

// SSE连接监控
async function checkSSEConnections(): Promise<boolean> {
  // 检查活跃的SSE连接数
  const activeConnections = globalThis.sseConnections?.size || 0;
  const maxConnections = 100; // 设置最大连接数

  return activeConnections < maxConnections;
}

// 任务队列健康检查
async function checkTaskQueue(): Promise<boolean> {
  const queuedTasks = await db.fMTCScraperExecution.count({
    where: { status: "QUEUED" },
  });

  const stuckTasks = await db.fMTCScraperExecution.count({
    where: {
      status: "RUNNING",
      startedAt: {
        lt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      },
    },
  });

  return queuedTasks < 50 && stuckTasks === 0;
}
```

#### 指标收集和分析

```typescript
// 增强的指标收集器
class EnhancedMetricsCollector {
  private metrics = {
    tasksCreated: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    merchantsScraped: 0,
    averageExecutionTime: 0,
    reCAPTCHASuccessRate: 0,
    sseConnections: 0,
    logsPerSecond: 0,
    errorPatterns: new Map<string, number>(),
  };

  // 实时日志分析
  analyzeLogs(logs: any[]) {
    // 分析错误模式
    logs
      .filter((log) => log.level === "ERROR")
      .forEach((log) => {
        const pattern = this.extractErrorPattern(log.message);
        const count = this.metrics.errorPatterns.get(pattern) || 0;
        this.metrics.errorPatterns.set(pattern, count + 1);
      });

    // 计算日志频率
    this.metrics.logsPerSecond = logs.length / 60; // 假设1分钟窗口
  }

  private extractErrorPattern(message: string): string {
    // 提取错误模式（移除具体的数值和ID）
    return message
      .replace(/\d+/g, "N")
      .replace(/[a-f0-9-]{36}/g, "UUID")
      .replace(/https?:\/\/[^\s]+/g, "URL");
  }

  // 生成趋势报告
  generateTrendReport(timeWindow: number = 24 * 60 * 60 * 1000) {
    return {
      summary: this.metrics,
      trends: {
        successRate: this.calculateSuccessRate(),
        performanceTrend: this.calculatePerformanceTrend(),
        errorFrequency: Array.from(this.metrics.errorPatterns.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
      },
      recommendations: this.generateRecommendations(),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];

    if (this.metrics.reCAPTCHASuccessRate < 90) {
      recommendations.push("考虑检查2captcha服务状态或更换API密钥");
    }

    if (this.metrics.averageExecutionTime > 30 * 60 * 1000) {
      recommendations.push("执行时间过长，建议优化抓取策略或增加并发数");
    }

    const topError = Array.from(this.metrics.errorPatterns.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    if (topError && topError[1] > 10) {
      recommendations.push(`频繁出现错误: ${topError[0]}，建议排查此问题`);
    }

    return recommendations;
  }
}
```

---

##
