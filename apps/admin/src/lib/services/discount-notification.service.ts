import { DiscountType } from "@prisma/client";

import { db as prisma } from "@/lib/db";

interface NotificationConfig {
  enabled: boolean;
  thresholds: {
    critical: number;
    warning: number;
  };
  checkInterval: number; // minutes
  recipients: string[];
  channels: Array<"email" | "webhook" | "dashboard">;
}

interface ThresholdAlert {
  level: "critical" | "warning" | "info";
  type: "total_count" | "active_count" | "brand_specific" | "type_specific";
  current: number;
  threshold: number;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

interface DiscountMetrics {
  total: number;
  active: number;
  expired: number;
  inactive: number;
  unmatched: number;
  byBrand: Array<{
    brandId: string;
    brandName: string;
    count: number;
    activeCount: number;
  }>;
  byType: Array<{
    type: DiscountType;
    count: number;
    activeCount: number;
  }>;
  recentActivity: {
    created24h: number;
    expired24h: number;
    used24h: number;
  };
}

export class DiscountNotificationService {
  private config: NotificationConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): NotificationConfig {
    return {
      enabled: process.env.DISCOUNT_NOTIFICATIONS_ENABLED === "true",
      thresholds: {
        critical: parseInt(process.env.DISCOUNT_THRESHOLD_CRITICAL || "100"),
        warning: parseInt(process.env.DISCOUNT_THRESHOLD_WARNING || "500"),
      },
      checkInterval: parseInt(process.env.DISCOUNT_CHECK_INTERVAL || "60"), // 1 hour
      recipients: (process.env.NOTIFICATION_RECIPIENTS || "")
        .split(",")
        .filter(Boolean),
      channels: (process.env.NOTIFICATION_CHANNELS || "dashboard").split(
        ",",
      ) as Array<"email" | "webhook" | "dashboard">,
    };
  }

  async checkThresholds(): Promise<ThresholdAlert[]> {
    if (!this.config.enabled) {
      return [];
    }

    const alerts: ThresholdAlert[] = [];
    const metrics = await this.getDiscountMetrics();

    // Check total active discounts
    if (metrics.active <= this.config.thresholds.critical) {
      alerts.push({
        level: "critical",
        type: "active_count",
        current: metrics.active,
        threshold: this.config.thresholds.critical,
        message: `Active discount count critically low: ${metrics.active} (threshold: ${this.config.thresholds.critical})`,
        details: { metrics },
        timestamp: new Date(),
      });
    } else if (metrics.active <= this.config.thresholds.warning) {
      alerts.push({
        level: "warning",
        type: "active_count",
        current: metrics.active,
        threshold: this.config.thresholds.warning,
        message: `Active discount count below warning threshold: ${metrics.active} (threshold: ${this.config.thresholds.warning})`,
        details: { metrics },
        timestamp: new Date(),
      });
    }

    // Check brand-specific thresholds
    const brandThreshold = Math.max(
      10,
      Math.floor(this.config.thresholds.warning / 10),
    );

    for (const brand of metrics.byBrand) {
      if (brand.activeCount <= 5) {
        alerts.push({
          level: "warning",
          type: "brand_specific",
          current: brand.activeCount,
          threshold: brandThreshold,
          message: `Brand "${brand.brandName}" has very low active discounts: ${brand.activeCount}`,
          details: { brand },
          timestamp: new Date(),
        });
      }
    }

    // Check for stagnant data (no new discounts in 24h)
    if (
      metrics.recentActivity.created24h === 0 &&
      metrics.active < this.config.thresholds.warning
    ) {
      alerts.push({
        level: "warning",
        type: "total_count",
        current: 0,
        threshold: 1,
        message:
          "No new discounts created in the last 24 hours, and active count is low",
        details: { recentActivity: metrics.recentActivity },
        timestamp: new Date(),
      });
    }

    // Check for high expiration rate
    if (
      metrics.recentActivity.expired24h > metrics.recentActivity.created24h &&
      metrics.recentActivity.expired24h > 50
    ) {
      alerts.push({
        level: "info",
        type: "total_count",
        current: metrics.recentActivity.expired24h,
        threshold: metrics.recentActivity.created24h,
        message: `High expiration rate: ${metrics.recentActivity.expired24h} expired vs ${metrics.recentActivity.created24h} created in 24h`,
        details: { recentActivity: metrics.recentActivity },
        timestamp: new Date(),
      });
    }

    // Process alerts
    if (alerts.length > 0) {
      await this.processAlerts(alerts);
    }

    return alerts;
  }

  private async getDiscountMetrics(): Promise<DiscountMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Basic counts
    const [total, active, expired, inactive, unmatched] = await Promise.all([
      prisma.discount.count(),
      prisma.discount.count({ where: { isActive: true, isExpired: false } }),
      prisma.discount.count({ where: { isExpired: true } }),
      prisma.discount.count({ where: { isActive: false, isExpired: false } }),
      prisma.discount.count({ where: { brandId: null } }),
    ]);

    // By brand
    const byBrand = await prisma.discount.groupBy({
      by: ["brandId"],
      where: { brandId: { not: null } },
      _count: true,
    });

