'use client';

import {
    Breadcrumbs,
    BreadcrumbItem,
    Button,
    Image,
    Checkbox,
    Radio,
    Spacer,
    Avatar,
    Divider,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Card,
    CardBody,
    CardFooter
} from "@heroui/react";
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';
import { type NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { mockProducts } from '@/types/product';

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

// 样式列表
const styles = [
    { id: 'casual', name: 'casual' },
    { id: 'formal', name: 'formal' },
    { id: 'sporty', name: 'sporty' },
    { id: 'vintage', name: 'vintage' }
];

// 价格范围列表
const priceRanges = [
    { id: 'under1000', name: 'under1000' },
    { id: '1000to5000', name: '1000to5000' },
    { id: '5000to10000', name: '5000to10000' },
    { id: '10000to20000', name: '10000to20000' },
    { id: 'over20000', name: 'over20000' }
];

const ProductListPage: NextPage = () => {
    const t = useTranslations('product');
    const tNav = useTranslations('nav');
    const tBrands = useTranslations('brands');
    const router = useRouter();
    const [showTopButton, setShowTopButton] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [favorites, setFavorites] = useState<string[]>([]);

    // 处理尺码选择
    const handleSizeChange = (sizeId: string) => {
        setSelectedSizes(prev =>
            prev.includes(sizeId)
                ? prev.filter(id => id !== sizeId)
                : [...prev, sizeId]
        );
    };

    // 处理颜色选择
    const handleColorChange = (colorId: string) => {
        setSelectedColors(prev =>
            prev.includes(colorId)
                ? prev.filter(id => id !== colorId)
                : [...prev, colorId]
        );
    };

    // 处理样式选择
    const handleStyleChange = (styleId: string) => {
        setSelectedStyles(prev =>
            prev.includes(styleId)
                ? prev.filter(id => id !== styleId)
                : [...prev, styleId]
        );
    };

    // 处理价格范围选择
    const handlePriceRangeChange = (rangeId: string) => {
        setSelectedPriceRanges(prev =>
            prev.includes(rangeId)
                ? prev.filter(id => id !== rangeId)
                : [...prev, rangeId]
        );
    };

    // 清除所有筛选
    const clearAllFilters = () => {
        setSelectedCategory('all');
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedStyles([]);
        setSelectedPriceRanges([]);
        setOnSaleOnly(false);
    };

    // 监听滚动事件，控制返回顶部按钮显示
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowTopButton(true);
            } else {
                setShowTopButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 返回顶部函数
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // 品牌信息
    const brandInfo = {
        name: 'GUCCI',
        logo: '/images/brands/gucci-logo.png', // 确保这个路径是正确的
    };

    // 切换收藏状态
    const toggleFavorite = (productId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setFavorites(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // 导航到产品详情页
    const navigateToProduct = (productId: string) => {
        router.push(`/product/${productId}`);
    };

    // 筛选后的产品
    const filteredProducts = mockProducts.filter(product => {
        // 类别筛选
        if (selectedCategory !== 'all') {
            // 由于Product类型没有categories属性，我们这里先简单处理
            // 实际应用中可能需要根据产品类别进行筛选
            return false;
        }

        // 折扣筛选
        if (onSaleOnly && !product.discount) return false;

        return true;
    });

    return (
        <div className="flex flex-col min-h-full bg-bg-primary-light dark:bg-bg-primary-dark">
            <div className="container mx-auto px-4">
                {/* 面包屑导航 */}
                <div className="py-4">
                    <Breadcrumbs>
                        <BreadcrumbItem href="/">{t('breadcrumb.home')}</BreadcrumbItem>
                        <BreadcrumbItem href="/designers">{tNav('brands')}</BreadcrumbItem>
                        <BreadcrumbItem>{brandInfo.name}</BreadcrumbItem>
                    </Breadcrumbs>
                </div>

                {/* 品牌信息顶部容器 - LYST风格 */}
                <div className="w-full bg-white dark:bg-bg-secondary-dark rounded-lg shadow-sm mb-6">
                    <div className="p-6 flex items-center">
                        <div className="flex-1 flex items-center gap-6">
                            <Avatar
                                src={brandInfo.logo}
                                alt={brandInfo.name}
                                size="lg"
                                className="border border-border-primary-light dark:border-border-primary-dark"
                            />
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                                    {brandInfo.name}
                                </h1>
                                <Spacer y={1} />
                                <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-3xl">
                                    {tBrands(`descriptions.${brandInfo.name.toLowerCase()}`)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                                {t('product_count', { count: filteredProducts.length })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* LYST风格筛选栏 */}
                <div className="mb-6 bg-white dark:bg-bg-secondary-dark rounded-lg shadow-sm">
                    <div className="p-4 flex flex-wrap items-center gap-2">
                        {/* Sale筛选 */}
                        <div className="flex items-center mr-4">
                            <Checkbox
                                checked={onSaleOnly}
                                onChange={() => setOnSaleOnly(!onSaleOnly)}
                                className="mr-2"
                            >
                                {t('filters.sale')}
                            </Checkbox>
                        </div>

                        {/* 类别筛选 */}
                        <Dropdown>
                            <DropdownTrigger>
                                <Button variant="light" className="flex items-center">
                                    {t('filters.category')} <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label={t('filters.category')}>
                                {categories.map(category => (
                                    <DropdownItem
                                        key={category.id}
                                        textValue={tNav(category.name)}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Radio
                                                value={category.id}
                                                checked={selectedCategory === category.id}
                                                className="pointer-events-none"
                                            />
                                            {tNav(category.name)}
                                        </div>
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
                            <DropdownMenu aria-label={t('filters.size')}>
                                {sizes.map(size => (
                                    <DropdownItem
                                        key={size.id}
                                        textValue={size.name}
                                        onClick={() => handleSizeChange(size.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedSizes.includes(size.id)}
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
                            <DropdownMenu aria-label={t('filters.price')}>
                                {priceRanges.map(range => (
                                    <DropdownItem
                                        key={range.id}
                                        textValue={t(`filters.priceRanges.${range.name}`)}
                                        onClick={() => handlePriceRangeChange(range.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedPriceRanges.includes(range.id)}
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
                            <DropdownMenu aria-label={t('filters.color')}>
                                {colors.map(color => (
                                    <DropdownItem
                                        key={color.id}
                                        textValue={color.name}
                                        onClick={() => handleColorChange(color.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedColors.includes(color.id)}
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
                                <DropdownMenu
                                    aria-label={t('filters.sort.title')}
                                    selectedKeys={[sortOrder]}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0] as string;
                                        setSortOrder(selected);
                                    }}
                                    selectionMode="single"
                                >
                                    <DropdownItem key="newest">{t('filters.sort.newest')}</DropdownItem>
                                    <DropdownItem key="price_high_low">{t('filters.sort.priceHighToLow')}</DropdownItem>
                                    <DropdownItem key="price_low_high">{t('filters.sort.priceLowToHigh')}</DropdownItem>
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

                {/* 产品网格 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                    {mockProducts.map((product) => (
                        <Card
                            key={product.id}
                            isHoverable
                            shadow="sm"
                            className="overflow-hidden"
                        >
                            <div
                                className="cursor-pointer"
                                onClick={() => navigateToProduct(product.id)}
                            >
                                <CardBody className="p-0 overflow-hidden">
                                    <div className="relative">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-48 object-cover transform transition-transform group-hover:scale-105"
                                            classNames={{
                                                wrapper: "w-full h-48"
                                            }}
                                        />

                                        {/* 产品标签 */}
                                        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between">
                                            <div className="flex gap-1">
                                                {product.isNew && (
                                                    <div className="bg-black text-white text-xs font-bold px-2 py-1">
                                                        {t('tags.new')}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                {product.discount && (
                                                    <div className="bg-red-600 text-white text-xs font-bold px-2 py-1">
                                                        -{product.discount}%
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 收藏按钮 */}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="absolute bottom-2 right-2 bg-white/80 dark:bg-black/50 rounded-full z-10"
                                            onClick={(e) => toggleFavorite(product.id, e)}
                                        >
                                            <Heart
                                                className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'}`}
                                            />
                                        </Button>
                                    </div>
                                </CardBody>

                                <CardFooter className="flex flex-col items-start text-left p-3">
                                    <h3 className="text-text-primary-light dark:text-text-primary-dark font-medium text-base">{product.brand}</h3>
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{product.name}</p>
                                    <div className="flex justify-between items-center w-full mt-2">
                                        <span className="font-bold text-text-primary-light dark:text-text-primary-dark">
                                            ¥{product.price.toLocaleString()}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-text-tertiary-light dark:text-text-tertiary-dark line-through text-sm">
                                                ¥{product.originalPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </CardFooter>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 返回顶部按钮 */}
            {showTopButton && (
                <Button
                    className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark shadow-md hover:shadow-lg z-10"
                    onClick={scrollToTop}
                    aria-label="返回顶部"
                >
                    <ChevronUp className="w-6 h-6" />
                </Button>
            )}
        </div>
    );
};

export default ProductListPage; 