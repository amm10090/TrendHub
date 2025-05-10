'use client';

import { Breadcrumbs, BreadcrumbItem, Button, Card, CardBody, Chip, Spinner } from '@heroui/react';
import { ChevronUp, Heart, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as qs from 'qs';
import { useState, useEffect, useCallback } from 'react';

import { useProductModal } from '@/contexts/product-modal-context';
import { Brand } from '@/services/brand.service';
import { ProductBasic, ProductListResponse } from '@/services/product.service';
import { type ProductDetail as AppProductDetailType } from '@/types/product';

import { Filters } from '../../product/list/components/Filters';

// 临时的接口，匹配 useProductModal 期望的类型结构
interface ModalExpectedProductDetail {
  id: string;
  name: string;
  brand: AppProductDetailType['brand'];
  price: number;
  images: string[];
  description: string;
  availableQuantity: number;
  isFavorite?: boolean;
  discount?: number;
  originalPrice?: number;
  category: AppProductDetailType['category'];
}

interface BrandDetailClientProps {
  brand: Brand;
  products: ProductListResponse | null;
  locale: string;
}

export default function BrandDetailClient({
  brand,
  products: initialProducts,
  locale,
}: BrandDetailClientProps) {
  const t = useTranslations('brands');
  const [showTopButton, setShowTopButton] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { openProductModal } = useProductModal();
  const searchParams = useSearchParams();

  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // 产品和分页状态
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductBasic[]>(initialProducts?.data || []);
  const [pagination, setPagination] = useState(
    initialProducts?.pagination || { page: 1, totalPages: 1, totalItems: 0 }
  );

  const currentPage = searchParams?.get('page') ? parseInt(searchParams.get('page') as string) : 1;

  // 从URL参数中读取筛选条件
  useEffect(() => {
    if (!searchParams) return;

    const page = searchParams.get('page');

    if (page) {
      setPagination((prev) => ({ ...prev, page: parseInt(page) }));
    }

    setOnSaleOnly(searchParams.get('sale') === 'true');
    setSortOrder(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  // 获取产品数据
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = {
        page: pagination.page,
        limit: 12,
        brand: brand.id,
        sort: sortOrder.split('-')[0],
        order: sortOrder.endsWith('LowToHigh') ? 'asc' : 'desc',
        sale: onSaleOnly,
        category: undefined as string | undefined,
      };

      if (selectedCategory.length > 0) {
        const lastCategory = selectedCategory[selectedCategory.length - 1];

        queryParams.category = lastCategory;
      }

      const queryString = qs.stringify(queryParams, { skipNulls: true });
      const response = await fetch(`/api/public/products?${queryString}`);

      if (!response.ok) {
        throw new Error('获取产品失败');
      }

      const data = await response.json();

      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, sortOrder, onSaleOnly, selectedCategory, brand.id]);

  // 当筛选条件变化时，重新获取产品
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 清除所有筛选
  const clearAllFilters = () => {
    setSelectedCategory([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setOnSaleOnly(false);
  };

  // 处理返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavorites = new Set(favorites);

    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    // 这里可以添加收藏/取消收藏的API调用
  };

  // 计算折扣百分比
  const calculateDiscount = (product: ProductBasic) => {
    if (product.discount) {
      return parseInt(product.discount);
    } else if (product.originalPrice) {
      return Math.round(
        100 - (parseFloat(product.price) / parseFloat(product.originalPrice)) * 100
      );
    }

    return 0;
  };

  // 修复类型问题，处理产品点击
  const handleProductClick = useCallback(
    async (productId: string) => {
      try {
        const response = await fetch(`/api/public/products/${productId}`);

        if (!response.ok) {
          throw new Error('获取产品详情失败');
        }

        const productDetail: AppProductDetailType = await response.json();

        // 转换为期望的类型，并提供回退值
        const modalData: ModalExpectedProductDetail = {
          id: productDetail.id,
          name: productDetail.name,
          brand: productDetail.brand,
          price: Number(productDetail.price),
          images: productDetail.images || [],
          description: productDetail.description || '',
          availableQuantity: productDetail.availableQuantity,
          category: productDetail.category,
          isFavorite: productDetail.isFavorite,
          discount: productDetail.discount,
          originalPrice: productDetail.originalPrice
            ? Number(productDetail.originalPrice)
            : undefined,
        };

        openProductModal(modalData);
      } catch {
        return;
      }
    },
    [openProductModal]
  );

  return (
    <div className="grow bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-8 overflow-x-hidden max-w-full sm:max-w-none md:max-w-(--breakpoint-md) lg:max-w-(--breakpoint-lg) xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl)">
        {/* 面包屑导航 */}
        <Breadcrumbs className="mb-4 text-sm">
          <BreadcrumbItem href={`/${locale}`}>{t('breadcrumb.home')}</BreadcrumbItem>
          <BreadcrumbItem href={`/${locale}/brands`}>{t('breadcrumb.brands')}</BreadcrumbItem>
          <BreadcrumbItem>{brand.name}</BreadcrumbItem>
        </Breadcrumbs>

        {/* 品牌信息头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full flex items-center justify-center">
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={48}
                  height={48}
                  className="object-contain w-full h-full rounded-full"
                />
              ) : (
                <span className="text-lg font-bold">{brand.name.charAt(0)}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{brand.name}</h1>
          </div>
          {brand.description && (
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {brand.description}
            </p>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark hover:underline mt-2"
            >
              {t('visitWebsite')} <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* 筛选器组件 */}
        <Filters
          clearAllFilters={clearAllFilters}
          onSaleOnly={onSaleOnly}
          selectedCategory={selectedCategory}
          selectedColors={selectedColors}
          selectedPriceRanges={selectedPriceRanges}
          selectedSizes={selectedSizes}
          setOnSaleOnly={setOnSaleOnly}
          setSelectedCategory={setSelectedCategory}
          setSelectedColors={setSelectedColors}
          setSelectedPriceRanges={setSelectedPriceRanges}
          setSelectedSizes={setSelectedSizes}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          totalProducts={pagination.totalItems}
        />

        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner label={t('loading')} color="primary" labelColor="primary" />
          </div>
        ) : (
          <>
            {/* 产品列表 */}
            {products && products.length > 0 ? (
              <div className="mt-6 mb-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                {products.map((product: ProductBasic) => {
                  const discountPercent = calculateDiscount(product);
                  const isFavorite = favorites.has(product.id);

                  return (
                    <Card
                      key={product.id}
                      className="group overflow-hidden hover:shadow-md transition-shadow duration-300"
                      isPressable
                      onPress={() => handleProductClick(product.id)}
                    >
                      <CardBody className="p-0">
                        <div className="relative overflow-hidden">
                          <div className="relative w-full aspect-square overflow-hidden">
                            <Image
                              src={product.images?.[0] || '/images/products/placeholder.jpg'}
                              alt={product.name}
                              width={500}
                              height={500}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              priority={false}
                            />
                          </div>
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-30">
                            {product.isNew && (
                              <Chip
                                variant="flat"
                                size="sm"
                                radius="sm"
                                classNames={{
                                  base: 'bg-white/100 dark:bg-black border-none backdrop-blur-xs dark:bg-opacity-70',
                                  content:
                                    'text-text-primary-light dark:text-text-primary-dark font-medium tracking-wider uppercase text-xs',
                                }}
                              >
                                {t('new')}
                              </Chip>
                            )}
                            {discountPercent > 0 && (
                              <Chip
                                variant="flat"
                                size="sm"
                                radius="sm"
                                classNames={{
                                  base: 'bg-red-500 border-none backdrop-blur-xs bg-opacity-90',
                                  content:
                                    'text-white font-medium tracking-wider uppercase text-xs',
                                }}
                              >
                                -{discountPercent}%
                              </Chip>
                            )}
                          </div>
                          <Button
                            className="absolute top-2 right-2 p-2 rounded-full bg-opacity-50 dark:bg-opacity-50 bg-white dark:bg-black hover:bg-opacity-70 dark:hover:bg-opacity-70 transition-colors z-30"
                            onPress={(e) =>
                              toggleFavorite(product.id, e as unknown as React.MouseEvent)
                            }
                            aria-label={isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
                            variant="flat"
                            isIconOnly
                            as="div"
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                isFavorite
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-text-primary-light dark:text-text-primary-dark'
                              }`}
                            />
                          </Button>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium uppercase">
                            {product.brandName || brand.name}
                          </div>
                          <div className="text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2 h-12 text-left w-full">
                            {product.name}
                          </div>
                          <div className="flex items-baseline mt-2">
                            <span className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                              ¥{Number(product.price).toLocaleString()}
                            </span>
                            {product.originalPrice &&
                              Number(product.originalPrice) > Number(product.price) && (
                                <>
                                  <span className="ml-2 text-text-tertiary-light dark:text-text-tertiary-dark line-through text-sm">
                                    ¥{Number(product.originalPrice).toLocaleString()}
                                  </span>
                                  {product.discount != null && (
                                    <span className="ml-2 text-red-500 text-sm">
                                      -{product.discount}%
                                    </span>
                                  )}
                                </>
                              )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                  {t('noProducts')}
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  {t('tryOtherFilters')}
                </p>
                <Button color="primary" onPress={clearAllFilters}>
                  {t('clearFilters')}
                </Button>
              </div>
            )}

            {/* 分页控件 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/brands/${brand.slug}?page=${i + 1}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                        currentPage === i + 1
                          ? 'bg-text-primary-light dark:bg-text-primary-dark text-bg-secondary-light dark:text-bg-secondary-dark'
                          : 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                      }`}
                    >
                      {i + 1}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 返回顶部按钮 */}
        {showTopButton && (
          <Button
            className="fixed bottom-6 right-6 p-3 rounded-full bg-bg-primary-light dark:bg-bg-primary-dark shadow-md hover:shadow-lg transition-shadow z-50"
            onPress={scrollToTop}
            aria-label={t('backToTop')}
            isIconOnly
            variant="flat"
          >
            <ChevronUp className="h-6 w-6 text-text-primary-light dark:text-text-primary-dark" />
          </Button>
        )}
      </div>
    </div>
  );
}
