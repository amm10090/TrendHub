"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
} from "lucide-react";
import { useTranslations } from "next-intl";
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

  const pageSize = 20;

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

  // 单个商户操作
  const handleMerchantAction = useCallback(
    async (merchantId: string, action: string, data?: unknown) => {
      try {
        const response = await fetch(`/api/fmtc-merchants/${merchantId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data }),
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            fetchMerchants();
          }
        }
      } catch (error) {
        logger.error("商户操作失败:", error);
      }
    },
    [fetchMerchants],
  );

  // 查看商户详情
  const handleViewDetails = useCallback((merchant: FMTCMerchant) => {
    setSelectedMerchant(merchant);
    setIsDetailModalOpen(true);
  }, []);

  // 格式化日期
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

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
                >
                  {React.createElement(RefreshCw, {
                    className: "mr-2 h-4 w-4",
                  })}
                  {t("fmtcMerchants.actions.refreshData")}
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
    ],
  );

  // 创建表格实例
  const table = useReactTable({
    data: merchants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id, // 使用实际的商户ID作为行键
    state: {
      sorting,
      rowSelection,
    },
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
  ]);

  // 获取数据
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants, refreshTrigger]);

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
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
              disabled={isBulkOperating}
            >
              {React.createElement(CheckCircle, { className: "mr-2 h-4 w-4" })}
              {t("common.activate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("deactivate")}
              disabled={isBulkOperating}
            >
              {React.createElement(XCircle, { className: "mr-2 h-4 w-4" })}
              {t("common.deactivate")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBatchAction("delete")}
              disabled={isBulkOperating}
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
