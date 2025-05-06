/**
 * API配置
 * 定义了所有用于接口调用的基础URL和其他API相关配置
 */

// API基础URL，根据环境变量或默认值确定
export const API_URL = '/api/public';

// API请求超时时间（毫秒）
export const API_TIMEOUT = 10000;

// API请求重试次数
export const API_RETRY_COUNT = 2;

// API请求缓存时间（秒）
export const API_CACHE_TIME = {
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟
  LONG: 3600, // 1小时
  DAY: 86400, // 1天
};
