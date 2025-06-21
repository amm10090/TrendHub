import type { Product } from "@repo/types";

export interface MytheresaUserData {
  executionId?: string;
  plpData?: Partial<Product>;
  label?: "HOMEPAGE" | "LIST" | "DETAIL";
  batchGender?: "women" | "men" | "unisex" | string | null;
  originUrl?: string;
  urlsToScrape?: string[];
}
