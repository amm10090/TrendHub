"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Avatar,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Tooltip,
} from "@heroui/react";
import { Search, Moon, Sun, Settings, LogOut, User, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

import { Link, usePathname } from "@/i18n";

import { LanguageSwitcher } from "./language-switcher";

export function CustomNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations("layout");
  const pathname = usePathname();

  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: t("dashboard"), active: pathname === "/" },
    {
      href: "/products",
      label: t("products"),
      active: pathname.startsWith("/products"),
    },
    {
      href: "/brands",
      label: t("brand"),
      active: pathname.startsWith("/brands"),
    },
    {
      href: "/pages",
      label: t("pages"),
      active: pathname.startsWith("/pages"),
    },
    {
      href: "/settings",
      label: t("settings"),
      active: pathname.startsWith("/settings"),
    },
    { href: "/logs", label: t("logs"), active: pathname.startsWith("/logs") },
  ];

  return (
    <>
      <Navbar
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? "bg-white/80 dark:bg-gray-900/90 shadow-lg"
            : "bg-white/50 dark:bg-gray-900/50"
        }`}
        maxWidth="full"
        height="20"
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            className="sm:hidden text-primary-700 dark:text-primary-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            icon={<Menu size={24} />}
          />
          <NavbarBrand className="ml-0 sm:ml-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 text-white shadow-md">
                T
              </span>
              <span className="text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-700 to-primary-500 dark:from-primary-300 dark:to-primary-500 bg-clip-text ">
                {t("appName")}
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex gap-1 lg:gap-2 mx-4"
          justify="center"
        >
          {navItems.map((item) => (
            <NavbarItem key={item.href} isActive={item.active}>
              <Link
                href={item.href}
                className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                  item.active
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/30"
                }`}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent
          justify="end"
          className="ml-auto flex items-center space-x-1 sm:space-x-2"
        >
          {/* 搜索框 */}
          <div className="hidden md:block relative">
            <Input
              type="search"
              placeholder={t("search")}
              size="sm"
              radius="full"
              className="md:w-[180px] lg:w-[240px] border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shadow-inner"
              startContent={<Search size={16} className="text-gray-400" />}
            />
          </div>

          {/* 主题切换 */}
          <div className="flex items-center">
            <Tooltip
              content={theme === "dark" ? t("lightMode") : t("darkMode")}
            >
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="flat"
                size="sm"
                isIconOnly
                className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
            </Tooltip>
          </div>

          {/* 语言切换 */}
          <LanguageSwitcher />

          {/* 用户导航 */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="flat"
                className="p-0 rounded-full bg-transparent min-w-0 overflow-visible"
              >
                <Avatar
                  isBordered
                  size="sm"
                  className="transition-transform scale-100 hover:scale-105"
                  src="/placeholder.svg?height=32&width=32"
                  name={t("admin")}
                  color="primary"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={t("userMenu")}
              className="w-64 p-1 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl border border-gray-100 dark:border-gray-800"
              itemClasses={{
                base: "rounded-lg data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-800/70",
              }}
            >
              <DropdownItem
                key="user-info"
                isReadOnly
                className="h-16 gap-3 opacity-100"
              >
                <div className="flex flex-col">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {t("admin")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("adminEmail")}
                  </p>
                </div>
              </DropdownItem>
              <DropdownSection showDivider>
                <DropdownItem
                  key="profile"
                  shortcut={t("shortcutProfile")}
                  startContent={<User size={18} />}
                  className="py-2 text-gray-700 dark:text-gray-200"
                >
                  {t("profile")}
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  shortcut={t("shortcutSettings")}
                  startContent={<Settings size={18} />}
                  className="py-2 text-gray-700 dark:text-gray-200"
                >
                  {t("settings")}
                </DropdownItem>
              </DropdownSection>
              <DropdownItem
                key="logout"
                color="danger"
                shortcut={t("shortcutLogout")}
                startContent={<LogOut size={18} />}
                className="py-2 mt-1"
              >
                {t("logout")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>

      {/* 导航栏高度的占位符 */}
      <div className="h-20" />

      {/* 移动端抽屉菜单 */}
      <Drawer
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        placement="left"
        size="xs"
        backdrop="blur"
      >
        <DrawerContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          <DrawerHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 text-white shadow-md">
                  T
                </span>
                <span className="text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-700 to-primary-500 dark:from-primary-300 dark:to-primary-500 bg-clip-text ">
                  {t("appName")}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  variant="flat"
                  size="sm"
                  isIconOnly
                  className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
                <LanguageSwitcher />
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="px-4 py-6">
            <div className="mb-6">
              <Input
                type="search"
                placeholder={t("search")}
                size="sm"
                radius="full"
                variant="bordered"
                className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                startContent={<Search size={16} className="text-gray-400" />}
              />
            </div>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-base font-medium py-3 px-4 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-primary-50 dark:bg-primary-800/30 text-primary-700 dark:text-primary-300 shadow-sm font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                isBordered
                size="md"
                src="/placeholder.svg?height=40&width=40"
                name={t("admin")}
                color="primary"
                className="shadow-md"
              />
              <div className="flex flex-col">
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {t("admin")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("adminEmail")}
                </p>
              </div>
            </div>
            <Button
              color="danger"
              variant="flat"
              className="w-full rounded-xl py-6 font-medium"
              startContent={<LogOut size={18} />}
            >
              {t("logout")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
