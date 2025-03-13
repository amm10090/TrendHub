import {
  Button,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Accordion,
  AccordionItem,
  Tabs,
  Tab,
} from '@heroui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import * as React from 'react';

import { FilterTag } from './FilterTag';
import { FilterCategory, FilterColor, FilterPriceRange, FilterSize, ActiveFilter } from './types';

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FilterCategory[];
  sizes: FilterSize[];
  colors: FilterColor[];
  priceRanges: FilterPriceRange[];
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
  clearAllFilters: () => void;
  activeFilters: ActiveFilter[];
  removeFilter: (filter: ActiveFilter) => void;
}

/**
 * 移动端筛选组件
 * Lyst风格的移动筛选器，结合了下拉菜单和折叠菜单
 */
export const MobileFilters: React.FC<MobileFiltersProps> = ({
  isOpen,
  onClose,
  categories,
  sizes,
  colors,
  priceRanges,
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
  clearAllFilters,
  activeFilters,
  removeFilter,
}) => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 处理类别选择
  const handleCategorySelect = (categoryId: string, level: number) => {
    if (level === 1) {
      // 点击主类别（Women/Men）
      setSelectedCategory([categoryId]);
    } else if (level === 2) {
      // 点击二级类别
      setSelectedCategory([selectedCategory[0], categoryId]);
    } else if (level === 3) {
      // 点击三级类别
      setSelectedCategory([selectedCategory[0], selectedCategory[1], categoryId]);
    }
  };

  // 检查类别是否被选中
  const isCategorySelected = (categoryId: string) => {
    return selectedCategory.includes(categoryId);
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <span className="text-lg font-medium">{t('filters.title')}</span>
          <Button isIconOnly variant="light" onPress={onClose}>
            <X size={20} />
          </Button>
        </ModalHeader>

        <ModalBody className="py-0">
          {/* 激活的筛选器标签 */}
          {hasActiveFilters && (
            <div className="p-4 border-b border-border-primary-light dark:border-border-primary-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  已选择的筛选条件
                </span>
                <Button size="sm" variant="light" onPress={clearAllFilters}>
                  {t('filters.clearAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <FilterTag
                    key={filter.id}
                    label={filter.label}
                    onRemove={() => removeFilter(filter)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 筛选选项 - Lyst风格顶部按钮组 */}
          <div className="grid grid-cols-2 gap-4 p-4 border-b border-border-primary-light dark:border-border-primary-dark">
            {/* 特价按钮 */}
            <Button
              variant="bordered"
              className={onSaleOnly ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark' : ''}
              onPress={() => setOnSaleOnly(!onSaleOnly)}
              size="lg"
            >
              {t('filters.sale')}
            </Button>

            {/* 类别按钮 */}
            <Button
              variant="bordered"
              className={
                activeSection === 'category' ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark' : ''
              }
              onPress={() => setActiveSection(activeSection === 'category' ? null : 'category')}
              size="lg"
            >
              {t('filters.category')}
            </Button>

            {/* 尺寸按钮 */}
            <Button
              variant="bordered"
              className={
                activeSection === 'size' ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark' : ''
              }
              onPress={() => setActiveSection(activeSection === 'size' ? null : 'size')}
              size="lg"
            >
              {t('filters.size')}
            </Button>

            {/* 价格按钮 */}
            <Button
              variant="bordered"
              className={
                activeSection === 'price' ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark' : ''
              }
              onPress={() => setActiveSection(activeSection === 'price' ? null : 'price')}
              size="lg"
            >
              {t('filters.price')}
            </Button>

            {/* 颜色按钮 */}
            <Button
              variant="bordered"
              className={
                activeSection === 'color' ? 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark' : ''
              }
              onPress={() => setActiveSection(activeSection === 'color' ? null : 'color')}
              size="lg"
            >
              {t('filters.color')}
            </Button>
          </div>

          {/* 类别筛选部分 - 使用手风琴组件 */}
          {activeSection === 'category' && (
            <div className="p-4 border-b border-border-primary-light dark:border-border-primary-dark">
              <Tabs>
                <Tab key="women" title={tNav('women')}>
                  <div className="mt-4">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            isSelected={isCategorySelected(category.id)}
                            onChange={() => handleCategorySelect(category.id, 1)}
                          />
                          <span>{tNav(category.name)}</span>
                        </div>
                      ))}
                    </div>

                    {selectedCategory.length > 0 && (
                      <div className="mt-4">
                        <Accordion>
                          {categories
                            .find((c) => c.id === selectedCategory[0])
                            ?.children?.map((subCategory) => (
                              <AccordionItem
                                key={subCategory.id}
                                aria-label={tNav(subCategory.name)}
                                title={
                                  <div className="flex items-center">
                                    <Checkbox
                                      isSelected={isCategorySelected(subCategory.id)}
                                      onChange={() => handleCategorySelect(subCategory.id, 2)}
                                      className="mr-2"
                                    />
                                    {tNav(subCategory.name)}
                                  </div>
                                }
                              >
                                <div className="ml-6 space-y-2">
                                  {subCategory.children?.map((childCategory) => (
                                    <div
                                      key={childCategory.id}
                                      className="flex items-center gap-2 py-1"
                                    >
                                      <Checkbox
                                        isSelected={isCategorySelected(childCategory.id)}
                                        onChange={() => handleCategorySelect(childCategory.id, 3)}
                                      />
                                      {tNav(childCategory.name)}
                                    </div>
                                  ))}
                                </div>
                              </AccordionItem>
                            )) || []}
                        </Accordion>
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab key="men" title={tNav('men')}>
                  <div className="mt-4">
                    {/* 男装类别逻辑与女装类似 */}
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            isSelected={isCategorySelected(category.id)}
                            onChange={() => handleCategorySelect(category.id, 1)}
                          />
                          <span>{tNav(category.name)}</span>
                        </div>
                      ))}
                    </div>

                    {selectedCategory.length > 0 && (
                      <div className="mt-4">
                        <Accordion>
                          {categories
                            .find((c) => c.id === 'men')
                            ?.children?.map((subCategory) => (
                              <AccordionItem
                                key={subCategory.id}
                                aria-label={tNav(subCategory.name)}
                                title={
                                  <div className="flex items-center">
                                    <Checkbox
                                      isSelected={isCategorySelected(subCategory.id)}
                                      onChange={() => handleCategorySelect(subCategory.id, 2)}
                                      className="mr-2"
                                    />
                                    {tNav(subCategory.name)}
                                  </div>
                                }
                              >
                                <div className="ml-6 space-y-2">
                                  {subCategory.children?.map((childCategory) => (
                                    <div
                                      key={childCategory.id}
                                      className="flex items-center gap-2 py-1"
                                    >
                                      <Checkbox
                                        isSelected={isCategorySelected(childCategory.id)}
                                        onChange={() => handleCategorySelect(childCategory.id, 3)}
                                      />
                                      {tNav(childCategory.name)}
                                    </div>
                                  ))}
                                </div>
                              </AccordionItem>
                            )) || []}
                        </Accordion>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </div>
          )}

          {/* 尺寸筛选部分 */}
          {activeSection === 'size' && (
            <div className="p-4 border-b border-border-primary-light dark:border-border-primary-dark">
              <div className="grid grid-cols-2 gap-2">
                {sizes.map((size) => (
                  <div key={size.id} className="flex items-center gap-2 p-2">
                    <Checkbox
                      isSelected={selectedSizes.includes(size.id)}
                      onChange={() => {
                        setSelectedSizes((prev) =>
                          prev.includes(size.id)
                            ? prev.filter((id) => id !== size.id)
                            : [...prev, size.id]
                        );
                      }}
                    />
                    {size.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 价格筛选部分 */}
          {activeSection === 'price' && (
            <div className="p-4 border-b border-border-primary-light dark:border-border-primary-dark">
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <div key={range.id} className="flex items-center gap-2 p-2">
                    <Checkbox
                      isSelected={selectedPriceRanges.includes(range.id)}
                      onChange={() => {
                        setSelectedPriceRanges((prev) =>
                          prev.includes(range.id)
                            ? prev.filter((id) => id !== range.id)
                            : [...prev, range.id]
                        );
                      }}
                    />
                    {t(`filters.priceRanges.${range.name}`)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 颜色筛选部分 */}
          {activeSection === 'color' && (
            <div className="p-4 border-b border-border-primary-light dark:border-border-primary-dark">
              <div className="grid grid-cols-2 gap-2">
                {colors.map((color) => (
                  <div key={color.id} className="flex items-center gap-2 p-2">
                    <Checkbox
                      isSelected={selectedColors.includes(color.id)}
                      onChange={() => {
                        setSelectedColors((prev) =>
                          prev.includes(color.id)
                            ? prev.filter((id) => id !== color.id)
                            : [...prev, color.id]
                        );
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-border-primary-light dark:border-border-primary-dark"
                        style={{ backgroundColor: color.value }}
                      />
                      {tNav(color.name)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={clearAllFilters}>
            {t('filters.clearAll')}
          </Button>
          <Button color="primary" onPress={onClose}>
            {t('filters.apply')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
