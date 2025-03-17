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
  error?: string;
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
    const startTime = performance.now();

    try {
      // 从本地缓存中获取设置，避免多次API调用
      const settings = await this.getAllSettings();
      const dbSettings: Record<string, string> = {};

      // 如果获取设置失败，使用默认值
      if (!settings.success || !settings.data) {
        // 使用默认值继续测试
      } else {
        // 从设置中提取数据库配置
        if (settings.data.database) {
          settings.data.database.forEach((setting) => {
            dbSettings[setting.key] = setting.value;
          });
        }
      }

      const host = dbSettings.dbHost || "localhost";
      const port = dbSettings.dbPort || "5432";
      const database = dbSettings.dbName || "trendhub_production";
      const user = dbSettings.dbUser || "trendhub_admin";
      const password = dbSettings.dbPassword || "";
      const ssl = dbSettings.dbUseSSL === "true";

      // 发送连接测试请求
      const response = await fetch("/api/settings/test-db-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host,
          port,
          database,
          user,
          password,
          ssl,
        }),
      });

      const data = await response.json();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (data.success) {
        return {
          success: true,
          data: {
            ...data.data,
            latency: data.data.latency || latency,
          },
        };
      }

      return {
        success: false,
        data: {
          isConnected: false,
          message: data.data?.message || "数据库连接失败",
          error: data.data?.error,
          latency,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      let errorMessage = "连接测试失败: 网络或服务器错误";
      let errorDetail = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetail = error.stack || "";
      }

      return {
        success: false,
        data: {
          isConnected: false,
          message: errorMessage,
          error: errorDetail,
          latency,
        },
      };
    }
  },
};
