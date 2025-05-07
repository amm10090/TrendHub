"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation"; // useParams 用于获取动态路由参数
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { CustomNavbar } from "@/components/custom-navbar";
import { PageForm, type PageFormValues } from "@/components/pages/PageForm";
import { Button } from "@/components/ui/button";
import { usePages, type Page, type UpdatePageData } from "@/hooks/use-pages"; // 导入 UpdatePageData

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("pages");
  const { updatePage: hookUpdatePage, fetchPage } = usePages();

  const pageId = typeof params.id === "string" ? params.id : undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // 用于加载初始数据
  const [initialData, setInitialData] = useState<Page | null>(null);

  useEffect(() => {
    if (pageId) {
      setIsFetching(true);
      fetchPage(pageId)
        .then((data) => {
          if (data) {
            setInitialData(data);
          } else {
            toast.error(t("messages.fetchDetailError"));
            router.push("../.."); // 如果页面不存在，返回列表页 (pages)
          }
        })
        .catch(() => {
          toast.error(t("messages.fetchDetailError"));
          router.push("../..");
        })
        .finally(() => setIsFetching(false));
    } else {
      // 如果没有 pageId (例如直接访问 /edit/ 路径)，则重定向
      toast.error(t("messages.invalidPageId")); // 需要添加此翻译
      router.push("../..");
      setIsFetching(false);
    }
  }, [pageId, fetchPage, router, t]);

  const handleSubmit = async (data: PageFormValues) => {
    if (!pageId) return;
    setIsLoading(true);
    try {
      const updateData: UpdatePageData = {
        title: data.title,
        url: data.url,
        content: data.content,
        mainImage: data.mainImage,
        status: data.status as "Published" | "Draft",
      };

      await hookUpdatePage(pageId, updateData);
      toast.success(
        t("messages.updateSuccessDescription", { title: data.title }),
      ); // 需要添加此翻译
      router.push("../.."); // 返回列表页
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("messages.updateErrorFallback"); // 需要添加此翻译

      toast.error(
        t("messages.updateErrorDescription", { error: errorMessage }),
      ); // 需要添加此翻译
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("../.."); // 返回列表页
  };

  if (isFetching) {
    return (
      <div className="flex min-h-screen flex-col">
        <CustomNavbar />
        <div className="flex flex-1 justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!initialData && !isFetching) {
    // 如果获取失败且已结束获取
    // 错误 toast 已在 useEffect 中显示，此处可以不渲染表单或显示错误信息
    return (
      <div className="flex min-h-screen flex-col">
        <CustomNavbar />
        <div className="flex flex-1 flex-col justify-center items-center p-4 md:p-8">
          <p className="text-red-500 mb-4">{t("messages.pageLoadFailed")}</p>{" "}
          {/* 需要添加此翻译 */}
          <Button onClick={handleCancel}>{t("actions.backToList")}</Button>{" "}
          {/* 需要添加此翻译 */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-start space-x-2 mb-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("editPage")}
          </h2>
        </div>
        {initialData && (
          <PageForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isEditMode={true}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
