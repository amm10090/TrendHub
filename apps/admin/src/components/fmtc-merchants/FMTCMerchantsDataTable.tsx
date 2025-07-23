"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  ExternalLink,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Globe,
  Calendar,
  Download,
  Settings,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { FMTCMerchantDetailModal } from "./FMTCMerchantDetailModal";

const logger = {
  error: (message: string, context?: unknown) =>
    console.error(`[FMTCMerchantsDataTable ERROR] ${message}`, context || ""),
};

// 商户统计接口定义
interface FMTCMerchantStats {
  totalMerchants: number;
  activeMerchants: number;
  inactiveMerchants: number;
  brandMatched: number;
  unmatched: number;
  recentlyUpdated: number;
}

// 商户接口定义
interface FMTCMerchant {
  id: string;
  name: string;
  country?: string;
  network?: string;
  homepage?: string;
  primaryCategory?: string;
  fmtcId?: string;
  status?: string;
  brandId?: string;
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
  brandMatchConfidence?: number;
  brandMatchConfirmed: boolean;
  logo120x60?: string;
  lastScrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  freshReachSupported: boolean;
  networks?: Array<{
    id: string;
    networkName: string;
    networkId?: string;
    status: string;
    isActive: boolean;
  }>;
}

interface FMTCMerchantsDataTableProps {
  searchTerm: string;
  selectedCountry: string;
  selectedNetwork: string;
  brandMatchStatus: string;
  selectedActiveStatus: string;
  refreshTrigger: number;
  onStatsUpdate: (stats: FMTCMerchantStats) => void;
}

