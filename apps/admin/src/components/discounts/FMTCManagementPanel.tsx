"use client";

import {
  BarChart3,
  Settings,
  RefreshCw,
  Target,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { FMTCBrandMatchingPanel } from "@/components/fmtc-merchants/FMTCBrandMatchingPanel";
import { FMTCMerchantsDataTable } from "@/components/fmtc-merchants/FMTCMerchantsDataTable";
import { FMTCScraperPanel } from "@/components/fmtc-merchants/FMTCScraperPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 统计接口
interface FMTCMerchantStats {
  totalMerchants: number;
  brandMatched: number;
  unmatched: number;
  recentlyUpdated: number;
}

// 抓取任务统计接口
interface FMTCScraperStats {
  enabledTasks: number;
  runningTasks: number;
  completedToday: number;
  failedToday: number;
}

export function FMTCManagementPanel() {
  const t = useTranslations();

  // 状态管理
  const [stats, setStats] = useState<FMTCMerchantStats>({
    totalMerchants: 0,
    brandMatched: 0,
    unmatched: 0,
    recentlyUpdated: 0,
  });

  const [scraperStats, setScraperStats] = useState<FMTCScraperStats>({
    enabledTasks: 0,
    runningTasks: 0,
    completedToday: 0,
    failedToday: 0,
  });

  const [activeTab, setActiveTab] = useState("merchants");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [brandMatchStatus, setBrandMatchStatus] = useState("all");

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/fmtc-merchants");

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error("获取商户统计失败:", error);
    }
  };

  // 获取抓取任务统计
  const fetchScraperStats = async () => {
    try {
      const response = await fetch("/api/fmtc-merchants/scraper");

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setScraperStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error("获取抓取任务统计失败:", error);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStats();
    fetchScraperStats();
  };

  // 清除筛选条件
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedNetwork("all");
    setBrandMatchStatus("all");
  };

  useEffect(() => {
    fetchStats();
    fetchScraperStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("fmtcMerchants.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("fmtcMerchants.description")}
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="mr-2 h-4 w-4" />
            {t("common.clearFilters")}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.stats.totalMerchants")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMerchants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.stats.brandMatched")}
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.brandMatched}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMerchants > 0
                ? `${((stats.brandMatched / stats.totalMerchants) * 100).toFixed(1)}%`
                : "0%"}{" "}
              {t("fmtcMerchants.stats.matchRate")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.stats.unmatched")}
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.unmatched}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.stats.lastUpdate")}
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.recentlyUpdated}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("fmtcMerchants.stats.last24Hours")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 抓取任务状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t("fmtcMerchants.scraper.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">
                {t("fmtcMerchants.scraper.enabledTasks")}:{" "}
                {scraperStats.enabledTasks}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {t("fmtcMerchants.scraper.runningTasks")}:{" "}
                {scraperStats.runningTasks}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-3 w-3 rounded-full bg-green-600" />
              <span className="text-sm text-muted-foreground">
                {t("fmtcMerchants.scraper.completedToday")}:{" "}
                {scraperStats.completedToday}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">
                {t("fmtcMerchants.scraper.failedToday")}:{" "}
                {scraperStats.failedToday}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>{t("fmtcMerchants.filters.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("fmtcMerchants.filters.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.country")}
              </label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("fmtcMerchants.filters.selectCountry")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.network")}
              </label>
              <Select
                value={selectedNetwork}
                onValueChange={setSelectedNetwork}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("fmtcMerchants.filters.selectNetwork")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="Affiliate Window">
                    Affiliate Window
                  </SelectItem>
                  <SelectItem value="Commission Junction">
                    Commission Junction
                  </SelectItem>
                  <SelectItem value="ShareASale">ShareASale</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.brandStatus")}
              </label>
              <Select
                value={brandMatchStatus}
                onValueChange={setBrandMatchStatus}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("fmtcMerchants.filters.selectBrandStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="matched">
                    {t("fmtcMerchants.filters.matched")}
                  </SelectItem>
                  <SelectItem value="unmatched">
                    {t("fmtcMerchants.filters.unmatched")}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    {t("fmtcMerchants.filters.confirmed")}
                  </SelectItem>
                  <SelectItem value="needsConfirmation">
                    {t("fmtcMerchants.filters.needsConfirmation")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容标签页 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="merchants">
            {t("fmtcMerchants.tabs.merchants")}
          </TabsTrigger>
          <TabsTrigger value="scraper">
            {t("fmtcMerchants.tabs.scraper")}
          </TabsTrigger>
          <TabsTrigger value="brandMatching">
            {t("fmtcMerchants.tabs.brandMatching")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="space-y-4">
          <FMTCMerchantsDataTable
            searchTerm={searchTerm}
            selectedCountry={selectedCountry}
            selectedNetwork={selectedNetwork}
            brandMatchStatus={brandMatchStatus}
            refreshTrigger={refreshTrigger}
            onStatsUpdate={setStats}
          />
        </TabsContent>

        <TabsContent value="scraper" className="space-y-4">
          <FMTCScraperPanel
            onStatsUpdate={setScraperStats}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="brandMatching" className="space-y-4">
          <FMTCBrandMatchingPanel refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
