"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ScraperTaskDefinition } from "@prisma/client";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// TODO: Replace with actual import from @repo/types or a shared location
const ECommerceSite = {
  Mytheresa: "Mytheresa",
  Italist: "Italist",
  Yoox: "Yoox",
  Farfetch: "Farfetch",
  Cettire: "Cettire",
  // Add other sites as they are supported by scrapers
};

interface ScraperTaskDefinitionFormProps {
  taskDefinition?: ScraperTaskDefinition | null;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function ScraperTaskDefinitionForm({
  taskDefinition,
  onOpenChange,
  onSuccess,
}: ScraperTaskDefinitionFormProps) {
  const t = useTranslations("scraperManagement.definitionForm");
  const tValidation = useTranslations("scraperManagement.validation");

  // 为URL输入添加状态
  const [newUrl, setNewUrl] = useState("");

  const FormSchema = z.object({
    name: z.string().min(1, { message: tValidation("nameRequired") }),
    description: z.string().optional().nullable(),
    targetSite: z
      .string()
      .min(1, { message: tValidation("targetSiteRequired") }),
    startUrls: z
      .any()
      .transform((val: unknown) => {
        if (typeof val === "string") {
          return val
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s);
        }
        if (Array.isArray(val)) {
          return val
            .filter((item) => typeof item === "string")
            .map((s) => (s as string).trim())
            .filter((s) => s);
        }

        return [];
      })
      .pipe(
        z
          .array(z.string().url({ message: tValidation("urlInvalid") }))
          .min(1, { message: tValidation("startUrlsRequired") }),
      ),
    cronExpression: z.string().optional().nullable(),
    isEnabled: z.boolean().default(true),
    maxRequests: z.coerce
      .number()
      .int()
      .positive({ message: tValidation("positiveNumber") })
      .optional()
      .nullable(),
    maxLoadClicks: z.coerce
      .number()
      .int()
      .positive({ message: tValidation("positiveNumber") })
      .optional()
      .nullable(),
    maxProducts: z.coerce
      .number()
      .int()
      .positive({ message: tValidation("positiveNumber") })
      .optional()
      .nullable(),
    defaultInventory: z.coerce
      .number()
      .int()
      .nonnegative({ message: tValidation("inventoryNonNegative") })
      .default(99),
    isDebugModeEnabled: z.boolean().default(false),
  });

