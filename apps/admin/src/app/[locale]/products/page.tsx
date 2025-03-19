"use client";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Pagination,
  Tabs,
  Tab,
} from "@heroui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";

import { CategoryTable } from "./category-table";
import { ProductsClient } from "./products-client";

export default function ProductsPage() {
  const t = useTranslations("products");
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedTab, setSelectedTab] = useState("products");

  const {
    products,
    totalPages,
    isLoading,
    error,
    deleteProduct,
    isDeleting,
    updateProduct,
  } = useProducts({
    page,
    limit,
  });

  // 获取所有品牌和分类
  const { brands, isLoading: isBrandsLoading } = useBrands();
  const { categories, isLoading: isCategoriesLoading } = useCategories({
    limit: 999,
  });

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: t("deleteSuccess"),
        variant: "success",
      });
    } catch {
      toast({
        title: t("deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    // 跳转到编辑页面
    window.location.href = `/products/edit/${id}`;
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      // 切换商品状态
      const newStatus =
        currentStatus === "In Stock" ? "Out of Stock" : "In Stock";

      await updateProduct({
        id,
        data: { status: newStatus },
      });

      toast({
        title: newStatus === "In Stock" ? "商品已启用" : "商品已禁用",
        variant: "success",
      });
    } catch {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProductName = async (id: string, newName: string) => {
    try {
      await updateProduct({
        id,
        data: { name: newName },
      });
      toast({
        title: "商品名称已更新",
        variant: "success",
      });
    } catch {
      toast({
        title: "更新失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProductPrice = async (id: string, newPrice: string) => {
    try {
      const price = parseFloat(newPrice);

      if (isNaN(price) || price < 0) {
        throw new Error("无效的价格");
      }
      await updateProduct({
        id,
        data: { price },
      });
      toast({
        title: "商品价格已更新",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "更新失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProductBrand = async (id: string, brandId: string) => {
    try {
      await updateProduct({
        id,
        data: { brandId },
      });
      toast({
        title: "商品品牌已更新",
        variant: "success",
      });
    } catch {
      toast({
        title: "更新失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProductCategory = async (
    id: string,
    categoryId: string,
  ) => {
    try {
      await updateProduct({
        id,
        data: { categoryId },
      });
      toast({
        title: "商品分类已更新",
        variant: "success",
      });
    } catch {
      toast({
        title: "更新失败",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-red-500">{t("fetchError")}</p>
      </div>
    );
  }

  return (
    <ProductsClient.PageWrapper>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <div className="flex items-center space-x-2">
          {selectedTab === "products" ? (
            <Link href="/products/new">
              <ProductsClient.AddButton />
            </Link>
          ) : (
            <ProductsClient.AddCategoryButton />
          )}
        </div>
      </div>

      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key.toString())}
        className="mt-4"
      >
        <Tab key="products" title="商品列表">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table aria-label={t("productList")}>
                  <TableHeader>
                    <TableColumn>{t("columns.name")}</TableColumn>
                    <TableColumn>{t("columns.brand")}</TableColumn>
                    <TableColumn>{t("columns.category")}</TableColumn>
                    <TableColumn align="end">{t("columns.price")}</TableColumn>
                    <TableColumn align="center">
                      {t("columns.status")}
                    </TableColumn>
                    <TableColumn align="end">
                      {t("columns.actions")}
                    </TableColumn>
                  </TableHeader>
                  <TableBody items={products}>
                    {(product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <ProductsClient.QuickEdit
                            value={product.name}
                            onSave={(value) =>
                              handleUpdateProductName(product.id, value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <ProductsClient.QuickSelect
                            value={product.brand?.id || ""}
                            items={brands}
                            onSave={(value) =>
                              handleUpdateProductBrand(product.id, value)
                            }
                            getItemLabel={(brand) => brand.name}
                            getItemValue={(brand) => brand.id}
                            placeholder="选择品牌"
                            isLoading={isBrandsLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <ProductsClient.QuickCategorySelect
                            categoryId={product.category?.id}
                            categories={categories}
                            onSave={(value) =>
                              handleUpdateProductCategory(product.id, value)
                            }
                            isLoading={isCategoriesLoading}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <ProductsClient.QuickEdit
                            value={String(product.price)}
                            onSave={(value) =>
                              handleUpdateProductPrice(product.id, value)
                            }
                            type="number"
                            formatter={(value) =>
                              `$${parseFloat(value).toFixed(2)}`
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.status === "In Stock"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {t(
                              `status.${
                                product.status === "In Stock"
                                  ? "inStock"
                                  : "lowStock"
                              }`,
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <ProductsClient.ActionMenu
                            onDelete={() => handleDelete(product.id)}
                            onEdit={() => handleEdit(product.id)}
                            onToggleStatus={() =>
                              handleToggleStatus(product.id, product.status)
                            }
                            isDeleting={isDeleting}
                            isActive={product.status === "In Stock"}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex justify-center">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            </>
          )}
        </Tab>
        <Tab key="categories" title="分类管理">
          <CategoryTable />
        </Tab>
      </Tabs>
    </ProductsClient.PageWrapper>
  );
}
