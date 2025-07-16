/**
 * FMTC 爬虫配置
 */

import type { FMTCScraperOptions, FMTCAntiDetectionConfig } from "./types.js";
import { ReCAPTCHAMode, type ReCAPTCHAConfig } from "./recaptcha-service.js";

/**
 * 默认的 FMTC 爬虫选项
 */
export const DEFAULT_FMTC_OPTIONS: Partial<FMTCScraperOptions> = {
  maxPages: 10,
  maxMerchants: 500, // 默认最多抓取500个商家
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
  RECAPTCHA_AUTO_TIMEOUT: 60000, // 自动解决reCAPTCHA的最大时间 - 改为1分钟
  RECAPTCHA_RETRY_ATTEMPTS: 5, // reCAPTCHA重试次数 - 增加重试次数
  RECAPTCHA_RETRY_DELAY: 8000, // reCAPTCHA重试延迟 - 增加延迟时间

  // 抓取限制
  MAX_PAGES_PER_SESSION: 50,
  MAX_MERCHANTS_PER_PAGE: 100,
  MAX_MERCHANTS_PER_SESSION: 1000, // 单次会话最大商家数量
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
 * FMTC配置接口
 */
export interface FMTCConfig {
  // 基础配置
  username?: string;
  password?: string;
  maxPages?: number;
  maxMerchants?: number;
  requestDelay?: number;
  enableImageDownload?: boolean;
  headlessMode?: boolean;
  debugMode?: boolean;
  maxConcurrency?: number;

  // reCAPTCHA配置
  recaptchaMode?: string;
  recaptchaManualTimeout?: number;
  recaptchaAutoTimeout?: number;
  recaptchaRetryAttempts?: number;
  recaptchaRetryDelay?: number;

  // 2captcha配置
  twoCaptchaApiKey?: string;
  twoCaptchaSoftId?: number;
  twoCaptchaServerDomain?: string;
  twoCaptchaCallback?: string;

  // 搜索配置
  searchText?: string;
  searchNetworkId?: string;
  searchOpmProvider?: string;
  searchCategory?: string;
  searchCountry?: string;
  searchShippingCountry?: string;
  searchDisplayType?: string;

  // 搜索行为配置
  searchEnableRandomDelay?: boolean;
  searchMinDelay?: number;
  searchMaxDelay?: number;
  searchTypingDelayMin?: number;
  searchTypingDelayMax?: number;
  searchEnableMouseMovement?: boolean;

  // 高级配置
  sessionTimeout?: number;
  maxConsecutiveErrors?: number;
  errorCooldownPeriod?: number;
}

/**
 * 获取环境变量配置（向后兼容）
 */
export function getEnvironmentConfig() {
  return {
    username: process.env.FMTC_USERNAME,
    password: process.env.FMTC_PASSWORD,
    maxPages: parseInt(process.env.FMTC_MAX_PAGES || "10"),
    maxMerchants: parseInt(process.env.FMTC_MAX_MERCHANTS || "500"),
    requestDelay: parseInt(process.env.FMTC_REQUEST_DELAY || "2000"),
    enableImageDownload: process.env.FMTC_ENABLE_IMAGE_DOWNLOAD === "true",
    headlessMode: process.env.FMTC_HEADLESS_MODE !== "false",
    debugMode: process.env.FMTC_DEBUG_MODE === "true",
    maxConcurrency: parseInt(process.env.FMTC_MAX_CONCURRENCY || "1"),
  };
}

/**
 * 基于配置参数获取配置
 */
export function getConfigFromParams(config?: FMTCConfig) {
  const defaults = {
    username: undefined,
    password: undefined,
    maxPages: 10,
    maxMerchants: 500,
    requestDelay: 2000,
    enableImageDownload: false,
    headlessMode: true,
    debugMode: false,
    maxConcurrency: 1,
  };

  if (!config) {
    return defaults;
  }

  return {
    username: config.username,
    password: config.password,
    maxPages: config.maxPages ?? defaults.maxPages,
    maxMerchants: config.maxMerchants ?? defaults.maxMerchants,
    requestDelay: config.requestDelay ?? defaults.requestDelay,
    enableImageDownload:
      config.enableImageDownload ?? defaults.enableImageDownload,
    headlessMode: config.headlessMode ?? defaults.headlessMode,
    debugMode: config.debugMode ?? defaults.debugMode,
    maxConcurrency: config.maxConcurrency ?? defaults.maxConcurrency,
  };
}

/**
 * 获取 reCAPTCHA 配置（从环境变量，向后兼容）
 */
export function getRecaptchaConfig(): ReCAPTCHAConfig {
  // 确定reCAPTCHA模式
  let mode: ReCAPTCHAMode = ReCAPTCHAMode.MANUAL; // 默认手动模式

  const recaptchaMode = process.env.FMTC_RECAPTCHA_MODE?.toLowerCase();
  const apiKey = process.env.FMTC_2CAPTCHA_API_KEY;

  if (recaptchaMode === "auto") {
    if (apiKey) {
      mode = ReCAPTCHAMode.AUTO;
    }
  } else if (recaptchaMode === "skip") {
    mode = ReCAPTCHAMode.SKIP;
  }

  return {
    mode,
    manualTimeout: parseInt(
      process.env.FMTC_RECAPTCHA_MANUAL_TIMEOUT ||
        String(FMTC_CONFIG.MANUAL_INTERVENTION_TIMEOUT),
    ),
    autoTimeout: parseInt(
      process.env.FMTC_RECAPTCHA_AUTO_TIMEOUT ||
        String(FMTC_CONFIG.RECAPTCHA_AUTO_TIMEOUT),
    ),
    retryAttempts: parseInt(
      process.env.FMTC_RECAPTCHA_RETRY_ATTEMPTS ||
        String(FMTC_CONFIG.RECAPTCHA_RETRY_ATTEMPTS),
    ),
    retryDelay: parseInt(
      process.env.FMTC_RECAPTCHA_RETRY_DELAY ||
        String(FMTC_CONFIG.RECAPTCHA_RETRY_DELAY),
    ),
    twoCaptcha: process.env.FMTC_2CAPTCHA_API_KEY
      ? {
          apiKey: process.env.FMTC_2CAPTCHA_API_KEY,
          softId: parseInt(process.env.FMTC_2CAPTCHA_SOFT_ID || "4580"),
          serverDomain:
            process.env.FMTC_2CAPTCHA_SERVER_DOMAIN || "2captcha.com",
          callback: process.env.FMTC_2CAPTCHA_CALLBACK,
        }
      : undefined,
  };
}

/**
 * 基于配置参数获取 reCAPTCHA 配置
 */
export function getRecaptchaConfigFromParams(
  config?: FMTCConfig,
): ReCAPTCHAConfig {
  // 确定reCAPTCHA模式
  let mode: ReCAPTCHAMode = ReCAPTCHAMode.MANUAL; // 默认手动模式

  const recaptchaMode = config?.recaptchaMode?.toLowerCase() || "manual";
  const apiKey = config?.twoCaptchaApiKey?.trim(); // 去除空白字符

  if (recaptchaMode === "auto") {
    if (apiKey && apiKey.length > 0) {
      mode = ReCAPTCHAMode.AUTO;
    }
  } else if (recaptchaMode === "skip") {
    mode = ReCAPTCHAMode.SKIP;
  }

  return {
    mode,
    manualTimeout:
      config?.recaptchaManualTimeout ?? FMTC_CONFIG.MANUAL_INTERVENTION_TIMEOUT,
    autoTimeout:
      config?.recaptchaAutoTimeout ?? FMTC_CONFIG.RECAPTCHA_AUTO_TIMEOUT,
    retryAttempts:
      config?.recaptchaRetryAttempts ?? FMTC_CONFIG.RECAPTCHA_RETRY_ATTEMPTS,
    retryDelay:
      config?.recaptchaRetryDelay ?? FMTC_CONFIG.RECAPTCHA_RETRY_DELAY,
    twoCaptcha: apiKey
      ? {
          apiKey,
          softId: config?.twoCaptchaSoftId ?? 4580,
          serverDomain: config?.twoCaptchaServerDomain ?? "2captcha.com",
          callback: config?.twoCaptchaCallback,
        }
      : undefined,
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

/**
 * 获取搜索配置（从环境变量，向后兼容）
 */
export function getSearchConfig() {
  return {
    // 搜索参数
    searchText: process.env.FMTC_SEARCH_TEXT || "",
    networkId: process.env.FMTC_SEARCH_NETWORK_ID || "",
    opmProvider: process.env.FMTC_SEARCH_OPM_PROVIDER || "",
    category: process.env.FMTC_SEARCH_CATEGORY || "",
    country: process.env.FMTC_SEARCH_COUNTRY || "",
    shippingCountry: process.env.FMTC_SEARCH_SHIPPING_COUNTRY || "",
    displayType:
      (process.env.FMTC_SEARCH_DISPLAY_TYPE as
        | "all"
        | "accepting"
        | "not_accepting") || "all",

    // 行为配置
    enableRandomDelay: process.env.FMTC_SEARCH_ENABLE_RANDOM_DELAY !== "false",
    minDelay: parseInt(process.env.FMTC_SEARCH_MIN_DELAY || "500"),
    maxDelay: parseInt(process.env.FMTC_SEARCH_MAX_DELAY || "2000"),
    typingDelayMin: parseInt(process.env.FMTC_SEARCH_TYPING_DELAY_MIN || "50"),
    typingDelayMax: parseInt(process.env.FMTC_SEARCH_TYPING_DELAY_MAX || "200"),
    enableMouseMovement: process.env.FMTC_SEARCH_MOUSE_MOVEMENT !== "false",
  };
}

/**
 * 分类映射表 - 将文本映射到对应的Chosen.js索引
 * 基于实际FMTC页面的HTML结构更新 - 完整版本
 */
export const CATEGORY_MAP = new Map([
  // 主要分类 (基于实际HTML data-option-array-index)
  ["Alcohol / Beer", "1"],
  ["Animals & Pet Supplies", "6"],
  ["Arts & Entertainment", "11"],
  ["Auctions", "24"],
  ["B2B", "25"],
  ["Babies & Kids", "35"],
  ["Charity", "43"],
  ["Clothing & Apparel", "44"], // 目标分类
  ["Computers & Accessories", "69"],
  ["Consumer Electronics", "90"],
  ["Consumer Services", "113"],
  ["COVID Related", "119"],
  ["Curbside Pickup", "120"],
  ["Department Stores", "121"],
  ["Education", "122"],
  ["Erotic", "126"],
  ["Financial", "132"],
  ["Food & Gourmet", "146"],
  ["Gambling", "164"],
  ["Gifts", "165"],
  ["Green Living (Eco-Friendly)", "172"],
  ["Group Discount", "173"],
  ["Hardware", "183"],
  ["Health & Beauty", "186"],
  ["Holidays & Occasions", "195"],
  ["Household", "239"],
  ["Kids", "253"],
  ["Local Deals", "254"],
  ["Luggage & Bags", "282"],
  ["Media", "284"],
  ["Mens", "288"],
  ["Office", "289"],
  ["Sporting Goods", "294"],
  ["Tobacco", "321"],
  ["Toys & Games", "324"],
  ["Travel", "338"],
  ["Vehicles & Parts", "344"],
  ["Weapons", "352"],
  ["Womens", "353"],

  // 常用别名和简化名称
  ["Clothing", "44"],
  ["Apparel", "44"],
  ["Fashion", "44"],
  ["Electronics", "90"],
  ["Computers", "69"],
  ["Travel & Tourism", "338"],
  ["Health", "186"],
  ["Beauty", "186"],
  ["Sports", "294"],
  ["Home", "239"],
  ["Baby", "35"],
  ["Kids & Baby", "35"],
  ["Toys", "324"],
  ["Games", "324"],
  ["Food", "146"],
  ["Gourmet", "146"],
  ["Books", "284"],
  ["Movies", "284"],
  ["Music", "284"],
]);

/**
 * URL分类ID映射表 - 将文本映射到URL中的分类ID
 * 这个ID用于构建最终的搜索URL
 */
export const CATEGORY_URL_MAP = new Map([
  ["Clothing & Apparel", "2"], // URL中的分类ID
  ["Animals & Pet Supplies", "6"],
  ["Arts & Entertainment", "11"],
  ["Auctions", "24"],
  ["B2B", "25"],
  ["Babies & Kids", "35"],
  ["Charity", "43"],
  ["Computers & Accessories", "69"],
  ["Consumer Electronics", "90"],
  ["Consumer Services", "113"],
  ["COVID Related", "119"],
  ["Curbside Pickup", "120"],
  ["Department Stores", "121"],
  ["Education", "122"],
  ["Erotic", "126"],
  ["Financial", "132"],
  ["Food & Gourmet", "146"],
  ["Gambling", "164"],
  ["Gifts", "165"],
  ["Green Living (Eco-Friendly)", "172"],
  ["Group Discount", "173"],
  ["Hardware", "183"],
  ["Health & Beauty", "186"],
  ["Holidays & Occasions", "195"],
  ["Household", "239"],
  ["Kids", "253"],
  ["Local Deals", "254"],
  ["Luggage & Bags", "282"],
  ["Media", "284"],
  ["Mens", "288"],
  ["Office", "289"],
  ["Sporting Goods", "294"],
  ["Tobacco", "321"],
  ["Toys & Games", "324"],
  ["Travel", "338"],
  ["Vehicles & Parts", "344"],
  ["Weapons", "352"],
  ["Womens", "353"],
]);

/**
 * 智能分类匹配 - 支持文本和数字输入
 */
export function resolveCategoryValue(input: string): string {
  if (!input) return "";

  const trimmedInput = input.trim();

  // 1. 如果是数字，直接返回
  if (/^\d+$/.test(trimmedInput)) {
    return trimmedInput;
  }

  // 2. 精确文本匹配
  if (CATEGORY_MAP.has(trimmedInput)) {
    return CATEGORY_MAP.get(trimmedInput)!;
  }

  // 3. 大小写不敏感的匹配
  for (const [key, value] of CATEGORY_MAP) {
    if (key.toLowerCase() === trimmedInput.toLowerCase()) {
      return value;
    }
  }

  // 4. 包含匹配
  for (const [key, value] of CATEGORY_MAP) {
    if (
      key.toLowerCase().includes(trimmedInput.toLowerCase()) ||
      trimmedInput.toLowerCase().includes(key.toLowerCase())
    ) {
      return value;
    }
  }

  // 5. 如果都不匹配，返回原始输入
  return trimmedInput;
}

/**
 * 基于配置参数获取搜索配置
 */
export function getSearchConfigFromParams(config?: FMTCConfig) {
  return {
    // 搜索参数
    searchText: config?.searchText || "",
    networkId: config?.searchNetworkId || "",
    opmProvider: config?.searchOpmProvider || "",
    category: resolveCategoryValue(config?.searchCategory || ""),
    country: config?.searchCountry || "",
    shippingCountry: config?.searchShippingCountry || "",
    displayType:
      (config?.searchDisplayType as "all" | "accepting" | "not_accepting") ||
      "all",

    // 行为配置
    enableRandomDelay: config?.searchEnableRandomDelay ?? true,
    minDelay: config?.searchMinDelay ?? 500,
    maxDelay: config?.searchMaxDelay ?? 2000,
    typingDelayMin: config?.searchTypingDelayMin ?? 50,
    typingDelayMax: config?.searchTypingDelayMax ?? 200,
    enableMouseMovement: config?.searchEnableMouseMovement ?? true,
  };
}

/**
 * 验证搜索配置
 */
export function validateSearchConfig(
  config: ReturnType<typeof getSearchConfig>,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证延迟时间
  if (config.minDelay < 0 || config.minDelay > 10000) {
    errors.push("minDelay 必须在 0-10000 毫秒之间");
  }

  if (config.maxDelay < config.minDelay || config.maxDelay > 30000) {
    errors.push("maxDelay 必须大于 minDelay 且不超过 30000 毫秒");
  }

  // 验证输入延迟
  if (config.typingDelayMin < 0 || config.typingDelayMin > 1000) {
    errors.push("typingDelayMin 必须在 0-1000 毫秒之间");
  }

  if (
    config.typingDelayMax < config.typingDelayMin ||
    config.typingDelayMax > 2000
  ) {
    errors.push("typingDelayMax 必须大于 typingDelayMin 且不超过 2000 毫秒");
  }

  // 验证显示类型
  const validDisplayTypes = ["all", "accepting", "not_accepting"];
  if (!validDisplayTypes.includes(config.displayType)) {
    errors.push(
      "displayType 必须是 'all', 'accepting' 或 'not_accepting' 之一",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证 reCAPTCHA 配置
 */
export function validateRecaptchaConfig(config: ReCAPTCHAConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证超时时间
  if (config.manualTimeout < 10000 || config.manualTimeout > 300000) {
    errors.push("manualTimeout 必须在 10-300 秒之间");
  }

  if (config.autoTimeout < 30000 || config.autoTimeout > 600000) {
    errors.push("autoTimeout 必须在 30-600 秒之间");
  }

  // 验证重试配置
  if (config.retryAttempts < 1 || config.retryAttempts > 10) {
    errors.push("retryAttempts 必须在 1-10 之间");
  }

  if (config.retryDelay < 1000 || config.retryDelay > 30000) {
    errors.push("retryDelay 必须在 1-30 秒之间");
  }

  // 验证2captcha配置
  if (config.mode === ReCAPTCHAMode.AUTO) {
    if (!config.twoCaptcha?.apiKey) {
      errors.push("自动模式需要配置 2captcha API 密钥");
    }

    if (config.twoCaptcha?.apiKey && config.twoCaptcha.apiKey.length < 10) {
      errors.push("2captcha API 密钥长度不符合要求");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
