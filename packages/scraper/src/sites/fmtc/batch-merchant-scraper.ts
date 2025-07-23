/**
 * FMTC Batch Merchant Scraper
 * 高性能批量商户抓取器，支持并发处理和会话复用
 */

import { log as crawleeLog, LogLevel } from "crawlee";
import { type BrowserContext, chromium, type Page } from "playwright";
import * as path from "path";
import cuid from "cuid";
import type { FMTCMerchantData } from "@repo/types";
import { createSessionManager, type SessionConfig } from "./session-manager.js";
import {
  ensureDirectoryExists,
  LocalScraperLogLevel,
  sendLogToBackend,
} from "../../utils.js";
import { type FMTCConfig, getRecaptchaConfigFromParams } from "./config.js";
import { FMTCLoginHandler } from "./login-handler.js";
import { FMTCNavigationHandler } from "./navigation-handler.js";

/**
 * 批量抓取任务状态
 */
export enum BatchTaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * 单个商户抓取任务
 */
export interface MerchantTask {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantUrl: string;
  status: BatchTaskStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: FMTCMerchantData;
  retryCount: number;
}

/**
 * 批量抓取选项
 */
export interface BatchScrapingOptions {
  merchantTasks: Array<{
    merchantId: string;
    merchantName: string;
    merchantUrl: string;
  }>;
  credentials: {
    username: string;
    password: string;
  };
  config?: FMTCConfig;
  concurrency?: number; // 并发数，默认2
  downloadImages?: boolean;
  executionId?: string;
  progressCallback?: (progress: BatchProgress) => void;
  onTaskComplete?: (task: MerchantTask) => void;
  onTaskFailed?: (task: MerchantTask) => void;
}

/**
 * 批量抓取进度
 */
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  percentage: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
  averageTimePerTask?: number;
}

/**
 * 批量抓取结果
 */
export interface BatchScrapingResult {
  success: boolean;
  total: number;
  completed: number;
  failed: number;
  completedTasks: MerchantTask[];
  failedTasks: MerchantTask[];
  totalTime: number;
  averageTimePerTask: number;
  error?: string;
}

/**
 * 工作线程状态
 */
interface WorkerState {
  id: string;
  isWorking: boolean;
  currentTask?: MerchantTask;
  page?: Page;
}

/**
 * FMTC 批量商户抓取器
 */
export class FMTCBatchMerchantScraper {
  private options: BatchScrapingOptions;
  private tasks: Map<string, MerchantTask> = new Map();
  private workers: WorkerState[] = [];
  private context?: BrowserContext;
  private sessionManager?: import("./session-manager.js").FMTCSessionManager;
  private loginHandler?: FMTCLoginHandler;
  private navigationHandler?: FMTCNavigationHandler;
  private startTime: Date;
  private isRunning = false;
  private isCancelled = false;
  private completedTasks: MerchantTask[] = [];
  private failedTasks: MerchantTask[] = [];
  private runSpecificStorageDir: string = "";

  constructor(options: BatchScrapingOptions) {
    this.options = {
      concurrency: 2, // 默认并发数
      downloadImages: false,
      ...options,
    };
    this.startTime = new Date();

    // 设置日志级别
    crawleeLog.setLevel(LogLevel.WARNING);

    // 初始化任务列表
    this.initializeTasks();

    // 设置存储目录
    this.setupStorageDirectory();
  }

  /**
   * 初始化任务列表
   */
  private initializeTasks(): void {
    this.options.merchantTasks.forEach((merchantData) => {
      const task: MerchantTask = {
        id: cuid(),
        merchantId: merchantData.merchantId,
        merchantName: merchantData.merchantName,
        merchantUrl: merchantData.merchantUrl,
        status: BatchTaskStatus.PENDING,
        retryCount: 0,
      };
      this.tasks.set(task.id, task);
    });
  }

