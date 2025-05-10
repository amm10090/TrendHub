"use client";

// 导入 Shadcn UI 组件 和 React Hooks - 清理未使用的，保留即将使用的
import { ChevronDown, ChevronRight, X as Info, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl"; // 添加 next-intl
import { useCallback, useState } from "react"; // 移除 useEffect
import { toast } from "sonner";

import {
  Badge,
  Button,
  CustomPagination,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { useCategories } from "@/hooks/use-categories";
import type { Category } from "@/lib/services/category.service";
import { cn } from "@/lib/utils"; // 确保导入 cn

// 扩展分类表单类型，添加临时字段
interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  level: number;
  parentId: string;
  tempGenderId?: string;
}

export function CategoryTable() {
  // const { t } = useTranslation(); // 移除旧的 t
  const tCat = useTranslations("categories");
  const tProd = useTranslations("products");
  const tCommon = useTranslations("common");
  const tActions = useTranslations("actions");
  // 移除 useDisclosure
  // const { isOpen, onOpen, onClose } = useDisclosure();
  // const {
  //   isOpen: isDrawerOpen,
  //   onOpen: onDrawerOpen,
  //   onClose: onDrawerClose,
  // } = useDisclosure();

  // 添加 useState 替换 useDisclosure
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [deletingCategoryIds, setDeletingCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [updatingStatusCategoryIds, setUpdatingStatusCategoryIds] = useState<
    Set<string>
  >(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // 获取所有分类
  const {
    categories,
    totalPages,
    isLoading,
    isError,
    isCreating,
    createCategory,
    deleteCategory,
    updateCategoryStatus,
  } = useCategories({
    page,
    limit,
    familyPaging: genderFilter ? true : false, // 只在性别标签页下启用家族分页
    ...(genderFilter ? { parentId: genderFilter, getAllRelated: true } : {}),
  });

  // 获取所有分类用于父分类选择和标签显示
  const {
    categories: allCategories,
    isLoading: isLoadingAll,
    mutateCategories: mutateAllCategories, // 使用正确的mutateCategories方法
  } = useCategories({
    limit: 999,
  });

  // 根据层级获取分类
  const genderCategories =
    allCategories?.filter((cat) => cat.level === 1) || [];
  const productTypeCategories =
    allCategories?.filter((cat) => cat.level === 2) || [];

  const [newCategory, setNewCategory] = useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    level: 1,
    parentId: "",
  });

  // 处理分类点击，打开抽屉展示详细信息
  const handleCategoryClick = useCallback(
    (category: Category, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedCategory(category);
      // onDrawerOpen(); // 替换为:
      setIsDetailSheetOpen(true);
    },
    [], // 移除 onDrawerOpen 依赖
  );

  // 获取分类的子分类
  const getChildCategories = useCallback(
    (parentId: string) => {
      return allCategories?.filter((cat) => cat.parentId === parentId) || [];
    },
    [allCategories],
  );

  // 处理展开/收缩
  const handleToggleExpand = useCallback(
    (categoryId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // 防止触发详情抽屉
      setExpandedCategories((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
        } else {
          newSet.add(categoryId);
        }

        return newSet;
      });
    },
    [],
  );

  // 处理删除分类
  const handleDeleteCategory = useCallback(
    async (id: string) => {
      try {
        // 将该分类ID添加到正在删除的集合中
        setDeletingCategoryIds((prev) => new Set(prev).add(id));

        const result = await deleteCategory(id);

        if (result && result.success) {
          toast.success(tCat("deleteSuccessTitle"), {
            // 使用 tCat
            description: tCat("deleteSuccessDesc"), // 使用 tCat
            duration: 3000,
          });
        }
      } catch (error) {
        toast.error(tCat("deleteErrorTitle"), {
          // 使用 tCat
          description:
            error instanceof Error ? error.message : tCat("deleteErrorDesc"), // 使用 tCat
          duration: 5000,
        });
      } finally {
        // 删除操作完成后，从集合中移除该分类ID
        setDeletingCategoryIds((prev) => {
          const newSet = new Set(prev);

          newSet.delete(id);

          return newSet;
        });
      }
    },
    [deleteCategory, tCat], // 重新添加 tCat 依赖
  );

  // 处理状态变更
  const handleStatusChange = useCallback(
    async (category: Category, e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡
      try {
        // 将该分类ID添加到正在更新状态的集合中
        setUpdatingStatusCategoryIds((prev) => new Set(prev).add(category.id));

        const result = await updateCategoryStatus(
          category.id,
          !category.isActive,
        );

        if (result) {
          const statusKey = category.isActive ? "inactive" : "active"; // 根据当前状态确定目标状态 key

          toast.success(tCat("statusUpdateSuccessTitle"), {
            // 使用 tCat
            description: tCat("statusUpdateSuccessDesc", {
              // 使用 tCat 和插值
              name: category.name,
              status: tProd(statusKey), // 从 products 获取 active/inactive 翻译
            }),
            duration: 3000,
          });
        }
      } catch (error) {
        toast.error(tCat("statusUpdateErrorTitle"), {
          // 使用 tCat
          description:
            error instanceof Error
              ? error.message
              : tCat("statusUpdateErrorDesc"), // 使用 tCat
          duration: 5000,
        });
      } finally {
        // 更新操作完成后，从集合中移除该分类ID
        setUpdatingStatusCategoryIds((prev) => {
          const newSet = new Set(prev);

          newSet.delete(category.id);

          return newSet;
        });
      }
    },
    [updateCategoryStatus, tCat, tProd], // 重新添加 tCat, tProd 依赖
  );

  // 渲染分类树结构
  const renderCategoryTree = useCallback(
    (category: Category) => {
      const children = getChildCategories(category.id);
      const isDeleting = deletingCategoryIds.has(category.id);
      const isUpdatingStatus = updatingStatusCategoryIds.has(category.id);
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = children.length > 0;
      const parentCategory = category.parentId
        ? allCategories?.find((cat) => cat.id === category.parentId)
        : null;
      const showParentBadge =
        !genderFilter && category.level > 1 && parentCategory;
      const statusKey = category.isActive ? "active" : "inactive";

      // 根据层级选择不同的背景色，L1层级背景色更深或不同，子层级背景逐渐变浅或有明显区分
      let rowBgClass = "hover:bg-gray-50/50"; // 默认hover效果

      if (category.level === 1) {
        rowBgClass = "bg-slate-50 hover:bg-slate-100/80"; // L1 特殊背景
      } else if (category.level === 2) {
        rowBgClass = "bg-sky-50/60 hover:bg-sky-100/70"; // L2 背景
      } else {
        rowBgClass = "bg-emerald-50/50 hover:bg-emerald-100/60"; // L3+ 背景
      }

      return (
        <TooltipProvider key={`tp-${category.id}`} delayDuration={300}>
          <div className="space-y-1 rounded-md overflow-hidden mb-1 last:mb-0">
            <div
              className={`flex items-center justify-between p-2.5 rounded-md transition-colors ${rowBgClass}`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => handleToggleExpand(category.id, e)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                )}
                {!hasChildren && <div className="w-7 shrink-0" />}

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-x-2">
                    <span
                      className={`truncate ${category.level === 1 ? "font-semibold text-base" : "font-medium"}`}
                      title={category.name}
                    >
                      {category.name}
                    </span>
                    {showParentBadge && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="ml-1 text-xs px-1.5 py-0.5 truncate max-w-[120px] cursor-default shrink-0"
                          >
                            {parentCategory?.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {tCat("parentCategoryLabel")}:{" "}
                            {parentCategory?.name}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={category.isActive ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs px-2 py-1",
                        category.isActive
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-500 dark:bg-green-600 dark:hover:bg-green-700 dark:text-white dark:border-green-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800",
                      )}
                      onClick={(e) => handleStatusChange(category, e)}
                    >
                      {isUpdatingStatus ? (
                        <Spinner className="h-3 w-3 text-current" />
                      ) : (
                        tProd(statusKey)
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {category.isActive
                        ? tActions("deactivate")
                        : tActions("activate")}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={(e) => handleCategoryClick(category, e)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tActions("details")}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tActions("delete")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-5 pl-5 border-l-2 border-slate-200 space-y-1 pb-1">
                {children.map((child) => renderCategoryTree(child))}
              </div>
            )}
          </div>
        </TooltipProvider>
      );
    },
    [
      allCategories,
      deletingCategoryIds,
      updatingStatusCategoryIds,
      expandedCategories,
      genderFilter,
      getChildCategories,
      handleCategoryClick,
      handleDeleteCategory,
      handleStatusChange,
      handleToggleExpand,
      tCat,
      tProd,
      tActions,
    ],
  );

  // 过滤和排序显示的分类
  const filteredCategories = genderFilter
    ? categories
    : (categories || []).sort((a, b) => {
        // 在全部标签页下，按照创建时间倒序排列
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, []);

  // 处理创建分类
  const handleCreateCategory = useCallback(async () => {
    try {
      // 表单验证
      if (!newCategory.name.trim()) {
        toast.error(tCat("validation.nameRequiredTitle"), {
          // 使用 tCat
          description: tCat("validation.nameRequiredDesc"), // 使用 tCat
          duration: 4000,
        });

        return;
      }
      if (!newCategory.slug.trim()) {
        toast.error(tCat("validation.slugRequiredTitle"), {
          // 使用 tCat
          description: tCat("validation.slugRequiredDesc"), // 使用 tCat
          duration: 4000,
        });

        return;
      }

      // 如果不是一级分类，必须选择父分类
      if (newCategory.level > 1 && !newCategory.parentId) {
        toast.error(tCat("validation.parentRequiredTitle"), {
          // 使用 tCat
          description: tCat("validation.parentRequiredDesc"), // 使用 tCat
          duration: 4000,
        });

        return;
      }

      // 创建时只传递需要的字段
      const { name, slug, description, level, parentId } = newCategory;

      const result = await createCategory({
        name,
        slug,
        description,
        level: Number(level),
        ...(level > 1 ? { parentId } : {}),
      });

      if (result) {
        // onClose(); // 替换为:
        setIsAddModalOpen(false);
        // 成功创建后立即更新数据
        await Promise.all([
          mutateAllCategories(), // 更新所有分类数据，这会刷新顶部标签
        ]);

        toast.success(tCat("createSuccessTitle"), {
          // 使用 tCat
          description: tCat("createSuccessDesc", { name: newCategory.name }), // 使用 tCat 和插值
          duration: 3000,
        });
        setNewCategory({
          name: "",
          slug: "",
          description: "",
          level: 1,
          parentId: "",
        });
      }
    } catch (error) {
      toast.error(tCat("createErrorTitle"), {
        // 使用 tCat
        description:
          error instanceof Error ? error.message : tCat("createErrorDesc"), // 使用 tCat
        duration: 5000,
      });
    }
  }, [createCategory, mutateAllCategories, newCategory, tCat]); // 确保包含 tCat 依赖

  // 在切换标签时重置展开状态
  const handleTabChange = useCallback((key: string | number) => {
    setGenderFilter(key === "all" ? null : key.toString());
    setPage(1);
    setExpandedCategories(new Set());
  }, []);

  const isLoadingAny = isLoading || isLoadingAll;

  if (isLoadingAny) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-red-500">{tCat("fetchError")}</p> {/* 使用 tCat */}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between mb-4">
        <div>
          <Tabs // 使用 Shadcn Tabs
            value={genderFilter || "all"} // 使用 value
            onValueChange={handleTabChange} // 使用 onValueChange
          >
            <TabsList>
              {" "}
              {/* 使用 TabsList 包裹 */}
              <TabsTrigger value="all">{tCommon("all")}</TabsTrigger>{" "}
              {/* 使用 TabsTrigger 和 tCommon */}
              {genderCategories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger> // 使用 TabsTrigger
              ))}
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          {" "}
          {/* 更新 onClick */}
          {tCat("addCategory")} {/* 使用 tCat */}
        </Button>
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => renderCategoryTree(category))}
      </div>

      <div className="mt-4 flex justify-center">
        <CustomPagination
          totalPages={totalPages || 1}
          page={page}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 分类详情抽屉 - 用 Sheet 替换 */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-md p-0">
          {" "}
          {/* 修改 sm:max-w-sm 为 sm:max-w-md 并添加 p-0 */}
          <SheetHeader className="p-6 pb-4 border-b">
            {" "}
            {/* 添加 relative 以便绝对定位关闭按钮 */}
            <SheetTitle>{tCat("detailsTitle")}</SheetTitle>
            {/* <SheetDescription>Optional description</SheetDescription> */}
            {/* 移除 asChild, 直接将 IconX 作为 SheetClose 的子元素，并自定义样式 */}
          </SheetHeader>
          {/* Sheet Body - 使用 div 模拟 HerouiDrawerBody */}
          <div className="p-6 space-y-6">
            {" "}
            {/* 修改 py-4 为 p-6, space-y-4 为 space-y-6 */}
            {selectedCategory && (
              <>
                {/* Section 1: 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-foreground">
                    {selectedCategory.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Slug: {selectedCategory.slug}
                  </p>

                  <div className="text-sm space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {tCat("descriptionLabel")}
                    </Label>
                    <p className="text-foreground">
                      {selectedCategory.description || tCat("noDescription")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-sm space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {tCat("levelLabel")}
                      </Label>
                      <p className="text-foreground">
                        {selectedCategory.level === 1
                          ? tCat("level1")
                          : selectedCategory.level === 2
                            ? tCat("level2")
                            : tCat("level3")}
                      </p>
                    </div>
                    <div className="text-sm space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {tCommon("columns.status")}
                      </Label>
                      <div>
                        <Badge
                          variant={
                            selectedCategory.isActive ? "default" : "outline"
                          }
                          className={
                            selectedCategory.isActive
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "border-gray-300 text-gray-600"
                          }
                        >
                          {tProd(
                            selectedCategory.isActive ? "active" : "inactive",
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Section 2: 层级关系 */}
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {tCat("parentCategoryLabel")}
                    </Label>
                    {(() => {
                      const parent = allCategories?.find(
                        (cat) => cat.id === selectedCategory.parentId,
                      );

                      if (parent) {
                        return (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-normal text-primary hover:text-primary/80 block truncate"
                            // onClick={() => handleNavigateToParent(parent.id)} // handleNavigateToParent 需要实现
                          >
                            {parent.name}
                          </Button>
                        );
                      }

                      return <p className="text-foreground">-</p>; // 或 tCat("noParent")
                    })()}
                  </div>
                </div>

                <hr className="my-4" />

                {/* Section 3: 子分类 */}
                <div className="text-sm space-y-2">
                  <Label className="text-xs text-muted-foreground block mb-2">
                    {tCat("childCategoriesLabel")}
                  </Label>
                  {(() => {
                    const children = getChildCategories(selectedCategory.id);

                    if (children.length > 0) {
                      return children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-normal text-foreground hover:text-primary truncate mr-2"
                            // onClick={() => handleNavigateToChild(child.id)} // handleNavigateToChild 需要实现
                          >
                            {child.name}
                          </Button>
                          <Badge
                            variant={child.isActive ? "default" : "outline"}
                            className={`text-xs ${child.isActive ? "bg-green-100 text-green-700 border-green-200" : "border-gray-300 text-gray-600"}`}
                          >
                            {tProd(child.isActive ? "active" : "inactive")}
                          </Badge>
                        </div>
                      ));
                    }

                    return (
                      <p className="text-muted-foreground italic">
                        {tCat("noChildCategories")}
                      </p>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
          {/* SheetFooter is removed as per plan */}
        </SheetContent>
      </Sheet>

      {/* 添加分类 Modal - 用 Dialog 替换 */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        {/* DialogTrigger can be added if the main Button should trigger it */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCat("addTitle")}</DialogTitle>
            {/* <DialogDescription>Optional description</DialogDescription> */}
          </DialogHeader>
          {/* Dialog Body */}
          <div className="py-4">
            <div className="space-y-4">
              {/* --- Select 层级 --- */}
              {/* <HerouiSelect ...> */}
              <div className="grid gap-2">
                <Label htmlFor="category-level">{tCat("levelLabel")}</Label>
                <Select
                  value={String(newCategory.level)} // 绑定 value
                  onValueChange={(value) => {
                    // 使用 onValueChange
                    const level = Number(value);

                    setNewCategory({
                      ...newCategory,
                      level,
                      parentId: "",
                      tempGenderId: "", // 重置 tempGenderId
                    });
                  }}
                  // selectedKeys, onChange, label, isRequired 移除
                >
                  <SelectTrigger id="category-level">
                    <SelectValue placeholder={tCat("levelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{tCat("level1")}</SelectItem>
                    <SelectItem value="2">{tCat("level2")}</SelectItem>
                    <SelectItem value="3">{tCat("level3")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- Select 性别 (level 2) --- */}
              {newCategory.level === 2 && (
                // <HerouiSelect ...>
                <div className="grid gap-2">
                  <Label htmlFor="parent-gender-l2">
                    {tCat("parentGenderLabel")}
                  </Label>
                  <Select
                    value={newCategory.parentId} // 绑定 value
                    onValueChange={(
                      value, // 使用 onValueChange
                    ) => setNewCategory({ ...newCategory, parentId: value })}
                    // selectedKeys, onChange, label, isRequired 移除
                  >
                    <SelectTrigger id="parent-gender-l2">
                      <SelectValue
                        placeholder={tCat("parentGenderPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {genderCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* --- Select 性别 & 大类 (level 3) --- */}
              {newCategory.level === 3 && (
                <>
                  {/* --- Select 性别 (level 3) --- */}
                  {/* <HerouiSelect ...> */}
                  <div className="grid gap-2">
                    <Label htmlFor="parent-gender-l3">
                      {tCat("parentGenderLabel")}
                    </Label>
                    <Select
                      value={newCategory.tempGenderId} // 绑定到 tempGenderId
                      onValueChange={(value) => {
                        // 使用 onValueChange
                        setNewCategory({
                          ...newCategory,
                          parentId: "", // 重置 parentId
                          tempGenderId: value,
                        });
                      }}
                      // onChange, label, isRequired 移除
                    >
                      <SelectTrigger id="parent-gender-l3">
                        <SelectValue
                          placeholder={tCat("parentGenderPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {genderCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* --- Select 商品大类 (level 3) --- */}
                  {newCategory.tempGenderId && (
                    // <HerouiSelect ...>
                    <div className="grid gap-2">
                      <Label htmlFor="parent-type-l3">
                        {tCat("parentProductTypeLabel")}
                      </Label>
                      <Select
                        value={newCategory.parentId} // 绑定 value
                        onValueChange={(
                          value, // 使用 onValueChange
                        ) =>
                          setNewCategory({
                            ...newCategory,
                            parentId: value,
                          })
                        }
                        // selectedKeys, onChange, label, isRequired 移除
                      >
                        <SelectTrigger id="parent-type-l3">
                          <SelectValue
                            placeholder={tCat("parentProductTypePlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypeCategories
                            .filter(
                              (cat) =>
                                cat.parentId === newCategory.tempGenderId,
                            )
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* --- Inputs --- */}
              {/* <HerouiInput ... /> */}
              <div className="grid gap-2">
                <Label htmlFor="category-name">{tCat("nameLabel")}</Label>
                <Input
                  id="category-name"
                  placeholder={tCat("namePlaceholder")}
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  // label, isRequired 移除
                />
              </div>

              {/* <HerouiInput ... /> */}
              <div className="grid gap-2">
                <Label htmlFor="category-slug">{tCat("slugLabel")}</Label>
                <Input
                  id="category-slug"
                  placeholder={tCat("slugPlaceholder")}
                  value={newCategory.slug}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, slug: e.target.value })
                  }
                  // label, isRequired 移除
                />
              </div>

              {/* <HerouiInput ... /> */}
              <div className="grid gap-2">
                <Label htmlFor="category-description">
                  {tCat("descriptionLabel")}
                </Label>
                <Input
                  id="category-description"
                  placeholder={tCat("descriptionPlaceholder")}
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  // label 移除
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tCommon("cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleCreateCategory} // 使用 onClick
              isLoading={isCreating}
              // type="submit" // 可以考虑添加 type submit 如果用 form 包裹
            >
              {tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
