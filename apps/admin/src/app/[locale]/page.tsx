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
import { cardStyles, textStyles, buttonStyles } from "@/lib/utils";

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
  const commonT = useTranslations("common");

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
      return <div className="h-7 w-1/2 rounded-md bg-muted animate-pulse" />;
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return value;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      <CustomNavbar />

      {/* Hero Section with Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-background-secondary">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />

        {/* Header Content */}
        <div className="relative px-8 pt-8 pb-6">
          <div className="mx-auto max-w-7xl">
            {/* Main Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2 animate-fade-in">
                <h1
                  className={`text-4xl lg:text-5xl font-bold tracking-tight ${textStyles("primary")} 
                  bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent`}
                >
                  {t("title")}
                </h1>
                <p className={`text-lg ${textStyles("secondary")} max-w-2xl`}>
                  {t("subtitle")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 animate-slide-in">
                <Link href="/products/new" className="group">
                  <div
                    className={`${buttonStyles("primary")} 
                    relative overflow-hidden px-6 py-3 h-auto
                    shadow-lg hover:shadow-xl
                    transform hover:scale-105 hover:-translate-y-1
                    transition-all duration-300 ease-fluid
                    bg-gradient-to-r from-primary to-primary/90
                    border border-primary/20 hover:border-primary/40
                    before:absolute before:inset-0 before:bg-gradient-to-r 
                    before:from-white/0 before:via-white/10 before:to-white/0
                    before:translate-x-[-100%] before:group-hover:translate-x-[100%]
                    before:transition-transform before:duration-700 before:ease-out`}
                  >
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      {t("addProduct")}
                    </span>
                  </div>
                </Link>

                <Link href="/products" className="group">
                  <div
                    className={`${buttonStyles("secondary")} 
                    px-6 py-3 h-auto border border-border hover:border-border-secondary
                    transform hover:scale-105 hover:-translate-y-1
                    transition-all duration-300 ease-fluid
                    hover:shadow-lg`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      {t("viewAllProducts")}
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Stats Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-delay">
              <div
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                hover:border-border hover:bg-card/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                    <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className={`text-sm ${textStyles("tertiary")}`}>
                      {t("totalProducts")}
                    </div>
                    <div
                      className={`text-xl font-bold ${textStyles("primary")}`}
                    >
                      {typeof productCount === "number"
                        ? productCount.toLocaleString()
                        : ".."}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                hover:border-border hover:bg-card/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-300">
                    <TagIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className={`text-sm ${textStyles("tertiary")}`}>
                      {t("totalBrands")}
                    </div>
                    <div
                      className={`text-xl font-bold ${textStyles("primary")}`}
                    >
                      {typeof brandCount === "number"
                        ? brandCount.toLocaleString()
                        : ".."}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                hover:border-border hover:bg-card/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform duration-300">
                    <FolderIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className={`text-sm ${textStyles("tertiary")}`}>
                      {t("totalCategories")}
                    </div>
                    <div
                      className={`text-xl font-bold ${textStyles("primary")}`}
                    >
                      {typeof categoryCount === "number"
                        ? categoryCount.toLocaleString()
                        : ".."}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                hover:border-border hover:bg-card/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform duration-300">
                    <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className={`text-sm ${textStyles("tertiary")}`}>
                      {t("totalContentBlocks")}
                    </div>
                    <div
                      className={`text-xl font-bold ${textStyles("primary")}`}
                    >
                      {typeof contentBlockCount === "number"
                        ? contentBlockCount.toLocaleString()
                        : ".."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {error && (
            <div
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 
              text-destructive backdrop-blur-sm animate-slide-down"
              role="alert"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.664 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <span className="font-medium">
                    {commonT("errors.error")}:
                  </span>{" "}
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Tabs with Modern Design */}
          <Tabs defaultSelectedKey="overview" className="space-y-8">
            <Tab
              key="overview"
              title={
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t("overview")}
                </div>
              }
            >
              <div className="space-y-8 animate-fade-in">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card
                    className={`${cardStyles("interactive")} group hover:scale-105 transition-all duration-300`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div
                        className={`text-sm font-medium ${textStyles("secondary")}`}
                      >
                        {t("totalProducts")}
                      </div>
                      <CubeIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </CardHeader>
                    <CardBody>
                      <div
                        className={`text-2xl font-bold ${textStyles("primary")}`}
                      >
                        {renderStatValue(productCount)}
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    className={`${cardStyles("interactive")} group hover:scale-105 transition-all duration-300`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div
                        className={`text-sm font-medium ${textStyles("secondary")}`}
                      >
                        {t("totalBrands")}
                      </div>
                      <TagIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </CardHeader>
                    <CardBody>
                      <div
                        className={`text-2xl font-bold ${textStyles("primary")}`}
                      >
                        {renderStatValue(brandCount)}
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    className={`${cardStyles("interactive")} group hover:scale-105 transition-all duration-300`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div
                        className={`text-sm font-medium ${textStyles("secondary")}`}
                      >
                        {t("totalCategories")}
                      </div>
                      <FolderIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </CardHeader>
                    <CardBody>
                      <div
                        className={`text-2xl font-bold ${textStyles("primary")}`}
                      >
                        {renderStatValue(categoryCount)}
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    className={`${cardStyles("interactive")} group hover:scale-105 transition-all duration-300`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div
                        className={`text-sm font-medium ${textStyles("secondary")}`}
                      >
                        {t("totalContentBlocks")}
                      </div>
                      <DocumentTextIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </CardHeader>
                    <CardBody>
                      <div
                        className={`text-2xl font-bold ${textStyles("primary")}`}
                      >
                        {renderStatValue(contentBlockCount)}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                  <Card
                    className={`col-span-full lg:col-span-3 ${cardStyles("elevated")} hover:scale-[1.02] transition-all duration-300`}
                  >
                    <CardHeader>
                      <div
                        className={`text-lg font-semibold ${textStyles("primary")}`}
                      >
                        {t("recentProducts")}
                      </div>
                      <div className={`text-sm ${textStyles("secondary")}`}>
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

            <Tab
              key="analytics"
              title={
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t("analyticsTab.title")}
                </div>
              }
            >
              <div className="animate-fade-in">
                <DashboardAnalytics />
              </div>
            </Tab>

            <Tab
              key="reports"
              title={
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {t("reportsTab.title")}
                </div>
              }
            >
              <div className="animate-fade-in">
                <DashboardReports />
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
