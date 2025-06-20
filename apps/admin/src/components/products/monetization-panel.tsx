"use client";

import {
  DollarSign,
  Link2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Wrench,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MonetizationStats {
  overview: {
    totalProducts: number;
    totalMonetized: number;
    totalPending: number;
    overallPercentage: number;
    doubleEncodedUrls?: number;
  };
  bySource: {
    source: string;
    total: number;
    monetized: number;
    pending: number;
    percentage: number;
  }[];
  issues?: {
    doubleEncodedUrls: number;
  };
}

interface MonetizationPanelProps {
  selectedProductIds: string[];
  onRefresh?: () => void;
  className?: string;
}

export function MonetizationPanel({
  selectedProductIds,
  onRefresh,
  className,
}: MonetizationPanelProps) {
  const t = useTranslations("products.monetization");
  const tCommon = useTranslations("common");
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixingUrls, setIsFixingUrls] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFixConfirmDialog, setShowFixConfirmDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // API Key state
  const [apiKey, setApiKey] = useState("");
  const [currentApiKey, setCurrentApiKey] = useState("");
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 获取货币化统计信息
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/products/monetize");

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();

      setStats(data);
    } catch {
      toast.error(t("messages.generateError"));
    } finally {
      setIsLoadingStats(false);
    }
  }, [t]);

  // 获取当前API Key
  const fetchApiKey = useCallback(async () => {
    setIsLoadingApiKey(true);
    try {
      const response = await fetch("/api/settings/sovrn-api-key");

      if (!response.ok) throw new Error("Failed to fetch API key");

      const data = await response.json();

      if (data.success) {
        setCurrentApiKey(data.apiKey || "");
        setApiKey(data.apiKey || ""); // 同时设置编辑状态的值
      } else {
        throw new Error(data.error || "Failed to fetch API key");
      }
    } catch {
      toast.error(t("messages.fetchApiKeyFailed"));
    } finally {
      setIsLoadingApiKey(false);
    }
  }, [t]);

  // 保存API Key
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t("messages.invalidApiKey"));

      return;
    }

    setIsSavingApiKey(true);
    try {
      const response = await fetch("/api/settings/sovrn-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("messages.saveApiKeyFailed"));
      }

      if (result.success) {
        setCurrentApiKey(apiKey.trim());
        setShowApiKeyDialog(false);
        toast.success(t("messages.apiKeySaved"));

        // 刷新统计数据
        await fetchStats();
      } else {
        throw new Error(result.error || t("messages.saveApiKeyFailed"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.saveApiKeyFailed"),
      );
    } finally {
      setIsSavingApiKey(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchApiKey();
  }, [fetchStats, fetchApiKey]);

  // 批量生成货币化URL
  const handleBatchGenerate = async () => {
    if (!currentApiKey) {
      toast.error(t("messages.apiKeyRequired"));
      setShowApiKeyDialog(true);

      return;
    }

    setShowConfirmDialog(false);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/products/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds:
            selectedProductIds.length > 0 ? selectedProductIds : undefined,
          batchSize: 50,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to generate monetization links",
        );
      }

      if (result.successful > 0) {
        toast.success(
          result.failed > 0
            ? t("messages.generatePartial", {
                success: result.successful,
                failed: result.failed,
              })
            : t("messages.generateSuccess", { count: result.successful }),
        );
      } else {
        toast.error(t("messages.generateError"));
      }

      // 刷新统计和列表
      await fetchStats();
      onRefresh?.();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("API Key not configured")
      ) {
        toast.error(t("messages.apiKeyRequired"));
        setShowApiKeyDialog(true);
      } else {
        toast.error(t("messages.generateError"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 修复双重编码URL
  const handleFixDoubleEncodedUrls = async () => {
    if (!currentApiKey) {
      toast.error(t("messages.apiKeyRequired"));
      setShowApiKeyDialog(true);

      return;
    }

    setShowFixConfirmDialog(false);
    setIsFixingUrls(true);

    try {
      const response = await fetch("/api/products/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixDoubleEncoded: true,
          batchSize: 100,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fix double encoded URLs");
      }

      if (result.successful > 0) {
        toast.success(
          t("messages.fixDoubleEncodedSuccess", {
            successful: result.successful,
            failed: result.failed || 0,
          }),
        );
      } else {
        toast.info(t("messages.noDoubleEncodedUrls"));
      }

      // 刷新统计和列表
      await fetchStats();
      onRefresh?.();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("API Key not configured")
      ) {
        toast.error(t("messages.apiKeyRequired"));
        setShowApiKeyDialog(true);
      } else {
        toast.error(t("messages.fixDoubleEncodedError"));
      }
    } finally {
      setIsFixingUrls(false);
    }
  };

  if (isLoadingStats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const hasIssues =
    stats?.issues?.doubleEncodedUrls && stats.issues.doubleEncodedUrls > 0;
  const hasApiKey = Boolean(currentApiKey);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>{t("title")}</CardTitle>
              {hasIssues && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("warnings.doubleEncodedUrls.title", {
                    count: stats.issues.doubleEncodedUrls,
                  })}
                </Badge>
              )}
              {!hasApiKey && (
                <Badge variant="secondary" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("warnings.noApiKey.title")}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeyDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t("settings.button")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoadingStats}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4 mr-2",
                    isLoadingStats && "animate-spin",
                  )}
                />
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
          <CardDescription>{t("stats.title")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key 状态警告 */}
          {!hasApiKey && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800 font-medium">
                    {t("warnings.noApiKey.title")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t("settings.configureNow")}
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                {t("warnings.noApiKey.description")}
              </p>
            </div>
          )}

          {/* 问题警告 */}
          {hasIssues && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">
                    {t("warnings.doubleEncodedUrls.title", {
                      count: stats.issues.doubleEncodedUrls,
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFixConfirmDialog(true)}
                  disabled={isFixingUrls || !hasApiKey}
                >
                  {isFixingUrls ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Wrench className="h-3 w-3 mr-1" />
                  )}
                  {t("warnings.doubleEncodedUrls.fixButton")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("warnings.doubleEncodedUrls.description")}
              </p>
            </div>
          )}

          {/* 总体统计 */}
          {stats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("stats.percentage")}
                </span>
                <span className="font-medium">
                  {stats.overview.overallPercentage}%
                </span>
              </div>
              <Progress
                value={stats.overview.overallPercentage}
                className="h-2"
              />

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {stats.overview.totalProducts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.total")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.overview.totalMonetized}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.monetized")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.overview.totalPending}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.pending")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 批量操作按钮 */}
          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => setShowConfirmDialog(true)}
              disabled={
                isGenerating || stats?.overview.totalPending === 0 || !hasApiKey
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("batchGenerating")}
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  {selectedProductIds.length > 0
                    ? t("generateForSelected")
                    : t("batchGenerate")}
                </>
              )}
            </Button>

            {selectedProductIds.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("selectedCount", { count: selectedProductIds.length })}
              </p>
            )}
          </div>

          {/* 来源统计 */}
          {stats && stats.bySource.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium mb-2">
                {t("stats.bySourceTitle")}
              </p>
              {stats.bySource.map((source) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground capitalize">
                    {source.source}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {source.monetized}/{source.total}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({source.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key 设置对话框 */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{t("dialog.apiConfig.title")}</span>
            </DialogTitle>
            <DialogDescription>
              {t("dialog.apiConfig.description")}
              <br />
              <a
                href="https://viglink.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("dialog.apiConfig.visitViglink")}
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">{t("apiKey.label")}</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={t("apiKey.placeholder")}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoadingApiKey || isSavingApiKey}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isLoadingApiKey || isSavingApiKey}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {currentApiKey && (
              <>
                <Separator />
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("dialog.apiConfig.currentStatus")}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {t("apiKey.configured")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("dialog.apiConfig.maskedKey", {
                      start: currentApiKey.substring(0, 8),
                      end: currentApiKey.substring(currentApiKey.length - 4),
                    })}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApiKeyDialog(false);
                setApiKey(currentApiKey); // 恢复原值
              }}
              disabled={isSavingApiKey}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSaveApiKey}
              disabled={isSavingApiKey || !apiKey.trim()}
            >
              {isSavingApiKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("apiKey.saving")}
                </>
              ) : (
                t("apiKey.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("batchGenerate")}</DialogTitle>
            <DialogDescription>
              {selectedProductIds.length > 0
                ? t("messages.confirmBatchGenerate", {
                    count: selectedProductIds.length,
                  })
                : t("messages.confirmBatchGenerate", {
                    count: stats?.overview.totalPending || 0,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleBatchGenerate}>
              {t("actions.confirmGenerate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修复URL确认对话框 */}
      <Dialog
        open={showFixConfirmDialog}
        onOpenChange={setShowFixConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>{t("dialog.fixUrls.title")}</span>
            </DialogTitle>
            <DialogDescription>
              {t("dialog.fixUrls.description", {
                count: stats?.issues?.doubleEncodedUrls || 0,
              })}
              <br />
              <br />
              {t("dialog.fixUrls.explanation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFixConfirmDialog(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleFixDoubleEncodedUrls}>
              {t("dialog.fixUrls.fixNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
