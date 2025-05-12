"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
} from "@heroui/react";
import { ScraperTaskExecution, ScraperTaskStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

// Type for combined execution data with task name
interface ExecutionWithTaskName extends ScraperTaskExecution {
  taskDefinition?: {
    name: string;
  };
}

// Simplified Brand type for chart
interface ChartBrand {
  id: string;
  name: string;
  productCount: number;
}

// Simplified Category type for chart
interface ChartCategory {
  id: string;
  name: string;
  level: number;
  productCount: number;
}

const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

// Helper to calculate duration
function calculateDuration(start?: Date | null, end?: Date | null): string {
  if (!start || !end) return "N/A";
  const durationMs = new Date(end).getTime() - new Date(start).getTime();

  if (durationMs < 0) return "N/A";
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;

  return `${seconds}s`;
}

// Helper to format date
function formatDate(date?: Date | string | null): string {
  if (!date) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(date));
  } catch {
    return "Invalid Date";
  }
}

type ChipColor =
  | "default"
  | "success"
  | "warning"
  | "primary"
  | "secondary"
  | "danger";

export function DashboardAnalytics() {
  const t = useTranslations("dashboard.analyticsTab");
  const scraperT = useTranslations("scraperManagement.definitionsTab.status");

  const [recentExecutions, setRecentExecutions] = useState<
    ExecutionWithTaskName[]
  >([]);
  const [brandsData, setBrandsData] = useState<ChartBrand[]>([]);
  const [categoriesData, setCategoriesData] = useState<ChartCategory[]>([]);

  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoadingExecutions(true);
      setIsLoadingBrands(true);
      setIsLoadingCategories(true);
      setError(null);
      try {
        const [executionsRes, brandsStatsRes, categoriesStatsRes] =
          await Promise.all([
            fetch(
              "/api/admin/scraper-tasks/executions?limit=5&sortBy=createdAt&sortOrder=desc",
            ),
            fetch("/api/admin/stats/products-per-brand?limit=7"),
            fetch("/api/admin/stats/products-per-category"),
          ]);

        if (!executionsRes.ok) {
          const errorData = await executionsRes.json().catch(() => ({}));

          throw new Error(
            errorData.error ||
              `Scraper executions: ${executionsRes.statusText}`,
          );
        }
        const executionsData = await executionsRes.json();

        setRecentExecutions(executionsData.data || []);

        if (!brandsStatsRes.ok) {
          const errorData = await brandsStatsRes.json().catch(() => ({}));

          toast.error(t("errors.fetchBrandStatsFailed"));
          throw new Error(
            errorData.error || `Brand Stats: ${brandsStatsRes.statusText}`,
          );
        }
        const brandsApiData = await brandsStatsRes.json();

        setBrandsData(brandsApiData || []);

        if (!categoriesStatsRes.ok) {
          const errorData = await categoriesStatsRes.json().catch(() => ({}));

          toast.error(t("errors.fetchCategoryStatsFailed"));
          throw new Error(
            errorData.error ||
              `Category Stats: ${categoriesStatsRes.statusText}`,
          );
        }
        const categoriesApiData = await categoriesStatsRes.json();

        setCategoriesData(categoriesApiData || []);
      } catch (e) {
        setError((e as Error).message);
        setRecentExecutions([]);
        setBrandsData([]);
        setCategoriesData([]);
      } finally {
        setIsLoadingExecutions(false);
        setIsLoadingBrands(false);
        setIsLoadingCategories(false);
      }
    }
    fetchData();
  }, [t]);

  const getStatusChipColor = (status: ScraperTaskStatus): ChipColor => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "FAILED":
        return "danger";
      case "RUNNING":
        return "warning";
      case "QUEUED":
        return "primary";
      case "CANCELLED":
        return "default";
      case "IDLE":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{t("title")}</h3>
      <p className="text-muted-foreground">{t("description")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>{t("productsPerBrand")}</CardHeader>
          <CardBody>
            {isLoadingBrands ? (
              <p>{t("loadingData")}</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : brandsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={brandsData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: t("productsPerBrand"),
                      angle: -90,
                      position: "insideLeft",
                      fontSize: "0.8rem",
                      offset: -5,
                    }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => [
                      props.payload.productCount,
                      props.payload.name,
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="productCount"
                    name={t("productsPerBrand")}
                    fill={CHART_COLORS[0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>{t("dataNotAvailable")}</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>{t("productsPerCategory")}</CardHeader>
          <CardBody>
            {isLoadingCategories ? (
              <p>{t("loadingData")}</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : categoriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoriesData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="productCount"
                    nameKey="name"
                    label={({ name, productCount }) =>
                      `${name} (${productCount})`
                    }
                  >
                    {categoriesData.slice(0, 5).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      props.payload.productCount,
                      props.payload.name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>{t("dataNotAvailable")}</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>{t("recentScraperActivity")}</CardHeader>
        <CardBody>
          {isLoadingExecutions && <p>{t("loadingData")}</p>}
          {error && (
            <div className="text-red-600 flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          {!isLoadingExecutions && !error && recentExecutions.length === 0 && (
            <p className="text-muted-foreground">No recent scraper activity.</p>
          )}
          {!isLoadingExecutions && !error && recentExecutions.length > 0 && (
            <Table aria-label={t("recentScraperActivity")}>
              <TableHeader>
                <TableColumn>{t("scraperTaskName")}</TableColumn>
                <TableColumn>{t("scraperStatus")}</TableColumn>
                <TableColumn>{t("scraperStartedAt")}</TableColumn>
                <TableColumn>{t("scraperDuration")}</TableColumn>
                <TableColumn>{t("scraperTrigger")}</TableColumn>
              </TableHeader>
              <TableBody items={recentExecutions}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.taskDefinition?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Chip color={getStatusChipColor(item.status)}>
                        {scraperT(item.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatDate(item.startedAt)}</TableCell>
                    <TableCell>
                      {calculateDuration(item.startedAt, item.completedAt)}
                    </TableCell>
                    <TableCell>{item.triggerType}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
