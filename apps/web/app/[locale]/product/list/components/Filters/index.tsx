'use client';

import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  RadioGroup,
  Radio,
  Tabs,
  Tab,
} from '@heroui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { FilterTag } from './FilterTag';
import { MobileFilters } from './MobileFilters';
import { useFilters } from './useFilters';

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
  const t = useTranslations('product');
  const tNav = useTranslations('nav');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedLevel2Category, setSelectedLevel2Category] = useState<string | null>(null);

  const {
    categories,
    sizes,
    colors,
    priceRanges,
    hasActiveFilters,
    activeFilters,
    removeFilter,
    getCategoryChildren,
  } = useFilters({
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

  // 处理一级分类选择
  const handleLevel1Select = (categoryId: string) => {
    setSelectedCategory([categoryId]);
    setSelectedLevel2Category(null);
  };

  // 处理二级分类选择
  const handleLevel2Select = (categoryId: string) => {
    setSelectedCategory([...selectedCategory.slice(0, 1), categoryId]);
    setSelectedLevel2Category(categoryId);
  };

  // 处理三级分类选择
  const handleLevel3Select = (categoryId: string) => {
    setSelectedCategory([...selectedCategory.slice(0, 2), categoryId]);
  };

  return (
    <div className="mb-6 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-sm">
      {/* 筛选结果统计 */}
      <div className="px-4 py-3 border-b border-border-primary-light dark:border-border-primary-dark">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {t('filters.results', { count: totalProducts })}
        </p>
      </div>

      {/* 移动端筛选按钮 */}
      <div className="lg:hidden p-4">
        <Button className="w-full" variant="bordered" onPress={() => setIsMobileFiltersOpen(true)}>
          {t('filters.title')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* 移动端筛选面板 */}
      <MobileFilters
        categories={categories}
        clearAllFilters={clearAllFilters}
        colors={colors}
        isOpen={isMobileFiltersOpen}
        onSaleOnly={onSaleOnly}
        priceRanges={priceRanges}
        selectedCategory={selectedCategory}
        selectedColors={selectedColors}
        selectedPriceRanges={selectedPriceRanges}
        selectedSizes={selectedSizes}
        setOnSaleOnly={setOnSaleOnly}
        setSelectedCategory={setSelectedCategory}
        setSelectedColors={setSelectedColors}
        setSelectedPriceRanges={setSelectedPriceRanges}
        setSelectedSizes={setSelectedSizes}
        sizes={sizes}
        onClose={() => setIsMobileFiltersOpen(false)}
      />

      {/* 桌面端筛选器 */}
      <div className="hidden lg:block">
        <div className="p-4">
          {/* 一级分类选择 */}
          <div className="mb-4">
            <RadioGroup
              className="flex gap-4"
              value={selectedCategory[0] || ''}
              onValueChange={handleLevel1Select}
            >
              {categories.map((category) => (
                <Radio key={category.id} value={category.id}>
                  {tNav(category.name)}
                </Radio>
              ))}
            </RadioGroup>
          </div>

          {/* 二级和三级分类 */}
          {selectedCategory[0] && (
            <div className="mb-4">
              <Tabs
                selectedKey={selectedLevel2Category || ''}
                onSelectionChange={(key) => handleLevel2Select(key as string)}
              >
                {getCategoryChildren(selectedCategory[0]).map((category) => (
                  <Tab key={category.id} title={tNav(category.name)}>
                    <div className="mt-2 space-y-2">
                      {category.children?.map((subCategory) => (
                        <div
                          key={subCategory.id}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-bg-tertiary-light dark:hover:bg-bg-tertiary-dark p-2 rounded"
                          onClick={() => handleLevel3Select(subCategory.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleLevel3Select(subCategory.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <ChevronRight className="h-4 w-4" />
                          {tNav(subCategory.name)}
                        </div>
                      ))}
                      <div className="mt-4">
                        <Button
                          className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark"
                          variant="light"
                        >
                          {t('filters.viewAllCategories')}
                        </Button>
                      </div>
                    </div>
                  </Tab>
                ))}
              </Tabs>
            </div>
          )}

          <Divider className="my-4" />

          {/* 其他筛选器 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sale筛选 */}
            <div className="flex items-center gap-2">
              <Checkbox
                classNames={{
                  wrapper:
                    'before:border-border-primary-light dark:before:border-border-primary-dark',
                }}
                isSelected={onSaleOnly}
                onValueChange={setOnSaleOnly}
              >
                {t('filters.onSaleOnly')}
              </Checkbox>
            </div>

            {/* 尺寸筛选 */}
            <Dropdown>
              <DropdownTrigger>
                <Button className="flex items-center" variant="light">
                  {t('filters.size')} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('filters.size')}>
                {sizes.map((size) => (
                  <DropdownItem
                    key={size.id}
                    textValue={size.name}
                    onClick={() => {
                      setSelectedSizes((prev) =>
                        prev.includes(size.id)
                          ? prev.filter((id) => id !== size.id)
                          : [...prev, size.id]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="pointer-events-none"
                        classNames={{
                          wrapper:
                            'before:border-border-primary-light dark:before:border-border-primary-dark',
                        }}
                        isSelected={selectedSizes.includes(size.id)}
                      />
                      {size.name}
                    </div>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* 价格筛选 */}
            <Dropdown>
              <DropdownTrigger>
                <Button className="flex items-center" variant="light">
                  {t('filters.price')} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('filters.price')}>
                {priceRanges.map((range) => (
                  <DropdownItem
                    key={range.id}
                    textValue={t(`filters.priceRanges.${range.name}`)}
                    onClick={() => {
                      setSelectedPriceRanges((prev) =>
                        prev.includes(range.id)
                          ? prev.filter((id) => id !== range.id)
                          : [...prev, range.id]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="pointer-events-none"
                        classNames={{
                          wrapper:
                            'before:border-border-primary-light dark:before:border-border-primary-dark',
                        }}
                        isSelected={selectedPriceRanges.includes(range.id)}
                      />
                      {t(`filters.priceRanges.${range.name}`)}
                    </div>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* 颜色筛选 */}
            <Dropdown>
              <DropdownTrigger>
                <Button className="flex items-center" variant="light">
                  {t('filters.color')} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('filters.color')}>
                {colors.map((color) => (
                  <DropdownItem
                    key={color.id}
                    textValue={color.name}
                    onClick={() => {
                      setSelectedColors((prev) =>
                        prev.includes(color.id)
                          ? prev.filter((id) => id !== color.id)
                          : [...prev, color.id]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="pointer-events-none"
                        classNames={{
                          wrapper:
                            'before:border-border-primary-light dark:before:border-border-primary-dark',
                        }}
                        isSelected={selectedColors.includes(color.id)}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      {tNav(`${color.name}`)}
                    </div>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Divider className="h-6 mx-2" orientation="vertical" />

            {/* 清除所有筛选 */}
            {hasActiveFilters && (
              <Button
                className="bg-bg-tertiary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark"
                variant="flat"
                onClick={clearAllFilters}
              >
                {t('filters.clearAll')}
              </Button>
            )}

            {/* 排序方式 */}
            <div className="flex items-center gap-2">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                {t('filters.sort.title')}:
              </span>
              <Dropdown>
                <DropdownTrigger>
                  <Button className="flex items-center" variant="light">
                    {sortOrder === 'newest'
                      ? t('filters.sort.newest')
                      : sortOrder === 'price_high_low'
                        ? t('filters.sort.priceHighToLow')
                        : t('filters.sort.priceLowToHigh')}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t('filters.sort.title')}
                  items={[
                    { key: 'newest', label: t('filters.sort.newest') },
                    { key: 'price_high_low', label: t('filters.sort.priceHighToLow') },
                    { key: 'price_low_high', label: t('filters.sort.priceLowToHigh') },
                  ]}
                  selectedKeys={[sortOrder]}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;

                    setSortOrder(selected);
                  }}
                >
                  {(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* 已应用的筛选条件 */}
        {hasActiveFilters && (
          <div className="px-4 py-2 border-t border-border-primary-light dark:border-border-primary-dark">
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <FilterTag
                  key={filter.id}
                  label={filter.label}
                  onRemove={() => removeFilter(filter)}
                />
              ))}
              <Button
                className="ml-2 text-sm text-text-tertiary-light dark:text-text-tertiary-dark"
                variant="light"
                onClick={clearAllFilters}
              >
                {t('filters.clearAll')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
