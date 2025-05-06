"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";

import { CategoryTable } from "./category-table";
import { ProductsClient } from "./products-client";

// ProductFilters 可能需要从 products-client.tsx 导入，或者在此处定义
// 为了清晰，我们在此处重新定义，确保与 products-client.tsx 中的一致
interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  hasCoupon?: boolean;
  status?:
    | "active"
    | "inactive"
    | "all"
    | "inStock"
    | "lowStock"
    | "outOfStock";
}

export default function ProductsPage() {
  const t = useTranslations("products");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedTab, setSelectedTab] = useState("products");
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
    status: "all", // 默认筛选状态为 "all"
  });

  // 这些hooks和函数虽然可能在新UI中看起来未使用，但它们被ProductsClient.ProductTable内部组件使用
  // 它们提供了产品数据的加载、删除、更新等核心功能

  const {
    products,
    totalPages,
    isLoading,
    error,
    deleteProduct,
    updateProduct,
  } = useProducts({
    page,
    limit,
    ...currentFilters, // 将 currentFilters 直接展开传递
  });

  // 获取所有品牌和分类，用于表格中的展示和编辑
  // 这些数据在ProductTable内部使用
  const { brands } = useBrands();
  const { categories } = useCategories({
    limit: 999,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setPage(1); // 当筛选条件改变时，重置到第一页
    setCurrentFilters(newFilters);
  }, []);

  // 辅助函数判断是否应用了筛选 (除了默认的 status: 'all')
  const areFiltersApplied = (filters: ProductFilters): boolean => {
    // 检查除 status 外是否有任何筛选条件，或者 status 不是 'all'
    return !!(
      filters.search ||
      filters.categoryId ||
      filters.brandId ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.hasDiscount ||
      filters.hasCoupon ||
      (filters.status && filters.status !== "all")
    );
  };

  // 下面的处理函数被ProductTable中的内联函数或子组件使用
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
                <ProductsClient.ProductTable
                  products={products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    originalPrice: product.originalPrice
                      ? Number(product.originalPrice)
                      : undefined,
                    discount:
                      product.originalPrice &&
                      Number(product.price) < Number(product.originalPrice)
                        ? Math.round(
                            ((Number(product.originalPrice) -
                              Number(product.price)) /
                              Number(product.originalPrice)) *
                              100,
                          )
                        : undefined,
                    image:
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : undefined,
                    sku: product.sku,
                    inventory: product.inventory
                      ? Number(product.inventory)
                      : undefined,
                    isActive:
                      product.status === "In Stock" ||
                      product.status === "Active", // 确保 Active 也算 isActive
                    hasCoupon: !!product.coupon, // 确保从 product 数据映射
                    couponCode: product.coupon,
                    // couponValue: product.couponValue, // 假设 couponValue 在 product 对象中，如果 Prisma schema 里有的话
                    categoryId: product.category?.id,
                    categoryPath: product.category?.name,
                    brandId: product.brand?.id,
                    brandName: product.brand?.name,
                  }))}
                  categories={categories}
                  brands={brands}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={(id, isActive) =>
                    handleToggleStatus(
                      id,
                      isActive ? "Out of Stock" : "In Stock",
                    )
                  }
                  activeFilters={currentFilters} // 新增：传递 currentFilters
                  onFiltersChange={handleFiltersChange} // 新增：传递 handleFiltersChange
                  onBulkDelete={async (ids) => {
                    try {
                      // 实现批量删除
                      for (const id of ids) {
                        await deleteProduct(id);
                      }
                      toast.success(
                        t("bulkDeleteSuccess", { count: ids.length }),
                      );
                    } catch {
                      toast.error(t("bulkDeleteError"));
                    }
                  }}
                  onBulkToggleStatus={async (ids, setActive) => {
                    try {
                      // 实现批量状态更改
                      const newStatus = setActive ? "In Stock" : "Out of Stock";

                      for (const id of ids) {
                        await updateProduct({
                          id,
                          data: { status: newStatus },
                        });
                      }
                      toast.success(
                        setActive
                          ? t("bulkActivateSuccess", { count: ids.length })
                          : t("bulkDeactivateSuccess", { count: ids.length }),
                      );
                    } catch {
                      toast.error(t("bulkUpdateError"));
                    }
                  }}
                />

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

                {/* 空状态处理 */}
                {products.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md mt-4">
                    {areFiltersApplied(currentFilters) ? (
                      <div className="text-center">
                        <p className="text-gray-500 text-lg mb-2">
                          {t("noResultsWithFilters")}
                        </p>
                        <Button
                          variant="link"
                          onClick={() => handleFiltersChange({ status: "all" })}
                        >
                          {t("resetFiltersLink")}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 text-lg">
                          {t("noProducts")}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {t("addProductPrompt")}
                        </p>
                        {/* 可以添加一个直接跳转到添加商品页面的链接按钮 */}
                        <Link href="/products/new" className="mt-2">
                          <Button>{t("addProduct")}</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
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
