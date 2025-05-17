"use client";

import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useTranslations } from "next-intl";
import Papa from "papaparse";
import { useState } from "react";
import { toast } from "sonner";

// Define interfaces for the data we expect from APIs
interface ProductReportItem {
  ID: string;
  Name: string;
  SKU: string | null;
  Brand: string;
  Category: string;
  Price: string;
  Status: string;
  Inventory: number | null;
  URL: string | null;
  Images: string;
}

interface BrandRecord {
  id: string;
  name: string;
  slug: string;
  // productCount?: number; // If API can provide this
  isActive: boolean;
  website: string | null;
  // Add other relevant brand fields
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  parentName?: string; // Added for future use
  // productCount?: number; // If API can provide this
  isActive: boolean;
  // Add other relevant category fields
}

// More specific type for products fetched from API
interface ApiProduct {
  id: string;
  name: string;
  sku?: string | null;
  brand?: { name?: string } | null;
  category?: { name?: string } | null;
  price?: { toString: () => string } | string | number | null; // Price could be Decimal, string or number
  status?: string | null;
  inventory?: number | null;
  url?: string | null;
  images?: string[] | null;
  // Add any other fields that are consistently present in the API response for products
}

export function DashboardReports() {
  const t = useTranslations("dashboard.reportsTab");
  const tCommon = useTranslations("common"); // Added for generic error messages
  const [isLoadingProductReport, setIsLoadingProductReport] = useState(false);
  const [isLoadingBrandReport, setIsLoadingBrandReport] = useState(false);
  const [isLoadingCategoryReport, setIsLoadingCategoryReport] = useState(false);

  const downloadCSV = <T,>(data: T[], filename: string) => {
    if (data.length === 0) {
      toast.info(t("noDataToExport"));

      return;
    }
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("reportGeneratedSuccess"));
    } catch {
      // Capture error for logging or specific handling
      toast.error(t("downloadFailed"));
      // console.error("CSV Download/Parse Error:", _err); // Log the actual error
    }
  };

  const fetchAllPages = async (baseUrl: string): Promise<unknown[]> => {
    let allItems: unknown[] = [];
    let page = 1;
    let totalPages = 1;
    const limit = 100;
    let retries = 3;

    do {
      try {
        const response = await fetch(`${baseUrl}?page=${page}&limit=${limit}`);

        if (!response.ok) {
          let errorData = { message: response.statusText }; // Default error

          try {
            errorData = await response.json();
          } catch {
            // Ignore if error response is not JSON, use statusText
          }
          const errorMessage =
            errorData.message ||
            `Failed to fetch: ${response.status} ${response.statusText}`;

          // Use a more generic, translated error for toast, but throw specific for console/debug
          toast.error(
            t("errors.fetchReportDataFailed", { error: response.statusText }),
          );
          throw new Error(
            `Failed to fetch data from ${baseUrl} (page ${page}): ${response.status} ${errorMessage}` +
              (errorData && Object.keys(errorData).length > 1
                ? ` - Details: ${JSON.stringify(errorData)}`
                : ""),
          );
        }
        // Define expected structure of API response more explicitly
        const result: {
          data?: unknown[];
          items?: unknown[];
          pagination?: { totalPages?: number };
          meta?: { totalPages?: number; total?: number };
          total?: number; // For APIs that return total directly at root
        } = await response.json();

        const items: unknown[] = (result.data ||
          result.items ||
          []) as unknown[];

        // if (Array.isArray(items)) { // This check is now less critical due to the line above but good for safety
        allItems = allItems.concat(items);
        // } else if (page === 1 && items === undefined && (result.meta?.total === 0 || result.total === 0)) {

        totalPages =
          result.pagination?.totalPages ||
          result.meta?.totalPages ||
          totalPages;
        if (page > totalPages && totalPages > 1) {
          break;
        }
        if (page > 500) {
          break;
        }
        page++;
        retries = 3;
      } catch (error) {
        retries--;
        if (retries <= 0) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (4 - retries)),
        );
      }
    } while (page <= totalPages);

    return allItems;
  };

  const handleGenerateProductReport = async () => {
    setIsLoadingProductReport(true);
    try {
      const products = await fetchAllPages("/api/products");
      const reportData: ProductReportItem[] = products.map((pUnknown) => {
        const p = pUnknown as ApiProduct; // Use the new ApiProduct interface

        return {
          ID: p?.id || "N/A",
          Name: p?.name || "N/A",
          SKU: p?.sku || null,
          Brand: p?.brand?.name || "N/A",
          Category: p?.category?.name || "N/A",
          Price: p?.price
            ? typeof p.price === "object" && p.price.toString
              ? p.price.toString()
              : String(p.price)
            : "0",
          Status: p?.status || "N/A",
          Inventory:
            p?.inventory === null || p?.inventory === undefined
              ? null
              : Number(p.inventory),
          URL: p?.url || null,
          Images: Array.isArray(p?.images) ? p.images.join("; ") : "",
        };
      });

      downloadCSV(reportData, t("productReportName"));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tCommon("errors.unknownApiError");

      toast.error(t("downloadFailed") + ": " + errorMessage);
    } finally {
      setIsLoadingProductReport(false);
    }
  };

  const handleGenerateBrandReport = async () => {
    setIsLoadingBrandReport(true);
    try {
      const brands = await fetchAllPages("/api/brands");
      const reportData = brands.map((bUnknown) => {
        const b = bUnknown as BrandRecord;

        return {
          ID: b.id,
          Name: b.name,
          Slug: b.slug,
          Active: b.isActive,
          Website: b.website,
        };
      });

      downloadCSV(reportData, t("brandReportName"));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tCommon("errors.unknownApiError");

      toast.error(t("downloadFailed") + ": " + errorMessage);
    } finally {
      setIsLoadingBrandReport(false);
    }
  };

  const handleGenerateCategoryReport = async () => {
    setIsLoadingCategoryReport(true);
    try {
      const categories = await fetchAllPages("/api/categories");
      const reportData = categories.map((cUnknown) => {
        const c = cUnknown as CategoryRecord & { parentName?: string }; // Ensure parentName is part of the type

        return {
          ID: c.id,
          Name: c.name,
          Slug: c.slug,
          Level: c.level,
          ParentID: c.parentId,
          ParentName:
            c.parentName || (c.parentId ? t("parentNameNotAvailable") : "N/A"), // Use t('parentNameNotAvailable')
          Active: c.isActive,
        };
      });

      downloadCSV(reportData, t("categoryReportName"));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tCommon("errors.unknownApiError");

      toast.error(t("downloadFailed") + ": " + errorMessage);
    } finally {
      setIsLoadingCategoryReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{t("title")}</h3>
      <p className="text-muted-foreground">{t("description")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            {t("generateProductReport")}
            <DocumentArrowDownIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardBody>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleGenerateProductReport}
              disabled={isLoadingProductReport}
            >
              {isLoadingProductReport
                ? t("generatingReport")
                : t("generateProductReport")}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            {t("generateBrandReport")}
            <DocumentArrowDownIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardBody>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleGenerateBrandReport}
              disabled={isLoadingBrandReport}
            >
              {isLoadingBrandReport
                ? t("generatingReport")
                : t("generateBrandReport")}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            {t("generateCategoryReport")}
            <DocumentArrowDownIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardBody>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleGenerateCategoryReport}
              disabled={isLoadingCategoryReport}
            >
              {isLoadingCategoryReport
                ? t("generatingReport")
                : t("generateCategoryReport")}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
