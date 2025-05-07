"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Editor } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { MenuBar } from "@/components/tiptap-editor/MenuBar";
import TiptapEditor from "@/components/tiptap-editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // Textarea 不再直接使用
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Page } from "@/hooks/use-pages"; // 假设 Page 类型从 use-pages 导出

// 从 apps/admin/src/app/[locale]/pages/page.tsx 移动并调整 PageFormSchema
// 注意：这里的 t 函数需要在组件内部通过 useTranslations 获取
const getPageFormSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t("validation.titleRequired")),
    url: z
      .string()
      .min(1, t("validation.urlRequired"))
      .regex(/^[a-z0-9/]+(?:-[a-z0-9]+)*$/, t("validation.urlFormat")) // 调整 regex 允许斜杠，移除了不必要的 \ 转义
      .refine((val) => val.startsWith("/"), {
        message: t("validation.urlStartsWithSlash"),
      }), // 确保以斜杠开头
    content: z.string().optional(),
    mainImage: z
      .string()
      .url(t("validation.mainImageUrl"))
      .optional()
      .or(z.literal("")),
    status: z.enum(["Published", "Draft"]),
  });

export type PageFormValues = z.infer<ReturnType<typeof getPageFormSchema>>;

interface PageFormProps {
  initialData?: Page | null; // 允许 null 以便区分加载中和无数据
  onSubmit: (data: PageFormValues) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

export function PageForm({
  initialData,
  onSubmit,
  isLoading,
  isEditMode,
  onCancel,
}: PageFormProps) {
  const t = useTranslations("pages");
  const PageFormSchema = getPageFormSchema(t);

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const form = useForm<PageFormValues>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: {
      title: "",
      url: "/", // 默认 URL 以 / 开头
      content: "",
      mainImage: "",
      status: "Draft",
      // 使用 initialData 安全地覆盖默认值
      ...(initialData && {
        ...initialData,
        url: initialData.url || "/", // 确保 url 有默认值
        content: initialData.content || "",
        mainImage: initialData.mainImage || "",
        status: (initialData.status as "Published" | "Draft") || "Draft",
      }),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        url: initialData.url || "/",
        content: initialData.content || "",
        mainImage: initialData.mainImage || "",
        status: (initialData.status as "Published" | "Draft") || "Draft",
      });
    } else {
      // 如果是创建模式，确保表单被重置为初始默认值，特别是 content
      form.reset({
        title: "",
        url: "/",
        content: "", // 确保 Tiptap 编辑器在创建时为空
        mainImage: "",
        status: "Draft",
      });
    }
  }, [initialData, form]);

  const watchedMainImage = form.watch("mainImage");

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? t("editPage") : t("createPage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
            {/* Left Column - 缩小为3列 */}
            <div className="md:col-span-3 space-y-4">
              <div>
                <Label htmlFor="title">{t("fields.title")}</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder={t("placeholders.title")}
                  className={
                    form.formState.errors.title ? "border-red-500" : ""
                  }
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="url">{t("fields.url")}</Label>
                <Input
                  id="url"
                  {...form.register("url")}
                  placeholder={t("placeholders.url")}
                  className={form.formState.errors.url ? "border-red-500" : ""}
                />
                {form.formState.errors.url && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.url.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mainImage">{t("fields.mainImage")}</Label>
                <Input
                  id="mainImage"
                  {...form.register("mainImage")}
                  placeholder={t("placeholders.mainImage")}
                  className={
                    form.formState.errors.mainImage ? "border-red-500" : ""
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("placeholders.mainImageHelp")}
                </p>
                {form.formState.errors.mainImage && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.mainImage.message}
                  </p>
                )}
                {watchedMainImage && (
                  <div className="mt-2 border rounded-md overflow-hidden w-full aspect-video relative">
                    <Image
                      src={watchedMainImage}
                      alt={t("preview")}
                      fill
                      style={{ objectFit: "contain" }}
                      onError={(e) => {
                        const imgElement = e.target as HTMLImageElement;

                        if (imgElement.getAttribute("data-fallback-applied"))
                          return;
                        imgElement.src = "/placeholder-image.jpg";
                        imgElement.setAttribute(
                          "data-fallback-applied",
                          "true",
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="status">{t("fields.status")}</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="status"
                        className={
                          form.formState.errors.status ? "border-red-500" : ""
                        }
                      >
                        <SelectValue
                          placeholder={t("placeholders.selectStatus")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">
                          {t("status.draft")}
                        </SelectItem>
                        <SelectItem value="Published">
                          {t("status.published")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Tiptap Editor - 扩大为7列 */}
            <div className="md:col-span-7 space-y-2 flex flex-col">
              <Label htmlFor="content">{t("fields.content")}</Label>
              <div className="border rounded-md flex-grow flex flex-col min-h-[500px]">
                {" "}
                {/* 增加最小高度 */}
                <MenuBar editor={editorInstance} />
                <Controller
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <TiptapEditor
                      content={field.value || ""}
                      onChange={field.onChange}
                      editable={!isLoading}
                      onEditorInstance={setEditorInstance}
                    />
                  )}
                />
              </div>
              {form.formState.errors.content && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} color="primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? t("actions.save") : t("actions.create")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
