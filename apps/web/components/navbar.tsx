'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import {
  Drawer,
  DrawerContent,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
} from "@/components/icons";
import { Menu, X } from "lucide-react";
import { LanguageSwitch } from './language-switch';
import { cn } from "@/lib/utils";
import { Skeleton } from "@heroui/skeleton";
import { useRouter } from 'next/navigation';
import { Tabs, Tab } from "@heroui/tabs";

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

export const Navbar = () => {
  const t = useTranslations('nav');
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'women' | 'men'>('women');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
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
      { name: t('popular_brand_names.balenciaga'), href: `/${activeCategory}/brands/balenciaga` },
      { name: t('popular_brand_names.bottega_veneta'), href: `/${activeCategory}/brands/bottega-veneta` },
      { name: t('popular_brand_names.chloe'), href: `/${activeCategory}/brands/chloe` },
      { name: t('popular_brand_names.ganni'), href: `/${activeCategory}/brands/ganni` },
      { name: t('popular_brand_names.gucci'), href: `/${activeCategory}/brands/gucci` },
      { name: t('popular_brand_names.h_and_m'), href: `/${activeCategory}/brands/h-and-m` },
      { name: t('popular_brand_names.isabel_marant'), href: `/${activeCategory}/brands/isabel-marant` },
      { name: t('popular_brand_names.other_stories'), href: `/${activeCategory}/brands/other-stories` },
      { name: t('popular_brand_names.prada'), href: `/${activeCategory}/brands/prada` },
      { name: t('popular_brand_names.saint_laurent'), href: `/${activeCategory}/brands/saint-laurent` }
    ];

    const secondRowBrands = [
      { name: t('popular_brand_names.reformation'), href: `/${activeCategory}/brands/reformation` },
      { name: t('popular_brand_names.valentino'), href: `/${activeCategory}/brands/valentino` },
      { name: t('popular_brand_names.zara'), href: `/${activeCategory}/brands/zara` },
      { name: t('popular_brand_names.tory_burch'), href: `/${activeCategory}/brands/tory-burch` }
    ];

    return {
      firstRowBrands,
      secondRowBrands,
      viewAll: { name: t('view_all_brands'), href: `/${activeCategory}/brands` },
      alphabet: [
        ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => ({
          letter,
          href: `/${activeCategory}/brands?letter=${letter.toLowerCase()}`,
        })),
        {
          letter: '0-9',
          href: `/${activeCategory}/brands?letter=0-9`,
        }
      ]
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
      items: [...getBrandItems().firstRowBrands, ...getBrandItems().secondRowBrands, getBrandItems().viewAll],
      isBrands: true,
    },
    {
      name: t('guides'),
      href: '/guides',
    },
  ];

  const handleMenuItemClick = (item: MenuItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.items) {
      setExpandedItem(expandedItem === item.href ? null : item.href);
    } else {
      router.push(item.href);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <div className="w-full bg-[#FAF9F6] text-[#1A1A1A] border-b border-[#E8E6E3] hidden sm:block">
        <div className="container mx-auto px-4 flex justify-between items-center h-8">
          <div className="flex gap-6">
            <Link
              href="/women"
              className={cn(
                "text-sm font-medium text-[#1A1A1A] hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-black after:transition-all after:duration-300 hover:after:w-full",
                activeCategory === 'women' && "after:w-full"
              )}
            >
              {t('women')}
            </Link>
            <Link
              href="/men"
              className={cn(
                "text-sm font-medium text-[#1A1A1A] hover:opacity-70 transition-all duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-black after:transition-all after:duration-300 hover:after:w-full",
                activeCategory === 'men' && "after:w-full"
              )}
            >
              {t('men')}
            </Link>
          </div>
          <div className="flex items-center">
            <LanguageSwitch isSearchOpen={isSearchOpen} />
          </div>
        </div>
      </div>
      <HeroUINavbar
        isBordered
        classNames={{
          wrapper: "px-4 max-w-full h-16",
          base: "bg-[#FAF9F6] text-[#1A1A1A] border-[#E8E6E3]"
        }}
      >
        <NavbarContent className="sm:hidden">
          <Menu
            className="h-6 w-6 cursor-pointer"
            onPointerDown={() => setIsMenuOpen(true)}
          />
        </NavbarContent>

        <NavbarContent>
          <NavbarBrand>
            <Link href="/" className="font-bold text-inherit">
              TrendHub
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex gap-8"
          justify="center"
        >
          {navigationItems.map((item) => (
            <NavbarItem key={item.href} className="group relative">
              <Link
                href={item.href}
                className="text-sm text-[#1A1A1A] py-2 hover:opacity-70 transition-opacity"
              >
                {item.name}
              </Link>
              {item.items && item.isBrands ? (
                <div className="fixed left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-[#FAF9F6] shadow-sm border-b border-[#E8E6E3]">
                  <div className="w-full">
                    <div className="container mx-auto px-4 py-8">
                      <div className="flex gap-16">
                        <div className="w-3/4 pr-8 border-r border-[#E8E6E3]">
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-[#666666] uppercase tracking-wider">{t('popular_brands')}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                            <div className="space-y-3">
                              {getBrandItems().firstRowBrands.map((brand) => (
                                <Link
                                  key={brand.href}
                                  href={brand.href}
                                  className="block text-[#1A1A1A] hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded whitespace-nowrap"
                                >
                                  {brand.name}
                                </Link>
                              ))}
                            </div>
                            <div className="space-y-3">
                              {getBrandItems().secondRowBrands.map((brand) => (
                                <Link
                                  key={brand.href}
                                  href={brand.href}
                                  className="block text-[#1A1A1A] hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded whitespace-nowrap"
                                >
                                  {brand.name}
                                </Link>
                              ))}
                              <Link
                                href={getBrandItems().viewAll.href}
                                className="block text-[#1A1A1A] hover:opacity-70 transition-all duration-200 text-sm font-medium hover:shadow-md hover:translate-y-[-2px] p-2 rounded whitespace-nowrap underline underline-offset-4"
                              >
                                {getBrandItems().viewAll.name}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="w-1/4">
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-[#666666] uppercase tracking-wider">{t('brands_a_z')}</h3>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {getBrandItems().alphabet.map((item) => (
                              <Link
                                key={item.letter}
                                href={item.href}
                                className="flex items-center justify-center w-8 h-8 text-[#1A1A1A] hover:bg-[#F5F5F2] transition-colors text-sm"
                              >
                                {item.letter}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : item.items ? (
                <div className="fixed left-0 right-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-[#FAF9F6] shadow-sm border-b border-[#E8E6E3]">
                  <div className="w-full">
                    <div className="container mx-auto px-4 py-8">
                      <div className="grid grid-cols-4 gap-8">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="text-sm text-[#1A1A1A] hover:opacity-70 transition-opacity"
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
              <div className="absolute inset-0 px-4 flex items-center bg-[#FAF9F6]">
                <Input
                  aria-label={t('search.label')}
                  classNames={{
                    base: "w-full",
                    input: "text-small",
                    inputWrapper: "h-10 bg-[#F5F5F2] border-[#E8E6E3]",
                  }}
                  endContent={
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      aria-label={t('search.close')}
                      onPointerDown={() => setIsSearchOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  }
                  placeholder={t('search.placeholder')}
                  startContent={<SearchIcon className="h-4 w-4 text-gray-500" />}
                  type="search"
                />
              </div>
            ) : (
              <>
                <NavbarItem>
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label={t('search.label')}
                    onPointerDown={() => setIsSearchOpen(true)}
                  >
                    <SearchIcon className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label={t('account')}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label={t('wishlist')}
                  >
                    <HeartIcon className="h-5 w-5" />
                  </Button>
                </NavbarItem>
                <NavbarItem>
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label={t('cart')}
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                  </Button>
                </NavbarItem>
              </>
            )}
          </div>
        </NavbarContent>

        <Drawer
          isOpen={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          placement="left"
          hideCloseButton={true}
          classNames={{
            base: "w-[85vw] max-w-[400px] bg-[#FAF9F6]",
            wrapper: "bg-black/20",
          }}
        >
          <DrawerContent>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[#E8E6E3]">
                <Tabs
                  selectedKey={activeCategory}
                  onSelectionChange={(key) => setActiveCategory(key as 'women' | 'men')}
                  variant="solid"
                  fullWidth
                  classNames={{
                    base: "w-full",
                    tabList: "gap-0",
                    tab: "h-11 data-[selected=true]:bg-black data-[selected=true]:text-white data-[selected=false]:bg-[#F5F5F2] data-[selected=false]:text-[#666666]",
                    tabContent: "text-base font-normal group-data-[selected=true]:text-white group-data-[selected=false]:text-[#666666]",
                    cursor: "hidden",
                  }}
                >
                  <Tab key="women" title={t('women')} />
                  <Tab key="men" title={t('men')} />
                </Tabs>
                <Button
                  isIconOnly
                  variant="light"
                  onPointerDown={() => setIsMenuOpen(false)}
                  className="ml-4"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                {currentSubmenu ? (
                  <div>
                    <div
                      className="flex items-center gap-2 p-4 border-b border-[#E8E6E3] cursor-pointer text-base"
                      onClick={() => setCurrentSubmenu(null)}
                    >
                      <span className="rotate-180">›</span>
                      <span>{currentSubmenu.name}</span>
                    </div>
                    <div>
                      {currentSubmenu.items.map((subItem: SubMenuItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="block py-3 px-4 border-b text-[#666666] hover:bg-[#F5F5F2] transition-colors text-base"
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push(subItem.href);
                          }}
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
                      className="block py-3 px-4 border-b text-base hover:bg-[#F5F5F2] transition-colors cursor-pointer"
                      onClick={() => {
                        if (item.items) {
                          setCurrentSubmenu({
                            name: item.name,
                            items: item.items
                          });
                        } else {
                          router.push(item.href);
                          setIsMenuOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.items && <span className="text-[#666666]">›</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto border-t border-[#E8E6E3]">
                <div className="p-4">
                  <Button
                    className="w-full border border-black hover:bg-[#F5F5F2] mb-4 text-base"
                    startContent={<HeartIcon className="h-5 w-5" />}
                  >
                    {t('wishlist')}
                  </Button>
                  <div className="flex justify-center">
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
