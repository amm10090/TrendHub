"use client";

import {
  Plus,
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
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DiscountImportModal } from "@/components/discounts/DiscountImportModal";
import { DiscountSettingsModal } from "@/components/discounts/DiscountSettingsModal";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockDiscounts = [
  {
    id: "1",
    title: "Nike Sneakers 20% Discount",
    merchantName: "Nike Official Store",
    code: "NIKE20OFF",
    discount: "20%",
    status: "active",
    brand: "Nike",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdAt: "2024-01-01",
    usageCount: 1234,
    source: "FMTC",
  },
  {
    id: "2",
    title: "Apple iPhone Limited Offer",
    merchantName: "Apple Store",
    code: "APPLE15",
    discount: "$100",
    status: "active",
    brand: "Apple",
    startDate: "2024-06-01",
    endDate: "2024-07-31",
    createdAt: "2024-06-01",
    usageCount: 856,
    source: "FMTC",
  },
  {
    id: "3",
    title: "Adidas Store-wide Sale",
    merchantName: "Adidas Official",
    code: "ADIDAS25",
    discount: "25%",
    status: "expired",
    brand: "Adidas",
    startDate: "2024-03-01",
    endDate: "2024-05-31",
    createdAt: "2024-03-01",
    usageCount: 432,
    source: "FMTC",
  },
  {
    id: "4",
    title: "Unknown Brand Mystery Discount",
    merchantName: "Unknown Merchant",
    code: "MYSTERY10",
    discount: "10%",
    status: "active",
    brand: null,
    startDate: "2024-06-15",
    endDate: "2024-08-15",
    createdAt: "2024-06-15",
    usageCount: 23,
    source: "FMTC",
  },
  {
    id: "5",
    title: "Samsung Electronics Special",
    merchantName: "Samsung Electronics",
    code: "SAMSUNG30",
    discount: "30%",
    status: "inactive",
    brand: "Samsung",
    startDate: "2024-08-01",
    endDate: "2024-09-30",
    createdAt: "2024-07-01",
    usageCount: 0,
    source: "FMTC",
  },
];

export default function DiscountsPage() {
  const router = useRouter();
  const t = useTranslations("discounts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const itemsPerPage = 20;

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Filter data
  const filteredDiscounts = mockDiscounts.filter((discount) => {
    const matchesSearch =
      searchTerm === "" ||
      discount.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || discount.status === statusFilter;

    const matchesBrand =
      brandFilter === "all" ||
      (brandFilter === "matched" && discount.brand) ||
      (brandFilter === "unmatched" && !discount.brand) ||
      discount.brand?.toLowerCase() === brandFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesBrand;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {t("status.active")}
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">{t("status.expired")}</Badge>;
      case "inactive":
        return <Badge variant="secondary">{t("status.inactive")}</Badge>;
      default:
        return <Badge variant="outline">{t("status.unknown")}</Badge>;
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
            <div className="text-2xl font-bold">{mockDiscounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.totalDescription")}{" "}
              {Math.round(
                (mockDiscounts.filter((d) => d.status === "active").length /
                  mockDiscounts.length) *
                  100,
              )}
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
              {mockDiscounts.filter((d) => d.status === "active").length}
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
              {mockDiscounts.filter((d) => d.status === "expired").length}
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
              {mockDiscounts.filter((d) => !d.brand).length}
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
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    {t("table.export")}
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
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

                <Button variant="outline" size="sm">
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
                    <Button size="sm" variant="outline">
                      {t("bulkActions.bulkActivate")}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t("bulkActions.bulkDeactivate")}
                    </Button>
                    <Button size="sm" variant="destructive">
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
                            <Badge variant="outline">{discount.discount}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(discount.status)}
                          </TableCell>
                          <TableCell>
                            {discount.brand ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {discount.brand}
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
                                {discount.usageCount.toLocaleString()}
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
                                <DropdownMenuItem onClick={() => {}}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.viewDetails")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.copyCode")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {t("dropdownActions.visitMerchant")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {}}
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
              {filteredDiscounts.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t("pagination.showing")} 1-
                    {Math.min(itemsPerPage, filteredDiscounts.length)}{" "}
                    {t("pagination.of")} {filteredDiscounts.length}{" "}
                    {t("pagination.results")}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      {t("pagination.previous")}
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      {t("pagination.next")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t("analytics.title")}
              </CardTitle>
              <CardDescription>{t("analytics.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t("analytics.inDevelopment")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand-matching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("brandMatching.title")}</CardTitle>
              <CardDescription>
                {t("brandMatching.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t("brandMatching.inDevelopment")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.title")}</CardTitle>
              <CardDescription>
                {t("notifications.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t("notifications.inDevelopment")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t("imports.title")}</CardTitle>
                  <CardDescription>{t("imports.description")}</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/discounts/import")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("imports.newImport")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t("imports.inDevelopment")}
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
