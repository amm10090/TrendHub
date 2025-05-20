"use client";

import { LogIn, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname, useRouter } from "@/i18n";

import { LanguageSwitcher } from "./language-switcher";

export function NavbarActions() {
  const t = useTranslations("layout");
  const { theme, setTheme } = useTheme();
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleDesktopSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDesktopSearchQuery(event.target.value);
    // TODO: Implement actual search logic if needed
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleSignIn = () => {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  return (
    <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
      {/* 搜索框 */}
      <div className="hidden md:block relative">
        <Input
          type="search"
          placeholder={t("search")}
          className="md:w-[180px] lg:w-[240px] h-9 rounded-full pl-8 pr-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 focus-visible:ring-primary-500"
          value={desktopSearchQuery}
          onChange={handleDesktopSearchChange}
        />
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
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

      {/* 用户导航或登录按钮 */}
      {status === "loading" && (
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full p-0"
          disabled
        >
          <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700 animate-pulse">
            <AvatarFallback className="bg-muted" />
          </Avatar>
        </Button>
      )}

      {status === "unauthenticated" && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-8 h-8"
                onClick={handleSignIn}
                aria-label={t("login")}
              >
                <LogIn size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("login")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {status === "authenticated" && session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                <AvatarImage
                  src={session.user.image || "/placeholder-user.jpg"}
                  alt={session.user.name || t("admin")}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(session.user.name || t("admin")).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name || t("admin")}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email || t("adminEmail")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings/account">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("profile")}</span>
                  <DropdownMenuShortcut>
                    {t("shortcutProfile")}
                  </DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("settings")}</span>
                  <DropdownMenuShortcut>
                    {t("shortcutSettings")}
                  </DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-300"
              onSelect={(event) => {
                event.preventDefault();
                handleSignOut();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("logout")}</span>
              <DropdownMenuShortcut>{t("shortcutLogout")}</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
