'use client';

import { Button } from '@heroui/button';
import { Drawer, DrawerContent } from '@heroui/drawer';
import { Input } from '@heroui/input';
import { Link } from '@heroui/link';
import { Navbar as HeroUINavbar, NavbarContent, NavbarBrand, NavbarItem } from '@heroui/navbar';
import { Tabs, Tab } from '@heroui/react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { LanguageSwitch } from './language-switch';
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

interface BrandItem {
  name: string;
  href: string;
}

interface BrandItems {
  firstRowBrands: BrandItem[];
  secondRowBrands: BrandItem[];
  viewAll: BrandItem;
  alphabet: Array<{
    letter: string;
    href: string;
  }>;
}

interface AlphabetItem {
  letter: string;
  href: string;
}

export const Navbar = () => {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'women' | 'men'>('women');
  const [currentSubmenu, setCurrentSubmenu] = useState<{
    name: string;
    items: SubMenuItem[];
  } | null>(null);

  const getSubItems = (category: string): SubMenuItem[] => {
    const items: SubMenuItem[] = [];
    const categoryKey = `${category}_categories`;

    // Add "All" category first
    items.push({
      name: t(`${categoryKey}.all`),
      href: `/${activeCategory}/${category}`,
    });

    // Add other subcategories
    Object.keys(t.raw(categoryKey)).forEach((key) => {
      if (key !== 'all') {
        items.push({
          name: t(`${categoryKey}.${key}`),
          href: `/${activeCategory}/${category}/${key}`,
        });
      }
    });

    return items;
  };

  const getBrandItems = (): BrandItems => {
    const firstRowBrands = [
      {
        name: t('popular_brand_names.balenciaga'),
        href: `/${activeCategory}/brands/balenciaga`,
      },
      {
        name: t('popular_brand_names.bottega_veneta'),
        href: `/${activeCategory}/brands/bottega-veneta`,
      },
      {
        name: t('popular_brand_names.chloe'),
        href: `/${activeCategory}/brands/chloe`,
      },
      {
        name: t('popular_brand_names.ganni'),
        href: `/${activeCategory}/brands/ganni`,
      },
      {
        name: t('popular_brand_names.gucci'),
        href: `/${activeCategory}/brands/gucci`,
      },
      {
        name: t('popular_brand_names.h_and_m'),
        href: `/${activeCategory}/brands/h-and-m`,
      },
      {
        name: t('popular_brand_names.isabel_marant'),
        href: `/${activeCategory}/brands/isabel-marant`,
      },
      {
        name: t('popular_brand_names.other_stories'),
        href: `/${activeCategory}/brands/other-stories`,
      },
      {
        name: t('popular_brand_names.prada'),
        href: `/${activeCategory}/brands/prada`,
      },
      {
        name: t('popular_brand_names.saint_laurent'),
        href: `/${activeCategory}/brands/saint-laurent`,
      },
    ];

    const secondRowBrands = [
      {
        name: t('popular_brand_names.reformation'),
        href: `/${activeCategory}/brands/reformation`,
      },
      {
        name: t('popular_brand_names.valentino'),
        href: `/${activeCategory}/brands/valentino`,
      },
      {
        name: t('popular_brand_names.zara'),
        href: `/${activeCategory}/brands/zara`,
      },
      {
        name: t('popular_brand_names.tory_burch'),
        href: `/${activeCategory}/brands/tory-burch`,
      },
    ];

    return {
      firstRowBrands,
      secondRowBrands,
      viewAll: {
        name: t('view_all_brands'),
        href: `/${activeCategory}/brands`,
      },
      alphabet: [
        ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => ({
          letter,
          href: `/${activeCategory}/brands?letter=${letter.toLowerCase()}`,
        })),
        {
          letter: '0-9',
          href: `/${activeCategory}/brands?letter=0-9`,
        },
      ],
    };
  };

  const navigationItems: MenuItem[] = [
    {
      name: t('clothing'),
      href: `/${activeCategory}/clothing`,
      items: getSubItems('clothing'),
    },
    {
      name: t('shoes'),
      href: `/${activeCategory}/shoes`,
      items: getSubItems('shoes'),
    },
    {
      name: t('accessories'),
      href: `/${activeCategory}/accessories`,
      items: getSubItems('accessories'),
    },
    {
      name: t('bags'),
      href: `/${activeCategory}/bags`,
      items: getSubItems('bags'),
    },
    {
      name: t('jewelry'),
      href: `/${activeCategory}/jewelry`,
      items: getSubItems('jewelry'),
    },
    {
      name: t('brands'),
      href: `/${activeCategory}/brands`,
      items: [
        ...getBrandItems().firstRowBrands,
        ...getBrandItems().secondRowBrands,
        getBrandItems().viewAll,
      ],
      isBrands: true,
    },
    {
      name: t('guides'),
      href: '/guides',
    },
  ];

  const handleItemClick = (item: MenuItem, e: React.MouseEvent<HTMLElement>) => {
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

  const handleItemKeyDown = (item: MenuItem, e: React.KeyboardEvent<HTMLElement>) => {
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

  const handleBackClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setCurrentSubmenu(null);
  };

  const handleBackKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      setCurrentSubmenu(null);
    }
  };

  const handleSubItemClick = (subItem: SubMenuItem, e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    router.push(subItem.href);
    setIsMenuOpen(false);
  };

  const handleSubItemKeyDown = (subItem: SubMenuItem, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      router.push(subItem.href);
      setIsMenuOpen(false);
    }
  };

  const handleAlphabetClick = (item: AlphabetItem, e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    router.push(item.href);
    setIsMenuOpen(false);
  };

  const handleAlphabetKeyDown = (item: AlphabetItem, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === 'Space') {
      e.preventDefault();
      router.push(item.href);
      setIsMenuOpen(false);
    }
  };

  const renderAlphabetItem = (item: AlphabetItem) => (
    <Link
      key={item.href}
      className="flex items-center justify-center w-8 h-8 text-[#1A1A1A] dark:text-white hover:bg-[#F5F5F2] dark:hover:bg-gray-800 transition-colors text-sm"
      href={item.href}
      role="button"
      tabIndex={0}
      onClick={(e) => handleAlphabetClick(item, e)}
      onKeyDown={(e) => handleAlphabetKeyDown(item, e)}
    >
      {item.letter}
    </Link>
  );

  return (
    <>
      <div className="w-full bg-bg-secondary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark border-b border-border-primary-light dark:border-border-primary-dark hidden sm:block">
        <div className="container mx-auto px-4 flex justify-between items-center h-8">
          <div className="flex gap-6">
            <Link
              className={cn(
                "text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-text-primary-light dark:after:bg-text-primary-dark after:transition-all after:duration-300 hover:after:w-full",
                pathname?.startsWith('/women') && 'after:w-full'
              )}
              href="/women"
            >
              {t('women')}
            </Link>
            <Link
              className={cn(
                "text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-text-primary-light dark:after:bg-text-primary-dark after:transition-all after:duration-300 hover:after:w-full",
                pathname?.startsWith('/men') && 'after:w-full'
              )}
              href="/men"
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
      <HeroUINavbar
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
          {navigationItems.map((item) => (
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
              {item.items && item.isBrands ? (
                <div className="fixed left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-xs border-b border-border-primary-light dark:border-border-primary-dark">
                  <div className="w-full">
                    <div className="container mx-auto px-4 py-8">
                      <div className="flex gap-16">
                        <div className="w-3/4 pr-8 border-r border-border-primary-light dark:border-border-primary-dark">
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                              {t('popular_brands')}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                            <div className="flex flex-col gap-y-3">
                              {getBrandItems().firstRowBrands.map((brand) => (
                                <Link
                                  key={brand.href}
                                  className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap"
                                  href={brand.href}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleItemClick(item, e)}
                                  onKeyDown={(e) => handleItemKeyDown(item, e)}
                                >
                                  {brand.name}
                                </Link>
                              ))}
                            </div>
                            <div className="flex flex-col gap-y-3">
                              {getBrandItems().secondRowBrands.map((brand) => (
                                <Link
                                  key={brand.href}
                                  className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap"
                                  href={brand.href}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleItemClick(item, e)}
                                  onKeyDown={(e) => handleItemKeyDown(item, e)}
                                >
                                  {brand.name}
                                </Link>
                              ))}
                              <Link
                                className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm font-medium hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap underline underline-offset-4"
                                href={getBrandItems().viewAll.href}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => handleItemClick(item, e)}
                                onKeyDown={(e) => handleItemKeyDown(item, e)}
                              >
                                {getBrandItems().viewAll.name}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="w-1/4">
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                              {t('brands_a_z')}
                            </h3>
                          </div>
                          <div className="grid grid-cols-9 gap-1 p-4">
                            {getBrandItems().alphabet.map(renderAlphabetItem)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="absolute inset-0 px-4 flex items-center bg-bg-secondary-light dark:bg-bg-secondary-dark">
                <Input
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
                      onPointerDown={() => setIsSearchOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  }
                  placeholder={t('search.placeholder')}
                  startContent={
                    <Search className="h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                  }
                  type="search"
                />
              </div>
            ) : (
              <>
                <NavbarItem>
                  <Button
                    isIconOnly
                    aria-label={t('search.label')}
                    variant="light"
                    onPointerDown={() => setIsSearchOpen(true)}
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
                  navigationItems.map((item) => (
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
      </HeroUINavbar>
    </>
  );
};
