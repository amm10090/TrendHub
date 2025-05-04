"use client";

import { LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Shadcn UI Avatar
import { Button } from "@/components/ui/button"; // Shadcn UI Button
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Shadcn UI DropdownMenu
import { Input } from "@/components/ui/input"; // Shadcn UI Input
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Shadcn UI Tooltip

import { LanguageSwitcher } from "./language-switcher"; // 已重构的语言切换器

export function NavbarActions() {
  const t = useTranslations("layout");
  const { theme, setTheme } = useTheme();

  return (
    <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
      {/* 搜索框 */}
      <div className="hidden md:block relative">
        <Input
          type="search"
          placeholder={t("search")}
          className="md:w-[180px] lg:w-[240px] h-9 rounded-full pl-8 pr-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 focus-visible:ring-primary-500" // 调整样式
          // startContent prop 不适用于 Shadcn Input, 使用绝对定位图标
        />
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" // 图标定位
        />
      </div>

      {/* 主题切换 */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8"
              aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{theme === "dark" ? t("lightMode") : t("darkMode")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 语言切换 */}
      <LanguageSwitcher />

      {/* 用户导航 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0" // 调整按钮样式
          >
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              {/* 添加边框 */}
              <AvatarImage
                src="/placeholder.svg?height=32&width=32" // Shadcn Avatar 使用 src
                alt={t("admin")}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {/* 回退样式 */}
                {t("admin").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{t("admin")}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {t("adminEmail")}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>{t("profile")}</span>
              <DropdownMenuShortcut>
                {t("shortcutProfile")}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("settings")}</span>
              <DropdownMenuShortcut>
                {t("shortcutSettings")}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-300">
            {/* 危险操作样式 */}
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("logout")}</span>
            <DropdownMenuShortcut>{t("shortcutLogout")}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
