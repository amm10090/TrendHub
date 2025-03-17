"use client";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import { MoreHorizontal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import type { Product } from "@/lib/services/product.service";

interface ActionMenuProps {
  product: Product;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

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

function AddButton() {
  const t = useTranslations("products");

  return (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      {t("addProduct")}
    </Button>
  );
}

function ActionMenu({ product, onDelete, isDeleting }: ActionMenuProps) {
  const t = useTranslations("products");

  const handleDelete = () => {
    if (onDelete && !isDeleting) {
      onDelete(product.id);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
          <span className="sr-only">
            {t("openMenuFor", { name: product.name })}
          </span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={t("actionsFor", { name: product.name })}>
        <DropdownItem key="label" isReadOnly>
          {t("actions")}
        </DropdownItem>
        <DropdownItem key="edit">{t("edit")}</DropdownItem>
        <DropdownItem key="duplicate">{t("duplicate")}</DropdownItem>
        <DropdownSection showDivider>
          <DropdownItem key="archive">{t("archive")}</DropdownItem>
          <DropdownItem
            key="delete"
            className="text-red-600"
            onClick={handleDelete}
            isDisabled={isDeleting}
          >
            {isDeleting ? t("deleting") : t("delete")}
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}

export const ProductsClient = {
  NavbarWrapper,
  PageWrapper,
  AddButton,
  ActionMenu,
};
