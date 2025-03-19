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
  Accordion,
  AccordionItem,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProductsClient } from "@/app/[locale]/products/products-client";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type { CategoryTreeNode } from "@/lib/services/category.service";

import { NewProductClient } from "./new-product-client";

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isCreating } = useProducts();
  const { categoryTree } = useCategories();
  const {
    brands,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useBrands();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
  const [variantRows, setVariantRows] = useState<number[]>([0]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>(
    "请确保填写了所有必填字段（商品名称、售价、库存、品牌和分类）",
  );

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

  const addVariantRow = () => {
    setVariantRows([...variantRows, variantRows.length]);
  };

  const removeVariantRow = (index: number) => {
    if (variantRows.length > 1) {
      setVariantRows(variantRows.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!name.trim()) {
      setErrorMsg("商品名称不能为空");
      onOpen();

      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setErrorMsg("商品价格必须大于0");
      onOpen();

      return;
    }
    if (!inventory || parseInt(inventory, 10) < 0) {
      setErrorMsg("库存数量必须大于等于0");
      onOpen();

      return;
    }
    if (!categoryId) {
      setErrorMsg("请选择商品分类");
      onOpen();

      return;
    }
    if (!brandId) {
      setErrorMsg("请选择商品品牌");
      onOpen();

      return;
    }

    try {
      // 验证并生成SKU
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
        status: isActive ? "Active" : "Draft",
        images: [],
        inventory: parseInt(inventory, 10),
        sku: productSku,
        source,
        colors,
        sizes,
        material,
        cautions,
        promotionUrl,
      });

      router.push("/products");
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "创建商品失败，请稍后重试",
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

  return (
    <NewProductClient.PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">添加新商品</h2>
        <div className="flex items-center gap-2">
          <Switch
            isSelected={isActive}
            onValueChange={setIsActive}
            size="sm"
            color="success"
          >
            {isActive ? "激活" : "草稿"}
          </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardBody className="gap-6">
              <div className="grid gap-4">
                <Input
                  label="商品名称"
                  placeholder="请输入商品名称"
                  variant="bordered"
                  isRequired
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  description="给你的商品起一个吸引人的名称"
                />

                <Textarea
                  label="商品描述"
                  placeholder="请输入商品描述"
                  variant="bordered"
                  minRows={3}
                  className="min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  description="详细描述商品的特点、用途和优势"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">基本信息</h3>
              <div className="grid gap-4">
                <Input
                  label="商品来源"
                  placeholder="请输入商品来源"
                  variant="bordered"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  description="商品生产地或采购来源"
                />

                <Input
                  label="商品推广链接"
                  placeholder="请输入推广链接"
                  variant="bordered"
                  value={promotionUrl}
                  onChange={(e) => setPromotionUrl(e.target.value)}
                  description="外部推广或营销链接"
                />

                <Textarea
                  label="商品材质"
                  placeholder="请输入商品材质信息"
                  variant="bordered"
                  minRows={2}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  description="描述商品的材质成分"
                />

                <Textarea
                  label="商品注意事项"
                  placeholder="请输入商品注意事项"
                  variant="bordered"
                  minRows={2}
                  value={cautions}
                  onChange={(e) => setCautions(e.target.value)}
                  description="使用、保养等相关注意事项"
                />

                <div className="space-y-2">
                  <p className="text-small font-medium">商品颜色</p>
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
                    placeholder="输入颜色并按回车添加"
                    variant="bordered"
                    size="sm"
                    value={colorInput}
                    onChange={handleColorInputChange}
                    onKeyDown={handleColorInput}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-small font-medium">商品尺码</p>
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
                    placeholder="输入尺码并按回车添加"
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
              <h3 className="text-lg font-medium mb-4">媒体</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <div className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-4 hover:bg-gray-50">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
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
                      <span className="mt-2 text-sm text-gray-500">
                        上传主图
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-3 grid grid-cols-3 gap-2">
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                  <div className="h-24 cursor-pointer flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-2 hover:bg-gray-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
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
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  支持 .jpg、.jpeg、.png、.webp 格式，图片尺寸建议为 800x800
                  像素，最大不超过 5MB
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">价格与库存</h3>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="售价"
                    placeholder="0.00"
                    variant="bordered"
                    startContent="¥"
                    isRequired
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    label="原价"
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
                    label="成本价"
                    placeholder="0.00"
                    variant="bordered"
                    startContent="¥"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    label="库存数量"
                    placeholder="0"
                    variant="bordered"
                    isRequired
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="SKU"
                    placeholder="例如：SM-BLK-L"
                    variant="bordered"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                  <Input
                    label="条形码"
                    placeholder="例如：123456789012"
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
                    <p className="text-small font-medium">特价商品</p>
                    <p className="text-tiny text-default-400">
                      设置为特价商品后，将在特价区域显示
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">商品变体</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button
                    color="primary"
                    variant="light"
                    size="sm"
                    onPress={addVariantRow}
                  >
                    添加变体
                  </Button>
                </div>

                <div className="grid gap-4">
                  {variantRows.map((index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3">
                        <Input
                          size="sm"
                          label={index === 0 ? "规格名称" : ""}
                          placeholder="颜色/尺寸/规格"
                          variant="bordered"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          size="sm"
                          label={index === 0 ? "规格值" : ""}
                          placeholder="黑色/XL/套装"
                          variant="bordered"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          label={index === 0 ? "价格" : ""}
                          placeholder="0.00"
                          variant="bordered"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          label={index === 0 ? "库存" : ""}
                          placeholder="0"
                          variant="bordered"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center items-center">
                        {index === 0 && (
                          <div className="text-sm font-medium">操作</div>
                        )}
                        {index !== 0 && (
                          <Button
                            isIconOnly
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => removeVariantRow(index)}
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
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">配送信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="重量(克)"
                  placeholder="0"
                  variant="bordered"
                />
                <Select
                  label="配送方式"
                  placeholder="请选择配送方式"
                  variant="bordered"
                >
                  <SelectItem key="standard">标准快递</SelectItem>
                  <SelectItem key="express">加急快递</SelectItem>
                  <SelectItem key="free">免费配送</SelectItem>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Input
                  type="number"
                  label="长度(厘米)"
                  placeholder="0"
                  variant="bordered"
                />
                <Input
                  type="number"
                  label="宽度(厘米)"
                  placeholder="0"
                  variant="bordered"
                />
                <Input
                  type="number"
                  label="高度(厘米)"
                  placeholder="0"
                  variant="bordered"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">组织</h3>
              <div className="space-y-4">
                <Select
                  label="商品品牌"
                  placeholder="请选择品牌"
                  variant="bordered"
                  isRequired
                  selectedKeys={brandId ? [brandId] : []}
                  onChange={(e) => setBrandId(e.target.value)}
                  isLoading={isBrandsLoading}
                  isDisabled={isBrandsLoading}
                >
                  {brandsError ? (
                    <SelectItem key="error">获取品牌失败</SelectItem>
                  ) : brands.length === 0 ? (
                    <SelectItem key="empty">暂无品牌数据</SelectItem>
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
                  <p className="text-small font-medium">商品标签</p>
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
                    placeholder="输入标签并按回车添加"
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
              <h3 className="text-lg font-medium mb-4">可见性</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    color="primary"
                  />
                  <div>
                    <p className="text-small font-medium">特色商品</p>
                    <p className="text-tiny text-default-400">
                      在首页和特色区域显示
                    </p>
                  </div>
                </div>

                <Select
                  label="税收类别"
                  placeholder="请选择税收类别"
                  variant="bordered"
                >
                  <SelectItem key="standard">标准税率</SelectItem>
                  <SelectItem key="reduced">优惠税率</SelectItem>
                  <SelectItem key="zero">零税率</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-medium mb-4">高级设置</h3>
              <Accordion>
                <AccordionItem key="1" title="SEO设置">
                  <div className="space-y-4 py-2">
                    <Input
                      label="SEO标题"
                      placeholder="搜索引擎标题"
                      variant="bordered"
                    />
                    <Textarea
                      label="Meta描述"
                      placeholder="搜索引擎描述"
                      variant="bordered"
                      minRows={2}
                    />
                  </div>
                </AccordionItem>
                <AccordionItem key="2" title="库存管理">
                  <div className="space-y-4 py-2">
                    <Switch defaultSelected>
                      <div className="flex flex-col">
                        <span>跟踪库存</span>
                        <span className="text-tiny text-default-400">
                          启用后系统将自动更新库存
                        </span>
                      </div>
                    </Switch>
                    <Switch defaultSelected>
                      <div className="flex flex-col">
                        <span>允许缺货下单</span>
                        <span className="text-tiny text-default-400">
                          允许顾客购买缺货商品
                        </span>
                      </div>
                    </Switch>
                  </div>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 mt-6">
        <Button variant="bordered" color="default" disabled={isCreating}>
          保存草稿
        </Button>
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={isCreating}
          isDisabled={isCreating}
        >
          发布商品
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>提交失败</ModalHeader>
          <ModalBody>{errorMsg}</ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              确定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </NewProductClient.PageWrapper>
  );
}
