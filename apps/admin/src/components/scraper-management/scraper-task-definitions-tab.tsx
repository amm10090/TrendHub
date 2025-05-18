"use client";

import type {
  ScraperTaskDefinition,
  ScraperTaskExecution,
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
import { CronExpressionParser } from "cron-parser";
import { formatDistanceToNow, parseISO, isValid, format } from "date-fns";
import {
  PlusCircle,
  Edit,
  Trash2,
  Play,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Hourglass,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useMemo, useState, useEffect } from "react";
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
  DropdownMenuSeparator,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ScraperTaskDefinitionForm } from "./scraper-task-definition-form";

// TODO: Replace with actual import from @repo/types or a shared location for ECommerceSite
const ECommerceSite = {
  Mytheresa: "Mytheresa",
  Italist: "Italist",
  Yoox: "Yoox",
  Farfetch: "Farfetch",
  Cettire: "Cettire",
};

// Helper function to fetch data
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorDetails = await res
      .json()
      .catch(() => ({ message: "An error occurred while fetching the data." }));
    const error = new Error(
      errorDetails.message || "An error occurred while fetching the data.",
    );

    // @ts-expect-error Changed from @ts-ignore
    error.status = res.status; // Attach status code to the error object
    throw error;
  }

  return res.json();
};

interface ScraperTaskDefinitionWithLatestExecution
  extends ScraperTaskDefinition {
  latestExecution?: ScraperTaskExecution | null;
}

const StatusBadge: React.FC<{
  status: ScraperTaskStatus;
  tStatus: ReturnType<typeof useTranslations<string>>;
}> = ({ status, tStatus }) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {tStatus("COMPLETED")}
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          {tStatus("FAILED")}
        </Badge>
      );
    case "RUNNING":
      return (
        <Badge variant="secondary" className="text-blue-500 border-blue-500">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {tStatus("RUNNING")}
        </Badge>
      );
    case "QUEUED":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Hourglass className="mr-1 h-3 w-3" />
          {tStatus("QUEUED")}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline">
          <AlertCircle className="mr-1 h-3 w-3" />
          {tStatus("CANCELLED")}
        </Badge>
      );
    default:
      return <Badge variant="outline">{tStatus("IDLE")}</Badge>; // Or some other default
  }
};

