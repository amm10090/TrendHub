/**
 * 代码片段类型定义
 */

// 代码片段类型枚举
export enum SnippetType {
  JS = 'JS',
  CSS = 'CSS',
}

// 代码片段位置枚举
export enum SnippetLocation {
  HEAD = 'HEAD',
  BODY_START = 'BODY_START',
  BODY_END = 'BODY_END',
}

// 代码片段接口
export interface CodeSnippet {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: SnippetType;
  location: SnippetLocation;
  paths: string[];
  priority: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 公共API返回的代码片段接口（简化）
export interface PublicCodeSnippet {
  id: string;
  code: string;
  type: 'JS' | 'CSS';
  location: 'HEAD' | 'BODY_START' | 'BODY_END';
  priority: number;
  // paths 在API中使用，此处不直接需要
}