export function FMTCMerchantsDataTable({
  searchTerm,
  selectedCountry,
  selectedNetwork,
  brandMatchStatus,
  selectedActiveStatus,
  refreshTrigger,
  onStatsUpdate,
}: FMTCMerchantsDataTableProps) {
  const t = useTranslations();
  const locale = useLocale();

  // 状态管理
  const [merchants, setMerchants] = useState<FMTCMerchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState<FMTCMerchant | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scrapingMerchants, setScrapingMerchants] = useState<Set<string>>(
    new Set(),
  );

  // 页面大小状态
  const [pageSize, setPageSize] = useState(20);

  // 批量抓取状态
  const [isBatchScraping, setIsBatchScraping] = useState(false);
  const [batchScrapingProgress, setBatchScrapingProgress] = useState({
    current: 0,
    total: 0,
    completed: 0,
    failed: 0,
    running: 0,
    pending: 0,
    percentage: 0,
    workers: [] as Array<{
      id: string;
      isWorking: boolean;
      currentTask?: {
        merchantName: string;
        startTime: string;
      };
    }>,
    recentCompletedTasks: [] as Array<{
      merchantName: string;
      duration: number;
    }>,
    estimatedTimeRemaining: undefined as number | undefined,
  });

  // SSE连接状态
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);

  // 构建查询字符串
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
    });

    if (searchTerm) params.append("search", searchTerm);
    if (selectedCountry && selectedCountry !== "all")
      params.append("country", selectedCountry);
    if (selectedNetwork && selectedNetwork !== "all")
      params.append("network", selectedNetwork);
    if (brandMatchStatus && brandMatchStatus !== "all")
      params.append("brandMatched", brandMatchStatus);
    if (selectedActiveStatus && selectedActiveStatus !== "all")
      params.append("activeStatus", selectedActiveStatus);

    return params.toString();
  }, [
    currentPage,
    pageSize,
    searchTerm,
    selectedCountry,
    selectedNetwork,
    brandMatchStatus,
    selectedActiveStatus,
  ]);

  // 获取商户数据
  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/fmtc-merchants?${queryString}`);

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setMerchants(result.data.merchants);
          setTotalPages(result.data.pagination.totalPages);
          setTotalCount(result.data.pagination.totalCount);
          onStatsUpdate(result.data.stats);
        } else {
          logger.error("获取商户数据失败:", result.error);
        }
      }
    } catch (error) {
      logger.error("获取商户数据出错:", error);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, onStatsUpdate]);

  // 批量操作
  const handleBatchAction = async (action: string, data?: unknown) => {
    const selectedIds = Object.keys(rowSelection);

    if (selectedIds.length === 0) {
      toast.error(t("fmtcMerchants.bulkActions.noSelection"));

      return;
    }

    if (action === "delete") {
      setShowDeleteDialog(true);

      return;
    }

    try {
      setIsBulkOperating(true);
      const response = await fetch("/api/fmtc-merchants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, data }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setRowSelection({});
          fetchMerchants();

          // 显示成功消息
          const successKey = `fmtcMerchants.bulkActions.bulk${action.charAt(0).toUpperCase() + action.slice(1)}Success`;

          toast.success(t(successKey, { count: result.data.updatedCount }));
        } else {
          toast.error(
            result.error || t("fmtcMerchants.bulkActions.bulkUpdateError"),
          );
        }
      } else {
        toast.error(t("fmtcMerchants.bulkActions.bulkUpdateError"));
      }
    } catch (error) {
      logger.error("批量操作失败:", error);
      toast.error(t("fmtcMerchants.bulkActions.bulkUpdateError"));
    } finally {
      setIsBulkOperating(false);
    }
  };

  // 确认批量删除
  const handleConfirmBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);

    try {
      setIsBulkOperating(true);
      const response = await fetch("/api/fmtc-merchants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setRowSelection({});
          setShowDeleteDialog(false);
          fetchMerchants();

          // 显示成功消息
          toast.success(
            t("fmtcMerchants.bulkActions.bulkDeleteSuccess", {
              count: result.data.updatedCount,
            }),
          );
        } else {
          toast.error(
            result.error || t("fmtcMerchants.bulkActions.bulkDeleteError"),
          );
        }
      } else {
        toast.error(t("fmtcMerchants.bulkActions.bulkDeleteError"));
      }
    } catch (error) {
      logger.error("批量删除失败:", error);
      toast.error(t("fmtcMerchants.bulkActions.bulkDeleteError"));
    } finally {
      setIsBulkOperating(false);
    }
  };

  // 建立SSE连接监听实时进度
  const establishSSEConnection = useCallback(
    (executionId: string) => {
      // 清理现有连接
      if (sseConnection) {
        sseConnection.close();
      }

      const eventSource = new EventSource(
        `/api/fmtc-merchants/progress/${executionId}`,
      );

      eventSource.onopen = () => {
        console.log("SSE连接已建立");
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          console.log("[SSE前端] 收到消息:", data);

          if (data.type === "connected") {
            console.log("SSE连接确认:", data.message);
          } else if (data.type === "progress") {
            // 更新实时进度
            setBatchScrapingProgress((prev) => ({
              ...prev,
              completed: data.completed || 0,
              failed: data.failed || 0,
              running: data.running || 0,
              pending: data.pending || 0,
              percentage: data.percentage || 0,
              workers: data.workers || [],
              recentCompletedTasks: data.recentCompletedTasks || [],
              estimatedTimeRemaining: data.estimatedTimeRemaining,
            }));
          } else if (data.type === "completed") {
            // 抓取完成
            setIsBatchScraping(false);
            eventSource.close();
            setSseConnection(null);
            setCurrentExecutionId(null);

            // 显示最终结果
            const summary = data.summary;

            if (summary) {
              toast.success(
                t("fmtcMerchants.scraping.batchSuccess", {
                  completed: summary.successfulTasks,
                  failed: summary.failedTasks,
                  total: summary.totalTasks,
                }),
                {
                  description: `${summary.speedImprovement} | ${t("fmtcMerchants.scraping.performanceStats", { totalTime: summary.totalTimeSeconds, avgTime: summary.averageTimePerTaskSeconds })}`,
                  duration: 6000,
                },
              );
            }

            // 刷新数据
            fetchMerchants();
          }
        } catch (error) {
          console.error("解析SSE数据失败:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE连接错误:", error);
        eventSource.close();
        setSseConnection(null);
      };

      setSseConnection(eventSource);
      setCurrentExecutionId(executionId);
    },
    [sseConnection, t, fetchMerchants],
  );

  // 批量刷新商户数据
  const handleBatchRefreshData = async () => {
    const selectedIds = Object.keys(rowSelection);

    if (selectedIds.length === 0) {
      toast.error(t("fmtcMerchants.bulkActions.noSelection"));

      return;
    }

    setIsBatchScraping(true);
    setBatchScrapingProgress({
      current: 0,
      total: selectedIds.length,
      completed: 0,
      failed: 0,
      running: 0,
      pending: selectedIds.length,
      percentage: 0,
      workers: [],
      recentCompletedTasks: [],
    });

    toast.info(
      t("fmtcMerchants.scraping.batchStarted", { count: selectedIds.length }),
    );

    try {
      const response = await fetch("/api/fmtc-merchants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "batch_refresh_data",
        }),
      });

      if (response.ok) {
        const result = await response.json();

        console.log("批量刷新API响应:", result);

        if (result.success) {
          setRowSelection({});

          // 从响应中获取executionId，立即建立SSE连接监听实时进度
          const executionId = result.data?.executionId || result.executionId;

          console.log("尝试获取executionId:", {
            fromData: result.data?.executionId,
            fromRoot: result.executionId,
            final: executionId,
            fullData: result.data,
          });

          if (executionId) {
            console.log("获取到executionId，立即建立SSE连接:", executionId);
            establishSSEConnection(executionId);
          } else {
            console.log("未获取到executionId，使用传统方式显示结果");
            // 如果没有executionId，使用传统方式显示结果
            setIsBatchScraping(false);

            const data = result.data;
            const speedInfo = data.speedImprovement
              ? `${data.speedImprovement}`
              : "";
            const timeInfo = data.totalTime
              ? `${t("common.totalTime")} ${data.totalTime}${t("common.seconds")}`
              : "";
            const avgTimeInfo = data.averageTimePerTask
              ? `${t("common.average")} ${data.averageTimePerTask}${t("common.seconds")}/${t("common.perMerchant")}`
              : "";

            toast.success(
              t("fmtcMerchants.scraping.batchSuccess", {
                completed: data.completed || 0,
                failed: data.failed || 0,
                total: selectedIds.length,
              }),
              {
                description: [speedInfo, timeInfo, avgTimeInfo]
                  .filter(Boolean)
                  .join(" | "),
                duration: 6000,
              },
            );

            fetchMerchants();
          }
        } else {
          setIsBatchScraping(false);
          toast.error(result.error || t("fmtcMerchants.scraping.batchFailed"));
        }
      } else {
        setIsBatchScraping(false);
        toast.error(t("fmtcMerchants.scraping.batchFailed"));
      }
    } catch (error) {
      logger.error("批量刷新失败:", error);
      setIsBatchScraping(false);
      toast.error(t("fmtcMerchants.scraping.batchFailed"));
    }
    // 注意：不在finally中重置状态，因为SSE连接会处理完成状态
  };

  // 单个商户操作
  const handleMerchantAction = useCallback(
    async (merchantId: string, action: string, data?: unknown) => {
      try {
        // 如果是刷新数据操作，显示特别的loading状态和反馈
        if (action === "refresh_data") {
          // 添加到正在抓取的商户列表
          setScrapingMerchants((prev) => new Set(prev).add(merchantId));

          // 显示开始抓取的toast
          toast.info(t("fmtcMerchants.scraping.started"), {
            description: t("fmtcMerchants.scraping.pleaseWait"),
          });

          const response = await fetch(`/api/fmtc-merchants/${merchantId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, data }),
          });

          // 从正在抓取的列表中移除
          setScrapingMerchants((prev) => {
            const newSet = new Set(prev);

            newSet.delete(merchantId);

            return newSet;
          });

          if (response.ok) {
            const result = await response.json();

            if (result.success) {
              // 抓取成功
              toast.success(t("fmtcMerchants.scraping.success"), {
                description: result.data?.scrapingInfo?.processingTime
                  ? t("fmtcMerchants.scraping.processingTime", {
                      time: Math.round(
                        result.data.scrapingInfo.processingTime / 1000,
                      ),
                    })
                  : t("fmtcMerchants.scraping.dataUpdated"),
              });

              // 刷新商户列表
              fetchMerchants();
            } else {
              // 抓取失败
              if (
                result.error?.includes("配置未找到") ||
                result.error?.includes("登录凭据未配置")
              ) {
                toast.error(t("fmtcMerchants.scraping.configError"), {
                  description: result.error,
                  action: {
                    label: t("fmtcMerchants.scraping.goToSettings"),
                    onClick: () => {
                      // 可以导航到设置页面
                      window.open("/admin/settings/discounts", "_blank");
                    },
                  },
                });
              } else if (result.error?.includes("FMTC ID")) {
                toast.error(t("fmtcMerchants.scraping.missingFmtcId"), {
                  description: t("fmtcMerchants.scraping.missingFmtcIdDesc"),
                });
              } else {
                toast.error(t("fmtcMerchants.scraping.failed"), {
                  description: result.error,
                });
              }
            }
          } else {
            // HTTP错误
            const errorData = await response.json().catch(() => ({}));

            toast.error(t("fmtcMerchants.scraping.failed"), {
              description:
                errorData.error || t("fmtcMerchants.scraping.networkError"),
            });
          }
        } else {
          // 其他操作的原有逻辑
          const response = await fetch(`/api/fmtc-merchants/${merchantId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, data }),
          });

          if (response.ok) {
            const result = await response.json();

            if (result.success) {
              fetchMerchants();

              // 为其他操作添加成功提示
              if (action === "confirm_brand_match") {
                toast.success(t("fmtcMerchants.actions.brandMatchConfirmed"));
              } else if (action === "reject_brand_match") {
                toast.success(t("fmtcMerchants.actions.brandMatchRejected"));
              }
            } else {
              toast.error(
                result.error || t("fmtcMerchants.actions.operationFailed"),
              );
            }
          } else {
            toast.error(t("fmtcMerchants.actions.operationFailed"));
          }
        }
      } catch (error) {
        // 确保从正在抓取的列表中移除
        if (action === "refresh_data") {
          setScrapingMerchants((prev) => {
            const newSet = new Set(prev);

            newSet.delete(merchantId);

            return newSet;
          });
        }

        logger.error("商户操作失败:", error);
        toast.error(t("fmtcMerchants.actions.operationFailed"), {
          description: (error as Error).message,
        });
      }
    },
    [fetchMerchants, t],
  );

  // 查看商户详情
  const handleViewDetails = useCallback((merchant: FMTCMerchant) => {
    setSelectedMerchant(merchant);
    setIsDetailModalOpen(true);
  }, []);

  // 格式化日期
  const formatDate = useCallback(
    (dateString: string) => {
      return new Date(dateString).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [locale],
  );

  // 获取品牌匹配状态
  const getBrandMatchStatus = useCallback(
    (merchant: FMTCMerchant) => {
      if (!merchant.brandId) {
        return {
          status: "unmatched",
          label: t("fmtcMerchants.status.unmatched"),
          color: "bg-gray-100 text-gray-800",
        };
      }
      if (merchant.brandMatchConfirmed) {
        return {
          status: "confirmed",
          label: t("fmtcMerchants.status.confirmed"),
          color: "bg-green-100 text-green-800",
        };
      }

      return {
        status: "pending",
        label: t("fmtcMerchants.status.needsConfirmation"),
        color: "bg-yellow-100 text-yellow-800",
      };
    },
    [t],
  );

  // 定义表格列
  const columns: ColumnDef<FMTCMerchant>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t("common.selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("common.selectRow")}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: t("fmtcMerchants.columns.name"),
        cell: ({ row }) => {
          const merchant = row.original;

          return (
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={merchant.logo120x60} alt={merchant.name} />
                <AvatarFallback>
                  {merchant.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{merchant.name}</div>
                {merchant.homepage && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    {React.createElement(Globe, { className: "mr-1 h-3 w-3" })}
                    <a
                      href={merchant.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {new URL(merchant.homepage).hostname}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "country",
        header: t("fmtcMerchants.columns.country"),
        cell: ({ row }) => {
          const country = row.getValue("country") as string;

          return country ? (
            <Badge variant="outline">{country}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "network",
        header: t("fmtcMerchants.columns.network"),
        cell: ({ row }) => {
          const network = row.getValue("network") as string;

          return network ? (
            <Badge variant="secondary">{network}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "primaryCategory",
        header: t("fmtcMerchants.columns.category"),
        cell: ({ row }) => {
          const category = row.getValue("primaryCategory") as string;

          return category ? (
            <span className="text-sm">{category}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        id: "brandMatch",
        header: t("fmtcMerchants.columns.brandMatch"),
        cell: ({ row }) => {
          const merchant = row.original;
          const status = getBrandMatchStatus(merchant);

          return (
            <div className="space-y-1">
              <Badge className={status.color}>{status.label}</Badge>
              {merchant.brand && (
                <div className="text-sm text-muted-foreground">
                  {merchant.brand.name}
                </div>
              )}
              {merchant.brandMatchConfidence && (
                <div className="text-xs text-muted-foreground">
                  {t("fmtcMerchants.columns.confidence")}:{" "}
                  {(merchant.brandMatchConfidence * 100).toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "freshReachSupported",
        header: t("fmtcMerchants.columns.freshReach"),
        cell: ({ row }) => {
          const isSupported = row.getValue("freshReachSupported") as boolean;

          return (
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isSupported ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm ${
                  isSupported ? "text-green-700" : "text-red-700"
                }`}
              >
                {isSupported
                  ? t("fmtcMerchants.freshReach.supported")
                  : t("fmtcMerchants.freshReach.notSupported")}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "lastScrapedAt",
        header: t("fmtcMerchants.columns.lastUpdate"),
        cell: ({ row }) => {
          const date = row.getValue("lastScrapedAt") as string;

          return date ? (
            <div className="flex items-center text-sm">
              {React.createElement(Calendar, { className: "mr-1 h-3 w-3" })}
              {formatDate(date)}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: t("fmtcMerchants.columns.status"),
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;

          return (
            <Badge
              className={
                isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }
            >
              {isActive
                ? t("fmtcMerchants.status.active")
                : t("fmtcMerchants.status.inactive")}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: t("common.actions.title"),
        cell: ({ row }) => {
          const merchant = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">
                    {t("common.actions.openMenu")}
                  </span>
                  {React.createElement(MoreHorizontal, {
                    className: "h-4 w-4",
                  })}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t("common.actions.title")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewDetails(merchant)}>
                  {React.createElement(Eye, { className: "mr-2 h-4 w-4" })}
                  {t("fmtcMerchants.actions.viewDetails")}
                </DropdownMenuItem>
                {merchant.homepage && (
                  <DropdownMenuItem asChild>
                    <a
                      href={merchant.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      {React.createElement(ExternalLink, {
                        className: "mr-2 h-4 w-4",
                      })}
                      {t("fmtcMerchants.actions.visitSite")}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleMerchantAction(merchant.id, "refresh_data")
                  }
                  disabled={scrapingMerchants.has(merchant.id)}
                >
                  {scrapingMerchants.has(merchant.id) ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t("fmtcMerchants.scraping.inProgress")}
                    </div>
                  ) : (
                    <>
                      {React.createElement(RefreshCw, {
                        className: "mr-2 h-4 w-4",
                      })}
                      {t("fmtcMerchants.actions.refreshData")}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleMerchantAction(merchant.id, "confirm_brand_match")
                  }
                  disabled={!merchant.brandId || merchant.brandMatchConfirmed}
                >
                  {React.createElement(CheckCircle, {
                    className: "mr-2 h-4 w-4",
                  })}
                  {t("fmtcMerchants.actions.confirmMatch")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleMerchantAction(merchant.id, "reject_brand_match")
                  }
                  disabled={!merchant.brandId}
                >
                  {React.createElement(XCircle, { className: "mr-2 h-4 w-4" })}
                  {t("fmtcMerchants.actions.rejectMatch")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      t,
      handleViewDetails,
      handleMerchantAction,
      getBrandMatchStatus,
      formatDate,
      scrapingMerchants,
    ],
  );

  // 创建表格实例
  const table = useReactTable({
    data: merchants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id, // 使用实际的商户ID作为行键
    state: {
      sorting,
      rowSelection,
    },
    // 禁用内置分页，因为我们使用服务器端分页
    manualPagination: true,
  });

  // 监听筛选条件变化
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedCountry,
    selectedNetwork,
    brandMatchStatus,
    selectedActiveStatus,
    pageSize, // 页面大小变化时也重置页码
  ]);

  // 获取数据
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants, refreshTrigger, currentPage]);

  // 组件卸载时清理SSE连接
  useEffect(() => {
    return () => {
      if (sseConnection) {
        sseConnection.close();
        setSseConnection(null);
      }
    };
  }, [sseConnection]);

  const selectedRowCount = Object.keys(rowSelection).length;

  // 页面大小选项
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="space-y-4">
      {/* 页面设置和批量抓取进度 */}
      <div className="flex items-center justify-between gap-4">
        {/* 页面大小选择器 */}
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("common.pageSize")}:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {t("fmtcMerchants.pagination.itemsPerPage")}
          </span>
        </div>

        {/* 批量抓取进度 */}
        {isBatchScraping && (
          <div className="flex flex-col space-y-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            {/* 主进度条 */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t("fmtcMerchants.scraping.progress")}
              </span>
              <div className="flex-1 max-w-xs">
                <Progress
                  value={batchScrapingProgress.percentage}
                  className="h-2"
                />
              </div>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                {batchScrapingProgress.completed + batchScrapingProgress.failed}
                /{batchScrapingProgress.total}(
                {batchScrapingProgress.percentage}%)
              </span>
            </div>

            {/* 详细状态信息 */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="text-green-600">
                ✓ {t("common.completed")}: {batchScrapingProgress.completed}
              </span>
              <span className="text-red-600">
                ✗ {t("common.failed")}: {batchScrapingProgress.failed}
              </span>
              <span className="text-blue-600">
                ⚡ {t("common.processing")}: {batchScrapingProgress.running}
              </span>
              <span className="text-gray-600">
                ⏳ {t("common.pending")}: {batchScrapingProgress.pending}
              </span>
              {batchScrapingProgress.estimatedTimeRemaining && (
                <span className="text-orange-600">
                  ⏱ {t("common.estimatedRemaining")}:{" "}
                  {Math.round(
                    batchScrapingProgress.estimatedTimeRemaining / 1000,
                  )}
                  {t("common.seconds")}
                </span>
              )}
            </div>

            {/* 工作线程状态 */}
            {batchScrapingProgress.workers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600">
                  {t("common.workers")}:
                </span>
                {batchScrapingProgress.workers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`px-2 py-1 rounded text-xs ${
                      worker.isWorking
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                    title={
                      worker.currentTask
                        ? `${t("common.processingTask")}: ${worker.currentTask.merchantName}`
                        : t("common.waitingForTask")
                    }
                  >
                    {worker.id.split("-")[1]} {worker.isWorking ? "🔄" : "⏸"}
                  </div>
                ))}
              </div>
            )}

            {/* 最近完成的任务 */}
            {batchScrapingProgress.recentCompletedTasks.length > 0 && (
              <div className="text-xs text-green-600">
                <span className="font-medium">
                  {t("common.recentCompleted")}:{" "}
                </span>
                {batchScrapingProgress.recentCompletedTasks
                  .slice(0, 2)
                  .map((task, index) => (
                    <span key={index} className="mr-2">
                      {task.merchantName} ({Math.round(task.duration / 1000)}s)
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedRowCount > 0 && (
        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <span className="text-sm text-muted-foreground">
            {t("common.selectedCount", { count: selectedRowCount })}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("activate")}
              disabled={isBulkOperating || isBatchScraping}
            >
              {React.createElement(CheckCircle, { className: "mr-2 h-4 w-4" })}
              {t("common.activate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("deactivate")}
              disabled={isBulkOperating || isBatchScraping}
            >
              {React.createElement(XCircle, { className: "mr-2 h-4 w-4" })}
              {t("common.deactivate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchRefreshData}
              disabled={isBulkOperating || isBatchScraping}
              title="使用高效并发抓取器，性能提升5-8倍"
            >
              {isBatchScraping ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("fmtcMerchants.scraping.inProgress")}
                </div>
              ) : (
                <>
                  {React.createElement(Download, { className: "mr-2 h-4 w-4" })}
                  {t("fmtcMerchants.actions.batchRefreshData")}
                  <span className="ml-1 text-xs text-green-600 font-medium">
                    ⚡️
                  </span>
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBatchAction("delete")}
              disabled={isBulkOperating || isBatchScraping}
            >
              {isBulkOperating ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("common.deleting")}
                </div>
              ) : (
                <>
                  {React.createElement(Trash2, { className: "mr-2 h-4 w-4" })}
                  {t("common.delete")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : (flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        ) as React.ReactNode)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        ) as React.ReactNode
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("fmtcMerchants.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <CustomPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalCount}
        pageSize={pageSize}
      />

      {/* 商户详情模态框 */}
      <FMTCMerchantDetailModal
        merchant={selectedMerchant}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMerchant(null);
        }}
        onUpdate={fetchMerchants}
      />

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("fmtcMerchants.bulkActions.confirmDelete", {
                count: selectedRowCount,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("fmtcMerchants.bulkActions.confirmDeleteMessage", {
                count: selectedRowCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkOperating}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkOperating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkOperating ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("common.deleting")}
                </div>
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
