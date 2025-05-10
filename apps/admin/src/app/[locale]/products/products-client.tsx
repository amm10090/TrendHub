"use client";

import {
  Pencil,
  EyeOff,
  Eye,
  Trash2,
  Check,
  X,
  Loader2,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

import { CustomNavbar } from "@/components/custom-navbar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
      <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
    </div>
  );
}

function AddButton() {
  const t = useTranslations("products");

  return <Button>{t("addProduct")}</Button>;
}

function AddCategoryButton() {
  const t = useTranslations("products");

  return <Button>{t("category")}</Button>;
}

interface ActionMenuProps {
  onDelete: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  isDeleting: boolean;
  isActive?: boolean;
  productName?: string;
}

function ActionMenu({
  onDelete,
  onEdit,
  onToggleStatus,
  isDeleting,
  isActive = true,
  productName,
}: ActionMenuProps) {
  const t = useTranslations("products");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {t("actions")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        aria-label={
          productName ? t("actionsFor", { name: productName }) : t("actions")
        }
      >
        <DropdownMenuItem key="edit" onSelect={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem key="toggle" onSelect={onToggleStatus}>
          {isActive ? (
            <EyeOff className="w-4 h-4 mr-2" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          {isActive ? t("statusInactiveSuccess") : t("statusActiveSuccess")}
        </DropdownMenuItem>
        <DropdownMenuItem
          key="delete"
          className="text-red-600 focus:text-red-600 focus:bg-red-100/50"
          onSelect={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? t("deleting") : t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

interface CascadeCategoryProps {
  categories: SimplifiedCategory[];
  onCategoryChange: (categoryId: string) => void;
  value?: string | null;
  isLoading?: boolean;
}

function CascadeCategorySelector({
  categories,
  onCategoryChange,
  value,
  isLoading,
}: CascadeCategoryProps) {
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

    const findCategory = (id: string): SimplifiedCategory | undefined =>
      categories.find((c) => c.id === id);

    const targetCategory = findCategory(value);

    if (!targetCategory) {
      setLevel1Value(null);
      setLevel2Value(null);
      setLevel3Value(null);
      setDisplayFullPathString("");

      return;
    }

    const ancestorPath: SimplifiedCategory[] = [];
    let current: SimplifiedCategory | undefined = targetCategory;

    while (current) {
      ancestorPath.unshift(current); // Add to the beginning to get Root -> ... -> Target order
      if (!current.parentId) break;
      current = findCategory(current.parentId);
      // 安全措施，防止因数据问题导致的死循环
      if (ancestorPath.length > 10) {
        // 假设分类层级不会超过10层
        break;
      }
    }

    setLevel1Value(ancestorPath.length >= 1 ? ancestorPath[0].id : null);
    setLevel2Value(ancestorPath.length >= 2 ? ancestorPath[1].id : null);
    setLevel3Value(ancestorPath.length >= 3 ? ancestorPath[2].id : null);

    const fullPath = ancestorPath.map((cat) => cat.name).join(" > ");

    setDisplayFullPathString(fullPath);
  }, [value, categories]);

  const handleLevel1Change = (newValue: string) => {
    setLevel1Value(newValue);
    setLevel2Value(null);
    setLevel3Value(null);
    onCategoryChange(newValue);
  };

  const handleLevel2Change = (newValue: string) => {
    setLevel2Value(newValue);
    setLevel3Value(null);
    onCategoryChange(newValue);
  };

  const handleLevel3Change = (newValue: string) => {
    setLevel3Value(newValue);
    onCategoryChange(newValue);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 级联选择器标题和说明 */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-medium">{t("category")}</div>
        <div className="text-sm text-gray-500">{t("categoryDescription")}</div>
      </div>

      {/* 一级分类选择器 */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-medium">{t("categoryLevel1")}</div>
        <Select
          value={level1Value || undefined}
          onValueChange={handleLevel1Change}
          disabled={!!isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("categoryLevel1Placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {level1Categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 二级分类选择器 */}
      {level1Value && (
        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium">{t("categoryLevel2")}</div>
          <Select
            value={level2Value || undefined}
            onValueChange={handleLevel2Change}
            disabled={!level1Value || !!isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("categoryLevel2Placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {level2Categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 三级分类选择器 */}
      {level2Value && (
        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium">{t("categoryLevel3")}</div>
          <Select
            value={level3Value || undefined}
            onValueChange={handleLevel3Change}
            disabled={!level2Value || !!isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("categoryLevel3Placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {level3Categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 显示完整分类路径的元素 */}
      {displayFullPathString && (
        <div className="mt-2 text-sm text-gray-600">
          {t("currentFullPathLabel", { ns: "product.edit.organization" })}:{" "}
          {displayFullPathString}
        </div>
      )}
    </div>
  );
}

interface QuickEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  formatter?: (value: string) => string;
  type?: string;
  placeholder?: string;
}

function QuickEdit({
  value,
  onSave,
  formatter,
  type = "text",
  placeholder,
}: QuickEditProps) {
  const t = useTranslations("products");
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(editValue);
      setIsOpen(false);
      toast.success(t("updateNameSuccess"));
    } catch (error) {
      toast.error(t("updateError"), {
        description: error instanceof Error ? error.message : t("unknownError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayValue = formatter ? formatter(value) : value;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="px-2 h-8 text-left justify-start font-normal w-full"
        >
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-2">
          <div className="flex flex-col gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              type={type}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              autoFocus
              className="h-8"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-8 px-2 py-0 text-xs text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                {t("cancel", { ns: "product.edit" })}
              </Button>
              <Button
                className="h-8 px-2 py-0 text-xs"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {t("save", { ns: "product.edit" })}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface QuickSelectProps<T extends object> {
  value: string;
  items: T[];
  onSave: (value: string) => Promise<void>;
  getItemLabel: (item: T) => string;
  getItemValue: (item: T) => string;
  isLoading?: boolean;
  placeholder?: string;
}

function QuickSelect<T extends object>({
  value,
  items,
  onSave,
  getItemLabel,
  getItemValue,
  isLoading,
  placeholder,
}: QuickSelectProps<T>) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedKey);
      setIsOpen(false);
      toast.success(t("products.updateSuccess"));
    } catch (error) {
      toast.error(t("products.updateError"), {
        description:
          error instanceof Error ? error.message : t("products.unknownError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentLabel = useMemo(() => {
    const item = items.find((item) => getItemValue(item) === value);

    return item ? getItemLabel(item) : placeholder || t("products.notSet");
  }, [items, value, getItemLabel, getItemValue, placeholder, t]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="px-2 h-8 text-left justify-start font-normal w-full"
          disabled={isLoading}
        >
          {isLoading ? t("products.loading") : currentLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-2">
          <div className="flex flex-col gap-2">
            <div>
              Requires Combobox implementation for Autocomplete replacement.
              Current value: {currentLabel}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-8 px-2 py-0 text-xs text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                {t("product.edit.cancel")}
              </Button>
              <Button
                className="h-8 px-2 py-0 text-xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {t("product.edit.save")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface QuickCategorySelectProps {
  value?: string;
  categoryId?: string;
  categories: Category[];
  onSave: (value: string) => Promise<void>;
  isLoading?: boolean;
}

function QuickCategorySelect({
  value,
  categoryId,
  categories,
  onSave,
  isLoading,
}: QuickCategorySelectProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  // 找到当前分类的完整路径名称
  const getCategoryPath = useCallback(
    (categoryId?: string): string => {
      if (!categoryId || !categories.length) return t("products.notSet");

      const findCategory = (id: string): Category | undefined => {
        return categories.find((cat) => cat.id === id);
      };

      const buildPath = (id: string): string[] => {
        const category = findCategory(id);

        if (!category) return [];

        if (category.parentId) {
          return [...buildPath(category.parentId), category.name];
        }

        return [category.name];
      };

      const path = buildPath(categoryId);

      return path.join(" > ");
    },
    [categories, t],
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedCategoryId);
      setIsOpen(false);
      toast.success(t("products.updateCategorySuccess"));
    } catch (error) {
      toast.error(t("products.updateError"), {
        description:
          error instanceof Error ? error.message : t("products.unknownError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const displayValue = value || getCategoryPath(categoryId);

  return (
    <>
      <Button
        variant="ghost"
        className="px-2 h-8 text-left justify-start font-normal w-full"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? t("products.loading") : displayValue}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="flex flex-col gap-1">
            {t("product.edit.organization.category")}
          </DialogHeader>
          <CascadeCategorySelector
            categories={categories}
            onCategoryChange={handleCategoryChange}
            value={selectedCategoryId}
            isLoading={isLoading}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                {t("product.edit.cancel")}
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {t("product.edit.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 添加商品表格相关组件
interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  discountPercent?: number;
}

function PriceDisplay({
  price,
  originalPrice,
  discountPercent,
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className="flex flex-col">
      <div className="font-medium">${price.toFixed(2)}</div>
      {hasDiscount && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 line-through">
            ${originalPrice.toFixed(2)}
          </span>
          {discountPercent && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
              -{discountPercent}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface ProductImageProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
}

function ProductImage({ src, alt, fallbackText }: ProductImageProps) {
  const t = useTranslations("products");

  if (!src) {
    return (
      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded">
        <span className="text-xs text-gray-500">
          {fallbackText || t("noImage")}
        </span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 relative rounded overflow-hidden">
      <Image
        src={src}
        alt={alt || t("productImage")}
        width={40}
        height={40}
        className="object-cover w-full h-full"
      />
    </div>
  );
}

interface CategoryPathProps {
  categoryPath?: string;
  categoryId?: string;
  categories?: Category[];
}

function CategoryPath({
  categoryPath,
  categoryId,
  categories,
}: CategoryPathProps) {
  const t = useTranslations("products");

  const getCategoryPath = useCallback(
    (id?: string): string => {
      if (!id || !categories?.length) return t("notSet");

      const findCategory = (catId: string): Category | undefined => {
        return categories.find((cat) => cat.id === catId);
      };

      const buildPath = (catId: string): string[] => {
        const category = findCategory(catId);

        if (!category) return [];

        if (category.parentId) {
          return [...buildPath(category.parentId), category.name];
        }

        return [category.name];
      };

      return buildPath(id).join(" > ");
    },
    [categories, t],
  );

  const displayPath =
    categoryPath || (categoryId ? getCategoryPath(categoryId) : t("notSet"));

  return (
    <div className="text-sm truncate max-w-[200px]" title={displayPath}>
      {displayPath}
    </div>
  );
}

interface BrandDisplayProps {
  brandId?: string;
  brandName?: string;
  brandLogo?: string;
}

function BrandDisplay({ brandId, brandName, brandLogo }: BrandDisplayProps) {
  const t = useTranslations("products");

  if (!brandName && !brandId) {
    return <div className="text-sm text-gray-500">{t("notSet")}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {brandLogo ? (
        <div className="w-5 h-5 relative">
          <Image
            src={brandLogo}
            alt={brandName}
            width={20}
            height={20}
            className="object-contain w-full h-full"
          />
        </div>
      ) : (
        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-xs">{brandName?.charAt(0) || "B"}</span>
        </div>
      )}
      <span className="text-sm">{brandName}</span>
    </div>
  );
}

interface InventoryStatusProps {
  inventory?: number;
  lowStockThreshold?: number;
}

function InventoryStatus({
  inventory,
  lowStockThreshold = 10,
}: InventoryStatusProps) {
  const t = useTranslations("products");

  if (inventory === undefined) {
    return <div className="text-sm text-gray-500">{t("noInventory")}</div>;
  }

  let statusColor = "bg-green-500";
  let statusText = t("inStock");

  if (inventory <= 0) {
    statusColor = "bg-red-500";
    statusText = t("outOfStock");
  } else if (inventory <= lowStockThreshold) {
    statusColor = "bg-yellow-500";
    statusText = t("lowStock");
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm">
        {inventory} {t("units")}
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <div className="text-xs text-gray-600">{statusText}</div>
      </div>
    </div>
  );
}

interface CouponBadgeProps {
  hasCoupon: boolean;
  couponCode?: string;
  couponValue?: number;
}

function CouponBadge({ hasCoupon, couponCode, couponValue }: CouponBadgeProps) {
  const t = useTranslations("products");

  if (!hasCoupon) return null;

  return (
    <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
      {couponCode && couponValue
        ? `${couponCode}: ${couponValue}%`
        : t("hasCoupon")}
    </div>
  );
}

interface ProductStatusBadgeProps {
  isActive: boolean;
}

function ProductStatusBadge({ isActive }: ProductStatusBadgeProps) {
  const t = useTranslations("products");

  return (
    <div
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {isActive ? t("status.active") : t("status.inactive")}
    </div>
  );
}

// 商品表格行
interface ProductRowProps {
  product: {
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
  };
  categories?: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
}

function ProductRow({
  product,
  categories,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting,
  isSelected,
  onSelectChange,
}: ProductRowProps) {
  const t = useTranslations("products");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = () => onEdit(product.id);
  const handleDelete = () => onDelete(product.id);
  const handleToggleStatus = () =>
    onToggleStatus(product.id, !!product.isActive);
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectChange?.(product.id, e.target.checked);
  };

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="pl-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="rounded"
              aria-label={t("selectProduct")}
            />
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "-" : "+"}
            </Button>
            <ProductImage src={product.image} alt={product.name} />
            <div className="flex flex-col">
              <div className="font-medium">{product.name}</div>
              {product.sku && (
                <div className="text-xs text-gray-500">
                  {t("sku")}: {product.sku}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <BrandDisplay
            brandId={product.brandId}
            brandName={product.brandName}
            brandLogo={product.brandLogo}
          />
        </td>
        <td className="px-4 py-3">
          <CategoryPath
            categoryId={product.categoryId}
            categoryPath={product.categoryPath}
            categories={categories}
          />
        </td>
        <td className="px-4 py-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercent={product.discount}
          />
        </td>
        <td className="px-4 py-3">
          <InventoryStatus inventory={product.inventory} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <ProductStatusBadge isActive={!!product.isActive} />
            {product.hasCoupon && (
              <CouponBadge
                hasCoupon={!!product.hasCoupon}
                couponCode={product.couponCode}
                couponValue={product.couponValue}
              />
            )}
          </div>
        </td>
        <td className="pr-4 py-3">
          <ActionMenu
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            isDeleting={!!isDeleting}
            isActive={!!product.isActive}
            productName={product.name}
          />
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b bg-gray-50">
          <td colSpan={7} className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("productDetails")}</h4>
                <div className="text-sm">
                  <div>
                    <span className="font-medium">{t("id")}:</span> {product.id}
                  </div>
                  <div>
                    <span className="font-medium">{t("sku")}:</span>{" "}
                    {product.sku || t("notSet")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("pricing")}</h4>
                <div className="text-sm">
                  <div>
                    <span className="font-medium">{t("currentPrice")}:</span> $
                    {product.price}
                  </div>
                  {product.originalPrice && (
                    <div>
                      <span className="font-medium">{t("originalPrice")}:</span>{" "}
                      ${product.originalPrice}
                    </div>
                  )}
                  {product.discount && (
                    <div>
                      <span className="font-medium">{t("discount")}:</span>{" "}
                      {product.discount}%
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("inventory")}</h4>
                <div className="text-sm">
                  <div>
                    <span className="font-medium">{t("stock")}:</span>{" "}
                    {product.inventory ?? t("notSet")}
                  </div>
                  <div>
                    <span className="font-medium">{t("status")}:</span>
                    {product.isActive ? t("active") : t("inactive")}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// 筛选和批量操作组件
interface ProductFilterProps {
  activeFilters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories?: Category[];
  brands?: { id: string; name: string }[];
}

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

function ProductFilter({
  activeFilters,
  onFiltersChange,
  categories,
  brands,
}: ProductFilterProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [isExpanded, setIsExpanded] = useState(false);

  // 步骤 1 (来自上一次的计划): 为 searchTerm, localMinPrice, localMaxPrice 添加 useState Hooks
  const [searchTerm, setSearchTerm] = useState<string>(
    activeFilters.search || "",
  );
  const [localMinPrice, setLocalMinPrice] = useState<string>(
    activeFilters.minPrice?.toString() || "",
  );
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(
    activeFilters.maxPrice?.toString() || "",
  );

  // 步骤 1 (本次计划的核心): 使用 useMemo 创建 relevantActiveFilters 对象
  const relevantActiveFilters = useMemo(() => {
    return {
      status: activeFilters.status,
      categoryId: activeFilters.categoryId,
      brandId: activeFilters.brandId,
      hasDiscount: activeFilters.hasDiscount,
      hasCoupon: activeFilters.hasCoupon,
    };
  }, [
    activeFilters.status,
    activeFilters.categoryId,
    activeFilters.brandId,
    activeFilters.hasDiscount,
    activeFilters.hasCoupon,
  ]);

  // 步骤 1 (本次计划的核心): 使用 useMemo 创建 syncableFilterInputs 对象
  const syncableFilterInputs = useMemo(() => {
    return {
      search: activeFilters.search,
      minPrice: activeFilters.minPrice,
      maxPrice: activeFilters.maxPrice,
    };
  }, [activeFilters.search, activeFilters.minPrice, activeFilters.maxPrice]);

  // 第一个 useEffect Hook (防抖逻辑)
  useEffect(() => {
    const handler = setTimeout(() => {
      const newMinPrice =
        localMinPrice !== "" ? Number(localMinPrice) : undefined;
      const newMaxPrice =
        localMaxPrice !== "" ? Number(localMaxPrice) : undefined;

      const finalMinPrice =
        newMinPrice !== undefined && !isNaN(newMinPrice)
          ? newMinPrice
          : undefined;
      const finalMaxPrice =
        newMaxPrice !== undefined && !isNaN(newMaxPrice)
          ? newMaxPrice
          : undefined;

      // 步骤 1 (本次计划的核心): 修改 onFiltersChange 调用以使用 relevantActiveFilters
      onFiltersChange({
        ...relevantActiveFilters, // 展开 memoized 对象
        search: searchTerm || undefined,
        minPrice: finalMinPrice,
        maxPrice: finalMaxPrice,
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [
    searchTerm,
    localMinPrice,
    localMaxPrice,
    onFiltersChange,
    relevantActiveFilters, // 依赖 memoized 对象
  ]);

  // 第二个 useEffect Hook (同步 activeFilters prop 的变化到本地状态)
  useEffect(() => {
    // 步骤 1 (本次计划的核心): 从 syncableFilterInputs 读取值
    setSearchTerm(syncableFilterInputs.search || "");
    setLocalMinPrice(syncableFilterInputs.minPrice?.toString() || "");
    setLocalMaxPrice(syncableFilterInputs.maxPrice?.toString() || "");
  }, [syncableFilterInputs]);

  const handleLocalResetFilters = () => {
    onFiltersChange({ status: "all" });
  };

  return (
    <div className="bg-white rounded-md border p-4 mb-4">
      <div className="flex flex-col space-y-4">
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder={t("search")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 基本筛选项 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 状态筛选 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("columns.status")}</label>
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
                <SelectValue placeholder={t("columns.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("all")}</SelectItem>
                <SelectItem value="inStock">{t("status.inStock")}</SelectItem>
                <SelectItem value="lowStock">{t("status.lowStock")}</SelectItem>
                <SelectItem value="outOfStock">
                  {t("status.outOfStock")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 品牌筛选 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("columns.brand")}</label>
            <Select
              value={activeFilters.brandId || "_all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...activeFilters,
                  brandId: value === "_all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={tCommon("selectBrand")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{tCommon("all")}</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 分类筛选 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t("columns.category")}
            </label>
            <Select
              value={activeFilters.categoryId || "_all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...activeFilters,
                  categoryId: value === "_all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={tCommon("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{tCommon("all")}</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 展开收起按钮 */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-sm"
        >
          {isExpanded ? tCommon("filter.collapse") : tCommon("filter.expand")}
        </Button>

        {/* 高级筛选项 */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            {/* 价格范围筛选 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">{tCommon("price")}</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder={tCommon("filter.minPrice")}
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder={tCommon("filter.maxPrice")}
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* 特殊属性筛选 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasDiscount"
                  checked={!!activeFilters.hasDiscount}
                  onChange={(e) =>
                    onFiltersChange({
                      ...activeFilters,
                      hasDiscount: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="hasDiscount" className="text-sm">
                  {tCommon("filter.hasDiscount")}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasCoupon"
                  checked={!!activeFilters.hasCoupon}
                  onChange={(e) =>
                    onFiltersChange({
                      ...activeFilters,
                      hasCoupon: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="hasCoupon" className="text-sm">
                  {tCommon("filter.hasCoupon")}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 筛选按钮 */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={handleLocalResetFilters}>
            {tCommon("filter.reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 批量操作工具栏
interface BulkActionToolbarProps {
  selectedIds: string[];
  onBulkDelete: (ids: string[]) => void;
  onBulkToggleStatus: (ids: string[], setActive: boolean) => void;
}

function BulkActionToolbar({
  selectedIds,
  onBulkDelete,
  onBulkToggleStatus,
}: BulkActionToolbarProps) {
  const t = useTranslations("products");
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <div className="bg-gray-100 p-2 rounded-md mb-4 flex items-center justify-between">
      <div className="text-sm">{t("selectedItems", { count })}</div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkToggleStatus(selectedIds, true)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {t("activate")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkToggleStatus(selectedIds, false)}
        >
          <EyeOff className="w-4 h-4 mr-2" />
          {t("deactivate")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onBulkDelete(selectedIds)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t("delete")}
        </Button>
      </div>
    </div>
  );
}

// 主商品表格组件
interface ProductTableProps {
  products: Array<{
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
  }>;
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
}

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
}: ProductTableProps) {
  const t = useTranslations("products");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProductFilter
        activeFilters={activeFilters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        brands={brands}
      />

      {onBulkDelete && onBulkToggleStatus && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          onBulkDelete={handleBulkDelete}
          onBulkToggleStatus={handleBulkToggleStatus}
        />
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="pl-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === products.length &&
                      products.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  {t("product")}
                </div>
              </th>
              <th className="px-4 py-3 text-left">{t("brand")}</th>
              <th className="px-4 py-3 text-left">{t("category")}</th>
              <th className="px-4 py-3 text-left">{t("price")}</th>
              <th className="px-4 py-3 text-left">{t("inventory")}</th>
              <th className="px-4 py-3 text-left">{t("columns.status")}</th>
              <th className="pr-4 py-3 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categories={categories}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                isSelected={selectedIds.includes(product.id)}
                onSelectChange={handleSelectOne}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const ProductsClient = {
  NavbarWrapper,
  PageWrapper,
  AddButton,
  AddCategoryButton,
  ActionMenu,
  CascadeCategorySelector,
  QuickEdit,
  QuickSelect,
  QuickCategorySelect,
  ProductImage,
  PriceDisplay,
  CategoryPath,
  BrandDisplay,
  InventoryStatus,
  CouponBadge,
  ProductStatusBadge,
  ProductRow,
  ProductFilter,
  BulkActionToolbar,
  ProductTable,
};
