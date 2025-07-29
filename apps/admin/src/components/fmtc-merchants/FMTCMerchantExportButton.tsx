"use client";

import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FMTCMerchantExportButtonProps {
  searchTerm: string;
  selectedCountry: string;
  selectedNetwork: string;
  brandMatchStatus: string;
  selectedActiveStatus: string;
  selectedCategory: string;
  totalCount?: number;
  disabled?: boolean;
}

export function FMTCMerchantExportButton({
  searchTerm,
  selectedCountry,
  selectedNetwork,
  brandMatchStatus,
  selectedActiveStatus,
  selectedCategory,
  totalCount = 0,
  disabled = false,
}: FMTCMerchantExportButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isExporting, setIsExporting] = useState(false);

  const buildExportUrl = (format: string) => {
    const params = new URLSearchParams({
      format,
      locale,
    });

    if (searchTerm) params.append("search", searchTerm);
    if (selectedCountry && selectedCountry !== "all")
      params.append("country", selectedCountry);
    if (selectedNetwork && selectedNetwork !== "all")
      params.append("network", selectedNetwork);
    if (brandMatchStatus && brandMatchStatus !== "all")
      params.append("brandMatched", brandMatchStatus);
    if (selectedActiveStatus && selectedActiveStatus !== "all")
      params.append("activeStatus", selectedActiveStatus);
    if (selectedCategory && selectedCategory !== "all")
      params.append("category", selectedCategory);

    return `/api/fmtc-merchants/export?${params.toString()}`;
  };

  const handleExport = async (format: string) => {
    if (isExporting || disabled || totalCount === 0) return;

    try {
      setIsExporting(true);

      const url = buildExportUrl(format);

      // 先检查是否超过限制
      if (totalCount > 10000) {
        toast.error(
          `数据量过大（${totalCount} 条记录）。最大支持导出 10000 条记录。请使用筛选条件缩小范围。`,
        );

        return;
      }

      // 使用fetch检查响应
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();

        toast.error(errorData.error || t("fmtcMerchants.export.exportError"));

        return;
      }

      // 创建blob并下载
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      // 从响应头获取文件名
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `fmtc-merchants-export.${format}`;

      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理blob URL
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t("fmtcMerchants.export.downloadStarted"));
    } catch {
      toast.error(t("fmtcMerchants.export.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      key: "csv",
      label: t("fmtcMerchants.export.formats.csv"),
      icon: FileSpreadsheet,
      description: "适用于Excel和其他表格软件",
    },
    {
      key: "excel",
      label: t("fmtcMerchants.export.formats.excel"),
      icon: FileText,
      description: "Microsoft Excel格式",
    },
    {
      key: "json",
      label: t("fmtcMerchants.export.formats.json"),
      icon: FileJson,
      description: "结构化数据格式，适用于开发者",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || disabled || totalCount === 0}
          className="h-8"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting
            ? t("fmtcMerchants.export.exporting")
            : t("fmtcMerchants.export.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="pb-2">
          <div className="space-y-1">
            <div className="font-medium">{t("fmtcMerchants.export.title")}</div>
            <div className="text-xs text-muted-foreground">
              {totalCount > 0
                ? t("fmtcMerchants.export.exportCount", { count: totalCount })
                : locale === "cn"
                  ? "没有可导出的数据"
                  : "No data to export"}
            </div>
            {totalCount > 10000 && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                ⚠️ 数据量过大，最大支持导出 10000 条记录
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {formatOptions.map((option) => {
          const IconComponent = option.icon;

          return (
            <DropdownMenuItem
              key={option.key}
              onClick={() => handleExport(option.key)}
              disabled={isExporting || totalCount === 0}
              className="cursor-pointer"
            >
              <div className="flex items-start space-x-3 py-1">
                <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <div className="text-xs text-muted-foreground">
            {t("fmtcMerchants.export.description")}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
