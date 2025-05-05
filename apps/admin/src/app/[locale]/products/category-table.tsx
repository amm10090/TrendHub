"use client";

import {
  Chip,
  Button,
  Spinner,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();
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
    (category: Category) => {
      setSelectedCategory(category);
      onDrawerOpen();
    },
    [onDrawerOpen],
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
          toast.success("分类删除成功", {
            description: "分类及其关联数据已成功删除",
            duration: 3000,
          });
        }
      } catch (error) {
        toast.error("分类删除失败", {
          description:
            error instanceof Error
              ? error.message
              : "删除过程中发生错误，请稍后重试",
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
    [deleteCategory],
  );

  // 处理状态变更
  const handleStatusChange = useCallback(
    async (category: Category) => {
      try {
        // 将该分类ID添加到正在更新状态的集合中
        setUpdatingStatusCategoryIds((prev) => new Set(prev).add(category.id));

        const result = await updateCategoryStatus(
          category.id,
          !category.isActive,
        );

        if (result) {
          toast.success("状态更新成功", {
            description: `分类"${category.name}"已${
              !category.isActive ? "启用" : "禁用"
            }`,
            duration: 3000,
          });
        }
      } catch (error) {
        toast.error("状态更新失败", {
          description:
            error instanceof Error
              ? error.message
              : "更新过程中发生错误，请稍后重试",
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
    [updateCategoryStatus],
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
                  <Chip
                    color={
                      parentCategory?.name.includes("女") ? "danger" : "primary"
                    }
                    variant="flat"
                    size="sm"
                    className="ml-2"
                  >
                    {parentCategory?.name}
                  </Chip>
                )}
              </div>
              <Chip
                color={category.isActive ? "success" : "danger"}
                variant="flat"
                size="sm"
                className="cursor-pointer"
                onClick={() => handleStatusChange(category)}
                isDisabled={isUpdatingStatus}
              >
                {isUpdatingStatus
                  ? "处理中..."
                  : category.isActive
                    ? "启用"
                    : "禁用"}
              </Chip>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                color="primary"
                variant="light"
                size="sm"
                onPress={() => handleCategoryClick(category)}
              >
                详情
              </Button>
              <Button
                color="danger"
                variant="light"
                size="sm"
                isLoading={isDeleting}
                onPress={() => handleDeleteCategory(category.id)}
              >
                删除
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
        toast.error("请输入分类名称", {
          description: "分类名称不能为空",
          duration: 4000,
        });

        return;
      }
      if (!newCategory.slug.trim()) {
        toast.error("请输入分类标识", {
          description: "分类标识用于URL，不能为空",
          duration: 4000,
        });

        return;
      }

      // 如果不是一级分类，必须选择父分类
      if (newCategory.level > 1 && !newCategory.parentId) {
        toast.error("请选择父级分类", {
          description: "创建子分类时必须选择上级分类",
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
        onClose();
        // 成功创建后立即更新数据
        await Promise.all([
          mutateAllCategories(), // 更新所有分类数据，这会刷新顶部标签
        ]);

        toast.success("分类创建成功", {
          description: `已成功创建分类"${name}"`,
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
      toast.error("分类创建失败", {
        description:
          error instanceof Error
            ? error.message
            : "创建过程中发生错误，请稍后重试",
        duration: 5000,
      });
    }
  }, [createCategory, mutateAllCategories, newCategory, onClose]);

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
        <p className="text-red-500">获取分类列表失败</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between mb-4">
        <div>
          <Tabs
            selectedKey={genderFilter || "all"}
            onSelectionChange={handleTabChange}
          >
            <Tab key="all" title="全部" />
            {genderCategories.map((cat) => (
              <Tab key={cat.id} title={cat.name} />
            ))}
          </Tabs>
        </div>
        <Button color="primary" onPress={onOpen}>
          添加分类
        </Button>
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => renderCategoryTree(category))}
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination
          total={totalPages || 1}
          page={page}
          onChange={handlePageChange}
        />
      </div>

      {/* 分类详情抽屉 */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        size="sm"
        placement="right"
      >
        <DrawerContent>
          <DrawerHeader>分类详情</DrawerHeader>
          <DrawerBody>
            {selectedCategory && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    名称
                  </label>
                  <p className="mt-1">{selectedCategory.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    标识
                  </label>
                  <p className="mt-1">{selectedCategory.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    描述
                  </label>
                  <p className="mt-1">
                    {selectedCategory.description || "暂无描述"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    层级
                  </label>
                  <p className="mt-1">
                    {selectedCategory.level === 1
                      ? "性别分类"
                      : selectedCategory.level === 2
                        ? "商品大类"
                        : "具体商品类型"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    父分类
                  </label>
                  <p className="mt-1">
                    {allCategories?.find(
                      (cat) => cat.id === selectedCategory.parentId,
                    )?.name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    子分类
                  </label>
                  <div className="mt-2 space-y-2">
                    {getChildCategories(selectedCategory.id).map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{child.name}</span>
                        <Chip
                          color={child.isActive ? "success" : "danger"}
                          variant="flat"
                          size="sm"
                        >
                          {child.isActive ? "启用" : "禁用"}
                        </Chip>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button color="primary" variant="light" onPress={onDrawerClose}>
              关闭
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>添加分类</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="分类层级"
                placeholder="请选择分类层级"
                selectedKeys={[String(newCategory.level)]}
                onChange={(e) => {
                  const level = Number(e.target.value);

                  setNewCategory({
                    ...newCategory,
                    level,
                    // 重置父分类ID
                    parentId: "",
                  });
                }}
                isRequired
              >
                <SelectItem key="1">性别分类</SelectItem>
                <SelectItem key="2">商品大类</SelectItem>
                <SelectItem key="3">具体商品类型</SelectItem>
              </Select>

              {newCategory.level === 2 && (
                <Select
                  label="选择性别分类"
                  placeholder="请选择性别分类"
                  selectedKeys={
                    newCategory.parentId ? [newCategory.parentId] : []
                  }
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, parentId: e.target.value })
                  }
                  isRequired
                >
                  {genderCategories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              )}

              {newCategory.level === 3 && (
                <>
                  <Select
                    label="选择性别分类"
                    placeholder="请先选择性别分类"
                    onChange={(e) => {
                      // 选择性别后，清空产品大类选择
                      setNewCategory({
                        ...newCategory,
                        parentId: "",
                        tempGenderId: e.target.value,
                      });
                    }}
                    isRequired
                  >
                    {genderCategories.map((cat) => (
                      <SelectItem key={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </Select>

                  {/* 如果已选择性别，显示对应的商品大类 */}
                  {newCategory.tempGenderId && (
                    <Select
                      label="选择商品大类"
                      placeholder="请选择商品大类"
                      selectedKeys={
                        newCategory.parentId ? [newCategory.parentId] : []
                      }
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          parentId: e.target.value,
                        })
                      }
                      isRequired
                    >
                      {productTypeCategories
                        .filter(
                          (cat) => cat.parentId === newCategory.tempGenderId,
                        )
                        .map((cat) => (
                          <SelectItem key={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </Select>
                  )}
                </>
              )}

              <Input
                label="分类名称"
                placeholder="请输入分类名称"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                isRequired
              />
              <Input
                label="分类标识"
                placeholder="请输入分类标识"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, slug: e.target.value })
                }
                isRequired
              />
              <Input
                label="分类描述"
                placeholder="请输入分类描述"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleCreateCategory}
              isLoading={isCreating}
            >
              确定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
