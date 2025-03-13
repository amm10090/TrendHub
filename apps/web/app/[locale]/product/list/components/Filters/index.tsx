'use client';
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
} from '@heroui/react';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef, useMemo } from 'react';
import * as React from 'react';

import { FilterTag } from './FilterTag';
import { MobileFilters } from './MobileFilters';
import {
  FilterCategory,
  FilterColor,
  FilterPriceRange,
  FilterSize,
  sampleCategories,
} from './types';
import { useFilters } from './useFilters';

// 创建CategoryNavigation组件，处理分类筛选的弹出式面板和交互
const CategoryNavigation: React.FC<{
  categories: FilterCategory[];
  selectedCategory: string[];
  setSelectedCategory: (categoryId: string, level: number) => void;
  isOpen: boolean;
  categoryButtonRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ categories = sampleCategories, selectedCategory, setSelectedCategory, isOpen }) => {
  const tNav = useTranslations('nav');
  const [activeGender, setActiveGender] = useState<string>(
    selectedCategory.includes('men') ? 'men' : 'women'
  );
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);

  // 获取主分类列表
  const mainCategories = useMemo(() => {
    const genderCategory = categories.find((c) => c.id === activeGender);

    return genderCategory?.children || [];
  }, [categories, activeGender]);

  // 判断是否有选中的主分类
  const hasSelectedMainCategory = useMemo(() => {
    return mainCategories.some((category) => selectedCategory.includes(category.id));
  }, [mainCategories, selectedCategory]);

  // 获取子分类列表
  const subCategories = useMemo(() => {
    if (!selectedMainCategory) return [];
    const category = mainCategories.find((c) => c.id === selectedMainCategory);

    return category?.children || [];
  }, [mainCategories, selectedMainCategory]);

  // 处理性别切换
  const handleGenderChange = (gender: string) => {
    setActiveGender(gender);
    setSelectedMainCategory(null);
    setSelectedCategory('', 0);
  };

  // 处理主分类点击
  const handleMainCategoryClick = (category: FilterCategory) => {
    if (selectedCategory.includes(category.id) && selectedCategory.length === 1) {
      // 如果只选中了主分类并点击它，则清除选择
      setSelectedCategory('', 0);
      setSelectedMainCategory(null);
    } else if (selectedCategory.includes(category.id)) {
      // 如果已经选中了这个分类，保持选中状态
      setSelectedCategory(category.id, 1);
    } else {
      // 选择新的主分类
      setSelectedMainCategory(category.id);
      setSelectedCategory(category.id, 1);
    }
  };

  // 处理子分类点击
  const handleSubCategoryClick = (category: FilterCategory) => {
    if (selectedCategory.includes(category.id)) {
      // 如果已经选中了这个子分类，返回到主分类选择
      setSelectedCategory(selectedMainCategory || '', 1);
    } else {
      // 选择新的子分类，同时保持主分类的选中状态
      const parentCategory = mainCategories.find((c) =>
        c.children?.some((child) => child.id === category.id)
      );

      if (parentCategory) {
        setSelectedCategory(category.id, 2);
        setSelectedMainCategory(parentCategory.id);
      }
    }
  };

  // 处理"查看所有"按钮点击
  const handleViewAll = (type: string) => {
    if (type === 'main') {
      setSelectedCategory('', 0);
      setSelectedMainCategory(null);
    } else if (type === 'sub' && selectedMainCategory) {
      setSelectedCategory(selectedMainCategory, 1);
    }
  };

  // 过滤主分类列表
  const filteredMainCategories = useMemo(() => {
    if (!hasSelectedMainCategory) {
      return mainCategories;
    }

    const selectedMainCategoryIds = selectedCategory
      .filter((id) => mainCategories.some((c) => c.id === id))
      .map((id) => id);

    if (selectedMainCategoryIds.length === 0) {
      return mainCategories;
    }

    return mainCategories.filter((category) => selectedMainCategoryIds.includes(category.id));
  }, [mainCategories, selectedCategory, hasSelectedMainCategory]);

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[80vh] border-b border-border-primary-light dark:border-border-primary-dark' : 'max-h-0'}`}
    >
      <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
          {/* 类别标题和清除按钮 */}
          <div className="flex items-center justify-between py-3 border-b border-border-primary-light dark:border-border-primary-dark">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {tNav('category')}{' '}
                {selectedCategory.length > 0 ? `(${selectedCategory.length})` : ''}
              </span>
              {selectedCategory.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border-primary-light dark:bg-border-primary-dark" />
                  <button
                    className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    onClick={() => {
                      setSelectedCategory('', 0);
                      setSelectedMainCategory(null);
                    }}
                  >
                    {tNav('clear')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 性别选择Tabs */}
          <Tabs
            selectedKey={activeGender}
            onSelectionChange={(key) => handleGenderChange(key as string)}
            variant="underlined"
            size="sm"
            className="w-full"
          >
            <Tab key="women" title={tNav('women')} />
            <Tab key="men" title={tNav('men')} />
          </Tabs>

          {/* 两栏分类导航 */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {/* 左侧主分类列表 */}
            <div className="border-r border-border-primary-light dark:border-border-primary-dark pr-4">
              {hasSelectedMainCategory && (
                <div className="mb-3">
                  <button
                    className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                    onClick={() => {
                      setSelectedCategory('', 0);
                      setSelectedMainCategory(null);
                    }}
                  >
                    <ChevronRight className="rotate-180 mr-1 h-4 w-4" />
                    {tNav('back')}
                  </button>
                </div>
              )}

              {/* 主分类列表 */}
              <div className="flex flex-col gap-y-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-md transition-colors"
                  onClick={() => handleViewAll('main')}
                >
                  {tNav('viewAllCategories')}
                </button>

                {filteredMainCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group
                                            ${
                                              selectedCategory.includes(category.id)
                                                ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark'
                                                : 'hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                                            }`}
                    onClick={() => handleMainCategoryClick(category)}
                  >
                    <span>{tNav(category.name)}</span>
                    <div className="flex items-center gap-2">
                      {selectedCategory.includes(category.id) && (
                        <Check
                          size={16}
                          className="text-text-primary-light dark:text-text-primary-dark"
                        />
                      )}
                      {category.children && category.children.length > 0 && (
                        <ChevronRight
                          size={16}
                          className="text-text-tertiary-light dark:text-text-tertiary-dark"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 右侧子分类列表 */}
            <div>
              {selectedMainCategory && (
                <div className="flex flex-col gap-y-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-md transition-colors"
                    onClick={() => handleViewAll('sub')}
                  >
                    {tNav('viewAll')}{' '}
                    {tNav(mainCategories.find((c) => c.id === selectedMainCategory)?.name || '')}
                  </button>

                  {subCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group
                                                ${
                                                  selectedCategory.includes(category.id)
                                                    ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark'
                                                    : 'hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                                                }`}
                      onClick={() => handleSubCategoryClick(category)}
                    >
                      <span>{tNav(category.name)}</span>
                      {selectedCategory.includes(category.id) && (
                        <Check
                          size={16}
                          className="text-text-primary-light dark:text-text-primary-dark"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 创建尺寸筛选面板组件
const SizeNavigation: React.FC<{
  sizes: FilterSize[];
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  isOpen: boolean;
}> = ({ sizes, selectedSizes, setSelectedSizes, isOpen }) => {
  const t = useTranslations('product');

  // 处理尺寸选择
  const handleSizeClick = (sizeId: string) => {
    if (selectedSizes.includes(sizeId)) {
      setSelectedSizes((prev) => prev.filter((id) => id !== sizeId));
    } else {
      setSelectedSizes((prev) => [...prev, sizeId]);
    }
  };

  // 清除所有选中的尺寸
  const clearSizes = () => {
    setSelectedSizes([]);
  };

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[60vh] border-b border-border-primary-light dark:border-border-primary-dark' : 'max-h-0'}`}
    >
      <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
          {/* 尺寸标题和清除按钮 */}
          <div className="flex items-center justify-between py-3 border-b border-border-primary-light dark:border-border-primary-dark">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {t('filters.size')} {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}
              </span>
              {selectedSizes.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border-primary-light dark:bg-border-primary-dark" />
                  <button
                    className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    onClick={clearSizes}
                  >
                    {t('filters.clearAll')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 尺寸列表 */}
          <div className="py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto">
            {sizes.map((size) => (
              <button
                key={size.id}
                className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center
                                    ${
                                      selectedSizes.includes(size.id)
                                        ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark border-border-primary-light dark:border-border-primary-dark'
                                        : 'border border-border-secondary-light dark:border-border-secondary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                                    }`}
                onClick={() => handleSizeClick(size.id)}
              >
                {t(`filters.sizes.${size.name}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 创建价格区间筛选面板组件
const PriceNavigation: React.FC<{
  priceRanges: FilterPriceRange[];
  selectedPriceRanges: string[];
  setSelectedPriceRanges: React.Dispatch<React.SetStateAction<string[]>>;
  isOpen: boolean;
}> = ({ priceRanges, selectedPriceRanges, setSelectedPriceRanges, isOpen }) => {
  const t = useTranslations('product');

  // 清除所有选中的价格区间
  const clearPrices = () => {
    setSelectedPriceRanges([]);
  };

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[60vh] border-b border-border-primary-light dark:border-border-primary-dark' : 'max-h-0'}`}
    >
      <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
          {/* 价格标题和清除按钮 */}
          <div className="flex items-center justify-between py-3 border-b border-border-primary-light dark:border-border-primary-dark">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {t('filters.price')}{' '}
                {selectedPriceRanges.length > 0 ? `(${selectedPriceRanges.length})` : ''}
              </span>
              {selectedPriceRanges.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border-primary-light dark:bg-border-primary-dark" />
                  <button
                    className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    onClick={clearPrices}
                  >
                    {t('filters.clearAll')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 价格区间列表 */}
          <div className="py-4 flex flex-col gap-y-2 max-h-[40vh] overflow-y-auto">
            {priceRanges.map((range) => (
              <button
                key={range.id}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between
                                    ${
                                      selectedPriceRanges.includes(range.id)
                                        ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark'
                                        : 'hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                                    }`}
                onClick={() => {
                  setSelectedPriceRanges((prev) => (prev.includes(range.id) ? [] : [range.id]));
                }}
              >
                <span>{t(`filters.priceRanges.${range.name}`)}</span>
                {selectedPriceRanges.includes(range.id) && (
                  <Check
                    size={16}
                    className="text-text-primary-light dark:text-text-primary-dark"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 创建颜色筛选面板组件
const ColorNavigation: React.FC<{
  colors: FilterColor[];
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  isOpen: boolean;
}> = ({ colors, selectedColors, setSelectedColors, isOpen }) => {
  const t = useTranslations('product');

  // 处理颜色选择
  const handleColorClick = (colorId: string) => {
    if (selectedColors.includes(colorId)) {
      setSelectedColors((prev) => prev.filter((id) => id !== colorId));
    } else {
      setSelectedColors((prev) => [...prev, colorId]);
    }
  };

  // 清除所有选中的颜色
  const clearColors = () => {
    setSelectedColors([]);
  };

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[60vh] border-b border-border-primary-light dark:border-border-primary-dark' : 'max-h-0'}`}
    >
      <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
          {/* 颜色标题和清除按钮 */}
          <div className="flex items-center justify-between py-3 border-b border-border-primary-light dark:border-border-primary-dark">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {t('filters.color')} {selectedColors.length > 0 ? `(${selectedColors.length})` : ''}
              </span>
              {selectedColors.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border-primary-light dark:bg-border-primary-dark" />
                  <button
                    className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    onClick={clearColors}
                  >
                    {t('filters.clearAll')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 颜色列表 */}
          <div className="py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto">
            {colors.map((color) => (
              <button
                key={color.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-md transition-colors
                                    ${
                                      selectedColors.includes(color.id)
                                        ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark'
                                        : 'hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
                                    }`}
                onClick={() => handleColorClick(color.id)}
              >
                <div
                  className={`h-6 w-6 rounded-full border ${selectedColors.includes(color.id) ? 'border-text-primary-light dark:border-text-primary-dark ring-2 ring-offset-2 ring-border-primary-light dark:ring-border-primary-dark' : 'border-border-secondary-light dark:border-border-secondary-dark'}`}
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs">{t(`filters.colors.${color.name}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface FiltersProps {
  onSaleOnly: boolean;
  setOnSaleOnly: (value: boolean) => void;
  selectedCategory: string[];
  setSelectedCategory: (categories: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPriceRanges: string[];
  setSelectedPriceRanges: React.Dispatch<React.SetStateAction<string[]>>;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  clearAllFilters: () => void;
  totalProducts: number;
}

export const Filters: React.FC<FiltersProps> = ({
  onSaleOnly,
  setOnSaleOnly,
  selectedCategory,
  setSelectedCategory,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  selectedPriceRanges,
  setSelectedPriceRanges,
  sortOrder,
  setSortOrder,
  clearAllFilters,
  totalProducts,
}) => {
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const [activePanel, setActivePanel] = useState<'category' | 'size' | 'price' | 'color' | null>(
    null
  );
  const [isMobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const t = useTranslations('product');

  const { categories, sizes, colors, priceRanges, activeFilters, hasActiveFilters, removeFilter } =
    useFilters({
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
    });

  // 处理面板切换
  const togglePanel = (panel: 'category' | 'size' | 'price' | 'color') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // 处理类别选择，适配CategoryNavigation组件
  const handleCategorySelect = useCallback(
    (categoryId: string, level: number) => {
      // 处理清除操作
      if (level === 0 || categoryId === '') {
        setSelectedCategory([]);

        return;
      }

      // 处理"查看所有服装"选项
      if (categoryId === 'women-clothing' || categoryId === 'men-clothing') {
        const gender = categoryId.split('-')[0];

        setSelectedCategory([gender, categoryId]);

        return;
      }

      // 根据层级处理类别选择
      if (level === 1) {
        // 如果已经选择了该类别，则取消选择
        if (selectedCategory.includes(categoryId)) {
          setSelectedCategory([]);
        } else {
          // 选择顶级类别
          setSelectedCategory([categoryId]);
        }
      } else if (level === 2) {
        // 二级类别选择逻辑
        const parentId = categoryId.split('-')[0]; // 从二级类别ID提取顶级类别ID

        if (selectedCategory.includes(categoryId)) {
          // 如果已经选择了该类别，则只保留父级类别
          setSelectedCategory([parentId]);
        } else {
          // 选择新的二级类别，同时保持父级类别
          const newSelectedCategories = [parentId];

          // 如果是同一个父级下的不同二级类别，则替换原有的二级类别
          if (!selectedCategory.includes(parentId)) {
            newSelectedCategories.push(categoryId);
          } else {
            // 如果父级已经选中，则添加或替换二级类别
            const existingSubCategory = selectedCategory.find(
              (id) => id !== parentId && id.startsWith(parentId)
            );

            if (existingSubCategory !== categoryId) {
              newSelectedCategories.push(categoryId);
            }
          }
          setSelectedCategory(newSelectedCategories);
        }
      } else if (level === 3) {
        // 三级类别选择逻辑
        const parts = categoryId.split('-');
        const topLevelId = parts[0];
        const midLevelId = `${parts[0]}-${parts[1]}`;

        if (selectedCategory.includes(categoryId)) {
          // 如果已经选择了该类别，则返回到二级类别
          setSelectedCategory([topLevelId, midLevelId]);
        } else {
          // 选择新的三级类别，同时保持完整的层级路径
          setSelectedCategory([topLevelId, midLevelId, categoryId]);
        }
      }
    },
    [selectedCategory, setSelectedCategory]
  );

  return (
    <div className="w-full">
      {/* 顶部筛选按钮栏 */}
      <div className="w-full mb-4 relative">
        {/* 筛选按钮组 */}
        <div className="flex items-center gap-1 w-full md:gap-3 md:flex-wrap md:justify-between">
          <div className="flex items-center gap-1 flex-1 md:gap-3 md:flex-wrap">
            {/* Sale筛选 */}
            <Button
              className={`text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center truncate
              ${onSaleOnly ? 'bg-bg-primary-dark dark:bg-bg-primary-light text-text-primary-dark dark:text-text-primary-light border-none' : ''}`}
              variant="light"
              onPress={() => setOnSaleOnly(!onSaleOnly)}
            >
              {t('filters.sale')}
            </Button>

            {/* 类别筛选按钮 */}
            <Button
              className={`text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center gap-1 truncate
              ${activePanel === 'category' ? 'bg-bg-primary-dark dark:bg-bg-primary-light text-text-primary-dark dark:text-text-primary-light border-none' : ''}`}
              variant="light"
              onPress={() => togglePanel('category')}
              ref={categoryButtonRef}
            >
              <span className="truncate">{t('filters.category')}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  activePanel === 'category' ? 'rotate-180' : ''
                }`}
              />
            </Button>

            {/* 尺码筛选按钮 */}
            <Button
              className={`text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center gap-1 truncate
              ${activePanel === 'size' ? 'bg-bg-primary-dark dark:bg-bg-primary-light text-text-primary-dark dark:text-text-primary-light border-none' : ''}`}
              variant="light"
              onPress={() => togglePanel('size')}
            >
              <span className="truncate">{t('filters.size')}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${activePanel === 'size' ? 'rotate-180' : ''}`}
              />
            </Button>

            {/* 价格筛选按钮 */}
            <Button
              className={`text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center gap-1 truncate
              ${activePanel === 'price' ? 'bg-bg-primary-dark dark:bg-bg-primary-light text-text-primary-dark dark:text-text-primary-light border-none' : ''}`}
              variant="light"
              onPress={() => togglePanel('price')}
            >
              <span className="truncate">{t('filters.price')}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${activePanel === 'price' ? 'rotate-180' : ''}`}
              />
            </Button>

            {/* 颜色筛选按钮 */}
            <Button
              className={`text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center gap-1 truncate
              ${activePanel === 'color' ? 'bg-bg-primary-dark dark:bg-bg-primary-light text-text-primary-dark dark:text-text-primary-light border-none' : ''}`}
              variant="light"
              onPress={() => togglePanel('color')}
            >
              <span className="truncate">{t('filters.color')}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${activePanel === 'color' ? 'rotate-180' : ''}`}
              />
            </Button>

            {/* 清除所有筛选按钮 */}
            {hasActiveFilters && (
              <Button
                className="text-sm px-2 md:px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 md:flex-none md:min-w-fit flex items-center justify-center gap-1 truncate"
                variant="light"
                onPress={clearAllFilters}
              >
                <span className="truncate">{t('filters.clearAll')}</span>
                <X className="h-4 w-4 shrink-0" />
              </Button>
            )}
          </div>

          {/* 桌面端排序按钮 - 仅在桌面端显示 */}
          <div className="hidden md:flex items-center gap-3">
            {/* 结果统计 */}
            <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm whitespace-nowrap">
              {totalProducts} {t('results')}
            </div>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  className="text-sm px-4 rounded-full border border-border-primary-light dark:border-border-primary-dark flex items-center justify-center gap-1 truncate whitespace-nowrap"
                  variant="light"
                >
                  <span className="truncate">{t('filters.sort.title')}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('filters.sort.title')} className="min-w-[200px]">
                <DropdownItem
                  key="newest"
                  textValue={t('filters.sort.newest')}
                  onPress={() => setSortOrder('newest')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox isSelected={sortOrder === 'newest'} className="pointer-events-none" />
                    {t('filters.sort.newest')}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="priceHighToLow"
                  textValue={t('filters.sort.priceHighToLow')}
                  onPress={() => setSortOrder('priceHighToLow')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={sortOrder === 'priceHighToLow'}
                      className="pointer-events-none"
                    />
                    {t('filters.sort.priceHighToLow')}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="priceLowToHigh"
                  textValue={t('filters.sort.priceLowToHigh')}
                  onPress={() => setSortOrder('priceLowToHigh')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={sortOrder === 'priceLowToHigh'}
                      className="pointer-events-none"
                    />
                    {t('filters.sort.priceLowToHigh')}
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* 移动端排序和产品数量显示 - 仅在移动端显示 */}
        <div className="flex items-center justify-between mt-4 md:hidden">
          <div className="flex items-center gap-4 ml-auto">
            {/* 排序下拉菜单 */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  className="text-sm px-2 rounded-full border border-border-primary-light dark:border-border-primary-dark flex-1 min-w-0 flex items-center justify-center gap-1 truncate"
                  variant="light"
                >
                  <span className="truncate">{t('filters.sort.title')}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('filters.sort.title')} className="min-w-[200px]">
                <DropdownItem
                  key="newest"
                  textValue={t('filters.sort.newest')}
                  onPress={() => setSortOrder('newest')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox isSelected={sortOrder === 'newest'} className="pointer-events-none" />
                    {t('filters.sort.newest')}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="priceHighToLow"
                  textValue={t('filters.sort.priceHighToLow')}
                  onPress={() => setSortOrder('priceHighToLow')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={sortOrder === 'priceHighToLow'}
                      className="pointer-events-none"
                    />
                    {t('filters.sort.priceHighToLow')}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="priceLowToHigh"
                  textValue={t('filters.sort.priceLowToHigh')}
                  onPress={() => setSortOrder('priceLowToHigh')}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={sortOrder === 'priceLowToHigh'}
                      className="pointer-events-none"
                    />
                    {t('filters.sort.priceLowToHigh')}
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 结果统计 */}
            <div className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
              {totalProducts} {t('results')}
            </div>
          </div>
        </div>
      </div>

      {/* 共享的筛选面板容器 */}
      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${activePanel ? 'max-h-[80vh] border-b border-border-primary-light dark:border-border-primary-dark' : 'max-h-0'}`}
      >
        <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
          {/* 类别导航面板 */}
          {activePanel === 'category' && (
            <CategoryNavigation
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleCategorySelect}
              isOpen={true}
              categoryButtonRef={categoryButtonRef}
            />
          )}

          {/* 尺寸导航面板 */}
          {activePanel === 'size' && (
            <SizeNavigation
              sizes={sizes}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              isOpen={true}
            />
          )}

          {/* 价格导航面板 */}
          {activePanel === 'price' && (
            <PriceNavigation
              priceRanges={priceRanges}
              selectedPriceRanges={selectedPriceRanges}
              setSelectedPriceRanges={setSelectedPriceRanges}
              isOpen={true}
            />
          )}

          {/* 颜色导航面板 */}
          {activePanel === 'color' && (
            <ColorNavigation
              colors={colors}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              isOpen={true}
            />
          )}
        </div>
      </div>

      {/* 已应用的筛选标签 */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="text-sm font-medium mr-2 text-text-secondary-light dark:text-text-secondary-dark">
            已应用筛选:
          </div>
          {activeFilters.map((filter) => (
            <FilterTag key={filter.id} label={filter.label} onRemove={() => removeFilter(filter)} />
          ))}
        </div>
      )}

      {/* 移动端筛选模态框 */}
      <MobileFilters
        isOpen={isMobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        categories={categories}
        sizes={sizes}
        colors={colors}
        priceRanges={priceRanges}
        selectedCategory={selectedCategory}
        selectedSizes={selectedSizes}
        selectedColors={selectedColors}
        selectedPriceRanges={selectedPriceRanges}
        onSaleOnly={onSaleOnly}
        setSelectedCategory={setSelectedCategory}
        setSelectedSizes={setSelectedSizes}
        setSelectedColors={setSelectedColors}
        setSelectedPriceRanges={setSelectedPriceRanges}
        setOnSaleOnly={setOnSaleOnly}
        clearAllFilters={clearAllFilters}
        activeFilters={activeFilters}
        removeFilter={removeFilter}
      />
    </div>
  );
};
