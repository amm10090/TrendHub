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
} from "@heroui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";

import { ProductsClient } from "./products-client";

export default function ProductsPage() {
  const t = useTranslations("products");
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { products, totalPages, isLoading, error, deleteProduct, isDeleting } =
    useProducts({
      page,
      limit,
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
          <Link href="/products/new">
            <ProductsClient.AddButton />
          </Link>
        </div>
      </div>

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
                <TableColumn align="center">{t("columns.status")}</TableColumn>
                <TableColumn align="end">{t("columns.actions")}</TableColumn>
              </TableHeader>
              <TableBody items={products}>
                {(product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">
                      ${product.price.toFixed(2)}
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
                          `status.${product.status === "In Stock" ? "inStock" : "lowStock"}`,
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductsClient.ActionMenu
                        product={product}
                        onDelete={() => handleDelete(product.id)}
                        isDeleting={isDeleting}
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
    </ProductsClient.PageWrapper>
  );
}
