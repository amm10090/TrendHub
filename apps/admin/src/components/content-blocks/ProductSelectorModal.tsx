// 基本的 ProductSelectorModal 组件结构
"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, Search, XIcon, GripVertical } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'; // 移除旧的 react-beautiful-dnd 导入

// Admin UI 中用于产品选择列表的类型
// 需要根据实际从 /api/admin/products 返回的数据调整
export interface ProductAdminSelectItem {
  id: string;
  name: string;
  sku: string | null;
  images: string[]; // 通常用第一张图 images[0]
  price: string; // 假设价格是字符串
  // 可以添加 brandName, categoryName 等用于显示
}

// API返回的单个产品项的临时类型，后续应替换为共享类型
interface ApiProductResponseItem {
  id: string;
  name: string;
  sku: string | null;
  images: string[];
  price: number | string; // API可能返回数字或字符串，需要处理
  // 其他可能从API返回的字段
  brand?: { name: string }; // 示例
  category?: { name: string }; // 示例
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection: (selectedProducts: ProductAdminSelectItem[]) => void;
  initialSelectedProducts?: ProductAdminSelectItem[]; // 传入已选产品完整信息，而非仅ID
  // 考虑分页和搜索API的限制
  // fetchProductsApi: (params: { page: number; limit: number; search?: string }) => Promise<{ data: ProductAdminSelectItem[]; totalItems: number; totalPages: number }>;
}

// 新的可排序项组件
interface SortableProductItemProps {
  product: ProductAdminSelectItem;
  index: number;
  onRemove: (product: ProductAdminSelectItem) => void;
}

