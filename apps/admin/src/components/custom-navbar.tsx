"use client";

import { LogOut, Menu, Search, Sun, Moon, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname } from "@/i18n";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./language-switcher";
import { NavbarActions } from "./navbar-actions";

export function CustomNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const t = useTranslations("layout");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setMobileSearchQuery(event.target.value);
    // TODO: Implement actual search logic if needed
  };

  // 核心导航项 - 在桌面版始终显示
  const coreNavItems = [
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
      href: "/discounts",
      label: t("discounts"),
      active: pathname.startsWith("/discounts"),
    },
    {
      href: "/settings",
      label: t("settings"),
      active: pathname.startsWith("/settings"),
    },
  ];

  // 所有导航项 - 在移动侧边栏中显示
  const allNavItems = [
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
      href: "/content-management",
      label: t("contentManagement"),
      active: pathname.startsWith("/content-management"),
    },
    {
      href: "/discounts",
      label: t("discounts"),
      active: pathname.startsWith("/discounts"),
    },
    {
      href: "/scraper-management",
      label: t("scraperManagement"),
      active: pathname.startsWith("/scraper-management"),
    },
    {
      href: "/settings",
      label: t("settings"),
      active: pathname.startsWith("/settings"),
    },
  ];

  // 额外的导航项 - 在桌面版的"更多"下拉菜单中显示
  const extraNavItems = allNavItems.filter(
    (item) => !coreNavItems.some((coreItem) => coreItem.href === item.href),
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-xl h-16 flex items-center border-b ${
          scrolled
            ? "bg-white/90 dark:bg-gray-950/90 border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-black/5 dark:shadow-black/20"
            : "bg-white/70 dark:bg-gray-950/70 border-white/20 dark:border-gray-800/20"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <div className="flex items-center">
              <SheetTrigger asChild className="lg:hidden mr-2">
                <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
                  <Menu size={24} />
                </Button>
              </SheetTrigger>

              <Link
                href="/"
                className="flex items-center gap-3 font-bold text-xl group transition-all duration-300 hover:scale-105"
              >
                <div className="relative hidden sm:flex">
                  <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:-rotate-3">
                    T
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-lg transition-all duration-300 group-hover:blur-xl" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 dark:from-gray-100 dark:via-blue-200 dark:to-purple-300 bg-clip-text text-transparent font-extrabold tracking-tight transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600">
                  {t("appName")}
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex flex-grow justify-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {coreNavItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        href={item.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "text-xs lg:text-sm font-medium transition-all duration-300 relative group",
                          item.active
                            ? "bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-blue-950/50 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-200/50 dark:ring-blue-800/50 backdrop-blur-sm"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/50 hover:to-gray-50 dark:hover:from-gray-800/30 dark:hover:via-blue-900/20 dark:hover:to-gray-800/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm hover:ring-1 hover:ring-gray-200/50 dark:hover:ring-gray-700/50",
                          "rounded-xl px-2 lg:px-3 py-1.5 lg:py-2 backdrop-blur-sm",
                        )}
                        asChild
                      >
                        <Link
                          href={item.href}
                          className="relative flex items-center"
                        >
                          <span className="relative">
                            {item.label}
                            {item.active && (
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 blur-sm -z-10" />
                            )}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              {/* 更多菜单下拉 - 显示额外的导航项 */}
              {extraNavItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-xl transition-all duration-300 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/50 hover:to-gray-50 dark:hover:from-gray-800/30 dark:hover:via-blue-900/20 dark:hover:to-gray-800/30 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <MoreHorizontal size={16} />
                      <span className="ml-1 hidden xl:inline">{t("more")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {extraNavItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center w-full px-2 py-2 text-sm",
                            item.active
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300",
                          )}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <NavbarActions />

            <SheetContent
              side="left"
              className="w-80 p-0 flex flex-col bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 shadow-2xl shadow-black/10 dark:shadow-black/30"
            >
              <SheetHeader className="p-6 border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-950/30">
                <div className="flex justify-between items-center">
                  <Link
                    href="/"
                    className="flex items-center gap-3 font-bold text-xl group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="relative">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:-rotate-6">
                        T
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 to-purple-500/30 blur-lg transition-all duration-300 group-hover:blur-xl -z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 dark:from-gray-100 dark:via-blue-200 dark:to-purple-300 bg-clip-text text-transparent font-extrabold tracking-tight">
                      {t("appName")}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() =>
                              setTheme(theme === "dark" ? "light" : "dark")
                            }
                            variant="ghost"
                            size="icon"
                            className="rounded-xl w-9 h-9 bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-900/50 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50"
                          >
                            {theme === "dark" ? (
                              <Sun size={16} className="text-amber-500" />
                            ) : (
                              <Moon size={16} className="text-blue-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-gray-900/90 text-white border-gray-700"
                        >
                          <p>
                            {theme === "dark" ? t("lightMode") : t("darkMode")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <LanguageSwitcher />
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="relative group">
                    <Input
                      type="search"
                      placeholder={t("search")}
                      className="h-11 rounded-2xl pl-11 pr-4 w-full bg-gradient-to-r from-gray-50/90 via-blue-50/50 to-gray-50/90 dark:from-gray-800/90 dark:via-blue-900/30 dark:to-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 focus-visible:border-blue-300 dark:focus-visible:border-blue-600 shadow-sm focus-visible:shadow-md transition-all duration-300 backdrop-blur-sm"
                      value={mobileSearchQuery}
                      onChange={handleMobileSearchChange}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors duration-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
                      <Search size={18} />
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {allNavItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "text-base font-medium py-4 px-5 rounded-2xl transition-all duration-300 block relative group overflow-hidden",
                            item.active
                              ? "bg-gradient-to-r from-blue-50 via-purple-50/80 to-blue-50 dark:from-blue-950/60 dark:via-purple-950/40 dark:to-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-200/50 dark:ring-blue-800/30 backdrop-blur-sm"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 dark:hover:from-gray-800/50 dark:hover:via-blue-900/20 dark:hover:to-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md hover:ring-1 hover:ring-gray-200/30 dark:hover:ring-gray-700/30 hover:scale-[1.02]",
                          )}
                        >
                          <div className="relative">
                            <div className="relative z-10 flex items-center gap-3">
                              {item.label}
                              {item.active && (
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm animate-pulse" />
                              )}
                            </div>
                            {item.active && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-blue-400/10 rounded-2xl blur-sm" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                          </div>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </ScrollArea>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-6" />

              <SheetFooter className="p-6 bg-gradient-to-br from-gray-50/30 via-blue-50/10 to-gray-50/30 dark:from-gray-900/30 dark:via-blue-950/10 dark:to-gray-900/30">
                <div className="flex items-center gap-4 mb-6 w-full p-4 rounded-2xl bg-gradient-to-r from-white/60 via-blue-50/40 to-white/60 dark:from-gray-800/60 dark:via-blue-900/20 dark:to-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
                  <div className="relative">
                    <ShadcnAvatar className="h-12 w-12 ring-2 ring-blue-200/50 dark:ring-blue-800/30 shadow-lg">
                      <AvatarImage
                        src="/placeholder.svg?height=48&width=48"
                        alt={t("admin")}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                        {t("admin").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </ShadcnAvatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50 truncate">
                      {t("admin")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate bg-gradient-to-r from-gray-600 to-blue-600 dark:from-gray-400 dark:to-blue-400 bg-clip-text ">
                      {t("adminEmail")}
                    </p>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="destructive"
                    className="w-full rounded-2xl py-4 font-semibold text-base bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/25 dark:shadow-red-500/40 ring-1 ring-red-400/20 dark:ring-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
                  >
                    <span className="flex items-center">
                      <LogOut size={20} className="mr-3" />
                      {t("logout")}
                    </span>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="h-16" />
    </>
  );
}
