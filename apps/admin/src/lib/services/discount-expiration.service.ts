import { db } from "@/lib/db";

export interface ExpirationConfig {
  // 自动处理配置
  autoDisableExpired: boolean;
  autoDeleteAfterDays: number;
  checkIntervalHours: number;

  // 通知配置
  notifyBeforeExpiry: boolean;
  notifyDaysBefore: number;
  notifyEmail?: string;

  // 清理配置
  enableAutoCleanup: boolean;
  cleanupOlderThanDays: number;
  maxCleanupBatch: number;
}

export interface ExpirationResult {
  type: "check" | "disable" | "cleanup" | "notify";
  success: boolean;
  processed: number;
  details: string;
  timestamp: Date;
  errors?: string[];
}

export interface ExpirationStats {
  totalExpired: number;
  recentlyExpired: number;
  expiringSoon: number;
  cleanupCandidates: number;
  lastCheckTime?: Date;
  nextCheckTime?: Date;
}

export class DiscountExpirationService {
  private config: ExpirationConfig;
  private isRunning = false;
  private lastCheck?: Date;

  constructor(config?: Partial<ExpirationConfig>) {
    this.config = {
      autoDisableExpired: true,
      autoDeleteAfterDays: 30,
      checkIntervalHours: 1,
      notifyBeforeExpiry: true,
      notifyDaysBefore: 3,
      enableAutoCleanup: false,
      cleanupOlderThanDays: 90,
      maxCleanupBatch: 1000,
      ...config,
    };
  }

