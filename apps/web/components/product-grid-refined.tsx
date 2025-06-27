'use client';

import { Button, Card, CardBody, Chip, Image } from '@heroui/react';
import { Heart, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import * as React from 'react';

import type {
  Product as ProductTypeFromAppTypes,
  ProductDetail as ProductModalDetailType,
} from '@/types/product';

// Extended product type with retailer info
interface ProductWithRetailer extends ProductTypeFromAppTypes {
  retailer?: StoreFilter;
}

import { useProductModal } from '../contexts/product-modal-context';

// Store/Retailer types
type StoreFilter =
  | 'all'
  | 'italist'
  | 'mytheresa'
  | 'farfetch'
  | 'yoox'
  | 'ssense'
  | 'netaporter'
  | 'luisaviaroma'
  | 'brownsfashion'
  | 'matchesfashion'
  | 'mrporter'
  | 'theoutnet'
  | string;

interface Store {
  id: StoreFilter;
  name: string;
  active: boolean;
}

// Content block data structure
interface ProductGridBlockData {
  title?: string;
  subtitle?: string;
  seeAllText?: string;
  seeAllLink?: string;
  productLimit?: number;
  productGender?: 'women' | 'men';
  productTag?: string;
  productCategory?: string;
  productBrand?: string;
  showNewArrivalChip?: boolean;
  showPriceDiscount?: boolean;
}

interface ProductGridContentBlock {
  id: string;
  identifier: string;
  type: 'PRODUCT_GRID_CONFIGURABLE';
  name: string;
  data: ProductGridBlockData;
  items: {
    id: string;
    itemIdentifier?: string | null;
    type: string;
    name: string;
    data: unknown;
    order: number;
  }[];
}

interface ProductGridRefinedProps {
  gender?: 'women' | 'men';
}

export const ProductGridRefined: React.FC<ProductGridRefinedProps> = ({ gender }) => {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const { openProductModal } = useProductModal();
  const [productsToDisplay, setProductsToDisplay] = useState<ProductWithRetailer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithRetailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentBlock, setContentBlock] = useState<ProductGridContentBlock | null>(null);
  const [activeStore, setActiveStore] = useState<StoreFilter>('all');
  const [displayLimit, setDisplayLimit] = useState(8); // Start with 8 products
  const [loadMoreCount, setLoadMoreCount] = useState(0); // Track load more clicks
  const params = useParams();
  const locale = (params?.locale as string) || 'zh';

  const [stores, setStores] = useState<Store[]>([{ id: 'all', name: 'All Stores', active: true }]);

  useEffect(() => {
    setMounted(true);

    const fetchContentBlock = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. 先请求内容块配置
        let contentBlockApiUrl =
          '/api/public/content-blocks?type=PRODUCT_GRID_CONFIGURABLE&single=true';

        if (gender) {
          contentBlockApiUrl = `/api/public/content-blocks?categorySlug=${gender}&type=PRODUCT_GRID_CONFIGURABLE&single=true`;
        } else {
          // 默认使用women分类
          contentBlockApiUrl = `/api/public/content-blocks?categorySlug=women&type=PRODUCT_GRID_CONFIGURABLE&single=true`;
        }

        const contentBlockResponse = await fetch(contentBlockApiUrl);

        let blockData: ProductGridContentBlock | null = null;

        if (contentBlockResponse.ok) {
          blockData = await contentBlockResponse.json();
          setContentBlock(blockData);
        } else if (contentBlockResponse.status !== 404) {
          // 如果不是404错误，则记录错误
        }

        // 2. 根据内容块配置构建产品API请求
        let productApiUrl = '/api/public/products';
        const params = new URLSearchParams();

        if (blockData?.data) {
          // 使用内容块配置
          if (blockData.data.productLimit) {
            params.append('limit', blockData.data.productLimit.toString());
          } else {
            params.append('limit', '24'); // 增加默认值以支持加载更多
          }

          if (blockData.data.productGender || gender) {
            params.append('gender', blockData.data.productGender || gender || 'women');
          } else {
            params.append('gender', 'women'); // 默认值
          }

          if (blockData.data.productTag) {
            params.append('tag', blockData.data.productTag);
          }

          if (blockData.data.productCategory) {
            params.append('category', blockData.data.productCategory);
          }

          if (blockData.data.productBrand) {
            params.append('brand', blockData.data.productBrand);
          }
        } else {
          // 回退到默认配置
          params.append('limit', '24');
          if (gender) {
            params.append('gender', gender);
          } else {
            params.append('gender', 'women');
          }
        }

        productApiUrl += '?' + params.toString();

        // 3. 请求产品数据
        const productResponse = await fetch(productApiUrl);

        if (!productResponse.ok) {
          throw new Error(`API request failed: ${productResponse.status}`);
        }

        const result = await productResponse.json();
        const realProducts = result.data || [];

        // 从真实产品数据中提取商店信息
        const uniqueSources = new Set<string>();

        realProducts.forEach((product) => {
          if (product.source) {
            uniqueSources.add(product.source);
          }
        });

        // 创建商店名称映射
        const sourceNameMap: { [key: string]: string } = {
          italist: 'Italist',
          mytheresa: 'Mytheresa',
          farfetch: 'Farfetch',
          yoox: 'YOOX',
          ssense: 'SSENSE',
          netaporter: 'Net-A-Porter',
          luisaviaroma: 'Luisaviaroma',
          brownsfashion: 'Browns Fashion',
          matchesfashion: 'Matches Fashion',
          mrporter: 'Mr Porter',
          theoutnet: 'The Outnet',
        };

        // 构建商店列表
        const realStores: Store[] = [{ id: 'all', name: 'All Stores', active: true }];

        Array.from(uniqueSources)
          .sort()
          .forEach((source) => {
            realStores.push({
              id: source as StoreFilter,
              name: sourceNameMap[source] || source.charAt(0).toUpperCase() + source.slice(1),
              active: false,
            });
          });

        setStores(realStores);

        // 转换产品数据，添加retailer字段
        const productsWithRetailer: ProductWithRetailer[] = realProducts.map((product) => ({
          ...product,
          retailer: product.source || ('unknown' as StoreFilter),
        }));

        setProductsToDisplay(productsWithRetailer);
      } catch (err: unknown) {
        console.error('Failed to fetch real products, falling back to mock data:', err);
        // 如果 API 失败，使用 mock 数据
        const mockProducts: ProductWithRetailer[] = [
          {
            id: '1',
            name: 'Designer Wool Coat',
            price: 2899,
            originalPrice: 3899,
            discount: 26,
            currency: 'CNY',
            images: ['/images/products/coat1.jpg'],
            brandName: 'MaxMara',
            brandSlug: 'maxmara',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'mytheresa',
            description: 'Luxurious wool blend coat with elegant silhouette',
          },
          {
            id: '2',
            name: 'Leather Ankle Boots',
            price: 1299,
            originalPrice: 1699,
            discount: 24,
            currency: 'CNY',
            images: ['/images/products/boots1.jpg'],
            brandName: 'Gianvito Rossi',
            brandSlug: 'gianvito-rossi',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'farfetch',
            description: 'Sleek leather ankle boots with block heel',
          },
          {
            id: '3',
            name: 'Cashmere Sweater',
            price: 899,
            originalPrice: 1299,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/sweater1.jpg'],
            brandName: 'Brunello Cucinelli',
            brandSlug: 'brunello-cucinelli',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'italist',
            description: 'Pure cashmere crewneck sweater',
          },
          {
            id: '4',
            name: 'Silk Midi Dress',
            price: 1599,
            originalPrice: 2199,
            discount: 27,
            currency: 'CNY',
            images: ['/images/products/dress1.jpg'],
            brandName: 'Zimmermann',
            brandSlug: 'zimmermann',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'yoox',
            description: 'Floral silk midi dress with elegant draping',
          },
          {
            id: '5',
            name: 'Quilted Handbag',
            price: 3299,
            originalPrice: 4299,
            discount: 23,
            currency: 'CNY',
            images: ['/images/products/bag1.jpg'],
            brandName: 'Chanel',
            brandSlug: 'chanel',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'ssense',
            description: 'Classic quilted leather handbag',
          },
          {
            id: '6',
            name: 'Diamond Earrings',
            price: 5999,
            originalPrice: 7999,
            discount: 25,
            currency: 'CNY',
            images: ['/images/products/earrings1.jpg'],
            brandName: 'Tiffany & Co.',
            brandSlug: 'tiffany-co',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'netaporter',
            description: 'Elegant diamond stud earrings',
          },
          {
            id: '7',
            name: 'Embellished Blazer',
            price: 2199,
            originalPrice: 3199,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/blazer1.jpg'],
            brandName: 'Saint Laurent',
            brandSlug: 'saint-laurent',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'mytheresa',
            description: 'Embellished wool blazer',
          },
          {
            id: '8',
            name: 'Printed Midi Skirt',
            price: 799,
            originalPrice: 1199,
            discount: 33,
            currency: 'CNY',
            images: ['/images/products/skirt1.jpg'],
            brandName: 'Prada',
            brandSlug: 'prada',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'farfetch',
            description: 'Floral printed midi skirt',
          },
          {
            id: '9',
            name: 'Luxury Sunglasses',
            price: 899,
            originalPrice: 1299,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/sunglasses1.jpg'],
            brandName: 'Tom Ford',
            brandSlug: 'tom-ford',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'ssense',
            description: 'Designer sunglasses with UV protection',
          },
          {
            id: '10',
            name: 'Silk Blouse',
            price: 1299,
            originalPrice: 1899,
            discount: 32,
            currency: 'CNY',
            images: ['/images/products/blouse1.jpg'],
            brandName: 'Equipment',
            brandSlug: 'equipment',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'yoox',
            description: 'Pure silk button-down blouse',
          },
          {
            id: '11',
            name: 'Leather Crossbody Bag',
            price: 1899,
            originalPrice: 2599,
            discount: 27,
            currency: 'CNY',
            images: ['/images/products/crossbody1.jpg'],
            brandName: 'Celine',
            brandSlug: 'celine',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'italist',
            description: 'Compact leather crossbody bag',
          },
          {
            id: '12',
            name: 'Knit Cardigan',
            price: 699,
            originalPrice: 999,
            discount: 30,
            currency: 'CNY',
            images: ['/images/products/cardigan1.jpg'],
            brandName: 'Acne Studios',
            brandSlug: 'acne-studios',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'netaporter',
            description: 'Oversized knit cardigan',
          },
          {
            id: '13',
            name: 'Wide-Leg Trousers',
            price: 899,
            originalPrice: 1299,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/trousers1.jpg'],
            brandName: 'The Row',
            brandSlug: 'the-row',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'mytheresa',
            description: 'High-waisted wide-leg trousers',
          },
          {
            id: '14',
            name: 'Platform Sandals',
            price: 1199,
            originalPrice: 1699,
            discount: 29,
            currency: 'CNY',
            images: ['/images/products/sandals1.jpg'],
            brandName: 'Bottega Veneta',
            brandSlug: 'bottega-veneta',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'farfetch',
            description: 'Leather platform sandals',
          },
          {
            id: '15',
            name: 'Statement Necklace',
            price: 799,
            originalPrice: 1199,
            discount: 33,
            currency: 'CNY',
            images: ['/images/products/necklace1.jpg'],
            brandName: 'Jennifer Fisher',
            brandSlug: 'jennifer-fisher',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'ssense',
            description: 'Gold-plated statement necklace',
          },
          {
            id: '16',
            name: 'Wrap Dress',
            price: 1599,
            originalPrice: 2299,
            discount: 30,
            currency: 'CNY',
            images: ['/images/products/wrapdress1.jpg'],
            brandName: 'Diane von Furstenberg',
            brandSlug: 'dvf',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'yoox',
            description: 'Classic wrap dress in silk jersey',
          },
          {
            id: '17',
            name: 'Cropped Jacket',
            price: 1899,
            originalPrice: 2699,
            discount: 30,
            currency: 'CNY',
            images: ['/images/products/jacket1.jpg'],
            brandName: 'Balenciaga',
            brandSlug: 'balenciaga',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'italist',
            description: 'Structured cropped jacket',
          },
          {
            id: '18',
            name: 'High-Top Sneakers',
            price: 1299,
            originalPrice: 1799,
            discount: 28,
            currency: 'CNY',
            images: ['/images/products/sneakers1.jpg'],
            brandName: 'Golden Goose',
            brandSlug: 'golden-goose',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'netaporter',
            description: 'Distressed high-top sneakers',
          },
          {
            id: '19',
            name: 'Mini Shoulder Bag',
            price: 2299,
            originalPrice: 3299,
            discount: 30,
            currency: 'CNY',
            images: ['/images/products/minibag1.jpg'],
            brandName: 'Jacquemus',
            brandSlug: 'jacquemus',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'mytheresa',
            description: 'Leather mini shoulder bag',
          },
          {
            id: '20',
            name: 'Pleated Maxi Dress',
            price: 1799,
            originalPrice: 2599,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/maxidress1.jpg'],
            brandName: 'Issey Miyake',
            brandSlug: 'issey-miyake',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'farfetch',
            description: 'Pleated maxi dress in technical fabric',
          },
          {
            id: '21',
            name: 'Crystal Bracelet',
            price: 999,
            originalPrice: 1399,
            discount: 29,
            currency: 'CNY',
            images: ['/images/products/bracelet1.jpg'],
            brandName: 'Swarovski',
            brandSlug: 'swarovski',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'ssense',
            description: 'Crystal tennis bracelet',
          },
          {
            id: '22',
            name: 'Leather Mules',
            price: 899,
            originalPrice: 1299,
            discount: 31,
            currency: 'CNY',
            images: ['/images/products/mules1.jpg'],
            brandName: 'Mansur Gavriel',
            brandSlug: 'mansur-gavriel',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'yoox',
            description: 'Pointed-toe leather mules',
          },
          {
            id: '23',
            name: 'Wool Coat',
            price: 3299,
            originalPrice: 4699,
            discount: 30,
            currency: 'CNY',
            images: ['/images/products/woolcoat1.jpg'],
            brandName: 'Max Mara',
            brandSlug: 'max-mara',
            isNew: false,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'italist',
            description: 'Double-breasted wool coat',
          },
          {
            id: '24',
            name: 'Silk Scarf',
            price: 599,
            originalPrice: 899,
            discount: 33,
            currency: 'CNY',
            images: ['/images/products/scarf1.jpg'],
            brandName: 'Hermès',
            brandSlug: 'hermes',
            isNew: true,
            isFavorite: false,
            status: 'AVAILABLE',
            gender: 'women',
            retailer: 'netaporter',
            description: 'Printed silk square scarf',
          },
        ];

        setProductsToDisplay(mockProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentBlock();
  }, [t, gender]);

  // Filter products by store
  const filterByStore = useCallback(() => {
    if (activeStore === 'all') {
      setFilteredProducts(productsToDisplay);
    } else {
      const filtered = productsToDisplay.filter(
        (product) => product.retailer === activeStore || product.source === activeStore
      );

      setFilteredProducts(filtered);
    }
  }, [productsToDisplay, activeStore]);

  useEffect(() => {
    filterByStore();
  }, [filterByStore]);

  const handleStoreChange = (storeId: StoreFilter) => {
    setActiveStore(storeId);
    setDisplayLimit(8); // Reset display limit when changing store
    setLoadMoreCount(0); // Reset load more count
  };

  const handleLoadMore = () => {
    if (loadMoreCount < 2) {
      setDisplayLimit(displayLimit + 8);
      setLoadMoreCount(loadMoreCount + 1);
    }
  };

  // Get products to display based on current limit
  const displayedProducts = filteredProducts.slice(0, displayLimit);

  const handleProductClick = (product: ProductWithRetailer) => {
    if (!mounted) return;

    // 1. 在新标签页打开中转页面
    window.open(`/${locale}/track-redirect/product/${product.id}`, '_blank');

    // 2. 在当前页面打开模态框
    const productDetailForModal: ProductModalDetailType = {
      id: product.id,
      name: product.name,
      images: product.images || [],
      description: product.description || t('productGrid.defaultDescription'),
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      isNew: product.isNew,
      isFavorite: product.isFavorite,
      currency: product.currency,
      gender: product.gender,
      categories: product.categories,
      sku: product.sku || t('productGrid.defaultSku'),
      status: product.status,
      videos: product.videos || [],
      brandName: product.brandName,
      brandSlug: product.brandSlug,
      brandId: product.brandId,
      brandLogo: product.brandLogo,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      categoryId: product.categoryId,
      inventory: product.inventory,
      availableQuantity: product.inventory || 10,
      careInstructions: product.careInstructions || [t('productGrid.defaultCareInstructions')],
      relatedProducts: product.relatedProducts || [],
      material: product.material,
      details: product.details,
      sizes: product.sizes,
      colors: product.colors,
      specifications: product.specifications,
      adUrl: product.adUrl,
      brand: {
        id: product.brandId || 'unknown-brand',
        name: product.brandName || t('productGrid.unknownBrand'),
        slug: product.brandSlug || 'unknown-brand',
        logo: product.brandLogo,
      },
      category: {
        id: product.categoryId || 'unknown-category',
        name: product.categoryName || t('productGrid.unknownCategory'),
        slug: product.categorySlug || 'unknown-category',
      },
    };

    openProductModal(productDetailForModal);
  };

  // 从内容块获取显示配置，如果没有则使用默认值
  const displayTitle = contentBlock?.data?.title || 'Sale Items from Top Retailers';

  const displaySeeAllText = contentBlock?.data?.seeAllText || 'View all products →';

  const displaySeeAllLink =
    contentBlock?.data?.seeAllLink ||
    (gender ? `/product/list?gender=${gender}` : '/product/list?tag=sale');

  if (!mounted || (isLoading && !productsToDisplay.length)) {
    return (
      <section className="w-full bg-white dark:bg-bg-primary-dark" id="products">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-white dark:bg-bg-primary-dark">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-red-500">
            {t('productGrid.errors.loadFailed')}: {error}
          </p>
        </div>
      </section>
    );
  }

  if (productsToDisplay.length === 0 && !isLoading) {
    return (
      <section className="w-full bg-white dark:bg-bg-primary-dark">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('productGrid.noProducts')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white dark:bg-bg-primary-dark" id="products">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayTitle}</h2>
          <Link
            href={displaySeeAllLink}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium transition-colors duration-200"
          >
            {displaySeeAllText}
          </Link>
        </div>

        {/* Store Tabs */}
        <div className="flex gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
          {stores.map((store) => (
            <Button
              key={store.id}
              size="sm"
              variant={activeStore === store.id ? 'solid' : 'light'}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeStore === store.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              onPress={() => handleStoreChange(store.id)}
            >
              {store.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer group"
              onClick={() => handleProductClick(product)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProductClick(product);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Card className="border-none shadow-none">
                <CardBody className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-50 dark:bg-gray-700 overflow-hidden">
                    {/* New Badge */}
                    {product.isNew && (
                      <Chip
                        size="sm"
                        className="absolute top-3 left-3 z-10 bg-gray-900 text-white text-xs font-semibold px-2 py-1"
                      >
                        NEW
                      </Chip>
                    )}

                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        -{product.discount}%
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      className="absolute bottom-3 right-3 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      onPress={(e) => {
                        e.stopPropagation();
                        // Handle wishlist logic
                      }}
                    >
                      <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Button>

                    <Image
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : '/images/placeholder.jpg'
                      }
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Brand */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {product.brandName || t('productGrid.unknownBrand')}
                    </p>

                    {/* Product Name */}
                    <h3 className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2 line-clamp-2 leading-tight h-10 overflow-hidden">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        ¥{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          ¥{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Retailer */}
                    {product.retailer && (
                      <div className="flex items-center gap-1 mt-2">
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {product.retailer}
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {/* Show message if no products in filtered store */}
        {filteredProducts.length === 0 && productsToDisplay.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No products available from {stores.find((s) => s.id === activeStore)?.name}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {displayedProducts.length < filteredProducts.length && loadMoreCount < 2 && (
          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="bordered"
              className="px-8 py-3 font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onPress={handleLoadMore}
            >
              Load More ({filteredProducts.length - displayedProducts.length} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
