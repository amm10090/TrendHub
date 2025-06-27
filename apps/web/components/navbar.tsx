'use client';

import { Navbar, NavbarContent, NavbarBrand, NavbarItem } from '@heroui/react';
import {
  Button,
  Drawer,
  DrawerContent,
  Input,
  Link,
  Card,
  CardBody,
  Avatar,
  Divider,
} from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { Heart, Menu, Search, ShoppingBag, User, X, Package, Building2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';
import type { ProductDetail as ProductModalDetailType } from '@/types/product';

import { useProductModal } from '../contexts/product-modal-context';

import { LanguageSwitch } from './language-switch';
import { NavbarBrands } from './navbar-brands';
import { ThemeSwitch } from './theme-switch';

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  name: string;
  href: string;
  items?: SubMenuItem[];
  isBrands?: boolean;
}

interface SearchSuggestion {
  id: string;
  type: 'product' | 'brand';
  name: string;
  price?: string;
  originalPrice?: string | null;
  image?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  gender?: 'women' | 'men' | 'unisex' | null;
  url: string;
  slug?: string;
  logo?: string | null;
}

// Define a type for the fetched category tree nodes (simplified for navbar needs)
interface NavCategoryNode {
  id: string;
  name: string;
  slug: string; // Needed for constructing hrefs
  level: number;
  showInNavbar?: boolean;
  children: NavCategoryNode[];
}

