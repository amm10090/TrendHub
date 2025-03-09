export interface FilterCategory {
  id: string;
  name: string;
  parent?: string;
  children?: FilterCategory[];
}

export interface FilterSize {
  id: string;
  name: string;
}

export interface FilterColor {
  id: string;
  name: string;
  value: string;
}

export interface FilterPriceRange {
  id: string;
  name: string;
}

export interface ActiveFilter {
  id: string;
  type: 'category' | 'size' | 'color' | 'price' | 'sale';
  label: string;
  parentId?: string;
  level?: number;
}

export interface UseFiltersProps {
  selectedCategory: string[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedPriceRanges: string[];
  onSaleOnly: boolean;
  setSelectedCategory: (categories: string[]) => void;
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedPriceRanges: React.Dispatch<React.SetStateAction<string[]>>;
  setOnSaleOnly: (value: boolean) => void;
}

export interface UseFiltersReturn {
  categories: FilterCategory[];
  sizes: FilterSize[];
  colors: FilterColor[];
  priceRanges: FilterPriceRange[];
  hasActiveFilters: boolean;
  activeFilters: ActiveFilter[];
  removeFilter: (filter: ActiveFilter) => void;
  getCategoryChildren: (parentId: string) => FilterCategory[];
  getActiveCategoryPath: () => FilterCategory[];
}
