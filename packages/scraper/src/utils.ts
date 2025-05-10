// packages/scraper/src/utils.ts

// 本地 ScraperLogLevel 枚举, 与 Prisma 的 ScraperLogLevel 保持一致
// 为了避免直接依赖 @prisma/client 在这个包中 (如果项目结构上不希望如此)
// 如果可以直接导入 Prisma 的枚举，则优先使用 Prisma 的。
// 为简单起见，这里我们定义一个本地版本。
export enum LocalScraperLogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

// 从环境变量读取日志 API 端点，提供一个开发环境下的默认值
const LOG_API_ENDPOINT =
  process.env.LOG_API_ENDPOINT ||
  "http://localhost:3001/api/admin/scraper-tasks/logs/internal/log";

/**
 * 向后端发送日志条目。
 * @param executionId - 当前爬虫任务的执行ID。
 * @param level - 日志级别。
 * @param message - 日志消息。
 * @param context - 可选的上下文数据对象。
 */
export async function sendLogToBackend(
  executionId: string,
  level: LocalScraperLogLevel,
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!executionId) {
    console.warn(
      "[SCRAPER LOG SEND] Attempted to send log without executionId. Message:",
      message,
      "Context:",
      context,
    );
    return; // 如果没有 executionId，则不发送日志，仅在控制台警告
  }

  try {
    const body = {
      executionId,
      level: level.toString(), //确保枚举值作为字符串发送
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(LOG_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // 如果后端返回错误，尝试记录错误详情
      let errorDetailsText = "";
      let errorDetailsJson: unknown = null;
      try {
        // 首先读取为文本，因为这总是安全的
        errorDetailsText = await response.text();
        // 然后尝试解析为 JSON
        try {
          errorDetailsJson = JSON.parse(errorDetailsText);
        } catch (jsonParseError) {
          // 如果不是有效的 JSON，也没关系，我们已经有了文本
          console.warn(
            `[SCRAPER LOG SEND] Error parsing JSON from backend error response for ${executionId}. Text was: ${errorDetailsText.substring(0, 200)}`,
            jsonParseError,
          );
        }
      } catch (readError) {
        // 如果连读取文本都失败了（不太可能，除非网络中断）
        console.error(
          `[SCRAPER LOG SEND] Failed to read error response body for ${executionId}`,
          readError,
        );
        errorDetailsText = "Failed to read error response body.";
      }

      const logContext = errorDetailsJson || errorDetailsText;
      console.error(
        `[SCRAPER LOG SEND FAIL] Failed to send log to backend for execution ${executionId}. Status: ${response.status}. Details:`,
        logContext,
        `Original message: ${message}`,
      );
    }
  } catch (error) {
    // 网络错误或其他 fetch 调用本身的错误
    console.error(
      `[SCRAPER LOG SEND FAIL] Network or fetch error for execution ${executionId}: ${message}`,
      { error, context },
    );
  }
}
