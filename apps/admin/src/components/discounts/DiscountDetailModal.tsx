"use client";

import { DiscountType } from "@prisma/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye, Calendar, Star, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Discount {
  id: string;
  merchantName: string;
  title: string;
  code?: string;
  type: DiscountType;
  value?: number;
  dealStatus?: string;
  startDate?: Date;
  endDate?: Date;
  rating?: number;
  isActive: boolean;
  isExpired: boolean;
  useCount: number;
  source: string;
  brand?: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface DiscountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discountId: string | null;
}

export function DiscountDetailModal({
  open,
  onOpenChange,
  discountId,
}: DiscountDetailModalProps) {
  const t = useTranslations("discounts");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && discountId) {
      fetchDiscountDetails();
    }
  }, [open, discountId]); // fetchDiscountDetails 不依赖外部状态，可以安全忽略

  const fetchDiscountDetails = async () => {
    if (!discountId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/discounts/${discountId}`);
      const result = await response.json();

      if (result.success) {
        setDiscount(result.data);
      } else {
        toast.error(t("messages.viewDetailsError"));
      }
    } catch {
      toast.error(t("messages.viewDetailsError"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "—";

    return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: zhCN });
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.value === undefined || discount.value === null) return "—";

    if (discount.type === DiscountType.PERCENTAGE) {
      return `${discount.value}%`;
    } else if (discount.type === DiscountType.FIXED_AMOUNT) {
      return `$${discount.value}`;
    }

    return discount.value.toString();
  };

  const getDiscountTypeLabel = (type: DiscountType) => {
    const labels = {
      [DiscountType.PERCENTAGE]: t("types.percentage"),
      [DiscountType.FIXED_AMOUNT]: t("types.fixedAmount"),
      [DiscountType.FREE_SHIPPING]: t("types.freeShipping"),
      [DiscountType.BUY_X_GET_Y]: t("types.buyXGetY"),
      [DiscountType.OTHER]: t("types.other"),
    };

    return labels[type] || t("status.unknown");
  };

  const getStatusBadge = (discount: Discount) => {
    if (discount.isExpired) {
      return <Badge variant="destructive">{t("status.expired")}</Badge>;
    } else if (!discount.isActive) {
      return <Badge variant="secondary">{t("status.inactive")}</Badge>;
    } else {
      return <Badge variant="default">{t("status.active")}</Badge>;
    }
  };

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t("messages.copiedToClipboard"));
  };

  if (!discount && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t("dropdownActions.viewDetails")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : discount ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.basicInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.discountInfo")}
                    </label>
                    <p className="mt-1 font-medium">{discount.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.merchant")}
                    </label>
                    <p className="mt-1">{discount.merchantName}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("filters.discountType")}
                    </label>
                    <p className="mt-1">
                      {getDiscountTypeLabel(discount.type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.discountAmount")}
                    </label>
                    <p className="mt-1 font-mono text-lg">
                      {formatDiscountValue(discount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.status")}
                    </label>
                    <div className="mt-1">{getStatusBadge(discount)}</div>
                  </div>
                </div>

                {discount.code && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.discountCode")}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-base font-mono">
                        {discount.code}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyDiscountCode(discount.code!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 品牌信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.brandInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discount.brand ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={discount.brand.logo} />
                      <AvatarFallback>
                        {discount.brand.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{discount.brand.name}</h3>
                      {discount.brand.website && (
                        <a
                          href={discount.brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          访问官网
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>{t("table.unmatched")}</p>
                    <p className="text-sm">
                      {t("table.merchant")}: {discount.merchantName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 时间和统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t("table.validPeriod")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("filters.startDate")}
                    </label>
                    <p className="mt-1">{formatDate(discount.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("filters.endDate")}
                    </label>
                    <p
                      className={`mt-1 ${discount.isExpired ? "text-red-600" : ""}`}
                    >
                      {formatDate(discount.endDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("detail.statusInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.usageCount")}
                    </label>
                    <p className="mt-1 text-xl font-bold">
                      {discount.useCount}
                    </p>
                  </div>
                  {discount.rating && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("filters.rating")}
                      </label>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{discount.rating}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("table.source")}
                    </label>
                    <p className="mt-1">{discount.source}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 系统信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">系统信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      创建时间
                    </label>
                    <p className="mt-1">{formatDate(discount.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      更新时间
                    </label>
                    <p className="mt-1">{formatDate(discount.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("messages.fetchError")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
