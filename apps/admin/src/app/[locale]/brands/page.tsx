"use client";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Textarea,
  Switch,
  Spinner,
} from "@heroui/react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import { useToast } from "@/hooks/use-toast";
import { Brand } from "@/lib/services/brand.service";

export default function BrandsPage() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    website: "",
    isActive: true,
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
          throw new Error("获取品牌列表失败");
        }
        const data = await response.json();

        setBrands(data.items || []);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "获取品牌列表失败");
        toast({
          title: "错误",
          description: "获取品牌列表失败",
          variant: "destructive",
        });
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
        throw new Error("更新品牌状态失败");
      }

      const updatedBrand = await response.json();

      // 更新品牌列表
      setBrands((prev) =>
        prev.map((brand) => (brand.id === brandId ? updatedBrand : brand)),
      );

      // 显示成功提示
      toast({
        title: "成功",
        description: `品牌已${!isActive ? "激活" : "停用"}`,
      });
    } catch {
      toast({
        title: "错误",
        description: "更新品牌状态失败",
        variant: "destructive",
      });
    }
  };

  // 处理删除品牌
  const handleDeleteBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除品牌失败");
      }

      // 从列表中移除品牌
      setBrands((prev) => prev.filter((brand) => brand.id !== brandId));

      // 显示成功提示
      toast({
        title: "成功",
        description: "品牌已删除",
      });
    } catch {
      toast({
        title: "错误",
        description: "删除品牌失败",
        variant: "destructive",
      });
    }
  };

  const handleOpenDrawer = () => setIsDrawerOpen(true);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // 重置表单
    setNewBrand({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      isActive: true,
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

  const handleSwitchChange = (isSelected: boolean) => {
    setNewBrand((prev) => ({ ...prev, isActive: isSelected }));
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

  const handleAddBrand = async () => {
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
      // 调用API保存品牌
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBrand),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "创建品牌失败");
      }

      const createdBrand = await response.json();

      // 更新品牌列表
      setBrands((prev) => [...prev, createdBrand]);

      // 显示成功提示
      toast({
        title: "成功",
        description: "品牌创建成功",
      });

      // 关闭抽屉
      handleCloseDrawer();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "创建品牌失败";

      toast({
        title: "错误",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">品牌管理</h2>
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleOpenDrawer}
            >
              添加品牌
            </Button>
          </div>
        </div>

        {/* 品牌列表表格 */}
        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : brands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无品牌数据</div>
          ) : (
            <Table aria-label="品牌列表">
              <TableHeader>
                <TableColumn>品牌</TableColumn>
                <TableColumn>产品数量</TableColumn>
                <TableColumn>网站</TableColumn>
                <TableColumn className="text-center">状态</TableColumn>
                <TableColumn className="text-right">操作</TableColumn>
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
                    <TableCell>{brand.website || "无"}</TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          brand.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {brand.isActive ? "激活" : "禁用"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="light" size="sm" isIconOnly>
                            <span className="sr-only">打开菜单</span>
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
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="品牌操作">
                          <DropdownItem
                            key="title"
                            isReadOnly
                            className="font-semibold"
                          >
                            操作
                          </DropdownItem>
                          <DropdownItem key="edit">编辑</DropdownItem>
                          <DropdownSection showDivider>
                            <DropdownItem
                              key="toggle-status"
                              onPress={() =>
                                handleToggleBrandStatus(
                                  brand.id,
                                  brand.isActive,
                                )
                              }
                            >
                              {brand.isActive ? "禁用" : "激活"}
                            </DropdownItem>
                          </DropdownSection>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            onPress={() => handleDeleteBrand(brand.id)}
                          >
                            删除
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* 添加品牌抽屉 */}
      <Drawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        placement="right"
        size="sm"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">添加新品牌</h3>
            <p className="text-sm text-default-500">
              填写下面的表单以添加新品牌
            </p>
          </DrawerHeader>
          <DrawerBody>
            <div className="flex flex-col gap-4">
              <Input
                label="品牌名称"
                name="name"
                value={newBrand.name}
                onChange={handleInputChange}
                onBlur={handleNameBlur}
                placeholder="输入品牌名称"
                variant="bordered"
                autoFocus
                isInvalid={formErrors.name}
                errorMessage={formErrors.name ? "请输入品牌名称" : ""}
                isRequired
              />

              <div className="flex gap-2 items-end">
                <Input
                  label="品牌Slug"
                  name="slug"
                  value={newBrand.slug}
                  onChange={handleInputChange}
                  placeholder="品牌URL标识"
                  variant="bordered"
                  isInvalid={formErrors.slug}
                  errorMessage={formErrors.slug ? "请输入品牌Slug" : ""}
                  description="用于URL的唯一标识，仅允许使用小写字母、数字和连字符"
                  className="flex-1"
                  isRequired
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={generateSlug}
                  className="mb-1"
                >
                  生成
                </Button>
              </div>

              <Input
                label="品牌Logo URL"
                name="logo"
                value={newBrand.logo}
                onChange={handleInputChange}
                placeholder="输入品牌Logo图片链接"
                variant="bordered"
              />

              <Input
                label="品牌网站"
                name="website"
                value={newBrand.website}
                onChange={handleInputChange}
                placeholder="输入品牌官网地址"
                variant="bordered"
              />

              <Textarea
                label="品牌描述"
                name="description"
                value={newBrand.description}
                onChange={handleInputChange}
                placeholder="输入品牌描述信息"
                variant="bordered"
                minRows={3}
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">品牌状态</p>
                  <p className="text-xs text-default-500">设置品牌是否激活</p>
                </div>
                <Switch
                  isSelected={newBrand.isActive}
                  onValueChange={handleSwitchChange}
                  color="success"
                />
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              variant="flat"
              onPress={handleCloseDrawer}
              isDisabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleAddBrand}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              添加品牌
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
