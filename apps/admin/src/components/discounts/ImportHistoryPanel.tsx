"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  RefreshCw,
  Eye,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ImportRecord {
  id: string;
  fileName?: string;
  rawContent: string;
  parsedData: Record<string, unknown>;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
  totalRecords: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors?: string[];
  importType: "PASTE" | "FILE_UPLOAD" | "API";
  processingTime?: number;
  createdAt: string;
  completedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

interface ImportHistoryData {
  data: ImportRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ImportHistoryPanel() {
  const t = useTranslations("discounts.importHistory");
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [pagination, setPagination] = useState<
    ImportHistoryData["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(
    null,
  );

  const fetchImports = useCallback(
    async (page = 1, limit = 20) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/discounts/import?page=${page}&limit=${limit}`,
        );
        const result = await response.json();

        if (result.success) {
          setImports(result.data || []);
          setPagination(result.pagination);
        } else {
          toast.error(t("errors.fetchFailed"));
        }
      } catch {
        toast.error(t("errors.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchImports(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);

    setPageSize(size);
    setCurrentPage(1);

    fetchImports(1, size);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PARTIAL":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "PROCESSING":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">
            {t("status.completed")}
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">{t("status.failed")}</Badge>;
      case "PARTIAL":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {t("status.partial")}
          </Badge>
        );
      case "PROCESSING":
        return <Badge variant="outline">{t("status.processing")}</Badge>;
      default:
        return <Badge variant="outline">{t("status.unknown")}</Badge>;
    }
  };

  const getImportTypeLabel = (type: string) => {
    const labels = {
      PASTE: t("types.paste"),
      FILE_UPLOAD: t("types.fileUpload"),
      API: t("types.api"),
    };

    return labels[type as keyof typeof labels] || type;
  };

  const filteredImports = imports.filter((importRecord) => {
    const matchesSearch =
      !searchTerm ||
      importRecord.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      importRecord.user?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      importRecord.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || importRecord.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const calculateSuccessRate = (record: ImportRecord) => {
    if (record.totalRecords === 0) return 0;

    return Math.round((record.successCount / record.totalRecords) * 100);
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "-";
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = Math.round((end - start) / 1000);

    if (duration < 60) return `${duration}${t("duration.seconds")}`;
    if (duration < 3600)
      return `${Math.round(duration / 60)}${t("duration.minutes")}`;

    return `${Math.round(duration / 3600)}${t("duration.hours")}`;
  };

  useEffect(() => {
    fetchImports(currentPage, pageSize);
  }, [currentPage, pageSize, fetchImports]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("title")}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchImports(currentPage, pageSize)}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    {t("status.completed")}
                  </SelectItem>
                  <SelectItem value="FAILED">{t("status.failed")}</SelectItem>
                  <SelectItem value="PARTIAL">{t("status.partial")}</SelectItem>
                  <SelectItem value="PROCESSING">
                    {t("status.processing")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-32">
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">
                    {t("pagination.perPage", { count: 10 })}
                  </SelectItem>
                  <SelectItem value="20">
                    {t("pagination.perPage", { count: 20 })}
                  </SelectItem>
                  <SelectItem value="50">
                    {t("pagination.perPage", { count: 50 })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistics */}
          {pagination && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{pagination.total}</div>
                <div className="text-muted-foreground">
                  {t("stats.totalImports")}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {imports.filter((i) => i.status === "COMPLETED").length}
                </div>
                <div className="text-muted-foreground">
                  {t("stats.successful")}
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {imports.filter((i) => i.status === "PARTIAL").length}
                </div>
                <div className="text-muted-foreground">
                  {t("stats.partial")}
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {imports.filter((i) => i.status === "FAILED").length}
                </div>
                <div className="text-muted-foreground">{t("stats.failed")}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.importInfo")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.recordStats")}</TableHead>
                  <TableHead>{t("table.successRate")}</TableHead>
                  <TableHead>{t("table.duration")}</TableHead>
                  <TableHead>{t("table.user")}</TableHead>
                  <TableHead>{t("table.createdAt")}</TableHead>
                  <TableHead className="w-32">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <div>{t("empty.noRecords")}</div>
                      <div className="text-xs mt-2">
                        {t("empty.description")}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredImports.map((importRecord) => (
                    <TableRow key={importRecord.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            {importRecord.fileName || t("table.directPaste")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {importRecord.id.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getImportTypeLabel(importRecord.importType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(importRecord.status)}
                          {getStatusBadge(importRecord.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {t("table.total")}: {importRecord.totalRecords}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("table.success")}: {importRecord.successCount} |
                            {t("table.errors")}: {importRecord.errorCount} |
                            {t("table.skipped")}: {importRecord.skippedCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {calculateSuccessRate(importRecord)}%
                          </div>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600"
                              style={{
                                width: `${calculateSuccessRate(importRecord)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(
                          importRecord.createdAt,
                          importRecord.completedAt,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="font-medium">
                              {importRecord.user?.name || t("table.unknown")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {importRecord.user?.email || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {format(
                            new Date(importRecord.createdAt),
                            "MM/dd HH:mm",
                            {
                              locale: zhCN,
                            },
                          )}
                        </div>
                        {importRecord.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            {t("table.completed")}:{" "}
                            {format(
                              new Date(importRecord.completedAt),
                              "HH:mm",
                              {
                                locale: zhCN,
                              },
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedImport(importRecord)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{t("details.title")}</DialogTitle>
                                <DialogDescription>
                                  {t("details.description")}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedImport && (
                                <div className="space-y-6">
                                  {/* Basic Information */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">
                                        {t("details.basicInfo")}
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          {t("details.fileName")}:{" "}
                                          {selectedImport.fileName ||
                                            t("table.directPaste")}
                                        </div>
                                        <div>
                                          {t("details.importType")}:{" "}
                                          {getImportTypeLabel(
                                            selectedImport.importType,
                                          )}
                                        </div>
                                        <div>
                                          {t("details.status")}:{" "}
                                          {getStatusBadge(
                                            selectedImport.status,
                                          )}
                                        </div>
                                        <div>
                                          {t("details.createdAt")}:{" "}
                                          {format(
                                            new Date(selectedImport.createdAt),
                                            "yyyy/MM/dd HH:mm:ss",
                                          )}
                                        </div>
                                        {selectedImport.completedAt && (
                                          <div>
                                            {t("details.completedAt")}:{" "}
                                            {format(
                                              new Date(
                                                selectedImport.completedAt,
                                              ),
                                              "yyyy/MM/dd HH:mm:ss",
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">
                                        {t("details.statistics")}
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          {t("details.totalRecords")}:{" "}
                                          {selectedImport.totalRecords}
                                        </div>
                                        <div>
                                          {t("details.successCount")}:{" "}
                                          {selectedImport.successCount}
                                        </div>
                                        <div>
                                          {t("details.errorCount")}:{" "}
                                          {selectedImport.errorCount}
                                        </div>
                                        <div>
                                          {t("details.skippedCount")}:{" "}
                                          {selectedImport.skippedCount}
                                        </div>
                                        <div>
                                          {t("details.successRate")}:{" "}
                                          {calculateSuccessRate(selectedImport)}
                                          %
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Error Information */}
                                  {selectedImport.errors &&
                                    selectedImport.errors.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">
                                          {t("details.errorLog")}
                                        </h4>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                                          <div className="space-y-1 text-sm">
                                            {selectedImport.errors.map(
                                              (error, index) => (
                                                <div
                                                  key={index}
                                                  className="text-red-700"
                                                >
                                                  {error}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  {/* Data Preview */}
                                  <div>
                                    <h4 className="font-medium mb-2">
                                      {t("details.dataPreview")}
                                    </h4>
                                    <div className="bg-muted/50 border rounded-lg p-3 max-h-64 overflow-y-auto">
                                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                        {JSON.stringify(
                                          selectedImport.parsedData,
                                          null,
                                          2,
                                        ).substring(0, 1000)}
                                        {JSON.stringify(
                                          selectedImport.parsedData,
                                        ).length > 1000 && "..."}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4">
              <div className="text-sm text-muted-foreground">
                {t("pagination.showing", {
                  start: (pagination.page - 1) * pagination.limit + 1,
                  end: Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  ),
                  total: pagination.total,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  {t("pagination.previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === pagination.page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
