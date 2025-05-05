"use client";

import { Pencil, EyeOff, Eye, Trash2, Check, X, Loader2 } from "lucide-react";
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

  // 生成三级分类
  const level1Categories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const level2Categories = useMemo(() => {
    return categories.filter((c) => c.parentId === level1Value);
  }, [categories, level1Value]);

  const level3Categories = useMemo(() => {
    return categories.filter((c) => c.parentId === level2Value);
  }, [categories, level2Value]);

  // 初始化分类值
  useEffect(() => {
    if (!value) return;

    // 查找当前分类和其父级分类
    const category = categories.find((c) => c.id === value);

    if (!category) return;

    let parentId1 = null;
    let parentId2 = null;

    // 设置二级分类值
    if (category.parentId) {
      const parentCategory = categories.find((c) => c.id === category.parentId);

      if (parentCategory) {
        parentId2 = parentCategory.id;

        // 设置一级分类值
        if (parentCategory.parentId) {
          parentId1 = parentCategory.parentId;
          setLevel1Value(parentId1);
          setLevel2Value(parentId2);
          setLevel3Value(value);
        } else {
          // 如果是二级分类
          parentId1 = parentCategory.id;
          setLevel1Value(parentId1);
          setLevel2Value(value);
        }
      }
    } else {
      // 如果是一级分类
      setLevel1Value(value);
    }
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
    </div>
  );
}

interface QuickEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  formatter?: (value: string) => string;
  type?: string;
}

function QuickEdit({
  value,
  onSave,
  formatter,
  type = "text",
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
};
