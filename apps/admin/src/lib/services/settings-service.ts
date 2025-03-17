// 设置项接口定义
export interface SettingItem {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

// 数据库连接状态接口
export interface DbConnectionStatus {
  isConnected: boolean;
  message: string;
  latency?: number;
}

// 创建或更新设置项的请求参数
export interface SettingPayload {
  key: string;
  value: string;
  category: string;
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 设置服务类
export const SettingsService = {
  // 获取所有设置
  async getAllSettings(): Promise<ApiResponse<Record<string, SettingItem[]>>> {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: "获取设置失败" };
    }
  },

  // 获取特定类别的设置
  async getSettingsByCategory(
    category: string,
  ): Promise<ApiResponse<SettingItem[]>> {
    try {
      const response = await fetch(`/api/settings/${category}`);
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: `获取${category}类别设置失败` };
    }
  },

  // 获取特定键的设置
  async getSetting(key: string): Promise<ApiResponse<SettingItem>> {
    try {
      const response = await fetch(`/api/settings/${key}`);
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: `获取${key}设置失败` };
    }
  },

  // 创建或更新设置
  async saveSetting(
    setting: SettingPayload,
  ): Promise<ApiResponse<SettingItem>> {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setting),
      });
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: "保存设置失败" };
    }
  },

  // 批量保存设置
  async saveSettings(
    settings: SettingPayload[],
  ): Promise<ApiResponse<SettingItem[]>> {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: "批量保存设置失败" };
    }
  },

  // 删除设置
  async deleteSetting(key: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: "DELETE",
      });
      const data = await response.json();

      return data;
    } catch {
      return { success: false, error: `删除${key}设置失败` };
    }
  },

  // 测试数据库连接
  async testDatabaseConnection(): Promise<ApiResponse<DbConnectionStatus>> {
    try {
      const startTime = performance.now();

      const response = await fetch("/api/settings/test-db-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: await SettingsService.getSetting("dbHost").then(
            (res) => res.data?.value || "localhost",
          ),
          port: await SettingsService.getSetting("dbPort").then(
            (res) => res.data?.value || "5432",
          ),
          database: await SettingsService.getSetting("dbName").then(
            (res) => res.data?.value || "trendhub",
          ),
          user: await SettingsService.getSetting("dbUser").then(
            (res) => res.data?.value || "admin",
          ),
          password: await SettingsService.getSetting("dbPassword").then(
            (res) => res.data?.value || "",
          ),
          ssl: await SettingsService.getSetting("dbUseSSL").then(
            (res) => res.data?.value === "true",
          ),
        }),
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      const data = await response.json();

      if (data.success) {
        return {
          ...data,
          data: {
            ...data.data,
            latency,
          },
        };
      }

      return {
        success: false,
        data: {
          isConnected: false,
          message: data.error || "数据库连接失败",
        },
      };
    } catch {
      return {
        success: false,
        data: {
          isConnected: false,
          message: "连接测试失败: 服务器错误",
        },
      };
    }
  },
};
