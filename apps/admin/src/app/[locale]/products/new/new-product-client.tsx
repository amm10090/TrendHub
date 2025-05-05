"use client";

import { ReactNode } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import { Button } from "@/components/ui/button";

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

function SaveDraftButton() {
  return <Button variant="outline">Save as Draft</Button>;
}

function PublishButton() {
  return <Button>Publish Product</Button>;
}

export const NewProductClient = {
  NavbarWrapper,
  PageWrapper,
  SaveDraftButton,
  PublishButton,
};
