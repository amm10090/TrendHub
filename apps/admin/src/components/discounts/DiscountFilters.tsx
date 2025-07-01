"use client";

import { DiscountType } from "@prisma/client";
import { X, Search, Filter, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Brand {
  id: string;
  name: string;
}

export function DiscountFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brandId") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "",
  );
  const [merchantName, setMerchantName] = useState(
    searchParams.get("merchantName") || "",
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 获取品牌列表
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch("/api/brands?limit=100");
        const result = await response.json();

        if (result.success) {
          setBrands(result.data || []);
        }
      } catch {
        return;
      }
    };

    fetchBrands();
  }, []);

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = () => {
    return !!(
      searchTerm ||
      selectedBrand ||
      selectedStatus !== "all" ||
      selectedType ||
      merchantName
    );
  };

  // 应用筛选条件
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("search", searchTerm);
    if (selectedBrand) params.set("brandId", selectedBrand);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedType) params.set("type", selectedType);
    if (merchantName) params.set("merchantName", merchantName);

    // 重置页码
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  // 清除所有筛选条件
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("");
    setSelectedStatus("all");
    setSelectedType("");
    setMerchantName("");
    router.push("?page=1");
  };

  // 移除单个筛选条件
  const removeFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams.toString());

    switch (filterType) {
      case "search":
        setSearchTerm("");
        params.delete("search");
        break;
      case "brandId":
        setSelectedBrand("");
        params.delete("brandId");
        break;
      case "status":
        setSelectedStatus("all");
        params.delete("status");
        break;
      case "type":
        setSelectedType("");
        params.delete("type");
        break;
      case "merchantName":
        setMerchantName("");
        params.delete("merchantName");
        break;
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    const labels = {
      all: "全部",
      active: "活跃",
      expired: "已过期",
      inactive: "未激活",
    };

    return labels[status as keyof typeof labels] || status;
  };

  // 获取类型标签
  const getTypeLabel = (type: DiscountType) => {
    const labels = {
      [DiscountType.PERCENTAGE]: "百分比",
      [DiscountType.FIXED_AMOUNT]: "固定金额",
      [DiscountType.FREE_SHIPPING]: "免费送货",
      [DiscountType.BUY_X_GET_Y]: "买X送Y",
      [DiscountType.OTHER]: "其他",
    };

    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* 主要筛选器 */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-64">
          <Label htmlFor="search">搜索折扣</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="搜索标题、商家或折扣码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-48">
          <Label>状态</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Label>品牌</Label>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="选择品牌" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部品牌</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters}>
            <Search className="w-4 h-4 mr-2" />
            搜索
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4 mr-2" />
            高级筛选
          </Button>
          {hasActiveFilters() && (
            <Button variant="outline" onClick={clearFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              清除
            </Button>
          )}
        </div>
      </div>

      {/* 高级筛选器 */}
      {showAdvanced && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="merchantName">商家名称</Label>
              <Input
                id="merchantName"
                placeholder="筛选特定商家..."
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            <div>
              <Label>折扣类型</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value={DiscountType.PERCENTAGE}>
                    百分比
                  </SelectItem>
                  <SelectItem value={DiscountType.FIXED_AMOUNT}>
                    固定金额
                  </SelectItem>
                  <SelectItem value={DiscountType.FREE_SHIPPING}>
                    免费送货
                  </SelectItem>
                  <SelectItem value={DiscountType.BUY_X_GET_Y}>
                    买X送Y
                  </SelectItem>
                  <SelectItem value={DiscountType.OTHER}>其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                应用高级筛选
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 活跃筛选条件标签 */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">活跃筛选:</span>

          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              搜索: {searchTerm}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("search")}
              />
            </Badge>
          )}

          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              状态: {getStatusLabel(selectedStatus)}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("status")}
              />
            </Badge>
          )}

          {selectedBrand && (
            <Badge variant="secondary" className="flex items-center gap-1">
              品牌: {brands.find((b) => b.id === selectedBrand)?.name || "未知"}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("brandId")}
              />
            </Badge>
          )}

          {selectedType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              类型: {getTypeLabel(selectedType as DiscountType)}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("type")}
              />
            </Badge>
          )}

          {merchantName && (
            <Badge variant="secondary" className="flex items-center gap-1">
              商家: {merchantName}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("merchantName")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
