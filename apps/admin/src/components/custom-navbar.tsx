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
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Link, usePathname } from "@/i18n";

import { LanguageSwitcher } from "./language-switcher";

export function CustomNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations("layout");
  const pathname = usePathname();

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
        className="border-b-2 border-indigo-500  dark:border-default-800 bg-bg-primary-light dark:bg-bg-primary-dark after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-primary-500/30 after:to-transparent"
        maxWidth="full"
        height="20"
        isBordered
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            className="sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          <NavbarBrand>
            <Link
              href="/"
              className="font-bold text-xl text-primary-700 dark:text-primary-300"
            >
              {t("appName")}
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex gap-4 lg:gap-6 mx-6"
          justify="start"
        >
          {navItems.map((item) => (
            <NavbarItem key={item.href} isActive={item.active}>
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  item.active
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-default-600 dark:text-default-400 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent
          justify="end"
          className="ml-auto flex items-center space-x-4"
        >
          {/* 搜索框 */}
          <div className="hidden md:bloc">
            <Input
              type="search"
              placeholder={t("search")}
              size="sm"
              radius="full"
              variant="bordered"
              className="md:w-[200px] lg:w-[300px] border-default-300 dark:border-default-700 bg-default-50/50 dark:bg-default-900/50 backdrop-blur-sm bg-blue-500  "
              startContent={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-default-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              }
            />
          </div>

          {/* 语言切换 */}
          <LanguageSwitcher />

          {/* 主题切换 */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 backdrop-blur-sm"
            aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>

          {/* 用户导航 */}
          <Dropdown>
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                size="sm"
                className="transition-transform"
                src="/placeholder.svg?height=32&width=32"
                name={t("admin")}
                color="primary"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t("userMenu")} className="w-56">
              <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none">
                    {t("admin")}
                  </p>
                  <p className="text-xs text-default-500">{t("adminEmail")}</p>
                </div>
              </DropdownItem>
              <DropdownSection showDivider>
                <DropdownItem
                  key="profile"
                  shortcut={t("shortcutProfile")}
                  startContent={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  }
                >
                  {t("profile")}
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  shortcut={t("shortcutSettings")}
                  startContent={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  }
                >
                  {t("settings")}
                </DropdownItem>
              </DropdownSection>
              <DropdownItem
                key="logout"
                color="danger"
                shortcut={t("shortcutLogout")}
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                    />
                  </svg>
                }
              >
                {t("logout")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>

      {/* 移动端抽屉菜单 */}
      <Drawer
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        placement="left"
        size="xs"
        backdrop="blur"
      >
        <DrawerContent className="bg-bg-primary-light dark:bg-bg-primary-dark">
          <DrawerHeader className="border-b border-default-200 dark:border-default-800">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                {t("appName")}
              </span>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-md bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                  aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
                >
                  {theme === "dark" ? "🌞" : "🌙"}
                </button>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="py-6">
            <div className="mb-6">
              <Input
                type="search"
                placeholder={t("search")}
                size="sm"
                radius="full"
                variant="bordered"
                className="w-full border-default-300 dark:border-default-700 bg-default-50/50 dark:bg-default-900/50"
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-default-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                }
              />
            </div>
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-lg font-medium py-2 px-4 rounded-md transition-colors ${
                    item.active
                      ? "bg-primary-100 dark:bg-primary-800/30 text-primary-700 dark:text-primary-300"
                      : "text-default-600 dark:text-default-400 hover:bg-default-100 dark:hover:bg-default-800/30"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter className="border-t border-default-200 dark:border-default-800">
            <div className="flex items-center gap-3">
              <Avatar
                isBordered
                size="sm"
                src="/placeholder.svg?height=32&width=32"
                name={t("admin")}
                color="primary"
              />
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">{t("admin")}</p>
                <p className="text-xs text-default-500">{t("adminEmail")}</p>
              </div>
            </div>
            <Button
              color="danger"
              variant="flat"
              className="mt-4 w-full"
              startContent={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                  />
                </svg>
              }
            >
              {t("logout")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
