/**
 * FMTC 商户信息抓取相关类型定义
 */

// === 基础数据接口 ===

/**
 * FMTC 商户基本信息 (从列表页抓取)
 */
export interface FMTCMerchantListData {
  /** 商户名称 */
  name: string;
  /** 商户国家 */
  country?: string;
  /** 网络平台 (联盟平台名称) */
  network?: string;
  /** 在FMTC上的添加日期 */
  dateAdded?: Date;
  /** 高级订阅数量 */
  premiumSubscriptions?: number;
  /** 商户详情页链接 */
  detailUrl?: string;
}

/**
 * FMTC 商户详细信息 (从详情页抓取)
 */
export interface FMTCMerchantDetailData {
  /** 官方网站 URL */
  homepage?: string;
  /** 主要分类 */
  primaryCategory?: string;
  /** 主要国家 */
  primaryCountry?: string;
  /** 配送地区 */
  shipsTo?: string[];
  /** FMTC 内部 ID */
  fmtcId?: string;
  /** 网络 ID (如 AW ID) */
  networkId?: string;
  /** 商户状态 */
  status?: string;
  /** 是否支持 FreshReach */
  freshReachSupported?: boolean;

  // 品牌图片信息
  /** 120x60 Logo URL */
  logo120x60?: string;
  /** 88x31 Logo URL */
  logo88x31?: string;
  /** 280x210 截图 URL */
  screenshot280x210?: string;
  /** 600x450 截图 URL */
  screenshot600x450?: string;

  // 关联链接
  /** 联盟链接 (如 AW URL) */
  affiliateUrl?: string;
  /** 预览优惠链接 */
  previewDealsUrl?: string;
  /** 按网络分组的联盟链接 (键为网络名称，值为链接数组) */
  affiliateLinks?: Record<string, string[]>;
  /** FreshReach链接列表 */
  freshReachUrls?: string[];

  // 网络关联信息
  /** 网络关联列表 */
  networks?: FMTCMerchantNetworkData[];
}

/**
 * FMTC 商户网络关联信息
 */
export interface FMTCMerchantNetworkData {
  /** 网络名称 */
  networkName: string;
  /** 网络ID */
  networkId?: string;
  /** 加入状态 */
  status: FMTCNetworkStatus;
  /** 商户在该网络的FMTC ID */
  fmtcId?: string;
  /** 加入网络的URL链接 */
  joinUrl?: string;
}

/**
 * 完整的 FMTC 商户数据 (列表 + 详情)
 */
export interface FMTCMerchantData
  extends FMTCMerchantListData,
    FMTCMerchantDetailData {
  /** 数据来源页面 URL */
  sourceUrl?: string;
  /** 原始数据 (调试用) */
  rawData?: Record<string, unknown>;
}

// === 爬虫配置接口 ===

/**
 * FMTC 登录凭据
 */
