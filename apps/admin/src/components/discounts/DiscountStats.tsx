"use client";

import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  overview: {
    total: number;
    active: number;
    expired: number;
    inactive: number;
    unmatched: number;
  };
  trend: Array<{
    date: string;
    created: number;
    expired: number;
  }>;
  upcomingExpiry: Array<{
    id: string;
    merchantName: string;
    title: string;
    endDate: string;
    brand?: {
      name: string;
      logo?: string;
    };
  }>;
  rating: {
    average: number;
    count: number;
  };
  timeRange: string;
  generatedAt: string;
}

export function DiscountStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange] = useState("30d");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/discounts/stats?timeRange=${timeRange}`,
      );
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // 计算趋势
  const recentTrend = stats.trend.slice(-7);
  const totalCreated = recentTrend.reduce((sum, day) => sum + day.created, 0);
  const totalExpired = recentTrend.reduce((sum, day) => sum + day.expired, 0);
  const netChange = totalCreated - totalExpired;

  // 计算活跃率
  const activeRate =
    stats.overview.total > 0
      ? ((stats.overview.active / stats.overview.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总折扣数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.overview.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              活跃率 {activeRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃折扣</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.overview.active.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">可用于用户使用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">过期折扣</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overview.expired.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">需要清理的数据</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未匹配品牌</CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.overview.unmatched.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">需要手动关联</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势和即将过期 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">近期趋势</CardTitle>
            <div className="flex items-center gap-2">
              {netChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : netChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : null}
              <Badge
                variant={
                  netChange > 0
                    ? "default"
                    : netChange < 0
                      ? "destructive"
                      : "secondary"
                }
              >
                {netChange > 0 ? "+" : ""}
                {netChange}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">新增折扣</span>
                <div className="text-lg font-semibold text-green-600">
                  +{totalCreated}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">过期折扣</span>
                <div className="text-lg font-semibold text-red-600">
                  -{totalExpired}
                </div>
              </div>
            </div>

            {stats.rating.count > 0 && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-sm">平均评分</span>
                <div className="text-lg font-semibold">
                  {stats.rating.average.toFixed(1)} / 5.0
                </div>
                <p className="text-xs text-muted-foreground">
                  基于 {stats.rating.count} 个评分
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">即将过期</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {stats.upcomingExpiry.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingExpiry.slice(0, 5).map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {discount.brand?.name || discount.merchantName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {discount.title}
                      </div>
                    </div>
                    <div className="text-xs text-orange-600 ml-2">
                      {new Date(discount.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {stats.upcomingExpiry.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    还有 {stats.upcomingExpiry.length - 5} 个折扣即将过期
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无即将过期的折扣</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部信息 */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          数据更新时间: {new Date(stats.generatedAt).toLocaleString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
      </div>
    </div>
  );
}
