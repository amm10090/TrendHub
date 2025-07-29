import {
  ScraperTaskExecution,
  ScraperTaskStatus,
  ScraperTaskTriggerType,
} from "@prisma/client";

import { db } from "@/lib/db";

import { taskExecutor } from "./task-executor";

// 简单的日志记录器
const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * 爬虫任务队列管理器
 *
 * 负责：
 * 1. 接收并排队爬虫任务执行请求
 * 2. 基于并发限制控制任务执行
 * 3. 维护任务队列状态
 */
export class TaskQueueManager {
  private static instance: TaskQueueManager;
  private queue: string[] = []; // 存储 executionId
  private isProcessingNext: boolean = false; // 用于控制 processQueue 的单个执行流
  private isShuttingDown: boolean = false;
  private maxConcurrentTasks: number = 1; // 初始并发设置为1
  private activeTasks: number = 0;

  private constructor() {}

  /**
   * 获取 TaskQueueManager 单例实例
   */
  public static getInstance(): TaskQueueManager {
    if (!TaskQueueManager.instance) {
      TaskQueueManager.instance = new TaskQueueManager();
    }

    return TaskQueueManager.instance;
  }

  /**
   * 初始化任务队列管理器，恢复之前中断的队列
   */
  public async initialize(): Promise<void> {
    logger.info("TaskQueueManager 初始化中...");

    const queuedExecutions = await db.scraperTaskExecution.findMany({
      where: { status: ScraperTaskStatus.QUEUED },
      orderBy: { createdAt: "asc" },
    });

    if (queuedExecutions.length > 0) {
      logger.info(
        `发现 ${queuedExecutions.length} 个处于 QUEUED 状态的任务，重新加入队列...`,
      );
      for (const exec of queuedExecutions) {
        if (!this.queue.includes(exec.id)) {
          // 避免重复添加
          this.queue.push(exec.id);
        }
      }
      this.tryProcessQueue(); // 尝试处理队列
    }
  }

  /**
   * 将新任务添加到队列
   *
   * @param taskDefinitionId 任务定义ID
   * @param triggerType 触发类型
   * @returns 新建的任务执行记录
   */
  public async enqueueTask(
    taskDefinitionId: string,
    triggerType: ScraperTaskTriggerType,
  ): Promise<ScraperTaskExecution> {
    if (this.isShuttingDown) {
      logger.warn("TaskQueueManager 正在关闭。无法添加新任务。");
      throw new Error("TaskQueueManager 正在关闭。无法添加新任务。");
    }

    logger.info(`尝试将任务添加到队列，任务定义ID: ${taskDefinitionId}`);

    const taskDefinition = await db.scraperTaskDefinition.findUnique({
      where: { id: taskDefinitionId },
    });

    if (!taskDefinition) {
      logger.error(`任务定义未找到: ${taskDefinitionId}`);
      throw new Error(`ID为 ${taskDefinitionId} 的任务定义未找到。`);
    }

    if (!taskDefinition.isEnabled) {
      logger.warn(`任务定义 '${taskDefinition.name}' 已禁用。跳过入队。`);
      throw new Error(`任务 '${taskDefinition.name}' 已禁用，无法添加到队列。`);
    }

    const newExecution = await db.scraperTaskExecution.create({
      data: {
        taskDefinitionId: taskDefinition.id,
        status: ScraperTaskStatus.QUEUED,
        triggerType: triggerType,
      },
      include: {
        taskDefinition: true,
      },
    });

    if (!this.queue.includes(newExecution.id)) {
      // 避免重复添加
      this.queue.push(newExecution.id);
    }
    logger.info(
      `任务已入队: 执行ID ${newExecution.id}，任务定义 '${taskDefinition.name}'`,
    );

    this.tryProcessQueue();

    return newExecution;
  }

  /**
   * 尝试启动队列处理，确保只有一个处理循环在运行
   */
  private tryProcessQueue(): void {
    if (this.isProcessingNext) {
      logger.info("队列处理尝试跳过: 已有处理进程在运行。");

      return;
    }
    if (this.queue.length === 0) {
      logger.info("队列处理尝试跳过: 队列为空。");

      return;
    }
    if (this.activeTasks >= this.maxConcurrentTasks) {
      logger.info("队列处理尝试跳过: 已达最大并发数。");

      return;
    }
    if (this.isShuttingDown) {
      logger.info("队列处理尝试跳过: 正在关闭。");

      return;
    }

    this.isProcessingNext = true;
    this._processQueueInternal().finally(() => {
      this.isProcessingNext = false;
      // 再次尝试处理，以防在处理期间有新任务加入或任务完成
      if (
        !this.isShuttingDown &&
        this.queue.length > 0 &&
        this.activeTasks < this.maxConcurrentTasks
      ) {
        this.tryProcessQueue();
      }
    });
  }

