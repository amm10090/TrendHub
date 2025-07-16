"use client";

import {
  ExternalLink,
  Globe,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Save,
  X,
  Network,
  Tag,
  MapPin,
  Link,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 商户详情接口
interface FMTCMerchantDetail {
  id: string;
  name: string;
  country?: string;
  network?: string;
  homepage?: string;
  primaryCategory?: string;
  primaryCountry?: string;
  shipsTo?: string[];
  fmtcId?: string;
  networkId?: string;
  status?: string;
  freshReachSupported: boolean;
  logo120x60?: string;
  logo88x31?: string;
  screenshot280x210?: string;
  screenshot600x450?: string;
  affiliateUrl?: string;
  affiliateLinks?: Record<string, string[]>;
  freshReachUrls?: string[];
  previewDealsUrl?: string;
  brandId?: string;
  brand?: {
    id: string;
    name: string;
    logo?: string;
    description?: string;
  };
  brandMatchConfidence?: number;
  brandMatchConfirmed: boolean;
  networks?: Array<{
    id: string;
    networkName: string;
    networkId?: string;
    status: string;
    isActive: boolean;
  }>;
  lastScrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  rawData?: Record<string, unknown>;
}

interface FMTCMerchantDetailModalProps {
  merchant: FMTCMerchantDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function FMTCMerchantDetailModal({
  merchant,
  isOpen,
  onClose,
  onUpdate,
}: FMTCMerchantDetailModalProps) {
  const t = useTranslations();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FMTCMerchantDetail>>({});
  const [activeTab, setActiveTab] = useState("basic");

  // 初始化编辑表单
  useEffect(() => {
    if (merchant) {
      setEditForm({
        name: merchant.name,
        homepage: merchant.homepage || "",
        primaryCategory: merchant.primaryCategory || "",
        primaryCountry: merchant.primaryCountry || "",
        status: merchant.status || "",
        freshReachSupported: merchant.freshReachSupported,
        isActive: merchant.isActive,
      });
    }
  }, [merchant]);

  // 保存更改
  const handleSave = async () => {
    if (!merchant) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fmtc-merchants/${merchant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setIsEditing(false);
          onUpdate();
        }
      }
    } catch (error) {
      console.error("更新商户失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    if (!merchant) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fmtc-merchants/${merchant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_data" }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error("刷新数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 确认品牌匹配
  const handleConfirmBrandMatch = async () => {
    if (!merchant || !merchant.brandId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fmtc-merchants/${merchant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_brand_match",
          data: { brandId: merchant.brandId },
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error("确认品牌匹配失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 拒绝品牌匹配
  const handleRejectBrandMatch = async () => {
    if (!merchant) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/fmtc-merchants/${merchant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_brand_match" }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error("拒绝品牌匹配失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // 获取网络状态颜色
  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case "Joined":
        return "bg-green-100 text-green-800";
      case "Not Joined":
        return "bg-red-100 text-red-800";
      case "Relationship Not Verified":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!merchant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={merchant.logo120x60} alt={merchant.name} />
                <AvatarFallback>
                  {merchant.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{merchant.name}</DialogTitle>
                <DialogDescription>
                  {merchant.primaryCategory && (
                    <span className="inline-flex items-center">
                      <Tag className="mr-1 h-3 w-3" />
                      {merchant.primaryCategory}
                    </span>
                  )}
                  {merchant.country && (
                    <span className="ml-3 inline-flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {merchant.country}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    {t("common.cancel")}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    {t("common.edit")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">{t("common.basic")}</TabsTrigger>
            <TabsTrigger value="brand">
              {t("fmtcMerchants.tabs.brandMatching")}
            </TabsTrigger>
            <TabsTrigger value="networks">
              {t("fmtcMerchants.tabs.networks")}
            </TabsTrigger>
            <TabsTrigger value="links">
              {t("fmtcMerchants.tabs.links")}
            </TabsTrigger>
            <TabsTrigger value="media">
              {t("fmtcMerchants.tabs.media")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("fmtcMerchants.details.basicInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("common.name")}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      ) : (
                        <div className="text-sm">{merchant.name}</div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.columns.homepage")}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.homepage || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              homepage: e.target.value,
                            })
                          }
                        />
                      ) : merchant.homepage ? (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={merchant.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {new URL(merchant.homepage).hostname}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.columns.category")}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.primaryCategory || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              primaryCategory: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-sm">
                          {merchant.primaryCategory || "-"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.columns.country")}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.primaryCountry || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              primaryCountry: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-sm">
                          {merchant.primaryCountry || "-"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("common.columns.status")}
                      </Label>
                      {isEditing ? (
                        <Select
                          value={editForm.status || ""}
                          onValueChange={(value) =>
                            setEditForm({ ...editForm, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : merchant.status ? (
                        <Badge className={getStatusColor(merchant.status)}>
                          {merchant.status}
                        </Badge>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="freshReach"
                        checked={
                          isEditing
                            ? editForm.freshReachSupported
                            : merchant.freshReachSupported
                        }
                        onCheckedChange={(checked) =>
                          isEditing &&
                          setEditForm({
                            ...editForm,
                            freshReachSupported: checked,
                          })
                        }
                        disabled={!isEditing}
                      />
                      <Label htmlFor="freshReach" className="text-sm">
                        {t("fmtcMerchants.details.freshReachSupported")}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={
                          isEditing ? editForm.isActive : merchant.isActive
                        }
                        onCheckedChange={(checked) =>
                          isEditing &&
                          setEditForm({ ...editForm, isActive: checked })
                        }
                        disabled={!isEditing}
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        {t("common.active")}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("fmtcMerchants.details.technicalInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">FMTC ID</Label>
                      <div className="text-sm font-mono">
                        {merchant.fmtcId || "-"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.columns.network")} ID
                      </Label>
                      <div className="text-sm font-mono">
                        {merchant.networkId || "-"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.details.shipsTo")}
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {merchant.shipsTo && merchant.shipsTo.length > 0 ? (
                          merchant.shipsTo.map((country, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {country}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.columns.lastUpdate")}
                      </Label>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {merchant.lastScrapedAt
                          ? formatDate(merchant.lastScrapedAt)
                          : "-"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        {t("common.createdAt")}
                      </Label>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(merchant.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("fmtcMerchants.details.brandMatching")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {merchant.brand ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={merchant.brand.logo}
                            alt={merchant.brand.name}
                          />
                          <AvatarFallback>
                            {merchant.brand.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {merchant.brand.name}
                          </div>
                          {merchant.brand.description && (
                            <div className="text-sm text-muted-foreground">
                              {merchant.brand.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            merchant.brandMatchConfirmed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {merchant.brandMatchConfirmed
                            ? t("fmtcMerchants.status.confirmed")
                            : t("fmtcMerchants.status.needsConfirmation")}
                        </Badge>
                      </div>
                    </div>

                    {merchant.brandMatchConfidence && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {t("fmtcMerchants.columns.confidence")}
                          </span>
                          <span className="text-sm">
                            {(merchant.brandMatchConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={merchant.brandMatchConfidence * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    {!merchant.brandMatchConfirmed && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleConfirmBrandMatch}
                          disabled={isLoading}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t("fmtcMerchants.actions.confirmMatch")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleRejectBrandMatch}
                          disabled={isLoading}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {t("fmtcMerchants.actions.rejectMatch")}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4 text-sm text-muted-foreground">
                      {t("fmtcMerchants.details.noBrandMatch")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("fmtcMerchants.details.networkAssociations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {merchant.networks && merchant.networks.length > 0 ? (
                  <div className="space-y-3">
                    {merchant.networks.map((network) => (
                      <div
                        key={network.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <Network className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {network.networkName}
                            </div>
                            {network.networkId && (
                              <div className="text-sm text-muted-foreground font-mono">
                                ID: {network.networkId}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getNetworkStatusColor(network.status)}
                          >
                            {network.status}
                          </Badge>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              network.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Network className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4 text-sm text-muted-foreground">
                      {t("fmtcMerchants.details.noNetworks")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("fmtcMerchants.details.affiliateLinksInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("fmtcMerchants.details.primaryAffiliateLink")}
                  </Label>
                  {merchant.affiliateUrl ? (
                    <div className="flex items-center space-x-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={merchant.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm break-all"
                      >
                        {merchant.affiliateUrl}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">-</div>
                  )}
                </div>

                {/* 联盟链接详情 */}
                {merchant.affiliateLinks &&
                  Object.keys(merchant.affiliateLinks).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.details.affiliateLinksDetails")}
                      </Label>
                      <div className="space-y-3">
                        {Object.entries(merchant.affiliateLinks).map(
                          ([network, urls]) => (
                            <div
                              key={network}
                              className="border rounded-lg p-3"
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {network}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {t("fmtcMerchants.details.linkCount", {
                                    count: urls.length,
                                  })}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {urls.map((url, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <Link className="h-3 w-3 text-muted-foreground" />
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-xs break-all"
                                    >
                                      {url}
                                    </a>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* FreshReach 链接 */}
                {merchant.freshReachUrls &&
                  merchant.freshReachUrls.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("fmtcMerchants.details.freshReachLinks")}
                      </Label>
                      <div className="space-y-1">
                        {merchant.freshReachUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <Link className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm break-all"
                            >
                              {url}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("fmtcMerchants.details.previewDealsLink")}
                  </Label>
                  {merchant.previewDealsUrl ? (
                    <div className="flex items-center space-x-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={merchant.previewDealsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm break-all"
                      >
                        {merchant.previewDealsUrl}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">-</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("fmtcMerchants.details.logos")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Logo 120x60</Label>
                      {merchant.logo120x60 ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={merchant.logo120x60}
                            alt="Logo 120x60"
                            className="h-8 border rounded"
                          />
                          <a
                            href={merchant.logo120x60}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {t("common.view")}
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Logo 88x31</Label>
                      {merchant.logo88x31 ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={merchant.logo88x31}
                            alt="Logo 88x31"
                            className="h-6 border rounded"
                          />
                          <a
                            href={merchant.logo88x31}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {t("common.view")}
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("fmtcMerchants.details.screenshots")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Screenshot 280x210
                      </Label>
                      {merchant.screenshot280x210 ? (
                        <div className="space-y-2">
                          <img
                            src={merchant.screenshot280x210}
                            alt="Screenshot 280x210"
                            className="w-full h-24 object-cover border rounded"
                          />
                          <a
                            href={merchant.screenshot280x210}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {t("common.view")}
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Screenshot 600x450
                      </Label>
                      {merchant.screenshot600x450 ? (
                        <div className="space-y-2">
                          <img
                            src={merchant.screenshot600x450}
                            alt="Screenshot 600x450"
                            className="w-full h-32 object-cover border rounded"
                          />
                          <a
                            href={merchant.screenshot600x450}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {t("common.view")}
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex space-x-2">
              {merchant.homepage && (
                <Button variant="outline" asChild>
                  <a
                    href={merchant.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("fmtcMerchants.actions.visitSite")}
                  </a>
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              {isEditing && (
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {t("common.save")}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
