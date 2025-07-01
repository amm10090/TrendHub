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
import { useState, useEffect } from "react";
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

  const fetchData = async () => {
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
      toast.error("获取品牌匹配数据失败");
    } finally {
      setLoading(false);
    }
  };

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
        toast.success("品牌映射创建成功");
        await fetchData();
      } else {
        toast.error(result.error || "创建映射失败");
      }
    } catch {
      toast.error("创建映射失败");
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
        toast.success("品牌映射更新成功");
        setEditingMapping(null);
        setNewBrandId("");
        await fetchData();
      } else {
        toast.error(result.error || "更新映射失败");
      }
    } catch {
      toast.error("更新映射失败");
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
        toast.success("品牌映射删除成功");
        await fetchData();
      } else {
        toast.error(result.error || "删除映射失败");
      }
    } catch {
      toast.error("删除映射失败");
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
        toast.success(`批量匹配完成，处理了 ${result.data.processed} 个商家`);
        await fetchData();
      } else {
        toast.error(result.error || "批量匹配失败");
      }
    } catch {
      toast.error("批量匹配失败");
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
  }, []);

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
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              品牌匹配管理
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
                批量匹配
              </Button>
              <Button size="sm" variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选器 */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">搜索商家或品牌</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="输入商家名称或品牌名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <Label>状态</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="unconfirmed">未确认</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{mappings.length}</div>
              <div className="text-muted-foreground">已映射商家</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {mappings.filter((m) => m.isConfirmed).length}
              </div>
              <div className="text-muted-foreground">已确认</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {mappings.filter((m) => !m.isConfirmed).length}
              </div>
              <div className="text-muted-foreground">未确认</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {unmatched.length}
              </div>
              <div className="text-muted-foreground">未匹配</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 未匹配商家 */}
      {filteredUnmatched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              未匹配商家 ({filteredUnmatched.length})
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
                      {merchant.discountCount} 个折扣
                    </div>
                    {merchant.sampleTitles.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        示例: {merchant.sampleTitles.slice(0, 2).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {merchant.suggestedBrands.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        建议: {merchant.suggestedBrands[0].brand.name}(
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
                          关联品牌
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>关联品牌</DialogTitle>
                          <DialogDescription>
                            为商家 &quot;{merchant.merchantName}&quot;
                            选择关联的品牌
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>选择品牌</Label>
                            <Select
                              value={newBrandId}
                              onValueChange={setNewBrandId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择品牌" />
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
                              <Label>推荐品牌</Label>
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
                            创建关联
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

      {/* 已匹配商家 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            已匹配商家 ({filteredMappings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商家名称</TableHead>
                  <TableHead>关联品牌</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>折扣数量</TableHead>
                  <TableHead>匹配度</TableHead>
                  <TableHead className="w-32">操作</TableHead>
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
                        <span className="text-muted-foreground">未关联</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mapping.isConfirmed ? "default" : "secondary"}
                      >
                        {mapping.isConfirmed ? "已确认" : "未确认"}
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
                              <DialogTitle>编辑品牌关联</DialogTitle>
                              <DialogDescription>
                                修改商家 &quot;{mapping.merchantName}&quot;
                                的品牌关联
                              </DialogDescription>
                            </DialogHeader>
                            <div>
                              <Label>选择品牌</Label>
                              <Select
                                value={newBrandId}
                                onValueChange={setNewBrandId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择品牌" />
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
                                取消
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
                                更新
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
