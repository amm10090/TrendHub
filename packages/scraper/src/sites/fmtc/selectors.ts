/**
 * FMTC 页面选择器定义
 */

import type { FMTCSelectors } from "./types.js";

/**
 * FMTC 页面选择器配置
 */
export const FMTC_SELECTORS: FMTCSelectors = {
  // 登录页面选择器
  login: {
    /** 用户名输入框 */
    usernameInput: '#username, input[name="username"]',
    /** 密码输入框 */
    passwordInput: '#password, input[name="password"]',
    /** 登录按钮 */
    submitButton: 'button[type="submit"], .btn.fmtc-primary-btn',
    /** 登录表单 */
    loginForm: 'form#form, form[name="form"], form[action="/cp/login"]',
    /** 错误消息 */
    errorMessage:
      '.error, .alert-danger, .login-error, [class*="error"], [class*="invalid"], .rc-anchor-error-msg',
    /** reCAPTCHA */
    recaptcha: ".g-recaptcha, #rc-anchor-container, .recaptcha-checkbox",
    /** reCAPTCHA 响应字段 */
    recaptchaResponse:
      '#g-recaptcha-response, textarea[name="g-recaptcha-response"]',
    /** reCAPTCHA 复选框 */
    recaptchaCheckbox: ".recaptcha-checkbox, #recaptcha-anchor",
    /** 忘记密码链接 */
    forgotPasswordLink: 'a[href="/cp/login/forgot"]',
    /** 注册链接 */
    signUpLink: 'a[href*="sign-up"]',
  },

  // 商户列表页面选择器
  merchantList: {
    /** 商户行 - 表格行或列表项 */
    merchantRows:
      'table tbody tr, .merchant-row, .program-row, [class*="merchant"], [class*="program"]',
    /** 商户名称 */
    merchantName:
      'td:first-child a, .merchant-name a, .program-name a, a[href*="merchant"], a[href*="program"]',
    /** 商户国家 */
    merchantCountry: 'td:nth-child(2), .country, [class*="country"]',
    /** 网络平台 */
    network: 'td:nth-child(3), .network, [class*="network"]',
    /** 添加日期 */
    dateAdded: 'td:nth-child(4), .date-added, [class*="date"]',
    /** 高级订阅数 */
    premiumSubscriptions: 'td:nth-child(5), .premium-count, [class*="premium"]',
    /** 详情链接 */
    detailLink: 'a[href*="merchant"], a[href*="program"], td:first-child a',

    // 分页相关选择器
    pagination: {
      /** 下一页按钮 */
      nextButton:
        'a:has-text("Next"), .next, [aria-label="Next"], button:has-text("Next")',
      /** 页码链接 */
      pageLinks: '.pagination a, .pager a, [class*="page"] a',
      /** 当前页 */
      currentPage: '.pagination .active, .current-page, [class*="active"]',
      /** 总页数 */
      totalPages: ".pagination a:last-child, .total-pages",
    },
  },

  // 商户详情页面选择器
  merchantDetail: {
    /** 官方网站 */
    homepage:
      'li.list-group-item:has(span:has-text("Homepage:")) .ml-5 a, li.list-group-item:has(span:has-text("Homepage:")) span.ml-5 a',
    /** 主要分类 */
    primaryCategory:
      'li.list-group-item:has(span:has-text("Primary Category:")) .ml-5, li.list-group-item:has(span:has-text("Primary Category:")) span.ml-5',
    /** 主要国家 */
    primaryCountry:
      'li.list-group-item:has(span:has-text("Primary Country:")) .ml-5, li.list-group-item:has(span:has-text("Primary Country:")) span.ml-5',
    /** 配送地区 */
    shipsTo:
      'li.list-group-item:has(span:has-text("Ships To:")) .ml-5, li.list-group-item:has(span:has-text("Ships To:")) span.ml-5',
    /** FMTC ID - 从网络表格中提取 */
    fmtcId:
      "table.fmtc-table tbody tr td:nth-child(2), .fmtc-table tbody tr td:nth-child(2)",
    /** 商户状态 - 从网络表格状态列提取 */
    status: "table.fmtc-table tbody tr td:nth-child(4) .badge",
    /** FreshReach 支持 */
    freshReachSupported:
      'span.label:has-text("FreshReach"), .label:has-text("FreshReach")',

    // Logo 图片选择器 - 从商户信息和Tools部分提取
    logos: {
      logo120x60:
        'li.list-group-item:has(span:has-text("Logo:")) img, a:has-text("120x60 Logo")',
      logo88x31: 'a:has-text("88x31 Logo")',
    },

    // 截图选择器 - 从Tools部分提取
    screenshots: {
      screenshot280x210: 'a:has-text("280x210 Screenshot")',
      screenshot600x450: 'a:has-text("600x450 Screenshot")',
    },

    /** 联盟链接 - 从Tools部分AW URL提取 */
    affiliateUrl:
      'li.list-group-item:has-text("AW URL:") a, li:has-text("AW URL:") a',
    /** 预览优惠链接 - 从Tools部分提取 */
    previewDealsUrl: 'a.showdeals, a:has-text("Preview Deals"), .showdeals',

    // 网络关联表格 - 更新为实际的表格结构
    networkTable: {
      /** 表格行 */
      rows: "table.fmtc-table tbody tr, .table-striped tbody tr",
      /** FMTC ID (第2列) */
      fmtcId: "td:nth-child(2)",
      /** 网络名称和ID (第3列) */
      networkName: "td:nth-child(3)",
      /** 状态 (第4列) */
      status: "td:nth-child(4)",
      /** Join按钮 (第5列) */
      joinButton: "td:nth-child(5) a",
    },
  },
};

