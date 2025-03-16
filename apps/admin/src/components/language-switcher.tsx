"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
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
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="flat"
          size="sm"
          className="bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
        >
          {locale === "en" ? "🇺🇸" : "🇨🇳"} {t("language")}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={t("language")}>
        <DropdownItem
          key="en"
          startContent={<span>🇺🇸</span>}
          isSelected={locale === "en"}
          onClick={() => handleLocaleChange("en")}
        >
          English
        </DropdownItem>
        <DropdownItem
          key="cn"
          startContent={<span>🇨🇳</span>}
          isSelected={locale === "cn"}
          onClick={() => handleLocaleChange("cn")}
        >
          中文
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
