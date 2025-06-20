"use client";
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  Settings,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { MonetizationPanel } from "@/components/products/monetization-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";

import { CategoryTable } from "./category-table";
import { ProductsClient } from "./products-client";

// 本地存储工具函数
const STORAGE_KEY = "productTableLimit";
const VIEW_MODE_KEY = "productViewMode";

const saveToLocalStorage = (key: string, value: unknown) => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }
};

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window !== "undefined") {
    try {
      const item = window.localStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
};

// 产品筛选接口
interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  hasCoupon?: boolean;
  status?:
    | "active"
    | "inactive"
    | "all"
    | "inStock"
    | "lowStock"
    | "outOfStock";
}

type ViewMode = "table" | "card";

export default function ProductsPage() {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const router = useRouter();

  // 基础状态
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() =>
    getFromLocalStorage<number>(STORAGE_KEY, 10),
  );
  const [selectedTab, setSelectedTab] = useState("products");
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getFromLocalStorage<ViewMode>(VIEW_MODE_KEY, "table"),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isMonetizationModalOpen, setIsMonetizationModalOpen] = useState(false);

  // 筛选和搜索状态
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
    status: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // 导航状态
  const [navigatingToEdit, setNavigatingToEdit] = useState<string | null>(null);
  const [navigatingToNew, setNavigatingToNew] = useState(false);

  // 选中的产品ID
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // 数据获取hooks
  const {
    products,
    totalPages,
    total: totalItems,
    isLoading,
    error,
    deleteProduct,
    updateProduct,
  } = useProducts({
    page,
    limit,
    ...currentFilters,
  });

  const { brands } = useBrands();
  const { categories } = useCategories({ limit: 999 });

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 限制条数变更处理
  const handleLimitChange = (newLimit: string) => {
    const limitValue = Number(newLimit);

    setLimit(limitValue);
    setPage(1);
    saveToLocalStorage(STORAGE_KEY, limitValue);
  };

  // 视图模式切换
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveToLocalStorage(VIEW_MODE_KEY, mode);
  };

  // 筛选变更处理
  const handleFiltersChange = useCallback(
    (newFilters: ProductFilters) => {
      const filtersChanged =
        JSON.stringify(currentFilters) !== JSON.stringify(newFilters);

      if (filtersChanged) {
        setPage(1);
        setCurrentFilters(newFilters);
      }
    },
    [currentFilters],
  );

  // 搜索处理
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // 防抖处理搜索
    const debounceTimer = setTimeout(() => {
      handleFiltersChange({
        ...currentFilters,
        search: value.trim() || undefined,
      });
    }, 300);

    return () => clearTimeout(debounceTimer);
  };

  // 判断是否应用了筛选
  const areFiltersApplied = (filters: ProductFilters): boolean => {
    return !!(
      filters.search ||
      filters.categoryId ||
      filters.brandId ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.hasDiscount ||
      filters.hasCoupon ||
      (filters.status && filters.status !== "all")
    );
  };

  // 获取激活筛选器数量
  const getActiveFiltersCount = () => {
    let count = 0;

    if (currentFilters.search) count++;
    if (currentFilters.categoryId) count++;
    if (currentFilters.brandId) count++;
    if (currentFilters.minPrice !== undefined) count++;
    if (currentFilters.maxPrice !== undefined) count++;
    if (currentFilters.hasDiscount) count++;
    if (currentFilters.hasCoupon) count++;
    if (currentFilters.status && currentFilters.status !== "all") count++;

    return count;
  };

  // 产品操作处理
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleEdit = (id: string) => {
    setNavigatingToEdit(id);
    router.push(`/products/edit/${id}`);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === "In Stock" ? "Out of Stock" : "In Stock";

      await updateProduct({ id, data: { status: newStatus } });
      toast.success(
        newStatus === "In Stock"
          ? t("statusActiveSuccess")
          : t("statusInactiveSuccess"),
      );
    } catch {
      toast.error(t("operationError"));
    }
  };

  const handleNavigateToNew = () => {
    setNavigatingToNew(true);
    router.push("/products/new");
  };

  // 清空筛选
  const handleClearFilters = () => {
    setCurrentFilters({ status: "all" });
    setSearchQuery("");
  };

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("error.title")}
            </CardTitle>
            <CardDescription>{t("fetchError")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              {tCommon("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProductsClient.PageWrapper>
      {/* 页面头部 */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSelectedTab(
                selectedTab === "products" ? "categories" : "products",
              )
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            {selectedTab === "products"
              ? t("categoryManagement")
              : t("productList")}
          </Button>

          {selectedTab === "products" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonetizationModalOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {t("monetization.title")}
              </Button>
              <Button onClick={handleNavigateToNew} disabled={navigatingToNew}>
                {navigatingToNew ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t("addProduct")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedTab("products")}
          >
            {t("productList")}
            {selectedTab === "products" && (
              <Badge variant="secondary" className="ml-2">
                {products?.length || 0}
              </Badge>
            )}
          </button>
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedTab("categories")}
          >
            {t("categoryManagement")}
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      {selectedTab === "products" ? (
        <div className="space-y-4">
          {/* 左侧：产品列表区域 (占2列) */}
          <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              {/* 搜索和筛选 */}
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t("filters")}
                  {getActiveFiltersCount() > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* 视图切换和设置 */}
              <div className="flex items-center space-x-2">
                {/* 视图模式切换 */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("table")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("card")}
                    className="rounded-l-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* 每页条数 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {t("pagination.rowsPerPage")}:
                  </span>
                  <Select
                    value={limit.toString()}
                    onValueChange={handleLimitChange}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 激活筛选器标签 */}
            {areFiltersApplied(currentFilters) && (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {t("activeFilters")}:
                </span>
                {currentFilters.search && (
                  <Badge variant="secondary" className="gap-1">
                    {t("search")}: {currentFilters.search}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...currentFilters,
                          search: undefined,
                        })
                      }
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {currentFilters.status && currentFilters.status !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {t("status")}: {t(`status.${currentFilters.status}`)}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...currentFilters,
                          status: "all",
                        })
                      }
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 px-2 text-xs"
                >
                  {t("clearAll")}
                </Button>
              </div>
            )}

            {/* 产品列表 */}
            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="text-center space-y-4">
                  <Spinner className="h-8 w-8 mx-auto" />
                  <p className="text-muted-foreground">{t("loading")}</p>
                </div>
              </div>
            ) : (
              <>
                <ProductsClient.ProductTable
                  products={products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    originalPrice: product.originalPrice
                      ? Number(product.originalPrice)
                      : undefined,
                    discount:
                      product.originalPrice &&
                      Number(product.price) < Number(product.originalPrice)
                        ? Math.round(
                            ((Number(product.originalPrice) -
                              Number(product.price)) /
                              Number(product.originalPrice)) *
                              100,
                          )
                        : undefined,
                    image:
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : undefined,
                    sku: product.sku,
                    inventory: product.inventory
                      ? Number(product.inventory)
                      : undefined,
                    isActive:
                      product.status === "In Stock" ||
                      product.status === "Active",
                    hasCoupon: !!product.coupon,
                    couponCode: product.coupon,
                    categoryId: product.category?.id,
                    categoryPath: product.category?.name,
                    brandId: product.brand?.id,
                    brandName: product.brand?.name,
                  }))}
                  categories={categories}
                  brands={brands}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={(id, isActive) =>
                    handleToggleStatus(
                      id,
                      isActive ? "Out of Stock" : "In Stock",
                    )
                  }
                  activeFilters={currentFilters}
                  onFiltersChange={handleFiltersChange}
                  navigatingToEdit={navigatingToEdit}
                  showFilters={showFilters}
                  viewMode={viewMode}
                  selectedIds={selectedProductIds}
                  onSelectedIdsChange={setSelectedProductIds}
                  onBulkDelete={async (ids) => {
                    try {
                      for (const id of ids) {
                        await deleteProduct(id);
                      }
                      toast.success(
                        t("bulkDeleteSuccess", { count: ids.length }),
                      );
                    } catch {
                      toast.error(t("bulkDeleteError"));
                    }
                  }}
                  onBulkToggleStatus={async (ids, setActive) => {
                    try {
                      const newStatus = setActive ? "In Stock" : "Out of Stock";

                      for (const id of ids) {
                        await updateProduct({
                          id,
                          data: { status: newStatus },
                        });
                      }
                      toast.success(
                        setActive
                          ? t("bulkActivateSuccess", { count: ids.length })
                          : t("bulkDeactivateSuccess", { count: ids.length }),
                      );
                    } catch {
                      toast.error(t("bulkUpdateError"));
                    }
                  }}
                />

                {/* 分页 */}
                <CustomPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  pageSize={limit}
                  onPageSizeChange={(newLimit) =>
                    handleLimitChange(String(newLimit))
                  }
                  showPaginationInfo
                  showPageSizeSelector
                />

                {/* 空状态 */}
                {products.length === 0 && !isLoading && (
                  <Card className="text-center py-12">
                    <CardContent>
                      {areFiltersApplied(currentFilters) ? (
                        <div className="space-y-4">
                          <div className="text-6xl">🔍</div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {t("noResultsWithFilters")}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              {t("noResultsWithFiltersDesc")}
                            </p>
                          </div>
                          <Button onClick={handleClearFilters}>
                            {t("resetFiltersLink")}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-6xl">📦</div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {t("noProducts")}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              {t("addProductPrompt")}
                            </p>
                          </div>
                          <Button
                            onClick={handleNavigateToNew}
                            disabled={navigatingToNew}
                          >
                            {navigatingToNew && (
                              <Spinner className="mr-2 h-4 w-4" />
                            )}
                            {t("addProduct")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <CategoryTable />
        </div>
      )}

      <Dialog
        open={isMonetizationModalOpen}
        onOpenChange={setIsMonetizationModalOpen}
      >
        <DialogContent className="p-0 sm:max-w-[750px] border-0">
          <MonetizationPanel
            selectedProductIds={selectedProductIds}
            onRefresh={() => {
              // 刷新产品列表
              window.location.reload(); // 简单的刷新方式，或者您可以调用 refetch 函数
              // 清空选中的产品
              setSelectedProductIds([]);
              setIsMonetizationModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </ProductsClient.PageWrapper>
  );
}
