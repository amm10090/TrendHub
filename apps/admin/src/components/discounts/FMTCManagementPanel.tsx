"use client";

import { Settings, RefreshCw, Search, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { FMTCBrandMatchingPanel } from "@/components/fmtc-merchants/FMTCBrandMatchingPanel";
import { FMTCMerchantExportButton } from "@/components/fmtc-merchants/FMTCMerchantExportButton";
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
  activeMerchants: number;
  inactiveMerchants: number;
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

// 筛选选项接口
interface FilterOptions {
  countries: string[];
  networks: string[];
  categories: string[];
}

export function FMTCManagementPanel() {
  const t = useTranslations();

  // 状态管理
  const [stats, setStats] = useState<FMTCMerchantStats>({
    totalMerchants: 0,
    activeMerchants: 0,
    inactiveMerchants: 0,
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
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 筛选选项状态
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    networks: [],
    categories: [],
  });
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      setIsLoadingFilterOptions(true);
      const response = await fetch("/api/fmtc-merchants?getFilterOptions=true");

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setFilterOptions(result.data);
        }
      }
    } catch {
      // Error fetching filter options
    } finally {
      setIsLoadingFilterOptions(false);
    }
  };

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
    } catch {
      // Error fetching stats
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
    } catch {
      // Error fetching scraper stats
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStats();
    fetchScraperStats();
    fetchFilterOptions();
  };

  // 清除筛选条件
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedNetwork("all");
    setBrandMatchStatus("all");
    setSelectedActiveStatus("all");
    setSelectedCategory("all");
  };

  useEffect(() => {
    fetchStats();
    fetchScraperStats();
    fetchFilterOptions();
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
          <FMTCMerchantExportButton
            searchTerm={searchTerm}
            selectedCountry={selectedCountry}
            selectedNetwork={selectedNetwork}
            brandMatchStatus={brandMatchStatus}
            selectedActiveStatus={selectedActiveStatus}
            selectedCategory={selectedCategory}
            totalCount={stats.totalMerchants}
          />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingFilterOptions
                        ? t("common.loading")
                        : t("fmtcMerchants.filters.selectCountry")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {filterOptions.countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
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
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingFilterOptions
                        ? t("common.loading")
                        : t("fmtcMerchants.filters.selectNetwork")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {filterOptions.networks.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.category")}
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={isLoadingFilterOptions}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingFilterOptions
                        ? t("common.loading")
                        : t("fmtcMerchants.filters.selectCategory")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="uncategorized">
                    {t("fmtcMerchants.filters.uncategorized")}
                  </SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("fmtcMerchants.filters.activeStatus")}
              </label>
              <Select
                value={selectedActiveStatus}
                onValueChange={setSelectedActiveStatus}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("fmtcMerchants.filters.selectActiveStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="active">
                    {t("fmtcMerchants.status.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("fmtcMerchants.status.inactive")}
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
            selectedActiveStatus={selectedActiveStatus}
            selectedCategory={selectedCategory}
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
