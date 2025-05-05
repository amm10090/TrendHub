"use client";

import {
  Card,
  CardBody,
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Chip,
  Switch,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { ProductsClient } from "@/app/[locale]/products/products-client";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type { CategoryTreeNode } from "@/lib/services/category.service";

import { EditProductClient } from "./edit-product-client";

// 声明接收id作为prop的客户端组件
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
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
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
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>(
    t("errorModal.defaultMessage"),
  );

  // 获取商品详情
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

        // 填充表单数据
        setName(product.name || "");
        setDescription(product.description || "");
        setBrandId(product.brandId || "");
        setCategoryId(product.categoryId || "");
        setPrice(product.price ? String(product.price) : "");
        setOriginalPrice(
          product.originalPrice ? String(product.originalPrice) : "",
        );
        setCostPrice(product.costPrice ? String(product.costPrice) : "");
        setInventory(product.inventory ? String(product.inventory) : "");
        setSku(product.sku || "");
        setBarcode(product.barcode || "");
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

        // 如果有标签数据
        if (product.tags) {
          setTags(
            typeof product.tags === "string"
              ? product.tags.split(",").map((tag) => tag.trim())
              : product.tags,
          );
        }

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
    // 验证必填字段
    if (!name.trim()) {
      setErrorMsg(t("errorModal.emptyName"));
      onOpen();

      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setErrorMsg(t("errorModal.invalidPrice"));
      onOpen();

      return;
    }
    if (!inventory || parseInt(inventory, 10) < 0) {
      setErrorMsg(t("errorModal.invalidInventory"));
      onOpen();

      return;
    }
    if (!categoryId) {
      setErrorMsg(t("errorModal.emptyCategory"));
      onOpen();

      return;
    }
    if (!brandId) {
      setErrorMsg(t("errorModal.emptyBrand"));
      onOpen();

      return;
    }

    try {
      // 更新商品信息
      await updateProduct({
        id: productId,
        data: {
          name,
          description,
          brandId,
          categoryId,
          price: parseFloat(price),
          status: isActive ? "Active" : "Draft",
          inventory: parseInt(inventory, 10),
          // sku字段不能在更新时传递，因为它是只读的
          source,
          colors,
          sizes,
          material,
          cautions,
          promotionUrl,
        },
      });

      toast.success(t("successUpdate"));
      router.push("/products");
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : t("errorModal.defaultMessage"),
      );
      onOpen();
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

  // 如果正在加载商品信息或发生错误，显示相应的UI
  if (isLoadingProduct) {
    return (
      <EditProductClient.PageWrapper>
        <div className="flex h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </EditProductClient.PageWrapper>
    );
  }

  if (productError) {
    return (
      <EditProductClient.PageWrapper>
        <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
          <div className="text-xl text-red-500">{productError}</div>
          <Button color="primary" onPress={() => router.push("/products")}>
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
            isSelected={isActive}
            onValueChange={setIsActive}
            size="sm"
            color="success"
          >
            {isActive ? t("status.active") : t("status.draft")}
          </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardBody className="gap-6">
              <div className="grid gap-4">
                <Input
                  label={t("productInfo.name")}
                  placeholder={t("productInfo.namePlaceholder")}
                  variant="bordered"
                  isRequired
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  description={t("productInfo.nameDescription")}
                />

                <Textarea
                  label={t("productInfo.description")}
                  placeholder={t("productInfo.descriptionPlaceholder")}
                  variant="bordered"
                  minRows={3}
                  className="min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  description={t("productInfo.descriptionHelp")}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">
                {t("basicInfo.title")}
              </h3>
              <div className="grid gap-4">
                <Input
                  label={t("basicInfo.source")}
                  placeholder={t("basicInfo.sourcePlaceholder")}
                  variant="bordered"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  description={t("basicInfo.sourceDescription")}
                />

                <Input
                  label={t("basicInfo.promotionUrl")}
                  placeholder={t("basicInfo.promotionPlaceholder")}
                  variant="bordered"
                  value={promotionUrl}
                  onChange={(e) => setPromotionUrl(e.target.value)}
                  description={t("basicInfo.promotionDescription")}
                />

                <Textarea
                  label={t("basicInfo.material")}
                  placeholder={t("basicInfo.materialPlaceholder")}
                  variant="bordered"
                  minRows={2}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  description={t("basicInfo.materialDescription")}
                />

                <Textarea
                  label={t("basicInfo.cautions")}
                  placeholder={t("basicInfo.cautionsPlaceholder")}
                  variant="bordered"
                  minRows={2}
                  value={cautions}
                  onChange={(e) => setCautions(e.target.value)}
                  description={t("basicInfo.cautionsDescription")}
                />

                <div className="space-y-2">
                  <p className="text-small font-medium">
                    {t("basicInfo.colors")}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {colors.map((color) => (
                      <Chip
                        key={color}
                        onClose={() => handleColorDelete(color)}
                        variant="flat"
                        color="primary"
                        size="sm"
                      >
                        {color}
                      </Chip>
                    ))}
                  </div>
                  <Input
                    placeholder={t("basicInfo.colorsPlaceholder")}
                    variant="bordered"
                    size="sm"
                    value={colorInput}
                    onChange={handleColorInputChange}
                    onKeyDown={handleColorInput}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-small font-medium">
                    {t("basicInfo.sizes")}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {sizes.map((size) => (
                      <Chip
                        key={size}
                        onClose={() => handleSizeDelete(size)}
                        variant="flat"
                        color="primary"
                        size="sm"
                      >
                        {size}
                      </Chip>
                    ))}
                  </div>
                  <Input
                    placeholder={t("basicInfo.sizesPlaceholder")}
                    variant="bordered"
                    size="sm"
                    value={sizeInput}
                    onChange={handleSizeInputChange}
                    onKeyDown={handleSizeInput}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">
                {t("priceAndInventory.title")}
              </h3>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label={t("priceAndInventory.price")}
                    placeholder="0.00"
                    variant="bordered"
                    startContent="¥"
                    isRequired
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    label={t("priceAndInventory.originalPrice")}
                    placeholder="0.00"
                    variant="bordered"
                    startContent="¥"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label={t("priceAndInventory.costPrice")}
                    placeholder="0.00"
                    variant="bordered"
                    startContent="¥"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    label={t("priceAndInventory.inventory")}
                    placeholder="0"
                    variant="bordered"
                    isRequired
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("priceAndInventory.sku")}
                    placeholder={t("priceAndInventory.skuPlaceholder")}
                    variant="bordered"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    isDisabled={true}
                    description={t("priceAndInventory.skuDisabledDescription")}
                  />
                  <Input
                    label={t("priceAndInventory.barcode")}
                    placeholder={t("priceAndInventory.barcodePlaceholder")}
                    variant="bordered"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Switch
                    isSelected={isOnSale}
                    onValueChange={setIsOnSale}
                    color="primary"
                  />
                  <div>
                    <p className="text-small font-medium">
                      {t("priceAndInventory.onSale")}
                    </p>
                    <p className="text-tiny text-default-400">
                      {t("priceAndInventory.onSaleDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">
                {t("organization.title")}
              </h3>
              <div className="space-y-4">
                <Select
                  label={t("organization.brand")}
                  placeholder={t("organization.brandPlaceholder")}
                  variant="bordered"
                  isRequired
                  selectedKeys={brandId ? [brandId] : []}
                  onChange={(e) => setBrandId(e.target.value)}
                  isLoading={isBrandsLoading}
                  isDisabled={isBrandsLoading}
                >
                  {brandsError ? (
                    <SelectItem key="error">
                      {t("organization.brandError")}
                    </SelectItem>
                  ) : brands.length === 0 ? (
                    <SelectItem key="empty">
                      {t("organization.brandEmpty")}
                    </SelectItem>
                  ) : (
                    brands.map((brand) => (
                      <SelectItem key={brand.id}>{brand.name}</SelectItem>
                    ))
                  )}
                </Select>

                <ProductsClient.CascadeCategorySelector
                  categories={
                    Array.isArray(categoryTree)
                      ? categoryTree.flatMap((node) =>
                          flattenCategoryTree(node),
                        )
                      : []
                  }
                  onCategoryChange={(id) => setCategoryId(id)}
                  value={categoryId}
                />

                <div className="space-y-2">
                  <p className="text-small font-medium">
                    {t("organization.tags")}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        onClose={() => handleTagDelete(tag)}
                        variant="flat"
                        color="primary"
                        size="sm"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                  <Input
                    placeholder={t("organization.tagsPlaceholder")}
                    variant="bordered"
                    size="sm"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagInput}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">
                {t("visibility.title")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    color="primary"
                  />
                  <div>
                    <p className="text-small font-medium">
                      {t("visibility.featured")}
                    </p>
                    <p className="text-tiny text-default-400">
                      {t("visibility.featuredDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 mt-6">
        <Button
          variant="bordered"
          color="default"
          disabled={isUpdating}
          onPress={() => router.push("/products")}
        >
          {t("cancel")}
        </Button>
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={isUpdating}
          isDisabled={isUpdating}
        >
          {t("save")}
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{t("errorModal.title")}</ModalHeader>
          <ModalBody>{errorMsg}</ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              {t("errorModal.confirmBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </EditProductClient.PageWrapper>
  );
}
