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

export const Navbar = () => {
  const t = useTranslations('nav');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'women' | 'men'>('women');

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

  const getBrandItems = () => {
    return {
      popularBrands: [
        { name: 'Balenciaga', href: `/${activeCategory}/brands/balenciaga` },
        { name: 'Bottega Veneta', href: `/${activeCategory}/brands/bottega-veneta` },
        { name: 'Chloé', href: `/${activeCategory}/brands/chloe` },
        { name: 'Ganni', href: `/${activeCategory}/brands/ganni` },
        { name: 'Gucci', href: `/${activeCategory}/brands/gucci` },
        { name: 'H&M', href: `/${activeCategory}/brands/h-and-m` },
        { name: 'Isabel Marant', href: `/${activeCategory}/brands/isabel-marant` },
        { name: '& Other Stories', href: `/${activeCategory}/brands/other-stories` },
        { name: 'Prada', href: `/${activeCategory}/brands/prada` },
        { name: 'Reformation', href: `/${activeCategory}/brands/reformation` },
        { name: 'Saint Laurent', href: `/${activeCategory}/brands/saint-laurent` },
      ],
      alphabet: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => ({
        letter,
        href: `/${activeCategory}/brands?letter=${letter}`,
      }))
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
      isBrands: true,
    },
    {
      name: t('guides'),
      href: '/guides',
    },
  ];

  return (
    <>
      <div className="w-full bg-[#FAF9F6] text-[#1A1A1A] border-b border-[#E8E6E3]">
        <div className="container mx-auto px-4 flex justify-between items-center h-8">
          <div className="flex gap-6">
            <Link
              href="/women"
              className={cn(
                "text-xs text-[#1A1A1A] hover:opacity-70 transition-opacity uppercase tracking-wider",
                activeCategory === 'women' && "font-medium"
              )}
              onPointerDown={() => setActiveCategory('women')}
            >
              {t('women')}
            </Link>
            <Link
              href="/men"
              className={cn(
                "text-xs text-[#1A1A1A] hover:opacity-70 transition-opacity uppercase tracking-wider",
                activeCategory === 'men' && "font-medium"
              )}
              onPointerDown={() => setActiveCategory('men')}
            >
              {t('men')}
            </Link>
          </div>
          <LanguageSwitch isSearchOpen={isSearchOpen} />
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
              {item.items && (
                <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-[#FAF9F6] shadow-sm border-t border-x border-[#E8E6E3] w-[180px]">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="block w-full px-4 py-[6px] text-sm hover:bg-[#F5F5F2] transition-colors"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {item.isBrands && (
                <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-[#FAF9F6] shadow-sm border-t border-x border-[#E8E6E3]">
                    <div className="w-[400px] p-6">
                      <div className="mb-8">
                        <h3 className="text-sm font-medium mb-3">Popular Brands</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          {getBrandItems().popularBrands.map((brand) => (
                            <Link
                              key={brand.href}
                              href={brand.href}
                              className="text-sm hover:opacity-70 transition-opacity"
                            >
                              {brand.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-3">Brands A-Z</h3>
                        <div className="grid grid-cols-6 gap-4">
                          {getBrandItems().alphabet.map((item) => (
                            <Link
                              key={item.letter}
                              href={item.href}
                              className="text-sm text-blue-600 hover:opacity-70 transition-opacity"
                            >
                              {item.letter}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    aria-label={t('wishlist')}
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
          hideCloseButton={false}
          classNames={{
            base: "w-[75vw] max-w-[400px] bg-[#FAF9F6]",
            wrapper: "bg-black/20",
          }}
        >
          <DrawerContent>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[#E8E6E3]">
                <span className="text-lg font-medium">{t('menu')}</span>
                <Button
                  isIconOnly
                  variant="light"
                  onPointerDown={() => setIsMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex gap-4 p-4 border-b border-[#E8E6E3]">
                <Link
                  href="/women"
                  className={cn(
                    "flex-1 text-center py-2 border rounded-md transition-colors",
                    activeCategory === 'women'
                      ? "border-black font-medium"
                      : "hover:bg-[#F5F5F2]"
                  )}
                  onPointerDown={() => setActiveCategory('women')}
                >
                  {t('women')}
                </Link>
                <Link
                  href="/men"
                  className={cn(
                    "flex-1 text-center py-2 border rounded-md transition-colors",
                    activeCategory === 'men'
                      ? "border-black font-medium"
                      : "hover:bg-[#F5F5F2]"
                  )}
                  onPointerDown={() => setActiveCategory('men')}
                >
                  {t('men')}
                </Link>
              </div>
              <div className="flex-1 overflow-auto">
                {navigationItems.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-3 px-4 border-b text-sm font-normal hover:bg-[#F5F5F2] transition-colors"
                      onPointerDown={() => !item.items && setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.items && <span className="text-gray-400">›</span>}
                      </div>
                    </Link>
                    {item.items && (
                      <div className="bg-[#F5F5F2]">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="block py-2 px-6 text-sm hover:bg-[#F5F5F2] transition-colors"
                            onPointerDown={() => setIsMenuOpen(false)}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-auto border-t">
                <div className="p-4">
                  <Button
                    className="w-full border border-black hover:bg-[#F5F5F2]"
                    startContent={<HeartIcon className="h-5 w-5" />}
                  >
                    {t('wishlist')}
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </HeroUINavbar>
    </>
  );
};
