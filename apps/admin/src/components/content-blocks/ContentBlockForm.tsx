"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ContentBlockType, ContentItemType } from "@prisma/client"; // 假设 Prisma 类型已正确生成并可用
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, FC, ReactNode, useState, useMemo } from "react";
import {
  useFieldArray,
  useForm,
  Controller,
  Control,
  FieldValues,
} from "react-hook-form";
import { toast } from "sonner"; // 新增：导入 toast
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"; // Corrected path
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ProductSelectorModal,
  type ProductAdminSelectItem,
} from "./ProductSelectorModal";
import { TrendingSectionAdminPreview } from "./TrendingSectionAdminPreview";

// --- Zod Schemas --- (应与 API 路由中的定义保持一致或从共享位置导入)
// 定义新的特殊值常量
const GENDER_PREFIX_NONE_VALUE = "__NONE__";

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

// --- Specific Data Schemas for ContentBlockType ---
const BannerBlockDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").or(z.literal("")).optional(),
  linkUrl: z.string().url("Invalid link URL").or(z.literal("")).optional(),
  ctaText: z.string().optional(),
});

const IntroductionSectionDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  descriptionParagraph: z.string().min(1, "Description paragraph is required"),
  featuresLeft: z.string().optional(), // Represented as a single string, newlines for list
  featuresRight: z.string().optional(), // Represented as a single string, newlines for list
  bottomText: z.string().optional(),
});

const ProductGridHeroDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  seeAllText: z.string().optional(),
  seeAllLink: z.string().url("Invalid link URL").or(z.literal("")).optional(),
});

// 新增：PRODUCT_GRID_CONFIGURABLE 的 data schema
const ProductGridConfigurableBlockDataSchema = z.object({
  title: z.string().min(1, "Grid title is required"),
  seeAllText: z.string().optional(),
  seeAllLink: z.string().url("Invalid link URL").or(z.literal("")).optional(),
  dataSourceType: z
    .enum(["MANUAL_SELECTION", "DYNAMIC_QUERY"])
    .default("MANUAL_SELECTION"),
  // dynamicQueryConfig: z.any().optional(), // DYNAMIC_QUERY not implemented yet
  maxDisplayItems: z.coerce
    .number()
    .int()
    .positive("Must be a positive integer")
    .optional(),
});

// --- Specific Data Schemas for ContentItemType ---
const TrendingCardDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").or(z.literal("")).optional(),
  href: z.string().url("Invalid link URL").or(z.literal("")).optional(),
  topLabel: z.string().optional(),
  subtitle: z.string().optional(),
  textPosition: z.enum(["bottom", "center"]).optional().default("bottom"),
  textPlacement: z
    .enum(["below-image", "above-image", "overlay", "standalone"])
    .optional()
    .default("overlay"),
  size: z
    .enum(["normal", "large", "vertical", "horizontal", "small"])
    .optional()
    .default("normal"),
  labelText: z.string().optional().nullable(),
  labelLinkUrl: z
    .string()
    .url("Invalid URL for label")
    .or(z.literal(""))
    .optional()
    .nullable(),
  itemTitleText: z.string().optional().nullable(),
  itemTitleLinkUrl: z
    .string()
    .url("Invalid URL for title")
    .or(z.literal(""))
    .optional()
    .nullable(),
});

const ShiningCardDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().url("Invalid image URL").min(1, "Image URL is required"),
  linkUrl: z.string().url("Invalid link URL").min(1, "Link URL is required"),
});

const TextLinkBlockDataSchema = z.object({
  text: z.string().min(1, "Text is required"),
  linkUrl: z.string().url("Invalid link URL").or(z.literal("")).optional(),
  styleHint: z.string().optional(),
});

