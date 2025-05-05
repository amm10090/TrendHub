"use client";
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import { CustomNavbar } from "@/components/custom-navbar";

export default function Loading() {
  const t = useTranslations("brands");

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* Brands Table Loading Skeleton */}
        <div className="rounded-md border">
          <Table aria-label={`${t("title")} Loading`}>
            <TableHeader>
              <TableRow>
                <TableColumn>{t("columns.brand")}</TableColumn>
                <TableColumn>{t("columns.products")}</TableColumn>
                <TableColumn>{t("columns.website")}</TableColumn>
                <TableColumn className="text-center">
                  {t("columns.status")}
                </TableColumn>
                <TableColumn className="text-right">
                  {t("columns.actions")}
                </TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-md mr-3" />
                        <Skeleton className="h-4 w-32 rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 rounded" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-16 rounded-full mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
