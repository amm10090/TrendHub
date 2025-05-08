"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  ContentBlockForm,
  type ContentBlockFormValues,
} from "@/components/content-blocks/ContentBlockForm";
import { CustomNavbar } from "@/components/custom-navbar";
import { Button } from "@/components/ui/button";
import { useContentBlocks } from "@/hooks/use-content-blocks";

export default function CreateContentBlockPage() {
  const router = useRouter();
  const t = useTranslations("contentManagement.create");
  const { createContentBlock, isLoading: isSubmitting } = useContentBlocks();

  const handleSubmit = async (data: ContentBlockFormValues) => {
    try {
      // API 通常不需要 id，在创建时由数据库生成
      const { ...createData } = data; //

      // 清理 items 中的 id (如果存在)
      if (createData.items) {
        createData.items = createData.items.map((item) => {
          const { ...newItemData } = item;

          return newItemData;
        });
      }

      const newBlock = await createContentBlock(
        createData as Omit<ContentBlockFormValues, "id">,
      );

      toast.success(t("messages.createSuccess", { name: newBlock.name }));
      router.push("../content-management"); // 返回列表页
    } catch {
      // Hook 内部会处理 API 错误 toast，这里可以捕获后进行额外处理或记录
      // 如果 Hook 没有抛出特定错误而是返回 rejected Promise，错误处理已在 Hook 内完成
      // 如果需要，可以检查 error 类型并显示更具体的页面级错误
      // const errorMessage =
      //     error instanceof Error ? error.message : commonT("errors.unknownError");
      // toast.error(t("messages.createError", { error: errorMessage }));
    }
  };

  const handleCancel = () => {
    router.push("../content-management"); // 返回列表页
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-start space-x-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
        </div>
        <ContentBlockForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isEditMode={false}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

// 缺失的翻译 (需要添加到对应的 i18n json 文件中)
/*
// in contentManagement.json
{
  "create": {
    "title": "创建新内容块",
    "messages": {
      "createSuccess": "内容块 \"{name}\" 已成功创建。",
      "createError": "创建内容块失败: {error}"
    }
  }
}

// in common.json
{
   "errors": {
     "unknownError": "发生未知错误"
   }
}
*/