export interface FMTCCredentials {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 会话管理配置
 */
export interface SessionConfig {
  /** 会话文件名 */
  sessionFile?: string;
  /** 会话最大有效期（毫秒） */
  maxAge?: number;
  /** 是否自动保存会话 */
  autoSave?: boolean;
  /** 基础目录 */
  baseDir?: string;
}

/**
 * FMTC 爬虫选项
 */
export interface FMTCScraperOptions {
  /** 登录凭据 */
  credentials: FMTCCredentials;
  /** 最大抓取商家数量 */
  maxMerchants?: number;
  /** 是否抓取详情页 */
  includeDetails?: boolean;
  /** 是否下载图片 */
  downloadImages?: boolean;
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 请求间隔 (毫秒) */
  requestDelay?: number;
  /** 是否使用无头浏览器 */
  headless?: boolean;
  /** 存储目录 */
  storageDir?: string;
  /** 会话管理配置 */
  sessionConfig?: SessionConfig;
  /** 搜索参数 */
  searchParams?: Record<string, unknown>;
  /** reCAPTCHA 配置 */
  recaptchaConfig?: {
    /** reCAPTCHA 处理模式 */
    mode: "manual" | "auto" | "skip";
    /** 手动处理超时时间 (毫秒) */
    manualTimeout?: number;
    /** 自动处理超时时间 (毫秒) */
    autoTimeout?: number;
    /** 重试次数 */
    retryAttempts?: number;
    /** 重试间隔 (毫秒) */
    retryDelay?: number;
    /** 2captcha 配置 */
    twoCaptcha?: {
      /** API 密钥 */
      apiKey: string;
      /** 软件 ID */
      softId?: number;
      /** 服务器域名 */
      serverDomain?: string;
      /** 回调地址 */
      callback?: string;
    };
  };
}

/**
 * FMTC 抓取任务配置
 */
export interface FMTCScraperConfig {
  /** 最大商家数量限制 */
  maxMerchantsPerRun?: number;
  /** 是否启用详情抓取 */
  enableDetailScraping: boolean;
  /** 是否启用图片下载 */
  enableImageDownload: boolean;
  /** 请求延迟时间 (毫秒) */
  requestDelayMs: number;
  /** 并发数限制 */
  concurrencyLimit: number;
  /** 过滤条件 */
  filters?: {
    /** 国家过滤 */
    countries?: string[];
    /** 网络过滤 */
    networks?: string[];
    /** 分类过滤 */
    categories?: string[];
  };
}

/**
 * 任务配置接口
 */
export interface TaskConfig {
  maxMerchantsPerRun?: number;
  maxMerchants?: number;
  includeDetails?: boolean;
  downloadImages?: boolean;
  maxConcurrency?: number;
  requestDelay?: number;
  searchParams?: Record<string, unknown>;
}

/**
 * FMTC 数据库配置模型 (对应数据库 schema)
 */
export interface FMTCScraperDbConfig {
  /** 唯一标识符 */
  id: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string | null;

  // 基础配置
  /** 默认用户名 */
  defaultUsername?: string | null;
  /** 默认密码 */
  defaultPassword?: string | null;
  /** 默认最大商户数 */
  maxMerchants: number;
  /** 默认请求延迟(毫秒) */
  requestDelay: number;
  /** 是否启用图片下载 */
  enableImageDownload: boolean;
  /** 是否启用无头模式 */
  headlessMode: boolean;
  /** 是否启用调试模式 */
  debugMode: boolean;
  /** 默认最大并发数 */
  maxConcurrency: number;

  // reCAPTCHA 配置
  /** reCAPTCHA 模式 */
  recaptchaMode: string;
  /** 手动超时时间(毫秒) */
  recaptchaManualTimeout: number;
  /** 自动超时时间(毫秒) */
  recaptchaAutoTimeout: number;
  /** reCAPTCHA 重试次数 */
  recaptchaRetryAttempts: number;
  /** reCAPTCHA 重试延迟(毫秒) */
  recaptchaRetryDelay: number;

  // 2captcha 配置
  /** 2captcha API 密钥 */
  twoCaptchaApiKey?: string | null;
  /** 2captcha 软件ID */
  twoCaptchaSoftId: number;
  /** 2captcha 服务器域名 */
  twoCaptchaServerDomain: string;
  /** 2captcha 回调地址 */
  twoCaptchaCallback?: string | null;

  // 搜索配置
  /** 默认搜索文本 */
  searchText?: string | null;
  /** 默认网络ID */
  searchNetworkId?: string | null;
  /** 默认OPM提供商 */
  searchOpmProvider?: string | null;
  /** 默认搜索分类 */
  searchCategory?: string | null;
  /** 默认搜索国家 */
  searchCountry?: string | null;
  /** 默认配送国家 */
  searchShippingCountry?: string | null;
  /** 默认显示类型 */
  searchDisplayType: string;

  // 搜索行为配置
  /** 是否启用随机延迟 */
  searchEnableRandomDelay: boolean;
  /** 搜索最小延迟(毫秒) */
  searchMinDelay: number;
  /** 搜索最大延迟(毫秒) */
  searchMaxDelay: number;
  /** 最小输入延迟(毫秒) */
  searchTypingDelayMin: number;
  /** 最大输入延迟(毫秒) */
  searchTypingDelayMax: number;
  /** 是否启用鼠标移动模拟 */
  searchEnableMouseMovement: boolean;

