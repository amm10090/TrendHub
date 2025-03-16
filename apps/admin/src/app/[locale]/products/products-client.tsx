"use client";

import {
  Button,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import { MoreHorizontal, Plus } from "lucide-react";
import { ReactNode } from "react";

import { CustomNavbar } from "@/components/custom-navbar";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  status: string;
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
  return (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  );
}

function ActionMenu({ product }: { product: Product }) {
  return (
    <DropdownMenu aria-label={`Actions for ${product.name}`}>
      <DropdownTrigger>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu for {product.name}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownItem key="label" isReadOnly>
        Actions
      </DropdownItem>
      <DropdownItem key="edit">Edit</DropdownItem>
      <DropdownItem key="duplicate">Duplicate</DropdownItem>
      <DropdownSection showDivider>
        <DropdownItem key="archive">Archive</DropdownItem>
        <DropdownItem key="delete" className="text-red-600">
          Delete
        </DropdownItem>
      </DropdownSection>
    </DropdownMenu>
  );
}

export const ProductsClient = {
  NavbarWrapper,
  PageWrapper,
  AddButton,
  ActionMenu,
};