const IntroductionGuaranteeItemDataSchema = z.object({
  iconKey: z.string().min(1, "Icon key is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

// PRODUCT_REFERENCE data schema
const ProductReferenceItemDataSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  // productName: z.string().optional(), // productName for UI display, not stored in data
});

export const ContentItemFormSchema = z
  .object({
    id: z.string().optional(), // for update identification
    itemIdentifier: z.string().optional().nullable(), // allow null
    slotKey: z.string().optional().nullable(), // slotKey field
    type: z.nativeEnum(ContentItemType),
    name: z.string().min(1, "Name is required"),
    data: z.any(), // jsonSchema,
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((itemData, ctx) => {
    switch (itemData.type) {
      case ContentItemType.TRENDING_CARD_LARGE:
      case ContentItemType.TRENDING_CARD_NORMAL: {
        const trendingResult = TrendingCardDataSchema.safeParse(itemData.data);

        if (!trendingResult.success) {
          trendingResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentItemType.TRENDING_CARD_STANDALONE: {
        const standaloneCardData = TrendingCardDataSchema.pick({
          title: true,
          imageUrl: true,
          href: true,
          labelText: true,
          labelLinkUrl: true,
          itemTitleText: true,
          itemTitleLinkUrl: true,
        }).safeParse(itemData.data);

        if (!standaloneCardData.success) {
          standaloneCardData.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentItemType.SHINING_CARD: {
        const shiningResult = ShiningCardDataSchema.safeParse(itemData.data);

        if (!shiningResult.success) {
          shiningResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentItemType.TEXT_LINK_BLOCK: {
        const textLinkResult = TextLinkBlockDataSchema.safeParse(itemData.data);

        if (!textLinkResult.success) {
          textLinkResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentItemType.INTRODUCTION_GUARANTEE_ITEM: {
        const guaranteeResult = IntroductionGuaranteeItemDataSchema.safeParse(
          itemData.data,
        );

        if (!guaranteeResult.success) {
          guaranteeResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      // 新增：处理 PRODUCT_REFERENCE 类型
      case ContentItemType.PRODUCT_REFERENCE: {
        const productRefResult = ProductReferenceItemDataSchema.safeParse(
          itemData.data,
        );

        if (!productRefResult.success) {
          productRefResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      default:
        // Optionally, you could add an issue if the type is unrecognized
        // or if data is present for a type not expecting it.
        break;
    }
  });

export type ContentItemFormValues = z.infer<typeof ContentItemFormSchema>;

// Base object Schema without superRefine, for export and composition
export const BaseContentBlockFormObjectSchema = z.object({
  id: z.string().optional(),
  identifier: z
    .string()
    .min(1, "Identifier is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers and hyphens allowed",
    ),
  type: z.nativeEnum(ContentBlockType),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  data: z.any().optional().nullable(),
  isActive: z.boolean().default(true),
  targetPrimaryCategoryId: z
    .string()
    .cuid({ message: "Invalid primary category ID" })
    .optional()
    .nullable(),
  targetPrimaryCategory: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .optional()
    .nullable(),
  items: z.array(ContentItemFormSchema).optional(),
});

// 导出的 ContentBlockFormSchema，应用了 superRefine 逻辑，主要用于表单验证
export const ContentBlockFormSchema =
  BaseContentBlockFormObjectSchema.superRefine((blockData, ctx) => {
    switch (blockData.type) {
      case ContentBlockType.BANNER: {
        const bannerResult = BannerBlockDataSchema.safeParse(blockData.data);

        if (!bannerResult.success) {
          bannerResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentBlockType.INTRODUCTION_SECTION: {
        const introResult = IntroductionSectionDataSchema.safeParse(
          blockData.data,
        );

        if (!introResult.success) {
          introResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentBlockType.PRODUCT_GRID_HERO: {
        const gridResult = ProductGridHeroDataSchema.safeParse(blockData.data);

        if (!gridResult.success) {
          gridResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      case ContentBlockType.TRENDING_SECTION_CONTAINER: {
        // For container types, specific data validation might be minimal or non-existent for the block itself
        // as the primary data is in its items. If there were specific fields for the container in its 'data' object,
        // they would be validated here. For now, we assume no specific 'data' fields for TRENDING_SECTION_CONTAINER.
        if (blockData.data && Object.keys(blockData.data).length > 0) {
          // Example: If TRENDING_SECTION_CONTAINER is not supposed to have any data properties itself.
          // ctx.addIssue({
          //     code: z.ZodIssueCode.custom,
          //     path: ["data"],
          //     message: "Trending Section Container should not have specific data properties itself.",
          // });
        }
        break;
      }
      // 新增：处理 PRODUCT_GRID_CONFIGURABLE 类型
      case ContentBlockType.PRODUCT_GRID_CONFIGURABLE: {
        const gridConfigResult =
          ProductGridConfigurableBlockDataSchema.safeParse(blockData.data);

        if (!gridConfigResult.success) {
          gridConfigResult.error.errors.forEach((err) => {
            ctx.addIssue({ ...err, path: ["data", ...err.path] });
          });
        }
        break;
      }
      default:
        // For types not explicitly handled, if data is present, it might be an issue
        // or it might be that they don't have specific data structures to validate against.
        // This depends on the design decision for unhandled or new types.
        break;
    }
  });

export type ContentBlockFormValues = z.infer<typeof ContentBlockFormSchema>;

const FORM_SELECT_NULL_VALUE = "__FORM_SELECT_NULL_VALUE__"; // Unique string to represent null selection

// --- Component Props ---
interface ContentBlockFormProps {
  initialData?:
    | (ContentBlockFormValues & {
        targetPrimaryCategory?: {
          id?: string;
          name?: string;
          slug?: string;
        } | null;
      })
    | null;
  onSubmit: (data: ContentBlockFormValues) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

// --- Helper Components for Dynamic Fields ---

// 渲染 Banner 特定字段
const BannerFields: FC<{ control: Control<ContentBlockFormValues> }> = ({
  control,
}): ReactNode => {
  const t = useTranslations("contentManagement.formFields.banner");
  const placeholders = useTranslations("contentManagement.placeholders");

  return (
    <>
      <FormField
        name="data.title"
        label={t("title")}
        control={control}
        component={Input}
      />
      <FormField
        name="data.description"
        label={t("description")}
        control={control}
        component={Textarea}
      />
      <FormField
        name="data.imageUrl"
        label={t("imageUrl")}
        control={control}
        component={Input}
        placeholder={placeholders("imageUrlExample")}
        fieldType="imageUrl"
      />
      <FormField
        name="data.linkUrl"
        label={t("linkUrl")}
        control={control}
        component={Input}
        placeholder={placeholders("linkUrlExample")}
      />
      <FormField
        name="data.ctaText"
        label={t("ctaText")}
        control={control}
        component={Input}
      />
    </>
  );
};

// 渲染 Introduction Section 特定字段 (简单部分)
const IntroductionSectionFields: FC<{
  control: Control<ContentBlockFormValues>;
}> = ({ control }): ReactNode => {
  const t = useTranslations("contentManagement.formFields.introduction");
  const placeholders = useTranslations("contentManagement.placeholders");

  return (
    <>
      <FormField
        name="data.title"
        label={t("title")}
        control={control}
        component={Input}
      />
      <FormField
        name="data.descriptionParagraph"
        label={t("descriptionParagraph")}
        control={control}
        component={Textarea}
        rows={5}
      />
      {/* featuresLeft, featuresRight, bottomText 可以用 Textarea，每行一个特性 */}
      <FormField
        name="data.featuresLeft"
        label={t("featuresLeft")}
        control={control}
        component={Textarea}
        placeholder={placeholders("featuresLeftPlaceholder")}
        rows={4}
      />
      <FormField
        name="data.featuresRight"
        label={t("featuresRight")}
        control={control}
        component={Textarea}
        placeholder={placeholders("featuresRightPlaceholder")}
        rows={4}
      />
      <FormField
        name="data.bottomText"
        label={t("bottomText")}
        control={control}
        component={Textarea}
        rows={2}
      />
      {/* Guarantee items 需要通过 ContentItem 管理 */}
    </>
  );
};

// 渲染 Product Grid Hero 特定字段
const ProductGridHeroFields: FC<{
  control: Control<ContentBlockFormValues>;
}> = ({ control }): ReactNode => {
  const t = useTranslations("contentManagement.formFields.productGrid");
  const placeholders = useTranslations("contentManagement.placeholders");

  return (
    <>
      <FormField
        name="data.title"
        label={t("title")}
        control={control}
        component={Input}
      />
      <FormField
        name="data.seeAllText"
        label={t("seeAllText")}
        control={control}
        component={Input}
      />
      <FormField
        name="data.seeAllLink"
        label={t("seeAllLink")}
        control={control}
        component={Input}
        placeholder={placeholders("seeAllLinkExample")}
      />
    </>
  );
};

// 新增：渲染 PRODUCT_GRID_CONFIGURABLE 特定字段
const ProductGridConfigurableFields: FC<{
  control: Control<ContentBlockFormValues>;
  formMethods: ReturnType<typeof useForm<ContentBlockFormValues>>; // 传递整个 form 对象以便访问 setValue 等
}> = ({ control, formMethods }) => {
  const t = useTranslations(
    "contentManagement.formFields.productGridConfigurable",
  );
  const placeholders = useTranslations("contentManagement.placeholders");

  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

  const watchedFormItems = formMethods.watch("items");
  const currentBlockItems = useMemo(
    () => watchedFormItems || [],
    [watchedFormItems],
  );
  // 从 ContentItemFormValues 转换为 ProductAdminSelectItem (用于初始化模态框)
  const initialModalProducts: ProductAdminSelectItem[] = useMemo(() => {
    return currentBlockItems
      .filter(
        (item) =>
          item.type === ContentItemType.PRODUCT_REFERENCE &&
          item.data?.productId,
      )
      .map((item) => ({
        id: item.data.productId as string,
        name: item.name || t("productSelector.unknownProduct"), // ContentItem name as product name
        sku: t("productSelector.notApplicable"), // SKU and other details need additional fetching
        images: [], // Images also need additional fetching or storage
        price: t("productSelector.unknownPrice"), // Price also needs additional fetching or storage
        // 为了在选择器中正确显示，理想情况下 ContentItem.data 应包含更多产品信息
        // 或者 ProductSelectorModal 在初始化时根据ID列表批量获取产品详情
      }))
      .sort((a, b) => {
        const orderA =
          currentBlockItems.find((item) => item.data?.productId === a.id)
            ?.order || 0;
        const orderB =
          currentBlockItems.find((item) => item.data?.productId === b.id)
            ?.order || 0;

        return orderA - orderB;
      });
  }, [currentBlockItems, t]);

  const handleOpenProductSelector = () => {
    setIsProductSelectorOpen(true);
  };

  const handleProductSelection = (
    selectedModalProducts: ProductAdminSelectItem[],
  ) => {
    const newItems: ContentItemFormValues[] = selectedModalProducts.map(
      (product, index) => ({
        type: ContentItemType.PRODUCT_REFERENCE,
        name: product.name, // Use product name returned from selector
        data: { productId: product.id },
        order: index, // Based on order returned from selector (includes drag-sort order)
        isActive: true,
        itemIdentifier:
          currentBlockItems.find((ci) => ci.data?.productId === product.id)
            ?.itemIdentifier || `prod_ref_${product.id}_${Date.now()}`,
        slotKey: currentBlockItems.find(
          (ci) => ci.data?.productId === product.id,
        )?.slotKey, // Preserve original slotKey if applicable
      }),
    );

    formMethods.setValue("items", newItems, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsProductSelectorOpen(false);
  };

  const productReferenceItemsFromForm = currentBlockItems.filter(
    (item) => item.type === ContentItemType.PRODUCT_REFERENCE,
  );

  return (
    <div className="space-y-4">
      <FormField
        name="data.title"
        label={t("title")}
        control={control}
        component={Input}
      />
      <FormField
        name="data.seeAllText"
        label={t("seeAllText")}
        control={control}
        component={Input}
        placeholder={placeholders("seeAllLinkExample")}
      />
      <FormField
        name="data.seeAllLink"
        label={t("seeAllLink")}
        control={control}
        component={Input}
        placeholder={placeholders("seeAllLinkExample")}
      />
      <FormField
        name="data.dataSourceType"
        label={t("dataSourceType")}
        control={control}
        component={Select}
        options={[
          {
            value: "MANUAL_SELECTION",
            label: t("dataSourceTypes.manualSelection"),
          },
          // {
          //   value: "DYNAMIC_QUERY",
          //   label: t("dataSourceTypes.dynamicQuery"),
          // }, // DYNAMIC_QUERY 暂时禁用
        ]}
      />
      <FormField
        name="data.maxDisplayItems"
        label={t("maxDisplayItems")}
        control={control}
        component={Input} // Could consider using Input type="number"
        placeholder={t("maxDisplayItemsPlaceholder")}
      />

      {formMethods.watch("data.dataSourceType") === "MANUAL_SELECTION" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectedProductsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {productReferenceItemsFromForm.length > 0 && (
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {productReferenceItemsFromForm.map((item, index) => (
                  <li
                    key={item.itemIdentifier || `item-${index}`}
                    className="text-sm"
                  >
                    {item.name} (ID: {item.data?.productId})
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenProductSelector}
            >
              {productReferenceItemsFromForm.length > 0
                ? t("manageProductsButton")
                : t("selectProductsButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ProductSelectorModal definition (placeholder) */}
      <ProductSelectorModal
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        initialSelectedProducts={initialModalProducts} // Pass converted selected products
        onConfirmSelection={handleProductSelection}
      />
    </div>
  );
};

// Generic form field component to simplify code
interface FormFieldProps {
  name: string;
  label: string;
  control: Control<FieldValues>;
  component: React.ElementType;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  fieldType?: "text" | "textarea" | "imageUrl" | "switch" | "select";
}
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  control,
  component: Component,
  placeholder,
  rows,
  options,
  fieldType,
}) => {
  const tForm = useTranslations("contentManagement.form");

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            {Component === Select ? (
              (() => {
                // field.value from react-hook-form can be string (ID) or null for some fields.
                // Radix Select's value prop expects a string.
                // If field.value is null, we map it to FORM_SELECT_NULL_VALUE for Radix Select's value,
                // so that the "None" option (which has FORM_SELECT_NULL_VALUE as its value) is displayed as selected.
                // If field.value is an actual ID string, Radix Select's value will be that ID string.
                // If field.value is undefined or an empty string not matching FORM_SELECT_NULL_VALUE,
                // Radix Select will show the placeholder (if its value doesn't match any item).
                const valueForRadixSelect =
                  field.value === null
                    ? FORM_SELECT_NULL_VALUE
                    : typeof field.value === "string" && field.value !== "" // Ensure it's a non-empty string or our null marker
                      ? field.value
                      : field.value === undefined
                        ? ""
                        : field.value; // Pass "" for undefined to show placeholder, or original if already ""

                return (
                  <Select
                    onValueChange={(selectedValueFromRadix: string) => {
                      if (selectedValueFromRadix === FORM_SELECT_NULL_VALUE) {
                        field.onChange(null); // Update react-hook-form with null
                      } else if (
                        selectedValueFromRadix === "" &&
                        field.value !== null
                      ) {
                        // This case might occur if a placeholder-like state is achieved
                        // via an empty string value from Radix when no item is truly selected
                        // but the field was not previously null.
                        // Depending on desired behavior, might set to null or keep as is.
                        // For now, assume Radix gives actual item values or FORM_SELECT_NULL_VALUE.
                        // If it can give "", and "" means "clear", then map to null.
                        field.onChange(null);
                      } else {
                        field.onChange(selectedValueFromRadix); // Update react-hook-form with the selected ID
                      }
                    }}
                    value={valueForRadixSelect}
                  >
                    <SelectTrigger id={name}>
                      <SelectValue
                        placeholder={`${tForm("selectPlaceholderPrefix")} ${label}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()
            ) : Component === Switch ? (
              <Switch
                id={name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            ) : Component === Textarea ? (
              <Textarea
                id={name}
                placeholder={placeholder}
                {...field}
                rows={rows}
              />
            ) : fieldType === "imageUrl" ? (
              <ImageUploadField
                value={field.value}
                onChange={field.onChange}
                label="" // Main Label already provided by FormField
                placeholder={placeholder || "Image URL"}
              />
            ) : (
              <Input id={name} placeholder={placeholder} {...field} />
            )}
            {error && (
              <p className="text-sm text-red-500 mt-1">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
};

// --- Main Form Component ---
export const ContentBlockForm: React.FC<ContentBlockFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isEditMode,
  onCancel,
}) => {
  const t = useTranslations("contentManagement");
  const commonT = useTranslations("common");
  const placeholders = useTranslations("contentManagement.placeholders");
  const blockTypes = useTranslations("contentManagement.blockTypes");
  const itemTypes = useTranslations("contentManagement.itemTypes");

  const [editingSlotKey, setEditingSlotKey] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);
  const [selectedGenderPrefixValue, setSelectedGenderPrefixValue] = useState<
    typeof GENDER_PREFIX_NONE_VALUE | "women-" | "men-"
  >(GENDER_PREFIX_NONE_VALUE);
  const [primaryCategories, setPrimaryCategories] = useState<
    { id: string; name: string }[]
  >([]);

  // 恢复获取一级分类的 useEffect
  useEffect(() => {
    const fetchPrimaryCategories = async () => {
      try {
        const response = await fetch(
          "/api/categories?level=1&limit=999&isActive=true",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch primary categories");
        }
        const result = await response.json(); // result 是 API 返回的整个对象
        // API 返回的是 { items: Category[] } 结构，所以从 result.items 获取数组
        const categories = Array.isArray(result.items) ? result.items : [];

        if (Array.isArray(categories)) {
          setPrimaryCategories(
            categories.map((cat: { id: string; name: string }) => ({
              id: cat.id,
              name: cat.name,
            })),
          );
        }
      } catch {
        toast.error(t("errors.fetchPrimaryCategoriesFailed"));
      }
    };

    fetchPrimaryCategories();
  }, [t]); // Add t to dependency array because toast uses it

  const form = useForm<ContentBlockFormValues>({
    resolver: zodResolver(ContentBlockFormSchema),
    defaultValues: initialData || {
      identifier: "",
      type: ContentBlockType.BANNER,
      name: "",
      description: "",
      data: {},
      isActive: true,
      targetPrimaryCategoryId: null,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "fieldId",
  });

  const selectedType = form.watch("type");
  const watchedItems = form.watch("items");

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      if (initialData.identifier?.startsWith("women-")) {
        setSelectedGenderPrefixValue("women-");
      } else if (initialData.identifier?.startsWith("men-")) {
        setSelectedGenderPrefixValue("men-");
      } else {
        setSelectedGenderPrefixValue(GENDER_PREFIX_NONE_VALUE);
      }
    } else {
      form.reset({
        identifier: "",
        type: ContentBlockType.BANNER,
        name: "",
        description: "",
        data: {},
        isActive: true,
        targetPrimaryCategoryId: null,
        items: [],
      });
      setSelectedGenderPrefixValue(GENDER_PREFIX_NONE_VALUE);
    }
  }, [initialData, form]);

  // In edit mode, try to set initial value of targetPrimaryCategoryId when initialData or primaryCategories change
  useEffect(() => {
    if (
      isEditMode &&
      initialData?.targetPrimaryCategoryId &&
      primaryCategories.length > 0
    ) {
      const selectedCategory = primaryCategories.find(
        (cat) => cat.id === initialData.targetPrimaryCategoryId,
      );

      if (
        selectedCategory &&
        form.getValues("targetPrimaryCategoryId") !== selectedCategory.id
      ) {
        form.setValue("targetPrimaryCategoryId", selectedCategory.id, {
          shouldValidate: true,
          shouldDirty: !form.formState.isSubmitted,
        });
      }
    } else if (
      isEditMode &&
      initialData &&
      initialData.targetPrimaryCategoryId === null &&
      form.getValues("targetPrimaryCategoryId") !== null
    ) {
      form.setValue("targetPrimaryCategoryId", null, {
        shouldValidate: true,
        shouldDirty: !form.formState.isSubmitted,
      });
    }
  }, [initialData, primaryCategories, isEditMode, form]);

  const handleFormSubmit = form.handleSubmit(
    async (data) => {
      // Ensure all items have unique itemIdentifier
      if (data.items?.length) {
        // For duplicate checking
        const identifiers = new Set<string>();
        const updatedItems = [...data.items].map((item, index) => {
          let identifier = item.itemIdentifier;

          // If empty or already exists (duplicate), generate new unique identifier
          if (!identifier || identifiers.has(identifier)) {
            const timestamp = Date.now() + index;
            const slotPrefix = item.slotKey
              ? item.slotKey.replace(/[^a-z0-9]/gi, "_")
              : `item_${index}`;

            identifier = `${slotPrefix}_${timestamp}`;
            item.itemIdentifier = identifier;
          }

          identifiers.add(identifier);

          return item;
        });

        // Since we modified the data, we need to update form values
        form.setValue("items", updatedItems);
      }

      try {
        if (data.data && typeof data.data === "object") {
          data.data = JSON.parse(JSON.stringify(data.data));
        }
        if (data.items) {
          data.items.forEach((item) => {
            if (item.data && typeof item.data === "object") {
              item.data = JSON.parse(JSON.stringify(item.data));
            }
          });
        }
      } catch {
        // JSON parsing or serialization errors can be ignored, as we're just trying to clone objects
        // If it fails, the original object will be used
      }
      await onSubmit(data);
    },
    (errors) => {
      if (errors.items) {
        errors.items.forEach((itemError) => {
          if (itemError) {
            return;
          }
        });
      }
    },
  );

  const handleApplyPrefix = () => {
    const currentIdentifier = form.getValues("identifier") || "";
    const baseIdentifier = currentIdentifier.replace(/^(women-|men-)/, "");
    const prefixToApply =
      selectedGenderPrefixValue === GENDER_PREFIX_NONE_VALUE
        ? ""
        : selectedGenderPrefixValue;
    const newIdentifier = prefixToApply + baseIdentifier;

    form.setValue("identifier", newIdentifier, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const renderDynamicDataFields = () => {
    switch (selectedType) {
      case ContentBlockType.BANNER:
        return <BannerFields control={form.control} />;
      case ContentBlockType.INTRODUCTION_SECTION:
        return <IntroductionSectionFields control={form.control} />;
      case ContentBlockType.PRODUCT_GRID_HERO:
        return <ProductGridHeroFields control={form.control} />;
      case ContentBlockType.TRENDING_SECTION_CONTAINER:
        return (
          <p className="text-sm text-gray-500">{t("trendingContainerInfo")}</p>
        );
      case ContentBlockType.PRODUCT_GRID_CONFIGURABLE:
        return (
          <ProductGridConfigurableFields
            control={form.control}
            formMethods={form}
          />
        );
      default:
        return <p className="text-sm text-gray-500">{t("noSpecificFields")}</p>;
    }
  };

  const handleSelectSlot = (selectedSlotKey: string, itemIdx?: number) => {
    setEditingSlotKey(selectedSlotKey);
    if (itemIdx !== undefined) {
      setEditingItemIndex(itemIdx);
    } else {
      let defaultItemType: ContentItemType =
        ContentItemType.TRENDING_CARD_NORMAL;
      let defaultData: Record<string, unknown> = {
        title: "",
        imageUrl: "",
        href: "",
        textPlacement: "overlay",
        textPosition: "bottom",
        size: "normal",
      };

      if (selectedSlotKey.includes("_large_")) {
        defaultItemType = ContentItemType.TRENDING_CARD_LARGE;
      } else if (selectedSlotKey.includes("_image")) {
        defaultItemType = ContentItemType.TRENDING_CARD_STANDALONE;
        defaultData = {
          title: "",
          imageUrl: "",
          href: "",
          labelText: "",
          labelLinkUrl: "",
          itemTitleText: "",
          itemTitleLinkUrl: "",
        };
      }

      const newItemName = t("form.newItemForSlot", {
        slotKey: t(`slotKeys.${selectedSlotKey}`) || selectedSlotKey,
      });
      const currentItemsLength = fields.length;

      // 生成唯一的itemIdentifier，使用slotKey和时间戳组合，确保唯一性
      const uniqueIdentifier = `${selectedSlotKey.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;

      append({
        name: newItemName,
        type: defaultItemType,
        slotKey: selectedSlotKey,
        data: defaultData,
        order: currentItemsLength,
        isActive: true,
        itemIdentifier: uniqueIdentifier,
      });
      setEditingItemIndex(currentItemsLength);
    }
    setIsEditDrawerOpen(true);
  };

  const renderItemSpecificFields = (
    itemIndex: number,
    itemType: ContentItemType,
  ) => {
    if (
      itemType === ContentItemType.TRENDING_CARD_LARGE ||
      itemType === ContentItemType.TRENDING_CARD_NORMAL
    ) {
      return (
        <>
          <FormField
            name={`items.${itemIndex}.data.title`}
            label={t("formFields.trendingCard.title")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.description`}
            label={t("formFields.trendingCard.description")}
            control={form.control}
            component={Textarea}
            rows={3}
          />
          <FormField
            name={`items.${itemIndex}.data.imageUrl`}
            label={t("formFields.trendingCard.imageUrl")}
            control={form.control}
            component={Input}
            fieldType="imageUrl"
          />
          <FormField
            name={`items.${itemIndex}.data.href`}
            label={t("formFields.trendingCard.href")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.topLabel`}
            label={t("formFields.trendingCard.topLabel")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.subtitle`}
            label={t("formFields.trendingCard.subtitle")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.labelText`}
            label={t("formFields.trendingCard.labelText")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.labelLinkUrl`}
            label={t("formFields.trendingCard.labelLinkUrl")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.itemTitleText`}
            label={t("formFields.trendingCard.itemTitleText")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.itemTitleLinkUrl`}
            label={t("formFields.trendingCard.itemTitleLinkUrl")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.size`}
            label={t("formFields.trendingCard.size")}
            control={form.control}
            component={Select}
            options={[
              { value: "normal", label: itemTypes("sizes.normal") || "Normal" },
              { value: "large", label: itemTypes("sizes.large") || "Large" },
              {
                value: "vertical",
                label: itemTypes("sizes.vertical") || "Vertical",
              },
              {
                value: "horizontal",
                label: itemTypes("sizes.horizontal") || "Horizontal",
              },
              { value: "small", label: itemTypes("sizes.small") || "Small" },
            ]}
          />
          <FormField
            name={`items.${itemIndex}.data.textPosition`}
            label={t("formFields.trendingCard.textPosition")}
            control={form.control}
            component={Select}
            options={[
              {
                value: "bottom",
                label: itemTypes("textPositions.bottom") || "Bottom",
              },
              {
                value: "center",
                label: itemTypes("textPositions.center") || "Center",
              },
            ]}
          />
          <FormField
            name={`items.${itemIndex}.data.textPlacement`}
            label={t("formFields.trendingCard.textPlacement")}
            control={form.control}
            component={Select}
            options={[
              {
                value: "overlay",
                label: itemTypes("textPlacements.overlay") || "Overlay",
              },
              {
                value: "below-image",
                label: itemTypes("textPlacements.belowImage") || "Below Image",
              },
              {
                value: "above-image",
                label: itemTypes("textPlacements.aboveImage") || "Above Image",
              },
              {
                value: "standalone",
                label:
                  itemTypes("textPlacements.standalone") ||
                  "Standalone (Image Only)",
              },
            ]}
          />
        </>
      );
    }
    if (itemType === ContentItemType.TRENDING_CARD_STANDALONE) {
      return (
        <>
          <FormField
            name={`items.${itemIndex}.data.title`}
            label={t("formFields.trendingCard.title")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.imageUrl`}
            label={t("formFields.trendingCard.imageUrl")}
            control={form.control}
            component={Input}
            fieldType="imageUrl"
          />
          <FormField
            name={`items.${itemIndex}.data.href`}
            label={t("formFields.trendingCard.href")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.labelText`}
            label={t("formFields.trendingCard.labelText")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.labelLinkUrl`}
            label={t("formFields.trendingCard.labelLinkUrl")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.itemTitleText`}
            label={t("formFields.trendingCard.itemTitleText")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.itemTitleLinkUrl`}
            label={t("formFields.trendingCard.itemTitleLinkUrl")}
            control={form.control}
            component={Input}
          />
        </>
      );
    }
    if (itemType === ContentItemType.SHINING_CARD) {
      return (
        <>
          <FormField
            name={`items.${itemIndex}.data.title`}
            label={t("formFields.shiningCard.title")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.imageUrl`}
            label={t("formFields.shiningCard.imageUrl")}
            control={form.control}
            component={Input}
            fieldType="imageUrl"
          />
          <FormField
            name={`items.${itemIndex}.data.linkUrl`}
            label={t("formFields.shiningCard.linkUrl")}
            control={form.control}
            component={Input}
          />
        </>
      );
    }
    if (itemType === ContentItemType.TEXT_LINK_BLOCK) {
      return (
        <>
          <FormField
            name={`items.${itemIndex}.data.text`}
            label={t("formFields.textLinkBlock.text")}
            control={form.control}
            component={Textarea}
            rows={2}
          />
          <FormField
            name={`items.${itemIndex}.data.linkUrl`}
            label={t("formFields.textLinkBlock.linkUrl")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.styleHint`}
            label={t("formFields.textLinkBlock.styleHint")}
            control={form.control}
            component={Input}
            placeholder={placeholders("styleHintPlaceholder")}
          />
        </>
      );
    }
    if (itemType === ContentItemType.INTRODUCTION_GUARANTEE_ITEM) {
      return (
        <>
          <FormField
            name={`items.${itemIndex}.data.iconKey`}
            label={t("formFields.guaranteeItem.iconKey")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.title`}
            label={t("formFields.guaranteeItem.title")}
            control={form.control}
            component={Input}
          />
          <FormField
            name={`items.${itemIndex}.data.description`}
            label={t("formFields.guaranteeItem.description")}
            control={form.control}
            component={Textarea}
            rows={3}
          />
        </>
      );
    }
    if (itemType === ContentItemType.PRODUCT_REFERENCE) {
      // For PRODUCT_REFERENCE, may not need to show specific data fields in drawer
      // because main info is productId, already managed in ProductSelectorModal
      // If need to show product name or image preview in drawer, can add readonly fields here
      // but usually productId is hidden, in data
      const productId = form.getValues(`items.${itemIndex}.data.productId`);
      const productName = form.getValues(`items.${itemIndex}.name`); // Product name in item.name

      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("productSelector.selectedProduct")}
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {productName || t("productSelector.unnamedProduct")} (ID:{" "}
            {productId || t("productSelector.notSet")})
          </p>
          <Button
            variant="link"
            size="sm"
            type="button"
            onClick={() => {
              // Logic here needs reconsideration, directly editing selected productId in drawer may not be optimal UX
              // Usually would modify selection by reopening ProductSelectorModal
              // alert("Please modify selected products via product selector.");
              // For simplicity, we temporarily allow editing name in drawer, but productId should be modified via selector
            }}
          >
            {t("productSelector.useProductSelectorToModify")}
          </Button>
        </div>
      );
    }

    return <p>{t("form.noSpecificFieldsForItemType")}</p>;
  };

  const renderContentItems = () => {
    if (selectedType === ContentBlockType.TRENDING_SECTION_CONTAINER) {
      return (
        <TrendingSectionAdminPreview
          items={watchedItems}
          onSelectSlot={handleSelectSlot}
          t={t}
        />
      );
    }
    if (selectedType === ContentBlockType.PRODUCT_GRID_CONFIGURABLE) {
      return null;
    }
    if (selectedType !== ContentBlockType.INTRODUCTION_SECTION) {
      return null;
    }

    const allowedItemTypes =
      selectedType === ContentBlockType.INTRODUCTION_SECTION
        ? [ContentItemType.INTRODUCTION_GUARANTEE_ITEM]
        : [];

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("form.guaranteeItems")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const currentItemType = form.watch(`items.${index}.type`);

            return (
              <Card key={field.fieldId} className="relative group p-4 border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 opacity-50 group-hover:opacity-100"
                  onClick={() => remove(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  name={`items.${index}.name`}
                  label={`${t("form.item")} ${index + 1} ${t("form.name")}`}
                  control={form.control}
                  component={Input}
                />
                <FormField
                  name={`items.${index}.itemIdentifier`}
                  label={`${t("form.item")} ${index + 1} ${t("form.itemIdentifierLabel")}`}
                  control={form.control}
                  component={Input}
                  placeholder={placeholders("itemIdentifierPlaceholder")}
                />
                <FormField
                  name={`items.${index}.slotKey`}
                  label={`${t("form.item")} ${index + 1} ${t("form.slotKeyLabel")}`}
                  control={form.control}
                  component={Select}
                  options={[
                    {
                      value: "guarantee_item_1",
                      label: t("slotKeys.guarantee_item_1"),
                    },
                    {
                      value: "guarantee_item_2",
                      label: t("slotKeys.guarantee_item_2"),
                    },
                    {
                      value: "guarantee_item_3",
                      label: t("slotKeys.guarantee_item_3"),
                    },
                  ]}
                />
                <FormField
                  name={`items.${index}.type`}
                  label={t("form.itemType")}
                  control={form.control}
                  component={Select}
                  options={allowedItemTypes.map((type) => ({
                    value: type,
                    label: itemTypes(type) || type,
                  }))}
                />
                {currentItemType &&
                  renderItemSpecificFields(index, currentItemType)}
                <FormField
                  name={`items.${index}.isActive`}
                  label={t("form.itemIsActive")}
                  control={form.control}
                  component={Switch}
                />
              </Card>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const defaultItemType = allowedItemTypes[0];
              let defaultData: Record<string, unknown> = {};

              if (
                defaultItemType === ContentItemType.INTRODUCTION_GUARANTEE_ITEM
              ) {
                defaultData = { iconKey: "", title: "", description: "" };
              }

              // Generate unique itemIdentifier to ensure no duplicates
              const slotPrefix = "guarantee_item";
              const uniqueIdentifier = `${slotPrefix}_${Date.now()}`;

              append({
                type: defaultItemType,
                name: `${t("form.newItem")} ${fields.length + 1}`,
                data: defaultData,
                isActive: true,
                order: fields.length,
                itemIdentifier: uniqueIdentifier, // Set as unique identifier
                slotKey: "",
              });
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("form.addItem")}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const currentEditingItemType =
    editingItemIndex !== null
      ? form.watch(`items.${editingItemIndex}.type`)
      : null;
  const currentEditingItemName =
    editingItemIndex !== null
      ? form.watch(`items.${editingItemIndex}.name`)
      : "";

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("form.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            name="name"
            label={t("form.name")}
            control={form.control}
            component={Input}
          />
          <div className="space-y-2">
            <Label htmlFor="identifier-prefix-select">
              {t("form.genderPrefixSuggestionLabel")}
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedGenderPrefixValue}
                onValueChange={(value) => {
                  if (value === "") {
                    setSelectedGenderPrefixValue(GENDER_PREFIX_NONE_VALUE);
                  } else {
                    setSelectedGenderPrefixValue(
                      value as
                        | typeof GENDER_PREFIX_NONE_VALUE
                        | "women-"
                        | "men-",
                    );
                  }
                }}
              >
                <SelectTrigger
                  id="identifier-prefix-select"
                  className="w-[200px]"
                >
                  <SelectValue placeholder={t("form.genderPrefixNone")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENDER_PREFIX_NONE_VALUE}>
                    {t("form.genderPrefixNone")}
                  </SelectItem>
                  <SelectItem value="women-">
                    {t("form.genderPrefixWomen")}
                  </SelectItem>
                  <SelectItem value="men-">
                    {t("form.genderPrefixMen")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyPrefix}
              >
                {t("form.applyPrefixButton")}
              </Button>
            </div>
          </div>
          <FormField
            name="identifier"
            label={t("form.identifier")}
            control={form.control}
            component={Input}
            placeholder={placeholders("identifierExample")}
          />
          <FormField
            name="targetPrimaryCategoryId"
            label={t("form.targetPrimaryCategoryLabel")}
            control={form.control}
            component={Select}
            options={[
              {
                value: FORM_SELECT_NULL_VALUE,
                label: t("form.selectOptionalNone", {
                  fieldName: t("form.targetPrimaryCategoryLabel"),
                }),
              },
              ...primaryCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
            placeholder={t("form.selectOptionalPlaceholder", {
              fieldName: t("form.targetPrimaryCategoryLabel"),
            })}
          />
          <FormField
            name="type"
            label={t("form.type")}
            control={form.control}
            component={Select}
            options={Object.values(ContentBlockType).map((type) => ({
              value: type,
              label: blockTypes(type) || type,
            }))}
          />
          <FormField
            name="description"
            label={t("form.description")}
            control={form.control}
            component={Textarea}
            rows={3}
          />
          <div className="flex items-center space-x-2">
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isActive">{t("form.isActive")}</Label>
          </div>
        </CardContent>
      </Card>

      {selectedType !== ContentBlockType.TRENDING_SECTION_CONTAINER &&
        selectedType !== ContentBlockType.INTRODUCTION_SECTION && (
          <Card>
            <CardHeader>
              <CardTitle>{t("form.specificData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderDynamicDataFields()}
            </CardContent>
          </Card>
        )}

      {renderContentItems()}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {commonT("actions.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode
            ? commonT("actions.saveChanges")
            : commonT("actions.create")}
        </Button>
      </div>

      {selectedType === ContentBlockType.TRENDING_SECTION_CONTAINER &&
        editingItemIndex !== null && (
          <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
            <DrawerContent className="!max-h-[85vh] w-full">
              {/* 使用固定布局将抽屉内容分为三个区域 */}
              <div className="flex flex-col h-[85vh]">
                {/* 1. 固定头部 */}
                <DrawerHeader className="border-b shrink-0 bg-white">
                  <DrawerTitle>
                    {t("visualEditor.editItemTitle", {
                      itemName:
                        currentEditingItemName || t("visualEditor.unnamedItem"),
                    })}
                    {editingSlotKey &&
                      ` (${t("visualEditor.slotLabel")}: ${t(`slotKeys.${editingSlotKey}`) || editingSlotKey})`}
                  </DrawerTitle>
                  <DrawerDescription>
                    {t("visualEditor.editItemDescription")}
                  </DrawerDescription>
                </DrawerHeader>

                {/* 2. 可滚动内容区域 */}
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                  <div className="space-y-4">
                    <FormField
                      name={`items.${editingItemIndex}.name`}
                      label={t("form.itemName")}
                      control={form.control}
                      component={Input}
                    />
                    <FormField
                      name={`items.${editingItemIndex}.itemIdentifier`}
                      label={t("form.itemIdentifierLabel")}
                      control={form.control}
                      component={Input}
                      placeholder={placeholders("itemIdentifierPlaceholder")}
                    />
                    <FormField
                      name={`items.${editingItemIndex}.slotKey`}
                      label={t("form.slotKeyLabel")}
                      control={form.control}
                      component={Select}
                      options={[
                        {
                          value: "trending_main_large_left",
                          label: t("slotKeys.trending_main_large_left"),
                        },
                        {
                          value: "trending_slot_top_right_image",
                          label: t("slotKeys.trending_slot_top_right_image"),
                        },
                        {
                          value: "trending_slot_bottom_right_image",
                          label: t("slotKeys.trending_slot_bottom_right_image"),
                        },
                        {
                          value: "trending_main_large_right",
                          label: t("slotKeys.trending_main_large_right"),
                        },
                        {
                          value: "trending_slot_next_top_left_image",
                          label: t(
                            "slotKeys.trending_slot_next_top_left_image",
                          ),
                        },
                        {
                          value: "trending_slot_next_bottom_left_image",
                          label: t(
                            "slotKeys.trending_slot_next_bottom_left_image",
                          ),
                        },
                      ]}
                    />

                    {currentEditingItemType &&
                      renderItemSpecificFields(
                        editingItemIndex,
                        currentEditingItemType,
                      )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Controller
                        name={`items.${editingItemIndex}.isActive`}
                        control={form.control}
                        render={({ field }) => (
                          <Switch
                            id={`items.${editingItemIndex}.isActive-drawer`}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label
                        htmlFor={`items.${editingItemIndex}.isActive-drawer`}
                      >
                        {t("form.itemIsActive")}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* 3. Fixed bottom action area */}
                <DrawerFooter className="border-t shrink-0 bg-white mt-auto">
                  <div className="flex justify-between gap-2">
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        if (editingItemIndex !== null) {
                          remove(editingItemIndex);
                          setIsEditDrawerOpen(false);
                          setEditingItemIndex(null);
                          setEditingSlotKey(null);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {commonT("actions.delete")}
                    </Button>
                    <div className="flex gap-2">
                      <DrawerClose asChild>
                        <Button
                          variant="outline"
                          type="button"
                          disabled={isLoading}
                        >
                          {commonT("actions.cancel")}
                        </Button>
                      </DrawerClose>
                      <Button
                        type="button"
                        onClick={async () => {
                          if (editingItemIndex === null) return;

                          // Get current editing item data and type
                          const currentItem = form.getValues(
                            `items.${editingItemIndex}`,
                          );

                          // Ensure itemIdentifier is unique or empty
                          if (!currentItem.itemIdentifier) {
                            // If empty, generate a unique value
                            const uniqueIdentifier = `item_${currentItem.slotKey || ""}_${Date.now()}`;

                            form.setValue(
                              `items.${editingItemIndex}.itemIdentifier`,
                              uniqueIdentifier,
                            );
                          }

                          // Select appropriate validation Schema based on item type
                          let isValid = false;
                          let errorMessage = "";

                          try {
                            // Clean URL fields - set to empty string if empty
                            if (
                              currentItem.data &&
                              typeof currentItem.data === "object"
                            ) {
                              // Ensure currentItem.data is an object
                              const dataFields = [
                                "imageUrl",
                                "href",
                                "labelLinkUrl",
                                "itemTitleLinkUrl",
                                "linkUrl",
                              ];

                              dataFields.forEach((field) => {
                                if (
                                  currentItem.data[field] === undefined ||
                                  currentItem.data[field] === null
                                ) {
                                  currentItem.data[field] = "";
                                }
                              });

                              // Update form data
                              form.setValue(
                                `items.${editingItemIndex}.data`,
                                currentItem.data,
                              );
                            }

                            // Trigger validation for this item's fields
                            await form.trigger(`items.${editingItemIndex}`);

                            // Check for errors
                            const itemErrors =
                              form.formState.errors?.items?.[editingItemIndex];

                            if (itemErrors) {
                              errorMessage = t(
                                "validation.formValidationFailed",
                              );

                              return;
                            }

                            isValid = true;
                          } catch {
                            errorMessage = t("validation.validationError");

                            return;
                          }

                          if (isValid) {
                            setIsEditDrawerOpen(false);
                          } else {
                            // Can show error notification here if you have toast component or other UI feedback
                            alert(errorMessage || t("validation.saveFailed"));
                          }
                        }}
                        disabled={isLoading}
                      >
                        {commonT("actions.saveChanges")}
                      </Button>
                    </div>
                  </div>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        )}
    </form>
  );
};
