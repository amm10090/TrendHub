"use client";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  HelpCircle,
  TrendingUp,
  Building2,
  Package,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { CustomNavbar } from "@/components/custom-navbar";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Textarea,
  Switch,
  Spinner,
  Label,
  Checkbox,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  CustomPagination,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { cn } from "@/lib/utils";

// 更新 Brand 类型以包含 productCount
interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null; // 允许 null
  logo?: string | null; // 允许 null
  website?: string | null; // 允许 null
  isActive: boolean;
  popularity: boolean;
  productCount?: number; // 新增产品数量字段
  createdAt?: Date | string; // 创建时间
  updatedAt?: Date | string; // 更新时间
  // 如果API返回 _count 对象，也可以这样定义：
  // _count?: {
  //   products?: number;
  // };
}

export default function BrandsPage() {
  const t = useTranslations("brands");
  const tCommon = useTranslations("common");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    website: "",
    isActive: true,
    popularity: false,
  });
  const [formErrors, setFormErrors] = useState({
    name: false,
    slug: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 多选相关状态
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // 品牌预览相关状态
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewBrand, setPreviewBrand] = useState<Brand | null>(null);

  // 获取品牌列表
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/brands?${params}`);

        if (!response.ok) {
          throw new Error(t("fetchError"));
        }
        const data = await response.json();

        setBrands(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
        setError(null);
      } catch {
        setError(error instanceof Error ? error.message : t("fetchError"));
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit]);

  // 更新全选状态
  useEffect(() => {
    if (brands.length > 0) {
      const allSelected = brands.every((brand) => selectedBrands.has(brand.id));

      setIsSelectAll(allSelected);
    }
  }, [selectedBrands, brands]);

  // 处理分页变更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedBrands(new Set()); // 清除选择
  };

  // 处理每页条数变更
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // 重置到第一页
    setSelectedBrands(new Set()); // 清除选择
  };

  // 处理单个选择
  const handleSelectBrand = (brandId: string, checked: boolean) => {
    const newSelected = new Set(selectedBrands);

    if (checked) {
      newSelected.add(brandId);
    } else {
      newSelected.delete(brandId);
    }
    setSelectedBrands(newSelected);
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allBrandIds = new Set(brands.map((brand) => brand.id));

      setSelectedBrands(allBrandIds);
    } else {
      setSelectedBrands(new Set());
    }
    setIsSelectAll(checked);
  };

  // 批量操作处理
  const handleBulkOperation = async (action: string) => {
    if (selectedBrands.size === 0) {
      toast.error(t("bulkActions.noSelection"));

      return;
    }

    if (action === "delete") {
      setShowDeleteDialog(true);

      return;
    }

    try {
      setIsBulkOperating(true);
      const response = await fetch("/api/brands", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedBrands),
        }),
      });

      if (!response.ok) {
        throw new Error(t("bulkActions.bulkUpdateError"));
      }

      const result = await response.json();

      // 刷新品牌列表
      const updatedResponse = await fetch("/api/brands");

      if (updatedResponse.ok) {
        const data = await updatedResponse.json();

        setBrands(data.items || []);
      }

      // 清除选择
      setSelectedBrands(new Set());

      // 显示成功消息
      const successKey = `bulkActions.bulk${action.charAt(0).toUpperCase() + action.slice(1)}Success`;

      toast.success(t(successKey, { count: result.count }));
    } catch {
      toast.error(t("bulkActions.bulkUpdateError"));
    } finally {
      setIsBulkOperating(false);
    }
  };

  // 确认批量删除
  const handleConfirmBulkDelete = async () => {
    try {
      setIsBulkOperating(true);
      const response = await fetch("/api/brands", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          ids: Array.from(selectedBrands),
        }),
      });

      if (!response.ok) {
        throw new Error(t("bulkActions.bulkDeleteError"));
      }

      const result = await response.json();

      // 从列表中移除删除的品牌
      setBrands((prev) =>
        prev.filter((brand) => !selectedBrands.has(brand.id)),
      );

      // 清除选择
      setSelectedBrands(new Set());
      setShowDeleteDialog(false);

      // 显示成功消息
      toast.success(
        t("bulkActions.bulkDeleteSuccess", { count: result.count }),
      );
    } catch {
      toast.error(t("bulkActions.bulkDeleteError"));
    } finally {
      setIsBulkOperating(false);
    }
  };

  // 处理品牌状态切换
  const handleToggleBrandStatus = async (
    brandId: string,
    isActive: boolean,
  ) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error(t("updateError"));
      }

      const updatedBrand = await response.json();

      // 更新品牌列表
      setBrands((prev) =>
        prev.map((brand) => (brand.id === brandId ? updatedBrand : brand)),
      );

      // 显示成功提示
      toast.success(
        t("statusUpdateSuccess", {
          status: !isActive ? t("status.active") : t("status.inactive"),
        }),
      );
    } catch {
      toast.error(t("updateError"));
    }
  };

  // 处理删除品牌
  const handleDeleteBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("deleteError"));
      }

      // 从列表中移除品牌
      setBrands((prev) => prev.filter((brand) => brand.id !== brandId));

      // 显示成功提示
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  // 打开添加品牌抽屉
  const handleOpenDrawer = () => {
    setEditingBrand(null);
    setNewBrand({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      isActive: true,
      popularity: false,
    });
    setIsDrawerOpen(true);
  };

  // 打开编辑品牌抽屉
  const handleOpenEditDrawer = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrand({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo: brand.logo || "",
      website: brand.website || "",
      isActive: brand.isActive,
      popularity: brand.popularity,
    });
    setIsDrawerOpen(true);
  };

  // 打开品牌预览对话框
  const handleOpenPreview = (brand: Brand) => {
    setPreviewBrand(brand);
    setShowPreviewDialog(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBrand(null);
    // 重置表单
    setNewBrand({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      isActive: true,
      popularity: false,
    });
    // 重置错误状态
    setFormErrors({
      name: false,
      slug: false,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setNewBrand((prev) => ({ ...prev, [name]: value }));

    // 清除该字段的错误状态
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const handleSwitchChange = (
    isSelected: boolean,
    field: "isActive" | "popularity",
  ) => {
    setNewBrand((prev) => ({ ...prev, [field]: isSelected }));
  };

  const generateSlug = () => {
    if (newBrand.name) {
      const slug = newBrand.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // 移除非单词/空格/连字符字符
        .replace(/\s+/g, "-") // 将空格替换为连字符
        .replace(/-+/g, "-"); // 将多个连字符替换为单个连字符

      setNewBrand((prev) => ({ ...prev, slug }));
      // 更新验证状态
      setFormErrors((prev) => ({
        ...prev,
        slug: false,
      }));
    }
  };

  const handleNameBlur = () => {
    // 如果slug为空，则根据name自动生成slug
    if (newBrand.name && !newBrand.slug) {
      generateSlug();
    }
  };

  // 处理添加或更新品牌
  const handleSaveBrand = async () => {
    // 表单验证
    const errors = {
      name: !newBrand.name.trim(),
      slug: !newBrand.slug.trim(),
    };

    setFormErrors(errors);

    // 如果有错误，不提交
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 判断是编辑还是新增
      if (editingBrand) {
        // 编辑品牌
        const response = await fetch(`/api/brands/${editingBrand.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newBrand),
        });

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.error || t("updateError"));
        }

        const updatedBrand = await response.json();

        // 更新品牌列表
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === editingBrand.id ? updatedBrand : brand,
          ),
        );

        // 显示成功提示
        toast.success(t("updateSuccess"));
      } else {
        // 新增品牌
        const response = await fetch("/api/brands", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newBrand),
        });

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.error || t("createError"));
        }

        const createdBrand = await response.json();

        // 更新品牌列表
        setBrands((prev) => [...prev, createdBrand]);

        // 显示成功提示
        toast.success(t("createSuccess"));
      }

      // 关闭抽屉
      handleCloseDrawer();
    } catch {
      const errorMessage =
        error instanceof Error ? error.message : t("operationError");

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* 页面头部 - 优化后的设计 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold tracking-tight">
                  {t("title")}
                </h2>
              </div>
              <p className="text-muted-foreground">
                {t("description", {
                  default: "管理您的品牌库，包括品牌信息、状态和关联产品。",
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {t("help.title", { default: "帮助" })}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t("help.title")}</DialogTitle>
                    <DialogDescription>
                      {t("help.brandManagement")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <h3 className="font-semibold">
                        {t("help.addEditBrands", { default: "添加/编辑品牌" })}
                      </h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>
                          <strong>
                            {t("help.nameAndSlugRequired", {
                              default: "品牌名称和URL标识",
                            })}
                          </strong>
                          {t("help.nameAndSlugDescription", {
                            default:
                              "是必填项。URL标识会自动生成但也可以自定义。",
                          })}
                        </li>
                        <li>
                          <strong>
                            {t("help.brandLogo", { default: "品牌Logo" })}
                          </strong>
                          {t("help.logoDescription", {
                            default:
                              "支持上传或使用外部URL，建议使用正方形图片。",
                          })}
                        </li>
                        <li>
                          <strong>
                            {t("help.brandStatus", { default: "品牌状态" })}
                          </strong>
                          {t("help.statusDescription", {
                            default: "控制品牌是否在前端网站显示。",
                          })}
                        </li>
                        <li>
                          <strong>
                            {t("help.popularBrand", { default: "热门品牌" })}
                          </strong>
                          {t("help.popularDescription", {
                            default: "设置后，品牌会出现在前端热门品牌列表中。",
                          })}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {t("help.bulkOperations", { default: "批量操作" })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("help.bulkOperationsDescription", {
                          default:
                            "选中多个品牌后，您可以进行批量激活、禁用、设为热门、取消热门或删除等操作。",
                        })}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button color="primary" onClick={handleOpenDrawer}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addBrand")}
              </Button>
            </div>
          </div>

          {/* 统计信息卡片 */}
          {!isLoading && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("stats.totalBrands", { default: "总品牌数" })}
                    </p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("stats.activeBrands", { default: "激活品牌" })}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {brands.filter((b) => b.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("stats.popularBrands", { default: "热门品牌" })}
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {brands.filter((b) => b.popularity).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 批量操作工具栏 */}
        {selectedBrands.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t("bulkActions.selectedCount", { count: selectedBrands.size })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation("activate")}
                disabled={isBulkOperating}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("bulkActions.activate")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation("deactivate")}
                disabled={isBulkOperating}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t("bulkActions.deactivate")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation("setPopular")}
                disabled={isBulkOperating}
              >
                <Star className="mr-2 h-4 w-4" />
                {t("bulkActions.setPopular")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation("unsetPopular")}
                disabled={isBulkOperating}
              >
                <StarOff className="mr-2 h-4 w-4" />
                {t("bulkActions.unsetPopular")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkOperation("delete")}
                disabled={isBulkOperating}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("bulkActions.delete")}
              </Button>
            </div>
          </div>
        )}

        {/* 品牌列表表格 */}
        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : brands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t("noData")}</div>
          ) : (
            <Table aria-label={t("title")}>
              <TableHeader>
                <TableRow>
                  <TableColumn>
                    <Checkbox
                      checked={isSelectAll}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label={
                        isSelectAll
                          ? t("bulkActions.deselectAll")
                          : t("bulkActions.selectAll")
                      }
                    />
                  </TableColumn>
                  <TableColumn>{t("columns.brand")}</TableColumn>
                  <TableColumn>{t("columns.products")}</TableColumn>
                  <TableColumn>{t("columns.website")}</TableColumn>
                  <TableColumn className="text-center">
                    {t("columns.status")}
                  </TableColumn>
                  <TableColumn className="text-right">
                    {t("columns.actions")}
                  </TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBrands.has(brand.id)}
                        onCheckedChange={(checked) =>
                          handleSelectBrand(brand.id, !!checked)
                        }
                        aria-label={`Select ${brand.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-2 shadow-sm">
                          {brand.logo ? (
                            <>
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-contain rounded-md"
                              />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg rounded-lg">
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {brand.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            /{brand.slug}
                          </div>
                          {brand.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1 max-w-xs">
                              {brand.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {brand.productCount ?? 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          {t("columns.productsUnit", { default: "个产品" })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {brand.website ? (
                          <a
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm truncate"
                          >
                            <Globe className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {brand.website.replace(/^https?:\/\//, "")}
                            </span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {t("common.noWebsite", { default: "未设置" })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            brand.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              brand.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {brand.isActive
                            ? t("status.active")
                            : t("status.inactive")}
                        </div>
                        {brand.popularity && (
                          <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                            <Star className="h-3 w-3 fill-current" />
                            {t("status.popular")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent">
                            <span className="sr-only">
                              {t("columns.actions")}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            key="title"
                            disabled
                            className="font-semibold"
                          >
                            {t("actions.title")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="preview"
                            onClick={() => handleOpenPreview(brand)}
                            className="flex items-center gap-2"
                          >
                            <Building2 className="h-4 w-4" />
                            {t("actions.preview", { default: "预览" })}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="edit"
                            onClick={() => handleOpenEditDrawer(brand)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="toggle-status"
                            onClick={() =>
                              handleToggleBrandStatus(brand.id, brand.isActive)
                            }
                            className="flex items-center gap-2"
                          >
                            {brand.isActive ? (
                              <>
                                <XCircle className="h-4 w-4" />
                                {t("actions.deactivate")}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                {t("actions.activate")}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="delete"
                            className="text-danger flex items-center gap-2"
                            onClick={() => handleDeleteBrand(brand.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* 分页组件 */}
        {!isLoading && brands.length > 0 && (
          <CustomPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            pageSize={limit}
            onPageSizeChange={handleLimitChange}
            showPageSizeSelector={true}
            showPaginationInfo={true}
          />
        )}
      </div>

      {/* 添加/编辑品牌抽屉 */}
      <Drawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        placement="right"
        size="md"
      >
        <DrawerContent className="h-full flex flex-col">
          <DrawerHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {editingBrand ? t("drawer.editTitle") : t("drawer.addTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {editingBrand
                    ? t("drawer.editDescription")
                    : t("drawer.addDescription")}
                </p>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="flex flex-col gap-4 pb-4">
              {/* 基本信息部分 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t("drawer.basicInfo", { default: "基本信息" })}
                  </h4>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand-name" className="text-sm font-medium">
                      {t("drawer.nameLabel")}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="brand-name"
                      name="name"
                      value={newBrand.name}
                      onChange={handleInputChange}
                      onBlur={handleNameBlur}
                      placeholder={t("drawer.namePlaceholder", {
                        default: "例如：Apple, Nike, 阿迪达斯",
                      })}
                      className={cn(
                        "transition-all duration-200",
                        formErrors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "focus:border-blue-500 focus:ring-blue-500/20",
                      )}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500">
                      {t("drawer.nameHint", {
                        default: "品牌的正式名称，将在网站上显示",
                      })}
                    </p>
                    {formErrors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {t("drawer.nameError")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-slug" className="text-sm font-medium">
                      {t("drawer.slugLabel", { default: "URL标识" })}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          id="brand-slug"
                          name="slug"
                          value={newBrand.slug}
                          onChange={handleInputChange}
                          placeholder={t("drawer.slugPlaceholder", {
                            default: "apple, nike, adidas",
                          })}
                          className={cn(
                            "transition-all duration-200 font-mono text-sm",
                            formErrors.slug
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                              : "focus:border-blue-500 focus:ring-blue-500/20",
                            editingBrand && "bg-gray-50 dark:bg-gray-800",
                          )}
                          disabled={!!editingBrand}
                        />
                      </div>
                      {!editingBrand && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateSlug}
                          className="shrink-0"
                        >
                          {t("drawer.generateSlug", { default: "自动生成" })}
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        {t("drawer.slugDescription", {
                          default:
                            "用于生成品牌页面URL，只能包含小写字母、数字和连字符",
                        })}
                      </p>
                      <p className="text-blue-600">
                        {t("drawer.slugPreview", { default: "预览" })}: /brands/
                        {newBrand.slug || "brand-name"}
                      </p>
                    </div>
                    {formErrors.slug && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {t("drawer.slugError")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 品牌资源部分 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Globe className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t("drawer.brandAssets", { default: "品牌资源" })}
                  </h4>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand-logo" className="text-sm font-medium">
                      {t("drawer.logoLabel", { default: "品牌Logo" })}
                    </Label>
                    <div className="space-y-3">
                      <ImageUploadField
                        value={newBrand.logo}
                        onChange={(url) =>
                          setNewBrand((prev) => ({ ...prev, logo: url || "" }))
                        }
                        label=""
                        placeholder={t("drawer.logoPlaceholder", {
                          default: "上传品牌Logo或输入URL",
                        })}
                      />
                      {newBrand.logo && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="h-12 w-12 rounded-lg bg-white shadow-sm p-1">
                            <Image
                              src={newBrand.logo}
                              alt="Logo预览"
                              width={48}
                              height={48}
                              className="h-full w-full object-contain rounded-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Logo预览
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {newBrand.logo}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("drawer.logoHint", {
                        default: "建议上传正方形的PNG或SVG格式，大小不超过2MB",
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="brand-website"
                      className="text-sm font-medium"
                    >
                      {t("drawer.websiteLabel", { default: "官方网站" })}
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="brand-website"
                        name="website"
                        value={newBrand.website}
                        onChange={handleInputChange}
                        placeholder={t("drawer.websitePlaceholder", {
                          default: "https://www.example.com",
                        })}
                        className="pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("drawer.websiteHint", {
                        default: "品牌的官方网站链接，用户可点击访问",
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="brand-description"
                      className="text-sm font-medium"
                    >
                      {t("drawer.descriptionLabel", { default: "品牌描述" })}
                    </Label>
                    <Textarea
                      id="brand-description"
                      name="description"
                      value={newBrand.description}
                      onChange={handleInputChange}
                      placeholder={t("drawer.descriptionPlaceholder", {
                        default: "简要描述这个品牌的特色、历史或定位...",
                      })}
                      minRows={3}
                      className="transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {t("drawer.descriptionHint", {
                          default: "可选填写，帮助用户了解品牌",
                        })}
                      </span>
                      <span>{newBrand.description.length}/500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 状态设置部分 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t("drawer.statusSettings", { default: "状态设置" })}
                  </h4>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                    <div className="flex items-start gap-3">
                      <CheckCircle
                        className={`h-5 w-5 mt-0.5 ${
                          newBrand.isActive ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t("drawer.statusLabel", { default: "品牌状态" })}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {newBrand.isActive
                            ? t("drawer.statusActiveDesc", {
                                default:
                                  "品牌已激活，将在前端显示并可供用户浏览",
                              })
                            : t("drawer.statusInactiveDesc", {
                                default: "品牌已停用，不会在前端显示",
                              })}
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={newBrand.isActive}
                      onValueChange={(isSelected) =>
                        handleSwitchChange(isSelected, "isActive")
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
                    <div className="flex items-start gap-3">
                      <Star
                        className={`h-5 w-5 mt-0.5 ${
                          newBrand.popularity
                            ? "text-orange-600 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t("drawer.popularityLabel", {
                            default: "热门品牌",
                          })}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {newBrand.popularity
                            ? t("drawer.popularityActiveDesc", {
                                default:
                                  "设为热门品牌，将在前端品牌列表页的&quot;热门品牌&quot;区域优先展示",
                              })
                            : t("drawer.popularityInactiveDesc", {
                                default: "普通品牌，按正常顺序展示",
                              })}
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={newBrand.popularity}
                      onValueChange={(isSelected) =>
                        handleSwitchChange(isSelected, "popularity")
                      }
                      color="warning"
                    />
                  </div>
                </div>

                {/* 设置提示信息 */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">
                        {t("drawer.settingsTips", { default: "设置提示" })}
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>
                          {t("drawer.tip1", {
                            default: "只有激活的品牌才会在前端显示",
                          })}
                        </li>
                        <li>
                          {t("drawer.tip2", {
                            default: "热门品牌会在首页和分类页面优先展示",
                          })}
                        </li>
                        <li>
                          {t("drawer.tip3", {
                            default: "可以随时修改这些设置",
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="border-t bg-gray-50 dark:bg-gray-900/50 p-6 flex-shrink-0">
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCloseDrawer}
                disabled={isSubmitting}
                className="min-w-[80px]"
              >
                {t("drawer.cancel", { default: "取消" })}
              </Button>
              <Button
                color="primary"
                onClick={handleSaveBrand}
                disabled={
                  isSubmitting || !newBrand.name.trim() || !newBrand.slug.trim()
                }
                className="min-w-[120px] shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>{t("drawer.saving", { default: "保存中..." })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {editingBrand ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>{t("drawer.save", { default: "保存更改" })}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>{t("drawer.add", { default: "添加品牌" })}</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulkActions.confirmDelete", { count: selectedBrands.size })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkActions.confirmDeleteMessage", {
                count: selectedBrands.size,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkOperating}>
              {t("drawer.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkOperating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkOperating ? (
                <span className="flex items-center">
                  <Spinner className="mr-2 h-4 w-4" />
                  {tCommon("deleting")}
                </span>
              ) : (
                t("actions.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 品牌预览对话框 */}
      <AlertDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <AlertDialogTitle>
                  {t("preview.title", { default: "品牌预览" })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("preview.description", { default: "查看品牌的详细信息" })}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {previewBrand && (
            <div className="space-y-6 py-4">
              {/* 品牌基本信息 */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-3 shadow-sm">
                  {previewBrand.logo ? (
                    <Image
                      src={previewBrand.logo}
                      alt={previewBrand.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl rounded-lg">
                      {previewBrand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {previewBrand.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    /{previewBrand.slug}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        previewBrand.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          previewBrand.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {previewBrand.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </div>
                    {previewBrand.popularity && (
                      <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        <Star className="h-3 w-3 fill-current" />
                        {t("status.popular")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 详细信息网格 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("preview.website", { default: "官方网站" })}
                    </label>
                    <div className="mt-1">
                      {previewBrand.website ? (
                        <a
                          href={previewBrand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Globe className="h-3 w-3" />
                          {previewBrand.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {t("common.noWebsite", { default: "未设置" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("preview.products", { default: "关联产品" })}
                    </label>
                    <div className="mt-1 flex items-center gap-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {previewBrand.productCount ?? 0}{" "}
                        {t("columns.productsUnit", { default: "个产品" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("preview.descriptionLabel", { default: "品牌描述" })}
                  </label>
                  <div className="mt-1">
                    {previewBrand.description ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {previewBrand.description}
                      </p>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {t("preview.noDescription", { default: "暂无描述" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">
                      {t("preview.createdAt", { default: "创建时间" })}:{" "}
                    </span>
                    <span>
                      {new Date(previewBrand.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("preview.updatedAt", { default: "更新时间" })}:{" "}
                    </span>
                    <span>
                      {new Date(previewBrand.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("preview.close", { default: "关闭" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => previewBrand && handleOpenEditDrawer(previewBrand)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("preview.edit", { default: "编辑品牌" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
