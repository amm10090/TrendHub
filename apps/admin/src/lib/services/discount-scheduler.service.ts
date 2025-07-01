import {
  discountExpirationService,
  ExpirationResult,
} from "./discount-expiration.service";

export interface ScheduleConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxConcurrentRuns: number;
  retryAttempts: number;
  retryDelayMinutes: number;
}

export interface ScheduleStatus {
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  currentlyRunning: boolean;
}

export interface ScheduleLog {
  id: string;
  startTime: Date;
  endTime?: Date;
  success: boolean;
  results: ExpirationResult[];
  error?: string;
  duration?: number;
}

export class DiscountSchedulerService {
  private config: ScheduleConfig;
  private intervalId?: NodeJS.Timeout;
  private status: ScheduleStatus;
  private logs: ScheduleLog[] = [];
  private maxLogEntries = 100;

  constructor(config?: Partial<ScheduleConfig>) {
    this.config = {
      enabled: false, // 默认关闭，需要手动启用
      intervalMinutes: 60, // 每小时检查一次
      maxConcurrentRuns: 1,
      retryAttempts: 3,
      retryDelayMinutes: 5,
      ...config,
    };

    this.status = {
      isActive: false,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      currentlyRunning: false,
    };

    // 加载配置（从环境变量或数据库）
    this.loadConfigFromEnv();
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.status.isActive) {
      return;
    }

    if (!this.config.enabled) {
      return;
    }

    this.status.isActive = true;
    this.status.nextRun = new Date(
      Date.now() + this.config.intervalMinutes * 60 * 1000,
    );

    this.intervalId = setInterval(
      () => this.executeScheduledTask(),
      this.config.intervalMinutes * 60 * 1000,
    );

    // 可选：立即执行一次
    // this.executeScheduledTask();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.status.isActive) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.status.isActive = false;
    this.status.nextRun = undefined;
  }

  /**
   * 重启调度器
   */
  restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000);
  }

  /**
   * 执行调度任务
   */
  private async executeScheduledTask(): Promise<void> {
    if (this.status.currentlyRunning) {
      return;
    }

    const logId = `schedule_${Date.now()}`;
    const startTime = new Date();

    this.status.currentlyRunning = true;
    this.status.lastRun = startTime;
    this.status.nextRun = new Date(
      startTime.getTime() + this.config.intervalMinutes * 60 * 1000,
    );
    this.status.totalRuns++;

    const log: ScheduleLog = {
      id: logId,
      startTime,
      success: false,
      results: [],
    };

    try {
      const results = await this.executeWithRetry();

      log.results = results;
      log.success = results.every((r) => r.success);
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - startTime.getTime();

      if (log.success) {
        this.status.successfulRuns++;
      } else {
        this.status.failedRuns++;
      }
    } catch (error) {
      log.error = error instanceof Error ? error.message : "Unknown error";
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - startTime.getTime();
      log.success = false;

      this.status.failedRuns++;
    } finally {
      this.status.currentlyRunning = false;
      this.addLog(log);
    }
  }

  /**
   * 带重试机制的执行
   */
  private async executeWithRetry(): Promise<ExpirationResult[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await discountExpirationService.processExpiredDiscounts();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < this.config.retryAttempts) {
          const delayMs = this.config.retryDelayMinutes * 60 * 1000;

          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * 手动触发任务
   */
  async triggerManual(): Promise<ExpirationResult[]> {
    if (this.status.currentlyRunning) {
      throw new Error(
        "A scheduled task is currently running. Please wait for it to complete.",
      );
    }

    const logId = `manual_${Date.now()}`;
    const startTime = new Date();

    const log: ScheduleLog = {
      id: logId,
      startTime,
      success: false,
      results: [],
    };

    try {
      const results = await discountExpirationService.processExpiredDiscounts();

      log.results = results;
      log.success = results.every((r) => r.success);
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - startTime.getTime();

      this.addLog(log);

      return results;
    } catch (error) {
      log.error = error instanceof Error ? error.message : "Unknown error";
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - startTime.getTime();
      log.success = false;

      this.addLog(log);

      throw error;
    }
  }

  /**
   * 添加日志条目
   */
  private addLog(log: ScheduleLog): void {
    this.logs.unshift(log);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries);
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): ScheduleStatus & { config: ScheduleConfig } {
    return {
      ...this.status,
      config: { ...this.config },
    };
  }

  /**
   * 获取执行日志
   */
  getLogs(limit?: number): ScheduleLog[] {
    return limit ? this.logs.slice(0, limit) : [...this.logs];
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    const wasActive = this.status.isActive;

    if (wasActive) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasActive && this.config.enabled) {
      this.start();
    }
  }

  /**
   * 清理日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 从环境变量加载配置
   */
  private loadConfigFromEnv(): void {
    const envConfig: Partial<ScheduleConfig> = {};

    if (process.env.DISCOUNT_SCHEDULER_ENABLED) {
      envConfig.enabled = process.env.DISCOUNT_SCHEDULER_ENABLED === "true";
    }

    if (process.env.DISCOUNT_SCHEDULER_INTERVAL_MINUTES) {
      envConfig.intervalMinutes = parseInt(
        process.env.DISCOUNT_SCHEDULER_INTERVAL_MINUTES,
      );
    }

    if (process.env.DISCOUNT_SCHEDULER_RETRY_ATTEMPTS) {
      envConfig.retryAttempts = parseInt(
        process.env.DISCOUNT_SCHEDULER_RETRY_ATTEMPTS,
      );
    }

    if (process.env.DISCOUNT_SCHEDULER_RETRY_DELAY_MINUTES) {
      envConfig.retryDelayMinutes = parseInt(
        process.env.DISCOUNT_SCHEDULER_RETRY_DELAY_MINUTES,
      );
    }

    if (Object.keys(envConfig).length > 0) {
      this.config = { ...this.config, ...envConfig };
    }
  }

  /**
   * 健康检查
   */
  healthCheck(): {
    status: "healthy" | "warning" | "error";
    details: string;
    lastRun?: Date;
    nextRun?: Date;
  } {
    const now = new Date();
    const recentLogs = this.logs.slice(0, 5);
    const recentFailures = recentLogs.filter((log) => !log.success).length;

    if (!this.config.enabled) {
      return {
        status: "warning",
        details: "Scheduler is disabled",
      };
    }

    if (!this.status.isActive) {
      return {
        status: "error",
        details: "Scheduler should be active but is not running",
      };
    }

    if (recentFailures >= 3) {
      return {
        status: "error",
        details: `${recentFailures} recent failures detected`,
        lastRun: this.status.lastRun,
        nextRun: this.status.nextRun,
      };
    }

    if (this.status.lastRun) {
      const timeSinceLastRun = now.getTime() - this.status.lastRun.getTime();
      const expectedInterval = this.config.intervalMinutes * 60 * 1000;

      if (timeSinceLastRun > expectedInterval * 2) {
        return {
          status: "warning",
          details: "Last run was longer ago than expected",
          lastRun: this.status.lastRun,
          nextRun: this.status.nextRun,
        };
      }
    }

    return {
      status: "healthy",
      details: "Scheduler is running normally",
      lastRun: this.status.lastRun,
      nextRun: this.status.nextRun,
    };
  }
}

// 导出默认实例
export const discountSchedulerService = new DiscountSchedulerService();
