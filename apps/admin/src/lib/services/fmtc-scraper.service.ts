/**
 * FMTC 爬虫服务
 * 处理FMTC爬虫任务的管理和执行
 */

import { ScraperTaskStatus } from "@prisma/client";
import { scrapeFMTCWithConfig } from "@repo/scraper";
import type {
  FMTCScraperOptions,
  FMTCScraperTask,
  FMTCScraperConfig,
} from "@repo/types";

import { db } from "@/lib/db";

export interface ScrapingTaskConfig {
  name: string;
  description?: string;
  credentials: {
    username: string;
    password: string;
  };
  config: {
    maxPages?: number;
    maxMerchantsPerRun?: number;
    includeDetails?: boolean;
    searchParams?: Record<string, string | number | boolean>;
  };
}

export interface QuickScrapeConfig {
  maxPages: number;
  maxMerchantsPerRun?: number;
  includeDetails: boolean;
  searchParams: Record<string, string | number | boolean>;
}

export interface ScraperSummary {
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

export class FMTCScraperService {
  /**
   * 获取FMTC配置
   */
  async getFMTCConfig() {
    try {
      let config = await db.fMTCScraperConfig.findFirst({
        where: { name: "default" },
      });

      if (!config) {
        // 创建默认配置
        config = await db.fMTCScraperConfig.create({
          data: {
            name: "default",
            description: "默认FMTC爬虫配置",
          },
        });
      }

      return config;
    } catch (error) {
      console.error("获取FMTC配置失败:", error);
      return null;
    }
  }

  /**
   * 将数据库配置转换为爬虫配置
   */
  private convertToFMTCConfig(dbConfig: FMTCScraperConfig) {
    return {
      // 基础配置
      username: dbConfig.defaultUsername,
      password: dbConfig.defaultPassword,
      maxPages: dbConfig.maxPages,
      maxMerchants: dbConfig.maxMerchants,
      requestDelay: dbConfig.requestDelay,
      enableImageDownload: dbConfig.enableImageDownload,
      headlessMode: dbConfig.headlessMode,
      debugMode: dbConfig.debugMode,
      maxConcurrency: dbConfig.maxConcurrency,
      
      // reCAPTCHA配置
      recaptchaMode: dbConfig.recaptchaMode,
      recaptchaManualTimeout: dbConfig.recaptchaManualTimeout,
      recaptchaAutoTimeout: dbConfig.recaptchaAutoTimeout,
      recaptchaRetryAttempts: dbConfig.recaptchaRetryAttempts,
      recaptchaRetryDelay: dbConfig.recaptchaRetryDelay,
      
      // 2captcha配置
      twoCaptchaApiKey: dbConfig.twoCaptchaApiKey,
      twoCaptchaSoftId: dbConfig.twoCaptchaSoftId,
      twoCaptchaServerDomain: dbConfig.twoCaptchaServerDomain,
      twoCaptchaCallback: dbConfig.twoCaptchaCallback,
      
      // 搜索配置
      searchText: dbConfig.searchText,
      searchNetworkId: dbConfig.searchNetworkId,
      searchOpmProvider: dbConfig.searchOpmProvider,
      searchCategory: dbConfig.searchCategory,
      searchCountry: dbConfig.searchCountry,
      searchShippingCountry: dbConfig.searchShippingCountry,
      searchDisplayType: dbConfig.searchDisplayType,
      
      // 搜索行为配置
      searchEnableRandomDelay: dbConfig.searchEnableRandomDelay,
      searchMinDelay: dbConfig.searchMinDelay,
      searchMaxDelay: dbConfig.searchMaxDelay,
      searchTypingDelayMin: dbConfig.searchTypingDelayMin,
      searchTypingDelayMax: dbConfig.searchTypingDelayMax,
      searchEnableMouseMovement: dbConfig.searchEnableMouseMovement,
      
      // 高级配置
      sessionTimeout: dbConfig.sessionTimeout,
      maxConsecutiveErrors: dbConfig.maxConsecutiveErrors,
      errorCooldownPeriod: dbConfig.errorCooldownPeriod,
    };
  }

