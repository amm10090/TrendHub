"use client";

import {
  Button,
  Autocomplete,
  AutocompleteItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  ChevronRight,
  Pencil,
  EyeOff,
  Eye,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { ReactNode, useState, useEffect, useMemo } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import { useToast } from "@/hooks/use-toast";

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
  return <Button color="primary">添加商品</Button>;
}

function AddCategoryButton() {
  return <Button color="primary">添加分类</Button>;
}

interface ActionMenuProps {
  onDelete: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  isDeleting: boolean;
  isActive?: boolean;
}

function ActionMenu({
  onDelete,
  onEdit,
  onToggleStatus,
  isDeleting,
  isActive = true,
}: ActionMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light" size="sm">
          操作
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="商品操作">
        <DropdownItem
          key="edit"
          startContent={<Pencil className="w-4 h-4" />}
          onPress={onEdit}
        >
          编辑
        </DropdownItem>
        <DropdownItem
          key="toggle"
          startContent={
            isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )
          }
          onPress={onToggleStatus}
        >
          {isActive ? "禁用" : "启用"}
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          color="danger"
          startContent={<Trash2 className="w-4 h-4" />}
          onPress={onDelete}
          isDisabled={isDeleting}
        >
          {isDeleting ? "删除中..." : "删除"}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

interface Category {
  id: string;
  name: string;
  level: number;
  parentId?: string;
}

interface CascadeCategoryProps {
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
  value?: string;
  isLoading?: boolean;
  error?: Error;
}

function CascadeCategorySelector({
  categories,
  onCategoryChange,
  value,
  isLoading,
  error,
}: CascadeCategoryProps) {
  // 状态变量
  const [level1Value, setLevel1Value] = useState<string>("");
  const [level2Value, setLevel2Value] = useState<string>("");
  const [level3Value, setLevel3Value] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // 使用useMemo缓存过滤后的分类列表
  const level1Categories = useMemo(() => {
    return categories.filter((cat) => cat.level === 1);
  }, [categories]);

  const level2Categories = useMemo(() => {
    if (!level1Value) return [];

    return categories.filter(
      (cat) => cat.level === 2 && cat.parentId === level1Value,
    );
  }, [categories, level1Value]);

  const level3Categories = useMemo(() => {
    if (!level2Value) return [];

    return categories.filter(
      (cat) => cat.level === 3 && cat.parentId === level2Value,
    );
  }, [categories, level2Value]);

  // 当value改变时，根据ID查找分类路径
  useEffect(() => {
    if (value && categories?.length > 0) {
      const selectedCategory = categories.find((cat) => cat.id === value);

      if (selectedCategory) {
        if (selectedCategory.level === 3 && selectedCategory.parentId) {
          // 如果是三级分类，找到父分类和祖父分类
          const parentCategory = categories.find(
            (cat) => cat.id === selectedCategory.parentId,
          );

          if (parentCategory && parentCategory.parentId) {
            const grandParentCategory = categories.find(
              (cat) => cat.id === parentCategory.parentId,
            );

            if (grandParentCategory) {
              setLevel1Value(grandParentCategory.id);
              setLevel2Value(parentCategory.id);
              setLevel3Value(selectedCategory.id);
              setSelectedPath([
                grandParentCategory.name,
                parentCategory.name,
                selectedCategory.name,
              ]);

              return;
            }
          }
        } else if (selectedCategory.level === 2 && selectedCategory.parentId) {
          // 如果是二级分类，找到父分类
          const parentCategory = categories.find(
            (cat) => cat.id === selectedCategory.parentId,
          );

          if (parentCategory) {
            setLevel1Value(parentCategory.id);
            setLevel2Value(selectedCategory.id);
            setLevel3Value("");
            setSelectedPath([parentCategory.name, selectedCategory.name]);

            return;
          }
        } else if (selectedCategory.level === 1) {
          // 如果是一级分类
          setLevel1Value(selectedCategory.id);
          setLevel2Value("");
          setLevel3Value("");
          setSelectedPath([selectedCategory.name]);

          return;
        }
      }
    }
  }, [value, categories]);

  // 处理一级分类选择
  const handleLevel1Change = (value: string) => {
    const category = categories.find((cat) => cat.id === value);

    if (category) {
      setLevel1Value(value);
      setLevel2Value("");
      setLevel3Value("");
      setSelectedPath([category.name]);
      onCategoryChange(value);
    }
  };

  // 处理二级分类选择
  const handleLevel2Change = (value: string) => {
    const category = categories.find((cat) => cat.id === value);

    if (category && level1Value) {
      const parentCategory = categories.find((cat) => cat.id === level1Value);

      if (parentCategory) {
        setLevel2Value(value);
        setLevel3Value("");
        setSelectedPath([parentCategory.name, category.name]);
        onCategoryChange(value);
      }
    }
  };

  // 处理三级分类选择
  const handleLevel3Change = (value: string) => {
    const category = categories.find((cat) => cat.id === value);

    if (category && level2Value) {
      const parentCategory = categories.find((cat) => cat.id === level2Value);
      const grandParentCategory = categories.find(
        (cat) => cat.id === level1Value,
      );

      if (parentCategory && grandParentCategory) {
        setLevel3Value(value);
        setSelectedPath([
          grandParentCategory.name,
          parentCategory.name,
          category.name,
        ]);
        onCategoryChange(value);
      }
    }
  };

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="p-4 border border-red-500 rounded-md">
        <p className="text-red-500">加载分类失败: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 显示已选路径 */}
      {selectedPath.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          {selectedPath.map((name, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              )}
              <Chip
                size="sm"
                color={
                  index === 0
                    ? "primary"
                    : index === 1
                      ? "secondary"
                      : "success"
                }
              >
                {name}
              </Chip>
            </div>
          ))}
        </div>
      )}

      {/* 一级分类选择器 */}
      <Autocomplete
        label="性别分类"
        placeholder="请选择性别分类"
        selectedKey={level1Value}
        onSelectionChange={handleLevel1Change}
        isRequired
        isLoading={!!isLoading}
      >
        {level1Categories.map((category) => (
          <AutocompleteItem key={category.id} textValue={category.name}>
            {category.name}
          </AutocompleteItem>
        ))}
      </Autocomplete>

      {/* 二级分类选择器 */}
      <Autocomplete
        label="商品大类"
        placeholder={level1Value ? "请选择商品大类" : "请先选择性别分类"}
        selectedKey={level2Value}
        onSelectionChange={handleLevel2Change}
        isDisabled={!level1Value || !!isLoading}
        isLoading={!!isLoading && !!level1Value}
      >
        {level2Categories.map((category) => (
          <AutocompleteItem key={category.id} textValue={category.name}>
            {category.name}
          </AutocompleteItem>
        ))}
      </Autocomplete>

      {/* 三级分类选择器 */}
      <Autocomplete
        label="具体商品类型"
        placeholder={level2Value ? "请选择具体商品类型" : "请先选择商品大类"}
        selectedKey={level3Value}
        onSelectionChange={handleLevel3Change}
        isDisabled={!level2Value || !!isLoading}
        isLoading={!!isLoading && !!level2Value}
      >
        {level3Categories.map((category) => (
          <AutocompleteItem key={category.id} textValue={category.name}>
            {category.name}
          </AutocompleteItem>
        ))}
      </Autocomplete>
    </div>
  );
}

