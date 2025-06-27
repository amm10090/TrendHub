'use client';

import { Button, Card, Chip, Image, Select, SelectItem } from '@heroui/react';
import { Clock, List, Star, TrendingUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import * as React from 'react';

import type { ProductDetail as ProductModalDetailType } from '@/types/product';

import { useProductModal } from '../contexts/product-modal-context';

interface Deal {
  id: string;
  merchant: {
    name: string;
    logo: string | null;
    category: string;
    categoryColor: string;
  };
  title: string;
  description: string;
  code?: string;
  discount: string;
  savings: string;
  affiliateUrl: string;
  rating: number;
  expires: string;
  isExpired: boolean;
  clicks: number;
  featured: boolean;
  categorySlug: string;
  source: string; // Product source (store)
}

interface LiveDealsRefinedProps {
  gender?: 'women' | 'men';
  className?: string;
}

interface ProductApiData {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number | string;
  originalPrice?: number | string;
  discount?: number | string;
  brandName?: string;
  brandLogo?: string | undefined;
  gender?: string;
  categoryName?: string;
  categorySlug?: string;
  adUrl?: string;
  url?: string;
  isNew?: boolean;
  source?: string; // Product source (store)

  // Additional fields for ProductDetail compatibility
  images?: string[];
  currency?: string;
  categories?: string[];
  status?: string;
  videos?: string[];
  brandSlug?: string;
  brandId?: string;
  categoryId?: string;
  inventory?: number;
  careInstructions?: string[];
  material?: string;
  details?: string[];
  sizes?: string[];
  colors?: Array<{ name: string; value: string }> | string[];
  specifications?: Record<string, unknown>;

  // Coupon related fields from database
  coupon?: string; // 优惠券代码
  couponDescription?: string; // 优惠券描述
  couponExpirationDate?: string; // 优惠券过期日期
  promotionUrl?: string; // 推广链接
}

type ViewMode = 'original' | 'compact' | 'dense' | 'list';
type SortOption = 'newest' | 'popular' | 'discount' | 'expires';
type SourceFilter = string; // Dynamic store source filter

interface StoreOption {
  value: string;
  label: string;
  count: number;
}

// Mock data - replace with actual API call
const mockDeals: Deal[] = [
  {
    id: '1',
    merchant: {
      name: 'Footshop',
      logo: '/images/brands/footshop.png',
      category: 'FOOTWEAR',
      categoryColor: '#4F46E5',
    },
    title: 'Extra 15% off adidas Campus 00s',
    description: 'Get additional discount on popular sneakers',
    code: 'CAMPUS',
    discount: 'Up to $25 off',
    savings: 'Save $25+',
    affiliateUrl: 'https://example.com/footshop',
    rating: 4.5,
    expires: '08/15/23',
    isExpired: false,
    clicks: 245,
    featured: true,
    categorySlug: 'footwear',
    source: 'footshop',
  },
  {
    id: '2',
    merchant: {
      name: 'Kay Jewelers',
      logo: '/images/brands/kay.png',
      category: 'JEWELRY',
      categoryColor: '#7C3AED',
    },
    title: '40% Off Sitewide + Free Shipping on Orders $99+',
    description: 'Limited time jewelry sale',
    code: 'SAVE40',
    discount: 'Save $30+',
    savings: 'Save $30+',
    affiliateUrl: 'https://example.com/kay',
    rating: 4.2,
    expires: '06/30/25',
    isExpired: false,
    clicks: 182,
    featured: false,
    categorySlug: 'jewelry',
    source: 'kay',
  },
  {
    id: '3',
    merchant: {
      name: 'Hot Topic',
      logo: '/images/brands/hottopic.png',
      category: 'FASHION',
      categoryColor: '#EF4444',
    },
    title: 'Buy 2 Get 1 Free on All Graphic Tees',
    description: 'Mix and match graphic tees',
    code: 'HOTTOPIC',
    discount: '33% off',
    savings: 'Save $20+',
    affiliateUrl: 'https://example.com/hottopic',
    rating: 4.0,
    expires: '07/15/25',
    isExpired: false,
    clicks: 158,
    featured: false,
    categorySlug: 'fashion',
    source: 'hottopic',
  },
  {
    id: '4',
    merchant: {
      name: 'Belk',
      logo: '/images/brands/belk.png',
      category: 'FASHION',
      categoryColor: '#EF4444',
    },
    title: 'Extra 25% Off Summer Styles',
    description: 'Summer clearance event',
    code: 'SUMMER25',
    discount: 'Save $30+',
    savings: 'Save $30+',
    affiliateUrl: 'https://example.com/belk',
    rating: 4.3,
    expires: '07/31/25',
    isExpired: false,
    clicks: 201,
    featured: true,
    categorySlug: 'fashion',
    source: 'belk',
  },
  {
    id: '5',
    merchant: {
      name: 'Nike',
      logo: '/images/brands/nike.png',
      category: 'SPORTS',
      categoryColor: '#10B981',
    },
    title: '20% Off Air Max Collection',
    description: 'Classic sneakers on sale',
    code: 'AIRMAX20',
    discount: 'Save $40+',
    savings: 'Save $40+',
    affiliateUrl: 'https://example.com/nike',
    rating: 4.7,
    expires: '07/01/25',
    isExpired: false,
    clicks: 325,
    featured: false,
    categorySlug: 'sports',
    source: 'nike',
  },
  {
    id: '6',
    merchant: {
      name: 'Sephora',
      logo: '/images/brands/sephora.png',
      category: 'BEAUTY',
      categoryColor: '#F59E0B',
    },
    title: '15% Off First Purchase + Free Samples',
    description: 'New customer exclusive offer',
    code: 'WELCOME15',
    discount: 'Save $15+',
    savings: 'Save $15+',
    affiliateUrl: 'https://example.com/sephora',
    rating: 4.6,
    expires: '06/30/25',
    isExpired: false,
    clicks: 189,
    featured: false,
    categorySlug: 'beauty',
    source: 'sephora',
  },
  {
    id: '7',
    merchant: {
      name: 'Best Buy',
      logo: '/images/brands/bestbuy.png',
      category: 'ELECTRONICS',
      categoryColor: '#3B82F6',
    },
    title: 'Flash Sale: Up to 40% off Gaming Laptops',
    description: 'Limited time electronics deals',
    affiliateUrl: 'https://example.com/bestbuy',
    rating: 4.4,
    expires: '06/25/25',
    isExpired: false,
    clicks: 221,
    featured: false,
    categorySlug: 'electronics',
    discount: 'Save $200+',
    savings: 'Save $200+',
    source: 'bestbuy',
  },
  {
    id: '8',
    merchant: {
      name: 'Zara',
      logo: '/images/brands/zara.png',
      category: 'FASHION',
      categoryColor: '#EF4444',
    },
    title: 'Mid Season Sale: 30% off Selected Items',
    description: 'Fashion trends at great prices',
    code: 'MIDSEASON',
    discount: 'Save $25+',
    savings: 'Save $25+',
    affiliateUrl: 'https://example.com/zara',
    rating: 4.1,
    expires: '07/03/25',
    isExpired: false,
    clicks: 185,
    featured: false,
    categorySlug: 'fashion',
    source: 'zara',
  },
];

export const LiveDealsRefined: React.FC<LiveDealsRefinedProps> = ({ gender, className = '' }) => {
  const t = useTranslations('liveDeals');
  const { openProductModal } = useProductModal();
  const params = useParams();
  const locale = (params?.locale as string) || 'zh';

  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Map<string, ProductApiData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [availableStores, setAvailableStores] = useState<StoreOption[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadMoreCount, setLoadMoreCount] = useState(0);

  const ITEMS_PER_ROW = 4; // 每行4个
  const ROWS_PER_PAGE = 2; // 每页2行
  const ITEMS_PER_PAGE = ITEMS_PER_ROW * ROWS_PER_PAGE; // 每页8个
  const MAX_LOAD_MORE = 3; // 最多加载3次

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch products with coupons or discounts to create deals
        // Include products that have: coupons, discounts, or are on sale
        const params = new URLSearchParams({
          limit: '50',
          // Get products with any promotion
          sale: 'true',
          // The backend should include products with coupon field or discount > 0
        });

        if (gender) {
          params.append('gender', gender);
        }

        const response = await fetch(`/api/public/products?${params.toString()}`);

        if (!response.ok) {
          throw new Error(t('liveDeals.errors.fetchError'));
        }

        const result = await response.json();

        // Store original product data for modal use
        const originalProductsMap = new Map();

        (result.data || []).forEach((product: ProductApiData) => {
          originalProductsMap.set(product.id, product);
        });

        // Transform products into deals format
        const dealsFromProducts = (result.data || []).map((product: ProductApiData): Deal => {
          const categoryMap: { [key: string]: string } = {
            women: 'FASHION',
            men: 'FASHION',
            bags: 'FASHION',
            shoes: 'FOOTWEAR',
            jewelry: 'JEWELRY',
            beauty: 'BEAUTY',
            sports: 'SPORTS',
            electronics: 'ELECTRONICS',
          };

          const categoryColors: { [key: string]: string } = {
            FASHION: '#EF4444',
            FOOTWEAR: '#4F46E5',
            JEWELRY: '#7C3AED',
            BEAUTY: '#F59E0B',
            SPORTS: '#10B981',
            ELECTRONICS: '#3B82F6',
          };

          const categorySlug = product.categorySlug || product.gender || 'fashion';
          const category = categoryMap[categorySlug] || 'FASHION';

          // Check if product has coupon or discount
          const hasCoupon = product.coupon && product.coupon.trim() !== '';
          const hasDiscount = product.discount && parseFloat(String(product.discount)) > 0;

          // Use couponDescription as deal title if available, otherwise product name
          const dealTitle = product.couponDescription || product.name;

          // Use coupon code if available, otherwise SKU
          const dealCode = hasCoupon ? product.coupon : product.sku;

          // Calculate discount display
          let discountDisplay = 'Special Offer';

          if (hasDiscount) {
            discountDisplay = `${Math.round(parseFloat(String(product.discount)))}% off`;
          } else if (hasCoupon && product.couponDescription) {
            discountDisplay = 'Coupon Available';
          }

          // Calculate savings
          let savingsDisplay = 'Save More';

          if (product.originalPrice && product.price) {
            const originalPrice = parseFloat(String(product.originalPrice));
            const currentPrice = parseFloat(String(product.price));

            savingsDisplay = `Save ¥${(originalPrice - currentPrice).toLocaleString()}`;
          }

          // Use coupon expiration date if available
          const expirationDate = product.couponExpirationDate
            ? new Date(product.couponExpirationDate).toLocaleDateString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

          // Check if coupon is expired
          const isExpired = product.couponExpirationDate
            ? new Date(product.couponExpirationDate) < new Date()
            : false;

          return {
            id: product.id,
            merchant: {
              name: product.brandName || 'Unknown Brand',
              logo: product.brandLogo || null,
              category: category,
              categoryColor: categoryColors[category] || '#EF4444',
            },
            title: dealTitle,
            description:
              product.description ||
              (hasCoupon ? 'Limited time coupon offer' : 'Limited time offer'),
            code: dealCode || undefined,
            discount: discountDisplay,
            savings: savingsDisplay,
            affiliateUrl: product.promotionUrl || product.adUrl || product.url || '#',
            rating: 4.0 + Math.random() * 0.7, // Generate rating between 4.0-4.7
            expires: expirationDate,
            isExpired: isExpired,
            clicks: Math.floor(Math.random() * 300) + 50, // Random clicks 50-350
            featured: product.isNew || hasCoupon || Math.random() > 0.7,
            categorySlug: categorySlug,
            source: product.source || 'unknown',
          };
        });

        setDeals(dealsFromProducts);
        setOriginalProducts(originalProductsMap);

        // Extract unique stores and create store options
        const storeCount: { [key: string]: number } = {};

        dealsFromProducts.forEach((deal: Deal) => {
          storeCount[deal.source] = (storeCount[deal.source] || 0) + 1;
        });

        const storeOptions: StoreOption[] = [
          { value: 'all', label: t('allStores') || 'All Stores', count: dealsFromProducts.length },
        ];

        Object.entries(storeCount)
          .sort(([, a], [, b]) => b - a) // Sort by count descending
          .forEach(([source, count]) => {
            if (source !== 'unknown') {
              storeOptions.push({
                value: source,
                label: source.charAt(0).toUpperCase() + source.slice(1),
                count: count,
              });
            }
          });

        setAvailableStores(storeOptions);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : t('liveDeals.errors.unknown');

        setError(errorMessage);

        // Fallback to mock data if API fails
        setDeals(mockDeals);

        // Generate store options from mock data
        const mockStoreCount: { [key: string]: number } = {};

        mockDeals.forEach((deal: Deal) => {
          mockStoreCount[deal.source] = (mockStoreCount[deal.source] || 0) + 1;
        });

        const mockStoreOptions: StoreOption[] = [
          { value: 'all', label: t('allStores') || 'All Stores', count: mockDeals.length },
        ];

        Object.entries(mockStoreCount)
          .sort(([, a], [, b]) => b - a)
          .forEach(([source, count]) => {
            mockStoreOptions.push({
              value: source,
              label: source.charAt(0).toUpperCase() + source.slice(1),
              count: count,
            });
          });

        setAvailableStores(mockStoreOptions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [gender, t]);

  const filterAndSortDeals = useCallback(() => {
    let filtered = [...deals];

    // Filter by store source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((deal) => deal.source === sourceFilter);
    }

    // Sort deals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.clicks - a.clicks;
        case 'discount':
          return b.rating - a.rating;
        case 'expires':
          return new Date(a.expires).getTime() - new Date(b.expires).getTime();
        default:
          return 0; // newest - already sorted by API
      }
    });

    setFilteredDeals(filtered);
  }, [deals, sourceFilter, sortBy]);

  useEffect(() => {
    filterAndSortDeals();
  }, [filterAndSortDeals]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLoadMoreCount(0);
  }, [sourceFilter, sortBy]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Silently handle copy failure
    }
  }, []);

  const handleDealClick = useCallback(
    (deal: Deal, skipCouponCopy = false) => {
      // Don't handle clicks for expired deals
      if (deal.isExpired) return;

      // 1. Copy coupon code if available (only if not already copied via button)
      if (deal.code && !skipCouponCopy) {
        handleCopyCode(deal.code);
      }

      // 2. Open redirect page in new tab (like ProductGrid)
      window.open(`/${locale}/track-redirect/product/${deal.id}`, '_blank');

      // 3. Open product modal in current page using original product data
      const originalProduct = originalProducts.get(deal.id);

      const productDetailForModal: ProductModalDetailType = originalProduct
        ? {
            // Use original product data when available
            id: originalProduct.id,
            name: originalProduct.name,
            images: originalProduct.images || [],
            description: originalProduct.description || deal.description,
            price: parseFloat(String(originalProduct.price)) || 0,
            originalPrice: originalProduct.originalPrice
              ? parseFloat(String(originalProduct.originalPrice))
              : undefined,
            discount: originalProduct.discount
              ? parseFloat(String(originalProduct.discount))
              : undefined,
            isNew: originalProduct.isNew || deal.featured,
            isFavorite: false,
            currency: originalProduct.currency || 'CNY',
            gender: (originalProduct.gender as 'women' | 'men' | 'unisex') || gender || undefined,
            categories: originalProduct.categories || [deal.categorySlug],
            sku: originalProduct.sku || deal.code || undefined,
            status: originalProduct.status || (deal.isExpired ? 'expired' : 'active'),
            videos: originalProduct.videos || [],
            brandName: originalProduct.brandName || deal.merchant.name,
            brandSlug:
              originalProduct.brandSlug || deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
            brandId:
              originalProduct.brandId || deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
            brandLogo: originalProduct.brandLogo || (deal.merchant.logo ?? undefined),
            categoryName: originalProduct.categoryName || deal.merchant.category,
            categorySlug: originalProduct.categorySlug || deal.categorySlug,
            categoryId: originalProduct.categoryId || deal.categorySlug,
            inventory: originalProduct.inventory || 99,
            availableQuantity: originalProduct.inventory || 99,
            careInstructions: originalProduct.careInstructions || [
              '请查看商品详情页面了解更多信息',
            ],
            relatedProducts: [],
            material: originalProduct.material || undefined,
            details: originalProduct.details || [],
            sizes: originalProduct.sizes || [],
            colors: originalProduct.colors
              ? originalProduct.colors.map((color) =>
                  typeof color === 'string' ? { name: color, value: color } : color
                )
              : [],
            specifications: originalProduct.specifications || undefined,
            adUrl: originalProduct.adUrl || deal.affiliateUrl,
            brand: {
              id: originalProduct.brandId || deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
              name: originalProduct.brandName || deal.merchant.name,
              slug:
                originalProduct.brandSlug || deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
              logo: originalProduct.brandLogo || (deal.merchant.logo ?? undefined),
            },
            category: {
              id: originalProduct.categoryId || deal.categorySlug,
              name: originalProduct.categoryName || deal.merchant.category,
              slug: originalProduct.categorySlug || deal.categorySlug,
            },
          }
        : {
            // Fallback to deal data if original product not found
            id: deal.id,
            name: deal.title,
            images: [],
            description: deal.description,
            price: 0,
            originalPrice: undefined,
            discount: undefined,
            isNew: deal.featured,
            isFavorite: false,
            currency: 'CNY',
            gender: gender || undefined,
            categories: [deal.categorySlug],
            sku: deal.code || undefined,
            status: deal.isExpired ? 'expired' : 'active',
            videos: [],
            brandName: deal.merchant.name,
            brandSlug: deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
            brandId: deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
            brandLogo: deal.merchant.logo ?? undefined,
            categoryName: deal.merchant.category,
            categorySlug: deal.categorySlug,
            categoryId: deal.categorySlug,
            inventory: 99,
            availableQuantity: 99,
            careInstructions: ['请查看商品详情页面了解更多信息'],
            relatedProducts: [],
            material: undefined,
            details: [],
            sizes: [],
            colors: [],
            specifications: undefined,
            adUrl: deal.affiliateUrl,
            brand: {
              id: deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
              name: deal.merchant.name,
              slug: deal.merchant.name.toLowerCase().replace(/\s+/g, '-'),
              logo: deal.merchant.logo ?? undefined,
            },
            category: {
              id: deal.categorySlug,
              name: deal.merchant.category,
              slug: deal.categorySlug,
            },
          };

      openProductModal(productDetailForModal);

      // 4. Update click count
      const updatedDeals = deals.map((d) =>
        d.id === deal.id ? { ...d, clicks: d.clicks + 1 } : d
      );

      setDeals(updatedDeals);
    },
    [deals, handleCopyCode, openProductModal, locale, gender, originalProducts]
  );

  const getCodePreview = (code: string) => {
    if (code.length <= 4) return code;
    const visibleLength = Math.ceil(code.length * 0.5);
    const visiblePart = code.substring(0, visibleLength);
    const hiddenPart = '●'.repeat(code.length - visibleLength);

    return `${visiblePart}${hiddenPart}`;
  };

  const getGridCols = () => {
    switch (viewMode) {
      case 'list':
        return 'grid-cols-1';
      case 'dense':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      case 'original':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      default: // compact
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  const getCardSize = () => {
    switch (viewMode) {
      case 'list':
        return 'h-20';
      case 'dense':
        return 'h-32';
      case 'original':
        return 'h-48';
      default: // compact
        return 'h-40';
    }
  };

  if (isLoading) {
    return (
      <section
        className={`w-full bg-bg-primary-light dark:bg-bg-primary-dark py-12 sm:py-16 ${className}`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={`w-full bg-bg-primary-light dark:bg-bg-primary-dark py-12 sm:py-16 ${className}`}
      >
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <section
      className={`w-full bg-bg-primary-light dark:bg-bg-primary-dark py-12 sm:py-16 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header and Controls */}
        <div className="mb-6">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {t('title')}
                </h2>
              </div>
              <Chip size="sm" color="default" variant="flat">
                {filteredDeals.length} deals
              </Chip>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select
                size="sm"
                className="w-40"
                aria-label="Filter by store"
                classNames={{
                  trigger:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                  listbox: 'bg-white dark:bg-bg-secondary-dark',
                  popoverContent:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                }}
                selectedKeys={new Set([sourceFilter])}
                onSelectionChange={(keys) => {
                  const keysArray = Array.from(keys);
                  const value = keysArray[0] as SourceFilter;

                  // Simple selection logic - just set the new value
                  if (value) {
                    setSourceFilter(value);
                  }
                }}
              >
                {availableStores.map((store) => (
                  <SelectItem
                    key={store.value}
                    textValue={`${store.label} (${store.count})`}
                    onPress={() => {
                      // If clicking the same store that's already selected, reset to "all"
                      if (store.value === sourceFilter && store.value !== 'all') {
                        setSourceFilter('all');
                      }
                      // Otherwise, normal selection will be handled by onSelectionChange
                    }}
                  >
                    {store.label} ({store.count})
                  </SelectItem>
                ))}
              </Select>

              <Select
                size="sm"
                className="w-32"
                aria-label="Sort deals by"
                classNames={{
                  trigger:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                  listbox: 'bg-white dark:bg-bg-secondary-dark',
                  popoverContent:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                }}
                selectedKeys={new Set([sortBy])}
                onSelectionChange={(keys) => {
                  const keysArray = Array.from(keys);
                  const value = keysArray[0] as SortOption;

                  if (value) {
                    setSortBy(value);
                  }
                }}
              >
                <SelectItem key="newest" textValue={t('sort.newest')}>
                  {t('sort.newest')}
                </SelectItem>
                <SelectItem key="popular" textValue={t('sort.popular')}>
                  {t('sort.popular')}
                </SelectItem>
                <SelectItem key="discount" textValue={t('sort.discount')}>
                  {t('sort.discount')}
                </SelectItem>
                <SelectItem key="expires" textValue={t('sort.expires')}>
                  {t('sort.expires')}
                </SelectItem>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border border-border-primary-light dark:border-border-primary-dark rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'original' ? 'solid' : 'light'}
                className="px-2 py-1 text-xs"
                onPress={() => setViewMode('original')}
              >
                Original
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'solid' : 'light'}
                className="px-2 py-1 text-xs"
                onPress={() => setViewMode('compact')}
              >
                Compact
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'dense' ? 'solid' : 'light'}
                className="px-2 py-1 text-xs"
                onPress={() => setViewMode('dense')}
              >
                Dense
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'light'}
                className="px-2 py-1 text-xs"
                onPress={() => setViewMode('list')}
              >
                <List className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className={`grid ${getGridCols()} gap-3`}>
          {filteredDeals.slice(0, currentPage * ITEMS_PER_PAGE).map((deal) => (
            <Card
              key={deal.id}
              className={`${getCardSize()} ${
                viewMode === 'list' ? 'flex-row' : 'flex-col'
              } bg-white dark:bg-bg-secondary-dark border border-gray-200 dark:border-border-primary-dark hover:border-gray-300 dark:hover:border-border-hover-dark transition-all duration-200 hover:shadow-md group cursor-pointer ${
                deal.isExpired ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''
              }`}
              onClick={() => !deal.isExpired && handleDealClick(deal)}
              onKeyDown={(e) => {
                if (!deal.isExpired && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDealClick(deal);
                }
              }}
              role="button"
              tabIndex={deal.isExpired ? -1 : 0}
            >
              <div
                className={`${viewMode === 'list' ? 'flex flex-row gap-3' : 'flex flex-col h-full'} p-3`}
              >
                {/* Header */}
                <div className={`${viewMode === 'list' ? 'flex-shrink-0' : ''} mb-2`}>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Merchant Logo */}
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                      {deal.merchant.logo ? (
                        <Image
                          alt={`${deal.merchant.name} logo`}
                          className="w-4 h-4 object-contain"
                          src={deal.merchant.logo}
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          {deal.merchant.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Merchant Name */}
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {deal.merchant.name}
                    </span>

                    {/* Category Badge */}
                    <Chip
                      size="sm"
                      style={{ backgroundColor: deal.merchant.categoryColor }}
                      className="text-white text-xs px-1 py-0 h-4 min-h-4"
                    >
                      {deal.merchant.category}
                    </Chip>
                  </div>
                </div>

                {/* Content */}
                <div className={`${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
                  {/* Title */}
                  <h3
                    className={`font-medium text-gray-900 dark:text-gray-100 mb-1 ${
                      viewMode === 'dense'
                        ? 'text-xs line-clamp-2'
                        : viewMode === 'list'
                          ? 'text-sm line-clamp-1'
                          : 'text-sm line-clamp-2'
                    }`}
                  >
                    {deal.title}
                  </h3>

                  {/* Meta Info */}
                  {viewMode !== 'dense' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{deal.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3 h-3 ${deal.isExpired ? 'text-red-500' : ''}`} />
                        <span className={deal.isExpired ? 'text-red-500 line-through' : ''}>
                          {deal.isExpired ? 'Expired' : `Expires ${deal.expires}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between">
                    {/* Coupon Button */}
                    {deal.code ? (
                      <Button
                        size="sm"
                        className={`px-3 py-1 h-7 text-xs font-mono font-semibold ${
                          deal.isExpired
                            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                        onPress={() => {
                          if (!deal.isExpired) {
                            handleCopyCode(deal.code!);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        isDisabled={deal.isExpired}
                      >
                        {deal.isExpired
                          ? 'Expired'
                          : copiedCode === deal.code
                            ? '✓'
                            : getCodePreview(deal.code)}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className={`px-3 py-1 h-7 text-xs font-semibold ${
                          deal.isExpired
                            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                        onPress={() => {
                          // For "Get Deal" button, trigger the full deal click logic
                          if (!deal.isExpired) {
                            handleDealClick(deal);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        isDisabled={deal.isExpired}
                      >
                        {deal.isExpired ? 'Expired' : 'Get Deal'}
                      </Button>
                    )}

                    {/* Savings */}
                    <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                      {deal.savings}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {filteredDeals.length > currentPage * ITEMS_PER_PAGE && loadMoreCount < MAX_LOAD_MORE && (
          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="flat"
              className="px-8"
              onPress={() => {
                setCurrentPage((prev) => prev + 1);
                setLoadMoreCount((prev) => prev + 1);
              }}
            >
              {t('loadMore')} (+
              {Math.min(ITEMS_PER_PAGE, filteredDeals.length - currentPage * ITEMS_PER_PAGE)})
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
