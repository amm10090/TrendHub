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

// 添加示例分类数据
export const sampleCategories: FilterCategory[] = [
  {
    id: 'women',
    name: 'women',
    children: [
      {
        id: 'women-clothing',
        name: 'clothing',
        parent: 'women',
        children: [
          {
            id: 'women-clothing-coats',
            name: 'coats',
            parent: 'women-clothing',
          },
          {
            id: 'women-clothing-dresses',
            name: 'dresses',
            parent: 'women-clothing',
          },
          {
            id: 'women-clothing-tops',
            name: 'tops',
            parent: 'women-clothing',
          },
        ],
      },
      {
        id: 'women-shoes',
        name: 'shoes',
        parent: 'women',
        children: [
          {
            id: 'women-shoes-heels',
            name: 'heels',
            parent: 'women-shoes',
          },
          {
            id: 'women-shoes-flats',
            name: 'flats',
            parent: 'women-shoes',
          },
        ],
      },
      {
        id: 'women-bags',
        name: 'bags',
        parent: 'women',
        children: [
          {
            id: 'women-bags-shoulder',
            name: 'shoulder-bags',
            parent: 'women-bags',
          },
          {
            id: 'women-bags-totes',
            name: 'totes',
            parent: 'women-bags',
          },
        ],
      },
      {
        id: 'women-accessories',
        name: 'accessories',
        parent: 'women',
        children: [
          {
            id: 'women-accessories-jewelry',
            name: 'jewelry',
            parent: 'women-accessories',
          },
          {
            id: 'women-accessories-belts',
            name: 'belts',
            parent: 'women-accessories',
          },
        ],
      },
    ],
  },
  {
    id: 'men',
    name: 'men',
    children: [
      {
        id: 'men-clothing',
        name: 'clothing',
        parent: 'men',
        children: [
          {
            id: 'men-clothing-suits',
            name: 'suits',
            parent: 'men-clothing',
          },
          {
            id: 'men-clothing-jackets',
            name: 'jackets',
            parent: 'men-clothing',
          },
          {
            id: 'men-clothing-shirts',
            name: 'shirts',
            parent: 'men-clothing',
          },
        ],
      },
      {
        id: 'men-shoes',
        name: 'shoes',
        parent: 'men',
        children: [
          {
            id: 'men-shoes-sneakers',
            name: 'sneakers',
            parent: 'men-shoes',
          },
          {
            id: 'men-shoes-boots',
            name: 'boots',
            parent: 'men-shoes',
          },
        ],
      },
      {
        id: 'men-bags',
        name: 'bags',
        parent: 'men',
        children: [
          {
            id: 'men-bags-backpacks',
            name: 'backpacks',
            parent: 'men-bags',
          },
          {
            id: 'men-bags-briefcases',
            name: 'briefcases',
            parent: 'men-bags',
          },
        ],
      },
      {
        id: 'men-accessories',
        name: 'accessories',
        parent: 'men',
        children: [
          {
            id: 'men-accessories-watches',
            name: 'watches',
            parent: 'men-accessories',
          },
          {
            id: 'men-accessories-belts',
            name: 'belts',
            parent: 'men-accessories',
          },
        ],
      },
    ],
  },
];
