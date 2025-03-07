'use client';

import {
    Button,
    Checkbox,
    Divider,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@heroui/react";
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from "react";

// 类别列表
const categories = [
    { id: 'all', name: 'all' },
    { id: 'clothing', name: 'clothing' },
    { id: 'shoes', name: 'shoes' },
    { id: 'bags', name: 'bags' },
    { id: 'accessories', name: 'accessories' }
];

// 尺码列表
const sizes = [
    { id: 'xs', name: 'XS' },
    { id: 's', name: 'S' },
    { id: 'm', name: 'M' },
    { id: 'l', name: 'L' },
    { id: 'xl', name: 'XL' }
];

// 颜色列表
const colors = [
    { id: 'black', name: 'black', value: '#000000' },
    { id: 'white', name: 'white', value: '#FFFFFF' },
    { id: 'red', name: 'red', value: '#FF0000' },
    { id: 'blue', name: 'blue', value: '#0000FF' },
    { id: 'green', name: 'green', value: '#00FF00' }
];

// 价格范围列表
const priceRanges = [
    { id: 'under1000', name: 'under1000' },
    { id: '1000to5000', name: '1000to5000' },
    { id: '5000to10000', name: '5000to10000' },
    { id: '10000to20000', name: '10000to20000' },
    { id: 'over20000', name: 'over20000' }
];

export interface ProductFiltersProps {
    onSaleOnly: boolean;
    setOnSaleOnly: (value: boolean) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    selectedSizes: string[];
    setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
    selectedColors: string[];
    setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
    selectedPriceRanges: string[];
    setSelectedPriceRanges: React.Dispatch<React.SetStateAction<string[]>>;
    sortOrder: string;
    setSortOrder: (order: string) => void;
    clearAllFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
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
    clearAllFilters
}) => {
    const t = useTranslations('product');
    const tNav = useTranslations('nav');

    return (
        <div className="mb-6 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-sm">
            <div className="p-4 flex flex-wrap items-center gap-2">
                {/* Sale筛选 */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        isSelected={onSaleOnly}
                        onValueChange={setOnSaleOnly}
                    >
                        {t('filters.onSaleOnly')}
                    </Checkbox>
                </div>

                {/* 类别筛选 */}
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" className="flex items-center">
                            {t('filters.category')} <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownTrigger>
                    {/* @ts-ignore */}
                    <DropdownMenu
                        aria-label={t('filters.category')}
                        selectedKeys={[selectedCategory]}
                        onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            setSelectedCategory(selected || 'all');
                        }}
                        selectionMode="single"
                    >
                        {categories.map(category => (
                            <DropdownItem key={category.id}>
                                {tNav(category.name)}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>

                {/* 尺寸筛选 */}
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" className="flex items-center">
                            {t('filters.size')} <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownTrigger>
                    {/* @ts-ignore */}
                    <DropdownMenu
                        aria-label={t('filters.size')}
                    >
                        {sizes.map(size => (
                            <DropdownItem
                                key={size.id}
                                textValue={size.name}
                                onClick={() => {
                                    setSelectedSizes((prev: string[]) =>
                                        prev.includes(size.id)
                                            ? prev.filter((id: string) => id !== size.id)
                                            : [...prev, size.id]
                                    );
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        isSelected={selectedSizes.includes(size.id)}
                                        className="pointer-events-none"
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
                        <Button variant="light" className="flex items-center">
                            {t('filters.price')} <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownTrigger>
                    {/* @ts-ignore */}
                    <DropdownMenu
                        aria-label={t('filters.price')}
                    >
                        {priceRanges.map(range => (
                            <DropdownItem
                                key={range.id}
                                textValue={t(`filters.priceRanges.${range.name}`)}
                                onClick={() => {
                                    setSelectedPriceRanges((prev: string[]) =>
                                        prev.includes(range.id)
                                            ? prev.filter((id: string) => id !== range.id)
                                            : [...prev, range.id]
                                    );
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        isSelected={selectedPriceRanges.includes(range.id)}
                                        className="pointer-events-none"
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
                        <Button variant="light" className="flex items-center">
                            {t('filters.color')} <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownTrigger>
                    {/* @ts-ignore */}
                    <DropdownMenu
                        aria-label={t('filters.color')}
                    >
                        {colors.map(color => (
                            <DropdownItem
                                key={color.id}
                                textValue={color.name}
                                onClick={() => {
                                    setSelectedColors((prev: string[]) =>
                                        prev.includes(color.id)
                                            ? prev.filter((id: string) => id !== color.id)
                                            : [...prev, color.id]
                                    );
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        isSelected={selectedColors.includes(color.id)}
                                        className="pointer-events-none"
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

                <Divider orientation="vertical" className="h-6 mx-2" />

                {/* 清除所有筛选 */}
                <Button variant="light" onClick={clearAllFilters}>
                    {t('filters.clearAll')}
                </Button>

                {/* 排序方式 */}
                <div className="flex items-center gap-2">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{t('filters.sort.title')}:</span>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="light" className="flex items-center">
                                {sortOrder === 'newest' ? t('filters.sort.newest') :
                                    sortOrder === 'price_high_low' ? t('filters.sort.priceHighToLow') :
                                        t('filters.sort.priceLowToHigh')}
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownTrigger>
                        {/* @ts-ignore - 临时绕过NextUI类型检查问题 */}
                        <DropdownMenu
                            aria-label={t('filters.sort.title')}
                            selectedKeys={[sortOrder]}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSortOrder(selected);
                            }}
                            selectionMode="single"
                            items={[
                                { key: "newest", label: t('filters.sort.newest') },
                                { key: "price_high_low", label: t('filters.sort.priceHighToLow') },
                                { key: "price_low_high", label: t('filters.sort.priceLowToHigh') }
                            ]}
                        >
                            {(item) => (
                                <DropdownItem key={item.key}>{item.label}</DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                <Divider orientation="vertical" className="h-6 mx-2" />

                <div className="ml-auto">
                    <Button variant="light" className="flex items-center">
                        {t('filters.moreFilters')} <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductFilters; 