/**
 * FMTC 测试专用类型定义
 */

/**
 * 简单日志接口
 */
export interface SimpleLog {
  info: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

/**
 * 页面元素检查结果
 */
export interface PageElementCheck {
  hasUsernameInput: boolean;
  hasPasswordInput: boolean;
  hasSubmitButton: boolean;
  hasRecaptcha: boolean;
  hasForm: boolean;
}

/**
 * 选择器测试结果
 */
export interface SelectorTestResult {
  usernameInput: boolean;
  passwordInput: boolean;
  submitButton: boolean;
  loginForm: boolean;
  recaptcha: boolean;
  recaptchaResponse: boolean;
  forgotPasswordLink: boolean;
  signUpLink: boolean;
}

/**
 * 登录测试配置
 */
export interface LoginTestConfig {
  username?: string;
  password?: string;
  headless: boolean;
  timeout: number;
}
