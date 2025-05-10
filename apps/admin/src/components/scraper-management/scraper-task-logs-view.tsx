"use client";

import { ScraperLogLevel } from "@prisma/client";
import type { PaginationState, Table } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import { XIcon, AlertCircle, InfoIcon, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useMemo } from "react";
import useSWR from "swr";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  executionId: string;
  taskName: string;
  onClose: () => void;
};

type LogEntry = {
  id: string;
  level: ScraperLogLevel;
  message: string;
  timestamp: string;
  context: Record<string, unknown> | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("数据获取失败");
  }

  return res.json();
};

export function ScraperTaskLogsView({ executionId, taskName, onClose }: Props) {
  const t = useTranslations("scraperManagement.executionsTab.logsView");

  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25, // 增加默认每页日志数量
  });

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.append("executionId", executionId);
    params.append("page", String(pagination.pageIndex + 1)); // API使用1-indexed分页
    params.append("limit", String(pagination.pageSize));

    if (filterLevel !== "all") {
      params.append("level", filterLevel);
    }

    return `/api/admin/scraper-tasks/logs?${params.toString()}`;
  }, [executionId, pagination, filterLevel]);

  const { data, error, isLoading } = useSWR<{
    data: LogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(apiUrl, fetcher);

  const getLevelBadge = (level: ScraperLogLevel) => {
    switch (level) {
      case "ERROR":
        return (
          <Badge variant="destructive" className="mr-2 h-6">
            <AlertCircle className="mr-1 h-3 w-3" /> ERROR
          </Badge>
        );
      case "WARN":
        return (
          <Badge variant="secondary" className="mr-2 h-6 bg-amber-500">
            <AlertTriangle className="mr-1 h-3 w-3" /> WARN
          </Badge>
        );
      case "INFO":
        return (
          <Badge variant="secondary" className="mr-2 h-6">
            <InfoIcon className="mr-1 h-3 w-3" /> INFO
          </Badge>
        );
      case "DEBUG":
        return (
          <Badge variant="outline" className="mr-2 h-6">
            DEBUG
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="mr-2 h-6">
            {level}
          </Badge>
        );
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);

    if (!isValid(date)) return t("invalidDate");

    return format(date, "yyyy-MM-dd HH:mm:ss.SSS");
  };

  const formatJsonContext = (context: Record<string, unknown> | null) => {
    if (!context) return null;
    try {
      return JSON.stringify(context, null, 2);
    } catch {
      return JSON.stringify(context);
    }
  };

  if (error && !isErrorDialogOpen) {
    setErrorMessage(error.message || t("fetchErrorGeneric"));
    setIsErrorDialogOpen(true);
  }

  const pageCount = data?.totalPages || 0;
  const totalItems = data?.total || 0;
  const hasLogs = data?.data && data.data.length > 0;

  // 为DataTablePagination创建适配器，作为简化版的table对象
  const paginationTableAdapter = {
    getState: () => ({ pagination }),
    setPageIndex: (idx: number) =>
      setPagination((prev) => ({ ...prev, pageIndex: idx })),
    setPageSize: (size: number) =>
      setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 })),
    getPageCount: () => pageCount,
    getRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getFilteredRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getRowCount: () => totalItems,
    previousPage: () =>
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, prev.pageIndex - 1),
      })),
    nextPage: () =>
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
      })),
    getCanPreviousPage: () => pagination.pageIndex > 0,
    getCanNextPage: () => pagination.pageIndex < pageCount - 1,
  };

  return (
    <>
      <div className="sticky top-16 z-10 bg-background p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h3 className="text-lg font-medium mr-4">
              {taskName && <span>{t("titleSimple", { taskName })}: </span>}
              {t("executionInfo", {
                id: executionId.substring(0, 8),
                status: "Status",
              })}
            </h3>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filterByLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLevels")}</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-8 w-8" />
            <span className="ml-2">{t("loadingLogs")}</span>
          </div>
        ) : !hasLogs ? (
          <div className="text-center py-10 text-muted-foreground">
            {t("noLogsFound")}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.data.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md border ${
                  log.level === "ERROR"
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-950/50"
                    : log.level === "WARN"
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-950/50"
                      : "bg-card border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    {getLevelBadge(log.level)}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm mb-2">
                  {log.message}
                </p>
                {log.context && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="context" className="border-t-0">
                      <AccordionTrigger className="py-2 text-xs">
                        {t("logEntryContext")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="p-2 rounded bg-muted text-xs overflow-x-auto">
                          {formatJsonContext(log.context)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {pageCount > 0 && (
        <div className="border-t p-4">
          <DataTablePagination
            table={paginationTableAdapter as unknown as Table<unknown>}
          />
        </div>
      )}

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("fetchErrorTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage || t("fetchErrorGeneric")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsErrorDialogOpen(false)}
            >
              确定
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ScraperTaskLogsView;
