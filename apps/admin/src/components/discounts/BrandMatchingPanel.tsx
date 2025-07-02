"use client";

import {
  Link2,
  Search,
  Edit,
  Check,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

interface BrandMapping {
  id: string;
  merchantName: string;
  brand?: Brand;
  brandId?: string;
  isConfirmed: boolean;
  confidence?: number;
  discountCount: number;
  createdAt: Date;
}

interface UnmatchedMerchant {
  merchantName: string;
  discountCount: number;
  sampleTitles: string[];
  suggestedBrands: Array<{
    brand: Brand;
    confidence: number;
  }>;
}

export function BrandMatchingPanel() {
  const t = useTranslations("discounts.brandMatching");
  const [mappings, setMappings] = useState<BrandMapping[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedMerchant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingMapping, setEditingMapping] = useState<BrandMapping | null>(
    null,
  );
  const [newBrandId, setNewBrandId] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mappingsRes, unmatchedRes, brandsRes] = await Promise.all([
        fetch("/api/discounts/brand-matching/mappings"),
        fetch("/api/discounts/brand-matching/unmatched"),
        fetch("/api/brands?limit=1000"),
      ]);

      const [mappingsResult, unmatchedResult, brandsResult] = await Promise.all(
        [mappingsRes.json(), unmatchedRes.json(), brandsRes.json()],
      );

      if (mappingsResult.success) {
        setMappings(mappingsResult.data || []);
      }

      if (unmatchedResult.success) {
        setUnmatched(unmatchedResult.data || []);
      }

      if (brandsResult.success) {
        setBrands(brandsResult.data || []);
      }
    } catch {
      toast.error(t("errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCreateMapping = async (merchantName: string, brandId: string) => {
    try {
      setProcessing(true);
      const response = await fetch("/api/discounts/brand-matching/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName,
          brandId,
          isConfirmed: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t("messages.createSuccess"));
        await fetchData();
      } else {
        toast.error(result.error || t("errors.createFailed"));
      }
    } catch {
      toast.error(t("errors.createFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateMapping = async (mappingId: string, brandId: string) => {
    try {
      setProcessing(true);
      const response = await fetch("/api/discounts/brand-matching/mappings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappingId,
          brandId,
          isConfirmed: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t("messages.updateSuccess"));
        setEditingMapping(null);
        setNewBrandId("");
        await fetchData();
      } else {
        toast.error(result.error || t("errors.updateFailed"));
      }
    } catch {
      toast.error(t("errors.updateFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      setProcessing(true);
      const response = await fetch("/api/discounts/brand-matching/mappings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t("messages.deleteSuccess"));
        await fetchData();
      } else {
        toast.error(result.error || t("errors.deleteFailed"));
      }
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchMatch = async () => {
    try {
      setProcessing(true);
      const response = await fetch("/api/discounts/brand-matching/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantNames: unmatched.map((u) => u.merchantName),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          t("messages.batchSuccess", { count: result.data.processed }),
        );
        await fetchData();
      } else {
        toast.error(result.error || t("errors.batchFailed"));
      }
    } catch {
      toast.error(t("errors.batchFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredMappings = mappings.filter((mapping) => {
    const matchesSearch =
      !searchTerm ||
      mapping.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.brand?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "confirmed" && mapping.isConfirmed) ||
      (selectedStatus === "unconfirmed" && !mapping.isConfirmed);

    return matchesSearch && matchesStatus;
  });

  const filteredUnmatched = unmatched.filter(
    (merchant) =>
      !searchTerm ||
      merchant.merchantName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              {t("title")}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchMatch}
                disabled={processing || unmatched.length === 0}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${processing ? "animate-spin" : ""}`}
                />
                {t("actions.batchMatch")}
              </Button>
              <Button size="sm" variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">{t("search.label")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t("search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <Label>{t("filters.status")}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    {t("filters.confirmed")}
                  </SelectItem>
                  <SelectItem value="unconfirmed">
                    {t("filters.unconfirmed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{mappings.length}</div>
              <div className="text-muted-foreground">{t("stats.mapped")}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {mappings.filter((m) => m.isConfirmed).length}
              </div>
              <div className="text-muted-foreground">
                {t("stats.confirmed")}
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {mappings.filter((m) => !m.isConfirmed).length}
              </div>
              <div className="text-muted-foreground">
                {t("stats.unconfirmed")}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {unmatched.length}
              </div>
              <div className="text-muted-foreground">
                {t("stats.unmatched")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Merchants */}
      {filteredUnmatched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              {t("unmatched.title", { count: filteredUnmatched.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUnmatched.map((merchant) => (
                <div
                  key={merchant.merchantName}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{merchant.merchantName}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("unmatched.discountCount", {
                        count: merchant.discountCount,
                      })}
                    </div>
                    {merchant.sampleTitles.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("unmatched.example")}:{" "}
                        {merchant.sampleTitles.slice(0, 2).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {merchant.suggestedBrands.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {t("unmatched.suggested")}:{" "}
                        {merchant.suggestedBrands[0].brand.name}(
                        {(merchant.suggestedBrands[0].confidence * 100).toFixed(
                          0,
                        )}
                        %)
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center"
                        >
                          <Link2 className="w-4 h-4 mr-1" />
                          {t("actions.link")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {t("dialogs.linkBrand.title")}
                          </DialogTitle>
                          <DialogDescription>
                            {t("dialogs.linkBrand.description", {
                              merchantName: merchant.merchantName,
                            })}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{t("dialogs.linkBrand.selectBrand")}</Label>
                            <Select
                              value={newBrandId}
                              onValueChange={setNewBrandId}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "dialogs.linkBrand.selectPlaceholder",
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {brands.map((brand) => (
                                  <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {merchant.suggestedBrands.length > 0 && (
                            <div>
                              <Label>{t("dialogs.linkBrand.suggested")}</Label>
                              <div className="space-y-2 mt-2">
                                {merchant.suggestedBrands
                                  .slice(0, 3)
                                  .map((suggestion) => (
                                    <div
                                      key={suggestion.brand.id}
                                      className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
                                      onClick={() =>
                                        setNewBrandId(suggestion.brand.id)
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          setNewBrandId(suggestion.brand.id);
                                        }
                                      }}
                                      role="button"
                                      tabIndex={0}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage
                                            src={suggestion.brand.logo}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {suggestion.brand.name
                                              .substring(0, 2)
                                              .toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                          {suggestion.brand.name}
                                        </span>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {(suggestion.confidence * 100).toFixed(
                                          0,
                                        )}
                                        %
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (newBrandId) {
                                handleCreateMapping(
                                  merchant.merchantName,
                                  newBrandId,
                                );
                                setNewBrandId("");
                              }
                            }}
                            disabled={!newBrandId || processing}
                          >
                            {t("actions.create")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matched Merchants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            {t("matched.title", { count: filteredMappings.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.merchantName")}</TableHead>
                  <TableHead>{t("table.linkedBrand")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.discountCount")}</TableHead>
                  <TableHead>{t("table.confidence")}</TableHead>
                  <TableHead className="w-32">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.merchantName}
                    </TableCell>
                    <TableCell>
                      {mapping.brand ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={mapping.brand.logo} />
                            <AvatarFallback className="text-xs">
                              {mapping.brand.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{mapping.brand.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("table.notLinked")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mapping.isConfirmed ? "default" : "secondary"}
                      >
                        {mapping.isConfirmed
                          ? t("status.confirmed")
                          : t("status.unconfirmed")}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.discountCount}</TableCell>
                    <TableCell>
                      {mapping.confidence ? (
                        <Badge variant="outline" className="text-xs">
                          {(mapping.confidence * 100).toFixed(0)}%
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMapping(mapping);
                                setNewBrandId(mapping.brandId || "");
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t("dialogs.editBrand.title")}
                              </DialogTitle>
                              <DialogDescription>
                                {t("dialogs.editBrand.description", {
                                  merchantName: mapping.merchantName,
                                })}
                              </DialogDescription>
                            </DialogHeader>
                            <div>
                              <Label>
                                {t("dialogs.editBrand.selectBrand")}
                              </Label>
                              <Select
                                value={newBrandId}
                                onValueChange={setNewBrandId}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "dialogs.editBrand.selectPlaceholder",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingMapping(null);
                                  setNewBrandId("");
                                }}
                              >
                                {t("actions.cancel")}
                              </Button>
                              <Button
                                onClick={() => {
                                  if (newBrandId && editingMapping) {
                                    handleUpdateMapping(
                                      editingMapping.id,
                                      newBrandId,
                                    );
                                  }
                                }}
                                disabled={!newBrandId || processing}
                              >
                                {t("actions.update")}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          disabled={processing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
