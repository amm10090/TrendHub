"use client";

import { LogOut, Menu, Search, Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
      href: "/content-management",
      label: t("contentManagement"),
      active: pathname.startsWith("/content-management"),
    },
    {
      href: "/settings",
      label: t("settings"),
      active: pathname.startsWith("/settings"),
    },
    {
      href: "/scraper-management",
      label: t("scraperManagement"),
      active: pathname.startsWith("/scraper-management"),
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md h-16 flex items-center border-b ${
          scrolled
            ? "bg-white/80 dark:bg-gray-950/80 border-gray-200 dark:border-gray-800 shadow-sm"
            : "bg-white/50 dark:bg-gray-950/50 border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <div className="flex items-center">
              <SheetTrigger asChild className="sm:hidden mr-2">
                <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
                  <Menu size={24} />
                </Button>
              </SheetTrigger>

              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl"
              >
                <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 text-white shadow-md">
                  T
                </span>
                <span className="text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-700 to-primary-500 dark:from-primary-300 dark:to-primary-500 bg-clip-text">
                  {t("appName")}
                </span>
              </Link>
            </div>

            <div className="hidden sm:flex flex-grow justify-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        href={item.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "text-sm font-medium",
                          item.active
                            ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/30",
                          "rounded-full px-3 py-2",
                        )}
                        asChild
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <NavbarActions />

            <SheetContent
              side="left"
              className="w-72 p-0 flex flex-col bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800"
            >
              <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 text-white shadow-md">
                      T
                    </span>
                    <span className="text-primary-700 dark:text-primary-300">
                      {t("appName")}
                    </span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() =>
                              setTheme(theme === "dark" ? "light" : "dark")
                            }
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-8 h-8"
                          >
                            {theme === "dark" ? (
                              <Sun size={16} />
                            ) : (
                              <Moon size={16} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
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
                <div className="p-4 space-y-4">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder={t("search")}
                      className="h-9 rounded-full pl-8 pr-3 w-full bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 focus-visible:ring-primary-500"
                      value={mobileSearchQuery}
                      onChange={handleMobileSearchChange}
                    />
                    <Search
                      size={16}
                      className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "text-base font-medium py-3 px-4 rounded-xl transition-colors duration-200 block",
                            item.active
                              ? "bg-primary-50 dark:bg-primary-800/30 text-primary-700 dark:text-primary-300 font-semibold"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30",
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </ScrollArea>

              <Separator className="bg-gray-200 dark:bg-gray-800" />

              <SheetFooter className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4 w-full">
                  <ShadcnAvatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                    <AvatarImage
                      src="/placeholder.svg?height=40&width=40"
                      alt={t("admin")}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {t("admin").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </ShadcnAvatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                      {t("admin")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {t("adminEmail")}
                    </p>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="destructive"
                    className="w-full rounded-xl py-3 font-medium"
                  >
                    <LogOut size={18} className="mr-2" />
                    {t("logout")}
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
