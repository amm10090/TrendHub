"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";

import { CategoryTable } from "./category-table";
import { ProductsClient } from "./products-client";

export default function ProductsPage() {
  const t = useTranslations("products");
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
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleEdit = (id: string) => {
    // 跳转到编辑页面，使用当前语言环境
    const locale = window.location.pathname.split("/")[1] || "en";

    window.location.href = `/${locale}/products/edit/${id}`;
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

      toast.success(
        newStatus === "In Stock"
          ? t("statusActiveSuccess")
          : t("statusInactiveSuccess"),
      );
    } catch {
      toast.error(t("operationError"));
    }
  };

  const handleUpdateProductName = async (id: string, newName: string) => {
    try {
      await updateProduct({
        id,
        data: { name: newName },
      });
      toast.success(t("updateNameSuccess"));
    } catch {
      toast.error(t("updateError"));
    }
  };

  const handleUpdateProductPrice = async (id: string, newPrice: string) => {
    try {
      const price = parseFloat(newPrice);

      if (isNaN(price) || price < 0) {
        throw new Error(t("invalidPrice"));
      }
      await updateProduct({
        id,
        data: { price },
      });
      toast.success(t("updatePriceSuccess"));
    } catch (error) {
      toast.error(t("updateError"), {
        description: error instanceof Error ? error.message : t("unknownError"),
      });
    }
  };

  const handleUpdateProductBrand = async (id: string, brandId: string) => {
    try {
      await updateProduct({
        id,
        data: { brandId },
      });
      toast.success(t("updateBrandSuccess"));
    } catch {
      toast.error(t("updateError"));
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
      toast.success(t("updateCategorySuccess"));
    } catch {
      toast.error(t("updateError"));
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

      <div className="mt-4">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${selectedTab === "products" ? "border-b-2 border-primary" : ""}`}
            onClick={() => setSelectedTab("products")}
          >
            {t("productList")}
          </button>
          <button
            className={`px-4 py-2 font-medium ${selectedTab === "categories" ? "border-b-2 border-primary" : ""}`}
            onClick={() => setSelectedTab("categories")}
          >
            {t("categoryManagement")}
          </button>
        </div>

        {selectedTab === "products" ? (
          <>
            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="rounded-md border mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("columns.name")}</TableHead>
                        <TableHead>{t("columns.brand")}</TableHead>
                        <TableHead>{t("columns.category")}</TableHead>
                        <TableHead className="text-right">
                          {t("columns.price")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("columns.status")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("columns.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
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
                              placeholder={t("selectBrand")}
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
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page > 1 ? page - 1 : 1)}
                      disabled={page <= 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      {t("pagination.prev")}
                    </button>
                    <span className="text-sm">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(
                          page < totalPages ? page + 1 : totalPages,
                        )
                      }
                      disabled={page >= totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      {t("pagination.next")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-4">
            <CategoryTable />
          </div>
        )}
      </div>
    </ProductsClient.PageWrapper>
  );
}
