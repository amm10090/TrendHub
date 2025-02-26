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
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
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
import { Delete, X, Menu } from "lucide-react";
import { LanguageSwitch } from './language-switch';

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  name: string;
  href: string;
  items: SubMenuItem[];
}

export const Navbar = () => {
  const t = useTranslations('nav');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems: MenuItem[] = [
    {
      name: t('newArrivals'),
      href: '/new-arrivals',
      items: [
        { name: t('thisWeek'), href: '/new-arrivals/this-week' },
        { name: t('recentArrivals'), href: '/new-arrivals/recent' },
        { name: t('essentials'), href: '/new-arrivals/essentials' },
        { name: t('dressingSeason'), href: '/new-arrivals/dressing-season' },
        { name: t('partyEdit'), href: '/new-arrivals/party-edit' },
        { name: t('trendingNow'), href: '/new-arrivals/trending' },
      ],
    },
    {
      name: t('brands'),
      href: '/brands',
      items: [
        { name: 'Gucci', href: '/brands/gucci' },
        { name: 'Prada', href: '/brands/prada' },
        { name: 'Balenciaga', href: '/brands/balenciaga' },
        { name: 'Saint Laurent', href: '/brands/saint-laurent' },
        { name: 'Bottega Veneta', href: '/brands/bottega-veneta' },
      ],
    },
    {
      name: t('clothing'),
      href: '/clothing',
      items: [
        { name: t('dresses'), href: '/clothing/dresses' },
        { name: t('tops'), href: '/clothing/tops' },
        { name: t('knitwear'), href: '/clothing/knitwear' },
        { name: t('jackets'), href: '/clothing/jackets' },
        { name: t('pants'), href: '/clothing/pants' },
      ],
    },
    {
      name: t('shoes'),
      href: '/shoes',
      items: [
        { name: t('sneakers'), href: '/shoes/sneakers' },
        { name: t('boots'), href: '/shoes/boots' },
        { name: t('sandals'), href: '/shoes/sandals' },
      ],
    },
    {
      name: t('bags'),
      href: '/bags',
      items: [
        { name: t('totes'), href: '/bags/totes' },
        { name: t('crossbody'), href: '/bags/crossbody' },
        { name: t('clutches'), href: '/bags/clutches' },
      ],
    },
    {
      name: t('accessories'),
      href: '/accessories',
      items: [
        { name: t('belts'), href: '/accessories/belts' },
        { name: t('scarves'), href: '/accessories/scarves' },
        { name: t('sunglasses'), href: '/accessories/sunglasses' },
      ],
    },
    {
      name: t('jewelry'),
      href: '/jewelry',
      items: [
        { name: t('necklaces'), href: '/jewelry/necklaces' },
        { name: t('rings'), href: '/jewelry/rings' },
        { name: t('earrings'), href: '/jewelry/earrings' },
      ],
    },
    {
      name: t('gifts'),
      href: '/gifts',
      items: [
        { name: t('forHer'), href: '/gifts/for-her' },
        { name: t('forHim'), href: '/gifts/for-him' },
        { name: t('luxury'), href: '/gifts/luxury' },
      ],
    },
    {
      name: t('sale'),
      href: '/sale',
      items: [
        { name: t('clothing'), href: '/sale/clothing' },
        { name: t('shoes'), href: '/sale/shoes' },
        { name: t('bags'), href: '/sale/bags' },
      ],
    },
  ];

  return (
    <HeroUINavbar
      isBordered
      classNames={{
        wrapper: "px-4 max-w-full",
      }}
    >
      <NavbarContent className="sm:hidden">
        <Menu
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsMenuOpen(true)}
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
        className="hidden sm:flex gap-4"
        justify="center"
      >
        {navigationItems.map((item) => (
          <NavbarItem key={item.href} className="group relative">
            <Link
              href={item.href}
              className="text-sm py-2 px-3 hover:bg-default-100 rounded-lg transition-colors"
            >
              {item.name}
            </Link>
            <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-background shadow-lg rounded-lg min-w-[200px] py-2">
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className="block w-full px-4 py-2 text-sm hover:bg-default-100 transition-colors"
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            </div>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <div className="hidden sm:flex">
          <NavbarItem>
            <LanguageSwitch isSearchOpen={isSearchOpen} />
          </NavbarItem>
        </div>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="absolute inset-0 px-4 flex items-center bg-background/70 backdrop-blur-md">
              <Input
                aria-label={t('search.label')}
                classNames={{
                  base: "w-full",
                  input: "text-small",
                  inputWrapper: "h-10 bg-default-100/50",
                }}
                endContent={
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    aria-label={t('search.close')}
                    onClick={() => setIsSearchOpen(false)}
                    className="text-default-400 hover:text-default-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
                placeholder={t('search.placeholder')}
                startContent={<SearchIcon className="h-4 w-4 text-default-400" />}
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
                  onClick={() => setIsSearchOpen(true)}
                >
                  <SearchIcon className="h-5 w-5" />
                </Button>
              </NavbarItem>
              <NavbarItem className="hidden sm:flex">
                <Button
                  isIconOnly
                  variant="light"
                  aria-label="用户"
                >
                  <UserIcon className="h-5 w-5" />
                </Button>
              </NavbarItem>
              <NavbarItem className="hidden sm:flex">
                <Button
                  isIconOnly
                  variant="light"
                  aria-label="收藏"
                >
                  <HeartIcon className="h-5 w-5" />
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button
                  isIconOnly
                  variant="light"
                  aria-label="购物车"
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
          base: "bg-black w-[75vw] max-w-[400px]",
          wrapper: "bg-black/20",
        }}
      >
        <DrawerContent>
          <div className="flex flex-col h-full bg-black text-white">
            <div className="flex items-center justify-between p-6">
              <span className="text-xl font-medium">{t('menu')}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-4 px-6 border-b border-white/10 text-base font-normal text-white hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    {item.name}
                    <span className="text-white/60">›</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-auto">
              <div className="px-6 py-4">
                <Button
                  className="w-full bg-white text-black hover:bg-white/90"
                  startContent={<HeartIcon className="h-5 w-5" />}
                >
                  {t('wishlist')}
                </Button>
              </div>
              <div className="px-6 py-4 border-t border-white/10">
                <LanguageSwitch />
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </HeroUINavbar>
  );
};