export const MainNavbar = () => {
  const t = useTranslations('nav');
  const tProduct = useTranslations('productGrid');
  const router = useRouter();
  const pathname = usePathname();
  const { openProductModal } = useProductModal();
  const pathSegments = pathname ? pathname.split('/').filter(Boolean) : [];
  const locale = pathSegments[0] || '';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'women' | 'men'>('women');
  const [currentSubmenu, setCurrentSubmenu] = useState<{
    name: string;
    items: SubMenuItem[];
  } | null>(null);

  // Search related states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // State for dynamic navigation items
  const [dynamicNavItems, setDynamicNavItems] = useState<MenuItem[]>([]);
  const [isLoadingNav, setIsLoadingNav] = useState(true);

  useEffect(() => {
    // 从 pathname 更新 activeCategory
    if (pathname) {
      if (pathname.startsWith(`/${locale}/women`)) {
        setActiveCategory('women');
      } else if (pathname.startsWith(`/${locale}/men`)) {
        setActiveCategory('men');
      } else if (pathname.startsWith('/women')) {
        // Fallback for when locale might not be in path yet or for root paths
        setActiveCategory('women');
      } else if (pathname.startsWith('/men')) {
        setActiveCategory('men');
      }
      // 如果路径不是以 /women 或 /men 开头，可以考虑保留当前的 activeCategory，或者设置一个默认值
      // 例如，如果当前在 /brands 页面，activeCategory 应该是什么？目前它会保持上次的值。
      // 对于首页 `/`，它会根据初始状态（'women'）或之前的状态决定。这部分行为可以根据产品需求调整。
    }
  }, [pathname, locale]); // 添加 locale 到依赖项，因为路径中包含 locale

  useEffect(() => {
    const fetchNavData = async () => {
      setIsLoadingNav(true);
      try {
        const response = await fetch('/api/public/categories/tree');

        if (!response.ok) {
          let errorMessage = t('errors.fetchNavError');

          try {
            const errorData = await response.json();

            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // 解析错误信息失败，使用默认的
          }
          throw new Error(errorMessage);
        }

        const rawNavData: NavCategoryNode[] = await response.json();

        const processedNavItems: MenuItem[] = [];

        // L1 categories (e.g., Women, Men) become top-level tabs/links like current 'Women' / 'Men' links
        // These are handled by the separate <Link href="/women"> and <Link href="/men"> above the main navbar in the current layout.
        // The main navigation items will be the L2 categories under the *currently selected* L1 (gender) category.
        // So, we need to find the L1 node that matches the current `activeCategory` (derived from path or state)
        // For simplicity in this step, let's assume `activeCategory` correctly reflects the current gender context (e.g., 'women' or 'men').
        // The API returns all L1s, so we filter for the one that matches `activeCategory` for its children.

        // First, identify what the actual L1 slug is based on `activeCategory` state
        // This part needs careful thought if `activeCategory` (women/men) doesn't directly map to L1 slugs from DB
        // For now, let's assume a direct mapping or that `activeCategory` is set based on fetched L1 slugs.
        // The current `activeCategory` state is 'women' or 'men'. We need to find the L1 node that corresponds to this.
        // Let's refine the logic: the top bar (Women/Men links) sets `activeCategory`.
        // The main nav bar items should then be children of this `activeCategory`.

        const currentL1Node = rawNavData.find(
          (node) => node.level === 1 && node.slug.toLowerCase() === activeCategory.toLowerCase()
        );

        if (currentL1Node) {
          currentL1Node.children
            .filter((l2Node) => l2Node.level === 2 && l2Node.showInNavbar)
            .forEach((l2Node) => {
              processedNavItems.push({
                name: l2Node.name,
                href: `/${locale}/${currentL1Node.slug}/${l2Node.slug}`.replace(/\/\//g, '/'),
                items: l2Node.children // L3 items, if any, and if they are also marked with showInNavbar
                  .filter((l3Node) => l3Node.level === 3 && l3Node.showInNavbar)
                  .map((l3Node) => ({
                    name: l3Node.name,
                    href: `/${locale}/${currentL1Node.slug}/${l2Node.slug}/${l3Node.slug}`.replace(
                      /\/\//g,
                      '/'
                    ),
                  })),
              });
            });
        }

        // Add static items like Brands and Guides
        const staticItems: MenuItem[] = [
          {
            name: t('brands'),
            href: `${locale ? `/${locale}` : ''}/brands`.replace(/\/\//g, '/'),
            isBrands: true,
          },
          {
            name: t('guides'),
            href: `${locale ? `/${locale}` : ''}/guides`.replace(/\/\//g, '/'),
          },
        ];

        setDynamicNavItems([...processedNavItems, ...staticItems]);
      } catch {
        setDynamicNavItems([
          {
            name: t('brands'),
            href: `${locale ? `/${locale}` : ''}/brands`.replace(/\/\//g, '/'),
            isBrands: true,
          },
          { name: t('guides'), href: `${locale ? `/${locale}` : ''}/guides`.replace(/\/\//g, '/') },
        ]);
      } finally {
        setIsLoadingNav(false);
      }
    };

    fetchNavData();
  }, [locale, t, activeCategory]);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearchLoading(true);
        try {
          const response = await fetch(`/api/public/search?q=${encodeURIComponent(query)}&limit=8`);

          if (response.ok) {
            const data = await response.json();

            setSearchSuggestions(data.data || []);
            setShowSuggestions(true);
          }
        } catch {
          setSearchSuggestions([]);
        } finally {
          setIsSearchLoading(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setSelectedSuggestionIndex(-1);

      if (value.trim().length === 0) {
        setSearchSuggestions([]);
        setShowSuggestions(false);

        return;
      }

      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle search keyboard navigation
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || searchSuggestions.length === 0) {
        if (e.key === 'Enter' && searchQuery.trim()) {
          // Navigate to search results page
          router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
          setIsSearchOpen(false);
          setShowSuggestions(false);
        }

        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < searchSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : searchSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            const suggestion = searchSuggestions[selectedSuggestionIndex];

            if (suggestion.type === 'product') {
              // For products: open redirect page in new tab and show modal
              window.open(`/${locale}/track-redirect/product/${suggestion.id}`, '_blank');

              // Create product detail object for modal
              const productDetailForModal: ProductModalDetailType = {
                id: suggestion.id,
                name: suggestion.name,
                images: suggestion.image ? [suggestion.image] : [],
                description: tProduct('defaultDescription'),
                price: parseFloat(suggestion.price || '0'),
                originalPrice: suggestion.originalPrice
                  ? parseFloat(suggestion.originalPrice)
                  : null,
                discount: null,
                isNew: false,
                isFavorite: false,
                currency: 'CNY',
                gender: suggestion.gender,
                categories: [],
                sku: tProduct('defaultSku'),
                status: 'ACTIVE',
                videos: [],
                brandName: suggestion.brandName,
                brandSlug: suggestion.brandSlug,
                brandId: suggestion.brandName || 'unknown-brand',
                brandLogo: null,
                categoryName: suggestion.categoryName,
                categorySlug: suggestion.categorySlug,
                categoryId: suggestion.categoryName || 'unknown-category',
                inventory: 10,
                availableQuantity: 10,
                careInstructions: [tProduct('defaultCareInstructions')],
                relatedProducts: [],
                material: null,
                details: null,
                sizes: null,
                colors: null,
                specifications: null,
                adUrl: null,
                brand: {
                  id: suggestion.brandName || 'unknown-brand',
                  name: suggestion.brandName || tProduct('unknownBrand'),
                  slug: suggestion.brandSlug || 'unknown-brand',
                  logo: null,
                },
                category: {
                  id: suggestion.categoryName || 'unknown-category',
                  name: suggestion.categoryName || tProduct('unknownCategory'),
                  slug: suggestion.categorySlug || 'unknown-category',
                },
              };

              openProductModal(productDetailForModal);
            } else {
              // For brands and other types: just navigate
              router.push(suggestion.url);
            }

            setIsSearchOpen(false);
            setShowSuggestions(false);
            setSearchQuery('');
          } else if (searchQuery.trim()) {
            router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    },
    [
      showSuggestions,
      searchSuggestions,
      selectedSuggestionIndex,
      searchQuery,
      router,
      locale,
      tProduct,
      openProductModal,
    ]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'product') {
        // For products: open redirect page in new tab and show modal
        window.open(`/${locale}/track-redirect/product/${suggestion.id}`, '_blank');

        // Create product detail object for modal (similar to product-grid-original logic)
        const productDetailForModal: ProductModalDetailType = {
          id: suggestion.id,
          name: suggestion.name,
          images: suggestion.image ? [suggestion.image] : [],
          description: tProduct('defaultDescription'),
          price: parseFloat(suggestion.price || '0'),
          originalPrice: suggestion.originalPrice ? parseFloat(suggestion.originalPrice) : null,
          discount: null,
          isNew: false,
          isFavorite: false,
          currency: 'CNY',
          gender: suggestion.gender,
          categories: [],
          sku: tProduct('defaultSku'),
          status: 'ACTIVE',
          videos: [],
          brandName: suggestion.brandName,
          brandSlug: suggestion.brandSlug,
          brandId: suggestion.brandName || 'unknown-brand',
          brandLogo: null,
          categoryName: suggestion.categoryName,
          categorySlug: suggestion.categorySlug,
          categoryId: suggestion.categoryName || 'unknown-category',
          inventory: 10,
          availableQuantity: 10,
          careInstructions: [tProduct('defaultCareInstructions')],
          relatedProducts: [],
          material: null,
          details: null,
          sizes: null,
          colors: null,
          specifications: null,
          adUrl: null,
          brand: {
            id: suggestion.brandName || 'unknown-brand',
            name: suggestion.brandName || tProduct('unknownBrand'),
            slug: suggestion.brandSlug || 'unknown-brand',
            logo: null,
          },
          category: {
            id: suggestion.categoryName || 'unknown-category',
            name: suggestion.categoryName || tProduct('unknownCategory'),
            slug: suggestion.categorySlug || 'unknown-category',
          },
        };

        openProductModal(productDetailForModal);
      } else {
        // For brands and other types: just navigate
        router.push(suggestion.url);
      }

      setIsSearchOpen(false);
      setShowSuggestions(false);
      setSearchQuery('');
    },
    [router, locale, tProduct, openProductModal]
  );

  // Handle search open/close
  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchSuggestions([]);
    setSelectedSuggestionIndex(-1);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: MenuItem, e: React.MouseEvent<Element>) => {
    e.preventDefault();
    if (item.items) {
      setCurrentSubmenu({
        name: item.name,
        items: item.items,
      });
    } else {
      router.push(item.href);
      setIsMenuOpen(false);
    }
  };

  const handleItemKeyDown = (item: MenuItem, e: React.KeyboardEvent<Element>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      if (item.items) {
        setCurrentSubmenu({
          name: item.name,
          items: item.items,
        });
      } else {
        router.push(item.href);
        setIsMenuOpen(false);
      }
    }
  };

  const handleBackClick = (e: React.MouseEvent<Element>) => {
    e.preventDefault();
    setCurrentSubmenu(null);
  };

  const handleBackKeyDown = (e: React.KeyboardEvent<Element>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      setCurrentSubmenu(null);
    }
  };

  const handleSubItemClick = (subItem: SubMenuItem, e: React.MouseEvent<Element>) => {
    e.preventDefault();
    router.push(subItem.href);
    setIsMenuOpen(false);
  };

  const handleSubItemKeyDown = (subItem: SubMenuItem, e: React.KeyboardEvent<Element>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      router.push(subItem.href);
      setIsMenuOpen(false);
    }
  };

  const handleBrandMenuItemClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="w-full bg-bg-secondary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark border-b border-border-primary-light dark:border-border-primary-dark hidden sm:block">
        <div className="container mx-auto px-4 flex justify-between items-center h-8">
          <div className="flex gap-6">
            <Link
              className={cn(
                "text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-text-primary-light dark:after:bg-text-primary-dark after:transition-all after:duration-300 hover:after:w-full",
                pathname?.startsWith(`/${locale}/women`) && 'after:w-full'
              )}
              href={`/${locale}/women`}
            >
              {t('women')}
            </Link>
            <Link
              className={cn(
                "text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-text-primary-light dark:after:bg-text-primary-dark after:transition-all after:duration-300 hover:after:w-full",
                pathname?.startsWith(`/${locale}/men`) && 'after:w-full'
              )}
              href={`/${locale}/men`}
            >
              {t('men')}
            </Link>
          </div>
          <div className="flex items-center">
            <ThemeSwitch />
            <LanguageSwitch isSearchOpen={isSearchOpen} />
          </div>
        </div>
      </div>
      <Navbar
        isBordered
        classNames={{
          wrapper: 'px-4 max-w-full h-16',
          base: 'bg-bg-secondary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark border-border-primary-light dark:border-border-primary-dark',
        }}
      >
        <NavbarContent className="sm:hidden">
          <Menu className="h-6 w-6 cursor-pointer" onPointerDown={() => setIsMenuOpen(true)} />
        </NavbarContent>

        <NavbarContent>
          <NavbarBrand>
            <Link className="font-bold text-inherit" href="/">
              TrendHub
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-8" justify="center">
          {isLoadingNav ? (
            <NavbarItem>
              {/* Placeholder for loading state, e.g., a spinner */}
              <span>Loading nav...</span>
            </NavbarItem>
          ) : (
            dynamicNavItems.map((item) => (
              <NavbarItem key={item.href} className="group relative">
                <Link
                  className="text-sm text-text-primary-light dark:text-text-primary-dark py-2 hover:opacity-70 transition-opacity"
                  href={item.href}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleItemClick(item, e)}
                  onKeyDown={(e) => handleItemKeyDown(item, e)}
                >
                  {item.name}
                </Link>
                {item.isBrands ? (
                  <div className="fixed left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-xs border-b border-border-primary-light dark:border-border-primary-dark">
                    <NavbarBrands
                      locale={pathname?.split('/')[1] || 'en'}
                      onItemClick={handleBrandMenuItemClick}
                    />
                  </div>
                ) : item.items ? (
                  <div className="fixed left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-xs border-b border-border-primary-light dark:border-border-primary-dark">
                    <div className="w-full">
                      <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-4 gap-8">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              className="block py-3 px-4 border-b border-border-primary-light dark:border-border-primary-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark transition-colors text-base"
                              href={subItem.href}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSubItemClick(subItem, e)}
                              onKeyDown={(e) => handleSubItemKeyDown(subItem, e)}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </NavbarItem>
            ))
          )}
        </NavbarContent>

        <NavbarContent justify="end">
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div
                className="absolute inset-0 px-4 flex items-center bg-bg-secondary-light dark:bg-bg-secondary-dark"
                ref={suggestionsRef}
              >
                <div className="w-full relative">
                  <Input
                    ref={searchInputRef}
                    aria-label={t('search.label')}
                    classNames={{
                      base: 'w-full',
                      input: 'text-small text-text-primary-light dark:text-text-primary-dark',
                      inputWrapper:
                        'h-10 bg-bg-tertiary-light dark:bg-bg-tertiary-dark border-border-primary-light dark:border-border-primary-dark',
                    }}
                    endContent={
                      <Button
                        isIconOnly
                        aria-label={t('search.close')}
                        className="text-text-primary-light dark:text-text-primary-dark"
                        size="sm"
                        variant="light"
                        onPointerDown={handleSearchClose}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    }
                    placeholder={t('search.placeholder')}
                    startContent={
                      <Search className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                    }
                    type="search"
                    value={searchQuery}
                    onValueChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                  />

                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && (searchSuggestions.length > 0 || isSearchLoading) && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto bg-white dark:bg-bg-secondary-dark border border-border-primary-light dark:border-border-primary-dark shadow-lg">
                      <CardBody className="p-0">
                        {isSearchLoading ? (
                          <div className="p-4 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {t('search.loading')}
                          </div>
                        ) : (
                          <>
                            {searchSuggestions.map((suggestion, index) => (
                              <div
                                key={`${suggestion.type}-${suggestion.id}`}
                                className={cn(
                                  'flex items-center gap-3 p-3 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark cursor-pointer transition-colors border-b border-border-primary-light dark:border-border-primary-dark last:border-b-0',
                                  selectedSuggestionIndex === index &&
                                    'bg-hover-bg-light dark:bg-hover-bg-dark'
                                )}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSuggestionClick(suggestion);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                {suggestion.type === 'product' ? (
                                  <>
                                    <div className="w-10 h-10 flex-shrink-0">
                                      {suggestion.image ? (
                                        <Avatar
                                          src={suggestion.image}
                                          alt={suggestion.name}
                                          className="w-10 h-10"
                                          radius="sm"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                          <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                                        {suggestion.name}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        {suggestion.brandName && (
                                          <span>{suggestion.brandName}</span>
                                        )}
                                        {suggestion.categoryName && (
                                          <>
                                            {suggestion.brandName && <span>•</span>}
                                            <span>{suggestion.categoryName}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {suggestion.price && (
                                      <div className="flex-shrink-0 text-right">
                                        <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                          ¥{suggestion.price}
                                        </p>
                                        {suggestion.originalPrice &&
                                          suggestion.originalPrice !== suggestion.price && (
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-through">
                                              ¥{suggestion.originalPrice}
                                            </p>
                                          )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 flex-shrink-0">
                                      {suggestion.logo ? (
                                        <Avatar
                                          src={suggestion.logo}
                                          alt={suggestion.name}
                                          className="w-10 h-10"
                                          radius="sm"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                          <Building2 className="w-5 h-5 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                                        {suggestion.name}
                                      </p>
                                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        {t('search.brand')}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                            {searchQuery.trim() && (
                              <>
                                <Divider />
                                <div
                                  className="flex items-center gap-3 p-3 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark cursor-pointer transition-colors"
                                  onClick={() => {
                                    router.push(
                                      `/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`
                                    );
                                    handleSearchClose();
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      router.push(
                                        `/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`
                                      );
                                      handleSearchClose();
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="w-10 h-10 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                                      {t('search.seeAllResults')} &quot;{searchQuery}&quot;
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <>
                <NavbarItem>
                  <Button
                    isIconOnly
                    aria-label={t('search.label')}
                    variant="light"
                    onPointerDown={handleSearchOpen}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                  <Button isIconOnly aria-label={t('account')} variant="light">
                    <User className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                  <Button isIconOnly aria-label={t('wishlist')} variant="light">
                    <Heart className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem>
                  <Button isIconOnly aria-label={t('cart')} variant="light">
                    <ShoppingBag className="h-5 w-5" />
                  </Button>
                </NavbarItem>
              </>
            )}
          </div>
        </NavbarContent>

        <Drawer
          classNames={{
            base: 'w-[85vw] max-w-[400px] bg-bg-secondary-light dark:bg-bg-secondary-dark',
            wrapper: 'bg-black/20',
          }}
          hideCloseButton={true}
          isOpen={isMenuOpen}
          placement="left"
          onOpenChange={setIsMenuOpen}
        >
          <DrawerContent>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border-primary-light dark:border-border-primary-dark">
                <Tabs
                  fullWidth
                  classNames={{
                    base: 'w-full',
                    tabList: 'gap-0',
                    tab: 'h-11 data-[selected=true]:bg-text-primary-light dark:data-[selected=true]:bg-text-primary-dark data-[selected=true]:text-bg-secondary-light dark:data-[selected=true]:text-bg-secondary-dark data-[selected=false]:bg-bg-tertiary-light dark:data-[selected=false]:bg-bg-tertiary-dark data-[selected=false]:text-text-secondary-light dark:data-[selected=false]:text-text-secondary-dark',
                    tabContent:
                      'text-base font-normal group-data-[selected=true]:text-bg-secondary-light dark:group-data-[selected=true]:text-bg-secondary-dark group-data-[selected=false]:text-text-secondary-light dark:group-data-[selected=false]:text-text-secondary-dark',
                    cursor: 'hidden',
                  }}
                  selectedKey={activeCategory}
                  variant="solid"
                  onSelectionChange={(key) => setActiveCategory(key as 'women' | 'men')}
                >
                  <Tab key="women" title={t('women')} />
                  <Tab key="men" title={t('men')} />
                </Tabs>
                <Button
                  isIconOnly
                  className="ml-4"
                  variant="light"
                  onPointerDown={() => setIsMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                {currentSubmenu ? (
                  <div>
                    <div
                      className="flex items-center gap-2 p-4 border-b border-border-primary-light dark:border-border-primary-dark cursor-pointer text-base text-text-primary-light dark:text-text-primary-dark"
                      role="button"
                      tabIndex={0}
                      onClick={handleBackClick}
                      onKeyDown={handleBackKeyDown}
                    >
                      <span className="rotate-180">›</span>
                      {t('back')}
                    </div>
                    <div>
                      {currentSubmenu.items.map((subItem: SubMenuItem) => (
                        <Link
                          key={subItem.href}
                          className="block py-3 px-4 border-b text-text-secondary-light dark:text-text-secondary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark transition-colors text-base"
                          href={subItem.href}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSubItemClick(subItem, e)}
                          onKeyDown={(e) => handleSubItemKeyDown(subItem, e)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  dynamicNavItems.map((item) => (
                    <div
                      key={item.href}
                      className="block py-3 px-4 border-b border-border-primary-light dark:border-border-primary-dark text-base hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark transition-colors cursor-pointer text-text-primary-light dark:text-text-primary-dark"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleItemClick(item, e)}
                      onKeyDown={(e) => handleItemKeyDown(item, e)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.items && <span>›</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto border-t border-border-primary-light dark:border-border-primary-dark">
                <div className="p-4">
                  <Button
                    className="w-full border border-text-primary-light dark:border-text-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark mb-4 text-base text-text-primary-light dark:text-text-primary-dark"
                    startContent={<Heart className="h-5 w-5" />}
                  >
                    {t('wishlist')}
                  </Button>
                  <div className="flex justify-center">
                    <ThemeSwitch />
                    <LanguageSwitch isSearchOpen={isSearchOpen} />
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </Navbar>
    </>
  );
};
