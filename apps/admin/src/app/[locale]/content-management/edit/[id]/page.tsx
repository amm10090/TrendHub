"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
  ContentBlockForm,
  type ContentBlockFormValues,
} from "@/components/content-blocks/ContentBlockForm";
import { CustomNavbar } from "@/components/custom-navbar";
import { Button } from "@/components/ui/button";
import { useContentBlocks } from "@/hooks/use-content-blocks"; // 导入 Hook

export default function EditContentBlockPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("contentManagement.edit");
  const commonT = useTranslations("common");
  const {
    fetchContentBlock,
    updateContentBlock,
    isLoading: isHookLoading, // 通用的加载状态，可用于提交和初始加载
  } = useContentBlocks();

  const blockId = typeof params.id === "string" ? params.id : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false); // 用于提交表单时的加载状态
  const [isFetchingInitial, setIsFetchingInitial] = useState(true); // 用于加载初始数据
  const [initialData, setInitialData] = useState<ContentBlockFormValues | null>(
    null,
  );

  const loadInitialData = useCallback(async () => {
    if (blockId) {
      setIsFetchingInitial(true);
      try {
        const data = await fetchContentBlock(blockId);

        if (data) {
          setInitialData(data as ContentBlockFormValues); // 假设 API 返回类型与表单值兼容
        } else {
          // Hook 内部已用 toast 显示 "not found" 错误
          router.push("../../content-management");
        }
      } catch {
        // Hook 内部已用 toast 显示其他获取错误
        router.push("../../content-management");
      } finally {
        setIsFetchingInitial(false);
      }
    } else {
      toast.error(t("messages.invalidId"));
      router.push("../../content-management");
      setIsFetchingInitial(false);
    }
  }, [blockId, fetchContentBlock, router, t]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSubmit = async (data: ContentBlockFormValues) => {
    if (!blockId) return;
    setIsSubmitting(true);
    try {
      const updatedBlock = await updateContentBlock(blockId, data);

      toast.success(t("messages.updateSuccess", { name: updatedBlock.name }));
      router.push("../../content-management");
    } catch {
      // Hook 内部会处理 API 错误 toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("../../content-management");
  };

  // 合并加载状态：如果正在获取初始数据，或者 Hook 正在执行其他操作（例如，提交），都视为加载中
  const isLoadingPage = isFetchingInitial || isHookLoading;

  if (isLoadingPage && !initialData) {
    // 初始加载时，且无数据显示，显示全局加载
    return (
      <div className="flex min-h-screen flex-col">
        <CustomNavbar />
        <div className="flex flex-1 justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!initialData && !isLoadingPage) {
    // 如果获取失败且已结束获取 (例如，ID 无效或未找到)
    return (
      <div className="flex min-h-screen flex-col">
        <CustomNavbar />
        <div className="flex flex-1 flex-col justify-center items-center p-4 md:p-8">
          <p className="text-red-500 mb-4">{t("messages.loadFailed")}</p>
          <Button onClick={handleCancel}>
            {commonT("actions.backToList")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-start space-x-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCancel}
            disabled={isSubmitting || isLoadingPage}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
        </div>
        {initialData && (
          <ContentBlockForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isSubmitting || isHookLoading} // 表单提交或 Hook 正在忙碌
            isEditMode={true}
            onCancel={handleCancel}
          />
        )}
        {/* 如果正在获取初始数据但已有数据显示(不太可能发生在此逻辑下，但作为备用)，可以显示一个小的加载器 */}
        {isLoadingPage && initialData && (
          <div className="absolute inset-0 bg-background/50 flex justify-center items-center z-50">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// 缺失的翻译 (需要添加到对应的 i18n json 文件中)
/*
// in contentManagement.json
{
  "edit": {
    "title": "编辑内容块",
    "messages": {
      "fetchErrorNotFound": "无法加载内容块数据，可能已被删除。", // Hook会处理这个
      "fetchErrorGeneric": "加载内容块数据时出错。", // Hook会处理这个
      "invalidId": "无效的内容块 ID。",
      "loadFailed": "内容块数据加载失败或未找到。",
      "updateSuccess": "内容块 \"{name}\" 已成功更新。",
      "updateError": "更新内容块失败: {error}" // Hook会处理这个
    }
  }
}

// in common.json
{
   "actions": {
     "backToList": "返回列表"
   }
}
*/
