"use client";

import { useTranslations } from "next-intl";

import { CustomNavbar } from "@/components/custom-navbar";
import { ScraperTaskDefinitionsTab } from "@/components/scraper-management/scraper-task-definitions-tab";
import { ScraperTaskExecutionsTab } from "@/components/scraper-management/scraper-task-executions-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScraperManagementPage() {
  const t = useTranslations("scraperManagement");

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
          <Tabs defaultValue="definitions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
              <TabsTrigger value="definitions">
                {t("definitionsTab.title")}
              </TabsTrigger>
              <TabsTrigger value="executions">
                {t("executionsTab.title")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="definitions" className="mt-4">
              <ScraperTaskDefinitionsTab />
            </TabsContent>
            <TabsContent value="executions" className="mt-4">
              <ScraperTaskExecutionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
