"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChangeEvent, KeyboardEvent, useState } from "react";
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
        couponExpirationDate: couponExpirationDate
          ? couponExpirationDate.toISOString()
          : null,
        status: isActive ? "Active" : "Draft",
        images: [],
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
        <h2 className="text-3xl font-bold tracking-tight">添加新商品</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="product-status"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="product-status">{isActive ? "激活" : "草稿"}</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="product-name">
                  商品名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="请输入商品名称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  给你的商品起一个吸引人的名称
                </p>
              </div>

              <div>
                <Label htmlFor="product-description">商品描述</Label>
                <Textarea
                  id="product-description"
                  placeholder="请输入商品描述"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  详细描述商品的特点、用途和优势
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-source">商品来源</Label>
                <Input
                  id="product-source"
                  placeholder="请输入商品来源"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  商品生产地或采购来源
                </p>
              </div>

              <div>
                <Label htmlFor="product-promotion-url">商品推广链接</Label>
                <Input
                  id="product-promotion-url"
                  placeholder="请输入推广链接"
                  value={promotionUrl}
                  onChange={(e) => setPromotionUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  外部推广或营销链接
                </p>
              </div>

              <div>
                <Label htmlFor="product-material">商品材质</Label>
                <Textarea
                  id="product-material"
                  placeholder="请输入商品材质信息"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="min-h-[48px] mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  描述商品的材质成分
                </p>
              </div>

              <div>
                <Label htmlFor="product-cautions">商品注意事项</Label>
                <Textarea
                  id="product-cautions"
                  placeholder="请输入商品注意事项"
                  value={cautions}
                  onChange={(e) => setCautions(e.target.value)}
                  className="min-h-[48px] mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  使用、保养等相关注意事项
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-colors">商品颜色</Label>
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
                  placeholder="输入颜色并按回车添加"
                  value={colorInput}
                  onChange={handleColorInputChange}
                  onKeyDown={handleColorInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-sizes">商品尺码</Label>
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
                  placeholder="输入尺码并按回车添加"
                  value={sizeInput}
                  onChange={handleSizeInputChange}
                  onKeyDown={handleSizeInput}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>媒体</CardTitle>
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
                        上传主图
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
                <p>
                  支持 .jpg、.jpeg、.png、.webp 格式，图片尺寸建议为 800x800
                  像素，最大不超过 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>价格与库存</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-price">
                      售价 <span className="text-destructive">*</span>
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
                    <Label htmlFor="product-original-price">原价</Label>
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
                    <Label htmlFor="product-cost-price">成本价</Label>
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
                      库存数量 <span className="text-destructive">*</span>
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
                    <Label htmlFor="product-sku">SKU</Label>
                    <Input
                      id="product-sku"
                      placeholder="例如：SM-BLK-L"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-barcode">条形码</Label>
                    <Input
                      id="product-barcode"
                      placeholder="例如：123456789012"
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
                    <Label htmlFor="product-on-sale">特价商品</Label>
                    <p className="text-sm text-muted-foreground">
                      设置为特价商品后，将在特价区域显示
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商品变体</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={addVariantRow}>
                    添加变体
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
                          <Label className="text-sm">规格名称</Label>
                        )}
                        <Input placeholder="颜色/尺寸/规格" className="mt-1" />
                      </div>
                      <div className="col-span-3">
                        {index === 0 && (
                          <Label className="text-sm">规格值</Label>
                        )}
                        <Input placeholder="黑色/XL/套装" className="mt-1" />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-sm">价格</Label>}
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-sm">库存</Label>}
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div className="col-span-2 flex justify-center items-center h-full">
                        {index === 0 && (
                          <Label className="text-sm invisible">操作</Label>
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
                              <span className="sr-only">删除变体</span>
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
              <CardTitle>配送信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-weight">重量(克)</Label>
                  <Input
                    id="product-weight"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-method">配送方式</Label>
                  <Select>
                    <SelectTrigger id="shipping-method" className="mt-1">
                      <SelectValue placeholder="请选择配送方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">标准快递</SelectItem>
                      <SelectItem value="express">加急快递</SelectItem>
                      <SelectItem value="free">免费配送</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="product-length">长度(厘米)</Label>
                  <Input
                    id="product-length"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-width">宽度(厘米)</Label>
                  <Input
                    id="product-width"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-height">高度(厘米)</Label>
                  <Input
                    id="product-height"
                    type="number"
                    placeholder="0"
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
              <CardTitle>组织</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand-select">
                  商品品牌 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={brandId}
                  onValueChange={setBrandId}
                  disabled={isBrandsLoading}
                >
                  <SelectTrigger id="brand-select" className="w-full mt-1">
                    <SelectValue placeholder="请选择品牌" />
                    {isBrandsLoading && <Spinner className="ml-2 h-4 w-4" />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {brandsError ? (
                        <SelectItem value="error" disabled>
                          获取品牌失败
                        </SelectItem>
                      ) : brands.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          暂无品牌数据
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
                <Label htmlFor="product-tags">商品标签</Label>
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
                  placeholder="输入标签并按回车添加"
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
              <CardTitle>可见性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="product-featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="product-featured">特色商品</Label>
                  <p className="text-sm text-muted-foreground">
                    在首页和特色区域显示
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="tax-category">税收类别</Label>
                <Select>
                  <SelectTrigger id="tax-category" className="mt-1">
                    <SelectValue placeholder="请选择税收类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">标准税率</SelectItem>
                    <SelectItem value="reduced">优惠税率</SelectItem>
                    <SelectItem value="zero">零税率</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>SEO设置</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label htmlFor="seo-title">SEO标题</Label>
                        <Input
                          id="seo-title"
                          placeholder="搜索引擎标题"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="meta-description">Meta描述</Label>
                        <Textarea
                          id="meta-description"
                          placeholder="搜索引擎描述"
                          className="min-h-[48px] mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>库存管理</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="flex items-center gap-2">
                        <Switch id="track-inventory" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="track-inventory">跟踪库存</Label>
                          <p className="text-sm text-muted-foreground">
                            启用后系统将自动更新库存
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="allow-backorder" defaultChecked />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="allow-backorder">允许缺货下单</Label>
                          <p className="text-sm text-muted-foreground">
                            允许顾客购买缺货商品
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
          保存草稿
        </Button>
        <Button onClick={handleSubmit} disabled={isCreating}>
          {isCreating && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          发布商品
        </Button>
      </div>
    </NewProductClient.PageWrapper>
  );
}
