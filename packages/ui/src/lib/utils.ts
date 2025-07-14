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