  /**
   * 主要的过期检查和处理方法
   */
  async processExpiredDiscounts(): Promise<ExpirationResult[]> {
    if (this.isRunning) {
      return [];
    }

    this.isRunning = true;
    this.lastCheck = new Date();
    const results: ExpirationResult[] = [];

    try {
      // 1. 检查并标记过期折扣
      if (this.config.autoDisableExpired) {
        const checkResult = await this.checkAndMarkExpired();

        results.push(checkResult);
      }

      // 2. 清理旧的过期折扣
      if (this.config.enableAutoCleanup) {
        const cleanupResult = await this.cleanupOldExpiredDiscounts();

        results.push(cleanupResult);
      }

      // 3. 发送过期提醒通知
      if (this.config.notifyBeforeExpiry) {
        const notifyResult = await this.sendExpiryNotifications();

        results.push(notifyResult);
      }

      return results;
    } catch {
      results.push({
        type: "check",
        success: false,
        processed: 0,
        details: `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });

      return results;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 检查并标记过期折扣
   */
  async checkAndMarkExpired(): Promise<ExpirationResult> {
    try {
      const now = new Date();

      // 查找需要标记为过期的折扣
      const expiredDiscounts = await db.discount.findMany({
        where: {
          endDate: { lt: now },
          isExpired: false,
        },
        select: {
          id: true,
          merchantName: true,
          title: true,
          endDate: true,
          brandId: true,
        },
      });

      if (expiredDiscounts.length === 0) {
        return {
          type: "check",
          success: true,
          processed: 0,
          details: "No discounts found to mark as expired",
          timestamp: now,
        };
      }

      // 批量更新为过期状态
      const updateResult = await db.discount.updateMany({
        where: {
          id: { in: expiredDiscounts.map((d) => d.id) },
        },
        data: {
          isExpired: true,
          isActive: false, // 同时设置为不活跃
        },
      });

      // 记录详细信息
      const details = `Marked ${updateResult.count} discounts as expired`;

      return {
        type: "check",
        success: true,
        processed: updateResult.count,
        details,
        timestamp: now,
      };
    } catch {
      return {
        type: "check",
        success: false,
        processed: 0,
        details: `Check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * 清理旧的过期折扣
   */
  async cleanupOldExpiredDiscounts(): Promise<ExpirationResult> {
    try {
      const cutoffDate = new Date();

      cutoffDate.setDate(
        cutoffDate.getDate() - this.config.cleanupOlderThanDays,
      );

      // 查找需要清理的过期折扣
      const oldExpiredDiscounts = await db.discount.findMany({
        where: {
          isExpired: true,
          endDate: { lt: cutoffDate },
        },
        select: {
          id: true,
          merchantName: true,
          title: true,
          endDate: true,
        },
        take: this.config.maxCleanupBatch,
      });

      if (oldExpiredDiscounts.length === 0) {
        return {
          type: "cleanup",
          success: true,
          processed: 0,
          details: `No old expired discounts found for cleanup (older than ${this.config.cleanupOlderThanDays} days)`,
          timestamp: new Date(),
        };
      }

      // 删除过期折扣
      const deleteResult = await db.discount.deleteMany({
        where: {
          id: { in: oldExpiredDiscounts.map((d) => d.id) },
        },
      });

      const details = `Cleaned up ${deleteResult.count} old expired discounts (older than ${this.config.cleanupOlderThanDays} days)`;

      return {
        type: "cleanup",
        success: true,
        processed: deleteResult.count,
        details,
        timestamp: new Date(),
      };
    } catch {
      return {
        type: "cleanup",
        success: false,
        processed: 0,
        details: `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * 发送过期提醒通知
   */
  async sendExpiryNotifications(): Promise<ExpirationResult> {
    try {
      const now = new Date();
      const futureDate = new Date(
        now.getTime() + this.config.notifyDaysBefore * 24 * 60 * 60 * 1000,
      );

      // 查找即将过期的折扣
      const expiringSoon = await db.discount.findMany({
        where: {
          isActive: true,
          isExpired: false,
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          brand: {
            select: { id: true, name: true },
          },
        },
        orderBy: { endDate: "asc" },
      });

      if (expiringSoon.length === 0) {
        return {
          type: "notify",
          success: true,
          processed: 0,
          details: `No discounts expiring within ${this.config.notifyDaysBefore} days`,
          timestamp: now,
        };
      }

      // 按品牌分组统计
      const byBrand: Record<string, number> = {};

      expiringSoon.forEach((discount) => {
        const brandName = discount.brand?.name || discount.merchantName;

        byBrand[brandName] = (byBrand[brandName] || 0) + 1;
      });

      // 发送通知（这里可以集成邮件、Slack等通知系统）

      // TODO: 在这里实现实际的通知发送
      // await this.sendNotificationEmail(notificationData);
      // await this.sendSlackNotification(notificationData);

      const details = `Found ${expiringSoon.length} discounts expiring within ${this.config.notifyDaysBefore} days`;

      return {
        type: "notify",
        success: true,
        processed: expiringSoon.length,
        details,
        timestamp: now,
      };
    } catch {
      return {
        type: "notify",
        success: false,
        processed: 0,
        details: `Notification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * 获取过期统计信息
   */
  async getExpirationStats(timeRange: number = 30): Promise<ExpirationStats> {
    const now = new Date();
    const pastDate = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);
    const futureDate = new Date(
      now.getTime() + this.config.notifyDaysBefore * 24 * 60 * 60 * 1000,
    );
    const cleanupCutoff = new Date(
      now.getTime() - this.config.cleanupOlderThanDays * 24 * 60 * 60 * 1000,
    );

    const [totalExpired, recentlyExpired, expiringSoon, cleanupCandidates] =
      await Promise.all([
        db.discount.count({
          where: { isExpired: true },
        }),
        db.discount.count({
          where: {
            isExpired: true,
            endDate: { gte: pastDate },
          },
        }),
        db.discount.count({
          where: {
            isActive: true,
            isExpired: false,
            endDate: {
              gte: now,
              lte: futureDate,
            },
          },
        }),
        db.discount.count({
          where: {
            isExpired: true,
            endDate: { lt: cleanupCutoff },
          },
        }),
      ]);

    return {
      totalExpired,
      recentlyExpired,
      expiringSoon,
      cleanupCandidates,
      lastCheckTime: this.lastCheck,
      nextCheckTime: this.lastCheck
        ? new Date(
            this.lastCheck.getTime() +
              this.config.checkIntervalHours * 60 * 60 * 1000,
          )
        : undefined,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ExpirationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ExpirationConfig {
    return { ...this.config };
  }

  /**
   * 检查服务状态
   */
  getStatus(): {
    isRunning: boolean;
    lastCheck?: Date;
    nextCheck?: Date;
    config: ExpirationConfig;
  } {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      nextCheck: this.lastCheck
        ? new Date(
            this.lastCheck.getTime() +
              this.config.checkIntervalHours * 60 * 60 * 1000,
          )
        : undefined,
      config: this.config,
    };
  }

  /**
   * 手动触发过期检查（用于测试或紧急处理）
   */
  async forceCheck(): Promise<ExpirationResult[]> {
    return this.processExpiredDiscounts();
  }
}

// 导出默认实例
export const discountExpirationService = new DiscountExpirationService();
