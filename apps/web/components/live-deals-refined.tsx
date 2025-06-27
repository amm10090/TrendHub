'use client';

import { Button, Card, Chip, Image, Select, SelectItem } from '@heroui/react';
import { Clock, List, Star, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import * as React from 'react';

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
}

interface LiveDealsRefinedProps {
  gender?: 'women' | 'men';
  className?: string;
}

type ViewMode = 'original' | 'compact' | 'dense' | 'list';
type SortOption = 'newest' | 'popular' | 'discount' | 'expires';
type CategoryFilter =
  | 'all'
  | 'fashion'
  | 'footwear'
  | 'jewelry'
  | 'electronics'
  | 'beauty'
  | 'home'
  | 'sports';

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
  },
];

export const LiveDealsRefined: React.FC<LiveDealsRefinedProps> = ({ gender, className = '' }) => {
  const t = useTranslations('liveDeals');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch products with discounts/coupons to create deals
        const response = await fetch('/api/public/products?limit=50&sale=true');

        if (!response.ok) {
          throw new Error(t('liveDeals.errors.fetchError'));
        }

        const result = await response.json();

        // Transform products into deals format
        const dealsFromProducts = (result.data || []).map((product): Deal => {
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

          return {
            id: product.id,
            merchant: {
              name: product.brandName || 'Unknown Brand',
              logo: product.brandLogo || null,
              category: category,
              categoryColor: categoryColors[category] || '#EF4444',
            },
            title: product.name,
            description: product.description || 'Limited time offer',
            code: product.sku || undefined,
            discount: product.discount
              ? `${Math.round(parseFloat(product.discount))}% off`
              : 'Special Offer',
            savings:
              product.originalPrice && product.price
                ? `Save ¥${(parseFloat(product.originalPrice) - parseFloat(product.price)).toLocaleString()}`
                : 'Save More',
            affiliateUrl: product.adUrl || product.url || '#',
            rating: 4.0 + Math.random() * 0.7, // Generate rating between 4.0-4.7
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
            isExpired: false,
            clicks: Math.floor(Math.random() * 300) + 50, // Random clicks 50-350
            featured: product.isNew || Math.random() > 0.7,
            categorySlug: categorySlug,
          };
        });

        setDeals(dealsFromProducts);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : t('liveDeals.errors.unknown');

        setError(errorMessage);

        // Fallback to mock data if API fails
        setDeals(mockDeals);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [gender, t]);

  const filterAndSortDeals = useCallback(() => {
    let filtered = [...deals];

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((deal) => deal.categorySlug === categoryFilter);
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
  }, [deals, categoryFilter, sortBy]);

  useEffect(() => {
    filterAndSortDeals();
  }, [filterAndSortDeals]);

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
    (deal: Deal) => {
      if (deal.code) {
        handleCopyCode(deal.code);
      }
      window.open(deal.affiliateUrl, '_blank');

      // Update click count
      const updatedDeals = deals.map((d) =>
        d.id === deal.id ? { ...d, clicks: d.clicks + 1 } : d
      );

      setDeals(updatedDeals);
    },
    [deals, handleCopyCode]
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
                classNames={{
                  trigger:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                  listbox: 'bg-white dark:bg-bg-secondary-dark',
                  popoverContent:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                }}
                defaultSelectedKeys={[categoryFilter]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as CategoryFilter;

                  setCategoryFilter(value);
                }}
              >
                <SelectItem key="all">All Categories</SelectItem>
                <SelectItem key="fashion">Fashion</SelectItem>
                <SelectItem key="footwear">Footwear</SelectItem>
                <SelectItem key="jewelry">Jewelry</SelectItem>
                <SelectItem key="electronics">Electronics</SelectItem>
                <SelectItem key="beauty">Beauty</SelectItem>
                <SelectItem key="sports">Sports</SelectItem>
              </Select>

              <Select
                size="sm"
                className="w-32"
                classNames={{
                  trigger:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                  listbox: 'bg-white dark:bg-bg-secondary-dark',
                  popoverContent:
                    'bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark',
                }}
                defaultSelectedKeys={[sortBy]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as SortOption;

                  setSortBy(value);
                }}
              >
                <SelectItem key="newest">{t('sort.newest')}</SelectItem>
                <SelectItem key="popular">{t('sort.popular')}</SelectItem>
                <SelectItem key="discount">{t('sort.discount')}</SelectItem>
                <SelectItem key="expires">{t('sort.expires')}</SelectItem>
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
          {filteredDeals.map((deal) => (
            <Card
              key={deal.id}
              className={`${getCardSize()} ${
                viewMode === 'list' ? 'flex-row' : 'flex-col'
              } bg-white dark:bg-bg-secondary-dark border border-gray-200 dark:border-border-primary-dark hover:border-gray-300 dark:hover:border-border-hover-dark transition-all duration-200 hover:shadow-md group cursor-pointer`}
              onClick={() => handleDealClick(deal)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDealClick(deal);
                }
              }}
              role="button"
              tabIndex={0}
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
                        <span>{deal.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{deal.expires}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between">
                    {/* Coupon Button */}
                    {deal.code ? (
                      <Button
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 h-7 text-xs font-mono font-semibold"
                        onPress={() => handleCopyCode(deal.code!)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {copiedCode === deal.code ? '✓' : getCodePreview(deal.code)}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 h-7 text-xs font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Get Deal
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
        {filteredDeals.length >= 8 && (
          <div className="text-center mt-8">
            <Button size="lg" variant="flat" className="px-8">
              Load More ({deals.length - filteredDeals.length} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
