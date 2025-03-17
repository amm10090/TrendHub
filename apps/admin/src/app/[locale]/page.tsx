"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { useTranslations } from "next-intl";

import { CustomNavbar } from "@/components/custom-navbar";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { Link } from "@/i18n";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

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
        <Tabs defaultSelectedKey="overview" className="space-y-4">
          <Tab key="overview" title={t("overview")}>
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("totalRevenue")}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">
                      {t("revenueIncrease")}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">
                      {t("subscriptions")}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">+2350</div>
                    <p className="text-xs text-muted-foreground">
                      {t("subscriptionIncrease")}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">{t("sales")}</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">
                      {t("salesIncrease")}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium">{t("activeNow")}</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">
                      {t("activeIncrease")}
                    </p>
                  </CardBody>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <div className="text-lg font-semibold">{t("overview")}</div>
                  </CardHeader>
                  <CardBody className="pl-2">
                    <Overview />
                  </CardBody>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <div className="text-lg font-semibold">
                      {t("recentSales")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("recentSalesDescription")}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <RecentSales />
                  </CardBody>
                </Card>
              </div>
            </div>
          </Tab>
          <Tab key="analytics" title={t("analytics")}>
            <div className="mt-4">
              <p>{t("analyticsContent")}</p>
            </div>
          </Tab>
          <Tab key="reports" title={t("reports")}>
            <div className="mt-4">
              <p>{t("reportsContent")}</p>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
