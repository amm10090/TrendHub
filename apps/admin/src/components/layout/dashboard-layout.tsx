"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  Server,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n";
import { Link } from "@/i18n";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, title, href, isActive }: SidebarItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground/80",
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // 使用翻译
  const t = useTranslations("layout");

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  // 语言切换函数
  const changeLanguage = (locale: string) => {
    router.push(pathname, { locale });
  };

  const navItems = [
    {
      title: t("dashboard"),
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: t("products"),
      href: "/products",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: t("servers"),
      href: "/servers",
      icon: <Server className="h-5 w-5" />,
    },
    {
      title: t("brand"),
      href: "/brand",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: t("pages"),
      href: "/pages",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: t("logs"),
      href: "/logs",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: t("settings"),
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* 移动设备导航栏 */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">{t("openMenu")}</span>
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            TrendHub Admin
          </Link>
          <div className="flex items-center gap-2">
            {/* 语言切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("cn")}>
                  中文
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background transition-transform md:translate-x-0 md:border-r md:bg-transparent md:static md:w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-auto">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              TrendHub Admin
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t("closeMenu")}</span>
            </Button>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                title={item.title}
                href={item.href}
                isActive={pathname.endsWith(item.href)}
              />
            ))}
          </nav>
          <div className="mt-auto border-t p-4">
            {/* 语言切换 - 桌面版 */}
            <div className="hidden md:flex justify-between mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => changeLanguage("en")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage("cn")}>
                    中文
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">A</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t("admin")}</p>
                <p className="text-xs text-muted-foreground">
                  admin@trendhub.com
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 p-4 md:p-6 md:ml-64">{children}</main>
    </div>
  );
}
