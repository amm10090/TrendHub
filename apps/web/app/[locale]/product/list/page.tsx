'use client';

import {
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Image,
  Avatar,
  Card,
  CardBody,
  Chip,
  Spinner,
} from '@heroui/react';
import { ChevronUp, Heart } from 'lucide-react';
import { type NextPage } from 'next';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as qs from 'qs';
import { useState, useEffect, useCallback } from 'react';

import { useProductModal } from '@/contexts/product-modal-context';
import { type ProductDetail as AppProductDetailType, type Product } from '@/types/product';

import { Filters } from './components/Filters';

interface ProductListQueryParams {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  sale: boolean;
  brand?: string;
  category?: string;
}

// 临时的接口，代表 useProductModal 可能期望的类型结构 (brand 是字符串)
// TODO: 更新 useProductModal 和 ProductModal 组件以使用标准的 AppProductDetailType
interface ModalExpectedProductDetail {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  availableQuantity: number;
  isFavorite?: boolean;
  discount?: number;
  originalPrice?: number;
}

const ProductListPage: NextPage = () => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');
  const tBrands = useTranslations('brands');
  const searchParams = useSearchParams();
  const [showTopButton, setShowTopButton] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });

  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const { openProductModal } = useProductModal();

  useEffect(() => {
    if (!searchParams) return;
    const brandParam = searchParams.get('brand');

    if (brandParam) setSelectedBrand(brandParam.toLowerCase());
    const categoryParam = searchParams.get('category');
    const genderParam = searchParams.get('gender');

    if (categoryParam) {
      setSelectedCategory([genderParam || 'women', `${genderParam || 'women'}-${categoryParam}`]);
    } else if (genderParam) {
      setSelectedCategory([genderParam]);
    }
    setOnSaleOnly(searchParams.get('sale') === 'true');
    setSortOrder(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Partial<ProductListQueryParams> = {
        page: pagination.page,
        limit: 20,
        sort: sortOrder.split('-')[0],
        order: sortOrder.endsWith('LowToHigh') ? 'asc' : 'desc',
        sale: onSaleOnly,
      };

      if (selectedBrand) queryParams.brand = selectedBrand;
      if (selectedCategory.length > 0) {
        const lastCategory = selectedCategory[selectedCategory.length - 1];

        queryParams.category = lastCategory;
      }

      const queryString = qs.stringify(queryParams, { skipNulls: true });
      const response = await fetch(`/api/public/products?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();

      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, sortOrder, onSaleOnly, selectedBrand, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearAllFilters = () => {
    setSelectedBrand('');
    setSelectedCategory([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setOnSaleOnly(false);
  };

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

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // 打开产品模态框 - 转换数据以匹配 ModalExpectedProductDetail
  const handleProductClick = useCallback(
    async (productId: string) => {
      try {
        const response = await fetch(`/api/public/products/${productId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const productDetail: AppProductDetailType = await response.json();

        // 转换为期望的类型，并提供回退值
        const modalData: ModalExpectedProductDetail = {
          id: productDetail.id,
          name: productDetail.name,
          brand: productDetail.brand.name,
          price: Number(productDetail.price),
          image: productDetail.image || '/images/products/placeholder.jpg',
          description: productDetail.description || '',
          availableQuantity: productDetail.availableQuantity,
          isFavorite: productDetail.isFavorite,
          discount: productDetail.discount,
          originalPrice: productDetail.originalPrice
            ? Number(productDetail.originalPrice)
            : undefined,
        };

        openProductModal(modalData);
      } catch {
        return null;
      }
    },
    [openProductModal]
  );

  const activeBrand = selectedBrand && {
    name: selectedBrand.toUpperCase(),
    logo: `/images/brands/${selectedBrand}-logo.png`,
    description: tBrands(`descriptions.${selectedBrand}`),
  };

  return (
    <div className="grow bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-8 overflow-x-hidden max-w-full sm:max-w-none md:max-w-(--breakpoint-md) lg:max-w-(--breakpoint-lg) xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl)">
        <Breadcrumbs className="mb-4 text-sm">
          <BreadcrumbItem href="/">{t('breadcrumb.home')}</BreadcrumbItem>
          {selectedCategory.length > 0 && (
            <BreadcrumbItem href={`/category/${selectedCategory[0]}`}>
              {tNav(selectedCategory[0])}
            </BreadcrumbItem>
          )}
          {selectedBrand && (
            <BreadcrumbItem href={`/brands/${selectedBrand}`}>
              {selectedBrand.toUpperCase()}
            </BreadcrumbItem>
          )}
        </Breadcrumbs>

        {activeBrand && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Avatar src={activeBrand.logo} alt={activeBrand.name} className="h-12 w-12" />
              <h1 className="text-2xl font-semibold">{activeBrand.name}</h1>
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {activeBrand.description}
            </p>
          </div>
        )}

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

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner label={t('loading')} color="primary" labelColor="primary" />
          </div>
        ) : (
          <>
            <div className="mt-6 mb-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
              {products.map((product) => (
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
                          src={product.image || '/images/products/placeholder.jpg'}
                          alt={product.name}
                          width={500}
                          height={500}
                          classNames={{
                            wrapper: 'w-full! h-full!',
                            img: 'w-full! h-full! object-cover group-hover:scale-105 transition-transform duration-500',
                          }}
                          removeWrapper={false}
                          disableSkeleton={false}
                          radius="none"
                        />
                      </div>
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-30">
                        {product.isNew && (
                          <Chip
                            variant="flat"
                            size="sm"
                            radius="sm"
                            classNames={{
                              base: 'bg-white/100 dark:bg-black border-none backdrop-blur-xs  dark:bg-opacity-70',
                              content:
                                'text-text-primary-light dark:text-text-primary-dark font-medium tracking-wider uppercase text-xs',
                            }}
                          >
                            {t('new')}
                          </Chip>
                        )}
                        {product.discount && (
                          <Chip
                            variant="flat"
                            size="sm"
                            radius="sm"
                            classNames={{
                              base: 'bg-red-500 border-none backdrop-blur-xs bg-opacity-90',
                              content: 'text-white font-medium tracking-wider uppercase text-xs',
                            }}
                          >
                            {t('tags.sale')}
                          </Chip>
                        )}
                      </div>
                      <Button
                        className="absolute top-2 right-2 p-2 rounded-full bg-opacity-50 dark:bg-opacity-50 bg-white dark:bg-black hover:bg-opacity-70 dark:hover:bg-opacity-70 transition-colors z-30"
                        onPress={() => toggleFavorite(product.id)}
                        aria-label={
                          favorites.includes(product.id)
                            ? t('remove_from_favorites')
                            : t('add_to_favorites')
                        }
                        variant="flat"
                        isIconOnly
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            favorites.includes(product.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-text-primary-light dark:text-text-primary-dark'
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="p-4">
                      <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium uppercase">
                        {product.brandName || 'Unknown Brand'}
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
              ))}
            </div>

            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                  {t('no_results')}
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  {t('try_other_filters')}
                </p>
                <Button color="primary" onPress={clearAllFilters}>
                  {t('filters.clearAll')}
                </Button>
              </div>
            )}
          </>
        )}

        {showTopButton && (
          <Button
            className="fixed bottom-6 right-6 p-3 rounded-full bg-bg-primary-light dark:bg-bg-primary-dark shadow-md hover:shadow-lg transition-shadow z-50"
            onPress={scrollToTop}
            aria-label={t('back_to_top')}
            isIconOnly
            variant="flat"
          >
            <ChevronUp className="h-6 w-6 text-text-primary-light dark:text-text-primary-dark" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