  /**
   * 设置存储目录
   */
  private setupStorageDirectory(): void {
    const baseStorageDir = path.resolve(process.cwd(), "scraper_storage_runs");
    const executionId = this.options.executionId || cuid();
    this.runSpecificStorageDir = path.join(
      baseStorageDir,
      "FMTC",
      "batch_merchants",
      executionId,
    );

    // 创建必需的目录
    ensureDirectoryExists(
      path.join(this.runSpecificStorageDir, "request_queues", "default"),
      crawleeLog,
    );
    ensureDirectoryExists(
      path.join(this.runSpecificStorageDir, "datasets", "default"),
      crawleeLog,
    );
    ensureDirectoryExists(
      path.join(this.runSpecificStorageDir, "key_value_stores", "default"),
      crawleeLog,
    );

    process.env.CRAWLEE_STORAGE_DIR = this.runSpecificStorageDir;
  }

  /**
   * 初始化共享浏览器上下文
   */
  private async initializeBrowserContext(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.INFO, "初始化共享浏览器上下文");

    const browser = await chromium.launch({
      headless: this.options.config?.headlessMode ?? true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    this.context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });

    // 创建会话管理器
    const sessionConfig: Partial<SessionConfig> = {
      sessionFile: `fmtc-batch-session-${this.options.credentials.username.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      maxAge:
        this.options.config?.sessionMaxAge ??
        this.options.config?.sessionTimeout ??
        4 * 60 * 60 * 1000,
      autoSave: true,
      useDatabase: this.options.config?.useDatabase ?? true,
      fallbackToFile: this.options.config?.fallbackToFile ?? true,
    };

    this.sessionManager = createSessionManager(crawleeLog, sessionConfig);

    // 尝试恢复之前保存的会话
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "尝试恢复已保存的会话");
      const savedSessionState = await this.sessionManager.loadSessionStateAsync(
        this.options.credentials.username,
      );

      if (savedSessionState && this.context) {
        // 手动应用会话状态到浏览器上下文
        try {
          const storageState = savedSessionState as {
            cookies?: Array<{
              name: string;
              value: string;
              domain: string;
              path: string;
              expires?: number;
              httpOnly?: boolean;
              secure?: boolean;
              sameSite?: "Strict" | "Lax" | "None";
            }>;
            origins?: Array<{
              origin: string;
              localStorage?: Array<{ name: string; value: string }>;
            }>;
          };

          // 添加 cookies
          if (storageState.cookies && storageState.cookies.length > 0) {
            await this.context.addCookies(storageState.cookies);
          }

          // 对于localStorage，我们需要在页面加载时设置
          // 这里先记录会话状态已恢复
          await this.logMessage(
            LocalScraperLogLevel.INFO,
            "数据库会话状态已恢复",
            {
              cookiesCount: storageState.cookies?.length || 0,
              originsCount: storageState.origins?.length || 0,
            },
          );
        } catch (sessionError) {
          await this.logMessage(LocalScraperLogLevel.WARN, "应用会话状态失败", {
            error:
              sessionError instanceof Error
                ? sessionError.message
                : String(sessionError),
          });
        }
      } else {
        await this.logMessage(
          LocalScraperLogLevel.INFO,
          "未找到保存的会话状态",
        );
      }

      await this.logMessage(LocalScraperLogLevel.INFO, "会话恢复完成");
    } catch (error) {
      await this.logMessage(
        LocalScraperLogLevel.WARN,
        "会话恢复失败，将重新登录",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }

    // 初始化登录和导航处理器
    await this.initializeHandlers();
  }

  /**
   * 初始化登录和导航处理器
   */
  private async initializeHandlers(): Promise<void> {
    if (!this.context) {
      throw new Error("浏览器上下文未初始化");
    }

    // 创建第一个页面用于登录处理器
    const loginPage = await this.context.newPage();

    // 初始化配置
    const config = this.options.config || {};
    const recaptchaConfig = getRecaptchaConfigFromParams(config);

    // 创建登录处理器
    this.loginHandler = new FMTCLoginHandler(
      loginPage,
      crawleeLog,
      this.options.executionId,
      recaptchaConfig,
    );

    // 创建导航处理器
    this.navigationHandler = new FMTCNavigationHandler(loginPage, crawleeLog);

    await this.logMessage(
      LocalScraperLogLevel.INFO,
      "登录和导航处理器初始化完成",
    );
  }

  /**
   * 初始化工作线程
   */
  private async initializeWorkers(): Promise<void> {
    const concurrency = Math.min(
      this.options.concurrency || 2,
      this.tasks.size,
    );

    await this.logMessage(
      LocalScraperLogLevel.INFO,
      `初始化${concurrency}个工作线程`,
    );

    for (let i = 0; i < concurrency; i++) {
      const worker: WorkerState = {
        id: `worker-${i + 1}`,
        isWorking: false,
      };

      // 为每个工作线程创建独立页面
      if (this.context) {
        worker.page = await this.context.newPage();
        await this.logMessage(
          LocalScraperLogLevel.DEBUG,
          `工作线程 ${worker.id} 页面创建完成`,
        );
      }

      this.workers.push(worker);
    }
  }

  /**
   * 执行批量抓取
   */
  async executeBatchScraping(): Promise<BatchScrapingResult> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "开始批量商户抓取", {
        totalTasks: this.tasks.size,
        concurrency: this.options.concurrency,
      });

      this.isRunning = true;
      this.startTime = new Date();

      // 推送开始状态
      await this.pushStartStatus();

      // 初始化浏览器和工作线程
      await this.initializeBrowserContext();
      await this.initializeWorkers();

      // 执行第一次登录（使用第一个工作线程）
      if (this.workers.length > 0 && this.workers[0].page) {
        await this.performInitialLogin(this.workers[0].page);
      }

      // 启动工作线程处理任务
      const workerPromises = this.workers.map((worker) =>
        this.runWorker(worker),
      );

      // 等待所有工作线程完成
      await Promise.all(workerPromises);

      const endTime = new Date();
      const totalTime = endTime.getTime() - this.startTime.getTime();

      const result: BatchScrapingResult = {
        success: this.failedTasks.length === 0,
        total: this.tasks.size,
        completed: this.completedTasks.length,
        failed: this.failedTasks.length,
        completedTasks: this.completedTasks,
        failedTasks: this.failedTasks,
        totalTime,
        averageTimePerTask:
          this.completedTasks.length > 0
            ? totalTime / this.completedTasks.length
            : 0,
      };

      await this.logMessage(LocalScraperLogLevel.INFO, "批量抓取完成", {
        result: {
          total: result.total,
          completed: result.completed,
          failed: result.failed,
          totalTime: Math.round(totalTime / 1000) + "秒",
          averageTimePerTask:
            Math.round(result.averageTimePerTask / 1000) + "秒",
        },
      });

      // 推送完成状态
      await this.pushCompletionStatus(result);

      return result;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "批量抓取失败", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 执行初始登录 - 使用标准的FMTCLoginHandler
   */
  private async performInitialLogin(page: Page): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.INFO, "执行初始登录");

    if (!this.loginHandler || !this.navigationHandler) {
      throw new Error("登录和导航处理器未初始化");
    }

    try {
      // 先导航到仪表盘页面，然后检查登录状态
      await this.logMessage(
        LocalScraperLogLevel.INFO,
        "导航到仪表盘检查登录状态",
      );

      const loginPage = this.workers[0]?.page;
      if (loginPage) {
        try {
          await loginPage.goto("https://account.fmtc.co/cp/dash", {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 等待页面稳定

          // 检查是否已经登录
          const isLoggedIn = await this.loginHandler.isLoggedIn();

          if (isLoggedIn) {
            await this.logMessage(
              LocalScraperLogLevel.INFO,
              "检测到有效登录状态，无需重新登录",
            );
            return;
          } else {
            await this.logMessage(
              LocalScraperLogLevel.INFO,
              "未检测到有效登录状态，需要重新登录",
            );
          }
        } catch (navError) {
          await this.logMessage(
            LocalScraperLogLevel.WARN,
            "导航到仪表盘失败，可能需要重新登录",
            {
              error:
                navError instanceof Error ? navError.message : String(navError),
            },
          );
        }
      }

      // 执行登录流程
      await this.logMessage(LocalScraperLogLevel.INFO, "开始执行完整登录流程");

      const loginResult = await this.loginHandler.login({
        username: this.options.credentials.username,
        password: this.options.credentials.password,
      });

      if (!loginResult.success) {
        throw new Error(`登录失败: ${loginResult.error || "未知错误"}`);
      }

      await this.logMessage(
        LocalScraperLogLevel.INFO,
        "登录成功，批量抓取器无需导航，直接准备抓取商户详情",
      );

      // 保存会话状态
      if (this.sessionManager?.shouldSaveSession()) {
        await this.sessionManager.saveSessionState(
          this.context!,
          this.options.credentials.username,
        );
        await this.logMessage(LocalScraperLogLevel.INFO, "会话状态已保存");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.logMessage(LocalScraperLogLevel.ERROR, "登录流程失败", {
        error: errorMessage,
        currentUrl: page.url(),
      });

      throw new Error(`登录失败: ${errorMessage}`);
    }
  }

  /**
   * 工作线程运行逻辑
   */
  private async runWorker(worker: WorkerState): Promise<void> {
    await this.logMessage(
      LocalScraperLogLevel.DEBUG,
      `工作线程 ${worker.id} 开始工作`,
    );

    while (this.isRunning && !this.isCancelled) {
      const task = this.getNextPendingTask();

      if (!task) {
        // 没有更多任务，等待或退出
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      worker.isWorking = true;
      worker.currentTask = task;
      task.status = BatchTaskStatus.RUNNING;
      task.startTime = new Date();

      try {
        await this.logMessage(
          LocalScraperLogLevel.INFO,
          `工作线程 ${worker.id} 开始处理商户: ${task.merchantName}`,
        );

        const result = await this.scrapeSingleMerchant(worker, task);

        if (result) {
          task.result = result;
          task.status = BatchTaskStatus.COMPLETED;
          task.endTime = new Date();
          this.completedTasks.push(task);

          await this.logMessage(
            LocalScraperLogLevel.INFO,
            `工作线程 ${worker.id} 完成商户: ${task.merchantName}`,
          );

          this.options.onTaskComplete?.(task);
        } else {
          throw new Error("抓取返回空结果");
        }
      } catch (error) {
        task.status = BatchTaskStatus.FAILED;
        task.endTime = new Date();
        task.error = error instanceof Error ? error.message : String(error);
        this.failedTasks.push(task);

        await this.logMessage(
          LocalScraperLogLevel.ERROR,
          `工作线程 ${worker.id} 处理商户失败: ${task.merchantName}`,
          { error: error instanceof Error ? error.message : String(error) },
        );

        this.options.onTaskFailed?.(task);
      }

      worker.isWorking = false;
      worker.currentTask = undefined;

      // 更新进度（异步）
      await this.updateProgress();

      // 添加任务间隔延迟（批量模式优化：较短延迟）
      const delay = this.getBatchModeDelay();
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await this.logMessage(
      LocalScraperLogLevel.DEBUG,
      `工作线程 ${worker.id} 结束工作`,
    );
  }

  /**
   * 获取下一个待处理任务
   */
  private getNextPendingTask(): MerchantTask | null {
    for (const task of this.tasks.values()) {
      if (task.status === BatchTaskStatus.PENDING) {
        return task;
      }
    }
    return null;
  }

  /**
   * 抓取单个商户（使用共享会话）
   */
  private async scrapeSingleMerchant(
    worker: WorkerState,
    task: MerchantTask,
  ): Promise<FMTCMerchantData | null> {
    if (!worker.page) {
      throw new Error("工作线程页面未初始化");
    }

    const page = worker.page;

    // 导航到商户页面
    await page.goto(task.merchantUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 直接使用商户详情处理器
    const { FMTCMerchantDetailHandler } = await import(
      "./merchant-detail-handler.js"
    );

    const detailHandler = new FMTCMerchantDetailHandler(
      page,
      crawleeLog,
      this.options.executionId,
      this.options.downloadImages ? this.runSpecificStorageDir : undefined,
    );

    // 提取商户详情数据
    const detailResult = await detailHandler.scrapeMerchantDetails(
      task.merchantUrl,
      task.merchantName,
    );

    if (!detailResult.success || !detailResult.merchantDetail) {
      throw new Error("商户数据提取失败");
    }

    // 将详情数据转换为完整的商户数据格式
    const merchantData: FMTCMerchantData = {
      name: task.merchantName, // 使用任务中的商户名称
      sourceUrl: task.merchantUrl, // 设置源URL
      ...detailResult.merchantDetail, // 合并详情数据
    };

    return merchantData;
  }

  /**
   * 获取批量模式延迟（优化后的较短延迟）
   */
  private getBatchModeDelay(): number {
    const minDelay = this.options.config?.searchMinDelay ?? 500;
    const maxDelay = this.options.config?.searchMaxDelay ?? 1500;
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  /**
   * 更新进度并推送到SSE
   */
  private async updateProgress(): Promise<void> {
    const total = this.tasks.size;
    const completed = this.completedTasks.length;
    const failed = this.failedTasks.length;
    const running = this.workers.filter((w) => w.isWorking).length;
    const pending = total - completed - failed - running;

    const currentTime = new Date();
    const elapsedTime = currentTime.getTime() - this.startTime.getTime();
    const averageTimePerTask = completed > 0 ? elapsedTime / completed : 0;
    const estimatedTimeRemaining =
      pending > 0 && averageTimePerTask > 0
        ? (pending * averageTimePerTask) / this.workers.length
        : undefined;

    const progress: BatchProgress = {
      total,
      completed,
      failed,
      running,
      pending,
      percentage: Math.round(((completed + failed) / total) * 100),
      startTime: this.startTime,
      averageTimePerTask,
      estimatedTimeRemaining,
    };

    // 调用原有的回调
    this.options.progressCallback?.(progress);

    // 推送实时进度到SSE
    await this.pushProgressToSSE(progress);
  }

  /**
   * 推送进度到SSE端点
   */
  private async pushProgressToSSE(progress: BatchProgress): Promise<void> {
    if (!this.options.executionId) return;

    try {
      // 准备详细的进度数据
      const progressData = {
        ...progress,
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
        recentCompletedTasks: this.completedTasks.slice(-3).map((t) => ({
          id: t.id,
          merchantName: t.merchantName,
          duration:
            t.endTime && t.startTime
              ? t.endTime.getTime() - t.startTime.getTime()
              : 0,
        })),
        recentFailedTasks: this.failedTasks.slice(-3).map((t) => ({
          id: t.id,
          merchantName: t.merchantName,
          error: t.error,
        })),
      };

      // 内部API调用推送进度 - 使用完整URL
      const baseUrl = process.env.ADMIN_API_URL || "http://localhost:3001";
      const progressUrl = `${baseUrl}/api/fmtc-merchants/progress/${this.options.executionId}`;

      await fetch(progressUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressData),
      }).catch((error) => {
        // 处理SSE推送错误，记录详细信息以便调试
        this.logMessage(LocalScraperLogLevel.WARN, "SSE进度推送失败", {
          url: progressUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    } catch {
      // 静默处理错误，不影响主要抓取流程
      this.logMessage(LocalScraperLogLevel.WARN, "SSE进度推送出错");
    }
  }

  /**
   * 取消批量抓取
   */
  async cancel(): Promise<void> {
    await this.logMessage(LocalScraperLogLevel.INFO, "取消批量抓取");
    this.isCancelled = true;
    this.isRunning = false;
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    try {
      await this.logMessage(LocalScraperLogLevel.INFO, "清理资源");

      // 关闭所有页面
      for (const worker of this.workers) {
        if (worker.page) {
          await worker.page.close().catch(() => {});
        }
      }

      // 关闭浏览器上下文
      if (this.context) {
        await this.context.close().catch(() => {});
      }

      this.isRunning = false;
    } catch (error) {
      await this.logMessage(LocalScraperLogLevel.ERROR, "清理资源时出错", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 推送开始状态
   */
  private async pushStartStatus(): Promise<void> {
    if (!this.options.executionId) return;

    try {
      const startData = {
        type: "started",
        total: this.tasks.size,
        concurrency: this.options.concurrency,
        startTime: this.startTime,
        workers: this.workers.map((w) => ({ id: w.id, isWorking: false })),
      };

      const baseUrl = process.env.ADMIN_API_URL || "http://localhost:3001";
      const progressUrl = `${baseUrl}/api/fmtc-merchants/progress/${this.options.executionId}`;

      await fetch(progressUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(startData),
      }).catch((error) => {
        this.logMessage(LocalScraperLogLevel.WARN, "SSE开始状态推送失败", {
          url: progressUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    } catch {
      // 静默处理错误
    }
  }

  /**
   * 推送完成状态
   */
  private async pushCompletionStatus(
    result: BatchScrapingResult,
  ): Promise<void> {
    if (!this.options.executionId) return;

    try {
      const completionData = {
        type: "completed",
        result,
        endTime: new Date(),
        summary: {
          totalTasks: result.total,
          successfulTasks: result.completed,
          failedTasks: result.failed,
          totalTimeSeconds: Math.round(result.totalTime / 1000),
          averageTimePerTaskSeconds: Math.round(
            result.averageTimePerTask / 1000,
          ),
          concurrency: this.options.concurrency,
          speedImprovement: `使用${this.options.concurrency}个并发工作线程`,
        },
      };

      const baseUrl = process.env.ADMIN_API_URL || "http://localhost:3001";
      const progressUrl = `${baseUrl}/api/fmtc-merchants/progress/${this.options.executionId}`;

      await fetch(progressUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionData),
      }).catch((error) => {
        this.logMessage(LocalScraperLogLevel.WARN, "SSE完成状态推送失败", {
          url: progressUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    } catch {
      // 静默处理错误
    }
  }

  /**
   * 记录日志
   */
  private async logMessage(
    level: LocalScraperLogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (this.options.executionId) {
      await sendLogToBackend(this.options.executionId, level, message, data);
    }

    const logFunc =
      level === LocalScraperLogLevel.ERROR
        ? console.error
        : level === LocalScraperLogLevel.WARN
          ? console.warn
          : console.log;

    logFunc(`[BatchScraper] ${message}`, data || "");
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isRunning: boolean;
    progress: BatchProgress;
    workers: Array<{
      id: string;
      isWorking: boolean;
      currentTaskName?: string;
    }>;
  } {
    return {
      isRunning: this.isRunning,
      progress: {
        total: this.tasks.size,
        completed: this.completedTasks.length,
        failed: this.failedTasks.length,
        running: this.workers.filter((w) => w.isWorking).length,
        pending:
          this.tasks.size -
          this.completedTasks.length -
          this.failedTasks.length -
          this.workers.filter((w) => w.isWorking).length,
        percentage: Math.round(
          ((this.completedTasks.length + this.failedTasks.length) /
            this.tasks.size) *
            100,
        ),
        startTime: this.startTime,
      },
      workers: this.workers.map((w) => ({
        id: w.id,
        isWorking: w.isWorking,
        currentTaskName: w.currentTask?.merchantName,
      })),
    };
  }
}

/**
 * 创建并执行批量商户抓取
 */
export async function executeBatchMerchantScraping(
  options: BatchScrapingOptions,
): Promise<BatchScrapingResult> {
  const scraper = new FMTCBatchMerchantScraper(options);
  return await scraper.executeBatchScraping();
}
