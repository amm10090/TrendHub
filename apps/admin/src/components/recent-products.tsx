import { Avatar } from "@heroui/react";
import { useTranslations } from "next-intl";

import { Product } from "@/lib/services/product.service"; // Changed import path

// Placeholder for loading skeleton or actual Skeleton component
function ProductSkeleton() {
  return (
    <div className="flex items-center space-x-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

interface RecentProductsProps {
  products: Product[] | null; // Using the imported Product type
  isLoading: boolean; // Add loading state
}

export function RecentProducts({ products, isLoading }: RecentProductsProps) {
  const t = useTranslations("dashboard"); // Using dashboard namespace

  if (isLoading) {
    // Display skeleton loaders while loading
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        {t("noRecentProducts")} {/* Updated translation key */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {" "}
      {/* Increased spacing */}
      {products.map((product) => (
        <div key={product.id} className="flex items-center">
          <Avatar
            className="h-9 w-9 flex-shrink-0"
            src={product.images?.[0]} // Pass src directly
            alt={product.name || "Product Image"}
            name={product.name} // Pass name for potential fallback generation
            size="md" // Ensure size is consistent
          />
          <div className="ml-4 space-y-1 overflow-hidden flex-grow">
            {" "}
            {/* Added flex-grow */}
            <p
              className="text-sm font-medium leading-none truncate"
              title={product.name}
            >
              {product.name}
            </p>
            {/* Display Brand Name */}
            <p
              className="text-sm text-muted-foreground truncate"
              title={product.brand?.name || "Unknown Brand"}
            >
              {product.brand?.name || "Unknown Brand"}
            </p>
          </div>
          {/* Optional: Add created date or other info */}
          {/* <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''}
          </div> */}
        </div>
      ))}
    </div>
  );
}
