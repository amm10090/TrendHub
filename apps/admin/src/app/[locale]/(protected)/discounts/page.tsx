"use client";

import {
  BarChart3,
  Settings,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Target,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { BrandMatchingPanel } from "@/components/discounts/BrandMatchingPanel";
import { DiscountImportModal } from "@/components/discounts/DiscountImportModal";
import { DiscountSettingsModal } from "@/components/discounts/DiscountSettingsModal";
import { DiscountStats } from "@/components/discounts/DiscountStats";
import { ImportHistoryPanel } from "@/components/discounts/ImportHistoryPanel";
import { NotificationPanel } from "@/components/discounts/NotificationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Interfaces
interface Discount {
  id: string;
  title: string;
  merchantName: string;
  code?: string;
  type: string;
  value?: number;
  isActive: boolean;
  isExpired: boolean;
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  useCount: number;
  source: string;
  rating?: number;
}

interface DiscountStats {
  total: number;
  active: number;
  expired: number;
  inactive: number;
}

interface DiscountResponse {
  success: boolean;
  data: Discount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: DiscountStats;
}

// Mock data (for fallback)
const mockDiscounts: Discount[] = [
  {
    id: "1",
    title: "Nike Sneakers 20% Discount",
    merchantName: "Nike Official Store",
    code: "NIKE20OFF",
    type: "percentage",
    value: 20,
    isActive: true,
    isExpired: false,
    brand: {
      id: "nike-1",
      name: "Nike",
    },
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    useCount: 1234,
    source: "FMTC",
  },
  {
    id: "2",
    title: "Apple iPhone Limited Offer",
    merchantName: "Apple Store",
    code: "APPLE15",
    type: "fixed",
    value: 100,
    isActive: true,
    isExpired: false,
    brand: {
      id: "apple-1",
      name: "Apple",
    },
    startDate: "2024-06-01",
    endDate: "2024-07-31",
    createdAt: "2024-06-01",
    updatedAt: "2024-06-01",
    useCount: 856,
    source: "FMTC",
  },
  {
    id: "3",
    title: "Adidas Store-wide Sale",
    merchantName: "Adidas Official",
    code: "ADIDAS25",
    type: "percentage",
    value: 25,
    isActive: false,
    isExpired: true,
    brand: {
      id: "adidas-1",
      name: "Adidas",
    },
    startDate: "2024-03-01",
    endDate: "2024-05-31",
    createdAt: "2024-03-01",
    updatedAt: "2024-05-31",
    useCount: 432,
    source: "FMTC",
  },
  {
    id: "4",
    title: "Unknown Brand Mystery Discount",
    merchantName: "Unknown Merchant",
    code: "MYSTERY10",
    type: "percentage",
    value: 10,
    isActive: true,
    isExpired: false,
    startDate: "2024-06-15",
    endDate: "2024-08-15",
    createdAt: "2024-06-15",
    updatedAt: "2024-06-15",
    useCount: 23,
    source: "FMTC",
  },
  {
    id: "5",
    title: "Samsung Electronics Special",
    merchantName: "Samsung Electronics",
    code: "SAMSUNG30",
    type: "percentage",
    value: 30,
    isActive: false,
    isExpired: false,
    brand: {
      id: "samsung-1",
      name: "Samsung",
    },
    startDate: "2024-08-01",
    endDate: "2024-09-30",
    createdAt: "2024-07-01",
    updatedAt: "2024-07-01",
    useCount: 0,
    source: "FMTC",
  },
];

export default function DiscountsPage() {
  const t = useTranslations("discounts");

  // Data state
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState<DiscountStats>({
    total: 0,
    active: 0,
    expired: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // Processing states
  const [processingBulk, setProcessingBulk] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // API functions
  const fetchDiscounts = useCallback(
    async (page = 1, filters = {}) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
          ...filters,
        });

        const response = await fetch(`/api/discounts?${params}`);
        const result: DiscountResponse = await response.json();

        if (result.success) {
          setDiscounts(result.data);
          setStats(result.stats);
          setPagination(result.pagination);
          setCurrentPage(page);
        } else {
          // Fallback to mock data
          setDiscounts(mockDiscounts);
          setStats({
            total: mockDiscounts.length,
            active: mockDiscounts.filter((d) => d.isActive && !d.isExpired)
              .length,
            expired: mockDiscounts.filter((d) => d.isExpired).length,
            inactive: mockDiscounts.filter((d) => !d.isActive && !d.isExpired)
              .length,
          });
        }
      } catch {
        // Fallback to mock data on error
        setDiscounts(mockDiscounts);
        setStats({
          total: mockDiscounts.length,
          active: mockDiscounts.filter((d) => d.isActive && !d.isExpired)
            .length,
          expired: mockDiscounts.filter((d) => d.isExpired).length,
          inactive: mockDiscounts.filter((d) => !d.isActive && !d.isExpired)
            .length,
        });
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage],
  );

  // Action handlers
  const handleRefresh = useCallback(() => {
    fetchDiscounts(currentPage, {
      search: searchTerm,
      status: statusFilter !== "all" ? statusFilter : undefined,
      brandId:
        brandFilter !== "all" &&
        brandFilter !== "matched" &&
        brandFilter !== "unmatched"
          ? brandFilter
          : undefined,
    });
  }, [fetchDiscounts, currentPage, searchTerm, statusFilter, brandFilter]);

  const handleExport = useCallback(async () => {
    try {
      setProcessingAction("export");
      const params = new URLSearchParams({
        export: "true",
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : "",
        brandId:
          brandFilter !== "all" &&
          brandFilter !== "matched" &&
          brandFilter !== "unmatched"
            ? brandFilter
            : "",
      });

      const response = await fetch(`/api/discounts?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `discounts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setProcessingAction(null);
    }
  }, [searchTerm, statusFilter, brandFilter]);

  const handleBulkAction = useCallback(
    async (action: "activate" | "deactivate" | "delete") => {
      if (selectedItems.length === 0) return;

      try {
        setProcessingBulk(true);
        const response = await fetch("/api/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedItems,
            action,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSelectedItems([]);
          await fetchDiscounts(currentPage, {
            search: searchTerm,
            status: statusFilter !== "all" ? statusFilter : undefined,
            brandId:
              brandFilter !== "all" &&
              brandFilter !== "matched" &&
              brandFilter !== "unmatched"
                ? brandFilter
                : undefined,
          });
        } else {
          console.error("Bulk action failed:", result.error);
        }
      } catch (error) {
        console.error("Bulk action failed:", error);
      } finally {
        setProcessingBulk(false);
      }
    },
    [
      selectedItems,
      currentPage,
      searchTerm,
      statusFilter,
      brandFilter,
      fetchDiscounts,
    ],
  );

  const handleRowAction = useCallback(
    async (discountId: string, action: string) => {
      setProcessingAction(discountId);

      try {
        switch (action) {
          case "view":
            // Handle view details
            break;
          case "edit":
            // Handle edit
            break;
          case "copy": {
            const discount = discounts.find((d) => d.id === discountId);

            if (discount?.code) {
              await navigator.clipboard.writeText(discount.code);
            }
            break;
          }
          case "visit": {
            const discount = discounts.find((d) => d.id === discountId);
            if (discount) {
              window.open(
                `https://www.google.com/search?q=${discount.merchantName}`,
                "_blank",
              );
            }
            break;
          }
          case "delete": {
            const response = await fetch(`/api/discounts/${discountId}`, {
              method: "DELETE",
            });

            if (response.ok) {
              await fetchDiscounts(currentPage, {
                search: searchTerm,
                status: statusFilter !== "all" ? statusFilter : undefined,
                brandId:
                  brandFilter !== "all" &&
                  brandFilter !== "matched" &&
                  brandFilter !== "unmatched"
                    ? brandFilter
                    : undefined,
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error("Action failed:", error);
      } finally {
        setProcessingAction(null);
      }
    },
    [
      discounts,
      currentPage,
      searchTerm,
      statusFilter,
      brandFilter,
      fetchDiscounts,
    ],
  );

  // Apply filters and fetch data
  useEffect(() => {
    const filters: Record<string, string> = {};

    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== "all") filters.status = statusFilter;
    if (
      brandFilter !== "all" &&
      brandFilter !== "matched" &&
      brandFilter !== "unmatched"
    ) {
      filters.brandId = brandFilter;
    }

    fetchDiscounts(currentPage, filters);
  }, [fetchDiscounts, currentPage, searchTerm, statusFilter, brandFilter]);

  // For client-side filtering if needed (mostly handled by API now)
  const filteredDiscounts = discounts.filter((discount) => {
    if (brandFilter === "matched" && !discount.brand) return false;
    if (brandFilter === "unmatched" && discount.brand) return false;

    return true;
  });

  const getStatusBadge = (discount: Discount) => {
    if (discount.isExpired) {
      return <Badge variant="destructive">{t("status.expired")}</Badge>;
    } else if (discount.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {t("status.active")}
        </Badge>
      );
    } else {
      return <Badge variant="secondary">{t("status.inactive")}</Badge>;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredDiscounts.map((d) => d.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-muted-foreground">{t("page.description")}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            {t("page.settingsButton")}
          </Button>
          <Button onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            {t("page.importButton")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalDiscounts")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.totalDescription")}{" "}
              {stats.total > 0
                ? Math.round((stats.active / stats.total) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.activeDiscounts")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stats.activeDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.expired")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stats.expiredDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.unmatched")}
            </CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {discounts.filter((d) => !d.brand).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stats.unmatchedDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="discounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discounts">{t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
          <TabsTrigger value="brand-matching">
            {t("tabs.brandMatching")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t("tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="imports">{t("tabs.imports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t("table.title")}</CardTitle>
                  <CardDescription>{t("table.description")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    disabled={processingAction === "export"}
                  >
                    <Download
                      className={`w-4 h-4 mr-2 ${processingAction === "export" ? "animate-spin" : ""}`}
                    />
                    {t("table.export")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    {t("table.refresh")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Area */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("filters.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("filters.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("filters.allStatuses")}
                    </SelectItem>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="expired">
                      {t("status.expired")}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {t("status.inactive")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("filters.brand")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("filters.allBrands")}
                    </SelectItem>
                    <SelectItem value="matched">
                      {t("filters.matched")}
                    </SelectItem>
                    <SelectItem value="unmatched">
                      {t("filters.unmatched")}
                    </SelectItem>
                    <SelectItem value="nike">Nike</SelectItem>
                    <SelectItem value="adidas">Adidas</SelectItem>
                    <SelectItem value="apple">Apple</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMoreFiltersOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t("filters.moreFilters")}
                </Button>
              </div>

              {/* Current Filter Display */}
              {(searchTerm ||
                statusFilter !== "all" ||
                brandFilter !== "all") && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("filters.currentFilters")}
                  </span>
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      {t("filters.searchLabel")} {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("filters.statusLabel")}{" "}
                      {statusFilter === "active"
                        ? t("status.active")
                        : statusFilter === "expired"
                          ? t("status.expired")
                          : t("status.inactive")}
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {brandFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("filters.brandLabel")}{" "}
                      {brandFilter === "matched"
                        ? t("filters.matched")
                        : brandFilter === "unmatched"
                          ? t("filters.unmatched")
                          : brandFilter}
                      <button
                        onClick={() => setBrandFilter("all")}
                        className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setBrandFilter("all");
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    {t("filters.clearAll")}
                  </Button>
                </div>
              )}

              {/* Bulk Actions Toolbar */}
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {t("bulkActions.selected")} {selectedItems.length}{" "}
                    {t("bulkActions.items")}
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction("activate")}
                      disabled={processingBulk}
                    >
                      {t("bulkActions.bulkActivate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction("deactivate")}
                      disabled={processingBulk}
                    >
                      {t("bulkActions.bulkDeactivate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction("delete")}
                      disabled={processingBulk}
                    >
                      {t("bulkActions.bulkDelete")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedItems.length === filteredDiscounts.length &&
                            filteredDiscounts.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>{t("table.discountInfo")}</TableHead>
                      <TableHead>{t("table.merchant")}</TableHead>
                      <TableHead>{t("table.discountCode")}</TableHead>
                      <TableHead>{t("table.discountAmount")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.brand")}</TableHead>
                      <TableHead>{t("table.validPeriod")}</TableHead>
                      <TableHead>{t("table.usageCount")}</TableHead>
                      <TableHead className="w-12">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDiscounts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <div>{t("table.noData")}</div>
                          <div className="text-xs mt-2">
                            {t("table.noDataDescription")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDiscounts.map((discount) => (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(discount.id)}
                              onCheckedChange={(checked) =>
                                handleSelectItem(
                                  discount.id,
                                  checked as boolean,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{discount.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {discount.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {discount.merchantName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("table.source")}: {discount.source}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {discount.code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {discount.value
                                ? `${discount.value}${discount.type === "PERCENTAGE" ? "%" : ""}`
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(discount)}</TableCell>
                          <TableCell>
                            {discount.brand ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {discount.brand.name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {t("table.unmatched")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{discount.startDate}</div>
                              <div>
                                {t("table.to")} {discount.endDate}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">
                                {discount.useCount.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t("table.times")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  {t("table.actions")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRowAction(discount.id, "view")
                                  }
                                  disabled={processingAction === discount.id}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.viewDetails")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRowAction(discount.id, "edit")
                                  }
                                  disabled={processingAction === discount.id}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRowAction(discount.id, "copy")
                                  }
                                  disabled={
                                    processingAction === discount.id ||
                                    !discount.code
                                  }
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.copyCode")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRowAction(discount.id, "visit")
                                  }
                                  disabled={processingAction === discount.id}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.visitMerchant")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleRowAction(discount.id, "delete")
                                  }
                                  disabled={processingAction === discount.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t("pagination.showing")}{" "}
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    {t("pagination.of")} {pagination.total}{" "}
                    {t("pagination.results")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      {t("pagination.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      {t("pagination.next")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DiscountStats />
        </TabsContent>

        <TabsContent value="brand-matching" className="space-y-4">
          <BrandMatchingPanel />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationPanel />
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <ImportHistoryPanel />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DiscountImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
      <DiscountSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />

      {/* More Filters Modal */}
      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("filters.moreFilters")}</DialogTitle>
            <DialogDescription>
              {t("filters.moreFiltersDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("filters.dateRange")}</Label>
              <div className="flex gap-2">
                <Input type="date" placeholder={t("filters.startDate")} />
                <Input type="date" placeholder={t("filters.endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.discountType")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    {t("types.percentage")}
                  </SelectItem>
                  <SelectItem value="FIXED_AMOUNT">
                    {t("types.fixedAmount")}
                  </SelectItem>
                  <SelectItem value="FREE_SHIPPING">
                    {t("types.freeShipping")}
                  </SelectItem>
                  <SelectItem value="BUY_X_GET_Y">
                    {t("types.buyXGetY")}
                  </SelectItem>
                  <SelectItem value="OTHER">{t("types.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.minValue")}</Label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>{t("filters.maxValue")}</Label>
              <Input type="number" placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>{t("filters.source")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectSource")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FMTC">FMTC</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="MANUAL">{t("sources.manual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.rating")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectRating")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t("filters.stars")}</SelectItem>
                  <SelectItem value="4">4+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="3">3+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="2">2+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="1">1+ {t("filters.stars")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoreFiltersOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                // Apply advanced filters
                setMoreFiltersOpen(false);
              }}
            >
              {t("actions.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