/**
 * FMTC URL 模式
 */
export const FMTC_URL_PATTERNS = {
  /** 登录页面 */
  LOGIN: "https://account.fmtc.co/cp/login",
  /** 商户目录页面 */
  MERCHANT_DIRECTORY: "https://account.fmtc.co/cp/program_directory/index",
  /** 默认的商户列表页面 */
  DEFAULT_MERCHANT_LIST:
    "https://account.fmtc.co/cp/program_directory/index/net/0/opm/0/cntry/0/cat/2/unsmrch/0",
  /** 商户详情页面模式 */
  MERCHANT_DETAIL_PATTERN:
    /https:\/\/account\.fmtc\.co\/cp\/program_directory\/merchant\/\d+/,
};

/**
 * FMTC 页面等待条件
 */
export const FMTC_WAIT_CONDITIONS = {
  /** 登录页面加载完成 */
  LOGIN_PAGE_LOADED: () => FMTC_SELECTORS.login.usernameInput,
  /** 登录成功 */
  LOGIN_SUCCESS: () => "body:not(:has(.error)):not(:has(.alert-danger))",
  /** 商户列表页面加载完成 */
  MERCHANT_LIST_LOADED: () => FMTC_SELECTORS.merchantList.merchantRows,
  /** 商户详情页面加载完成 */
  MERCHANT_DETAIL_LOADED: () =>
    `${FMTC_SELECTORS.merchantDetail.homepage}, .merchant-info, .program-info`,
  /** 分页加载完成 */
  PAGINATION_LOADED: () => FMTC_SELECTORS.merchantList.pagination.pageLinks,
};

/**
 * FMTC 页面特征检测
 */
export const FMTC_PAGE_FEATURES = {
  /** 检测是否为登录页面 */
  isLoginPage: () =>
    document.querySelector('#username, #password, form[action="/cp/login"]') !==
    null,
  /** 检测是否已登录 */
  isLoggedIn: () =>
    document.querySelector('.user-menu, .logout, [href*="logout"]') !== null &&
    !document.querySelector("#username, #password"),
  /** 检测是否为商户列表页面 */
  isMerchantListPage: () =>
    document.querySelector(FMTC_SELECTORS.merchantList.merchantRows) !== null,
  /** 检测是否为商户详情页面 */
  isMerchantDetailPage: () =>
    document.querySelector(FMTC_SELECTORS.merchantDetail.homepage) !== null,
  /** 检测是否出现错误 */
  hasError: () =>
    document.querySelector(FMTC_SELECTORS.login.errorMessage!) !== null,
  /** 检测是否需要验证码 */
  requiresCaptcha: () =>
    document.querySelector(".g-recaptcha, #rc-anchor-container") !== null,
};

/**
 * FMTC 数据提取正则表达式
 */
export const FMTC_REGEX_PATTERNS = {
  /** 提取 FMTC ID */
  FMTC_ID: /FMTC\s*ID[:\s]*(\d+)/i,
  /** 提取网络 ID */
  NETWORK_ID: /\((\d+)\)$/,
  /** 提取日期 */
  DATE: /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
  /** 提取数字 */
  NUMBERS: /\d+/g,
  /** 提取 URL */
  URL: /(https?:\/\/[^\s]+)/g,
  /** 提取邮箱 */
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
};

/**
 * FMTC 错误消息模式
 */
export const FMTC_ERROR_PATTERNS = {
  /** 登录失败 */
  LOGIN_FAILED: [
    "invalid credentials",
    "incorrect username",
    "incorrect password",
    "login failed",
    "authentication failed",
  ],
  /** 账户被锁定 */
  ACCOUNT_LOCKED: [
    "account locked",
    "account suspended",
    "account disabled",
    "too many attempts",
  ],
  /** 需要验证码 */
  CAPTCHA_REQUIRED: ["captcha", "verification required", "prove you are human"],
  /** 会话过期 */
  SESSION_EXPIRED: [
    "session expired",
    "please login again",
    "authentication timeout",
  ],
  /** 访问被拒绝 */
  ACCESS_DENIED: [
    "access denied",
    "permission denied",
    "unauthorized",
    "forbidden",
  ],
};
