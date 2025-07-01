"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlertTriangle,
  Bell,
  Settings,
  Check,
  RefreshCw,
  Send,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ThresholdAlert {
  level: "critical" | "warning" | "info";
  type: "total_count" | "active_count" | "brand_specific" | "type_specific";
  current: number;
  threshold: number;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

interface NotificationConfig {
  enabled: boolean;
  thresholds: {
    critical: number;
    warning: number;
  };
  checkInterval: number;
  recipients: string[];
  channels: Array<"email" | "webhook" | "dashboard">;
}

export function NotificationPanel() {
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, configRes] = await Promise.all([
        fetch("/api/discounts/notifications?action=recent&limit=20"),
        fetch("/api/discounts/notifications?action=config"),
      ]);

      const [alertsResult, configResult] = await Promise.all([
        alertsRes.json(),
        configRes.json(),
      ]);

      if (alertsResult.success) {
        setAlerts(alertsResult.data || []);
      }

      if (configResult.success) {
        setConfig(configResult.data);
      }
    } catch {
      toast.error("获取通知数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch("/api/discounts/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("通知配置已更新");
        setConfig(result.data);
      } else {
        toast.error(result.error || "更新配置失败");
      }
    } catch {
      toast.error("更新配置失败");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTesting(true);
      const response = await fetch("/api/discounts/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("测试通知已发送");
        await fetchData(); // Refresh alerts
      } else {
        toast.error(result.error || "发送测试通知失败");
      }
    } catch {
      toast.error("发送测试通知失败");
    } finally {
      setTesting(false);
    }
  };

  const handleCheckNow = async () => {
    try {
      setChecking(true);
      const response = await fetch("/api/discounts/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-now" }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await fetchData(); // Refresh alerts
      } else {
        toast.error(result.error || "检查阈值失败");
      }
    } catch {
      toast.error("检查阈值失败");
    } finally {
      setChecking(false);
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "info":
        return <Bell className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "critical":
        return <Badge variant="destructive">严重</Badge>;
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-600">
            警告
          </Badge>
        );
      case "info":
        return <Badge variant="default">信息</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      total_count: "总数量",
      active_count: "活跃数量",
      brand_specific: "品牌特定",
      type_specific: "类型特定",
    };

    return labels[type as keyof typeof labels] || type;
  };

  useEffect(() => {
    fetchData();

    // Set up periodic refresh
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-muted-foreground">无法加载通知配置</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 配置面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              通知配置
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCheckNow}
                disabled={checking}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${checking ? "animate-spin" : ""}`}
                />
                立即检查
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestNotification}
                disabled={testing}
              >
                <Send className="w-4 h-4 mr-1" />
                测试通知
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用通知</Label>
                <p className="text-xs text-muted-foreground">
                  开启后将监控折扣数据阈值并发送提醒
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, enabled: checked })
                }
              />
            </div>

            <Separator />

            {/* 阈值设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="critical-threshold">严重警告阈值</Label>
                <Input
                  id="critical-threshold"
                  type="number"
                  value={config.thresholds.critical}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: {
                        ...config.thresholds,
                        critical: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  活跃折扣数量低于此值时发送严重警告
                </p>
              </div>

              <div>
                <Label htmlFor="warning-threshold">一般警告阈值</Label>
                <Input
                  id="warning-threshold"
                  type="number"
                  value={config.thresholds.warning}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: {
                        ...config.thresholds,
                        warning: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  活跃折扣数量低于此值时发送一般警告
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="check-interval">检查间隔 (分钟)</Label>
              <Input
                id="check-interval"
                type="number"
                value={config.checkInterval}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    checkInterval: parseInt(e.target.value) || 60,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                系统多久检查一次阈值
              </p>
            </div>

            {/* 通知渠道 */}
            <div>
              <Label>通知渠道</Label>
              <div className="flex gap-2 mt-2">
                {["dashboard", "email", "webhook"].map((channel) => (
                  <Badge
                    key={channel}
                    variant={
                      config.channels.includes(
                        channel as "email" | "webhook" | "dashboard",
                      )
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      const channels = config.channels.includes(
                        channel as "email" | "webhook" | "dashboard",
                      )
                        ? config.channels.filter((c) => c !== channel)
                        : [
                            ...config.channels,
                            channel as "email" | "webhook" | "dashboard",
                          ];

                      setConfig({ ...config, channels });
                    }}
                  >
                    {channel === "dashboard" && "仪表板"}
                    {channel === "email" && "邮件"}
                    {channel === "webhook" && "Webhook"}
                    {config.channels.includes(
                      channel as "email" | "webhook" | "dashboard",
                    ) && <Check className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 邮件收件人 */}
            {config.channels.includes("email") && (
              <div>
                <Label htmlFor="recipients">邮件收件人</Label>
                <Textarea
                  id="recipients"
                  placeholder="输入邮件地址，用逗号分隔"
                  value={config.recipients.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recipients: e.target.value
                        .split(",")
                        .map((email) => email.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            )}

            <Button
              onClick={handleConfigUpdate}
              disabled={saving}
              className="w-full"
            >
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 最近警告 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              最近警告
            </CardTitle>
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {getAlertIcon(alert.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertBadge(alert.level)}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(alert.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(alert.timestamp), "MM/dd HH:mm", {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>当前: {alert.current}</span>
                      <span>阈值: {alert.threshold}</span>
                      {alert.level === "critical" && (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-3 h-3" />
                          严重不足
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无警告信息</p>
              <p className="text-xs mt-1">系统运行正常</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
