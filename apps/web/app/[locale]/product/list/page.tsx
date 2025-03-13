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
} from '@heroui/react';
import { ChevronUp, Heart } from 'lucide-react';
import { type NextPage } from 'next';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { ProductDetail as ModalProductDetail } from '@/components/product-detail/product-modal';
import { useProductModal } from '@/contexts/product-modal-context';
import { mockAllProducts, mockAllProductDetails } from '@/lib/mock-data';

import { Filters } from './components/Filters';

const ProductListPage: NextPage = () => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');
  const tBrands = useTranslations('brands');
  const searchParams = useSearchParams();
  const [showTopButton, setShowTopButton] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const { openProductModal } = useProductModal();

  // 从URL参数中获取筛选条件
  useEffect(() => {
    if (!searchParams) return;

    // 读取品牌参数
    const brandParam = searchParams.get('brand');

    if (brandParam) {
      setSelectedBrand(brandParam.toLowerCase());
    }

    // 读取分类参数
    const categoryParam = searchParams.get('category');

    if (categoryParam) {
      // 如果存在性别参数，将其加入分类数组
      const genderParam = searchParams.get('gender') || 'women'; // 默认为women

      setSelectedCategory([genderParam, `${genderParam}-${categoryParam}`]);
    } else {
      // 仅有性别参数
      const genderParam = searchParams.get('gender');

      if (genderParam) {
        setSelectedCategory([genderParam]);
      }
    }

    // 读取是否仅显示打折商品
    const saleParam = searchParams.get('sale');

    if (saleParam === 'true') {
      setOnSaleOnly(true);
    }

    // 读取排序方式
    const sortParam = searchParams.get('sort');

    if (sortParam) {
      setSortOrder(sortParam);
    }
  }, [searchParams]);

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
    // 查找产品详情
    const productDetail = mockAllProductDetails.find((detail) => detail.id === productId);

    if (productDetail) {
      // 转换为模态框需要的类型
      const modalProductDetail: ModalProductDetail = {
        id: productDetail.id,
        name: productDetail.name,
        brand: productDetail.brand,
        price: productDetail.price,
        image: productDetail.image,
        description: productDetail.description,
        availableQuantity: productDetail.availableQuantity || 10, // 默认值
        originalPrice: productDetail.originalPrice,
        discount: productDetail.discount,
        isNew: productDetail.isNew,
        isFavorite: favorites.includes(productDetail.id),
        details: productDetail.details || [],
        images: productDetail.images || [productDetail.image],
        sizes: productDetail.sizes || [],
        colors: productDetail.colors || [],
        material: productDetail.material,
        careInstructions: productDetail.careInstructions || [],
        sku: productDetail.sku,
        // 关联产品留空，避免类型错误
        relatedProducts: [],
      };

      openProductModal(modalProductDetail);
    }
  };

  // 筛选产品
  const filteredProducts = mockAllProducts.filter((product) => {
    // 品牌筛选
    if (selectedBrand && product.brand.toLowerCase() !== selectedBrand) {
      return false;
    }

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
      const productDetail = mockAllProductDetails.find((detail) => detail.id === product.id);

      if (
        !productDetail ||
        !productDetail.sizes ||
        !selectedSizes.some((size) => productDetail.sizes.includes(size))
      ) {
        return false;
      }
    }

    // 颜色筛选
    if (selectedColors.length > 0) {
      const productDetail = mockAllProductDetails.find((detail) => detail.id === product.id);

      if (
        !productDetail ||
        !productDetail.colors ||
        !selectedColors.some((color) =>
          productDetail.colors.some((c) => c.name.toLowerCase() === color.toLowerCase())
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

    // 折扣商品筛选
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
    <div className="grow bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-8 overflow-x-hidden max-w-full sm:max-w-none md:max-w-(--breakpoint-md) lg:max-w-(--breakpoint-lg) xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl)">
        {/* 面包屑导航 */}
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
        <div className="mt-6 mb-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {sortedProducts.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <CardBody className="p-0">
                <div className="relative overflow-hidden">
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={product.image}
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
                      onClick={() => navigateToProduct(product.id)}
                    />
                  </div>
                  {/* 新品和特价标签 */}
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
                  {/* 收藏按钮 */}
                  <Button
                    className="absolute top-2 right-2 p-2 rounded-full bg-opacity-50 dark:bg-opacity-50 bg-white dark:bg-black hover:bg-opacity-70 dark:hover:bg-opacity-70 transition-colors z-30"
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
                </div>
                <div className="p-4">
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium uppercase">
                    {product.brand}
                  </div>
                  <Button
                    className="text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2 h-12 cursor-pointer text-left w-full border-none bg-transparent p-0 hover:text-text-secondary-light dark:hover:text-text-secondary-dark transition-colors"
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
    </div>
  );
};

export default ProductListPage;