    const brandIds = byBrand.map((b) => b.brandId).filter(Boolean) as string[];
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, name: true },
    });

    const brandMetrics = await Promise.all(
      byBrand.map(async (item) => {
        const brand = brands.find((b) => b.id === item.brandId);
        const activeCount = await prisma.discount.count({
          where: {
            brandId: item.brandId,
            isActive: true,
            isExpired: false,
          },
        });

        return {
          brandId: item.brandId!,
          brandName: brand?.name || "Unknown",
          count: item._count,
          activeCount,
        };
      }),
    );

    // By type
    const byType = await prisma.discount.groupBy({
      by: ["type"],
      _count: true,
    });

    const typeMetrics = await Promise.all(
      byType.map(async (item) => {
        const activeCount = await prisma.discount.count({
          where: {
            type: item.type,
            isActive: true,
            isExpired: false,
          },
        });

        return {
          type: item.type,
          count: item._count,
          activeCount,
        };
      }),
    );

    // Recent activity
    const [created24h, expired24h, used24h] = await Promise.all([
      prisma.discount.count({
        where: { createdAt: { gte: yesterday } },
      }),
      prisma.discount.count({
        where: {
          updatedAt: { gte: yesterday },
          isExpired: true,
        },
      }),
      prisma.discount
        .aggregate({
          where: { updatedAt: { gte: yesterday } },
          _sum: { useCount: true },
        })
        .then((result) => result._sum.useCount || 0),
    ]);

    return {
      total,
      active,
      expired,
      inactive,
      unmatched,
      byBrand: brandMetrics,
      byType: typeMetrics,
      recentActivity: {
        created24h,
        expired24h,
        used24h,
      },
    };
  }

  private async processAlerts(alerts: ThresholdAlert[]): Promise<void> {
    // Store alerts in database
    await this.storeAlerts();

    // Send notifications based on configured channels
    const promises = [];

    if (this.config.channels.includes("email")) {
      promises.push(this.sendEmailNotifications(alerts));
    }

    if (this.config.channels.includes("webhook")) {
      promises.push(this.sendWebhookNotifications(alerts));
    }

    if (this.config.channels.includes("dashboard")) {
      promises.push(this.updateDashboardAlerts(alerts));
    }

    await Promise.allSettled(promises);
  }

  private async storeAlerts(): Promise<void> {
    // Store in a notifications table (would need to create this table)
    // For now, we'll log to console and potentially store in a simple JSON file
    // TODO: Create a notifications table and store alerts there
    // This would allow for alert history, acknowledgment tracking, etc.
  }

  private async sendEmailNotifications(
    alerts: ThresholdAlert[],
  ): Promise<void> {
    if (this.config.recipients.length === 0) return;

    const criticalAlerts = alerts.filter((a) => a.level === "critical");
    const warningAlerts = alerts.filter((a) => a.level === "warning");

    if (criticalAlerts.length === 0 && warningAlerts.length === 0) return;

    // TODO: Implement email sending
    // This would typically use a service like SendGrid, AWS SES, etc.
  }

  private async sendWebhookNotifications(
    alerts: ThresholdAlert[],
  ): Promise<void> {
    const webhookUrl =
      process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) return;

    const criticalCount = alerts.filter((a) => a.level === "critical").length;
    const warningCount = alerts.filter((a) => a.level === "warning").length;

    if (criticalCount === 0 && warningCount === 0) return;

    try {
      const payload = {
        content: `🚨 Discount Threshold Alert`,
        embeds: [
          {
            title: "TrendHub Discount Monitoring",
            description: `System detected ${criticalCount} critical and ${warningCount} warning alerts`,
            color: criticalCount > 0 ? 0xff0000 : 0xffa500, // Red for critical, orange for warning
            fields: alerts.slice(0, 5).map((alert) => ({
              name: `${alert.level.toUpperCase()}: ${alert.type}`,
              value: alert.message,
              inline: false,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      return;
    }
  }

  private async updateDashboardAlerts(alerts: ThresholdAlert[]): Promise<void> {
    // This would update real-time dashboard alerts
    // For now, we'll update a cache that the dashboard can read
    try {
      const fs = await import("fs/promises");
      const alertsPath = "/tmp/discount-alerts.json";

      await fs.writeFile(
        alertsPath,
        JSON.stringify({
          alerts,
          lastUpdated: new Date().toISOString(),
        }),
      );
    } catch {
      return;
    }
  }

  async getRecentAlerts(limit: number = 10): Promise<ThresholdAlert[]> {
    try {
      const fs = await import("fs/promises");
      const alertsPath = "/tmp/discount-alerts.json";
      const data = await fs.readFile(alertsPath, "utf-8");
      const parsed = JSON.parse(data);

      return parsed.alerts.slice(0, limit);
    } catch {
      return [];
    }
  }

  async updateConfig(newConfig: Partial<NotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    // TODO: Persist config to database or file
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  async testAlert(): Promise<ThresholdAlert> {
    const testAlert: ThresholdAlert = {
      level: "info",
      type: "total_count",
      current: 123,
      threshold: 100,
      message: "Test notification - system is working correctly",
      timestamp: new Date(),
    };

    await this.processAlerts([testAlert]);

    return testAlert;
  }
}

export const discountNotificationService = new DiscountNotificationService();
