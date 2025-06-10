import * as TablerIcons from "@tabler/icons-react";
import * as React from "react";

// 导出的 icon 类型
export type IconName = keyof typeof TablerIcons;

// 常用的 icon 分类
export interface IconCategory {
  name: string;
  label: string;
  description: string;
  icons: string[];
}

// 预定义的常用 icon 分类
export const iconCategories: IconCategory[] = [
  {
    name: "business",
    label: "商业",
    description: "商业和电商相关图标",
    icons: [
      "IconShoppingCart",
      "IconShoppingBag",
      "IconCreditCard",
      "IconCoin",
      "IconReceipt",
      "IconBuildingStore",
      "IconTruck",
      "IconPackage",
      "IconGift",
      "IconDiscount",
      "IconPercentage",
      "IconChartLine",
      "IconTrendingUp",
      "IconCurrency",
    ],
  },
  {
    name: "security",
    label: "安全保障",
    description: "安全和保障相关图标",
    icons: [
      "IconShield",
      "IconShieldCheck",
      "IconLock",
      "IconKey",
      "IconCertificate",
      "IconMedal",
      "IconBadge",
      "IconStar",
      "IconThumbUp",
      "IconHeart",
      "IconEye",
      "IconUserCheck",
      "IconVerified",
      "IconAward",
    ],
  },
  {
    name: "service",
    label: "服务支持",
    description: "客户服务和支持相关图标",
    icons: [
      "IconHeadphones",
      "IconPhone",
      "IconMail",
      "IconMessageCircle",
      "IconHelp",
      "IconQuestionMark",
      "IconTool",
      "IconSettings",
      "IconClock",
      "IconCalendar",
      "IconMapPin",
      "IconWorld",
      "IconRefresh",
      "IconRepeat",
    ],
  },
  {
    name: "delivery",
    label: "配送物流",
    description: "配送和物流相关图标",
    icons: [
      "IconTruck",
      "IconPackage",
      "IconBox",
      "IconPlane",
      "IconShip",
      "IconMapPin",
      "IconRoute",
      "IconClock",
      "IconCalendar",
      "IconHome",
      "IconBuilding",
      "IconWorld",
      "IconTarget",
      "IconCheck",
    ],
  },
];

// 获取所有 icon 名称
export function getAllIconNames(): string[] {
  return Object.keys(TablerIcons).filter((key) => key.startsWith("Icon"));
}

// 搜索 icons
export function searchIcons(searchTerm: string): string[] {
  const allIcons = getAllIconNames();

  if (!searchTerm.trim()) {
    return allIcons.slice(0, 50); // 限制显示数量
  }

  const term = searchTerm.toLowerCase();
  return allIcons
    .filter(
      (iconName) =>
        iconName.toLowerCase().includes(term) ||
        iconName
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()
          .includes(term),
    )
    .slice(0, 50);
}

// 获取 icon 组件
export function getIconComponent(
  iconName: string,
): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  const IconComponent = (
    TablerIcons as unknown as Record<
      string,
      React.ComponentType<React.SVGProps<SVGSVGElement>>
    >
  )[iconName];
  return IconComponent || null;
}

// 获取 icon 显示名称
export function getIconDisplayName(iconName: string): string {
  return iconName
    .replace(/^Icon/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

// 生成 icon key（用于存储）
export function generateIconKey(iconName: string): string {
  return iconName;
}

// 过滤 icons
export function filterIcons(icons: string[], searchTerm: string): string[] {
  if (!searchTerm.trim()) return icons;

  const term = searchTerm.toLowerCase();
  return icons.filter(
    (icon) =>
      icon.toLowerCase().includes(term) ||
      icon
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .includes(term),
  );
}
