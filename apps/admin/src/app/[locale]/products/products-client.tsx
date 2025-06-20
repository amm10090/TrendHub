"use client";

import {
  Pencil,
  EyeOff,
  Eye,
  Trash2,
  Loader2,
  MoreHorizontal,
  Package,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ReactNode, useState, useEffect, useMemo } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import { Card, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

function NavbarWrapper() {
  return <CustomNavbar />;
}

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarWrapper />
      <div className="flex-1 space-y-6 p-6">{children}</div>
    </div>
  );
}

interface AddButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
}

function AddButton({ onClick, isLoading }: AddButtonProps) {
  const t = useTranslations("products");

  return (
    <Button onClick={onClick} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t("addProduct")}
    </Button>
  );
}

function AddCategoryButton() {
  const t = useTranslations("products");

  return <Button>{t("category")}</Button>;
}

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

interface Category {
  id: string;
  name: string;
  level: number;
  parentId?: string;
}

interface SimplifiedCategory {
  id: string;
  name: string;
  level: number;
  parentId?: string;
}

// 产品数据接口
interface ProductData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  sku?: string;
  inventory?: number;
  isActive?: boolean;
  hasCoupon?: boolean;
  couponCode?: string;
  couponValue?: number;
  categoryId?: string;
  categoryPath?: string;
  brandId?: string;
  brandName?: string;
  brandLogo?: string;
}

