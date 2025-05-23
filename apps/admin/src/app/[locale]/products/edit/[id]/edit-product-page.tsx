"use client";

import { format } from "date-fns";
import { Loader2, X, CalendarIcon as LucideCalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { ProductsClient } from "@/app/[locale]/products/products-client";
import { Badge } from "@/components/ui/badge";
import { Button as ShadButton } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type { CategoryTreeNode } from "@/lib/services/category.service";
import { cn } from "@/lib/utils";

import { EditProductClient } from "./edit-product-client";

// 简化的分类对象接口，用于扁平化的分类树
interface SimplifiedCategory {
  id: string;
  name: string;
  level: number;
  parentId?: string;
}

export function EditProductPage({ id }: { id: string }) {
  const t = useTranslations("product.edit");
  const router = useRouter();
  const productId = id;
  const { updateProduct, isUpdating } = useProducts();
  const { categoryTree } = useCategories();
  const {
    brands,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useBrands();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [coupon, setCoupon] = useState<string>("");
  const [couponDescription, setCouponDescription] = useState<string>("");
  const [inventory, setInventory] = useState<string>("");
  const [sku, setSku] = useState("");
  const [source, setSource] = useState("");
  const [material, setMaterial] = useState("");
  const [cautions, setCautions] = useState("");
  const [promotionUrl, setPromotionUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [gender, setGender] = useState<"women" | "men" | "unisex" | null>(null);
  const [couponExpirationDate, setCouponExpirationDate] = useState<
    Date | undefined
  >();
  const [errorMsg, setErrorMsg] = useState<string>(
    t("errorModal.defaultMessage"),
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoadingProduct(true);
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t("productNotFound"));
          }
          throw new Error(t("fetchError"));
        }

        const product = await response.json();

        setName(product.name || "");
        setDescription(product.description || "");
        setBrandId(product.brandId || "");
        setCategoryId(product.categoryId || "");
        setPrice(product.price ? String(product.price) : "");
        setOriginalPrice(
          product.originalPrice ? String(product.originalPrice) : "",
        );
        setDiscount(product.discount ? String(product.discount) : "");
        setCoupon(product.coupon || "");
        setCouponDescription(product.couponDescription || "");
        if (product.couponExpirationDate) {
          try {
            setCouponExpirationDate(new Date(product.couponExpirationDate));
          } catch {
            setCouponExpirationDate(undefined);
          }
        } else {
          setCouponExpirationDate(undefined);
        }
        setInventory(product.inventory ? String(product.inventory) : "");
        setSku(product.sku || "");
        setSource(product.source || "");
        setMaterial(product.material || "");
        setCautions(product.cautions || "");
        setPromotionUrl(product.promotionUrl || "");
        setIsActive(
          product.status === "Active" || product.status === "In Stock",
        );
        setIsFeatured(product.isFeatured || false);
        setIsOnSale(product.isOnSale || false);
        setColors(product.colors || []);
        setSizes(product.sizes || []);
        setTags(product.tags || []);
        setGender(
          (product.gender as "women" | "men" | "unisex" | null) || null,
        );

        setProductError(null);
      } catch (error) {
        setProductError(
          error instanceof Error ? error.message : t("fetchError"),
        );
        toast.error(error instanceof Error ? error.message : t("fetchError"));
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, t]);

  // 页面加载完成后清理导航状态（如果存在的话）
  useEffect(() => {
    // 这里可以通过URL参数或全局状态来检测是否从列表页导航而来
    // 为了演示，我们在组件挂载时模拟清理导航状态
    const timer = setTimeout(() => {
      // 这里可以清理父组件的导航状态
      // 例如：parentComponentClearNavigationState?.()
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleTagDelete = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleColorInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && colorInput.trim() !== "") {
      e.preventDefault();
      if (!colors.includes(colorInput.trim())) {
        setColors([...colors, colorInput.trim()]);
      }
      setColorInput("");
    }
  };

  const handleColorDelete = (color: string) => {
    setColors(colors.filter((c) => c !== color));
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorInput(e.target.value);
  };

  const handleSizeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && sizeInput.trim() !== "") {
      e.preventDefault();
      if (!sizes.includes(sizeInput.trim())) {
        setSizes([...sizes, sizeInput.trim()]);
      }
      setSizeInput("");
    }
  };

  const handleSizeDelete = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
  };

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg(t("errorModal.emptyName"));
      setIsModalOpen(true);

      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setErrorMsg(t("errorModal.invalidPrice"));
      setIsModalOpen(true);

      return;
    }
    if (!inventory || parseInt(inventory, 10) < 0) {
      setErrorMsg(t("errorModal.invalidInventory"));
      setIsModalOpen(true);

      return;
    }
    if (!categoryId) {
      setErrorMsg(t("errorModal.emptyCategory"));
      setIsModalOpen(true);

      return;
    }
    if (!brandId) {
      setErrorMsg(t("errorModal.emptyBrand"));
      setIsModalOpen(true);

      return;
    }

    try {
      await updateProduct({
        id: productId,
        data: {
          name,
          description,
          brandId,
          categoryId,
          price: parseFloat(price),
          originalPrice:
            originalPrice.trim() === "" ? null : parseFloat(originalPrice),
          discount: discount.trim() === "" ? null : parseFloat(discount),
          coupon: coupon.trim() === "" ? null : coupon,
          couponDescription:
            couponDescription.trim() === "" ? null : couponDescription,
          couponExpirationDate: couponExpirationDate
            ? couponExpirationDate.toISOString()
            : null,
          status: isActive ? "Active" : "Draft",
          inventory: parseInt(inventory, 10),
          source,
          colors,
          sizes,
          tags,
          material,
          cautions,
          promotionUrl,
          gender,
        },
      });

      toast.success(t("successUpdate"));
      router.push("/products");
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : t("errorModal.defaultMessage"),
      );
      setIsModalOpen(true);
    }
  };

  function flattenCategoryTree(node: CategoryTreeNode): SimplifiedCategory[] {
    // 创建结果数组
    const result: SimplifiedCategory[] = [];

    // 添加当前节点到结果数组
    result.push({
      id: node.id,
      name: node.name,
      level: node.level,
      parentId: node.parentId,
    });

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        // 确保每个子节点都有正确的 parentId
        if (!child.parentId) {
          child.parentId = node.id;
        }

        // 递归处理子节点并将结果添加到结果数组
        const childCategories = flattenCategoryTree(child);

        result.push(...childCategories);
      }
    }

    return result;
  }

  if (isLoadingProduct) {
    return (
      <EditProductClient.PageWrapper>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </EditProductClient.PageWrapper>
    );
  }

  if (productError) {
    return (
      <EditProductClient.PageWrapper>
        <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
          <div className="text-xl text-red-500">{productError}</div>
          <Button onClick={() => router.push("/products")}>
            {t("backToList")}
          </Button>
        </div>
      </EditProductClient.PageWrapper>
    );
  }

  return (
    <EditProductClient.PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="product-active-switch"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="product-active-switch">
            {isActive ? t("status.active") : t("status.draft")}
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("productInfo.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="product-name">
                  {t("productInfo.name")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder={t("productInfo.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {t("productInfo.nameDescription")}
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="product-description">
                  {t("productInfo.description")}
                </Label>
                <Textarea
                  id="product-description"
                  placeholder={t("productInfo.descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32"
                />
                <p className="text-sm text-muted-foreground">
                  {t("productInfo.descriptionHelp")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("basicInfo.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="product-source">{t("basicInfo.source")}</Label>
                <Input
                  id="product-source"
                  placeholder={t("basicInfo.sourcePlaceholder")}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {t("basicInfo.sourceDescription")}
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="product-promotion-url">
                  {t("basicInfo.promotionUrl")}
                </Label>
                <Input
                  id="product-promotion-url"
                  placeholder={t("basicInfo.promotionPlaceholder")}
                  value={promotionUrl}
                  onChange={(e) => setPromotionUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {t("basicInfo.promotionDescription")}
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="product-material">
                  {t("basicInfo.material")}
                </Label>
                <Textarea
                  id="product-material"
                  placeholder={t("basicInfo.materialPlaceholder")}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="min-h-[48px]"
                />
                <p className="text-sm text-muted-foreground">
                  {t("basicInfo.materialDescription")}
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="product-cautions">
                  {t("basicInfo.cautions")}
                </Label>
                <Textarea
                  id="product-cautions"
                  placeholder={t("basicInfo.cautionsPlaceholder")}
                  value={cautions}
                  onChange={(e) => setCautions(e.target.value)}
                  className="min-h-[48px]"
                />
                <p className="text-sm text-muted-foreground">
                  {t("basicInfo.cautionsDescription")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("basicInfo.colors")}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {colors.map((color) => (
                    <Badge
                      key={color}
                      variant="secondary"
                      className="relative pr-5"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => handleColorDelete(color)}
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        aria-label={`Remove ${color}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="color-input"
                  placeholder={t("basicInfo.colorsPlaceholder")}
                  value={colorInput}
                  onChange={handleColorInputChange}
                  onKeyDown={handleColorInput}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("basicInfo.sizes")}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {sizes.map((size) => (
                    <Badge
                      key={size}
                      variant="secondary"
                      className="relative pr-5"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleSizeDelete(size)}
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        aria-label={`Remove ${size}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="size-input"
                  placeholder={t("basicInfo.sizesPlaceholder")}
                  value={sizeInput}
                  onChange={handleSizeInputChange}
                  onKeyDown={handleSizeInput}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("priceAndInventory.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="product-price">
                      {t("priceAndInventory.price")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ¥
                      </span>
                      <Input
                        id="product-price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-6"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="product-original-price">
                      {t("priceAndInventory.originalPrice")}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ¥
                      </span>
                      <Input
                        id="product-original-price"
                        type="number"
                        placeholder="0.00"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="pl-6"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="product-inventory">
                      {t("priceAndInventory.inventory")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="product-inventory"
                      type="number"
                      placeholder="0"
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                    />
                  </div>
                  <div />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="product-sku">
                      {t("priceAndInventory.sku")}
                    </Label>
                    <Input
                      id="product-sku"
                      placeholder={t("priceAndInventory.skuPlaceholder")}
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      disabled={true}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("priceAndInventory.skuDisabledDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="on-sale-switch"
                    checked={isOnSale}
                    onCheckedChange={setIsOnSale}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="on-sale-switch">
                      {t("priceAndInventory.onSale")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("priceAndInventory.onSaleDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("organization.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="brand-select">
                  {t("organization.brand")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={brandId}
                  onValueChange={setBrandId}
                  disabled={isBrandsLoading}
                >
                  <SelectTrigger
                    id="brand-select"
                    className="w-full"
                    disabled={isBrandsLoading}
                  >
                    {isBrandsLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <SelectValue
                      placeholder={t("organization.brandPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {brandsError ? (
                        <SelectItem value="error" disabled>
                          {t("organization.brandError")}
                        </SelectItem>
                      ) : brands.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          {t("organization.brandEmpty")}
                        </SelectItem>
                      ) : (
                        brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <ProductsClient.CascadeCategorySelector
                categories={
                  Array.isArray(categoryTree)
                    ? (() => {
                        // 扁平化分类树
                        const flattenedCategories = categoryTree.flatMap(
                          (node) => flattenCategoryTree(node),
                        );

                        // console.log(`扁平化后共有 ${flattenedCategories.length} 个分类节点`);

                        // 验证分类的完整性
                        // let level1Count = 0;
                        // let level2Count = 0;
                        // let level3Count = 0;
                        // let missingParentCount = 0;

                        flattenedCategories.forEach((cat) => {
                          // 统计各个层级的分类数量
                          // if (cat.level === 1 || !cat.parentId) {
                          //   level1Count++;
                          // } else if (cat.level === 2) {
                          //   level2Count++;
                          // } else if (cat.level === 3) {
                          //   level3Count++;
                          // }

                          // 验证分类的父子关系
                          if (cat.parentId) {
                            const parentExists = flattenedCategories.some(
                              (parent) => parent.id === cat.parentId,
                            );

                            if (!parentExists) {
                              // console.warn(`警告: 分类 ${cat.name}(${cat.id}) 的父分类 ID ${cat.parentId} 不存在于扁平化数组中`);
                              // missingParentCount++;
                            }
                          }
                        });

                        // console.log(`分类层级统计: 一级(${level1Count})个, 二级(${level2Count})个, 三级(${level3Count})个, 缺少父级(${missingParentCount})个`);

                        return flattenedCategories;
                      })()
                    : []
                }
                onCategoryChange={(id) => {
                  setCategoryId(id);
                }}
                value={categoryId}
              />

              <div className="space-y-2">
                <Label htmlFor="product-tags">{t("organization.tags")}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="relative pr-5"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagDelete(tag)}
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="product-tags"
                  placeholder={t("organization.tagsPlaceholder")}
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInput}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="product-gender-edit">
                  {t("organization.genderLabel")}
                </Label>
                <Select
                  value={gender || "__NONE__"}
                  onValueChange={(value) =>
                    setGender(
                      value === "__NONE__"
                        ? null
                        : (value as "women" | "men" | "unisex" | null),
                    )
                  }
                >
                  <SelectTrigger
                    id="product-gender-edit"
                    className="w-full mt-1"
                  >
                    <SelectValue
                      placeholder={t("organization.genderPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__NONE__">
                        {t("genderOptions.none")}
                      </SelectItem>
                      <SelectItem value="women">
                        {t("genderOptions.women")}
                      </SelectItem>
                      <SelectItem value="men">
                        {t("genderOptions.men")}
                      </SelectItem>
                      <SelectItem value="unisex">
                        {t("genderOptions.unisex")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("visibility.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured-switch"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="featured-switch">
                    {t("visibility.featured")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("visibility.featuredDescription")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("pricingAndCoupons.title", { ns: "product.edit" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="card-original-price">
                  {t("pricingAndCoupons.originalPriceLabel", {
                    ns: "product.edit",
                  })}
                </Label>
                <Input
                  id="card-original-price"
                  placeholder={t("pricingAndCoupons.originalPricePlaceholder", {
                    ns: "product.edit",
                  })}
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="card-discount">
                  {t("pricingAndCoupons.discountLabel", { ns: "product.edit" })}
                </Label>
                <Input
                  id="card-discount"
                  placeholder={t("pricingAndCoupons.discountPlaceholder", {
                    ns: "product.edit",
                  })}
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="card-coupon">
                  {t("pricingAndCoupons.couponLabel", { ns: "product.edit" })}
                </Label>
                <Input
                  id="card-coupon"
                  placeholder={t("pricingAndCoupons.couponPlaceholder", {
                    ns: "product.edit",
                  })}
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="card-coupon-description">
                  {t("pricingAndCoupons.couponDescriptionLabel", {
                    ns: "product.edit",
                  })}
                </Label>
                <Textarea
                  id="card-coupon-description"
                  placeholder={t(
                    "pricingAndCoupons.couponDescriptionPlaceholder",
                    { ns: "product.edit" },
                  )}
                  value={couponDescription}
                  onChange={(e) => setCouponDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label className="block text-sm font-medium text-foreground mb-1">
                  {t("pricingAndCoupons.couponExpirationDateLabel", {
                    ns: "product.edit",
                  })}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <ShadButton
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !couponExpirationDate && "text-muted-foreground",
                      )}
                    >
                      <LucideCalendarIcon className="mr-2 h-4 w-4" />
                      {couponExpirationDate ? (
                        format(couponExpirationDate, "PPP")
                      ) : (
                        <span>
                          {t(
                            "pricingAndCoupons.couponExpirationDatePlaceholder",
                            { ns: "product.edit" },
                          )}
                        </span>
                      )}
                    </ShadButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={couponExpirationDate}
                      onSelect={setCouponExpirationDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 mt-6">
        <Button
          variant="outline"
          disabled={isUpdating}
          onClick={() => router.push("/products")}
        >
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={isUpdating}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpdating ? t("saving") : t("save")}
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("errorModal.title")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{errorMsg}</div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>
              {t("errorModal.confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditProductClient.PageWrapper>
  );
}
