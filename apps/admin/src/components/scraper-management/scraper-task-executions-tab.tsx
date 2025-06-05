"use client";

import type {
  ScraperTaskExecution,
  ScraperTaskDefinition,
  ScraperTaskStatus,
} from "@prisma/client";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { parseISO, isValid, format } from "date-fns";
import {
  Eye,
  MoreHorizontal,
  SearchIcon,
  XIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Hourglass,
  StopCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { ScraperTaskLogsView } from "./scraper-task-logs-view";

// 爬虫支持的站点列表
const ECommerceSite = {
  Mytheresa: "Mytheresa",
  Italist: "Italist",
  Yoox: "Yoox",
  Farfetch: "Farfetch",
  Cettire: "Cettire",
};

// HTTP 请求工具
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorDetails = await res
      .json()
      .catch(() => ({ message: "获取数据时发生错误。" }));
    const error = new Error(errorDetails.message || "获取数据时发生错误。");

    // @ts-expect-error 添加状态码到错误对象
    error.status = res.status;
    throw error;
  }

  return res.json();
};

// 类型定义：带有关联任务定义的执行记录
interface ScraperTaskExecutionWithDefinition extends ScraperTaskExecution {
  taskDefinition: ScraperTaskDefinition;
}

// 状态徽章组件
const StatusBadge: React.FC<{
  status: ScraperTaskStatus;
  tStatus: ReturnType<typeof useTranslations<string>>;
}> = ({ status, tStatus }) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {tStatus(status)}
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          {tStatus(status)}
        </Badge>
      );
    case "RUNNING":
      return (
        <Badge variant="secondary" className="text-blue-500 border-blue-500">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {tStatus(status)}
        </Badge>
      );
    case "QUEUED":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Hourglass className="mr-1 h-3 w-3" />
          {tStatus(status)}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="text-gray-500">
          <StopCircle className="mr-1 h-3 w-3" />
          {tStatus(status)}
        </Badge>
      );
    default:
      return <Badge variant="outline">{tStatus("IDLE")}</Badge>;
  }
};