  /**
   * 内部队列处理逻辑
   */
  private async _processQueueInternal(): Promise<void> {
    if (
      this.queue.length === 0 ||
      this.activeTasks >= this.maxConcurrentTasks ||
      this.isShuttingDown
    ) {
      return;
    }

    const executionId = this.queue.shift();

    if (!executionId) return;

    this.activeTasks++;
    logger.info(
      `处理任务: 执行ID ${executionId}. 活动任务: ${this.activeTasks}/${this.maxConcurrentTasks}. 队列大小: ${this.queue.length}`,
    );

    try {
      // 使用导入的 taskExecutor 单例
      await taskExecutor.executeTask(executionId);
      logger.info(`任务执行已完成 (或失败并由执行器处理) ${executionId}.`);
    } catch {
      logger.error(
        `任务执行器执行任务 ${executionId} 时出现未处理的错误:`,
        error,
      );
      // 如果 executeTask 本身抛出未捕获的错误，我们尝试将任务标记为失败
      try {
        await db.scraperTaskExecution.update({
          where: { id: executionId },
          data: {
            status: ScraperTaskStatus.FAILED,
            errorMessage: `TaskQueueManager: 来自任务执行器的未处理异常: ${(error as Error).message}`,
            completedAt: new Date(),
          },
        });
      } catch (dbError) {
        logger.error(
          `在执行器错误后更新任务 ${executionId} 状态为 FAILED 失败:`,
          dbError,
        );
      }
    } finally {
      this.activeTasks--;
      logger.info(
        `任务插槽已释放 ${executionId}. 活动任务: ${this.activeTasks}/${this.maxConcurrentTasks}.`,
      );
      // 递归调用 tryProcessQueue 来处理下一个任务（如果队列中还有）
      // This will be handled by the finally block in tryProcessQueue
    }
  }

  /**
   * 设置最大并发任务数
   *
   * @param max 最大并发任务数
   */
  public setMaxConcurrentTasks(max: number): void {
    if (max < 1) {
      throw new Error("最大并发任务数必须大于或等于 1");
    }
    this.maxConcurrentTasks = max;
    logger.info(`最大并发任务数已设置为 ${max}`);

    // 如果增加了并发数，尝试处理队列
    if (this.activeTasks < this.maxConcurrentTasks) {
      this.tryProcessQueue();
    }
  }

  /**
   * 获取队列状态信息
   */
  public getQueueStatus(): {
    queueLength: number;
    activeTasks: number;
    maxConcurrentTasks: number;
    isProcessing: boolean;
    isShuttingDown: boolean;
  } {
    return {
      queueLength: this.queue.length,
      activeTasks: this.activeTasks,
      maxConcurrentTasks: this.maxConcurrentTasks,
      isProcessing: this.isProcessingNext,
      isShuttingDown: this.isShuttingDown,
    };
  }

  /**
   * 优雅关闭队列管理器
   */
  public async shutdown(): Promise<void> {
    logger.info("TaskQueueManager 关闭流程启动。");
    this.isShuttingDown = true;

    const shutdownTimeout = 30000; // 30秒
    const startTime = Date.now();

    while (this.activeTasks > 0 && Date.now() - startTime < shutdownTimeout) {
      logger.info(`等待 ${this.activeTasks} 个活动任务完成...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeTasks > 0) {
      logger.warn(`关闭超时。${this.activeTasks} 个任务可能仍在运行。`);
    } else {
      logger.info("所有活动任务已完成。");
    }
    this.queue = [];
    logger.info("TaskQueueManager 关闭完成。");
  }
}

// 导出单例
export const taskQueueManager = TaskQueueManager.getInstance();

// 添加应用启动和关闭处理

// 在应用启动时初始化任务队列管理器
export async function initializeTaskQueueManager(): Promise<void> {
  await taskQueueManager.initialize();
}

// 处理进程退出信号，确保优雅关闭
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    logger.info("收到 SIGTERM 信号。正在优雅关闭。");
    await taskQueueManager.shutdown();
  });

  process.on("SIGINT", async () => {
    logger.info("收到 SIGINT 信号。正在优雅关闭。");
    await taskQueueManager.shutdown();
  });
}

// 应用启动时进行初始化 (示例, 实际初始化应在应用主服务文件中进行)
// async function initializeAppServices() {
//   // TODO: 确保 taskExecutor 实例在这里被正确创建或导入并传递给 initialize
//   // const { taskExecutor } = await import("./task-executor"); // 示例性导入
//   // await taskQueueManager.initialize(taskExecutor);
// }
// initializeAppServices();

// 注意: `taskExecutor` 需要在使用 `taskQueueManager` 的地方正确初始化并传入。
// 例如，在你的主服务器文件或一个专门的服务初始化脚本中。
//
// Example (conceptual - place in your server's main entry point):
//
// // import { taskExecutor } from './task-executor'; // Adjust path as needed
// import { taskQueueManager } from './task-queue-manager';
//
// async function startServer() {
//   // ... other server setup
//   // await taskQueueManager.initialize(taskExecutor); // 确保taskExecutor已实例化
//   logger.info("Application services initialized.");
//   // ... start your HTTP server etc.
// }
//
// startServer().catch(error => {
//   logger.error("Failed to start server:", error);
//   process.exit(1);
// });
//
// process.on('SIGTERM', async () => {
//   logger.info('SIGTERM signal received. Shutting down gracefully.');
//   await taskQueueManager.shutdown();
//   // ... other shutdown procedures
//   process.exit(0);
// });
//
// process.on('SIGINT', async () => {
//   logger.info('SIGINT signal received. Shutting down gracefully.');
//   await taskQueueManager.shutdown();
//   // ... other shutdown procedures
//   process.exit(0);
// });
