"use client";

import { DiscountType } from "@prisma/client";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

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
      [DiscountType.PERCENTAGE]: "Percentage",
      [DiscountType.FIXED_AMOUNT]: "Fixed Amount",
      [DiscountType.FREE_SHIPPING]: "Free Shipping",
      [DiscountType.BUY_X_GET_Y]: "Buy X Get Y",
      [DiscountType.OTHER]: "Other",
    };

    return labels[type] || "Other";
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

    return format(date, "MM/dd/yy HH:mm", { locale: enUS });
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
          Showing first {maxRows} of {data.length} records
        </div>
      )}

      <ScrollArea className="h-[600px] w-full border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Merchant</TableHead>
              <TableHead className="min-w-[200px]">Discount Title</TableHead>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead className="w-[80px]">Type</TableHead>
              <TableHead className="w-[80px]">Value</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[120px]">Start Time</TableHead>
              <TableHead className="w-[120px]">End Time</TableHead>
              <TableHead className="w-[60px]">Rating</TableHead>
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
                    <div className="font-medium text-sm leading-tight whitespace-nowrap">
                      {discount.title?.replace(/[\r\n]+/g, " ").trim()}
                    </div>
                    {discount.minAmount && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Min spend: ${discount.minAmount}
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
                      No code required
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
                      Expired
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {discount.rating ? (
                    <div className="text-center">
                      <div className="font-medium">{discount.rating}</div>
                      <div className="text-muted-foreground">pts</div>
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
