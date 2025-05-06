"use client";
import { Plus } from "lucide-react";
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
} from "@/components/ui";
import { Brand } from "@/lib/services/brand.service";
import { cn } from "@/lib/utils";

export default function BrandsPage() {
  const t = useTranslations("brands");
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

  // 获取品牌列表
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/brands");

        if (!response.ok) {
          throw new Error(t("fetchError"));
        }
        const data = await response.json();

        setBrands(data.items || []);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : t("fetchError"));
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch (error) {
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <div className="flex items-center space-x-2">
            <Button color="primary" onClick={handleOpenDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addBrand")}
            </Button>
          </div>
        </div>

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
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-100 p-1 mr-3">
                          {brand.logo ? (
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Image
                              src={`/placeholder.svg?height=40&width=40&text=${brand.name.charAt(0)}`}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                        {brand.name}
                      </div>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>{brand.website || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          brand.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {brand.isActive
                          ? t("status.active")
                          : t("status.inactive")}
                      </div>
                      {brand.popularity && (
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 ml-2">
                          {t("status.popular")}
                        </div>
                      )}
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
                            key="edit"
                            onClick={() => handleOpenEditDrawer(brand)}
                          >
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="toggle-status"
                            onClick={() =>
                              handleToggleBrandStatus(brand.id, brand.isActive)
                            }
                          >
                            {brand.isActive
                              ? t("actions.deactivate")
                              : t("actions.activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="delete"
                            className="text-danger"
                            onClick={() => handleDeleteBrand(brand.id)}
                          >
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
      </div>

      {/* 添加/编辑品牌抽屉 */}
      <Drawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        placement="right"
        size="sm"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">
              {editingBrand ? t("drawer.editTitle") : t("drawer.addTitle")}
            </h3>
            <p className="text-sm text-default-500">
              {editingBrand
                ? t("drawer.editDescription")
                : t("drawer.addDescription")}
            </p>
          </DrawerHeader>
          <DrawerBody>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand-name">{t("drawer.nameLabel")}</Label>
                <Input
                  id="brand-name"
                  name="name"
                  value={newBrand.name}
                  onChange={handleInputChange}
                  onBlur={handleNameBlur}
                  placeholder={t("drawer.namePlaceholder")}
                  className={cn(formErrors.name ? "border-red-500" : "")}
                  autoFocus
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">
                    {t("drawer.nameError")}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 grid gap-1.5">
                    <Label htmlFor="brand-slug" className="sr-only">
                      {t("drawer.slugLabel")}
                    </Label>
                    <Input
                      id="brand-slug"
                      name="slug"
                      value={newBrand.slug}
                      onChange={handleInputChange}
                      placeholder={t("drawer.slugPlaceholder")}
                      className={cn(formErrors.slug ? "border-red-500" : "")}
                      disabled={!!editingBrand}
                    />
                  </div>
                  {!editingBrand && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSlug}
                      className="mb-1"
                    >
                      {t("drawer.generateSlug")}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("drawer.slugDescription")}
                </p>
                {formErrors.slug && (
                  <p className="text-sm text-destructive">
                    {t("drawer.slugError")}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brand-logo">{t("drawer.logoLabel")}</Label>
                <Input
                  id="brand-logo"
                  name="logo"
                  value={newBrand.logo}
                  onChange={handleInputChange}
                  placeholder={t("drawer.logoPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brand-website">
                  {t("drawer.websiteLabel")}
                </Label>
                <Input
                  id="brand-website"
                  name="website"
                  value={newBrand.website}
                  onChange={handleInputChange}
                  placeholder={t("drawer.websitePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brand-description">
                  {t("drawer.descriptionLabel")}
                </Label>
                <Textarea
                  id="brand-description"
                  name="description"
                  value={newBrand.description}
                  onChange={handleInputChange}
                  placeholder={t("drawer.descriptionPlaceholder")}
                  minRows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("drawer.statusLabel")}
                  </p>
                  <p className="text-xs text-default-500">
                    {t("drawer.statusDescription")}
                  </p>
                </div>
                <Switch
                  isSelected={newBrand.isActive}
                  onValueChange={(isSelected) =>
                    handleSwitchChange(isSelected, "isActive")
                  }
                  color="success"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("drawer.popularityLabel")}
                  </p>
                  <p className="text-xs text-default-500">
                    {t("drawer.popularityDescription")}
                  </p>
                </div>
                <Switch
                  isSelected={newBrand.popularity}
                  onValueChange={(isSelected) =>
                    handleSwitchChange(isSelected, "popularity")
                  }
                  color="success"
                />
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              variant="outline"
              onClick={handleCloseDrawer}
              disabled={isSubmitting}
            >
              {t("drawer.cancel")}
            </Button>
            <Button
              color="primary"
              onClick={handleSaveBrand}
              disabled={isSubmitting}
            >
              {editingBrand ? t("drawer.save") : t("drawer.add")}
              {isSubmitting && (
                <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
