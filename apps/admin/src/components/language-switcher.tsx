"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "@/i18n";

export function LanguageSwitcher() {
  const t = useTranslations("layout");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as "en" | "cn" });
  };

  const currentLanguageLabel = locale === "en" ? "🇺🇸" : "🇨🇳";
  const currentLanguageDesc = locale === "en" ? "English" : "中文";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-8 h-8"
                aria-label={t("language")}
              >
                <span className="text-base leading-none">
                  {currentLanguageLabel}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onClick={() => handleLocaleChange("en")}
                className="cursor-pointer"
              >
                <span className="text-lg mr-2">🇺🇸</span>
                <div className="flex flex-col">
                  <span>English</span>
                  <span className="text-xs text-muted-foreground">English</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLocaleChange("cn")}
                className="cursor-pointer"
              >
                <span className="text-lg mr-2">🇨🇳</span>
                <div className="flex flex-col">
                  <span>中文</span>
                  <span className="text-xs text-muted-foreground">Chinese</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {t("language")}: {currentLanguageDesc}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
