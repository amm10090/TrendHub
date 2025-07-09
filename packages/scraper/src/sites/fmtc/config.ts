/**
 * FMTC 爬虫配置
 */

import type { FMTCScraperOptions, FMTCAntiDetectionConfig } from "./types.js";

/**
 * 默认的 FMTC 爬虫选项
 */
export const DEFAULT_FMTC_OPTIONS: Partial<FMTCScraperOptions> = {
  maxPages: 10,
  includeDetails: true,
  downloadImages: false,
  maxConcurrency: 1, // 保守设置，避免被封
  requestDelay: 2000, // 2秒延迟
  headless: true,
};

/**
 * 默认的反检测配置
 */
export const DEFAULT_ANTI_DETECTION_CONFIG: FMTCAntiDetectionConfig = {
  enableRandomDelay: true,
  delayRange: {
    min: 1000,
    max: 3000,
  },
  simulateMouseMovement: true,
  simulateScrolling: true,
  detectAntiBot: true,
  retryAttempts: 3,
  sessionTimeout: 30 * 60 * 1000,
};

/**
 * FMTC 环境配置
 */
export const FMTC_CONFIG = {
  // 基础 URL
  BASE_URL: "https://account.fmtc.co",
  LOGIN_URL: "https://account.fmtc.co/cp/login",
  MERCHANT_DIRECTORY_URL: "https://account.fmtc.co/cp/program_directory/index",

  // 默认的商户列表 URL
  DEFAULT_MERCHANT_LIST_URL:
    "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",

  // 请求配置
  REQUEST_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 45000,
  ELEMENT_TIMEOUT: 15000,

  // 重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,

  // 会话配置
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分钟
  LOGIN_CHECK_INTERVAL: 5 * 60 * 1000, // 5分钟检查一次登录状态

  // 验证码配置
  CAPTCHA_WAIT_TIMEOUT: 60000, // 等待验证码完成的最大时间
  MANUAL_INTERVENTION_TIMEOUT: 120000, // 等待手动干预的最大时间

  // 抓取限制
  MAX_PAGES_PER_SESSION: 50,
  MAX_MERCHANTS_PER_PAGE: 100,
  MIN_REQUEST_INTERVAL: 1000,
  MAX_REQUEST_INTERVAL: 5000,

  // 错误处理
  MAX_CONSECUTIVE_ERRORS: 5,
  ERROR_COOLDOWN_PERIOD: 30000,

  // 调试模式
  DEBUG_MODE: process.env.NODE_ENV === "development",
  HEADLESS_MODE: process.env.NODE_ENV === "production",

  // 用户代理
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  ],

  // 视口配置
  VIEWPORT_SIZES: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ],
};

/**
 * 获取随机用户代理
 */
export function getRandomUserAgent(): string {
  const userAgents = FMTC_CONFIG.USER_AGENTS;
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * 获取随机视口大小
 */
export function getRandomViewportSize(): { width: number; height: number } {
  const sizes = FMTC_CONFIG.VIEWPORT_SIZES;
  return sizes[Math.floor(Math.random() * sizes.length)];
}

/**
 * 获取随机延迟时间
 */
export function getRandomDelay(
  min: number = FMTC_CONFIG.MIN_REQUEST_INTERVAL,
  max: number = FMTC_CONFIG.MAX_REQUEST_INTERVAL,
): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 验证 FMTC 凭据
 */
export function validateCredentials(
  username?: string,
  password?: string,
): boolean {
  if (!username || !password) {
    return false;
  }

  if (username.trim().length === 0 || password.trim().length === 0) {
    return false;
  }

  // 基本的邮箱格式检查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    console.warn("用户名不是有效的邮箱格式");
  }

  return true;
}

/**
 * 获取环境变量配置
 */
export function getEnvironmentConfig() {
  return {
    username: process.env.FMTC_USERNAME,
    password: process.env.FMTC_PASSWORD,
    maxPages: parseInt(process.env.FMTC_MAX_PAGES || "10"),
    requestDelay: parseInt(process.env.FMTC_REQUEST_DELAY || "2000"),
    enableImageDownload: process.env.FMTC_ENABLE_IMAGE_DOWNLOAD === "true",
    headlessMode: process.env.FMTC_HEADLESS_MODE !== "false",
    debugMode: process.env.FMTC_DEBUG_MODE === "true",
    maxConcurrency: parseInt(process.env.FMTC_MAX_CONCURRENCY || "1"),
  };
}

/**
 * 检查配置的有效性
 */
export function validateConfig(config: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const username =
    typeof config.username === "string" ? config.username : undefined;
  const password =
    typeof config.password === "string" ? config.password : undefined;

  if (!validateCredentials(username, password)) {
    errors.push("无效的用户名或密码");
  }

  const maxPages =
    typeof config.maxPages === "number" ? config.maxPages : undefined;
  if (maxPages && (maxPages < 1 || maxPages > 100)) {
    errors.push("maxPages 必须在 1-100 之间");
  }

  const requestDelay =
    typeof config.requestDelay === "number" ? config.requestDelay : undefined;
  if (requestDelay && (requestDelay < 500 || requestDelay > 10000)) {
    errors.push("requestDelay 必须在 500-10000 毫秒之间");
  }

  const maxConcurrency =
    typeof config.maxConcurrency === "number"
      ? config.maxConcurrency
      : undefined;
  if (maxConcurrency && (maxConcurrency < 1 || maxConcurrency > 5)) {
    errors.push("maxConcurrency 必须在 1-5 之间");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
