"use client";

import { DiscountType } from "@prisma/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: Date;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatsInfo {
  total: number;
  active: number;
  expired: number;
  inactive: number;
}

export function DiscountDataTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState<StatsInfo>({
    total: 0,
    active: 0,
    expired: 0,
    inactive: 0,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 从URL参数构建查询字符串
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    if (!params.has("page")) params.set("page", "1");
    if (!params.has("limit")) params.set("limit", "20");

    return params.toString();
  }, [searchParams]);

  // 获取折扣数据
  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = buildQueryString();
      const response = await fetch(`/api/discounts?${queryString}`);
      const result = await response.json();

      if (result.success) {
        setDiscounts(result.data || []);
        setPagination(result.pagination);
        setStats(result.stats);
      } else {
        toast.error(result.error || "获取折扣数据失败");
      }
    } catch {
      toast.error("获取折扣数据失败");
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // 页面跳转
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // 批量操作
  const handleBatchAction = async (
    action: string,
    data?: Record<string, unknown>,
  ) => {
    if (selectedIds.length === 0) {
      toast.error("请选择要操作的折扣");

      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedIds([]);
        await fetchDiscounts();
      } else {
        toast.error(result.error || "操作失败");
      }
    } catch {
      toast.error("操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  // 复制折扣码
  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("折扣码已复制到剪贴板");
  };

  // 格式化日期
  const formatDate = (date?: Date) => {
    if (!date) return "-";

    return format(new Date(date), "MM/dd HH:mm", { locale: zhCN });
  };

  // 获取折扣类型标签
  const getDiscountTypeLabel = (type: DiscountType) => {
    const labels = {
      [DiscountType.PERCENTAGE]: "百分比",
      [DiscountType.FIXED_AMOUNT]: "固定金额",
      [DiscountType.FREE_SHIPPING]: "免费送货",
      [DiscountType.BUY_X_GET_Y]: "买X送Y",
      [DiscountType.OTHER]: "其他",
    };

    return labels[type] || "未知";
  };

  // 获取状态标签样式
  const getStatusBadge = (discount: Discount) => {
    if (discount.isExpired) {
      return <Badge variant="destructive">已过期</Badge>;
    } else if (!discount.isActive) {
      return <Badge variant="secondary">未激活</Badge>;
    } else {
      return <Badge variant="default">活跃</Badge>;
    }
  };

  // 格式化折扣值
  const formatDiscountValue = (discount: Discount) => {
    if (discount.value === undefined || discount.value === null) return "-";

    if (discount.type === DiscountType.PERCENTAGE) {
      return `${discount.value}%`;
    } else if (discount.type === DiscountType.FIXED_AMOUNT) {
      return `$${discount.value}`;
    }

    return discount.value.toString();
  };

  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 统计信息和批量操作 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            总计: <strong>{stats.total}</strong>
          </span>
          <span>
            活跃: <strong className="text-green-600">{stats.active}</strong>
          </span>
          <span>
            过期: <strong className="text-red-600">{stats.expired}</strong>
          </span>
          <span>
            未激活:{" "}
            <strong className="text-yellow-600">{stats.inactive}</strong>
          </span>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("activate")}
              disabled={actionLoading}
            >
              批量激活 ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("deactivate")}
              disabled={actionLoading}
            >
              批量禁用
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBatchAction("delete")}
              disabled={actionLoading}
            >
              批量删除
            </Button>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedIds.length === discounts.length &&
                    discounts.length > 0
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(discounts.map((d) => d.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>商家/品牌</TableHead>
              <TableHead>折扣信息</TableHead>
              <TableHead>类型/值</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead className="w-12">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(discount.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds([...selectedIds, discount.id]);
                      } else {
                        setSelectedIds(
                          selectedIds.filter((id) => id !== discount.id),
                        );
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {discount.brand ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={discount.brand.logo} />
                        <AvatarFallback>
                          {discount.brand.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                        {discount.merchantName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {discount.brand?.name || discount.merchantName}
                      </div>
                      {discount.brand && (
                        <div className="text-xs text-muted-foreground">
                          {discount.merchantName}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium text-sm leading-tight">
                      {discount.title}
                    </div>
                    {discount.code && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {discount.code}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1"
                          onClick={() => copyDiscountCode(discount.code!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {discount.dealStatus && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {discount.dealStatus}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{getDiscountTypeLabel(discount.type)}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {formatDiscountValue(discount)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(discount)}
                    {discount.rating && (
                      <div className="text-xs text-muted-foreground">
                        评分: {discount.rating}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {discount.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(discount.startDate)}
                      </div>
                    )}
                    {discount.endDate && (
                      <div
                        className={`flex items-center gap-1 ${
                          discount.isExpired ? "text-red-600" : ""
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(discount.endDate)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {discount.useCount}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      {discount.code && (
                        <DropdownMenuItem
                          onClick={() => copyDiscountCode(discount.code!)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          复制折扣码
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            显示 {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
            条， 共 {pagination.total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
