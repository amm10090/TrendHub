"use client";

import { format } from "date-fns";
import { CalendarIcon, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChangeEvent, KeyboardEvent, useState, useEffect } from "react";
import { toast } from "sonner";

import { ProductsClient } from "@/app/[locale]/products/products-client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type { CategoryTreeNode } from "@/lib/services/category.service";
import { cn } from "@/lib/utils";

import { NewProductClient } from "./new-product-client";

export default function NewProductPage() {
  const router = useRouter();
  const t = useTranslations("product.edit");
  const { createProduct, isCreating } = useProducts();
  const { categoryTree } = useCategories();
  const {
    brands,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useBrands();

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [inventory, setInventory] = useState<string>("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [source, setSource] = useState("");
  const [material, setMaterial] = useState("");
  const [cautions, setCautions] = useState("");
  const [promotionUrl, setPromotionUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [discount, setDiscount] = useState<string>("");
  const [coupon, setCoupon] = useState<string>("");
  const [couponDescription, setCouponDescription] = useState<string>("");
  const [couponExpirationDate, setCouponExpirationDate] = useState<
    Date | undefined
  >();
  const [variantRows, setVariantRows] = useState<number[]>([0]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [gender, setGender] = useState<"women" | "men" | "unisex" | null>(null);
  const [url, setUrl] = useState("");
  const [adurl, setAdurl] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isPageLoading) {
    return (
      <NewProductClient.PageWrapper>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner className="h-8 w-8 mx-auto" />
            <p className="text-muted-foreground">{t("new.loadingMessage")}</p>
          </div>
        </div>
      </NewProductClient.PageWrapper>
    );
  }

  const handleTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleColorInput = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const handleColorInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setColorInput(e.target.value);
  };

  const handleSizeInput = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const handleSizeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSizeInput(e.target.value);
  };

  const handleGenerateMonetizationLink = async () => {
    if (!url) {
      toast.error("原始URL为空，无法生成链接。");

      return;
    }
    setIsGeneratingLink(true);
    try {
      // For a new product, we can't link it to an ID yet.
      // We'll call a different endpoint or modify the existing one
      // to accept a URL directly. For now, let's assume we have
      // a service that can take a URL and return a monetized one.
      // This is a placeholder for the actual API call.
      const response = await fetch(`/api/products/monetize/generate-from-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (response.ok && result.monetizedUrl) {
        setAdurl(result.monetizedUrl);
        toast.success("货币化链接已生成！");
      } else {
        throw new Error(result.error || "生成链接失败");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "生成货币化链接时发生未知错误。",
      );
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const addVariantRow = () => {
    setVariantRows([...variantRows, variantRows.length]);
  };

  const removeVariantRow = (index: number) => {
    if (variantRows.length > 1) {
      setVariantRows(variantRows.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("errorModal.emptyName"));

      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error(t("errorModal.invalidPrice"));

      return;
    }
    if (!inventory || parseInt(inventory, 10) < 0) {
      toast.error(t("errorModal.invalidInventory"));

      return;
    }
    if (!categoryId) {
      toast.error(t("errorModal.emptyCategory"));

      return;
    }
    if (!brandId) {
      toast.error(t("errorModal.emptyBrand"));

      return;
    }

    try {
      const productSku =
        sku.trim() ||
        `${brandId}-${name.replace(/\s+/g, "-")}-${new Date().getTime()}`.substring(
          0,
          20,
        );

      await createProduct({
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
        couponExpirationDate: couponExpirationDate || null,
        status: isActive ? "Active" : "Draft",
        images: [],
        videos: [],
        inventory: parseInt(inventory, 10),
        sku: productSku,
        source,
        colors,
        sizes,
        tags,
        material,
        cautions,
        promotionUrl,
        gender,
        url,
        adurl,
        isFeatured,
        isOnSale,
      });

      toast.success(t("toast.createSuccess"));
      router.push("/products");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("toast.createErrorFallback"),
      );
    }
  };

  const flattenCategoryTree = (node: CategoryTreeNode) => {
    const result = [
      {
        id: node.id,
        name: node.name,
        level: node.level,
        parentId: node.parentId,
      },
    ];

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        result.push(...flattenCategoryTree(child));
      });
    }

    return result;
  };

  return (
    <NewProductClient.PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">{t("new.title")}</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="product-status"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="product-status">
            {isActive ? t("status.active") : t("status.draft")}
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="product-name">
                  {t("productInfo.name")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder={t("productInfo.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("productInfo.nameDescription")}
                </p>
              </div>

              <div>
                <Label htmlFor="product-description">
                  {t("productInfo.description")}
                </Label>
                <Textarea
                  id="product-description"
                  placeholder={t("productInfo.descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
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
              <div>
                <Label htmlFor="product-source">{t("basicInfo.source")}</Label>
                <Input
                  id="product-source"
                  placeholder={t("basicInfo.sourcePlaceholder")}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("basicInfo.sourceDescription")}
                </p>
              </div>

              <div>
                <Label htmlFor="product-promotion-url">
                  {t("basicInfo.promotionUrl")}
                </Label>
                <Input
                  id="product-promotion-url"
                  placeholder={t("basicInfo.promotionPlaceholder")}
                  value={promotionUrl}
                  onChange={(e) => setPromotionUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("basicInfo.promotionDescription")}
                </p>
              </div>

              <div>
                <Label htmlFor="product-material">
                  {t("basicInfo.material")}
                </Label>
                <Textarea
                  id="product-material"
                  placeholder={t("basicInfo.materialPlaceholder")}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="min-h-[48px] mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("basicInfo.materialDescription")}
                </p>
              </div>

              <div>
                <Label htmlFor="product-cautions">
                  {t("basicInfo.cautions")}
                </Label>
                <Textarea
                  id="product-cautions"
                  placeholder={t("basicInfo.cautionsPlaceholder")}
                  value={cautions}
                  onChange={(e) => setCautions(e.target.value)}
                  className="min-h-[48px] mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("basicInfo.cautionsDescription")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-colors">{t("basicInfo.colors")}</Label>
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
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        onClick={() => handleColorDelete(color)}
                        aria-label={`Remove ${color}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="product-colors"
                  placeholder={t("basicInfo.colorsPlaceholder")}
                  value={colorInput}
                  onChange={handleColorInputChange}
                  onKeyDown={handleColorInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-sizes">{t("basicInfo.sizes")}</Label>
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
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        onClick={() => handleSizeDelete(size)}
                        aria-label={`Remove ${size}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="product-sizes"
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
              <CardTitle>货币化</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="product-url">原始URL</Label>
                <Input
                  id="product-url"
                  placeholder="产品原始链接"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  手动添加或从爬虫获取的原始商品链接。
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="product-adurl">货币化URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="product-adurl"
                    placeholder="Sovrn 或其他联盟链接"
                    value={adurl}
                    onChange={(e) => setAdurl(e.target.value)}
                  />
                  <Button
                    onClick={handleGenerateMonetizationLink}
                    disabled={!url || isGeneratingLink}
                    variant="outline"
                    size="icon"
                  >
                    {isGeneratingLink ? (
                      <Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  联盟营销链接，用于追踪销售。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("media.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <div className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border p-4 hover:bg-accent">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="mt-2 text-sm text-muted-foreground">
                        {t("media.uploadMain")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-3 grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-border p-2 hover:bg-accent"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>{t("media.uploadTip")}</p>
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
                  <div>
                    <Label htmlFor="product-price">
                      {t("priceAndInventory.price")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-muted-foreground">¥</span>
                      <Input
                        id="product-price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="product-original-price">
                      {t("priceAndInventory.originalPrice")}
                    </Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-muted-foreground">¥</span>
                      <Input
                        id="product-original-price"
                        type="number"
                        placeholder="0.00"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-cost-price">
                      {t("priceAndInventory.costPrice")}
                    </Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-muted-foreground">¥</span>
                      <Input
                        id="product-cost-price"
                        type="number"
                        placeholder="0.00"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
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
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-sku">
                      {t("priceAndInventory.sku")}
                    </Label>
                    <Input
                      id="product-sku"
                      placeholder={t("priceAndInventory.skuPlaceholder")}
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-barcode">
                      {t("priceAndInventory.barcode")}
                    </Label>
                    <Input
                      id="product-barcode"
                      placeholder={t("priceAndInventory.barcodePlaceholder")}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="product-on-sale"
                    checked={isOnSale}
                    onCheckedChange={setIsOnSale}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="product-on-sale">
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

          <Card>
            <CardHeader>
              <CardTitle>{t("variants.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={addVariantRow}>
                    {t("variants.addVariant")}
                  </Button>
                </div>

                <div className="grid gap-4">
                  {variantRows.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-3">
                        {index === 0 && (
                          <Label className="text-sm">
                            {t("variants.variantName")}
                          </Label>
                        )}
                        <Input
                          placeholder={t("variants.variantNamePlaceholder")}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        {index === 0 && (
                          <Label className="text-sm">
                            {t("variants.variantValue")}
                          </Label>
                        )}
                        <Input
                          placeholder={t("variants.variantValuePlaceholder")}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && (
                          <Label className="text-sm">
                            {t("variants.variantPrice")}
                          </Label>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && (
                          <Label className="text-sm">
                            {t("variants.variantStock")}
                          </Label>
                        )}
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div className="col-span-2 flex justify-center items-center h-full">
                        {index === 0 && (
                          <Label className="text-sm invisible">
                            {t("variants.variantActions")}
                          </Label>
                        )}
                        <div className="flex items-center h-full mt-1">
                          {index !== 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 h-8 w-8"
                              onClick={() => removeVariantRow(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="sr-only">
                                {t("variants.removeVariant")}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("shipping.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-weight">{t("shipping.weight")}</Label>
                  <Input
                    id="product-weight"
                    type="number"
                    placeholder={t("shipping.weightPlaceholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-method">
                    {t("shipping.shippingMethod")}
                  </Label>
                  <Select>
                    <SelectTrigger id="shipping-method" className="mt-1">
                      <SelectValue
                        placeholder={t("shipping.shippingMethodPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        {t("shipping.standardShipping")}
                      </SelectItem>
                      <SelectItem value="express">
                        {t("shipping.expressShipping")}
                      </SelectItem>
                      <SelectItem value="free">
                        {t("shipping.freeShipping")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="product-length">{t("shipping.length")}</Label>
                  <Input
                    id="product-length"
                    type="number"
                    placeholder={t("shipping.dimensionPlaceholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-width">{t("shipping.width")}</Label>
                  <Input
                    id="product-width"
                    type="number"
                    placeholder={t("shipping.dimensionPlaceholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-height">{t("shipping.height")}</Label>
                  <Input
                    id="product-height"
                    type="number"
                    placeholder={t("shipping.dimensionPlaceholder")}
                    className="mt-1"
                  />
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
              <div>
                <Label htmlFor="brand-select">
                  {t("organization.brand")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={brandId}
                  onValueChange={setBrandId}
                  disabled={isBrandsLoading}
                >
                  <SelectTrigger id="brand-select" className="w-full mt-1">
                    <SelectValue
                      placeholder={t("organization.brandPlaceholder")}
                    />
                    {isBrandsLoading && <Spinner className="ml-2 h-4 w-4" />}
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
                    ? categoryTree.flatMap((node) => flattenCategoryTree(node))
                    : []
                }
                onCategoryChange={(id) => setCategoryId(id)}
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
                        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-primary/70 hover:bg-secondary hover:text-primary"
                        onClick={() => handleTagDelete(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
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
                <Label htmlFor="product-gender">
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
                  <SelectTrigger id="product-gender" className="w-full mt-1">
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
                  id="product-featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="product-featured">
                    {t("visibility.featured")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("visibility.featuredDescription")}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="tax-category">
                  {t("visibility.taxCategory")}
                </Label>
                <Select>
                  <SelectTrigger id="tax-category" className="mt-1">
                    <SelectValue
                      placeholder={t("visibility.taxCategoryPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      {t("visibility.standardTax")}
                    </SelectItem>
                    <SelectItem value="reduced">
                      {t("visibility.reducedTax")}
                    </SelectItem>
                    <SelectItem value="zero">
                      {t("visibility.zeroTax")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("advancedSettings.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>{t("seo.title")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label htmlFor="seo-title">{t("seo.seoTitle")}</Label>
                        <Input
                          id="seo-title"
                          placeholder={t("seo.seoTitlePlaceholder")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="meta-description">
                          {t("seo.metaDescription")}
                        </Label>
                        <Textarea
                          id="meta-description"
                          placeholder={t("seo.metaDescriptionPlaceholder")}
                          className="min-h-[48px] mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    {t("advancedSettings.inventoryManagement")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="flex items-center gap-2">
                        <Switch id="track-inventory" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="track-inventory">
                            {t("advancedSettings.trackInventory")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("advancedSettings.trackInventoryDescription")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="allow-backorder" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="allow-backorder">
                            {t("advancedSettings.allowBackorder")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("advancedSettings.allowBackorderDescription")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pricingAndCoupons.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originalPrice">
                  {t("pricingAndCoupons.originalPriceLabel")}
                </Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  placeholder={t("pricingAndCoupons.originalPricePlaceholder")}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="discount">
                  {t("pricingAndCoupons.discountLabel")}
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  placeholder={t("pricingAndCoupons.discountPlaceholder")}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="coupon">
                  {t("pricingAndCoupons.couponLabel")}
                </Label>
                <Input
                  id="coupon"
                  type="text"
                  placeholder={t("pricingAndCoupons.couponPlaceholder")}
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="couponDescription">
                  {t("pricingAndCoupons.couponDescriptionLabel")}
                </Label>
                <Textarea
                  id="couponDescription"
                  placeholder={t(
                    "pricingAndCoupons.couponDescriptionPlaceholder",
                  )}
                  value={couponDescription}
                  onChange={(e) => setCouponDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="couponExpirationDate">
                  {t("pricingAndCoupons.couponExpirationDateLabel")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !couponExpirationDate && "text-muted-foreground",
                      )}
                      id="couponExpirationDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {couponExpirationDate ? (
                        format(couponExpirationDate, "PPP")
                      ) : (
                        <span>
                          {t(
                            "pricingAndCoupons.couponExpirationDatePlaceholder",
                          )}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
        <Button variant="outline" disabled={isCreating}>
          {t("actions.saveDraft")}
        </Button>
        <Button onClick={handleSubmit} disabled={isCreating}>
          {isCreating && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          {t("actions.publish")}
        </Button>
      </div>
    </NewProductClient.PageWrapper>
  );
}