interface QuickEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "number";
  formatter?: (value: string) => string;
}

function QuickEdit({
  value,
  onSave,
  type = "text",
  formatter,
}: QuickEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(editValue);
      setIsOpen(false);
      toast({
        title: "更新成功",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayValue = formatter ? formatter(value) : value;

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="light"
          className="px-2 h-8 text-left justify-start font-normal w-full"
        >
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-2">
          <div className="flex flex-col gap-2">
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              autoFocus
              size="sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={() => setIsOpen(false)}
                startContent={<X className="w-4 h-4" />}
              >
                取消
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={handleSave}
                isLoading={isLoading}
                startContent={!isLoading && <Check className="w-4 h-4" />}
              >
                保存
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
  placeholder?: string;
  isLoading?: boolean;
}

function QuickSelect<T extends object>({
  value,
  items,
  onSave,
  getItemLabel,
  getItemValue,
  placeholder,
  isLoading,
}: QuickSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedKey);
      setIsOpen(false);
      toast({
        title: "更新成功",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentLabel = useMemo(() => {
    const item = items.find((item) => getItemValue(item) === value);

    return item ? getItemLabel(item) : "未设置";
  }, [items, value, getItemLabel, getItemValue]);

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="light"
          className="px-2 h-8 text-left justify-start font-normal w-full"
          isLoading={isLoading}
        >
          {currentLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-2">
          <div className="flex flex-col gap-2">
            <Autocomplete
              label=""
              placeholder={placeholder}
              selectedKey={selectedKey}
              onSelectionChange={(key) => setSelectedKey(key as string)}
              defaultItems={items}
              size="sm"
              isLoading={isLoading}
            >
              {(item) => (
                <AutocompleteItem key={getItemValue(item)}>
                  {getItemLabel(item)}
                </AutocompleteItem>
              )}
            </Autocomplete>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={() => setIsOpen(false)}
                startContent={<X className="w-4 h-4" />}
              >
                取消
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={handleSave}
                isLoading={isSaving}
                startContent={!isSaving && <Check className="w-4 h-4" />}
              >
                保存
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // 找到当前分类的完整路径名称
  const getCategoryPath = (categoryId?: string): string => {
    if (!categoryId || !categories.length) return "未设置";

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
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedCategoryId);
      setIsOpen(false);
      toast({
        title: "分类更新成功",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "分类更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
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
        variant="light"
        className="px-2 h-8 text-left justify-start font-normal w-full"
        onPress={() => setIsOpen(true)}
        isLoading={isLoading}
      >
        {displayValue}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="center"
        scrollBehavior="inside"
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            选择商品分类
          </ModalHeader>
          <ModalBody>
            <CascadeCategorySelector
              categories={categories}
              onCategoryChange={handleCategoryChange}
              value={selectedCategoryId}
              isLoading={isLoading}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              color="danger"
              onPress={() => setIsOpen(false)}
              startContent={<X className="w-4 h-4" />}
            >
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSaving}
              startContent={!isSaving && <Check className="w-4 h-4" />}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
