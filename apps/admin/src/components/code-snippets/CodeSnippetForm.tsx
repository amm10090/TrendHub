"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-github"; // 您可以选择一个主题
import "ace-builds/src-noconflict/ext-language_tools";

import { Button } from "@/components/ui/button"; // 确认路径正确
import {
  Dialog, // 或 Sheet
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // 如果使用 Dialog
} from "@/components/ui/dialog"; // 确认路径正确
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // 确认路径正确
import { Input } from "@/components/ui/input"; // 确认路径正确
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // 确认路径正确
import {
  Sheet, // 或 Dialog
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose, // 如果使用 Sheet
} from "@/components/ui/sheet"; // 确认路径正确
import { Switch } from "@/components/ui/switch"; // 确认路径正确
import { Textarea } from "@/components/ui/textarea"; // 确认路径正确
import {
  CodeSnippet,
  CreateCodeSnippetPayload,
  UpdateCodeSnippetPayload,
  CodeSnippetService,
  SnippetType,
  SnippetLocation,
} from "@/lib/services/code-snippet.service"; // 确认路径正确

// Zod 验证 Schema
const formSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  description: z.string().optional(),
  code: z.string().min(1, "Code cannot be empty"),
  type: z.nativeEnum(SnippetType),
  location: z.nativeEnum(SnippetLocation),
  priority: z.coerce.number().int().default(10),
  isActive: z.boolean().default(false),
});

type CodeSnippetFormValues = Omit<z.infer<typeof formSchema>, "paths">;

interface CodeSnippetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  snippet?: CodeSnippet | null; // 传入用于编辑的片段，否则为创建模式
  onSuccess: () => void; // 成功回调，用于刷新列表等
  useSheet?: boolean; // 控制使用Dialog还是Sheet
}

export function CodeSnippetForm({
  isOpen,
  onOpenChange,
  snippet,
  onSuccess,
  useSheet = false, // 默认使用Dialog
}: CodeSnippetFormProps) {
  const t = useTranslations("codeSnippets");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pathsValue, setPathsValue] = useState("");
  const isEditing = !!snippet;

  const form = useForm<CodeSnippetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
      type: SnippetType.JS,
      location: SnippetLocation.BODY_END,
      priority: 10,
      isActive: false,
    },
  });

  // 如果是编辑模式，填充表单
  useEffect(() => {
    if (isEditing && snippet) {
      form.reset({
        name: snippet.name,
        description: snippet.description ?? "",
        code: snippet.code,
        type: snippet.type,
        location: snippet.location,
        priority: snippet.priority,
        isActive: snippet.isActive,
      });
      setPathsValue(snippet.paths.join("\n"));
    } else {
      form.reset(); // 重置为默认值（或根据需要调整创建时的默认值）
      setPathsValue("");
    }
  }, [isEditing, snippet, form]);

  const onSubmit = async (values: CodeSnippetFormValues) => {
    setIsSubmitting(true);
    try {
      let response;
      const pathsArray = pathsValue
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      const payload: CreateCodeSnippetPayload | UpdateCodeSnippetPayload = {
        ...values,
        paths: pathsArray,
      };

      if (isEditing && snippet) {
        response = await CodeSnippetService.updateSnippet(snippet.id, payload);
      } else {
        response = await CodeSnippetService.createSnippet(
          payload as CreateCodeSnippetPayload,
        );
      }

      if (response.success) {
        toast.success(
          isEditing ? t("messages.updateSuccess") : t("messages.createSuccess"),
          {
            description: t("messages.saveSuccessDesc", { name: values.name }),
          },
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(
          isEditing ? t("messages.updateError") : t("messages.createError"),
          {
            description: response.error || t("messages.saveErrorDesc"),
          },
        );
      }
    } catch {
      toast.error(t("messages.submitError"), {
        description: t("messages.submitErrorDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePathsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPathsValue(e.target.value);
  };

  const renderFormFields = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("form.namePlaceholder")} {...field} />
              </FormControl>
              <FormDescription>{t("form.nameDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form.descriptionPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.codeLabel")}</FormLabel>
              <FormControl>
                <AceEditor
                  mode={
                    form.watch("type") === SnippetType.JS ? "javascript" : "css"
                  }
                  theme="github" // 或其他主题
                  onChange={field.onChange}
                  value={field.value}
                  name="code-editor"
                  editorProps={{ $blockScrolling: true }}
                  width="100%"
                  height="300px"
                  fontSize={14}
                  showPrintMargin={true}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />
              </FormControl>
              <FormDescription>{t("form.codeDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.typeLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.typePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SnippetType.JS}>
                      {t("form.typeJS")}
                    </SelectItem>
                    <SelectItem value={SnippetType.CSS}>
                      {t("form.typeCSS")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.locationLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("form.locationPlaceholder")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SnippetLocation.HEAD}>
                      {t("form.locationHead")}
                    </SelectItem>
                    <SelectItem value={SnippetLocation.BODY_START}>
                      {t("form.locationBodyStart")}
                    </SelectItem>
                    <SelectItem value={SnippetLocation.BODY_END}>
                      {t("form.locationBodyEnd")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor="paths-textarea">{t("form.pathsLabel")}</FormLabel>
          <Textarea
            id="paths-textarea"
            placeholder={t("form.pathsPlaceholder")}
            value={pathsValue}
            onChange={handlePathsChange}
            rows={4}
          />
          <FormDescription>{t("form.pathsDescription")}</FormDescription>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.priorityLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("form.priorityPlaceholder")}
                    {...field}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  {t("form.priorityDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{t("form.statusLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.statusDescription")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Footer in Dialog or Sheet */}
        {useSheet ? (
          <SheetFooter className="pt-6">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t("form.cancel")}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? t("form.submitting")
                : isEditing
                  ? t("form.saveChanges")
                  : t("form.createSnippet")}
            </Button>
          </SheetFooter>
        ) : (
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? t("form.submitting")
                : isEditing
                  ? t("form.saveChanges")
                  : t("form.createSnippet")}
            </Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );

  const title = isEditing ? t("editSnippet") : t("createSnippet");
  const description = isEditing
    ? t("editSnippetDescription", { name: snippet?.name || "" })
    : t("createSnippetDescription");

  if (useSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {renderFormFields()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {renderFormFields()}
      </DialogContent>
    </Dialog>
  );
}
