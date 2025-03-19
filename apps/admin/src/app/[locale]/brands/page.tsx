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
} from "@heroui/react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { CustomNavbar } from "@/components/custom-navbar";

export default function BrandsPage() {
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

  const handleAddBrand = () => {
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

    // 调用API保存品牌
    // 这里可以添加API调用代码

    // 关闭抽屉
    handleCloseDrawer();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Brands</h2>
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleOpenDrawer}
            >
              Add Brand
            </Button>
          </div>
        </div>

        {/* 品牌列表表格 */}
        <div className="rounded-md border">
          <Table aria-label="Brands table">
            <TableHeader>
              <TableColumn>Brand</TableColumn>
              <TableColumn>Products</TableColumn>
              <TableColumn>Website</TableColumn>
              <TableColumn className="text-center">Status</TableColumn>
              <TableColumn className="text-right">Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-gray-100 p-1 mr-3">
                        <Image
                          src={`/placeholder.svg?height=40&width=40&text=${brand.name.charAt(0)}`}
                          alt={brand.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {brand.name}
                    </div>
                  </TableCell>
                  <TableCell>{brand.products}</TableCell>
                  <TableCell>{brand.website}</TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        brand.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {brand.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="light" size="sm" isIconOnly>
                          <span className="sr-only">Open menu</span>
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
                      <DropdownMenu aria-label="Brand actions">
                        <DropdownItem
                          key="title"
                          isReadOnly
                          className="font-semibold"
                        >
                          Actions
                        </DropdownItem>
                        <DropdownItem key="edit">Edit</DropdownItem>
                        <DropdownSection showDivider>
                          <DropdownItem key="deactivate">
                            Deactivate
                          </DropdownItem>
                        </DropdownSection>
                        <DropdownItem key="delete" className="text-danger">
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <Button variant="flat" onPress={handleCloseDrawer}>
              取消
            </Button>
            <Button color="primary" onPress={handleAddBrand}>
              添加品牌
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const brands = [
  {
    id: "1",
    name: "Nike",
    products: 128,
    website: "nike.com",
    status: "Active",
  },
  {
    id: "2",
    name: "Adidas",
    products: 94,
    website: "adidas.com",
    status: "Active",
  },
  {
    id: "3",
    name: "Puma",
    products: 56,
    website: "puma.com",
    status: "Active",
  },
  {
    id: "4",
    name: "Levi's",
    products: 72,
    website: "levis.com",
    status: "Active",
  },
  {
    id: "5",
    name: "H&M",
    products: 143,
    website: "hm.com",
    status: "Active",
  },
  {
    id: "6",
    name: "Zara",
    products: 167,
    website: "zara.com",
    status: "Active",
  },
  {
    id: "7",
    name: "Ray-Ban",
    products: 38,
    website: "ray-ban.com",
    status: "Inactive",
  },
  {
    id: "8",
    name: "Casio",
    products: 42,
    website: "casio.com",
    status: "Active",
  },
];
