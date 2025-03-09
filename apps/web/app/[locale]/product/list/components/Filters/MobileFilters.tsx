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
} from '@heroui/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { FilterCategory, FilterColor, FilterPriceRange, FilterSize } from './types';

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
}

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
}) => {
  const t = useTranslations('product');
  const tNav = useTranslations('nav');

  return (
    <Modal
      classNames={{
        base: 'bg-bg-secondary-light dark:bg-bg-secondary-dark',
        wrapper: 'bg-black/20',
      }}
      isOpen={isOpen}
      size="full"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
            {t('filters.title')}
          </h2>
          <Button isIconOnly variant="light" onPress={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </ModalHeader>
        <ModalBody>
          <Accordion>
            {/* Sale筛选 */}
            <AccordionItem
              aria-label={t('filters.sale')}
              classNames={{
                title: 'text-text-primary-light dark:text-text-primary-dark',
              }}
              title={t('filters.sale')}
            >
              <div className="py-2">
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
            </AccordionItem>

            {/* 类别筛选 */}
            <AccordionItem
              aria-label={t('filters.category')}
              classNames={{
                title: 'text-text-primary-light dark:text-text-primary-dark',
              }}
              title={t('filters.category')}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <Checkbox
                      classNames={{
                        wrapper:
                          'before:border-border-primary-light dark:before:border-border-primary-dark',
                      }}
                      isSelected={selectedCategory.includes(category.id)}
                      onValueChange={(isSelected) => {
                        setSelectedCategory(isSelected ? [category.id] : []);
                      }}
                    >
                      {tNav(category.name)}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {/* 尺寸筛选 */}
            <AccordionItem
              aria-label={t('filters.size')}
              classNames={{
                title: 'text-text-primary-light dark:text-text-primary-dark',
              }}
              title={t('filters.size')}
            >
              <div className="space-y-2">
                {sizes.map((size) => (
                  <div key={size.id} className="flex items-center">
                    <Checkbox
                      classNames={{
                        wrapper:
                          'before:border-border-primary-light dark:before:border-border-primary-dark',
                      }}
                      isSelected={selectedSizes.includes(size.id)}
                      onValueChange={(isSelected) => {
                        setSelectedSizes((prev) =>
                          isSelected ? [...prev, size.id] : prev.filter((id) => id !== size.id)
                        );
                      }}
                    >
                      {size.name}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {/* 价格筛选 */}
            <AccordionItem
              aria-label={t('filters.price')}
              classNames={{
                title: 'text-text-primary-light dark:text-text-primary-dark',
              }}
              title={t('filters.price')}
            >
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <div key={range.id} className="flex items-center">
                    <Checkbox
                      classNames={{
                        wrapper:
                          'before:border-border-primary-light dark:before:border-border-primary-dark',
                      }}
                      isSelected={selectedPriceRanges.includes(range.id)}
                      onValueChange={(isSelected) => {
                        setSelectedPriceRanges((prev) =>
                          isSelected ? [...prev, range.id] : prev.filter((id) => id !== range.id)
                        );
                      }}
                    >
                      {t(`filters.priceRanges.${range.name}`)}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {/* 颜色筛选 */}
            <AccordionItem
              aria-label={t('filters.color')}
              classNames={{
                title: 'text-text-primary-light dark:text-text-primary-dark',
              }}
              title={t('filters.color')}
            >
              <div className="space-y-2">
                {colors.map((color) => (
                  <div key={color.id} className="flex items-center gap-2">
                    <Checkbox
                      classNames={{
                        wrapper:
                          'before:border-border-primary-light dark:before:border-border-primary-dark',
                      }}
                      isSelected={selectedColors.includes(color.id)}
                      onValueChange={(isSelected) => {
                        setSelectedColors((prev) =>
                          isSelected ? [...prev, color.id] : prev.filter((id) => id !== color.id)
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {tNav(color.name)}
                      </div>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </AccordionItem>
          </Accordion>
        </ModalBody>
        <ModalFooter>
          <Button className="flex-1" variant="bordered" onPress={clearAllFilters}>
            {t('filters.clearAll')}
          </Button>
          <Button className="flex-1" color="primary" onPress={onClose}>
            {t('filters.apply')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
