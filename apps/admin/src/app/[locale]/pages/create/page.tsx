"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { CustomNavbar } from "@/components/custom-navbar";
import { PageForm, type PageFormValues } from "@/components/pages/PageForm";
import { Button } from "@/components/ui/button";
import { usePages, type CreatePageData } from "@/hooks/use-pages";

export default function CreatePage() {
  const router = useRouter();
  const t = useTranslations("pages");
  const { createPage: hookCreatePage } = usePages();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PageFormValues) => {
    setIsLoading(true);
    try {
      const createDataForApi: CreatePageData = {
        title: data.title,
        url: data.url,
        content: data.content || "",
        mainImage: data.mainImage || undefined,
        status: data.status as "Published" | "Draft",
      };

      await hookCreatePage(createDataForApi);

      toast.success(
        t("messages.createSuccessDescription", { title: data.title }),
      );
      router.push("..");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("messages.createErrorFallback");

      toast.error(
        t("messages.createErrorDescription", { error: errorMessage }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("..");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-start space-x-2 mb-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("createPage")}
          </h2>
        </div>
        <PageForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEditMode={false}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
