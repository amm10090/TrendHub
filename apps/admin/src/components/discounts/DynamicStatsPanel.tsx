"use client";

import {
  BarChart3,
  CheckCircle,
  AlertCircle,
  Target,
  Link2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";

// Card components not used in this file

// 折扣统计接口
interface DiscountStats {
  total: number;
  active: number;
  expired: number;
  inactive: number;
}

// 品牌匹配统计接口
interface BrandMatchingStats {
  totalMapped: number;
  confirmed: number;
  unconfirmed: number;
  unmatched: number;
}

// FMTC商户统计接口
interface FMTCMerchantStats {
  totalMerchants: number;
  activeMerchants: number;
  inactiveMerchants: number;
  brandMatched: number;
  unmatched: number;
  recentlyUpdated: number;
}

interface DynamicStatsPanelProps {
  activeTab: string;
}

export function DynamicStatsPanel({ activeTab }: DynamicStatsPanelProps) {
  // Translation not used in this component

  // 各种统计数据状态
  const [discountStats, setDiscountStats] = useState<DiscountStats>({
    total: 0,
    active: 0,
    expired: 0,
    inactive: 0,
  });

  const [brandMatchingStats, setBrandMatchingStats] =
    useState<BrandMatchingStats>({
      totalMapped: 0,
      confirmed: 0,
      unconfirmed: 0,
      unmatched: 0,
    });

  const [fmtcStats, setFmtcStats] = useState<FMTCMerchantStats>({
    totalMerchants: 0,
    activeMerchants: 0,
    inactiveMerchants: 0,
    brandMatched: 0,
    unmatched: 0,
    recentlyUpdated: 0,
  });

  const [loading, setLoading] = useState(false);

  // 获取折扣统计数据
  const fetchDiscountStats = async () => {
    try {
      const response = await fetch("/api/discounts?stats=true");
      const result = await response.json();

      if (result.success && result.stats) {
        setDiscountStats(result.stats);
      }
    } catch {
      // Silently handle error
    }
  };

  // 获取品牌匹配统计数据
  const fetchBrandMatchingStats = async () => {
    try {
      const response = await fetch(
        "/api/discounts/brand-matching?action=stats",
      );
      const result = await response.json();

      if (result.success && result.data) {
        setBrandMatchingStats({
          totalMapped: result.data.matchedMerchants || 0,
          confirmed: result.data.confirmedMappings || 0,
          unconfirmed:
            (result.data.matchedMerchants || 0) -
            (result.data.confirmedMappings || 0),
          unmatched: result.data.unmatchedMerchants || 0,
        });
      }
    } catch {
      // Silently handle error
    }
  };

  // 获取FMTC商户统计数据
  const fetchFMTCStats = async () => {
    try {
      const response = await fetch("/api/fmtc-merchants?page=1&limit=1");
      const result = await response.json();

      if (result.success && result.data && result.data.stats) {
        setFmtcStats(result.data.stats);
      }
    } catch {
      // Silently handle error
    }
  };

  // 监听标签页变化
  useEffect(() => {
    const fetchStatsForTab = async (tab: string) => {
      setLoading(true);
      try {
        switch (tab) {
          case "discounts":
          case "analytics":
            await fetchDiscountStats();
            break;
          case "brand-matching":
            await fetchBrandMatchingStats();
            break;
          case "fmtc-merchants":
            await fetchFMTCStats();
            break;
          default:
            await fetchDiscountStats();
            break;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatsForTab(activeTab);
  }, [activeTab]);

  // 渲染折扣统计卡片
  const renderDiscountStats = () => (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="grid grid-cols-4 gap-1">
        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-base font-bold">{discountStats.total}</div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            总折扣数
          </div>
          <div className="text-xs text-muted-foreground/70">
            {discountStats.total > 0
              ? Math.round((discountStats.active / discountStats.total) * 100)
              : 0}
            %
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="text-base font-bold text-green-600">
            {discountStats.active}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            活跃折扣
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div className="text-base font-bold text-red-600">
            {discountStats.expired}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            已过期
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-50 mb-1">
            <Target className="h-3.5 w-3.5 text-yellow-600" />
          </div>
          <div className="text-base font-bold text-yellow-600">
            {discountStats.inactive}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            未匹配
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染品牌匹配统计卡片
  const renderBrandMatchingStats = () => (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="grid grid-cols-4 gap-1">
        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 mb-1">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-base font-bold">
            {brandMatchingStats.totalMapped}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            已映射商家
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="text-base font-bold text-green-600">
            {brandMatchingStats.confirmed}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            已确认映射
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-50 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
          </div>
          <div className="text-base font-bold text-yellow-600">
            {brandMatchingStats.unconfirmed}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            待确认映射
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 mb-1">
            <Target className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div className="text-base font-bold text-red-600">
            {brandMatchingStats.unmatched}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            未匹配商家
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染FMTC商户统计卡片
  const renderFMTCStats = () => (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="grid grid-cols-4 gap-1">
        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-base font-bold">{fmtcStats.totalMerchants}</div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            总商户数
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="text-base font-bold text-green-600">
            {fmtcStats.activeMerchants}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            活跃商户
          </div>
          <div className="text-xs text-muted-foreground/70">
            {fmtcStats.totalMerchants > 0
              ? `${((fmtcStats.activeMerchants / fmtcStats.totalMerchants) * 100).toFixed(1)}%`
              : "0%"}
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 mb-1">
            <Target className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="text-base font-bold text-green-600">
            {fmtcStats.brandMatched}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            已匹配品牌
          </div>
          <div className="text-xs text-muted-foreground/70">
            {fmtcStats.totalMerchants > 0
              ? `${((fmtcStats.brandMatched / fmtcStats.totalMerchants) * 100).toFixed(1)}%`
              : "0%"}
          </div>
        </div>

        <div className="flex flex-col items-center py-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 mb-1">
            <ExternalLink className="h-3.5 w-3.5 text-orange-600" />
          </div>
          <div className="text-base font-bold text-orange-600">
            {fmtcStats.unmatched}
          </div>
          <div className="text-xs text-muted-foreground text-center leading-tight">
            未匹配品牌
          </div>
        </div>
      </div>
    </div>
  );

  // 根据标签页选择要渲染的统计信息
  const renderStatsForTab = () => {
    if (loading) {
      return (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="grid grid-cols-4 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center py-2 px-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 mb-1">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                </div>
                <div className="h-4 w-6 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-10 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "discounts":
      case "analytics":
        return renderDiscountStats();
      case "brand-matching":
        return renderBrandMatchingStats();
      case "fmtc-merchants":
        return renderFMTCStats();
      default:
        return renderDiscountStats();
    }
  };

  return renderStatsForTab();
}
