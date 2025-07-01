"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { DiscountImportForm } from "./DiscountImportForm";

interface DiscountImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountImportModal({
  open,
  onOpenChange,
}: DiscountImportModalProps) {
  const t = useTranslations("discounts.import");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <DiscountImportForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
