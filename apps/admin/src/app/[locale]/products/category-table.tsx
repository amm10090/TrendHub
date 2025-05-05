"use client";

// 导入 Shadcn UI 组件 和 React Hooks - 清理未使用的，保留即将使用的
import { ChevronDown, ChevronRight } from "lucide-react";
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
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useCategories } from "@/hooks/use-categories";
import type { Category } from "@/lib/services/category.service";

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

      return (
        <div key={category.id} className="space-y-2">
          <div
            className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50/50 transition-colors ${
              category.level === 1
                ? "bg-gray-50"
                : category.level === 2
                  ? "bg-blue-50/30"
                  : "bg-green-50/30"
            }`}
          >
            <div className="flex items-center space-x-2 flex-1">
              {/* 添加展开/收缩图标按钮 */}
              {hasChildren && (
                <button
                  onClick={(e) => handleToggleExpand(category.id, e)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              {/* 如果没有子分类，添加相同宽度的空白以保持对齐 */}
              {!hasChildren && <div className="w-6" />}
              <div className="flex items-center gap-2">
                <span className={`${category.level === 1 ? "font-bold" : ""}`}>
                  {category.name}
                </span>
                {showParentBadge && (
                  <Badge // 使用 Shadcn Badge
                    className={`ml-2 ${
                      parentCategory?.name.includes("女")
                        ? "bg-pink-100 text-pink-700" // 女士分类样式
                        : "bg-blue-100 text-blue-700" // 其他分类样式 (例如男士)
                    }`}
                  >
                    {parentCategory?.name}
                  </Badge>
                )}
              </div>
              <Badge // 使用 Shadcn Badge
                className={`cursor-pointer ${
                  category.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200" // 激活状态样式
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200" // 禁用状态样式
                }`}
                onClick={(e) => handleStatusChange(category, e)}
              >
                {
                  isUpdatingStatus
                    ? tCommon("processing") /* 使用 tCommon */
                    : tProd(statusKey) /* 使用 tProd */
                }
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button // 使用 Shadcn Button
                variant="ghost" // 使用 ghost 变体
                size="sm"
                onClick={(e) => handleCategoryClick(category, e)} // 传递事件对象 e
              >
                {tActions("details")} {/* 使用 tActions */}
              </Button>
              <Button // 使用 Shadcn Button
                variant="ghost" // 使用 ghost 变体
                className="text-destructive hover:text-destructive" // 添加颜色类
                size="sm"
                isLoading={isDeleting}
                onClick={() => handleDeleteCategory(category.id)}
              >
                {isDeleting ? tCommon("deleting") : tActions("delete")}{" "}
                {/* 使用 tCommon/tActions */}
              </Button>
            </div>
          </div>
          {/* 只在展开状态且有子分类时显示子分类 */}
          {hasChildren && isExpanded && (
            <div className="ml-6 border-l-2 border-gray-200 pl-4 space-y-2">
              {children.map((child) => renderCategoryTree(child))}
            </div>
          )}
        </div>
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
      tProd,
      tCommon,
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
        {/* SheetTrigger can be added later if needed */}
        <SheetContent className="sm:max-w-sm">
          {" "}
          {/* 控制宽度 */}
          <SheetHeader>
            <SheetTitle>{tCat("detailsTitle")}</SheetTitle>
            {/* <SheetDescription>Optional description</SheetDescription> */}
          </SheetHeader>
          {/* Sheet Body - 使用 div 模拟 HerouiDrawerBody */}
          <div className="py-4">
            {selectedCategory && (
              <div className="space-y-4">
                <div>
                  <Label>{tCat("nameLabel")}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCategory.name}
                  </p>
                </div>
                <div>
                  <Label>{tCat("slugLabel")}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCategory.slug}
                  </p>
                </div>
                <div>
                  <Label>{tCat("descriptionLabel")}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCategory.description || tCat("noDescription")}
                  </p>
                </div>
                <div>
                  <Label>{tCat("levelLabel")}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCategory.level === 1
                      ? tCat("level1")
                      : selectedCategory.level === 2
                        ? tCat("level2")
                        : tCat("level3")}
                  </p>
                </div>
                <div>
                  <Label>{tCat("parentCategoryLabel")}</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {allCategories?.find(
                      (cat) => cat.id === selectedCategory.parentId,
                    )?.name || "-"}
                  </p>
                </div>
                <div>
                  <Label>{tCat("childCategoriesLabel")}</Label>
                  <div className="mt-2 space-y-2">
                    {getChildCategories(selectedCategory.id).map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{child.name}</span>
                        <Badge
                          variant={child.isActive ? "default" : "destructive"}
                        >
                          {child.isActive ? tProd("active") : tProd("inactive")}
                        </Badge>
                      </div>
                    ))}
                    {getChildCategories(selectedCategory.id).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {tCat("noChildCategories")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">{tCommon("close")}</Button>
            </SheetClose>
          </SheetFooter>
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