  // 高级配置
  /** 会话超时时间(毫秒) */
  sessionTimeout: number;
  /** 最大连续错误数 */
  maxConsecutiveErrors: number;
  /** 错误冷却时间(毫秒) */
  errorCooldownPeriod: number;

  /** 是否启用此配置 */
  isEnabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// === 抓取任务相关接口 ===

/**
 * FMTC 抓取任务
 */
export interface FMTCScraperTask {
  /** 任务ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 登录凭据 (加密) */
  credentials: FMTCCredentials | Record<string, unknown>;
  /** 抓取配置 */
  config: Record<string, unknown>;
  /** 是否启用 */
  isEnabled: boolean;
  /** CRON 表达式 */
  cronExpression?: string;
  /** 最后执行时间 */
  lastExecutedAt?: Date;
  /** 下次执行时间 */
  nextExecuteAt?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * FMTC 抓取执行记录
 */
export interface FMTCScraperExecution {
  /** 执行ID */
  id: string;
  /** 任务ID */
  taskId: string;
  /** 执行状态 */
  status: FMTCScraperExecutionStatus;
  /** 开始时间 */
  startedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 抓取统计 */
  metrics?: FMTCScraperMetrics;
  /** 错误信息 */
  errorMessage?: string;
  /** 错误堆栈 */
  errorStack?: string;
  /** 抓取的商户数量 */
  merchantsCount: number;
  /** 新增商户数量 */
  newMerchantsCount: number;
  /** 更新商户数量 */
  updatedMerchantsCount: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * FMTC 抓取统计信息
 */
export interface FMTCScraperMetrics {
  /** 总处理页数 */
  totalPages: number;
  /** 成功处理页数 */
  successfulPages: number;
  /** 失败页数 */
  failedPages: number;
  /** 抓取的商户总数 */
  totalMerchants: number;
  /** 新增商户数 */
  newMerchants: number;
  /** 更新商户数 */
  updatedMerchants: number;
  /** 跳过商户数 */
  skippedMerchants: number;
  /** 抓取详情成功数 */
  detailsSuccessCount: number;
  /** 抓取详情失败数 */
  detailsFailCount: number;
  /** 下载图片数量 */
  downloadedImages: number;
  /** 总耗时 (毫秒) */
  totalDurationMs: number;
  /** 平均每页耗时 (毫秒) */
  avgPageDurationMs: number;
}

// === 品牌匹配相关接口 ===

/**
 * 品牌匹配结果
 */
export interface FMTCBrandMatchResult {
  /** 商户名称 */
  merchantName: string;
  /** 匹配的品牌ID */
  brandId?: string;
  /** 匹配的品牌名称 */
  brandName?: string;
  /** 匹配置信度 (0-1) */
  confidence: number;
  /** 匹配方法 */
  matchMethod: FMTCBrandMatchMethod;
  /** 是否需要人工确认 */
  requiresConfirmation: boolean;
}

/**
 * 品牌匹配建议
 */
export interface FMTCBrandMatchSuggestion {
  /** 品牌ID */
  brandId: string;
  /** 品牌名称 */
  brandName: string;
  /** 匹配置信度 */
  confidence: number;
  /** 匹配原因 */
  reason: string;
}

/**
 * 品牌匹配统计
 */
export interface FMTCBrandMatchStats {
  /** 总商户数 */
  totalMerchants: number;
  /** 已匹配数 */
  matchedMerchants: number;
  /** 未匹配数 */
  unmatchedMerchants: number;
  /** 待确认数 */
  pendingConfirmation: number;
  /** 匹配率 */
  matchRate: number;
}

// === API 响应接口 ===

/**
 * FMTC 商户列表 API 响应
 */
export interface FMTCMerchantsListResponse {
  /** 是否成功 */
  success: boolean;
  /** 商户列表 */
  data: FMTCMerchantData[];
  /** 分页信息 */
  pagination: {
    /** 当前页 */
    page: number;
    /** 每页数量 */
    limit: number;
    /** 总数量 */
    total: number;
    /** 总页数 */
    totalPages: number;
  };
  /** 统计信息 */
  stats?: FMTCMerchantStats;
  /** 错误信息 */
  error?: string;
}

/**
 * FMTC 商户统计信息
 */
export interface FMTCMerchantStats {
  /** 总商户数 */
  totalMerchants: number;
  /** 活跃商户数 */
  activeMerchants: number;
  /** 已匹配品牌数 */
  brandMatchedMerchants: number;
  /** 未匹配品牌数 */
  brandUnmatchedMerchants: number;
  /** 最后更新时间 */
  lastUpdateTime?: Date;
  /** 按国家分组 */
  byCountry: Record<string, number>;
  /** 按网络分组 */
  byNetwork: Record<string, number>;
}

/**
 * FMTC 抓取任务控制 API 响应
 */
export interface FMTCScraperControlResponse {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: {
    /** 任务信息 */
    task?: FMTCScraperTask;
    /** 执行记录 */
    execution?: FMTCScraperExecution;
    /** 执行历史 */
    executions?: FMTCScraperExecution[];
  };
  /** 消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
}

// === 枚举类型 ===

/**
 * FMTC 网络状态
 */
export enum FMTCNetworkStatus {
  /** 已加入 */
  JOINED = "Joined",
  /** 未加入 */
  NOT_JOINED = "Not Joined",
  /** 关系未验证 */
  RELATIONSHIP_NOT_VERIFIED = "Relationship Not Verified",
}

/**
 * FMTC 抓取执行状态
 */
export enum FMTCScraperExecutionStatus {
  /** 空闲 */
  IDLE = "IDLE",
  /** 队列中 */
  QUEUED = "QUEUED",
  /** 运行中 */
  RUNNING = "RUNNING",
  /** 已完成 */
  COMPLETED = "COMPLETED",
  /** 失败 */
  FAILED = "FAILED",
  /** 已取消 */
  CANCELLED = "CANCELLED",
}

/**
 * FMTC 品牌匹配方法
 */
export enum FMTCBrandMatchMethod {
  /** 精确匹配 */
  EXACT = "EXACT",
  /** 模糊匹配 */
  FUZZY = "FUZZY",
  /** 域名匹配 */
  DOMAIN = "DOMAIN",
  /** 手动匹配 */
  MANUAL = "MANUAL",
}

/**
 * FMTC 抓取触发类型
 */
export enum FMTCScraperTriggerType {
  /** 手动触发 */
  MANUAL = "MANUAL",
  /** 定时触发 */
  SCHEDULED = "SCHEDULED",
  /** API 触发 */
  API = "API",
}

// === 请求接口 ===

/**
 * FMTC 商户查询请求
 */
export interface FMTCMerchantsQueryRequest {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
  /** 搜索关键词 */
  search?: string;
  /** 国家过滤 */
  country?: string;
  /** 网络过滤 */
  network?: string;
  /** 品牌匹配状态 */
  brandMatchStatus?: "matched" | "unmatched" | "pending";
  /** 激活状态 */
  isActive?: boolean;
  /** 排序字段 */
  sortBy?: "name" | "country" | "network" | "lastScrapedAt" | "createdAt";
  /** 排序方向 */
  sortOrder?: "asc" | "desc";
}

/**
 * FMTC 商户批量操作请求
 */
export interface FMTCMerchantsBatchRequest {
  /** 商户ID列表 */
  merchantIds: string[];
  /** 操作类型 */
  action: "activate" | "deactivate" | "delete" | "matchBrand" | "refreshData";
  /** 操作数据 */
  data?: Record<string, unknown>;
}

/**
 * FMTC 抓取任务启动请求
 */
export interface FMTCScraperStartRequest {
  /** 任务ID */
  taskId?: string;
  /** 触发类型 */
  triggerType: FMTCScraperTriggerType;
  /** 自定义配置 */
  config?: Partial<FMTCScraperConfig>;
}

/**
 * FMTC 品牌匹配请求
 */
export interface FMTCBrandMatchRequest {
  /** 商户名称列表 */
  merchantNames?: string[];
  /** 商户ID列表 */
  merchantIds?: string[];
  /** 操作类型 */
  action: "match" | "batchMatch" | "confirm" | "reject";
  /** 品牌ID (确认匹配时使用) */
  brandId?: string;
}
