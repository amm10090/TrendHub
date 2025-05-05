"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { CustomNavbar } from "@/components/custom-navbar";

function NavbarWrapper() {
  return <CustomNavbar />;
}

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarWrapper />
      <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
    </div>
  );
}

function CancelButton() {
  const t = useTranslations("product.edit");
  return <Button variant="bordered">{t("cancel")}</Button>;
}

function SaveButton() {
  const t = useTranslations("product.edit");
  return <Button>{t("save")}</Button>;
}

export const EditProductClient = {
  NavbarWrapper,
  PageWrapper,
  CancelButton,
  SaveButton,
};
