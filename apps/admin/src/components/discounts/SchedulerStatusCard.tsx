"use client";

import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface SchedulerData {
  status: {
    isActive: boolean;
    currentlyRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    config: {
      enabled: boolean;
      intervalMinutes: number;
    };
  };
  health: {
    status: "healthy" | "warning" | "error";
    details: string;
  };
  stats: {
    totalExpired: number;
    expiringSoon: number;
    cleanupCandidates: number;
  };
}

export function SchedulerStatusCard() {
  const [data, setData] = useState<SchedulerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/discounts/scheduler");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch {
      // 忽略获取调度器数据失败的错误
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulerAction = async (action: string) => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/discounts/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await fetchSchedulerData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-600">
            正常
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-600">
            警告
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";

    return new Date(timeString).toLocaleString();
  };

  const getSuccessRate = () => {
    if (!data || data.status.totalRuns === 0) return 0;

    return ((data.status.successfulRuns / data.status.totalRuns) * 100).toFixed(
      1,
    );
  };

  useEffect(() => {
    fetchSchedulerData();

    // 设置定期刷新
    const interval = setInterval(fetchSchedulerData, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-muted-foreground">无法获取调度器状态</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon(data.health.status)}
            过期处理调度器
            {getStatusBadge(data.health.status)}
          </CardTitle>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSchedulerAction("trigger")}
              disabled={actionLoading || data.status.currentlyRunning}
            >
              <Zap className="w-4 h-4 mr-1" />
              手动执行
            </Button>

            {data.status.isActive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSchedulerAction("stop")}
                disabled={actionLoading}
              >
                <Pause className="w-4 h-4 mr-1" />
                停止
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSchedulerAction("start")}
                disabled={actionLoading}
              >
                <Play className="w-4 h-4 mr-1" />
                启动
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSchedulerAction("restart")}
              disabled={actionLoading}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重启
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 状态信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">运行状态</span>
            <div className="font-medium">
              {data.status.isActive ? (
                <span className="text-green-600">运行中</span>
              ) : (
                <span className="text-red-600">已停止</span>
              )}
              {data.status.currentlyRunning && (
                <Badge variant="outline" className="ml-2 text-xs">
                  执行中
                </Badge>
              )}
            </div>
          </div>

          <div>
            <span className="text-muted-foreground">检查间隔</span>
            <div className="font-medium">
              {data.status.config.intervalMinutes} 分钟
            </div>
          </div>

          <div>
            <span className="text-muted-foreground">成功率</span>
            <div className="font-medium">{getSuccessRate()}%</div>
          </div>

          <div>
            <span className="text-muted-foreground">总执行次数</span>
            <div className="font-medium">{data.status.totalRuns}</div>
          </div>
        </div>

        <Separator />

        {/* 时间信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              上次执行
            </span>
            <div className="font-medium">{formatTime(data.status.lastRun)}</div>
          </div>

          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              下次执行
            </span>
            <div className="font-medium">
              {data.status.isActive ? formatTime(data.status.nextRun) : "-"}
            </div>
          </div>
        </div>

        <Separator />

        {/* 过期统计 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {data.stats.totalExpired}
            </div>
            <span className="text-muted-foreground">已过期</span>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {data.stats.expiringSoon}
            </div>
            <span className="text-muted-foreground">即将过期</span>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {data.stats.cleanupCandidates}
            </div>
            <span className="text-muted-foreground">待清理</span>
          </div>
        </div>

        {/* 健康状态详情 */}
        {data.health.status !== "healthy" && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon(data.health.status)}
              <span className="font-medium">
                {data.health.status === "warning" ? "警告" : "错误"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.health.details}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
