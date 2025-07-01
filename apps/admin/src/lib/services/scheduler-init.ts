import { discountExpirationService } from "./discount-expiration.service";
import { discountSchedulerService } from "./discount-scheduler.service";

/**
 * 初始化折扣过期处理调度器
 * 在应用启动时调用
 */
export function initializeDiscountScheduler(): void {
  try {
    // 从环境变量加载配置
    const config = loadConfigFromEnvironment();

    // 更新过期处理服务配置
    if (config.expiration) {
      discountExpirationService.updateConfig(config.expiration);
    }

    // 更新调度器配置
    if (config.scheduler) {
      discountSchedulerService.updateConfig(config.scheduler);
    }

    // 如果启用了调度器，则启动
    if (config.scheduler?.enabled) {
      discountSchedulerService.start();
    } else {
      return;
    }

    // 注册进程退出时的清理函数
    setupGracefulShutdown();
  } catch {
    return;
  }
}

/**
 * 从环境变量加载配置
 */
function loadConfigFromEnvironment() {
  const config: {
    scheduler?: Record<string, unknown>;
    expiration?: Record<string, unknown>;
  } = {};

  // 调度器配置
  config.scheduler = {
    enabled: process.env.DISCOUNT_SCHEDULER_ENABLED === "true",
    intervalMinutes: parseInt(
      process.env.DISCOUNT_SCHEDULER_INTERVAL_MINUTES || "60",
    ),
    maxConcurrentRuns: parseInt(
      process.env.DISCOUNT_SCHEDULER_MAX_CONCURRENT || "1",
    ),
    retryAttempts: parseInt(
      process.env.DISCOUNT_SCHEDULER_RETRY_ATTEMPTS || "3",
    ),
    retryDelayMinutes: parseInt(
      process.env.DISCOUNT_SCHEDULER_RETRY_DELAY || "5",
    ),
  };

  // 过期处理配置
  config.expiration = {
    autoDisableExpired: process.env.DISCOUNT_AUTO_DISABLE_EXPIRED !== "false",
    autoDeleteAfterDays: parseInt(
      process.env.DISCOUNT_AUTO_DELETE_AFTER_DAYS || "30",
    ),
    checkIntervalHours: parseInt(
      process.env.DISCOUNT_CHECK_INTERVAL_HOURS || "1",
    ),
    notifyBeforeExpiry: process.env.DISCOUNT_NOTIFY_BEFORE_EXPIRY === "true",
    notifyDaysBefore: parseInt(process.env.DISCOUNT_NOTIFY_DAYS_BEFORE || "3"),
    notifyEmail: process.env.DISCOUNT_NOTIFY_EMAIL || undefined,
    enableAutoCleanup: process.env.DISCOUNT_ENABLE_AUTO_CLEANUP === "true",
    cleanupOlderThanDays: parseInt(
      process.env.DISCOUNT_CLEANUP_OLDER_THAN_DAYS || "90",
    ),
    maxCleanupBatch: parseInt(process.env.DISCOUNT_MAX_CLEANUP_BATCH || "1000"),
  };

  return config;
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown(): void {
  const gracefulShutdown = () => {
    try {
      discountSchedulerService.stop();
    } catch {
      // 忽略停止调度器失败的错误
    }

    // 给一些时间让正在运行的任务完成
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  };

  // 监听进程信号
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGUSR2", gracefulShutdown); // nodemon restart

  // 监听未捕获的异常
  process.on("uncaughtException", () => {
    gracefulShutdown();
  });

  process.on("unhandledRejection", () => {
    gracefulShutdown();
  });
}

/**
 * 手动停止调度器（用于测试或维护）
 */
export function stopDiscountScheduler(): void {
  discountSchedulerService.stop();
}

/**
 * 获取调度器状态（用于健康检查）
 */
export function getSchedulerHealth(): {
  status: string;
  details: Record<string, unknown>;
} {
  try {
    const health = discountSchedulerService.healthCheck();
    const status = discountSchedulerService.getStatus();

    return {
      status: health.status,
      details: {
        health,
        status,
      },
    };
  } catch {
    return {
      status: "error",
      details: {},
    };
  }
}
