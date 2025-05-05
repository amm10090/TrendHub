// 类型定义文件 for @repo/types

/**
 * 代码片段注入位置枚举
 */
export enum SnippetLocation {
  HEAD = "HEAD", // <head> 内部
  BODY_START = "BODY_START", // <body> 之后
  BODY_END = "BODY_END", // </body> 之前
}

/**
 * 代码片段类型枚举
 */
export enum SnippetType {
  JS = "JS", // JavaScript
  CSS = "CSS", // CSS
}

/**
 * 代码片段接口定义
 * 基于 apps/admin/prisma/schema.prisma 中的 CodeSnippet 模型
 */
export interface CodeSnippet {
  id: string;
  name: string;
  description?: string | null; // 可选描述
  code: string; // 代码内容
  type: SnippetType; // 类型：JS 或 CSS
  location: SnippetLocation; // 注入位置
  paths: string[]; // 生效的URL路径模式数组
  priority: number; // 优先级 (未使用，但保留)
  isActive: boolean; // 是否激活
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

// 可以根据需要导出更多共享类型
