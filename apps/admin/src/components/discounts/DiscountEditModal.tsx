"use client";

import { DiscountType } from "@prisma/client";
import { Edit, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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
  brandId?: string;
  brand?: {
    id: string;
    name: string;
  };
}

interface Brand {
  id: string;
  name: string;
}

interface DiscountEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discountId: string | null;
  onSuccess?: () => void;
}

export function DiscountEditModal({
  open,
  onOpenChange,
  discountId,
  onSuccess,
}: DiscountEditModalProps) {
  const t = useTranslations("discounts");
  const tCommon = useTranslations("common");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    merchantName: "",
    title: "",
    code: "",
    type: DiscountType.OTHER,
    value: "",
    dealStatus: "",
    startDate: "",
    endDate: "",
    rating: "",
    isActive: true,
    brandId: "no-brand",
  });

  useEffect(() => {
    if (open && discountId) {
      fetchDiscountDetails();
      fetchBrands();
    }
  }, [open, discountId]); // fetchDiscountDetails 和 fetchBrands 不依赖外部状态，可以安全忽略

  const fetchDiscountDetails = async () => {
    if (!discountId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/discounts/${discountId}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;

        setDiscount(data);

        // Fill form data
        setFormData({
          merchantName: data.merchantName || "",
          title: data.title || "",
          code: data.code || "",
          type: data.type || DiscountType.OTHER,
          value: data.value?.toString() || "",
          dealStatus: data.dealStatus || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().slice(0, 16)
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().slice(0, 16)
            : "",
          rating: data.rating?.toString() || "",
          isActive: data.isActive,
          brandId: data.brandId || "no-brand",
        });
      } else {
        toast.error(t("messages.fetchError"));
      }
    } catch {
      toast.error(t("messages.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands?limit=1000");
      const result = await response.json();

      if (result.success) {
        setBrands(result.data || []);
      }
    } catch {
      // Silent failure, brand selection is optional
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountId) return;

    try {
      setSaving(true);

      // Prepare update data
      const updateData: Record<string, unknown> = {
        merchantName: formData.merchantName,
        title: formData.title,
        code: formData.code || null,
        type: formData.type,
        value: formData.value ? parseFloat(formData.value) : null,
        dealStatus: formData.dealStatus || null,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        isActive: formData.isActive,
        brandId: formData.brandId === "no-brand" ? null : formData.brandId,
      };

      const response = await fetch(`/api/discounts/${discountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t("edit.updateSuccess"));
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || t("edit.updateError"));
      }
    } catch {
      toast.error(t("edit.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const getDiscountTypeOptions = () => [
    { value: DiscountType.PERCENTAGE, label: t("types.percentage") },
    { value: DiscountType.FIXED_AMOUNT, label: t("types.fixedAmount") },
    { value: DiscountType.FREE_SHIPPING, label: t("types.freeShipping") },
    { value: DiscountType.BUY_X_GET_Y, label: t("types.buyXGetY") },
    { value: DiscountType.OTHER, label: t("types.other") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            {t("dropdownActions.edit")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {tCommon("loading")}
              </p>
            </div>
          </div>
        ) : discount ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.basicInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchantName">
                      {t("table.merchant")} *
                    </Label>
                    <Input
                      id="merchantName"
                      value={formData.merchantName}
                      onChange={(e) =>
                        handleInputChange("merchantName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandId">{t("table.brand")}</Label>
                    <Select
                      value={formData.brandId}
                      onValueChange={(value) =>
                        handleInputChange("brandId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tCommon("selectBrand")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-brand">
                          {t("table.unmatched")}
                        </SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{t("table.discountInfo")} *</Label>
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{t("table.discountCode")}</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    placeholder={t("edit.codePlaceholder")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.discountInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t("filters.discountType")}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleInputChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getDiscountTypeOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">{t("table.discountAmount")}</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) =>
                        handleInputChange("value", e.target.value)
                      }
                      placeholder={t("edit.valuePlaceholder")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dealStatus">Deal Status</Label>
                    <Input
                      id="dealStatus"
                      value={formData.dealStatus}
                      onChange={(e) =>
                        handleInputChange("dealStatus", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">{t("filters.rating")}</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.rating}
                      onChange={(e) =>
                        handleInputChange("rating", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("table.validPeriod")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t("filters.startDate")}</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("filters.endDate")}</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.statusInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                  />
                  <Label htmlFor="isActive">{t("status.active")}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("edit.statusDescription")}
                </p>
              </CardContent>
            </Card>
          </form>
        ) : null}

        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
