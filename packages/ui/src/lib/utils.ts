import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 用于合并类名的工具函数
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Icon 相关的工具函数
export function normalizeIconName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