export function ScraperTaskDefinitionsTab() {
  const t = useTranslations("scraperManagement.definitionsTab");
  const tForm = useTranslations("scraperManagement.definitionForm");
  const tStatus = useTranslations("scraperManagement.definitionsTab.status");
  const tFilters = useTranslations("scraperManagement.definitionsTab.filters");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentTaskDefinition, setCurrentTaskDefinition] =
    useState<ScraperTaskDefinition | null>(null);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-indexed for tanstack table
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  // Filters State
  const [filterName, setFilterName] = useState("");
  const [debouncedFilterName, setDebouncedFilterName] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [filterIsEnabled, setFilterIsEnabled] = useState("all"); // "all", "true", "false"

  // Debounce for name filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilterName(filterName);
      setPagination((p) => ({ ...p, pageIndex: 0 })); // Reset to first page on filter change
    }, 500);

    return () => clearTimeout(handler);
  }, [filterName]);

  // Reset to first page when other filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [filterSite, filterIsEnabled]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.append("page", String(pageIndex + 1));
    params.append("limit", String(pageSize));
    if (debouncedFilterName) params.append("name", debouncedFilterName);
    if (filterSite && filterSite !== "all") params.append("site", filterSite);
    if (filterIsEnabled && filterIsEnabled !== "all")
      params.append("status", filterIsEnabled);
    if (sorting.length > 0) {
      params.append("sortBy", sorting[0].id);
      params.append("sortOrder", sorting[0].desc ? "desc" : "asc");
    }

    return `/api/admin/scraper-tasks/definitions?${params.toString()}`;
  }, [
    pageIndex,
    pageSize,
    debouncedFilterName,
    filterSite,
    filterIsEnabled,
    sorting,
  ]);

  const {
    data,
    error,
    isLoading,
    mutate: revalidateDefinitions,
  } = useSWR<{
    data: ScraperTaskDefinitionWithLatestExecution[];
    total: number;
    page: number; // API returns 1-indexed page
    limit: number;
    totalPages: number;
  }>(apiUrl, fetcher, { keepPreviousData: true });

  const handleOpenCreateForm = () => {
    setCurrentTaskDefinition(null);
    setIsSheetOpen(true);
  };

  const handleOpenEditForm = React.useCallback(
    (task: ScraperTaskDefinitionWithLatestExecution) => {
      setCurrentTaskDefinition(task);
      setIsSheetOpen(true);
    },
    [setIsSheetOpen, setCurrentTaskDefinition],
  );

  const handleDelete = React.useCallback(
    async (id: string, name: string) => {
      // TODO: Add confirmation dialog, e.g., using AlertDialog component
      const confirmed = window.confirm(
        t("actions.deleteConfirmMessage", { name }),
      );

      if (!confirmed) return;

      try {
        const res = await fetch(`/api/admin/scraper-tasks/definitions/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));

          throw new Error(errorData.error || t("messages.deleteErrorFallback"));
        }
        toast.success(t("messages.deleteSuccess", { name }));
        revalidateDefinitions();
      } catch (e: unknown) {
        toast.error(
          t("messages.deleteError", {
            name,
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
    [t, revalidateDefinitions],
  );

  const handleRunTask = React.useCallback(
    async (id: string, name: string) => {
      try {
        const res = await fetch(
          `/api/admin/scraper-tasks/definitions/${id}/run`,
          { method: "POST" },
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));

          throw new Error(errorData.error || t("messages.runErrorFallback"));
        }
        const execution = await res.json();

        toast.success(
          t("messages.runSuccess", { name, executionId: execution.id }),
        );
        revalidateDefinitions();
      } catch (e: unknown) {
        toast.error(
          t("messages.runError", {
            name,
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
    [t, revalidateDefinitions],
  );

  const handleViewHistory = React.useCallback(
    (id: string) => {
      toast.info(t("actions.viewHistoryClicked", { id }));
      // TODO: Implement view history logic (e.g., navigate to executions tab with filter)
    },
    [t],
  );

  const resetFilters = () => {
    setFilterName("");
    setFilterSite("all");
    setFilterIsEnabled("all");
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: 10 }); // Reset pagination too
  };

  const columns = useMemo<
    ColumnDef<ScraperTaskDefinitionWithLatestExecution>[]
  >(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.name")}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "targetSite",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.targetSite")}
          </Button>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "isEnabled",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.status")}
          </Button>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("isEnabled") ? "default" : "outline"}
            className={
              row.getValue("isEnabled") ? "bg-sky-500 hover:bg-sky-600" : ""
            }
          >
            {row.getValue("isEnabled")
              ? tStatus("enabled")
              : tStatus("disabled")}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "cronExpression",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.cronExpression")}
          </Button>
        ),
        cell: ({ row }) => row.getValue("cronExpression") || t("notSet"),
        enableSorting: false,
      },
      {
        id: "nextRun",
        header: t("columns.nextRun"),
        cell: ({ row }) => {
          const task = row.original;

          if (!task.isEnabled || !task.cronExpression) {
            return (
              <span className="text-xs text-muted-foreground">
                {tStatus("notScheduled")}
              </span>
            );
          }
          try {
            const interval = CronExpressionParser.parse(task.cronExpression);
            const nextDate = interval.next().toDate();

            return (
              <span className="text-xs">
                {format(nextDate, "yyyy-MM-dd HH:mm:ss")}
              </span>
            );
          } catch {
            return (
              <span className="text-xs text-red-500">
                {tStatus("invalidCron")}
              </span>
            );
          }
        },
        enableSorting: false,
      },
      {
        id: "lastRun",
        header: t("columns.lastRun"),
        cell: ({ row }) => {
          const task = row.original;

          if (!task.latestExecution) {
            return (
              <span className="text-xs text-muted-foreground">
                {tStatus("neverRun")}
              </span>
            );
          }
          const { latestExecution } = task;
          const timeValue =
            latestExecution.completedAt || latestExecution.startedAt;
          let formattedTime =
            latestExecution.status === "RUNNING" ||
            latestExecution.status === "QUEUED"
              ? "-"
              : "N/A";

          if (timeValue) {
            const date =
              typeof timeValue === "string" ? parseISO(timeValue) : timeValue;

            if (isValid(date)) {
              formattedTime = formatDistanceToNow(date, { addSuffix: true });
            } else {
              formattedTime = tStatus("invalidDate");
            }
          }

          const errorMsg =
            latestExecution.status === "FAILED" && latestExecution.errorMessage
              ? latestExecution.errorMessage
              : null;

          return (
            <div className="flex flex-col items-start text-xs">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <StatusBadge
                        status={latestExecution.status}
                        tStatus={tStatus}
                      />
                    </span>
                  </TooltipTrigger>
                  {errorMsg && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs text-destructive font-semibold">
                        {t("tooltips.lastRunError", {
                          errorMessage:
                            errorMsg.substring(0, 100) +
                            (errorMsg.length > 100 ? "..." : ""),
                        })}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span className="text-muted-foreground mt-1">
                {formattedTime}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("columns.actions")}</div>,
        cell: ({ row }) => {
          const task = row.original;

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
                  <DropdownMenuItem onClick={() => handleOpenEditForm(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRunTask(task.id, task.name)}
                    disabled={!task.isEnabled}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t("actions.runNow")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewHistory(task.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("actions.viewHistory")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(task.id, task.name)}
                    className="text-red-600 hover:!text-red-600 focus:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50 focus:!bg-red-50 dark:focus:!bg-red-900/50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      t,
      tStatus,
      handleOpenEditForm,
      handleDelete,
      handleRunTask,
      handleViewHistory,
    ],
  );

  const tableData = useMemo(() => data?.data || [], [data]);
  const pageCount = data?.totalPages ?? -1; // If -1, pagination controls might be disabled by DataTablePagination

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

  // if (process.env.NODE_ENV === "development") {
  // return;
  // }

  if (isLoading && !data) return <div className="p-4">{t("loading")}</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        {t("fetchError", { error: error.message })}
      </div>
    );

  const noDataInTable = !isLoading && !table.getRowModel().rows?.length;

  const sheetComponent = isSheetOpen ? (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent className="w-full max-w-[90%] md:max-w-[80%] lg:max-w-[75%] p-0">
        <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
          <SheetTitle>
            {currentTaskDefinition
              ? tForm("editModalTitle", { name: currentTaskDefinition.name })
              : tForm("createModalTitle")}
          </SheetTitle>
          <SheetDescription>
            {currentTaskDefinition
              ? tForm("editModalDescription")
              : tForm("createModalDescription")}
          </SheetDescription>
        </SheetHeader>
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 100px)" }}
        >
          <ScraperTaskDefinitionForm
            taskDefinition={currentTaskDefinition}
            onOpenChange={setIsSheetOpen}
            onSuccess={() => {
              revalidateDefinitions();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  ) : null;

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative sm:w-auto w-full">
            <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={tFilters("filterByNamePlaceholder")}
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="pl-8 sm:w-64 w-full"
            />
          </div>
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger className="sm:w-[180px] w-full">
              <SelectValue placeholder={tFilters("selectSitePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tFilters("allSites")}</SelectItem>
              {Object.entries(ECommerceSite).map(([key, siteName]) => (
                <SelectItem key={key} value={siteName as string}>
                  {siteName as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterIsEnabled} onValueChange={setFilterIsEnabled}>
            <SelectTrigger className="sm:w-[180px] w-full">
              <SelectValue placeholder={tFilters("selectStatusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tFilters("allStatuses")}</SelectItem>
              <SelectItem value="true">{tStatus("enabled")}</SelectItem>
              <SelectItem value="false">{tStatus("disabled")}</SelectItem>
            </SelectContent>
          </Select>
          {(filterName ||
            filterSite !== "all" ||
            filterIsEnabled !== "all") && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-9 px-2 lg:px-3"
            >
              {tFilters("resetFilters")}
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleOpenCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("addTaskDefinition")}
        </Button>
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
                  {t("loadingNextPage")}
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

      {sheetComponent}
    </div>
  );
}

export default ScraperTaskDefinitionsTab;
