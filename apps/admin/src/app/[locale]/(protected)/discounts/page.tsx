"use client";

import { Settings, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { BrandMatchingPanel } from "@/components/discounts/BrandMatchingPanel";
import { DiscountDataTable } from "@/components/discounts/DiscountDataTable";
import { DiscountImportModal } from "@/components/discounts/DiscountImportModal";
import { DiscountSettingsModal } from "@/components/discounts/DiscountSettingsModal";
import { DiscountStats } from "@/components/discounts/DiscountStats";
import { DynamicStatsPanel } from "@/components/discounts/DynamicStatsPanel";
import { FMTCManagementPanel } from "@/components/discounts/FMTCManagementPanel";
import { ImportHistoryPanel } from "@/components/discounts/ImportHistoryPanel";
import { NotificationPanel } from "@/components/discounts/NotificationPanel";
import { Button } from "@/components/ui/button";
// Card components removed - not used in this file
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiscountsPage() {
  const t = useTranslations("discounts");
  const searchParams = useSearchParams();

  // 从 URL 参数获取初始标签页
  const initialTab = searchParams.get("tab") || "discounts";

  // Tab state
  const [activeTab, setActiveTab] = useState(initialTab);

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // 监听 URL 参数变化
  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-muted-foreground">{t("page.description")}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            {t("page.settingsButton")}
          </Button>
          <Button onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            {t("page.importButton")}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="discounts">{t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
          <TabsTrigger value="brand-matching">
            {t("tabs.brandMatching")}
          </TabsTrigger>
          <TabsTrigger value="fmtc-merchants">
            {t("tabs.fmtcMerchants")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t("tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="imports">{t("tabs.imports")}</TabsTrigger>
        </TabsList>

        {/* Dynamic Statistics Cards - moved below tabs */}
        <DynamicStatsPanel activeTab={activeTab} />

        {/* Tab Content */}
        <TabsContent value="discounts" className="space-y-4">
          {/* 使用专用的 DiscountDataTable 组件，它已经包含完整的模态框功能 */}
          <DiscountDataTable />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DiscountStats />
        </TabsContent>

        <TabsContent value="brand-matching" className="space-y-4">
          <BrandMatchingPanel />
        </TabsContent>

        <TabsContent value="fmtc-merchants" className="space-y-4">
          <FMTCManagementPanel />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationPanel />
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <ImportHistoryPanel />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DiscountImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
      <DiscountSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />

      {/* More Filters Modal */}
      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("filters.moreFilters")}</DialogTitle>
            <DialogDescription>
              {t("filters.moreFiltersDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("filters.dateRange")}</Label>
              <div className="flex gap-2">
                <Input type="date" placeholder={t("filters.startDate")} />
                <Input type="date" placeholder={t("filters.endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.discountType")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    {t("types.percentage")}
                  </SelectItem>
                  <SelectItem value="FIXED_AMOUNT">
                    {t("types.fixedAmount")}
                  </SelectItem>
                  <SelectItem value="FREE_SHIPPING">
                    {t("types.freeShipping")}
                  </SelectItem>
                  <SelectItem value="BUY_X_GET_Y">
                    {t("types.buyXGetY")}
                  </SelectItem>
                  <SelectItem value="OTHER">{t("types.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.minValue")}</Label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>{t("filters.maxValue")}</Label>
              <Input type="number" placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>{t("filters.source")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectSource")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FMTC">FMTC</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="MANUAL">{t("sources.manual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.rating")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectRating")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t("filters.stars")}</SelectItem>
                  <SelectItem value="4">4+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="3">3+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="2">2+ {t("filters.stars")}</SelectItem>
                  <SelectItem value="1">1+ {t("filters.stars")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoreFiltersOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                // Apply advanced filters
                setMoreFiltersOpen(false);
              }}
            >
              {t("actions.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
