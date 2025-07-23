/**
 * FMTC 爬虫本地类型定义
 */

import type { PlaywrightCrawlingContext } from "crawlee";
import type {
  FMTCCredentials,
  FMTCScraperOptions,
  FMTCMerchantData,
  FMTCMerchantListData,
  FMTCMerchantDetailData,
  FMTCMerchantNetworkData,
  SessionConfig,
} from "@repo/types";
import type { FMTCSessionManager } from "./session-manager.js";
import type { FMTCConfig } from "./config.js";

// 重新导出需要的类型
export type {
  FMTCCredentials,
  FMTCScraperOptions,
  FMTCMerchantData,
  FMTCMerchantListData,
  FMTCMerchantDetailData,
  FMTCMerchantNetworkData,
  SessionConfig,
};

// 重新导出枚举
export { FMTCNetworkStatus } from "@repo/types";

/**
 * FMTC 爬虫用户数据
 */
export interface FMTCUserData {
  /** 执行ID */
  executionId?: string;
  /** 请求标签 */
  label: FMTCRequestLabel;
  /** 登录凭据 */
  credentials?: FMTCCredentials;
  /** 爬虫选项 */
  options?: FMTCScraperOptions;
  /** 页面编号 */
  pageNumber?: number;
  /** 商户详情URL */
  merchantUrl?: string;
  /** 商户名称 */
  merchantName?: string;
  /** 当前抓取进度 */
  progress?: {
    /** 已处理商户数 */
    processedMerchants: number;
    /** 目标商户数 */
    totalMerchants: number;
    /** 当前页数 */
    currentPage: number;
    /** 总页数 */
    totalPages: number;
  };
  /** 是否有现有会话 */
  hasExistingSession?: boolean;
  /** FMTC 配置参数 */
  fmtcConfig?: FMTCConfig;
  /** 商户详情索引 (用于进度跟踪) */
  merchantDetailIndex?: number;
  /** 待处理的详情总数 (用于进度跟踪) */
  totalDetailsToProcess?: number;
  /** 单商户模式标志 */
  singleMerchantMode?: boolean;
  /** 目标商户URL (单商户模式) */
  targetMerchantUrl?: string;
  /** 目标商户名称 (单商户模式) */
  targetMerchantName?: string;
}

/**
 * FMTC 请求标签类型
 */
export type FMTCRequestLabel =
  | "LOGIN"
  | "SEARCH"
  | "MERCHANT_LIST"
  | "MERCHANT_DETAIL"
  | "IMAGE_DOWNLOAD";

/**
 * FMTC 爬虫上下文
 */
export interface FMTCCrawlingContext extends PlaywrightCrawlingContext {
  /** 用户数据 */
  request: PlaywrightCrawlingContext["request"] & {
    userData: FMTCUserData;
  };
}

/**
 * FMTC 页面选择器
 */
export interface FMTCSelectors {
  /** 登录页面选择器 */
  login: {
    /** 用户名输入框 */
    usernameInput: string;
    /** 密码输入框 */
    passwordInput: string;
    /** 登录按钮 */
    submitButton: string;
    /** 登录表单 */
    loginForm: string;
    /** 错误消息 */
    errorMessage?: string;
    /** reCAPTCHA */
    recaptcha?: string;
    /** reCAPTCHA 响应字段 */
    recaptchaResponse?: string;
    /** reCAPTCHA 复选框 */
    recaptchaCheckbox?: string;
    /** 忘记密码链接 */
    forgotPasswordLink?: string;
    /** 注册链接 */
    signUpLink?: string;
  };

  /** 商户列表页面选择器 */
  merchantList: {
    /** 商户行 */
    merchantRows: string;
    /** 商户名称 */
    merchantName: string;
    /** 商户国家 */
    merchantCountry: string;
    /** 网络平台 */
    network: string;
    /** 添加日期 */
    dateAdded: string;
    /** 高级订阅数 */
    premiumSubscriptions: string;
    /** 详情链接 */
    detailLink: string;
    /** 分页 */
    pagination: {
      /** 下一页按钮 */
      nextButton: string;
      /** 页码链接 */
      pageLinks: string;
      /** 当前页 */
      currentPage: string;
      /** 总页数 */
      totalPages: string;
    };
  };