const SortableProductItem: React.FC<SortableProductItemProps> = ({
  product,
  index,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 ${
        isDragging ? "shadow-xl ring-2 ring-primary dark:ring-primary-dark" : ""
      }`}
    >
      <div {...attributes} {...listeners} className="p-1 cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 w-4 text-center">
        {index + 1}.
      </span>
      <Image
        src={product.images[0] || "https://via.placeholder.com/60"}
        alt={product.name}
        width={40}
        height={40}
        className="object-cover rounded-sm flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{product.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          SKU: {product.sku || "N/A"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 h-7 w-7"
        onClick={() => onRemove(product)}
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirmSelection,
  initialSelectedProducts = [],
  // fetchProductsApi
}) => {
  const t = useTranslations("contentManagement.productSelector");
  const commonT = useTranslations("common");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchedProducts, setSearchedProducts] = useState<
    ProductAdminSelectItem[]
  >([]);
  const [selectedProducts, setSelectedProducts] = useState<
    ProductAdminSelectItem[]
  >(initialSelectedProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // API 服务函数 (假设已在某处定义，例如 services/admin/product.service.ts)
  // MOCK: 这个函数需要实际实现或从服务导入
  async function fetchAdminProductsApi(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    data: ProductAdminSelectItem[];
    totalItems: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.search) {
      queryParams.append("search", params.search);
    }
    // 这里应该是实际的 fetch 调用
    const response = await fetch(`/api/products?${queryParams.toString()}`); // 修改API路径为 /api/products (admin scope)

    if (!response.ok) {
      throw new Error("Failed to fetch products from admin API");
    }
    const result = await response.json();
    // 假设API返回 { data: Product[], pagination: { totalItems: number, totalPages: number } }
    // 需要将 API 返回的 Product[] 映射到 ProductAdminSelectItem[]
    const adminSelectItems: ProductAdminSelectItem[] = result.data.map(
      (p: ApiProductResponseItem) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        images: p.images || [], // API 返回的 images 可能为 null
        price:
          typeof p.price === "number" ? p.price.toFixed(2) : String(p.price), // 处理价格类型，确保是字符串
      }),
    );

    return {
      data: adminSelectItems,
      totalItems: result.pagination.totalItems,
      totalPages: result.pagination.totalPages,
    };
  }

  // 当模态框打开时，根据 initialSelectedProducts 初始化 selectedProducts
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(initialSelectedProducts);
      // Optionally, fetch initial page of all products if searchTerm is empty
      // fetchProducts(1, '');
    }
  }, [isOpen, initialSelectedProducts]); // initialSelectedProducts 作为依赖

  // TODO: 实现 API 调用
  const fetchProducts = useCallback(
    async (page: number, search: string) => {
      setIsLoading(true);
      // console.log(`Fetching products: page=${page}, search='${search}', limit=${ITEMS_PER_PAGE}`);
      try {
        const result = await fetchAdminProductsApi({
          page,
          limit: ITEMS_PER_PAGE,
          search,
        });

        setSearchedProducts(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(page);
      } catch {
        // console.error("Failed to fetch products:", error);
        // toast.error(t('messages.fetchError'));
        setSearchedProducts([]);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        setIsLoading(false);
      }
      // 模拟数据
      // await new Promise(resolve => setTimeout(resolve, 500));
      // const mockProducts = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => ({
      //   id: `mock-${search || 'all'}-${page}-${i}`,
      //   name: `${search || 'Product'} ${page}-${i}`,
      //   sku: `SKU-${page}-${i}`,
      //   images: ['https://via.placeholder.com/100'],
      //   price: ((page * 10) + i * 5).toFixed(2),
      // }));
      // setSearchedProducts(mockProducts);
      // setTotalPages(search ? 3 : 5); // 模拟总页数
      // setCurrentPage(page);
      // setIsLoading(false);
    },
    [
      /* t */
    ],
  ); // 移除 fetchProductsApi, t 以避免循环依赖，因为 fetchAdminProductsApi 现在在组件内

  // 初始化加载或搜索词变化时加载第一页
  useEffect(() => {
    if (isOpen) {
      fetchProducts(1, searchTerm);
    }
  }, [isOpen, searchTerm, fetchProducts]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // De-bounce logic can be added here if needed
  };

  const handleToggleSelectProduct = (product: ProductAdminSelectItem) => {
    setSelectedProducts((prevSelected) => {
      const isSelected = prevSelected.find((p) => p.id === product.id);

      if (isSelected) {
        return prevSelected.filter((p) => p.id !== product.id);
      }

      return [...prevSelected, product];
    });
  };

  const handleConfirm = () => {
    onConfirmSelection(selectedProducts);
    onClose();
  };

  const isProductSelected = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items; // 防御性检查

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          {/* Left Panel: Search and Results */}
          <div className="flex flex-col border-r overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={commonT("search") + "..."}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {isLoading && searchedProducts.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchedProducts.length === 0 && !isLoading ? (
                <p className="text-center text-gray-500 py-8">
                  {t("noProductsFound")}
                </p>
              ) : (
                <div className="space-y-3">
                  {searchedProducts.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className={`flex items-center text-left w-full gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isProductSelected(product.id)
                          ? "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
                          : "dark:border-gray-600"
                      }`}
                      onClick={() => handleToggleSelectProduct(product)}
                    >
                      <Image
                        src={
                          product.images[0] || "https://via.placeholder.com/60"
                        }
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-cover rounded-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          SKU: {product.sku || "N/A"}
                        </p>
                      </div>
                      <Button
                        variant={
                          isProductSelected(product.id)
                            ? "destructive"
                            : "outline"
                        }
                        size="sm"
                        className="ml-auto text-xs h-auto py-1 px-2"
                      >
                        {isProductSelected(product.id)
                          ? t("removeButton")
                          : t("addButton")}
                      </Button>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            {/* Pagination for Searched Products */}
            {totalPages > 1 && !isLoading && searchedProducts.length > 0 && (
              <div className="p-4 border-t flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProducts(currentPage - 1, searchTerm)}
                  disabled={currentPage <= 1}
                >
                  {commonT("pagination.previous")}
                </Button>
                <span className="text-sm">
                  {commonT("pagination.pageInfo", { currentPage, totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProducts(currentPage + 1, searchTerm)}
                  disabled={currentPage >= totalPages}
                >
                  {commonT("pagination.next")}
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Selected Products */}
          <div className="flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-md">
                {t("selectedProductsTitle")} ({selectedProducts.length})
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              {selectedProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t("noProductsSelected")}
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedProducts.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {selectedProducts.map((product, index) => (
                        <SortableProductItem
                          key={product.id}
                          product={product}
                          index={index}
                          onRemove={handleToggleSelectProduct}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              {commonT("actions.cancel")}
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm}>{t("confirmSelectionButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 必要的翻译 (示例)
/*
apps/admin/src/messages/cn.json:
{
  "contentManagement": {
    "productSelector": {
      "title": "选择产品",
      "addButton": "选择",
      "removeButton": "移除",
      "selectedProductsTitle": "已选产品",
      "noProductsFound": "未找到相关产品。",
      "noProductsSelected": "尚未选择任何产品。",
      "confirmSelectionButton": "确认选择",
      "messages": {
        "fetchError": "加载产品列表失败。"
      }
    }
  },
  "common": {
    "search": "搜索",
    "pagination": {
      "previous": "上一页",
      "next": "下一页",
      "pageInfo": "第 {currentPage} 页，共 {totalPages} 页"
    },
    "actions": {
      "cancel": "取消"
    }
  }
}
*/
