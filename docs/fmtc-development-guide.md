# FMTC 爬虫系统完整开发指南

## 📋 目录

1. [系统概览与架构](#系统概览与架构)
2. [爬虫核心实现](#爬虫核心实现)
3. [后端集成设计](#后端集成设计)
4. [前端管理界面](#前端管理界面)
5. [开发环境搭建](#开发环境搭建)
6. [测试与调试](#测试与调试)
7. [部署与运维](#部署与运维)
8. [最佳实践](#最佳实践)
9. [故障排除](#故障排除)
10. [扩展开发](#扩展开发)

## 系统概览与架构

### 🎯 系统定位

FMTC爬虫系统是TrendHub项目的核心数据采集模块，专门用于自动化抓取和管理FMTC（FindMyCashback.com）平台的商户数据。系统采用现代化的微服务架构设计，提供完整的数据采集、处理、存储和管理功能。

### 🏗️ 整体架构设计

```mermaid
graph TB
    A[前端管理界面] --> B[后端API层]
    B --> C[爬虫服务层]
    B --> D[数据存储层]
    B --> E[实时通信层 SSE]

    C --> F[单一商户爬虫]
    C --> G[批量商户爬虫]
    C --> H[会话管理器]
    C --> I[反检测模块]

    F --> J[FMTC网站]
    G --> J

    C --> K[reCAPTCHA服务]
    K --> L[2captcha API]

    D --> M[PostgreSQL]
    D --> N[文件存储]

    subgraph "爬虫核心组件"
        F
        G
        H
        I
    end

    subgraph "数据流"
        J --> O[原始数据]
        O --> P[数据清洗]
        P --> Q[品牌匹配]
        Q --> M
    end
```

### 🎨 双爬虫设计理念

系统创新性地采用**双爬虫模式**，分别针对不同的使用场景：

#### 单一商户爬虫 (`single-merchant-scraper.ts`)

- **使用场景**: 商户详情页面的精确抓取、调试测试、小规模数据同步
- **技术特点**:
  - 详细的错误处理和日志记录
  - 支持交互式调试模式
  - 完整的页面加载等待和验证
- **性能表现**: 准确性优先，单个商户处理时间 10-30秒

#### 批量商户爬虫 (`batch-merchant-scraper.ts`)

- **使用场景**: 大规模商户数据的批量更新、生产环境数据同步
- **技术特点**:
  - 2-3个工作线程并发处理
  - 会话复用优化，一次登录多次使用
  - 智能延迟控制，避免反爬虫检测
  - Server-Sent Events实时进度推送
- **性能表现**: 效率优先，性能提升5-8倍，单个商户处理时间 3-8秒

### 📊 技术栈选择

#### 后端技术栈

- **框架**: Next.js 15.3+ App Router + Server Actions
- **爬虫引擎**: Crawlee + Playwright + Chromium
- **数据库**: PostgreSQL + Prisma ORM
- **实时通信**: Server-Sent Events (SSE)
- **会话管理**: 自研会话管理器 + 文件存储
- **反验证码**: 2captcha.com API集成

#### 前端技术栈

- **UI框架**: React 18+ + TypeScript
- **组件库**: HeroUI + Radix UI + shadcn/ui
- **状态管理**: React Context + Server State
- **实时更新**: EventSource API (SSE客户端)
- **表格组件**: @tanstack/react-table
- **国际化**: next-intl

#### 开发工具链

- **包管理**: pnpm workspace + Turborepo
- **代码规范**: ESLint + Prettier + Husky
- **类型检查**: TypeScript strict mode
- **测试框架**: Jest + React Testing Library

## 爬虫核心实现

### 🔧 核心模块架构

```
packages/scraper/src/sites/fmtc/
├── index.ts                     # 主入口，统一API
├── types.ts                     # 类型定义系统
├── config.ts                    # 配置管理中心
├── selectors.ts                 # CSS选择器定义
│
├── 登录和会话管理
├── login-handler.ts             # 登录处理器
├── session-manager.ts           # 会话管理器
├── recaptcha-service.ts         # reCAPTCHA处理
│
├── 页面导航和数据提取
├── navigation-handler.ts        # 页面导航处理
├── search-handler.ts            # 搜索功能处理
├── results-parser.ts            # 结果解析器
├── merchant-detail-handler.ts   # 商户详情处理
│
├── 爬虫实现层
├── request-handler.ts           # 通用请求处理器
├── single-merchant-scraper.ts   # 单一商户爬虫
├── batch-merchant-scraper.ts    # 批量商户爬虫
│
└── 辅助功能模块
    ├── anti-detection.ts        # 反检测机制
    └── timeout-optimization-guide.md
```

### 🚀 单一商户爬虫详解

#### 设计目标

专注于**准确性和可调试性**，提供完整的错误处理和状态跟踪。

#### 核心实现

```typescript
export class FMTCSingleMerchantScraper {
  private options: SingleMerchantScrapingOptions;
  private logs: string[] = [];
  private startTime: Date;

  constructor(options: SingleMerchantScrapingOptions) {
    this.options = options;
    this.startTime = new Date();

    // 设置详细日志级别用于调试
    crawleeLog.setLevel(LogLevel.INFO);
  }

  /**
   * 执行单商户抓取的完整流程
   */
  async scrapeSingleMerchant(): Promise<SingleMerchantScrapingResult> {
    try {
      // 1. 初始化会话管理器
      const sessionManager = this.createSessionManager();

      // 2. 构建商户URL（如果需要）
      const merchantUrl = this.buildMerchantUrl();

      // 3. 创建Playwright爬虫实例
      const crawler = this.createCrawler(sessionManager);

      // 4. 执行抓取任务
      const merchantData = await this.executeScraping(crawler, merchantUrl);

      // 5. 返回处理结果
      return {
        success: true,
        merchantData,
        scrapedAt: new Date(),
        processingTime: Date.now() - this.startTime.getTime(),
        logs: this.logs,
      };
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "单商户抓取失败", {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
        scrapedAt: new Date(),
        logs: this.logs,
      };
    }
  }
}
```

#### 关键特性

1. **详细日志记录**: 每个步骤都有完整的日志记录，便于调试
2. **错误恢复机制**: 支持多种错误情况的自动恢复
3. **会话持久化**: 登录状态可跨任务保持
4. **交互式调试**: 支持非无头模式下的手动介入

### ⚡ 批量商户爬虫详解

#### 设计目标

专注于**高效性和并发处理**，通过工作线程池和会话复用实现性能突破。

#### 核心架构

```typescript
export class FMTCBatchMerchantScraper {
  private options: BatchScrapingOptions;
  private tasks: Map<string, MerchantTask> = new Map();
  private workers: WorkerState[] = [];
  private context?: BrowserContext;
  private sessionManager?: any;

  /**
   * 执行批量抓取的主要流程
   */
  async executeBatchScraping(): Promise<BatchScrapingResult> {
    try {
      // 1. 初始化浏览器上下文（共享）
      await this.initializeBrowserContext();

      // 2. 创建工作线程池
      await this.initializeWorkers();

      // 3. 执行统一登录（仅一次）
      await this.performInitialLogin(this.workers[0].page);

      // 4. 启动并发工作线程
      const workerPromises = this.workers.map((worker) =>
        this.runWorker(worker),
      );

      // 5. 等待所有任务完成
      await Promise.all(workerPromises);

      // 6. 统计和返回结果
      return this.generateBatchResult();
    } finally {
      await this.cleanup();
    }
  }
}
```

#### 工作线程实现

```typescript
/**
 * 单个工作线程的运行逻辑
 */
private async runWorker(worker: WorkerState): Promise<void> {
  while (this.isRunning && !this.isCancelled) {
    // 1. 获取下一个待处理任务
    const task = this.getNextPendingTask();
    if (!task) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    // 2. 更新任务状态
    worker.isWorking = true;
    worker.currentTask = task;
    task.status = BatchTaskStatus.RUNNING;
    task.startTime = new Date();

    try {
      // 3. 执行商户抓取
      const result = await this.scrapeSingleMerchant(worker, task);

      // 4. 处理成功结果
      task.result = result;
      task.status = BatchTaskStatus.COMPLETED;
      task.endTime = new Date();
      this.completedTasks.push(task);

      // 5. 触发完成回调
      this.options.onTaskComplete?.(task);

    } catch (error) {
      // 6. 处理失败情况
      task.status = BatchTaskStatus.FAILED;
      task.endTime = new Date();
      task.error = error.message;
      this.failedTasks.push(task);

      this.options.onTaskFailed?.(task);
    }

    // 7. 清理工作线程状态
    worker.isWorking = false;
    worker.currentTask = undefined;

    // 8. 更新实时进度
    await this.updateProgress();

    // 9. 智能延迟控制
    const delay = this.getBatchModeDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

#### 性能优化策略

1. **会话复用优化**

   ```typescript
   // 共享浏览器上下文，避免重复登录
   private async initializeBrowserContext(): Promise<void> {
     this.context = await chromium.launchPersistentContext(
       this.sessionStoragePath,
       {
         headless: true,
         args: this.getBrowserArgs()
       }
     );
   }
   ```

2. **智能并发控制**

   ```typescript
   // 根据任务数量动态调整并发数
   private getOptimalConcurrency(taskCount: number): number {
     if (taskCount <= 10) return 3;      // 高速模式
     if (taskCount <= 50) return 2;      // 稳定模式
     return 1;                           // 安全模式
   }
   ```

3. **批量模式延迟优化**
   ```typescript
   private getBatchModeDelay(): number {
     const config = this.options.config;
     return Math.random() * (
       (config?.searchMaxDelay || 1500) -
       (config?.searchMinDelay || 500)
     ) + (config?.searchMinDelay || 500);
   }
   ```

### 🔐 登录和会话管理

#### FMTCLoginHandler 实现

```typescript
export class FMTCLoginHandler {
  async login(credentials: FMTCCredentials): Promise<FMTCLoginResult> {
    // 1. 检查现有登录状态
    const alreadyLoggedIn = await this.isLoggedIn();
    if (alreadyLoggedIn) {
      return { success: true };
    }

    // 2. 导航到登录页面（带重试机制）
    await this.navigateToLoginPage();

    // 3. 等待页面完全加载
    await this.waitForLoginPageLoad();

    // 4. 处理reCAPTCHA验证
    const recaptchaResult = await this.recaptchaService.solveWithRetry();
    if (!recaptchaResult.success) {
      return {
        success: false,
        error: recaptchaResult.error,
        requiresCaptcha: true,
      };
    }

    // 5. 填写登录表单
    await this.fillLoginForm(credentials);

    // 6. 提交表单并验证结果
    await this.submitLoginForm();
    return await this.waitForLoginResult();
  }
}
```

#### 会话管理策略

```typescript
export interface SessionConfig {
  sessionFile: string; // 会话文件路径
  maxAge: number; // 最大会话有效期 (4小时)
  autoSave: boolean; // 自动保存会话
  encryptSession: boolean; // 会话数据加密
}

export function createSessionManager(
  log: Log,
  config: Partial<SessionConfig>,
): SessionManager {
  return {
    // 保存当前会话状态
    async saveSession(page: Page): Promise<void> {
      const cookies = await page.context().cookies();
      const sessionData = {
        cookies,
        timestamp: Date.now(),
        userAgent: await page.evaluate(() => navigator.userAgent),
      };

      await fs.writeFile(
        config.sessionFile!,
        JSON.stringify(sessionData, null, 2),
      );
    },

    // 恢复会话状态
    async restoreSession(page: Page): Promise<boolean> {
      try {
        const sessionData = JSON.parse(
          await fs.readFile(config.sessionFile!, "utf-8"),
        );

        // 检查会话是否过期
        if (Date.now() - sessionData.timestamp > config.maxAge!) {
          return false;
        }

        // 恢复cookies
        await page.context().addCookies(sessionData.cookies);
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}
```

### 🤖 反检测机制实现

#### 核心反检测策略

```typescript
export class FMTCAntiDetection {
  /**
   * 应用完整的反检测措施
   */
  static async applyAntiDetectionMeasures(page: Page): Promise<void> {
    // 1. 移除webdriver标识
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    });

    // 2. 模拟真实用户行为
    await this.simulateHumanBehavior(page);

    // 3. 设置随机视口
    await this.setRandomViewport(page);

    // 4. 注入用户行为模拟
    await this.injectUserBehaviorSimulation(page);
  }

  /**
   * 模拟人类行为模式
   */
  private static async simulateHumanBehavior(page: Page): Promise<void> {
    // 随机鼠标移动
    await page.mouse.move(Math.random() * 100, Math.random() * 100);

    // 模拟页面滚动
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 200);
    });

    // 随机停顿
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );
  }
}
```

#### 智能延迟系统

```typescript
export class DelayManager {
  /**
   * 计算智能延迟时间
   */
  static calculateDelay(
    action: "search" | "navigation" | "detail",
    config: FMTCConfig,
  ): number {
    const delayConfig = {
      search: { min: 500, max: 1500 },
      navigation: { min: 1000, max: 3000 },
      detail: { min: 2000, max: 5000 },
    };

    const { min, max } = delayConfig[action];
    return Math.random() * (max - min) + min;
  }

  /**
   * 执行智能延迟
   */
  static async delay(
    action: "search" | "navigation" | "detail",
    config: FMTCConfig,
  ): Promise<void> {
    const delayTime = this.calculateDelay(action, config);
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
}
```

## 后端集成设计

### 🔄 API架构设计

FMTC爬虫系统的后端采用分层架构设计，确保关注点分离和高度可维护性。

#### 核心API端点架构

```
apps/admin/src/app/api/
├── fmtc/                       # FMTC核心配置API
│   ├── config/route.ts         # 配置管理
│   ├── merchants/route.ts      # 商户基础操作
│   └── scraper/route.ts        # 爬虫任务触发
│
├── fmtc-merchants/             # 商户管理API群组
│   ├── route.ts                # 商户CRUD操作
│   ├── [id]/route.ts          # 单个商户操作
│   ├── brand-matching/route.ts # 品牌匹配管理
│   ├── export/route.ts         # 数据导出功能
│   ├── progress/               # 实时进度管理
│   │   └── [executionId]/route.ts
│   └── scraper/                # 爬虫管理接口
│       ├── route.ts            # 任务管理
│       ├── [taskId]/route.ts   # 任务操作
│       └── logs/stream/route.ts # 实时日志流
```

### 📊 数据库模型设计

#### 核心数据模型关系

```prisma
// 爬虫任务定义模型
model FMTCScraperTask {
  id              String   @id @default(cuid())
  name            String
  description     String?
  credentials     Json     // 加密存储的登录凭据
  config          Json     @default("{}")
  isEnabled       Boolean  @default(true)
  cronExpression  String?  // 定时任务配置
  lastExecutedAt  DateTime?
  nextExecuteAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关联执行记录
  executions      FMTCScraperExecution[]

  @@map("FMTCScraperTask")
}

// 任务执行记录模型
model FMTCScraperExecution {
  id                    String   @id @default(cuid())
  taskId                String
  status                ScraperTaskStatus @default(QUEUED)
  startedAt             DateTime?
  completedAt           DateTime?
  merchantsCount        Int      @default(0)
  newMerchantsCount     Int      @default(0)
  updatedMerchantsCount Int      @default(0)
  errorMessage          String?
  errorStack            String?
  metrics               Json?    // 执行指标数据
  createdAt             DateTime @default(now())

  // 关联任务定义
  task                  FMTCScraperTask @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("FMTCScraperExecution")
}

// 商户信息模型
model FMTCMerchant {
  id                   String   @id @default(cuid())
  name                 String
  fmtcId               String?  // FMTC内部ID
  country              String?
  network              String?
  homepage             String?
  description          String?
  primaryCategory      String?
  primaryCountry       String?

  // 媒体资源
  logo120x60           String?
  logo88x31            String?
  screenshot280x210    String?
  screenshot600x450    String?

  // 结构化数据
  networks             Json?    // 网络联盟信息数组
  affiliateLinks       Json?    // 联盟链接映射
  freshReachSupported  Boolean  @default(false)
  freshReachUrls       Json?

  // 元数据
  sourceUrl            String?  // 源页面URL
  lastScrapedAt        DateTime @default(now())
  isActive             Boolean  @default(true)
  rawData              Json?    // 原始抓取数据备份
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // 品牌关联
  brandId              String?
  brand                Brand?   @relation(fields: [brandId], references: [id], onDelete: SetNull)

  @@map("FMTCMerchant")
}
```

#### 数据关系说明

1. **一对多关系**: 一个爬虫任务可以有多次执行记录
2. **多对一关系**: 多个FMTC商户可以关联到一个品牌
3. **软删除策略**: 重要数据标记删除而非物理删除
4. **审计追踪**: 自动记录创建和更新时间

### 🔌 服务层架构

#### FMTCScraperService 核心服务

```typescript
export class FMTCScraperService {
  constructor(private db: PrismaClient) {}

  /**
   * 启动爬虫任务的完整流程
   */
  async startScrapingTask(taskId: string): Promise<FMTCScraperExecution> {
    // 1. 验证任务状态
    const task = await this.validateTask(taskId);

    // 2. 创建执行记录
    const execution = await this.createExecution(taskId);

    // 3. 异步执行爬虫任务
    this.executeScrapingTask(execution.id, task).catch(async (error) => {
      await this.handleExecutionError(execution.id, error);
    });

    return execution;
  }

  /**
   * 执行爬虫任务的核心逻辑
   */
  private async executeScrapingTask(
    executionId: string,
    task: FMTCScraperTask,
  ): Promise<void> {
    try {
      // 1. 更新执行状态
      await this.updateExecutionStatus(executionId, "RUNNING");

      // 2. 准备爬虫配置
      const scraperOptions: FMTCScraperOptions = {
        credentials: task.credentials as FMTCCredentials,
        maxPages: task.config.maxPages || 5,
        includeDetails: task.config.includeDetails !== false,
        headless: process.env.NODE_ENV === "production",
        config: task.config,
      };

      // 3. 执行爬虫
      const merchants = await fmtcScraper(scraperOptions, executionId);

      // 4. 处理抓取结果
      await this.processMerchantData(merchants, executionId);

      // 5. 更新完成状态
      await this.updateExecutionStatus(executionId, "COMPLETED", {
        merchantsCount: merchants.length,
        metrics: this.calculateMetrics(merchants),
      });
    } catch (error) {
      await this.handleExecutionError(executionId, error);
      throw error;
    }
  }

  /**
   * 处理商户数据的业务逻辑
   */
  private async processMerchantData(
    merchants: FMTCMerchantData[],
    executionId: string,
  ): Promise<void> {
    let newCount = 0;
    let updatedCount = 0;

    for (const merchantData of merchants) {
      try {
        // 检查商户是否已存在
        const existingMerchant = await this.db.fMTCMerchant.findFirst({
          where: {
            OR: [
              { fmtcId: merchantData.fmtcId },
              { name: merchantData.name, homepage: merchantData.homepage },
            ],
          },
        });

        if (existingMerchant) {
          // 更新现有商户
          await this.updateMerchant(existingMerchant.id, merchantData);
          updatedCount++;
        } else {
          // 创建新商户
          await this.createMerchant(merchantData);
          newCount++;
        }

        // 尝试品牌匹配
        await this.attemptBrandMatching(merchantData);
      } catch (error) {
        await this.logError(
          executionId,
          `处理商户数据失败: ${merchantData.name}`,
          error,
        );
      }
    }

    // 更新统计数据
    await this.updateExecutionCounts(executionId, newCount, updatedCount);
  }
}
```

### ⚡ Server-Sent Events 实时通信

#### SSE服务端实现

```typescript
// apps/admin/src/app/api/fmtc-merchants/progress/[executionId]/route.ts

// 维护活跃连接的全局状态
const activeConnections = new Map<string, ReadableStreamDefaultController>();
const progressData = new Map<string, any>();

/**
 * 建立SSE连接端点
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> },
) {
  const { executionId } = await params;

  // 创建SSE数据流
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // 发送连接确认消息
      const initialData = {
        type: "connected",
        executionId,
        timestamp: new Date().toISOString(),
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`),
      );

      // 存储控制器以便后续推送
      activeConnections.set(executionId, controller);

      // 监听客户端断开连接
      request.signal.addEventListener("abort", () => {
        activeConnections.delete(executionId);
        progressData.delete(executionId);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * 接收进度更新并推送给客户端
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> },
) {
  const { executionId } = await params;
  const progressUpdate = await request.json();

  // 存储进度数据
  progressData.set(executionId, progressUpdate);

  // 推送给对应的客户端
  const connection = activeConnections.get(executionId);
  if (connection) {
    const encoder = new TextEncoder();
    const data = {
      type: "progress",
      executionId,
      timestamp: new Date().toISOString(),
      ...progressUpdate,
    };

    try {
      connection.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (error) {
      // 连接已断开，清理资源
      activeConnections.delete(executionId);
      progressData.delete(executionId);
    }
  }

  return NextResponse.json({ success: true });
}
```

#### 批量抓取进度推送

```typescript
// 在批量爬虫中集成进度推送
export class FMTCBatchMerchantScraper {
  /**
   * 更新进度并推送到SSE
   */
  private async updateProgress(): Promise<void> {
    const total = this.tasks.size;
    const completed = this.completedTasks.length;
    const failed = this.failedTasks.length;
    const running = this.workers.filter((w) => w.isWorking).length;
    const pending = total - completed - failed - running;

    const progress: BatchProgress = {
      total,
      completed,
      failed,
      running,
      pending,
      percentage: Math.round(((completed + failed) / total) * 100),
      startTime: this.startTime,

      // 性能指标计算
      averageTimePerTask:
        completed > 0 ? (Date.now() - this.startTime.getTime()) / completed : 0,
      estimatedTimeRemaining: this.calculateEstimatedTime(pending),

      // 详细状态信息
      workers: this.workers.map((w) => ({
        id: w.id,
        isWorking: w.isWorking,
        currentTask: w.currentTask
          ? {
              id: w.currentTask.id,
              merchantName: w.currentTask.merchantName,
              status: w.currentTask.status,
              startTime: w.currentTask.startTime,
            }
          : null,
      })),

      // 最近完成/失败的任务
      recentCompletedTasks: this.completedTasks.slice(-3),
      recentFailedTasks: this.failedTasks.slice(-3),
    };

    // 推送实时进度到SSE端点
    await this.pushProgressToSSE(progress);
  }

  /**
   * 推送进度到SSE端点
   */
  private async pushProgressToSSE(progress: BatchProgress): Promise<void> {
    if (!this.options.executionId) return;

    try {
      await fetch(`/api/fmtc-merchants/progress/${this.options.executionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progress),
      });
    } catch (error) {
      // 静默处理SSE推送错误，不影响主流程
      console.warn("SSE进度推送失败:", error.message);
    }
  }
}
```

## 前端管理界面

### 🎨 React组件架构设计

前端管理界面采用现代化的React组件设计模式，注重用户体验和实时性。

#### 核心组件结构

```
apps/admin/src/components/fmtc-merchants/
├── FMTCMerchantsDataTable.tsx    # 商户数据表格主组件
├── FMTCMerchantDetailModal.tsx   # 商户详情模态框
├── FMTCMerchantExportButton.tsx  # 数据导出功能
├── FMTCBrandMatchingPanel.tsx    # 品牌匹配管理
├── FMTCScraperPanel.tsx          # 爬虫任务管理面板
└── FMTCRealtimeLogsViewer.tsx    # 实时日志查看器
```

### 📊 数据表格组件详解

#### FMTCMerchantsDataTable 核心实现

```typescript
export function FMTCMerchantsDataTable() {
  // 状态管理
  const [merchants, setMerchants] = useState<FMTCMerchant[]>([]);
  const [filteredData, setFilteredData] = useState<FMTCMerchant[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // 实时进度状态
  const [progressState, setProgressState] = useState({
    isActive: false,
    percentage: 0,
    total: 0,
    completed: 0,
    failed: 0,
    workers: [],
    estimatedTimeRemaining: 0,
  });

  // 分页状态
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  /**
   * 建立SSE连接监听批量抓取进度
   */
  const establishSSEConnection = useCallback((executionId: string) => {
    const eventSource = new EventSource(
      `/api/fmtc-merchants/progress/${executionId}`
    );

    // 连接确认
    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      setProgressState(prev => ({ ...prev, isActive: true }));
      toast.success('已连接到实时进度流');
    });

    // 进度更新
    eventSource.addEventListener('progress', (event) => {
      const progress = JSON.parse(event.data);
      setProgressState({
        isActive: true,
        percentage: progress.percentage,
        total: progress.total,
        completed: progress.completed,
        failed: progress.failed,
        workers: progress.workers,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
      });
    });

    // 完成通知
    eventSource.addEventListener('completed', (event) => {
      const result = JSON.parse(event.data);
      setProgressState(prev => ({ ...prev, isActive: false }));

      toast.success(
        `批量刷新完成！成功: ${result.summary.successfulTasks}, 失败: ${result.summary.failedTasks}`
      );

      // 刷新数据表
      refetch();
      eventSource.close();
    });

    return eventSource;
  }, []);

  /**
   * 批量刷新处理函数
   */
  const handleBatchRefresh = async () => {
    const selectedIds = Array.from(rowSelection)
      .map(index => filteredData[parseInt(index)]?.id)
      .filter(Boolean);

    if (selectedIds.length === 0) {
      toast.error('请选择要刷新的商户');
      return;
    }

    try {
      const response = await fetch('/api/fmtc-merchants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: 'batch_refresh_data',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 建立SSE连接监听进度
        const eventSource = establishSSEConnection(result.data.executionId);

        toast.success(
          `已启动高效批量抓取，使用${result.data.concurrency}个并发工作线程`
        );
      } else {
        toast.error(result.error || '批量刷新失败');
      }
    } catch (error) {
      toast.error('批量刷新请求失败');
    }
  };

  // 表格列定义
  const columns: ColumnDef<FMTCMerchant>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: '商户名称',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.logo120x60} />
            <AvatarFallback>
              {row.original.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'country',
      header: '国家/地区',
      cell: ({ row }) => (
        <Badge variant="outline" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {row.original.country || '未知'}
        </Badge>
      ),
    },
    {
      accessorKey: 'network',
      header: '联盟网络',
      cell: ({ row }) => {
        const networks = Array.isArray(row.original.networks)
          ? row.original.networks
          : [];

        return (
          <div className="flex flex-wrap gap-1">
            {networks.slice(0, 2).map((network, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {network.networkName}
              </Badge>
            ))}
            {networks.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{networks.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'brand',
      header: '关联品牌',
      cell: ({ row }) => {
        const brand = row.original.brand;
        return brand ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={brand.logo} />
              <AvatarFallback className="text-xs">
                {brand.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{brand.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">未匹配</span>
        );
      },
    },
    {
      accessorKey: 'lastScrapedAt',
      header: '最后更新',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {formatDistanceToNow(new Date(row.original.lastScrapedAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetail(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRefreshSingle(row.original.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新数据
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 实时进度显示 */}
      {progressState.isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>批量刷新进行中</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progressState.percentage} className="w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progressState.completed}
                  </div>
                  <div className="text-sm text-muted-foreground">已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {progressState.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">失败</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progressState.workers.filter(w => w.isWorking).length}
                  </div>
                  <div className="text-sm text-muted-foreground">工作中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(progressState.estimatedTimeRemaining / 1000)}s
                  </div>
                  <div className="text-sm text-muted-foreground">预计剩余</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleBatchRefresh}
            disabled={Object.keys(rowSelection).length === 0 || progressState.isActive}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>批量刷新数据</span>
          </Button>

          <FMTCMerchantExportButton selectedIds={getSelectedIds()} />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={String(paginationState.pageSize)}
            onValueChange={(value) =>
              setPaginationState(prev => ({ ...prev, pageSize: Number(value) }))
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 数据表格 */}
      <Card>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 分页组件 */}
      <CustomPagination
        currentPage={paginationState.pageIndex + 1}
        totalPages={Math.ceil(filteredData.length / paginationState.pageSize)}
        onPageChange={(page) =>
          setPaginationState(prev => ({ ...prev, pageIndex: page - 1 }))
        }
      />
    </div>
  );
}
```

### 📺 实时日志查看器

#### FMTCRealtimeLogsViewer 组件实现

```typescript
export function FMTCRealtimeLogsViewer({
  executionId,
  taskName,
  onClose,
  onStatusChange,
}: FMTCRealtimeLogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  /**
   * 建立SSE连接获取实时日志
   */
  const establishConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('CONNECTING');

    const eventSource = new EventSource(
      `/api/admin/scraper-tasks/logs/stream?executionId=${executionId}&level=INFO`
    );

    // 连接建立
    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      setConnectionStatus('CONNECTED');
    });

    // 接收日志数据
    eventSource.addEventListener('logs', (event) => {
      if (isPaused) return;

      const newLogs = JSON.parse(event.data) as LogEntry[];
      setLogs(prev => [...prev, ...newLogs]);

      // 自动滚动到底部
      if (autoScroll && scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    });

    // 状态更新
    eventSource.addEventListener('status', (event) => {
      const data = JSON.parse(event.data);
      onStatusChange?.(data.status);

      if (data.isFinished) {
        setConnectionStatus('DISCONNECTED');
        eventSource.close();
      }
    });

    // 错误处理
    eventSource.addEventListener('error', (event) => {
      setConnectionStatus('ERROR');
      console.error('SSE连接错误:', event);
    });

    eventSourceRef.current = eventSource;
  }, [executionId, isPaused, autoScroll, onStatusChange]);

  // 组件初始化建立连接
  useEffect(() => {
    establishConnection();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [establishConnection]);

  /**
   * 过滤日志条目
   */
  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return logs;
    return logs.filter(log => log.level === filterLevel);
  }, [logs, filterLevel]);

  /**
   * 导出日志为JSON文件
   */
  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `fmtc-logs-${executionId}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  /**
   * 获取日志级别对应的图标和颜色
   */
  const getLogLevelIcon = (level: ScraperLogLevel) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
      case 'DEBUG':
        return <InfoIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <InfoIcon className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">实时日志</CardTitle>
            {/* 连接状态指示器 */}
            <div className="flex items-center space-x-1">
              {connectionStatus === 'CONNECTED' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {connectionStatus === 'CONNECTED' ? '已连接' : '连接中断'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 日志级别过滤 */}
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="ERROR">错误</SelectItem>
                <SelectItem value="WARN">警告</SelectItem>
                <SelectItem value="INFO">信息</SelectItem>
                <SelectItem value="DEBUG">调试</SelectItem>
              </SelectContent>
            </Select>

            {/* 控制按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 控制开关 */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
            />
            <Label htmlFor="auto-scroll" className="text-sm">自动滚动</Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className="flex items-start space-x-3 p-2 rounded-lg bg-muted/30"
              >
                {/* 日志级别图标 */}
                <div className="flex-shrink-0 mt-0.5">
                  {getLogLevelIcon(log.level)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 时间戳和级别 */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDateTime(log.timestamp)}
                    </span>
                    <Badge
                      variant={log.level === 'ERROR' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {log.level}
                    </Badge>
                  </div>

                  {/* 日志消息 */}
                  <div className="text-sm break-words">
                    {log.message}
                  </div>

                  {/* 上下文信息 */}
                  {log.context && (
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="context" className="border-none">
                        <AccordionTrigger className="text-xs py-1 hover:no-underline">
                          查看上下文
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {isPaused ? '日志已暂停' : '等待日志数据...'}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

## 开发环境搭建

### 🛠️ 环境要求

#### 系统要求

- **操作系统**: macOS 10.15+, Ubuntu 18.04+, Windows 10+
- **Node.js**: 18.17.0+ (推荐使用 LTS 版本)
- **pnpm**: 10.11.0+
- **PostgreSQL**: 14.0+
- **Git**: 2.30.0+

#### 浏览器要求 (用于Playwright)

- **Chromium**: 自动下载 (Playwright管理)
- **内存要求**: 至少8GB RAM (推荐16GB)
- **磁盘空间**: 至少10GB可用空间

### 🚀 快速开始

#### 1. 克隆和安装

```bash
# 克隆项目
git clone https://github.com/your-org/TrendHub.git
cd TrendHub

# 安装依赖 (使用pnpm workspace)
pnpm install

# 检查环境
pnpm run check:env
```

#### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env
cp apps/admin/.env.example apps/admin/.env

# 编辑环境变量文件
vim apps/admin/.env
```

**核心环境变量配置**:

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/trendhub"

# FMTC登录凭据
FMTC_USERNAME="your-fmtc-email@example.com"
FMTC_PASSWORD="your-fmtc-password"

# 2captcha API (用于reCAPTCHA自动识对)
TWOCAPTCHA_API_KEY="your-2captcha-api-key"

# 爬虫配置
FMTC_MAX_PAGES=10
FMTC_ENABLE_DETAIL_SCRAPING=true
FMTC_MAX_DETAILS_PER_PAGE=5
FMTC_SESSION_MAX_AGE=14400000  # 4小时

# 开发模式配置
FMTC_HEADLESS_MODE=false       # 开发时显示浏览器
FMTC_DEBUG_MODE=true           # 启用详细日志
NODE_ENV=development

# Auth.js配置
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3001"

# 文件存储 (可选)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

#### 3. 数据库设置

```bash
# 启动PostgreSQL (使用Docker)
docker-compose up postgres -d

# 或者使用本地PostgreSQL
# createdb trendhub

# 推送数据库架构
cd apps/admin
pnpm db:push

# 运行种子数据 (可选)
pnpm db:seed

# 查看数据库 (可选)
pnpm db:studio
```

#### 4. 构建爬虫包

```bash
# 构建scraper包
cd packages/scraper
pnpm build

# 验证构建
pnpm test:build
```

#### 5. 启动开发服务器

```bash
# 回到项目根目录
cd ../../

# 启动所有服务 (并行启动)
pnpm dev

# 或者分别启动
pnpm dev:admin   # 管理后台 - http://localhost:3001
pnpm dev:web     # 用户界面 - http://localhost:3000
```

### 🧪 验证安装

#### 基础功能测试

```bash
# 1. 测试数据库连接
cd apps/admin
pnpm db:check

# 2. 测试爬虫选择器
cd ../../packages/scraper
npx tsx src/test/fmtc/simple-test.ts selectors

# 3. 测试FMTC登录功能
npx tsx src/test/fmtc/standalone-login-test.ts

# 4. 测试完整抓取流程 (需要有效凭据)
npx tsx src/test/fmtc/complete-search-test.ts
```

#### 访问应用

- **管理后台**: http://localhost:3001

  - 默认账号: admin@example.com
  - 默认密码: admin123

- **用户界面**: http://localhost:3000

- **API文档**: http://localhost:3001/api (Swagger UI)

### ⚙️ 开发工具配置

#### VS Code 扩展推荐

创建 `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code 设置

创建 `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### Git 钩子配置

项目已配置Husky钩子，确保代码质量:

```bash
# 安装git钩子
pnpm prepare

# 验证pre-commit钩子
git add . && git commit -m "test commit"
```

### 🐛 调试配置

#### 调试FMTC爬虫

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug FMTC Scraper",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/scraper/src/test/fmtc/standalone-login-test.ts",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "cwd": "${workspaceFolder}/packages/scraper",
      "env": {
        "FMTC_HEADLESS_MODE": "false",
        "FMTC_DEBUG_MODE": "true",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Admin API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/admin/src/app/api/fmtc-merchants/route.ts",
      "runtimeExecutable": "node",
      "cwd": "${workspaceFolder}/apps/admin",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### 浏览器调试

```typescript
// 在爬虫代码中添加调试断点
await page.pause(); // Playwright调试器
debugger; // Node.js调试器

// 启用浏览器开发者工具
const browser = await chromium.launch({
  headless: false,
  devtools: true, // 自动打开开发者工具
  slowMo: 1000, // 放慢操作速度
});
```

### 📊 性能监控

#### 开发时监控

```bash
# 监控内存使用
pnpm run monitor:memory

# 监控数据库连接
pnpm run monitor:db

# 监控爬虫性能
pnpm run monitor:scraper
```

#### 日志管理

```bash
# 查看实时日志
tail -f logs/scraper.log
tail -f logs/api.log

# 按级别过滤日志
grep "ERROR" logs/scraper.log
grep "WARN" logs/api.log
```

### 🔧 故障排除

#### 常见问题

1. **Playwright安装失败**

   ```bash
   # 手动安装浏览器
   npx playwright install chromium

   # 安装系统依赖 (Ubuntu)
   npx playwright install-deps
   ```

2. **数据库连接失败**

   ```bash
   # 检查PostgreSQL状态
   docker-compose logs postgres

   # 重置数据库
   pnpm db:reset
   ```

3. **端口占用**

   ```bash
   # 查找占用端口的进程
   lsof -i :3001
   lsof -i :3000

   # 终止进程
   kill -9 PID
   ```

4. **依赖安装问题**
   ```bash
   # 清理缓存
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

#### 调试技巧

1. **启用详细日志**

   ```bash
   DEBUG=fmtc:* pnpm dev:admin
   ```

2. **数据库查询调试**

   ```typescript
   // 在Prisma查询中启用日志
   const prisma = new PrismaClient({
     log: ["query", "info", "warn", "error"],
   });
   ```

3. **网络请求调试**
   ```typescript
   // 在爬虫中拦截网络请求
   page.on("request", (request) => {
     console.log("Request:", request.url());
   });
   ```

这个开发环境搭建指南提供了从零开始设置FMTC爬虫系统的完整流程。按照这些步骤，开发者可以快速搭建起完整的开发环境并开始进行功能开发和调试。
