"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
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
    // 使用replace而不是push，避免浏览器历史堆积
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          isIconOnly
          className="rounded-full bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 backdrop-blur-sm"
          aria-label={t("language")}
        >
          {locale === "en" ? "🇺🇸" : "🇨🇳"}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t("language")}
        className="min-w-[120px]"
        variant="shadow"
        selectionMode="single"
        selectedKeys={new Set([locale])}
        disallowEmptySelection
        itemClasses={{
          base: "data-[hover=true]:bg-primary-100 dark:data-[hover=true]:bg-primary-800/40",
          title: "text-primary-700 dark:text-primary-300 font-medium",
          description: "text-default-500",
        }}
      >
        <DropdownItem
          key="en"
          startContent={<span className="text-lg">🇺🇸</span>}
          description="English"
          onClick={() => handleLocaleChange("en")}
          className="py-2"
        >
          English
        </DropdownItem>
        <DropdownItem
          key="cn"
          startContent={<span className="text-lg">🇨🇳</span>}
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