export function ScraperTaskExecutionsTab() {
  const t = useTranslations("scraperManagement.executionsTab");
  const tStatus = useTranslations("scraperManagement.definitionsTab.status");

  // 状态管理
  const [isLogsSheetOpen, setIsLogsSheetOpen] = useState(false);
  const [currentExecution, setCurrentExecution] =
    useState<ScraperTaskExecutionWithDefinition | null>(null);

  // 分页状态
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // 排序状态
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }, // 默认按创建时间降序排列
  ]);

  // 筛选状态
  const [filterTaskName, setFilterTaskName] = useState("");
  const [debouncedFilterTaskName, setDebouncedFilterTaskName] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // 任务名称筛选的防抖处理
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilterTaskName(filterTaskName);
      setPagination((p) => ({ ...p, pageIndex: 0 })); // 重置到第一页
    }, 500);

    return () => clearTimeout(handler);
  }, [filterTaskName]);

  // 当其他筛选条件变化时，重置到第一页
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [filterSite, filterStatus]);

  // 组装 API URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.append("page", String(pageIndex + 1)); // API 使用 1-indexed 分页
    params.append("limit", String(pageSize));

    if (debouncedFilterTaskName)
      params.append("taskName", debouncedFilterTaskName);
    if (filterSite && filterSite !== "all") params.append("site", filterSite);
    if (filterStatus && filterStatus !== "all")
      params.append("status", filterStatus);

    if (sorting.length > 0) {
      params.append("sortBy", sorting[0].id);
      params.append("sortOrder", sorting[0].desc ? "desc" : "asc");
    }

    return `/api/admin/scraper-tasks/executions?${params.toString()}`;
  }, [
    pageIndex,
    pageSize,
    debouncedFilterTaskName,
    filterSite,
    filterStatus,
    sorting,
  ]);

  // 获取数据
  const {
    data,
    error,
    isLoading,
    mutate: revalidateExecutions,
  } = useSWR<{
    data: ScraperTaskExecutionWithDefinition[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(apiUrl, fetcher, { keepPreviousData: true });

  // 操作：查看日志
  const handleViewLogs = (execution: ScraperTaskExecutionWithDefinition) => {
    setCurrentExecution(execution);
    setIsLogsSheetOpen(true);
  };

  // 操作：取消任务（如果 API 已实现）
  const handleCancelTask = useCallback(
    async (id: string, taskName: string) => {
      // 确认取消
      const confirmed = window.confirm(
        t("actions.cancelConfirmMessage", { taskName }),
      );

      if (!confirmed) return;

      try {
        const res = await fetch(
          `/api/admin/scraper-tasks/executions/${id}/cancel`,
          { method: "POST" },
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));

          throw new Error(errorData.error || t("messages.cancelErrorFallback"));
        }

        toast.success(t("messages.cancelSuccess", { taskName }));
        revalidateExecutions();
      } catch (e: unknown) {
        toast.error(
          t("messages.cancelError", {
            taskName,
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
    [t, revalidateExecutions],
  );

  // 重置所有筛选条件
  const resetFilters = () => {
    setFilterTaskName("");
    setFilterSite("all");
    setFilterStatus("all");
    setSorting([{ id: "createdAt", desc: true }]); // 重置为默认排序
    setPagination({ pageIndex: 0, pageSize: 10 }); // 重置分页
  };

  // 定义表格列
  const columns = useMemo<ColumnDef<ScraperTaskExecutionWithDefinition>[]>(
    () => [
      {
        id: "taskName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.taskName")}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.taskDefinition.name}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "taskDefinition.targetSite",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.targetSite")}
          </Button>
        ),
        cell: ({ row }) => row.original.taskDefinition.targetSite,
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.status")}
          </Button>
        ),
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status")} tStatus={tStatus} />
        ),
        enableSorting: true,
      },
      {
        accessorKey: "triggerType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.triggerType")}
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t(`triggerTypes.${row.getValue("triggerType")}`)}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "startedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.startedAt")}
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.getValue("startedAt");

          if (!value) return <span className="text-muted-foreground">-</span>;

          const date =
            typeof value === "string" ? parseISO(value) : (value as Date);

          return isValid(date)
            ? format(date, "yyyy-MM-dd HH:mm:ss")
            : t("invalidDate");
        },
        enableSorting: true,
      },
      {
        accessorKey: "completedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.completedAt")}
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.getValue("completedAt");

          if (!value) return <span className="text-muted-foreground">-</span>;

          const date =
            typeof value === "string" ? parseISO(value) : (value as Date);

          return isValid(date)
            ? format(date, "yyyy-MM-dd HH:mm:ss")
            : t("invalidDate");
        },
        enableSorting: true,
      },
      {
        id: "duration",
        header: t("columns.duration"),
        cell: ({ row }) => {
          const execution = row.original;
          const startedAt = execution.startedAt;
          const completedAt = execution.completedAt;

          if (!startedAt)
            return <span className="text-muted-foreground">-</span>;

          const start =
            typeof startedAt === "string" ? parseISO(startedAt) : startedAt;

          if (!isValid(start))
            return <span className="text-muted-foreground">-</span>;

          if (!completedAt) {
            if (execution.status === "RUNNING") {
              // 对于正在运行的任务，显示"运行中..."
              return (
                <span className="text-blue-500">
                  {t("statusMessages.running")}
                </span>
              );
            }
            if (execution.status === "QUEUED") {
              // 对于队列中的任务，显示"队列中..."
              return (
                <span className="text-yellow-500">
                  {t("statusMessages.queued")}
                </span>
              );
            }

            return <span className="text-muted-foreground">-</span>;
          }

          const end =
            typeof completedAt === "string"
              ? parseISO(completedAt)
              : completedAt;

          if (!isValid(end))
            return <span className="text-muted-foreground">-</span>;

          const durationMs = end.getTime() - start.getTime();
          const seconds = Math.floor(durationMs / 1000);

          if (seconds < 60) {
            return `${seconds}s`;
          }

          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;

          if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
          }

          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;

          return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
        },
        enableSorting: false,
      },
      {
        id: "metrics",
        header: t("columns.metrics"),
        cell: ({ row }) => {
          const metrics = row.original.metrics as Record<string, number> | null;

          if (!metrics) return <span className="text-muted-foreground">-</span>;

          const productsFound = metrics.productsFoundByScraper || 0;
          const productsSaved = metrics.productsSuccessfullySaved || 0;
          // const requestsMade = metrics.requestsMade || 0; // 后端当前未直接提供此指标的明确键名

          return (
            <div className="text-xs">
              <div>
                {t("metrics.productsFound")}: {productsFound}
              </div>
              <div>
                {t("metrics.productsSaved")}: {productsSaved}
              </div>
              {/* <div>{t('metrics.requestsMade')}: {requestsMade}</div> */}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("columns.actions")}</div>,
        cell: ({ row }) => {
          const execution = row.original;
          const isRunningOrQueued =
            execution.status === "RUNNING" || execution.status === "QUEUED";

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">{t("actions.openMenu")}</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("actions.title")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleViewLogs(execution)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("actions.viewLogs")}
                  </DropdownMenuItem>
                  {isRunningOrQueued && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleCancelTask(
                          execution.id,
                          execution.taskDefinition.name,
                        )
                      }
                      className="text-red-600 hover:!text-red-600 focus:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50 focus:!bg-red-50 dark:focus:!bg-red-900/50"
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      {t("actions.cancel")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, tStatus, handleCancelTask],
  );

  // 表格数据
  const tableData = useMemo(() => data?.data || [], [data]);
  const pageCount = data?.totalPages ?? -1;

  // 创建表格实例
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  if (isLoading && !data) return <div className="p-4">{t("loading")}</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        {t("fetchError", { error: error.message })}
      </div>
    );

  const noDataInTable = !isLoading && !table.getRowModel().rows?.length;

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative sm:w-auto w-full">
            <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("filters.filterByTaskNamePlaceholder")}
              value={filterTaskName}
              onChange={(e) => setFilterTaskName(e.target.value)}
              className="pl-8 sm:w-64 w-full"
            />
          </div>
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger className="sm:w-[180px] w-full">
              <SelectValue placeholder={t("filters.selectSitePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allSites")}</SelectItem>
              {Object.entries(ECommerceSite).map(([key, siteName]) => (
                <SelectItem key={key} value={siteName as string}>
                  {siteName as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-[180px] w-full">
              <SelectValue placeholder={t("filters.selectStatusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="COMPLETED">{tStatus("COMPLETED")}</SelectItem>
              <SelectItem value="FAILED">{tStatus("FAILED")}</SelectItem>
              <SelectItem value="RUNNING">{tStatus("RUNNING")}</SelectItem>
              <SelectItem value="QUEUED">{tStatus("QUEUED")}</SelectItem>
              <SelectItem value="CANCELLED">{tStatus("CANCELLED")}</SelectItem>
            </SelectContent>
          </Select>
          {(filterTaskName ||
            filterSite !== "all" ||
            filterStatus !== "all") && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-9 px-2 lg:px-3"
            >
              {t("filters.resetFilters")}
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("loadingData")}
                </TableCell>
              </TableRow>
            ) : noDataInTable ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("noData")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 0 && <DataTablePagination table={table} />}

      {/* 日志查看抽屉 - 将在实现 ScraperTaskLogsView 组件后启用 */}
      <Sheet open={isLogsSheetOpen} onOpenChange={setIsLogsSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
            <SheetTitle>
              {t("logsView.title", {
                taskName: currentExecution?.taskDefinition.name || "",
                executionId: currentExecution?.id.substring(0, 8) || "",
              })}
            </SheetTitle>
            <SheetDescription>{t("logsView.description")}</SheetDescription>
          </SheetHeader>
          <div className="h-full flex flex-col">
            {currentExecution ? (
              <ScraperTaskLogsView
                executionId={currentExecution.id}
                taskName={currentExecution.taskDefinition.name}
                onClose={() => setIsLogsSheetOpen(false)}
              />
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                {t("loading")}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default ScraperTaskExecutionsTab;
