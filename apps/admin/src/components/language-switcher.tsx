"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
} from "@heroui/react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n";

export function LanguageSwitcher() {
  const t = useTranslations("layout");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // 使用正确的路由切换方法
    router.replace(pathname, { locale: newLocale as "en" | "cn" });
  };

  return (
    <Dropdown placement="bottom-end">
      <Tooltip content={t("language")}>
        <DropdownTrigger>
          <Button
            variant="flat"
            size="sm"
            isIconOnly
            className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label={t("language")}
          >
            <span className="text-base leading-none">
              {locale === "en" ? "🇺🇸" : "🇨🇳"}
            </span>
          </Button>
        </DropdownTrigger>
      </Tooltip>
      <DropdownMenu
        aria-label={t("language")}
        className="min-w-[160px] p-1 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border border-gray-100 dark:border-gray-800"
        variant="shadow"
        selectionMode="single"
        selectedKeys={new Set([locale])}
        disallowEmptySelection
        itemClasses={{
          base: "rounded-lg data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-800/70",
          title: "text-gray-700 dark:text-gray-200 font-medium",
          description: "text-gray-500 dark:text-gray-400",
        }}
      >
        <DropdownItem
          key="en"
          startContent={<span className="text-lg mr-1">🇺🇸</span>}
          description="English"
          onClick={() => handleLocaleChange("en")}
          className="py-2"
        >
          English
        </DropdownItem>
        <DropdownItem
          key="cn"
          startContent={<span className="text-lg mr-1">🇨🇳</span>}
          description="Chinese"
          onClick={() => handleLocaleChange("cn")}
          className="py-2"
        >
          中文
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