  /** 商户详情页面选择器 */
  merchantDetail: {
    /** 官方网站 */
    homepage: string;
    /** 主要分类 */
    primaryCategory: string;
    /** 主要国家 */
    primaryCountry: string;
    /** 配送地区 */
    shipsTo: string;
    /** FMTC ID */
    fmtcId: string;
    /** 商户状态 */
    status: string;
    /** FreshReach 支持 */
    freshReachSupported: string;
    /** Logo 图片 */
    logos: {
      logo120x60: string;
      logo88x31: string;
    };
    /** 截图 */
    screenshots: {
      screenshot280x210: string;
      screenshot600x450: string;
    };
    /** 联盟链接 */
    affiliateUrl: string;
    /** 预览优惠链接 */
    previewDealsUrl: string;
    /** 网络关联表格 */
    networkTable: {
      /** 表格行 */
      rows: string;
      /** 网络名称 */
      networkName: string;
      /** 网络ID */
      networkId: string;
      /** 状态 */
      status: string;
    };
  };
}

/**
 * FMTC 登录结果
 */
export interface FMTCLoginResult {
  /** 是否成功 */
  success: boolean;
  /** 错误消息 */
  error?: string;
  /** 是否需要验证码 */
  requiresCaptcha?: boolean;
  /** 会话信息 */
  sessionInfo?: {
    /** 用户名 */
    username: string;
    /** 登录时间 */
    loginTime: Date;
    /** 会话超时时间 */
    sessionTimeout?: number;
  };
}

/**
 * FMTC 商户列表抓取结果
 */
export interface FMTCMerchantListResult {
  /** 商户列表 */
  merchants: FMTCMerchantListData[];
  /** 分页信息 */
  pagination: {
    /** 当前页 */
    currentPage: number;
    /** 总页数 */
    totalPages: number;
    /** 是否有下一页 */
    hasNextPage: boolean;
    /** 下一页URL */
    nextPageUrl?: string;
  };
  /** 抓取统计 */
  stats: {
    /** 成功数量 */
    successCount: number;
    /** 失败数量 */
    failureCount: number;
    /** 总数量 */
    totalCount: number;
  };
}

/**
 * FMTC 商户详情抓取结果
 */
export interface FMTCMerchantDetailResult {
  /** 商户详情数据 */
  merchantDetail: FMTCMerchantDetailData;
  /** 是否成功 */
  success: boolean;
  /** 错误消息 */
  error?: string;
  /** 抓取时间 */
  scrapedAt: Date;
}

/**
 * FMTC 图片下载结果
 */
export interface FMTCImageDownloadResult {
  /** 原始URL */
  originalUrl: string;
  /** 本地路径 */
  localPath?: string;
  /** 是否成功 */
  success: boolean;
  /** 错误消息 */
  error?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 文件类型 */
  mimeType?: string;
}

/**
 * FMTC 反检测配置
 */
export interface FMTCAntiDetectionConfig {
  /** 是否启用随机延迟 */
  enableRandomDelay: boolean;
  /** 延迟范围 (毫秒) */
  delayRange: {
    min: number;
    max: number;
  };
  /** 是否模拟鼠标移动 */
  simulateMouseMovement: boolean;
  /** 是否模拟滚动 */
  simulateScrolling: boolean;
  /** 是否检测反爬机制 */
  detectAntiBot: boolean;
  /** 重试次数 */
  retryAttempts: number;
  /** 会话超时时间 (毫秒) */
  sessionTimeout: number;
}

/**
 * FMTC 抓取进度回调
 */
export interface FMTCProgressCallback {
  /** 页面进度更新 */
  onPageProgress?: (progress: {
    currentPage: number;
    totalPages: number;
    merchantsProcessed: number;
    merchantsTotal: number;
  }) => void;

  /** 商户处理完成 */
  onMerchantProcessed?: (merchant: FMTCMerchantData) => void;

  /** 错误发生 */
  onError?: (error: Error, context?: string) => void;

  /** 警告发生 */
  onWarning?: (warning: string, context?: string) => void;
}

/**
 * FMTC 请求处理器选项
 */
export interface FMTCRequestHandlerOptions {
  /** 抓取的商户数据存储 */
  allScrapedMerchants: FMTCMerchantData[];
  /** 爬虫选项 */
  scraperOptions: FMTCScraperOptions;
  /** 进度回调 */
  progressCallback?: FMTCProgressCallback;
  /** 反检测配置 */
  antiDetectionConfig?: FMTCAntiDetectionConfig;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 是否启用调试模式 */
  debugMode?: boolean;
  /** 会话管理器 */
  sessionManager?: FMTCSessionManager;
  /** FMTC 配置参数 */
  fmtcConfig?: FMTCConfig;
  /** 是否截取FMTC页面截图 */
  captureScreenshot?: boolean;
  /** 截图上传回调 */
  screenshotUploadCallback?: (
    buffer: Buffer,
    filename: string,
  ) => Promise<string>;
}
