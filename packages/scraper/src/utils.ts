// packages/scraper/src/utils.ts

import * as fs from "fs";
import { log as crawleeLog, type Log } from "crawlee";

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

  // 检查是否为测试运行的executionId (以"test-"开头)
  if (executionId.startsWith("test-")) {
    console.log(
      `[SCRAPER LOG TEST] ${level}: ${message}`,
      context ? JSON.stringify(context, null, 2) : "",
    );
    return; // 测试运行模式下仅输出到控制台，不发送到后端
  }

  // 检查是否为FMTC爬虫的executionId (以"cmd"开头，是CUID格式)
  if (executionId.startsWith("cmd")) {
    console.log(
      `[FMTC SCRAPER LOG] ${level}: ${message}`,
      context ? JSON.stringify(context, null, 2) : "",
    );
    // 继续发送到后端，但如果失败则静默处理
  }

  // 检查executionId格式是否符合UUID标准 (后端API期望的格式)
  // const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  // if (!uuidRegex.test(executionId)) {
  //   console.warn(
  //     `[SCRAPER LOG SEND] Invalid executionId format: ${executionId}. Expected UUID format. Message:`,
  //     message
  //   );
  //   return; // 如果executionId格式不正确，则不发送日志
  // }

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

/**
 * 清理价格字符串，提取数字
 * @param priceStr 价格字符串 (如 "$123.45", "€99,99" 等)
 * @returns 价格数值
 */
export function cleanPrice(priceStr: string): number {
  if (!priceStr) return 0;

  // 移除所有非数字、小数点和逗号的字符
  const cleanedStr = priceStr.replace(/[^0-9.,]/g, "");

  // 处理不同数字格式 (如 "1,234.56" 或 "1.234,56")
  let normalizedStr = cleanedStr;

  // 如果包含逗号和点，确定哪个是小数分隔符
  if (cleanedStr.includes(",") && cleanedStr.includes(".")) {
    const lastCommaIndex = cleanedStr.lastIndexOf(",");
    const lastDotIndex = cleanedStr.lastIndexOf(".");

    if (lastCommaIndex > lastDotIndex) {
      // 逗号是小数分隔符 (如 "1.234,56")
      normalizedStr = cleanedStr.replace(/\./g, "").replace(",", ".");
    } else {
      // 点是小数分隔符 (如 "1,234.56")
      normalizedStr = cleanedStr.replace(/,/g, "");
    }
  } else if (cleanedStr.includes(",")) {
    // 只有逗号，假设是小数分隔符
    normalizedStr = cleanedStr.replace(",", ".");
  }

  // 解析为数字
  const price = parseFloat(normalizedStr);
  return isNaN(price) ? 0 : price;
}

/**
 * 从字符串中提取数字
 * @param str 包含数字的字符串
 * @returns 提取的数字
 */
export function extractNumberFromString(str: string): number {
  if (!str) return 0;

  const match = str.match(/\d+(\.\d+)?/);
  if (match) {
    return parseFloat(match[0]);
  }
  return 0;
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateUniqueId(): string {
  return `cettire_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * 获取 Chrome 可执行文件路径
 * @returns Chrome 可执行文件路径
 */
export function getExecutablePath(): string | undefined {
  return process.env.CHROME_EXECUTABLE_PATH || undefined;
}

/**
 * 等待指定时间
 * @param ms 等待毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 记录信息日志
 * @param message 日志消息
 */
export function logInfo(message: string): void {
  console.log(`[INFO] ${message}`);
}

/**
 * 记录错误日志
 * @param message 错误消息
 */
export function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
}

/**
 * Ensures that a directory exists, creating it recursively if it does not.
 * @param dirPath The path to the directory.
 * @param logger An optional logger instance.
 */
export function ensureDirectoryExists(
  dirPath: string,
  logger: Log = crawleeLog,
): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    logger.error(
      `Error creating directory ${dirPath}: ${(error as Error).message}`,
    );
    throw error;
  }
}
