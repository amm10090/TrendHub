"use client";

import { DiscountType } from "@prisma/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FMTCDiscountData } from "@/lib/services/fmtc-parser.service";

interface DiscountPreviewTableProps {
  data: FMTCDiscountData[];
  maxRows?: number;
}

export function DiscountPreviewTable({
  data,
  maxRows = 50,
}: DiscountPreviewTableProps) {
  const displayData = maxRows ? data.slice(0, maxRows) : data;

  const getDiscountTypeLabel = (type: DiscountType) => {
    const labels = {
      [DiscountType.PERCENTAGE]: "百分比",
      [DiscountType.FIXED_AMOUNT]: "固定金额",
      [DiscountType.FREE_SHIPPING]: "免费送货",
      [DiscountType.BUY_X_GET_Y]: "买X送Y",
      [DiscountType.OTHER]: "其他",
    };

    return labels[type] || "其他";
  };

  const getDiscountTypeVariant = (type: DiscountType) => {
    const variants = {
      [DiscountType.PERCENTAGE]: "default",
      [DiscountType.FIXED_AMOUNT]: "secondary",
      [DiscountType.FREE_SHIPPING]: "outline",
      [DiscountType.BUY_X_GET_Y]: "destructive",
      [DiscountType.OTHER]: "outline",
    } as const;

    return variants[type] || "outline";
  };

  const getDealStatusVariant = (status?: string) => {
    if (!status) return "outline";

    const variants = {
      new: "default",
      active: "default",
      "not started": "secondary",
      ended: "destructive",
    } as const;

    return variants[status as keyof typeof variants] || "outline";
  };

  const formatDate = (date?: Date) => {
    if (!date) return "-";

    return format(date, "MM/dd/yy HH:mm", { locale: zhCN });
  };

  const formatValue = (discount: FMTCDiscountData) => {
    if (discount.value === undefined) return "-";

    if (discount.type === DiscountType.PERCENTAGE) {
      return `${discount.value}%`;
    } else if (discount.type === DiscountType.FIXED_AMOUNT) {
      return `$${discount.value}`;
    }

    return discount.value.toString();
  };

  const isExpired = (endDate?: Date) => {
    return endDate && endDate < new Date();
  };

  return (
    <div className="space-y-4">
      {maxRows && data.length > maxRows && (
        <div className="text-sm text-muted-foreground">
          显示前 {maxRows} 条记录，共 {data.length} 条
        </div>
      )}

      <ScrollArea className="h-[600px] w-full border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">商家</TableHead>
              <TableHead className="min-w-[200px]">折扣标题</TableHead>
              <TableHead className="w-[100px]">折扣码</TableHead>
              <TableHead className="w-[80px]">类型</TableHead>
              <TableHead className="w-[80px]">折扣值</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[120px]">开始时间</TableHead>
              <TableHead className="w-[120px]">结束时间</TableHead>
              <TableHead className="w-[60px]">评分</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((discount, index) => (
              <TableRow
                key={index}
                className={isExpired(discount.endDate) ? "opacity-60" : ""}
              >
                <TableCell className="font-medium">
                  <div
                    className="max-w-[140px] truncate"
                    title={discount.merchantName}
                  >
                    {discount.merchantName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[190px]">
                    <div className="font-medium text-sm leading-tight">
                      {discount.title}
                    </div>
                    {discount.minAmount && (
                      <div className="text-xs text-muted-foreground mt-1">
                        最低消费: ${discount.minAmount}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {discount.code ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {discount.code}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      无需代码
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getDiscountTypeVariant(discount.type)}
                    className="text-xs"
                  >
                    {getDiscountTypeLabel(discount.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatValue(discount)}</span>
                </TableCell>
                <TableCell>
                  {discount.dealStatus ? (
                    <Badge
                      variant={getDealStatusVariant(discount.dealStatus)}
                      className="text-xs"
                    >
                      {discount.dealStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(discount.startDate)}
                </TableCell>
                <TableCell className="text-xs">
                  <div
                    className={
                      isExpired(discount.endDate)
                        ? "text-red-600 font-medium"
                        : ""
                    }
                  >
                    {formatDate(discount.endDate)}
                  </div>
                  {isExpired(discount.endDate) && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      已过期
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {discount.rating ? (
                    <div className="text-center">
                      <div className="font-medium">{discount.rating}</div>
                      <div className="text-muted-foreground">分</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
