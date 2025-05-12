"use client";

import {
  CubeIcon,
  TagIcon,
  FolderIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"; // Example icons
import { Card, CardBody, CardHeader, Tab, Tabs } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
// import { Overview } from "@/components/overview"; // Commented out as per plan
import { DashboardAnalytics } from "@/components/dashboard-analytics"; // Import new component
import { DashboardReports } from "@/components/dashboard-reports"; // Import new component
import { RecentProducts } from "@/components/recent-products"; // Updated component name
import { Link } from "@/i18n";
import type { Product } from "@/lib/services/product.service"; // For recentProducts state

// Interface for API stats (adjust based on actual API response)
interface ProductStats {
  total: number;
  // other stats if available
}

interface CountResponse {
  total?: number; // For brands, categories
  meta?: {
    // For content blocks
    total: number;
  };
  pagination?: {
    // Keep just in case, but seems unused based on screenshots
    totalItems?: number;
  };
  // Other fields might exist
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const [productCount, setProductCount] = useState<number | string>(
    t("dataNotAvailable"),
  );
  const [brandCount, setBrandCount] = useState<number | string>(
    t("dataNotAvailable"),
  );
  const [categoryCount, setCategoryCount] = useState<number | string>(
    t("dataNotAvailable"),
  );
  const [contentBlockCount, setContentBlockCount] = useState<number | string>(
    t("dataNotAvailable"),
  );
  const [recentProducts, setRecentProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [
          productStatsRes,
          brandsRes,
          categoriesRes,
          contentBlocksRes,
          recentProductsRes,
        ] = await Promise.all([
          fetch("/api/products/stats"),
          fetch("/api/brands?limit=1"), // TODO: Optimize count fetching
          fetch("/api/categories?limit=1"), // TODO: Optimize count fetching
          fetch("/api/admin/content-blocks?limit=1"), // TODO: Optimize count fetching
          fetch("/api/products?limit=5&sortBy=createdAt&sortOrder=desc"),
        ]);

        // Product Count
        if (productStatsRes.ok) {
          const productStatsData: ProductStats = await productStatsRes.json();

          setProductCount(productStatsData.total);
        } else {
          setProductCount(t("dataNotAvailable"));
        }

        // Brand Count
        if (brandsRes.ok) {
          const brandsData: CountResponse = await brandsRes.json();

          setBrandCount(brandsData.total ?? t("dataNotAvailable"));
        } else {
          setBrandCount(t("dataNotAvailable"));
        }

        // Category Count
        if (categoriesRes.ok) {
          const categoriesData: CountResponse = await categoriesRes.json();

          setCategoryCount(categoriesData.total ?? t("dataNotAvailable"));
        } else {
          setCategoryCount(t("dataNotAvailable"));
        }

        // Content Block Count
        if (contentBlocksRes.ok) {
          const contentBlocksData: CountResponse =
            await contentBlocksRes.json();

          setContentBlockCount(
            contentBlocksData.meta?.total ?? t("dataNotAvailable"),
          );
        } else {
          setContentBlockCount(t("dataNotAvailable"));
        }

        // Recent Products
        if (recentProductsRes.ok) {
          const recentProductsData: { data: Product[] } =
            await recentProductsRes.json();

          setRecentProducts(recentProductsData.data);
        } else {
          setRecentProducts(null);
        }
      } catch (e) {
        const fetchError = e as Error;

        setError(fetchError.message || "Failed to load dashboard data");
        setProductCount(t("dataNotAvailable"));
        setBrandCount(t("dataNotAvailable"));
        setCategoryCount(t("dataNotAvailable"));
        setContentBlockCount(t("dataNotAvailable"));
        setRecentProducts(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [t]); // Added t to dependency array as it's used in error/default states

  const renderStatValue = (value: number | string) => {
    if (isLoading) {
      return (
        <div className="h-7 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      );
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return value;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6 ">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <div className="flex items-center space-x-2">
            <Link href="/products/new">
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                {t("addProduct")}
              </div>
            </Link>
          </div>
        </div>
        {error && (
          <div
            className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
            role="alert"
          >
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
        <Tabs defaultSelectedKey="overview" className="space-y-4">
          <Tab key="overview" title={t("overview")}>
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("totalProducts")}
                    </div>
                    <CubeIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">
                      {renderStatValue(productCount)}
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("totalBrands")}
                    </div>
                    <TagIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">
                      {renderStatValue(brandCount)}
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("totalCategories")}
                    </div>
                    <FolderIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">
                      {renderStatValue(categoryCount)}
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("totalContentBlocks")}
                    </div>
                    <DocumentTextIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">
                      {renderStatValue(contentBlockCount)}
                    </div>
                  </CardBody>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* TODO: Implement a relevant chart for Overview section
                <Card className="col-span-4">
                  <CardHeader>
                    <div className="text-lg font-semibold">{t("overview")}</div>
                  </CardHeader>
                  <CardBody className="pl-2">
                    <Overview />
                  </CardBody>
                </Card>
                */}
                <Card className="col-span-full lg:col-span-3">
                  {" "}
                  {/* Adjusted to full width on smaller, 3/7 on large */}
                  <CardHeader>
                    <div className="text-lg font-semibold">
                      {t("recentProducts")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("recentProductsDescription")}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <RecentProducts
                      products={recentProducts}
                      isLoading={isLoading}
                    />
                  </CardBody>
                </Card>
              </div>
            </div>
          </Tab>
          <Tab key="analytics" title={t("analyticsTab.title")}>
            <div className="mt-4">
              <DashboardAnalytics />
            </div>
          </Tab>
          <Tab key="reports" title={t("reportsTab.title")}>
            <div className="mt-4">
              <DashboardReports />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
