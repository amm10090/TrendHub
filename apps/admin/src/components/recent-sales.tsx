import { Avatar } from "@heroui/react";
import { useTranslations } from "next-intl";

// Assuming formatCurrency is correctly implemented elsewhere or remove/replace
// import { formatCurrency } from "@/lib/utils";

// Placeholder for currency formatting if utils not available
const formatCurrency = (amount: number, currency?: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
};

// Match the Product interface defined in page.tsx
interface Product {
  id: string;
  name: string;
  price: string | number; // API might return string or number
  images?: string[];
  currency?: string;
}

interface RecentSalesProps {
  products: Product[] | null;
  isLoading: boolean; // Add loading state
}

export function RecentSales({ products, isLoading }: RecentSalesProps) {
  const t = useTranslations("dashboard"); // Using dashboard namespace for consistency

  if (isLoading) {
    // Display skeleton loaders while loading
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        {t("noRecentSales")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {products.map((product) => (
        <div key={product.id} className="flex items-center">
          {/* Use standard Avatar, assuming it takes src and name/fallback logic */}
          <Avatar
            className="h-9 w-9 flex-shrink-0"
            src={product.images?.[0]} // Pass src directly
            alt={product.name || "Product Image"}
            name={product.name} // Pass name for potential fallback generation
            size="md" // Ensure size is consistent
          />
          <div className="ml-4 space-y-1 overflow-hidden mr-2">
            {" "}
            {/* Added overflow-hidden and mr-2 */}
            <p className="text-sm font-medium leading-none truncate">
              {product.name}
            </p>{" "}
            {/* Added truncate */}
            {/* Assuming price is a simple value, add SKU or other details if needed */}
            {/* <p className="text-sm text-muted-foreground">ID: {product.id}</p> */}
          </div>
          <div className="ml-auto font-medium whitespace-nowrap">
            {" "}
            {/* Added whitespace-nowrap */}
            {/* Ensure price is treated as a number for formatting */}+
            {formatCurrency(Number(product.price) || 0, product.currency)}
          </div>
        </div>
      ))}
    </div>
  );
}
