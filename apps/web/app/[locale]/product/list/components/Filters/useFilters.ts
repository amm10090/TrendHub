import { useTranslations } from 'next-intl';
import { useMemo, useCallback } from 'react';

import {
  ActiveFilter,
  FilterCategory,
  FilterColor,
  FilterPriceRange,
  FilterSize,
  UseFiltersProps,
  UseFiltersReturn,
} from './types';

// 类别列表
const categories: FilterCategory[] = [
  {
    id: 'women',
    name: 'women',
    children: [
      {
        id: 'women-clothing',
        name: 'clothing',
        parent: 'women',
        children: [
          { id: 'women-dresses', name: 'clothing_categories.dresses', parent: 'women-clothing' },
          { id: 'women-tops', name: 'clothing_categories.tops', parent: 'women-clothing' },
          { id: 'women-skirts', name: 'clothing_categories.skirts', parent: 'women-clothing' },
          { id: 'women-pants', name: 'clothing_categories.pants', parent: 'women-clothing' },
        ],
      },
      {
        id: 'women-shoes',
        name: 'shoes',
        parent: 'women',
        children: [
          { id: 'women-heels', name: 'shoes_categories.heels', parent: 'women-shoes' },
          { id: 'women-flats', name: 'shoes_categories.flats', parent: 'women-shoes' },
          { id: 'women-boots', name: 'shoes_categories.boots', parent: 'women-shoes' },
        ],
      },
      {
        id: 'women-bags',
        name: 'bags',
        parent: 'women',
        children: [
          { id: 'women-shoulder-bags', name: 'bags_categories.shoulderBags', parent: 'women-bags' },
          { id: 'women-tote-bags', name: 'bags_categories.toteBags', parent: 'women-bags' },
          { id: 'women-clutches', name: 'bags_categories.clutches', parent: 'women-bags' },
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
          { id: 'men-suits', name: 'clothing_categories.suits', parent: 'men-clothing' },
          { id: 'men-shirts', name: 'clothing_categories.tops', parent: 'men-clothing' },
          { id: 'men-pants', name: 'clothing_categories.pants', parent: 'men-clothing' },
        ],
      },
      {
        id: 'men-shoes',
        name: 'shoes',
        parent: 'men',
        children: [
          { id: 'men-boots', name: 'shoes_categories.boots', parent: 'men-shoes' },
          { id: 'men-sneakers', name: 'shoes_categories.sneakers', parent: 'men-shoes' },
        ],
      },
      {
        id: 'men-bags',
        name: 'bags',
        parent: 'men',
        children: [
          { id: 'men-briefcases', name: 'bags_categories.briefcases', parent: 'men-bags' },
          { id: 'men-backpacks', name: 'bags_categories.backpacks', parent: 'men-bags' },
        ],
      },
    ],
  },
];

// 尺码列表
const sizes: FilterSize[] = [
  { id: 'xs', name: 'XS' },
  { id: 's', name: 'S' },
  { id: 'm', name: 'M' },
  { id: 'l', name: 'L' },
  { id: 'xl', name: 'XL' },
];

// 颜色列表
const colors: FilterColor[] = [
  { id: 'black', name: 'black', value: '#000000' },
  { id: 'white', name: 'white', value: '#FFFFFF' },
  { id: 'red', name: 'red', value: '#FF0000' },
  { id: 'blue', name: 'blue', value: '#0000FF' },
  { id: 'green', name: 'green', value: '#00FF00' },
];

// 价格范围列表
const priceRanges: FilterPriceRange[] = [
  { id: 'under1000', name: 'under1000' },
  { id: '1000to5000', name: '1000to5000' },
  { id: '5000to10000', name: '5000to10000' },
  { id: '10000to20000', name: '10000to20000' },
  { id: 'over20000', name: 'over20000' },
];

export const useFilters = ({
  selectedCategory,
  selectedSizes,
  selectedColors,
  selectedPriceRanges,
  onSaleOnly,
  setSelectedCategory,
  setSelectedSizes,
  setSelectedColors,
  setSelectedPriceRanges,
  setOnSaleOnly,
}: UseFiltersProps): UseFiltersReturn => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');

  // 获取分类的子类别
  const getCategoryChildren = (parentId: string) => {
    const findChildren = (cats: FilterCategory[]): FilterCategory[] => {
      for (const cat of cats) {
        if (cat.id === parentId) {
          return cat.children || [];
        }
        if (cat.children) {
          const found = findChildren(cat.children);

          if (found.length > 0) {
            return found;
          }
        }
      }

      return [];
    };

    return findChildren(categories);
  };

  // 获取当前激活的分类路径
  const getActiveCategoryPath = useCallback(() => {
    const path: FilterCategory[] = [];
    const findPath = (cats: FilterCategory[], targetId: string): boolean => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          path.push(cat);

          return true;
        }
        if (cat.children && findPath(cat.children, targetId)) {
          path.unshift(cat);

          return true;
        }
      }

      return false;
    };

    if (selectedCategory.length > 0) {
      findPath(categories, selectedCategory[selectedCategory.length - 1]);
    }

    return path;
  }, [selectedCategory]);

  // 计算活动的筛选条件
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = [];

    // 添加分类筛选
    const categoryPath = getActiveCategoryPath();

    categoryPath.forEach((category, index) => {
      filters.push({
        id: `category-${category.id}`,
        type: 'category',
        label: tNav(category.name),
        parentId: category.parent,
        level: index + 1,
      });
    });

    // 添加尺码筛选
    selectedSizes.forEach((sizeId) => {
      const size = sizes.find((s) => s.id === sizeId);

      if (size) {
        filters.push({
          id: `size-${size.id}`,
          type: 'size',
          label: size.name,
        });
      }
    });

    // 添加颜色筛选
    selectedColors.forEach((colorId) => {
      const color = colors.find((c) => c.id === colorId);

      if (color) {
        filters.push({
          id: `color-${color.id}`,
          type: 'color',
          label: tNav(color.name),
        });
      }
    });

    // 添加价格范围筛选
    selectedPriceRanges.forEach((rangeId) => {
      const range = priceRanges.find((r) => r.id === rangeId);

      if (range) {
        filters.push({
          id: `price-${range.id}`,
          type: 'price',
          label: t(`filters.priceRanges.${range.name}`),
        });
      }
    });

    // 添加特惠筛选
    if (onSaleOnly) {
      filters.push({
        id: 'sale',
        type: 'sale',
        label: t('filters.onSaleOnly'),
      });
    }

    return filters;
  }, [
    selectedSizes,
    selectedColors,
    selectedPriceRanges,
    onSaleOnly,
    t,
    tNav,
    getActiveCategoryPath,
  ]);

  // 移除筛选条件
  const removeFilter = (filter: ActiveFilter) => {
    switch (filter.type) {
      case 'category':
        if (filter.level) {
          // 移除当前层级及其后的所有层级
          setSelectedCategory(selectedCategory.slice(0, filter.level - 1));
        }
        break;
      case 'size':
        setSelectedSizes((prev) => prev.filter((id) => `size-${id}` !== filter.id));
        break;
      case 'color':
        setSelectedColors((prev) => prev.filter((id) => `color-${id}` !== filter.id));
        break;
      case 'price':
        setSelectedPriceRanges((prev) => prev.filter((id) => `price-${id}` !== filter.id));
        break;
      case 'sale':
        setOnSaleOnly(false);
        break;
    }
  };

  return {
    categories,
    sizes,
    colors,
    priceRanges,
    hasActiveFilters: activeFilters.length > 0,
    activeFilters,
    removeFilter,
    getCategoryChildren,
    getActiveCategoryPath,
  };
};
