// 定义本地枚举以避免潜在的导入问题
export enum SnippetType {
  JS = "JS",
  CSS = "CSS",
}

export enum SnippetLocation {
  HEAD = "HEAD",
  BODY_START = "BODY_START",
  BODY_END = "BODY_END",
}

// 代码片段接口 (使用本地枚举)
export interface CodeSnippet {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  type: SnippetType;
  location: SnippetLocation;
  paths: string[];
  priority: number;
  isActive: boolean;
  createdAt: string; // 或者 Date 类型，取决于API返回
  updatedAt: string; // 或者 Date 类型
}

// 创建代码片段的请求体 (使用本地枚举)
export interface CreateCodeSnippetPayload {
  name: string;
  description?: string | null;
  code: string;
  type: SnippetType;
  location: SnippetLocation;
  paths?: string[];
  priority?: number;
  isActive?: boolean;
}

// 更新代码片段的请求体 (所有字段可选)
export type UpdateCodeSnippetPayload = Partial<CreateCodeSnippetPayload>;

// 通用API响应接口 (修复any)
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown; // 使用 unknown 代替 any
}

// CodeSnippet服务类
export const CodeSnippetService = {
  // 获取所有代码片段
  async getAllSnippets(): Promise<ApiResponse<CodeSnippet[]>> {
    try {
      const response = await fetch("/api/code-snippets");
      const data: ApiResponse<CodeSnippet[]> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "获取代码片段失败";

      return { success: false, error };
    }
  },

  // 创建新的代码片段
  async createSnippet(
    payload: CreateCodeSnippetPayload,
  ): Promise<ApiResponse<CodeSnippet>> {
    try {
      const response = await fetch("/api/code-snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<CodeSnippet> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "创建代码片段失败";

      return { success: false, error };
    }
  },

  // 获取单个代码片段
  async getSnippetById(id: string): Promise<ApiResponse<CodeSnippet>> {
    try {
      const response = await fetch(`/api/code-snippets/${id}`);
      const data: ApiResponse<CodeSnippet> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "获取单个代码片段失败";

      return { success: false, error };
    }
  },

  // 更新代码片段
  async updateSnippet(
    id: string,
    payload: UpdateCodeSnippetPayload,
  ): Promise<ApiResponse<CodeSnippet>> {
    try {
      const response = await fetch(`/api/code-snippets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<CodeSnippet> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "更新代码片段失败";

      return { success: false, error };
    }
  },

  // 删除代码片段
  async deleteSnippet(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/code-snippets/${id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<void> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "删除代码片段失败";

      return { success: false, error };
    }
  },

  // 切换代码片段激活状态
  async toggleSnippetActive(
    id: string,
  ): Promise<ApiResponse<{ isActive: boolean }>> {
    try {
      const response = await fetch(`/api/code-snippets/${id}/toggle`, {
        method: "PATCH",
      });
      const data: ApiResponse<{ isActive: boolean }> = await response.json();

      return data;
    } catch (e) {
      const error = e instanceof Error ? e.message : "切换代码片段状态失败";

      return { success: false, error };
    }
  },
};
