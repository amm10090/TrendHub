'use client';

import { Breadcrumbs, BreadcrumbItem, Button, Image, Avatar, Card, CardBody } from '@heroui/react';
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
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopButton(true);
      } else {
        setShowTopButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const navigateToProduct = (productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    const detail = mockProductDetails[productId];

    if (product && detail) {
      // 创建符合ProductDetail接口的对象
      const productDetail: ModalProductDetail = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        description: detail.description,
        availableQuantity: detail.availableQuantity,
        isNew: product.isNew,
        isFavorite: favorites.includes(product.id),
        discount: product.discount,
        details: detail.details,
        images: detail.images,
        sizes: detail.sizes,
        colors: detail.colors,
        material: detail.material,
        careInstructions: detail.careInstructions,
        sku: detail.sku,
        // 将Product[]转换为ProductDetail[]
        relatedProducts: detail.relatedProducts
          .map((p) => {
            const relatedDetail = mockProductDetails[p.id];

            if (!relatedDetail) return null;

            return {
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              originalPrice: p.originalPrice,
              image: p.image,
              description: relatedDetail.description,
              availableQuantity: relatedDetail.availableQuantity,
              details: relatedDetail.details,
              images: relatedDetail.images,
              sizes: relatedDetail.sizes,
              colors: relatedDetail.colors,
              material: relatedDetail.material,
              careInstructions: relatedDetail.careInstructions,
              sku: relatedDetail.sku,
              relatedProducts: [],
            };
          })
          .filter(Boolean) as ModalProductDetail[],
      };

      openProductModal(productDetail);
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

    // 价格筛选
    if (selectedPriceRanges.length > 0) {
      let matches = false;

      for (const range of selectedPriceRanges) {
        switch (range) {
          case 'under1000':
            if (product.price < 1000) matches = true;
            break;
          case '1000to5000':
            if (product.price >= 1000 && product.price <= 5000) matches = true;
            break;
          case '5000to10000':
            if (product.price >= 5000 && product.price <= 10000) matches = true;
            break;
          case '10000to20000':
            if (product.price >= 10000 && product.price <= 20000) matches = true;
            break;
          case 'over20000':
            if (product.price > 20000) matches = true;
            break;
        }
      }

      if (!matches) return false;
    }

    // 特价筛选
    if (onSaleOnly && !product.discount) {
      return false;
    }

    return true;
  });

  // 排序产品
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'newest') {
      // 使用ID作为排序依据，假设ID越大的越新
      return parseInt(b.id) - parseInt(a.id);
    } else if (sortOrder === 'priceHighToLow') {
      return b.price - a.price;
    } else if (sortOrder === 'priceLowToHigh') {
      return a.price - b.price;
    }

    return 0;
  });

  // 如果有品牌名称在URL参数中，则展示品牌信息
  const brandName = 'gucci'; // 模拟从URL获取品牌参数
  const activeBrand = brandName && {
    name: 'GUCCI',
    logo: '/images/brands/gucci-logo.png',
    description: tBrands(`descriptions.${brandName}`),
  };

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      {/* 面包屑导航 */}
      <Breadcrumbs className="mb-4 text-sm">
        <BreadcrumbItem href="/">{t('breadcrumb.home')}</BreadcrumbItem>
        {selectedCategory.length > 0 && (
          <BreadcrumbItem href={`/category/${selectedCategory[0]}`}>
            {tNav(selectedCategory[0])}
          </BreadcrumbItem>
        )}
        {brandName && (
          <BreadcrumbItem href={`/brands/${brandName}`}>{brandName.toUpperCase()}</BreadcrumbItem>
        )}
      </Breadcrumbs>

      {/* 品牌信息（如果有） */}
      {activeBrand && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Avatar src={activeBrand.logo} alt={activeBrand.name} className="h-12 w-12" />
            <h1 className="text-2xl font-semibold">{activeBrand.name}</h1>
          </div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {activeBrand.description}
          </p>
          <p className="mt-2 text-text-primary-light dark:text-text-primary-dark">
            {filteredProducts.length} {t('product_count', { count: filteredProducts.length })}
          </p>
        </div>
      )}

      {/* 筛选器 */}
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
        totalProducts={filteredProducts.length}
      />

      {/* 产品网格 */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-hidden">
        {sortedProducts.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <CardBody className="p-0">
              <div className="relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform duration-500"
                  onClick={() => navigateToProduct(product.id)}
                />
                {/* 新品和特价标签 */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-30">
                  {product.isNew && (
                    <span className="bg-bg-primary-dark dark:bg-bg-tertiary-dark text-text-primary-dark px-2 py-1 text-xs uppercase">
                      {t('new')}
                    </span>
                  )}
                  {product.discount && (
                    <span className="bg-red-500 text-white px-2 py-1 text-xs uppercase z-30">
                      {t('tags.sale')}
                    </span>
                  )}
                </div>
                {/* 收藏按钮 */}
                <Button
                  className="absolute top-2 right-2 p-2 rounded-full bg-opacity-50 dark:bg-opacity-50 bg-white dark:bg-black hover:bg-opacity-70 hover:dark:bg-opacity-70 transition-colors z-30"
                  onPress={() => {
                    toggleFavorite(product.id);
                  }}
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
                {/* 查看详情按钮 */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-bg-primary-light dark:bg-bg-primary-dark bg-opacity-70 dark:bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 flex justify-between">
                  <Button
                    className="text-center text-text-primary-light dark:text-text-primary-dark text-sm hover:underline"
                    onPress={() => navigateToProduct(product.id)}
                    variant="light"
                  >
                    {t('view_details')}
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1 font-semibold uppercase">
                  {product.brand}
                </div>
                <Button
                  className="text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2 h-12 cursor-pointer text-left w-full border-none bg-transparent p-0"
                  onPress={() => navigateToProduct(product.id)}
                  variant="light"
                >
                  {product.name}
                </Button>
                <div className="flex items-baseline mt-2">
                  <span className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                    ¥{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="ml-2 text-text-tertiary-light dark:text-text-tertiary-dark line-through text-sm">
                        ¥{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="ml-2 text-red-500 text-sm">
                        -
                        {Math.round(
                          ((product.originalPrice - product.price) / product.originalPrice) * 100
                        )}
                        %
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
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

      {/* 回到顶部按钮 */}
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
  );
};

export default ProductListPage;
