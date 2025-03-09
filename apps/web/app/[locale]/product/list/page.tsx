'use client';

import {
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Image,
  Spacer,
  Avatar,
  Card,
  CardBody,
} from '@heroui/react';
import { ChevronUp, Heart } from 'lucide-react';
import { type NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { ProductDetail as ModalProductDetail } from '@/components/product-detail/product-modal';
import { useProductModal } from '@/contexts/product-modal-context';
import { mockProducts, mockProductDetails } from '@/types/product';

import { Filters } from './components/Filters';

const ProductListPage: NextPage = () => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');
  const tBrands = useTranslations('brands');
  const [showTopButton, setShowTopButton] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [favorites, setFavorites] = useState<string[]>([]);
  const { openProductModal } = useProductModal();

  const clearAllFilters = () => {
    setSelectedCategory([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setOnSaleOnly(false);
    setSortOrder('newest');
  };

  // 监听滚动事件，控制返回顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopButton(true);
      } else {
        setShowTopButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 返回顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 品牌信息
  const brandInfo = {
    name: 'GUCCI',
    logo: '/images/brands/gucci-logo.png', // 确保这个路径是正确的
  };

  // 切换收藏状态
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // 打开产品详情模态框
  const navigateToProduct = (productId: string) => {
    const productDetail = mockProductDetails[productId];

    if (productDetail) {
      // 转换为模态框需要的ProductDetail类型
      const modalProductDetail: ModalProductDetail = {
        ...productDetail,
        // 确保relatedProducts是ModalProductDetail[]类型
        relatedProducts:
          productDetail.relatedProducts?.map((p) => ({
            ...p,
            description: '', // 添加必需的字段
            availableQuantity: 0,
            details: [],
            images: [p.image],
            sizes: [],
            colors: [],
            material: '',
            careInstructions: [],
            sku: '',
            relatedProducts: [],
          })) || [],
      };

      openProductModal(modalProductDetail);
    }
  };

  // 筛选产品
  const filteredProducts = mockProducts.filter((product) => {
    // 性别筛选
    if (selectedCategory.length > 0) {
      const gender = selectedCategory[0]; // 'women' 或 'men'

      if (product.gender !== gender) {
        return false;
      }

      // 主分类筛选（如 clothing, shoes, bags 等）
      if (selectedCategory.length > 1) {
        const mainCategory = selectedCategory[1].split('-')[1]; // 从 'women-clothing' 提取 'clothing'

        if (!product.categories?.includes(mainCategory)) {
          return false;
        }

        // 子分类筛选（如 coats, dresses 等）
        if (selectedCategory.length > 2) {
          const subCategory = selectedCategory[2].split('-')[2]; // 从 'women-clothing-coats' 提取 'coats'

          if (!product.categories?.includes(subCategory)) {
            return false;
          }
        }
      }
    }

    // 尺码筛选
    if (selectedSizes.length > 0) {
      const productDetail = mockProductDetails[product.id];

      if (!productDetail || !selectedSizes.some((size) => productDetail.sizes.includes(size))) {
        return false;
      }
    }

    // 颜色筛选
    if (selectedColors.length > 0) {
      const productDetail = mockProductDetails[product.id];

      if (
        !productDetail ||
        !selectedColors.some((color) =>
          productDetail.colors.some((c) => c.name.toLowerCase() === color)
        )
      ) {
        return false;
      }
    }

    // 价格范围筛选
    if (selectedPriceRanges.length > 0) {
      const matchesPrice = selectedPriceRanges.some((range) => {
        if (range === 'under1000' && product.price < 1000) return true;
        if (range === '1000to5000' && product.price >= 1000 && product.price <= 5000) return true;
        if (range === '5000to10000' && product.price >= 5000 && product.price <= 10000) return true;
        if (range === '10000to20000' && product.price >= 10000 && product.price <= 20000)
          return true;
        if (range === 'over20000' && product.price > 20000) return true;

        return false;
      });

      if (!matchesPrice) return false;
    }

    // 折扣筛选
    if (onSaleOnly && !product.discount) return false;

    return true;
  });

  // 对筛选后的产品进行排序
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        // 假设id越大表示越新
        return parseInt(b.id) - parseInt(a.id);
      case 'price_high_low':
        return b.price - a.price;
      case 'price_low_high':
        return a.price - b.price;
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col min-h-full bg-bg-primary-light dark:bg-bg-primary-dark">
      <div className="container mx-auto px-4">
        {/* 面包屑导航 */}
        <div className="py-4">
          <Breadcrumbs>
            <BreadcrumbItem href="/">{t('breadcrumb.home')}</BreadcrumbItem>
            <BreadcrumbItem href="/designers">{tNav('brands')}</BreadcrumbItem>
            <BreadcrumbItem>{brandInfo.name}</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* 品牌信息顶部容器 - LYST风格 */}
        <div className="w-full bg-white dark:bg-bg-secondary-dark rounded-lg shadow-sm mb-6">
          <div className="p-6 flex items-center">
            <div className="flex-1 flex items-center gap-6">
              <Avatar
                alt={brandInfo.name}
                className="border border-border-primary-light dark:border-border-primary-dark"
                size="lg"
                src={brandInfo.logo}
              />
              <div>
                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {brandInfo.name}
                </h1>
                <Spacer y={1} />
                <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-3xl">
                  {tBrands(`descriptions.${brandInfo.name.toLowerCase()}`)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                {t('product_count', { count: sortedProducts.length })}
              </p>
            </div>
          </div>
        </div>

        {/* 产品筛选组件 */}
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
          setSortOrder={setSortOrder}
          sortOrder={sortOrder}
          totalProducts={sortedProducts.length}
        />

        {/* 产品网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 mb-10">
          {sortedProducts.map((product) => (
            <Card
              key={product.id}
              isHoverable
              className="overflow-hidden border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md relative"
              isPressable={false}
              shadow="sm"
            >
              {/* 点击区域 - 覆盖整个卡片但排除收藏按钮 */}
              <div
                aria-label={`查看${product.name}详情`}
                className="absolute inset-0 z-[15] cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigateToProduct(product.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigateToProduct(product.id);
                  }
                }}
              />

              {/* 图片容器 - 设置固定宽高比 */}
              <div className="relative w-full aspect-square overflow-hidden">
                {/* 图片包装器 */}
                <div className="absolute inset-0 z-[5]">
                  <Image
                    isZoomed
                    removeWrapper
                    alt={product.name}
                    className="w-full h-full object-cover"
                    src={product.image}
                  />
                </div>

                {/* 产品标签 - 绝对定位在图片上，提高z-index确保在图片上方 */}
                <div className="absolute top-0 left-0 right-0 p-1.5 flex justify-between z-[20]">
                  <div className="flex gap-1">
                    {product.isNew && (
                      <div className="bg-black text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                        {t('tags.new')}
                      </div>
                    )}
                  </div>
                  <div>
                    {product.discount && (
                      <div className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                        -{product.discount}%
                      </div>
                    )}
                  </div>
                </div>

                {/* 收藏按钮 - 绝对定位在图片上，z-index高于点击区域 */}
                <div
                  aria-label={`收藏${product.name}`}
                  className="absolute bottom-1.5 right-1.5 bg-white/90 dark:bg-black/70 rounded-full z-[50] shadow-sm transition-transform duration-200 hover:scale-110 flex items-center justify-center w-7 h-7 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'}`}
                  />
                </div>
              </div>

              <CardBody className="p-2.5">
                <h3 className="text-text-primary-light dark:text-text-primary-dark font-semibold text-sm">
                  {product.brand}
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs line-clamp-1">
                  {product.name}
                </p>
                <div className="flex justify-between items-center w-full mt-1.5">
                  <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
                    ¥{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-text-tertiary-light dark:text-text-tertiary-dark line-through text-xs ml-1.5">
                      ¥{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* 返回顶部按钮 */}
      {showTopButton && (
        <Button
          aria-label="返回顶部"
          className="fixed bottom-4 right-4 rounded-full w-10 h-10 bg-bg-tertiary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark shadow-md hover:shadow-lg z-10"
          onClick={scrollToTop}
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default ProductListPage;