// 优化的产品卡片组件
interface ProductCardProps {
  product: ProductData;
  categories?: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  isSelected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
  isNavigatingToEdit?: boolean;
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  isSelected,
  onSelectChange,
  isNavigatingToEdit,
}: ProductCardProps) {
  const t = useTranslations("products");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => onEdit(product.id);
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(product.id);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleToggleStatus = () =>
    onToggleStatus(product.id, !!product.isActive);
  const handleSelect = (checked: boolean) =>
    onSelectChange?.(product.id, checked);

  return (
    <Card
      className={`group transition-all duration-200 hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4">
        {/* 卡片头部 - 选择框和操作菜单 */}
        <div className="flex items-start justify-between mb-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            className="mt-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleEdit}
                disabled={isNavigatingToEdit}
              >
                {isNavigatingToEdit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                {product.isActive ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {product.isActive ? t("deactivate") : t("activate")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 产品图片 */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Package className="h-12 w-12" />
            </div>
          )}

          {/* 状态标签 */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.isActive && (
              <Badge variant="secondary" className="text-xs">
                {t("status.inactive")}
              </Badge>
            )}
            {product.hasCoupon && (
              <Badge variant="outline" className="text-xs bg-background/80">
                <Tag className="h-3 w-3 mr-1" />
                {t("hasCoupon")}
              </Badge>
            )}
          </div>
        </div>

        {/* 产品信息 */}
        <div className="space-y-2">
          <h3
            className="font-medium text-sm leading-tight line-clamp-2"
            title={product.name}
          >
            {product.name}
          </h3>

          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}

          {/* 价格信息 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                {product.discount && (
                  <Badge variant="destructive" className="text-xs px-1">
                    -{product.discount}%
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* 品牌和库存 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{product.brandName || t("noBrand")}</span>
            <span
              className={`px-2 py-1 rounded-full ${
                (product.inventory || 0) > 10
                  ? "bg-green-100 text-green-700"
                  : (product.inventory || 0) > 0
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {product.inventory || 0} {t("units")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 优化的筛选面板组件
interface EnhancedFilterProps {
  activeFilters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories?: Category[];
  brands?: { id: string; name: string }[];
  isOpen: boolean;
}

function EnhancedFilter({
  activeFilters,
  onFiltersChange,
  categories,
  brands,
  isOpen,
}: EnhancedFilterProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [localMinPrice, setLocalMinPrice] = useState(
    activeFilters.minPrice?.toString() || "",
  );
  const [localMaxPrice, setLocalMaxPrice] = useState(
    activeFilters.maxPrice?.toString() || "",
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // 防抖价格更新
  useEffect(() => {
    const timer = setTimeout(() => {
      const minPrice = localMinPrice ? Number(localMinPrice) : undefined;
      const maxPrice = localMaxPrice ? Number(localMaxPrice) : undefined;

      if (
        minPrice !== activeFilters.minPrice ||
        maxPrice !== activeFilters.maxPrice
      ) {
        onFiltersChange({
          ...activeFilters,
          minPrice,
          maxPrice,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice, activeFilters, onFiltersChange]);

  if (!isOpen) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 基础筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("statusLabel")}</Label>
              <Select
                value={activeFilters.status || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...activeFilters,
                    status: value as ProductFilters["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="inStock">{t("status.inStock")}</SelectItem>
                  <SelectItem value="lowStock">
                    {t("status.lowStock")}
                  </SelectItem>
                  <SelectItem value="outOfStock">
                    {t("status.outOfStock")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 品牌筛选 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("brand")}</Label>
              <Select
                value={activeFilters.brandId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...activeFilters,
                    brandId: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分类筛选 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("category")}</Label>
              <Select
                value={activeFilters.categoryId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...activeFilters,
                    categoryId: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 高级筛选 */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                {t("advancedFilters")}
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* 价格范围 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("priceRange")}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder={t("minPrice")}
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    className="w-full"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder={t("maxPrice")}
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* 特殊属性 */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDiscount"
                    checked={!!activeFilters.hasDiscount}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...activeFilters,
                        hasDiscount: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="hasDiscount" className="text-sm">
                    {t("hasDiscount")}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCoupon"
                    checked={!!activeFilters.hasCoupon}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...activeFilters,
                        hasCoupon: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="hasCoupon" className="text-sm">
                    {t("hasCoupon")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}

// 批量操作工具栏组件
interface BulkActionToolbarProps {
  selectedIds: string[];
  onBulkDelete: (ids: string[]) => void;
  onBulkToggleStatus: (ids: string[], setActive: boolean) => void;
  onClearSelection: () => void;
}

function BulkActionToolbar({
  selectedIds,
  onBulkDelete,
  onBulkToggleStatus,
  onClearSelection,
}: BulkActionToolbarProps) {
  const t = useTranslations("products");
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <Card className="border-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={true} disabled />
              <span className="text-sm font-medium">
                {t("selectedItems", { count })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              {t("clearSelection")}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkToggleStatus(selectedIds, true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("activate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkToggleStatus(selectedIds, false)}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              {t("deactivate")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete(selectedIds)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 主产品表格组件接口
interface ProductTableProps {
  products: ProductData[];
  categories?: Category[];
  brands?: { id: string; name: string }[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  activeFilters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkToggleStatus?: (ids: string[], setActive: boolean) => void;
  isLoading?: boolean;
  navigatingToEdit?: string | null;
  showFilters?: boolean;
  viewMode?: "table" | "card";
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
}

// 简化的表格行组件（用于表格视图）
function SimpleProductRow({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  isSelected,
  onSelectChange,
  isNavigatingToEdit,
}: ProductCardProps) {
  const t = useTranslations("products");

  return (
    <tr className={`hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}>
      <td className="p-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelectChange?.(product.id, checked as boolean)
            }
          />
          <div className="w-10 h-10 relative rounded overflow-hidden bg-muted">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{product.name}</p>
            {product.sku && (
              <p className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className="text-sm">{product.brandName || t("noBrand")}</span>
      </td>
      <td className="p-3">
        <div className="text-sm">
          <div className="font-medium">${product.price.toFixed(2)}</div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-xs text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </div>
          )}
        </div>
      </td>
      <td className="p-3">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            (product.inventory || 0) > 10
              ? "bg-green-100 text-green-700"
              : (product.inventory || 0) > 0
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {product.inventory || 0}
        </span>
      </td>
      <td className="p-3">
        <div className="flex items-center space-x-2">
          <Badge variant={product.isActive ? "default" : "secondary"}>
            {product.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
          {product.hasCoupon && (
            <Badge variant="outline">
              <Tag className="h-3 w-3 mr-1" />
            </Badge>
          )}
        </div>
      </td>
      <td className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(product.id)}
              disabled={isNavigatingToEdit}
            >
              {isNavigatingToEdit ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleStatus(product.id, !!product.isActive)}
            >
              {product.isActive ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {product.isActive ? t("deactivate") : t("activate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(product.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// 主产品表格组件
function ProductTable({
  products,
  categories,
  brands,
  onEdit,
  onDelete,
  onToggleStatus,
  activeFilters,
  onFiltersChange,
  onBulkDelete,
  onBulkToggleStatus,
  isLoading,
  navigatingToEdit,
  showFilters = false,
  viewMode = "table",
  selectedIds: externalSelectedIds,
  onSelectedIdsChange,
}: ProductTableProps) {
  const t = useTranslations("products");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  // 使用外部或内部的 selectedIds
  const selectedIds =
    externalSelectedIds !== undefined
      ? externalSelectedIds
      : internalSelectedIds;
  const setSelectedIds = (ids: string[]) => {
    if (onSelectedIdsChange) {
      onSelectedIdsChange(ids);
    } else {
      setInternalSelectedIds(ids);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map((p) => p.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(
      checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id),
    );
  };

  const handleBulkDelete = (ids: string[]) => {
    onBulkDelete?.(ids);
    setSelectedIds([]);
  };

  const handleBulkToggleStatus = (ids: string[], setActive: boolean) => {
    onBulkToggleStatus?.(ids, setActive);
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选面板 */}
      <EnhancedFilter
        activeFilters={activeFilters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        brands={brands}
        isOpen={showFilters}
      />

      {/* 批量操作工具栏 */}
      {onBulkDelete && onBulkToggleStatus && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          onBulkDelete={handleBulkDelete}
          onBulkToggleStatus={handleBulkToggleStatus}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* 产品列表 */}
      {viewMode === "card" ? (
        // 卡片视图
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              isSelected={selectedIds.includes(product.id)}
              onSelectChange={handleSelectOne}
              isNavigatingToEdit={navigatingToEdit === product.id}
            />
          ))}
        </div>
      ) : (
        // 表格视图
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={
                          selectedIds.length === products.length &&
                          products.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        {t("product")}
                      </span>
                    </div>
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    {t("brand")}
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    {t("price")}
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    {t("inventory")}
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    {t("statusLabel")}
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <SimpleProductRow
                    key={product.id}
                    product={product}
                    categories={categories}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    isSelected={selectedIds.includes(product.id)}
                    onSelectChange={handleSelectOne}
                    isNavigatingToEdit={navigatingToEdit === product.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// CascadeCategorySelector 组件保持不变，但优化样式
function CascadeCategorySelector({
  categories,
  onCategoryChange,
  value,
  isLoading,
}: {
  categories: SimplifiedCategory[];
  onCategoryChange: (categoryId: string) => void;
  value?: string | null;
  isLoading?: boolean;
}) {
  const t = useTranslations("product.edit.organization");

  const [level1Value, setLevel1Value] = useState<string | null>(null);
  const [level2Value, setLevel2Value] = useState<string | null>(null);
  const [level3Value, setLevel3Value] = useState<string | null>(null);
  const [displayFullPathString, setDisplayFullPathString] =
    useState<string>("");

  // 生成三级分类
  const level1Categories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const level2Categories = useMemo(() => {
    if (!level1Value) return [];

    return categories.filter((c) => c.parentId === level1Value);
  }, [categories, level1Value]);

  const level3Categories = useMemo(() => {
    if (!level2Value) return [];

    return categories.filter((c) => c.parentId === level2Value);
  }, [categories, level2Value]);

  // 初始化分类值并生成完整路径字符串
  useEffect(() => {
    if (!value || categories.length === 0) {
      setLevel1Value(null);
      setLevel2Value(null);
      setLevel3Value(null);
      setDisplayFullPathString("");

      return;
    }

    // 查找选中的分类
    const selectedCategory = categories.find((c) => c.id === value);

    if (!selectedCategory) {
      setLevel1Value(null);
      setLevel2Value(null);
      setLevel3Value(null);
      setDisplayFullPathString("");

      return;
    }

    // 处理分类层级
    if (selectedCategory.level === 1 || !selectedCategory.parentId) {
      setLevel1Value(selectedCategory.id);
      setLevel2Value(null);
      setLevel3Value(null);
      setDisplayFullPathString(selectedCategory.name);
    } else if (
      selectedCategory.level === 2 ||
      (selectedCategory.parentId &&
        categories.find((c) => c.id === selectedCategory.parentId)?.level === 1)
    ) {
      const parentCategory = categories.find(
        (c) => c.id === selectedCategory.parentId,
      );

      if (!parentCategory) {
        setLevel1Value(selectedCategory.id);
        setLevel2Value(null);
        setLevel3Value(null);
        setDisplayFullPathString(selectedCategory.name);
      } else {
        setLevel1Value(parentCategory.id);
        setLevel2Value(selectedCategory.id);
        setLevel3Value(null);
        setDisplayFullPathString(
          `${parentCategory.name} > ${selectedCategory.name}`,
        );
      }
    } else {
      const parentCategory = categories.find(
        (c) => c.id === selectedCategory.parentId,
      );

      if (!parentCategory) {
        setLevel1Value(selectedCategory.id);
        setLevel2Value(null);
        setLevel3Value(null);
        setDisplayFullPathString(selectedCategory.name);

        return;
      }

      const grandparentCategory = categories.find(
        (c) => c.id === parentCategory.parentId,
      );

      if (!grandparentCategory) {
        setLevel1Value(parentCategory.id);
        setLevel2Value(selectedCategory.id);
        setLevel3Value(null);
        setDisplayFullPathString(
          `${parentCategory.name} > ${selectedCategory.name}`,
        );
      } else {
        setLevel1Value(grandparentCategory.id);
        setLevel2Value(parentCategory.id);
        setLevel3Value(selectedCategory.id);
        setDisplayFullPathString(
          `${grandparentCategory.name} > ${parentCategory.name} > ${selectedCategory.name}`,
        );
      }
    }
  }, [value, categories]);

  const handleLevel1Change = (newValue: string) => {
    if (!newValue) {
      setLevel1Value(null);
      setLevel2Value(null);
      setLevel3Value(null);
      onCategoryChange("");

      return;
    }

    setLevel1Value(newValue);
    setLevel2Value(null);
    setLevel3Value(null);
    onCategoryChange(newValue);
  };

  const handleLevel2Change = (newValue: string) => {
    if (!newValue) {
      setLevel2Value(null);
      setLevel3Value(null);
      if (level1Value) onCategoryChange(level1Value);

      return;
    }

    setLevel2Value(newValue);
    setLevel3Value(null);
    onCategoryChange(newValue);
  };

  const handleLevel3Change = (newValue: string) => {
    if (!newValue) {
      setLevel3Value(null);
      if (level2Value) onCategoryChange(level2Value);

      return;
    }

    setLevel3Value(newValue);
    onCategoryChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">
          {t("category")} <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          {t("categoryDescription")}
        </p>
      </div>

      <div className="space-y-3">
        {/* 一级分类 */}
        <div>
          <Label className="text-sm">{t("categoryLevel1")}</Label>
          <Select
            value={level1Value || undefined}
            onValueChange={handleLevel1Change}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("categoryLevel1Placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {level1Categories.length > 0 ? (
                level1Categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories" disabled>
                  {t("noCategoriesAvailable")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 二级分类 */}
        {level1Value && (
          <div>
            <Label className="text-sm">{t("categoryLevel2")}</Label>
            <Select
              value={level2Value || undefined}
              onValueChange={handleLevel2Change}
              disabled={!level1Value || isLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("categoryLevel2Placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {level2Categories.length > 0 ? (
                  level2Categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-subcategories" disabled>
                    {t("noSubcategoriesAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 三级分类 */}
        {level2Value && (
          <div>
            <Label className="text-sm">{t("categoryLevel3")}</Label>
            <Select
              value={level3Value || undefined}
              onValueChange={handleLevel3Change}
              disabled={!level2Value || isLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("categoryLevel3Placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {level3Categories.length > 0 ? (
                  level3Categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-subcategories" disabled>
                    {t("noSubcategoriesAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 显示完整分类路径 */}
        {displayFullPathString && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              {t("currentFullPathLabel")}:{" "}
              <span className="font-medium text-foreground">
                {displayFullPathString}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const ProductsClient = {
  NavbarWrapper,
  PageWrapper,
  AddButton,
  AddCategoryButton,
  CascadeCategorySelector,
  ProductTable,
};
