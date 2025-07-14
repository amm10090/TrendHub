/**
 * 实时状态更新工具
 * 用于从爬虫向后端发送实时状态更新
 */

// 状态更新数据接口
export interface ScraperStatusUpdate {
  executionId: string;
  status?: "IDLE" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress?: {
    currentPage: number;
    totalPages: number;
    merchantsProcessed: number;
    merchantsTotal: number;
    phase: "login" | "navigation" | "scraping" | "processing" | "completed";
  };
  metrics?: {
    merchantsCount: number;
    newMerchantsCount: number;
    updatedMerchantsCount: number;
    errorCount: number;
  };
  error?: string;
}

// 日志消息接口
export interface ScraperLogMessage {
  executionId: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, unknown>;
}

/**
 * 发送状态更新到后端
 */
export async function sendStatusUpdate(
  update: ScraperStatusUpdate,
  backendUrl = "http://localhost:3001",
): Promise<void> {
  try {
    const response = await fetch(
      `${backendUrl}/api/internal/scraper-status-update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      },
    );

    if (!response.ok) {
      console.warn(
        `状态更新发送失败: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.warn("发送状态更新失败:", error);
    // 不抛出错误，避免影响爬虫主流程
  }
}

/**
 * 发送日志消息到后端
 */
export async function sendLogMessage(
  log: ScraperLogMessage,
  backendUrl = "http://localhost:3001",
): Promise<void> {
  try {
    const response = await fetch(
      `${backendUrl}/api/internal/scraper-log-message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...log,
          timestamp: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      console.warn(
        `日志消息发送失败: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.warn("发送日志消息失败:", error);
    // 不抛出错误，避免影响爬虫主流程
  }
}

/**
 * 发送进度更新
 */
export async function sendProgressUpdate(
  executionId: string,
  progress: ScraperStatusUpdate["progress"],
  backendUrl = "http://localhost:3001",
): Promise<void> {
  await sendStatusUpdate({ executionId, progress }, backendUrl);
}

/**
 * 发送指标更新
 */
export async function sendMetricsUpdate(
  executionId: string,
  metrics: ScraperStatusUpdate["metrics"],
  backendUrl = "http://localhost:3001",
): Promise<void> {
  await sendStatusUpdate({ executionId, metrics }, backendUrl);
}

/**
 * 发送错误状态
 */
export async function sendErrorStatus(
  executionId: string,
  error: string,
  backendUrl = "http://localhost:3001",
): Promise<void> {
  await Promise.all([
    sendStatusUpdate({ executionId, status: "FAILED", error }, backendUrl),
    sendLogMessage({ executionId, level: "error", message: error }, backendUrl),
  ]);
}

/**
 * 发送完成状态
 */
export async function sendCompletionStatus(
  executionId: string,
  metrics: ScraperStatusUpdate["metrics"],
  backendUrl = "http://localhost:3001",
): Promise<void> {
  await sendStatusUpdate(
    {
      executionId,
      status: "COMPLETED",
      metrics,
      progress: {
        currentPage: metrics?.merchantsCount || 0,
        totalPages: metrics?.merchantsCount || 0,
        merchantsProcessed: metrics?.merchantsCount || 0,
        merchantsTotal: metrics?.merchantsCount || 0,
        phase: "completed",
      },
    },
    backendUrl,
  );
}
