"use client";

import {
  Target,
  CheckCircle,
  XCircle,
  Zap,
  Search,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 品牌匹配统计接口
interface BrandMatchingStats {
  totalMerchants: number;
  matched: number;
  unmatched: number;
  confirmed: number;
  needsConfirmation: number;
}

// 未匹配商户接口
interface UnmatchedMerchant {
  id: string;
  name: string;
  country?: string;
  network?: string;
  homepage?: string;
  primaryCategory?: string;
  lastScrapedAt?: string;
}

// 品牌建议接口
interface BrandSuggestion {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  similarity: number;
}

// 需要确认的匹配接口
interface PendingMatch {
  id: string;
  name: string;
  country?: string;
  brandMatchConfidence?: number;
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface FMTCBrandMatchingPanelProps {
  refreshTrigger: number;
}

export function FMTCBrandMatchingPanel({
  refreshTrigger,
}: FMTCBrandMatchingPanelProps) {
  const t = useTranslations();

  // 状态管理
  const [stats, setStats] = useState<BrandMatchingStats>({
    totalMerchants: 0,
    matched: 0,
    unmatched: 0,
    confirmed: 0,
    needsConfirmation: 0,
  });

  const [unmatchedMerchants, setUnmatchedMerchants] = useState<
    UnmatchedMerchant[]
  >([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [isLoading] = useState(true);

  // 模态框状态
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] =
    useState<UnmatchedMerchant | null>(null);
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>(
    [],
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // 批量操作状态
  const [selectedUnmatched, setSelectedUnmatched] = useState<Set<string>>(
    new Set(),
  );
  const [isBatchMatching, setIsBatchMatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState("");
  const [autoMatchThreshold, setAutoMatchThreshold] = useState(0.8);

  // 获取品牌匹配统计
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/fmtc-merchants/brand-matching?action=stats",
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error("获取匹配统计失败:", error);
    }
  }, []);

  // 获取未匹配商户
  const fetchUnmatchedMerchants = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/fmtc-merchants/brand-matching?action=unmatched&limit=50",
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setUnmatchedMerchants(result.data.merchants);
        }
      }
    } catch (error) {
      console.error("获取未匹配商户失败:", error);
    }
  }, []);

  // 获取需要确认的匹配
  const fetchPendingMatches = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/fmtc-merchants/brand-matching?action=need_confirmation&limit=50",
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setPendingMatches(result.data.merchants);
        }
      }
    } catch (error) {
      console.error("获取待确认匹配失败:", error);
    }
  }, []);

  // 获取品牌建议
  const fetchBrandSuggestions = async (merchantName: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/fmtc-merchants/brand-matching?action=suggestions&merchantName=${encodeURIComponent(merchantName)}`,
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setBrandSuggestions(result.data.suggestions);
        }
      }
    } catch (error) {
      console.error("获取品牌建议失败:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 确认品牌匹配
  const handleConfirmMatch = async (merchantId: string, brandId: string) => {
    try {
      const response = await fetch("/api/fmtc-merchants/brand-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          merchantId,
          brandId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          refreshData();
          setIsSuggestionsModalOpen(false);
        }
      }
    } catch (error) {
      console.error("确认匹配失败:", error);
    }
  };

  // 拒绝品牌匹配
  const handleRejectMatch = async (merchantId: string) => {
    try {
      const response = await fetch("/api/fmtc-merchants/brand-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          merchantId,
        }),
      });

      if (response.ok) {
        refreshData();
      }
    } catch (error) {
      console.error("拒绝匹配失败:", error);
    }
  };

  // 自动匹配单个商户
  const handleAutoMatch = async (merchantId: string) => {
    try {
      const response = await fetch("/api/fmtc-merchants/brand-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auto_match",
          merchantId,
          autoMatchThreshold,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          refreshData();
        }
      }
    } catch (error) {
      console.error("自动匹配失败:", error);
    }
  };

  // 批量自动匹配
  const handleBatchAutoMatch = async () => {
    if (selectedUnmatched.size === 0) return;

    setIsBatchMatching(true);
    setBatchProgress(0);

    try {
      const merchantIds = Array.from(selectedUnmatched);
      const response = await fetch("/api/fmtc-merchants/brand-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_auto_match",
          merchantIds,
          autoMatchThreshold,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setSelectedUnmatched(new Set());
          refreshData();
        }
      }
    } catch (error) {
      console.error("批量匹配失败:", error);
    } finally {
      setIsBatchMatching(false);
      setBatchProgress(0);
    }
  };

  // 打开品牌建议模态框
  const openSuggestionsModal = (merchant: UnmatchedMerchant) => {
    setSelectedMerchant(merchant);
    setIsSuggestionsModalOpen(true);
    fetchBrandSuggestions(merchant.name);
  };

  // 刷新所有数据
  const refreshData = useCallback(() => {
    fetchStats();
    fetchUnmatchedMerchants();
    fetchPendingMatches();
  }, [fetchStats, fetchUnmatchedMerchants, fetchPendingMatches]);

  // 筛选未匹配商户
  const filteredUnmatchedMerchants = unmatchedMerchants.filter((merchant) =>
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    refreshData();
  }, [refreshTrigger, refreshData]);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.brandMatching.total")}
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
              {t("fmtcMerchants.brandMatching.matched")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.matched}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMerchants > 0
                ? `${((stats.matched / stats.totalMerchants) * 100).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.brandMatching.unmatched")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
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
              {t("fmtcMerchants.brandMatching.confirmed")}
            </CardTitle>
            <ThumbsUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.confirmed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("fmtcMerchants.brandMatching.needsConfirmation")}
            </CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.needsConfirmation}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 批量匹配进度 */}
      {isBatchMatching && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("fmtcMerchants.brandMatching.batchMatching")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {batchProgress}%
                </span>
              </div>
              <Progress value={batchProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要内容标签页 */}
      <Tabs defaultValue="unmatched" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unmatched">
            {t("fmtcMerchants.brandMatching.unmatchedMerchants")}
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t("fmtcMerchants.brandMatching.pendingConfirmation")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unmatched" className="space-y-4">
          {/* 操作栏 */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-1 space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("fmtcMerchants.brandMatching.searchMerchants")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-sm">
                  {t("fmtcMerchants.brandMatching.threshold")}:
                </Label>
                <Select
                  value={autoMatchThreshold.toString()}
                  onValueChange={(value) =>
                    setAutoMatchThreshold(parseFloat(value))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.6">60%</SelectItem>
                    <SelectItem value="0.7">70%</SelectItem>
                    <SelectItem value="0.8">80%</SelectItem>
                    <SelectItem value="0.9">90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleBatchAutoMatch}
                disabled={selectedUnmatched.size === 0 || isBatchMatching}
              >
                <Zap className="mr-2 h-4 w-4" />
                {t("fmtcMerchants.brandMatching.batchAutoMatch")} (
                {selectedUnmatched.size})
              </Button>
              <Button variant="outline" onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("common.refresh")}
              </Button>
            </div>
          </div>

          {/* 未匹配商户表格 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("fmtcMerchants.brandMatching.unmatchedMerchants")} (
                {filteredUnmatchedMerchants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredUnmatchedMerchants.length > 0 &&
                            filteredUnmatchedMerchants.every((merchant) =>
                              selectedUnmatched.has(merchant.id),
                            )
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUnmatched(
                                new Set(
                                  filteredUnmatchedMerchants.map((m) => m.id),
                                ),
                              );
                            } else {
                              setSelectedUnmatched(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>{t("fmtcMerchants.columns.name")}</TableHead>
                      <TableHead>
                        {t("fmtcMerchants.columns.country")}
                      </TableHead>
                      <TableHead>
                        {t("fmtcMerchants.columns.network")}
                      </TableHead>
                      <TableHead>
                        {t("fmtcMerchants.columns.category")}
                      </TableHead>
                      <TableHead>{t("common.actions.title")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {t("common.loading")}
                        </TableCell>
                      </TableRow>
                    ) : filteredUnmatchedMerchants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {t(
                            "fmtcMerchants.brandMatching.noUnmatchedMerchants",
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnmatchedMerchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUnmatched.has(merchant.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedUnmatched);

                                if (checked) {
                                  newSelected.add(merchant.id);
                                } else {
                                  newSelected.delete(merchant.id);
                                }
                                setSelectedUnmatched(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{merchant.name}</div>
                            {merchant.homepage && (
                              <div className="text-sm text-muted-foreground">
                                {new URL(merchant.homepage).hostname}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {merchant.country ? (
                              <Badge variant="outline">
                                {merchant.country}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {merchant.network ? (
                              <Badge variant="secondary">
                                {merchant.network}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {merchant.primaryCategory || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSuggestionsModal(merchant)}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAutoMatch(merchant.id)}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* 待确认匹配表格 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("fmtcMerchants.brandMatching.pendingConfirmation")} (
                {pendingMatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("fmtcMerchants.columns.merchant")}
                      </TableHead>
                      <TableHead>
                        {t("fmtcMerchants.columns.suggestedBrand")}
                      </TableHead>
                      <TableHead>
                        {t("fmtcMerchants.columns.confidence")}
                      </TableHead>
                      <TableHead>{t("common.actions.title")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          {t("common.loading")}
                        </TableCell>
                      </TableRow>
                    ) : pendingMatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          {t("fmtcMerchants.brandMatching.noPendingMatches")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingMatches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>
                            <div className="font-medium">{match.name}</div>
                            {match.country && (
                              <Badge variant="outline" className="mt-1">
                                {match.country}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.brand && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={match.brand.logo}
                                    alt={match.brand.name}
                                  />
                                  <AvatarFallback>
                                    {match.brand.name
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{match.brand.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.brandMatchConfidence && (
                              <div className="flex items-center space-x-2">
                                <Progress
                                  value={match.brandMatchConfidence * 100}
                                  className="h-2 w-20"
                                />
                                <span className="text-sm">
                                  {(match.brandMatchConfidence * 100).toFixed(
                                    1,
                                  )}
                                  %
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  match.brand &&
                                  handleConfirmMatch(match.id, match.brand.id)
                                }
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectMatch(match.id)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 品牌建议模态框 */}
      <Dialog
        open={isSuggestionsModalOpen}
        onOpenChange={setIsSuggestionsModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("fmtcMerchants.brandMatching.brandSuggestions")}
            </DialogTitle>
            <DialogDescription>
              {t("fmtcMerchants.brandMatching.suggestionDescription", {
                merchantName: selectedMerchant?.name,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingSuggestions ? (
              <div className="text-center py-4">{t("common.loading")}</div>
            ) : brandSuggestions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t("fmtcMerchants.brandMatching.noSuggestions")}
              </div>
            ) : (
              <div className="space-y-2">
                {brandSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={suggestion.logo}
                          alt={suggestion.name}
                        />
                        <AvatarFallback>
                          {suggestion.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{suggestion.name}</div>
                        {suggestion.description && (
                          <div className="text-sm text-muted-foreground">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(suggestion.similarity * 100).toFixed(1)}%
                        </div>
                        <Progress
                          value={suggestion.similarity * 100}
                          className="h-1 w-16"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          selectedMerchant &&
                          handleConfirmMatch(selectedMerchant.id, suggestion.id)
                        }
                        disabled={suggestion.similarity < autoMatchThreshold}
                      >
                        {t("common.select")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSuggestionsModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                selectedMerchant && handleAutoMatch(selectedMerchant.id)
              }
            >
              <Zap className="mr-2 h-4 w-4" />
              {t("fmtcMerchants.brandMatching.autoMatch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