  type FormValues = z.infer<typeof FormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: taskDefinition?.name || "",
      description: taskDefinition?.description || "",
      targetSite: taskDefinition?.targetSite || "",
      startUrls: taskDefinition?.startUrls || [],
      cronExpression: taskDefinition?.cronExpression || "",
      isEnabled: taskDefinition?.isEnabled ?? true,
      maxRequests: taskDefinition?.maxRequests || undefined,
      maxLoadClicks: taskDefinition?.maxLoadClicks || undefined,
      maxProducts: taskDefinition?.maxProducts || undefined,
      defaultInventory: taskDefinition?.defaultInventory ?? 99,
      isDebugModeEnabled: taskDefinition?.isDebugModeEnabled ?? false,
    },
  });

  // 添加URL处理函数
  const handleAddUrl = (url: string) => {
    if (!url.trim()) return;

    // 验证输入是有效的 URL
    try {
      new URL(url); // 简单验证 URL 格式

      // 添加到现有数组，避免重复
      const currentUrls = Array.isArray(form.getValues("startUrls"))
        ? form.getValues("startUrls")
        : [];

      if (!currentUrls.includes(url)) {
        form.setValue("startUrls", [...currentUrls, url.trim()]);
        setNewUrl(""); // 清空输入框
      } else {
        toast.info(t("fields.startUrls.duplicateUrl") || "该URL已添加过");
      }
    } catch {
      // URL 无效
      toast.error(t("fields.startUrls.invalidUrl") || "请输入有效的URL");
    }
  };

  // 移除URL处理函数
  const handleRemoveUrl = (urlToRemove: string) => {
    const currentUrls = form.getValues("startUrls");

    if (Array.isArray(currentUrls)) {
      form.setValue(
        "startUrls",
        currentUrls.filter((url) => url !== urlToRemove),
      );
    }
  };

  useEffect(() => {
    if (taskDefinition) {
      form.reset({
        name: taskDefinition.name,
        description: taskDefinition.description || "",
        targetSite: taskDefinition.targetSite,
        startUrls: taskDefinition.startUrls || [],
        cronExpression: taskDefinition.cronExpression || "",
        isEnabled: taskDefinition.isEnabled,
        maxRequests:
          taskDefinition.maxRequests === null
            ? undefined
            : taskDefinition.maxRequests,
        maxLoadClicks:
          taskDefinition.maxLoadClicks === null
            ? undefined
            : taskDefinition.maxLoadClicks,
        maxProducts:
          taskDefinition.maxProducts === null
            ? undefined
            : taskDefinition.maxProducts,
        defaultInventory: taskDefinition.defaultInventory,
        isDebugModeEnabled: taskDefinition.isDebugModeEnabled,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        targetSite: "",
        startUrls: [],
        cronExpression: "",
        isEnabled: true,
        maxRequests: undefined,
        maxLoadClicks: undefined,
        maxProducts: undefined,
        defaultInventory: 99,
        isDebugModeEnabled: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDefinition, form.reset]); // form.reset should be stable, added to deps

  const onSubmit = async (values: FormValues) => {
    try {
      const method = taskDefinition ? "PUT" : "POST";
      const url = taskDefinition
        ? `/api/admin/scraper-tasks/definitions/${taskDefinition.id}`
        : "/api/admin/scraper-tasks/definitions";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const responseBody = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        throw new Error(
          responseBody.error ||
            (taskDefinition
              ? t("messages.updateErrorFallback")
              : t("messages.createErrorFallback")),
        );
      }

      toast.success(
        taskDefinition
          ? t("messages.updateSuccess", { name: values.name })
          : t("messages.createSuccess", { name: values.name }),
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || t("messages.unknownError"));
      } else {
        toast.error(t("messages.unknownError"));
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.name.label")}</FormLabel>
              <FormControl>
                <Input placeholder={t("fields.name.placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.description.label")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("fields.description.placeholder")}
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
          name="targetSite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.targetSite.label")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("fields.targetSite.placeholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ECommerceSite).map(([key, siteName]) => (
                    <SelectItem key={key} value={siteName as string}>
                      {siteName as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.startUrls.label")}</FormLabel>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Input
                    placeholder={t("fields.startUrls.placeholder")}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUrl(newUrl);
                      }
                    }}
                  />
                </FormControl>
                <Button
                  type="button"
                  onClick={() => handleAddUrl(newUrl)}
                  variant="secondary"
                  size="sm"
                >
                  {t("fields.startUrls.addButton")}
                </Button>
              </div>
              <FormDescription>
                {t("fields.startUrls.description")}
              </FormDescription>
              {Array.isArray(field.value) && field.value.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {field.value.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md bg-secondary/20"
                    >
                      <span className="text-sm truncate flex-1">{url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUrl(url)}
                      >
                        {t("fields.startUrls.removeButton")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cronExpression"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.cronExpression.label")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("fields.cronExpression.placeholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                {t("fields.cronExpression.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.maxRequests.label")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("fields.maxRequests.placeholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" || e.target.value == null
                          ? null
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxLoadClicks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.maxLoadClicks.label")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("fields.maxLoadClicks.placeholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" || e.target.value == null
                          ? null
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxProducts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.maxProducts.label")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("fields.maxProducts.placeholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" || e.target.value == null
                          ? null
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultInventory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.defaultInventory.label")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("fields.defaultInventory.placeholder")}
                    {...field}
                    value={field.value ?? 99}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{t("fields.isEnabled.label")}</FormLabel>
                <FormDescription>
                  {t("fields.isEnabled.description")}
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

        <FormField
          control={form.control}
          name="isDebugModeEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{t("fields.debugModeEnabled.label")}</FormLabel>
                <FormDescription>
                  {t("fields.debugModeEnabled.description")}
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? t("actions.submitting")
              : taskDefinition
                ? t("actions.saveChanges")
                : t("actions.createTask")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ScraperTaskDefinitionForm;
