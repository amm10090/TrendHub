import {
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Clock,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "TrendHub Admin System",
  description: "TrendHub Admin Dashboard, view overall website data and status",
};

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  // 设置当前页面的语言
  const param = await params;
  const locale = param.locale;

  await setRequestLocale(locale);

  // 使用翻译API - 服务端获取翻译
  const t = await getTranslations("dashboard");

  // 模拟数据
  const stats = [
    {
      title: t("stats.totalRevenue"),
      value: "¥128,430",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: t("stats.totalOrders"),
      value: "2,845",
      change: "+8.2%",
      trend: "up",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: t("stats.users"),
      value: "16,273",
      change: "+5.7%",
      trend: "up",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: t("stats.visits"),
      value: "98,432",
      change: "-2.3%",
      trend: "down",
      icon: <Globe className="h-5 w-5" />,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "产品更新",
      description: "更新了10个产品的价格和库存",
      time: "10分钟前",
      user: "管理员",
    },
    {
      id: 2,
      action: "新订单",
      description: "收到5个新订单，需要处理",
      time: "30分钟前",
      user: "系统",
    },
    {
      id: 3,
      action: "服务器维护",
      description: "计划的服务器维护已完成",
      time: "2小时前",
      user: "系统管理员",
    },
    {
      id: 4,
      action: "内容更新",
      description: "首页横幅更新完成",
      time: "昨天",
      user: "内容编辑",
    },
  ];

  const topProducts = [
    {
      id: 1,
      name: "高级商务笔记本电脑",
      sales: 284,
      revenue: "¥567,890",
      trend: "+12%",
    },
    {
      id: 2,
      name: "无线蓝牙耳机",
      sales: 259,
      revenue: "¥182,670",
      trend: "+8%",
    },
    {
      id: 3,
      name: "智能手表",
      sales: 175,
      revenue: "¥87,430",
      trend: "+5%",
    },
    {
      id: 4,
      name: "4K高清摄像机",
      sales: 121,
      revenue: "¥96,230",
      trend: "-3%",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("welcome")}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div
                className={`rounded-full ${
                  stat.trend === "up" ? "bg-success/20" : "bg-destructive/20"
                } p-1`}
              >
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.trend === "up"
                    ? "text-success flex items-center"
                    : "text-destructive flex items-center"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {stat.change} 较上月
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 图表卡片 */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("salesStats")}</CardTitle>
            <CardDescription>{t("salesStatsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md border-muted-foreground/20">
              <div className="flex flex-col items-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2" />
                <p>此处集成图表展示</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 近期活动 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("recentActivities")}</CardTitle>
            <CardDescription>
              {t("recentActivitiesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-xs font-medium">{activity.user}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热销产品 */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("topProducts")}</CardTitle>
              <CardDescription>{t("topProductsDescription")}</CardDescription>
            </div>
            <Button size="sm">{t("viewAll")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="grid grid-cols-5 border-b bg-muted/50 p-3 text-sm font-medium">
              <div>产品名称</div>
              <div className="text-center">销量</div>
              <div className="text-center">收入</div>
              <div className="text-center">趋势</div>
              <div className="text-right">操作</div>
            </div>
            {topProducts.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-5 items-center p-3 text-sm"
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-center">{product.sales}</div>
                <div className="text-center">{product.revenue}</div>
                <div
                  className={`text-center ${
                    product.trend.startsWith("+")
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {product.trend}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
