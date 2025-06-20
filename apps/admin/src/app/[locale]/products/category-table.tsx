"use client";

import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  FolderTree,
  Home,
  Info,
  Layers,
  MoreVertical,
  Package2,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCategories } from "@/hooks/use-categories";
import type { Category } from "@/lib/services/category.service";
import { cn } from "@/lib/utils";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  level: number;
  parentId: string;
  showInNavbar?: boolean;
}

// 扩展Category类型以包含children属性
interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// 树形节点组件
interface TreeNodeProps {
  category: CategoryWithChildren;
  level: number;
  expandedCategories: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onToggleNavbar?: (id: string, showInNavbar: boolean) => void;
  searchQuery: string;
}

function TreeNode({
  category,
  level,
  expandedCategories,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleNavbar,
  searchQuery,
}: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0;
  const tCat = useTranslations("categories");
  const isExpanded = expandedCategories.has(category.id);

  // 高亮搜索关键词
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // 根据层级选择图标和颜色
  const getIconAndColor = () => {
    switch (category.level) {
      case 1:
        return {
          icon: isExpanded ? FolderOpen : Folder,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
        };
      case 2:
        return {
          icon: Package2,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        };
      case 3:
        return {
          icon: Tag,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
        };
      default:
        return {
          icon: Folder,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  const { icon: Icon, color, bgColor } = getIconAndColor();

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors",
          searchQuery && "animate-in fade-in-0 slide-in-from-left-1",
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(category.id)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* 图标和名称 */}
        <div
          role="button"
          tabIndex={0}
          className={cn("flex items-center gap-2 flex-1 cursor-pointer")}
          onClick={() => onEdit(category)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onEdit(category);
          }}
        >
          <div className={cn("p-1.5 rounded", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <span className="font-medium text-sm">
            {highlightText(category.name)}
          </span>

          {/* 状态标签 */}
          <div className="flex items-center gap-1 ml-2">
            {!category.isActive && (
              <Badge variant="secondary" className="text-xs h-5">
                {tCat("tree.badgeDisabled")}
              </Badge>
            )}
            {category.level === 2 && category.showInNavbar && (
              <Badge variant="outline" className="text-xs h-5">
                <Eye className="h-3 w-3 mr-1" />
                {tCat("tree.badgeNavbar")}
              </Badge>
            )}
          </div>
        </div>

        {/* 操作菜单 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit2 className="h-4 w-4 mr-2" />
                {tCat("tree.menuEdit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus(category.id, !category.isActive)}
              >
                {category.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {tCat("tree.menuDisable")}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {tCat("tree.menuEnable")}
                  </>
                )}
              </DropdownMenuItem>
              {category.level === 2 && onToggleNavbar && (
                <DropdownMenuItem
                  onClick={() =>
                    onToggleNavbar(category.id, !category.showInNavbar)
                  }
                >
                  <Home className="h-4 w-4 mr-2" />
                  {category.showInNavbar
                    ? tCat("tree.menuRemoveFromNavbar")
                    : tCat("tree.menuAddToNavbar")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCat("tree.menuDelete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* 连接线 */}
          {category.children.map((child) => (
            <div key={child.id} className="relative">
              {/* 垂直连接线 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border"
                style={{ left: `${(level + 1) * 24 - 4}px` }}
              />
              {/* 水平连接线 */}
              <div
                className="absolute top-4 h-px bg-border"
                style={{
                  left: `${(level + 1) * 24 - 4}px`,
                  width: "20px",
                }}
              />
              <TreeNode
                category={child}
                level={level + 1}
                expandedCategories={expandedCategories}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onToggleNavbar={onToggleNavbar}
                searchQuery={searchQuery}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTable() {
  const tCat = useTranslations("categories");
  const tProd = useTranslations("products");
  const tCommon = useTranslations("common");

  // 状态管理
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );

  // 获取分类数据
  const {
    categories,
    isLoading,
    isError,
    isCreating,
    createCategory,
    deleteCategory,
    updateCategoryStatus,
    updateCategory,
    mutateCategories,
  } = useCategories({
    limit: 999,
  });

  const [newCategory, setNewCategory] = useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    level: 1,
    parentId: "",
    showInNavbar: false,
  });

  // 构建分类树
  const categoryTree = useMemo(() => {
    if (!categories) return [];

    const level1Categories = categories
      .filter((cat) => cat.level === 1)
      .sort((a, b) => a.name.localeCompare(b.name));

    const buildTree = (parent: Category): CategoryWithChildren => {
      const children = categories
        .filter(
          (cat) => cat.level === parent.level + 1 && cat.parentId === parent.id,
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => buildTree(child));

      return { ...parent, children };
    };

    return level1Categories.map((parent) => buildTree(parent));
  }, [categories]);

  // 过滤分类树
  const filteredTree = useMemo(() => {
    if (!searchQuery && !selectedLevel) return categoryTree;

    const filterTree = (
      nodes: CategoryWithChildren[],
    ): CategoryWithChildren[] => {
      return nodes.reduce((acc: CategoryWithChildren[], node) => {
        const matchesSearch =
          !searchQuery ||
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLevel = !selectedLevel || node.level === selectedLevel;

        const filteredChildren = filterTree(node.children);

        if (matchesSearch || filteredChildren.length > 0) {
          if (matchesLevel || filteredChildren.length > 0) {
            acc.push({
              ...node,
              children: filteredChildren,
            });
          }
        }

        return acc;
      }, []);
    };

    const filtered = filterTree(categoryTree);

    // 展开所有包含搜索结果的分类
    if (searchQuery) {
      const expandAll = (nodes: CategoryWithChildren[]) => {
        nodes.forEach((node) => {
          if (node.children.length > 0) {
            setExpandedCategories((prev) => new Set([...prev, node.id]));
            expandAll(node.children);
          }
        });
      };

      expandAll(filtered);
    }

    return filtered;
  }, [categoryTree, searchQuery, selectedLevel]);

  // 统计信息
  const stats = useMemo(() => {
    if (!categories)
      return {
        total: 0,
        level1: 0,
        level2: 0,
        level3: 0,
        active: 0,
        navbar: 0,
      };

    return {
      total: categories.length,
      level1: categories.filter((c) => c.level === 1).length,
      level2: categories.filter((c) => c.level === 2).length,
      level3: categories.filter((c) => c.level === 3).length,
      active: categories.filter((c) => c.isActive).length,
      navbar: categories.filter((c) => c.level === 2 && c.showInNavbar).length,
    };
  }, [categories]);

  // 处理展开/收缩
  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }

      return newSet;
    });
  }, []);

  // 处理编辑分类
  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      level: category.level,
      parentId: category.parentId || "",
      showInNavbar: category.showInNavbar,
    });
    setIsAddModalOpen(true);
  }, []);

  // 处理创建/更新分类
  const handleSaveCategory = useCallback(async () => {
    try {
      if (!newCategory.name.trim() || !newCategory.slug.trim()) {
        toast.error(tCat("validation.nameRequiredTitle"), {
          description: tCat("validation.nameRequiredDesc"),
        });

        return;
      }

      if (newCategory.level > 1 && !newCategory.parentId) {
        toast.error(tCat("validation.parentRequiredTitle"), {
          description: tCat("validation.parentRequiredDesc"),
        });

        return;
      }

      const categoryData = {
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        level: Number(newCategory.level),
        ...(newCategory.level > 1 ? { parentId: newCategory.parentId } : {}),
        ...(newCategory.level === 2
          ? { showInNavbar: newCategory.showInNavbar }
          : {}),
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast.success(tCat("updateSuccessTitle"), {
          description: tCat("updateSuccessDesc", { name: newCategory.name }),
        });
      } else {
        await createCategory(categoryData);
        toast.success(tCat("createSuccessTitle"), {
          description: tCat("createSuccessDesc", { name: newCategory.name }),
        });
      }

      setIsAddModalOpen(false);
      setEditingCategory(null);
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        level: 1,
        parentId: "",
        showInNavbar: false,
      });
      await mutateCategories();
    } catch (error) {
      toast.error(
        editingCategory ? tCat("updateErrorTitle") : tCat("createErrorTitle"),
        {
          description:
            error instanceof Error
              ? error.message
              : editingCategory
                ? tCat("updateErrorDesc", { name: newCategory.name })
                : tCat("createErrorDesc"),
        },
      );
    }
  }, [
    createCategory,
    updateCategory,
    mutateCategories,
    newCategory,
    editingCategory,
    tCat,
  ]);

  // 处理删除
  const handleDelete = useCallback(
    (id: string) => {
      setDeleteCandidateId(id);
    },
    [setDeleteCandidateId],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidateId) return;

    try {
      await deleteCategory(deleteCandidateId);
      toast.success(tCat("deleteSuccessTitle"));
    } catch {
      toast.error(tCat("deleteErrorTitle"));
    } finally {
      setDeleteCandidateId(null);
    }
  }, [deleteCandidateId, deleteCategory, tCat]);

  // 处理状态切换
  const handleToggleStatus = useCallback(
    async (id: string, isActive: boolean) => {
      const category = categories?.find((c) => c.id === id);

      if (!category) return;

      try {
        await updateCategoryStatus(id, isActive);
        toast.success(tCat("statusUpdateSuccessTitle"), {
          description: tCat("statusUpdateSuccessDesc", {
            name: category.name,
            status: tProd(isActive ? "active" : "inactive"),
          }),
        });
      } catch {
        toast.error(tCat("statusUpdateErrorTitle"));
      }
    },
    [categories, updateCategoryStatus, tCat, tProd],
  );

  // 处理导航栏显示切换
  const handleToggleNavbar = useCallback(
    async (id: string, showInNavbar: boolean) => {
      const category = categories?.find((c) => c.id === id);

      if (!category) return;

      try {
        await updateCategory(id, { showInNavbar });
        await mutateCategories();
        toast.success(tCat("updateSuccessTitle"), {
          description: tCat("navbarUpdateSuccessDesc", {
            name: category.name,
            action: showInNavbar ? tCat("navbarAdded") : tCat("navbarRemoved"),
          }),
        });
      } catch {
        toast.error(tCat("updateErrorTitle"));
      }
    },
    [categories, updateCategory, mutateCategories, tCat],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-destructive">{tCat("fetchError")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* 页面头部 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">{tCat("title")}</h2>
              <p className="text-muted-foreground">{tCat("description")}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setNewCategory({
                name: "",
                slug: "",
                description: "",
                level: 1,
                parentId: "",
                showInNavbar: false,
              });
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {tCat("addCategory")}
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.total")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.total}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.level1")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.level1}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.level2")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.level2}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-600" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.level3")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.level3}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.active")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.active}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-orange-600" />
                <div>
                  <CardDescription className="text-xs">
                    {tCat("stats.navbar")}
                  </CardDescription>
                  <CardTitle className="text-xl">{stats.navbar}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tCat("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedLevel?.toString() || "all"}
            onValueChange={(value) =>
              setSelectedLevel(value === "all" ? null : Number(value))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={tCat("filter.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCat("filter.allLevels")}</SelectItem>
              <SelectItem value="1">{tCat("filter.level1only")}</SelectItem>
              <SelectItem value="2">{tCat("filter.level2only")}</SelectItem>
              <SelectItem value="3">{tCat("filter.level3only")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (expandedCategories.size === categoryTree.length) {
                setExpandedCategories(new Set());
              } else {
                const allIds = new Set<string>();

                categoryTree.forEach((cat) => {
                  allIds.add(cat.id);
                  cat.children.forEach((child) => allIds.add(child.id));
                });
                setExpandedCategories(allIds);
              }
            }}
          >
            {expandedCategories.size === categoryTree.length ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 提示信息 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span>
              {tCat.rich("help.structureInfo", {
                level1: (chunks) => (
                  <span className="font-medium text-blue-600">{chunks}</span>
                ),
                level2: (chunks) => (
                  <span className="font-medium text-emerald-600">{chunks}</span>
                ),
                level3: (chunks) => (
                  <span className="font-medium text-purple-600">{chunks}</span>
                ),
              })}
            </span>
          </AlertDescription>
        </Alert>
      </div>

      {/* 分类树 */}
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="p-4">
            {filteredTree.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || selectedLevel
                  ? tCat("table.noMatch")
                  : tCat("table.noData")}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTree.map((category) => (
                  <TreeNode
                    key={category.id}
                    category={category}
                    level={0}
                    expandedCategories={expandedCategories}
                    onToggleExpand={handleToggleExpand}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onToggleNavbar={handleToggleNavbar}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加/编辑分类对话框 */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? tCat("editTitle") : tCat("addTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? tCat("editDescription")
                : tCat("createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 层级选择 */}
            {!editingCategory && (
              <div className="space-y-2">
                <Label>{tCat("form.selectLevel")}</Label>
                <Tabs
                  value={String(newCategory.level)}
                  onValueChange={(v) =>
                    setNewCategory({
                      ...newCategory,
                      level: Number(v),
                      parentId: "",
                    })
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="1">
                      <Users className="h-4 w-4 mr-2" />
                      {tCat("form.level1Name")}
                    </TabsTrigger>
                    <TabsTrigger value="2">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {tCat("form.level2Name")}
                    </TabsTrigger>
                    <TabsTrigger value="3">
                      <Tag className="h-4 w-4 mr-2" />
                      {tCat("form.level3Name")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* 父分类选择 */}
            {newCategory.level > 1 && (
              <div className="space-y-2">
                <Label>{tCat("form.selectParent")}</Label>
                <Select
                  value={newCategory.parentId}
                  onValueChange={(value) =>
                    setNewCategory({ ...newCategory, parentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tCat("form.selectParentPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      ?.filter((cat) => cat.level === newCategory.level - 1)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 基本信息 */}
            <div className="space-y-2">
              <Label>{tCat("nameLabel")}</Label>
              <Input
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder={tCat("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{tCat("slugLabel")}</Label>
              <Input
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, slug: e.target.value })
                }
                placeholder={tCat("slugPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{tCat("descriptionLabel")}</Label>
              <Input
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                placeholder={tCat("descriptionPlaceholder")}
              />
            </div>

            {/* 导航栏显示开关 */}
            {newCategory.level === 2 && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{tCat("showInNavbarLabel")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {tCat("showInNavbarTooltip")}
                  </p>
                </div>
                <Switch
                  checked={newCategory.showInNavbar}
                  onCheckedChange={(checked) =>
                    setNewCategory({ ...newCategory, showInNavbar: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSaveCategory} disabled={isCreating}>
              {isCreating
                ? `${tCommon("saving")}...`
                : editingCategory
                  ? tCommon("saveChanges")
                  : tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleteCandidateId}
        onOpenChange={(open) => !open && setDeleteCandidateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tCat("deleteConfirmationTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tCat("deleteConfirmation", {
                name:
                  categories?.find((c) => c.id === deleteCandidateId)?.name ??
                  "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