  /**
   * 创建抓取任务
   */
  async createScrapingTask(config: ScrapingTaskConfig) {
    return await db.fMTCScraperTask.create({
      data: {
        name: config.name,
        description: config.description || "",
        credentials: config.credentials,
        config: config.config,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 启动抓取任务
   */
  async startScrapingTask(taskId: string, config?: Partial<FMTCScraperConfig>) {
    const task = await db.fMTCScraperTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("任务不存在");
    }

    if (!task.isEnabled) {
      throw new Error("任务未启用");
    }

    // 检查是否有正在运行的执行
    const runningExecution = await db.fMTCScraperExecution.findFirst({
      where: {
        taskId,
        status: { in: [ScraperTaskStatus.RUNNING, ScraperTaskStatus.QUEUED] },
      },
    });

    if (runningExecution) {
      throw new Error("任务已在运行中");
    }

    // 创建新的执行记录
    const execution = await db.fMTCScraperExecution.create({
      data: {
        taskId,
        status: ScraperTaskStatus.QUEUED,
        startedAt: new Date(),
      },
    });

    // 更新任务的最后执行时间
    await db.fMTCScraperTask.update({
      where: { id: taskId },
      data: { lastExecutedAt: new Date() },
    });

    // 异步启动实际的爬虫执行
    this.executeScrapingTask(execution.id, task, config || task.config).catch(
      async (error) => {
        console.error("爬虫执行失败:", error);
        await db.fMTCScraperExecution.update({
          where: { id: execution.id },
          data: {
            status: ScraperTaskStatus.FAILED,
            completedAt: new Date(),
            errorMessage: error.message,
            errorStack: error.stack,
          },
        });
      },
    );

    return execution;
  }

  /**
   * 停止抓取任务
   */
  async stopScrapingTask(taskId: string) {
    const activeExecution = await db.fMTCScraperExecution.findFirst({
      where: {
        taskId,
        status: { in: [ScraperTaskStatus.RUNNING, ScraperTaskStatus.QUEUED] },
      },
    });

    if (!activeExecution) {
      throw new Error("没有正在运行的任务");
    }

    // 更新执行状态为取消
    return await db.fMTCScraperExecution.update({
      where: { id: activeExecution.id },
      data: {
        status: ScraperTaskStatus.CANCELLED,
        completedAt: new Date(),
        errorMessage: "任务被手动停止",
      },
    });
  }

  /**
   * 快速抓取
   */
  async startQuickScraping(config: QuickScrapeConfig) {
    // 创建临时任务
    const task = await db.fMTCScraperTask.create({
      data: {
        name: `快速抓取_${new Date().toISOString()}`,
        description: "快速抓取任务",
        credentials: {}, // 使用默认凭证
        config,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 启动任务
    return await this.startScrapingTask(task.id, config);
  }

  /**
   * 获取爬虫摘要信息
   */
  async getScraperSummary(): Promise<ScraperSummary> {
    const [
      totalTasks,
      activeTasks,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
    ] = await Promise.all([
      db.fMTCScraperTask.count(),
      db.fMTCScraperTask.count({ where: { isEnabled: true } }),
      db.fMTCScraperExecution.count(),
      db.fMTCScraperExecution.count({
        where: { status: ScraperTaskStatus.COMPLETED },
      }),
      db.fMTCScraperExecution.count({
        where: { status: ScraperTaskStatus.FAILED },
      }),
    ]);

    return {
      totalTasks,
      activeTasks,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
    };
  }

  /**
   * 获取执行日志
   */
  async getExecutionLogs() {
    // TODO: 从日志服务获取日志
    // 暂时返回空数组
    return [];
  }

  /**
   * 执行爬虫任务
   */
  private async executeScrapingTask(
    executionId: string,
    task: FMTCScraperTask,
    taskConfig?: Partial<FMTCScraperConfig>,
  ) {
    try {
      // 更新状态为运行中
      await db.fMTCScraperExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // 获取数据库中的FMTC配置
      const dbConfig = await this.getFMTCConfig();
      const fmtcConfig = dbConfig ? this.convertToFMTCConfig(dbConfig) : {};

      // 使用传入的配置或任务默认配置
      const config = taskConfig || task.config || {};

      // 合并配置：任务配置 > 传入配置 > 数据库配置 > 默认值
      const credentials = task.credentials || {
        username: fmtcConfig.username,
        password: fmtcConfig.password,
      };

      // 验证基本的爬虫选项
      if (!credentials?.username || !credentials?.password) {
        throw new Error("FMTC 爬虫需要有效的登录凭据");
      }

      // 准备爬虫选项 - 优先使用任务配置，然后是数据库配置
      const scraperOptions: FMTCScraperOptions = {
        credentials,
        maxPages: config.maxPages || fmtcConfig.maxPages || 5,
        maxMerchants: config.maxMerchantsPerRun || fmtcConfig.maxMerchants || 500,
        includeDetails: config.includeDetails !== false,
        downloadImages: config.downloadImages || fmtcConfig.enableImageDownload || false,
        maxConcurrency: config.maxConcurrency || fmtcConfig.maxConcurrency || 1,
        requestDelay: config.requestDelay || fmtcConfig.requestDelay || 2000,
        headless: fmtcConfig.headlessMode !== false, // 使用数据库配置
        searchParams: config.searchParams || {},
      };

      console.log(`开始执行爬虫任务 ${executionId}, 配置:`, {
        maxPages: scraperOptions.maxPages,
        maxMerchants: scraperOptions.maxMerchants,
        includeDetails: scraperOptions.includeDetails,
        downloadImages: scraperOptions.downloadImages,
        headless: scraperOptions.headless,
        credentials: scraperOptions.credentials?.username ? "已提供" : "未提供",
        configSource: dbConfig ? "数据库配置" : "默认配置",
      });

      // 使用新的带配置参数的爬虫函数
      const merchants = await scrapeFMTCWithConfig(
        scraperOptions,
        fmtcConfig,
        executionId
      );

      console.log(
        `爬虫任务 ${executionId} 完成，获取到 ${merchants.length} 个商户`,
      );

      // 更新执行结果
      await db.fMTCScraperExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.COMPLETED,
          completedAt: new Date(),
          merchantsCount: merchants.length,
          newMerchantsCount: merchants.length,
          updatedMerchantsCount: 0,
          metrics: {
            totalMerchants: merchants.length,
            withDetails: merchants.filter((m) => m.homepage).length,
            withNetworks: merchants.filter(
              (m) => m.networks && m.networks.length > 0,
            ).length,
            configUsed: dbConfig ? "database" : "default",
          },
        },
      });

      // TODO: 将商户数据保存到数据库
      // 这里可以调用 FMTCMerchantService 来保存数据
      console.log(`商户数据样例:`, merchants.slice(0, 3));
    } catch (error) {
      console.error(`爬虫任务 ${executionId} 执行失败:`, error);
      throw error;
    }
  }
}
