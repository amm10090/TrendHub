export type ECommerceSite =
  | "Mytheresa"
  | "Italist"
  | "Yoox"
  | "Farfetch"
  | "Cettire"
  | "Unknown";

export interface Price {
  amount: number;
  currency: string; // ISO 4217 currency code, e.g., "USD", "EUR", "CNY"
}

export interface Product {
  // Core Identifiers
  url: string; // Original product URL
  source: ECommerceSite; // Source website
  sku?: string; // SKU or product ID from the source website

  // Descriptive Information
  name?: string;
  brand?: string;
  description?: string;
  // categories?: string[]; // Derived from breadcrumbs or other classifications - Keep for future use
  breadcrumbs?: string[]; // Raw breadcrumbs from the site

  // Pricing Information
  currentPrice?: Price; // Current selling price. Renamed from 'price' to be more explicit
  originalPrice?: Price; // Original price before discount, if available
  // discount?: number; // Discount percentage or amount - Keep for future use

  // Media
  images?: string[]; // Array of image URLs
  videos?: string[]; // Array of video URLs (if applicable)

  // Product Attributes
  color?: string;
  designerColorName?: string;
  sizes?: string[]; // Available sizes
  material?: string;
  materialDetails?: string[];
  tags?: string[]; // 产品标签

  // Stock & Availability (Potentially more complex, simple for now)
  // availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  // stockQuantity?: number;

  // Timestamps & Metadata
  scrapedAt: Date; // Timestamp of when the data was scraped
  metadata?: Record<string, unknown>; // For any other site-specific data
}
