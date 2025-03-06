'use client';

import {
    Breadcrumbs,
    BreadcrumbItem,
    Button,
    Image,
    Checkbox,
    Spacer,
    Avatar,
    Divider,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Card,
    CardBody
} from "@heroui/react";
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';
import { type NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { ProductDetail as ModalProductDetail } from '@/components/product-detail/product-modal';
import { useProductModal } from '@/contexts/product-modal-context';
import { mockProducts, mockProductDetails } from '@/types/product';

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

const ProductListPage: NextPage = () => {
    const t = useTranslations('product');
    const tNav = useTranslations('nav');
    const tBrands = useTranslations('brands');
    const [showTopButton, setShowTopButton] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [favorites, setFavorites] = useState<string[]>([]);
    const { openProductModal } = useProductModal();

    // 清除所有筛选
    const clearAllFilters = () => {
        setSelectedCategory('all');
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedPriceRanges([]);
        setOnSaleOnly(false);
        setSortOrder('newest');
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
    const toggleFavorite = (productId: string) => {
        setFavorites(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // 打开产品详情模态框
    const navigateToProduct = (productId: string) => {
        const productDetail = mockProductDetails[productId];
        if (productDetail) {
            // 转换为模态框需要的ProductDetail类型
            const modalProductDetail: ModalProductDetail = {
                ...productDetail,
                // 确保relatedProducts是ModalProductDetail[]类型
                relatedProducts: productDetail.relatedProducts?.map(p => ({
                    ...p,
                    description: '',  // 添加必需的字段
                    availableQuantity: 0,
                    details: [],
                    images: [p.image],
                    sizes: [],
                    colors: [],
                    material: '',
                    careInstructions: [],
                    sku: '',
                    relatedProducts: []
                })) || []
            };
            openProductModal(modalProductDetail);
        }
    };

    // 筛选产品
    const filteredProducts = mockProducts.filter(product => {
        // 尺码筛选
        if (selectedSizes.length > 0) {
            // 由于Product类型没有sizes属性，我们这里先简单处理
            // 实际应用中需要根据产品尺码进行筛选
            return false;
        }

        // 颜色筛选
        if (selectedColors.length > 0) {
            // 由于Product类型没有colors属性，我们这里先简单处理
            // 实际应用中需要根据产品颜色进行筛选
            return false;
        }

        // 价格范围筛选
        if (selectedPriceRanges.length > 0) {
            const matchesPrice = selectedPriceRanges.some(range => {
                if (range === 'under1000' && product.price < 1000) return true;
                if (range === '1000to5000' && product.price >= 1000 && product.price <= 5000) return true;
                if (range === '5000to10000' && product.price >= 5000 && product.price <= 10000) return true;
                if (range === '10000to20000' && product.price >= 10000 && product.price <= 20000) return true;
                if (range === 'over20000' && product.price > 20000) return true;
                return false;
            });
            if (!matchesPrice) return false;
        }

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

    // 对筛选后的产品进行排序
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortOrder) {
            case 'newest':
                // 假设id越大表示越新
                return parseInt(b.id) - parseInt(a.id);
            case 'price_high_low':
                return b.price - a.price;
            case 'price_low_high':
                return a.price - b.price;
            default:
                return 0;
        }
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
                                {t('product_count', { count: sortedProducts.length })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* LYST风格筛选栏 */}
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
                                            setSelectedSizes(prev =>
                                                prev.includes(size.id)
                                                    ? prev.filter(id => id !== size.id)
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
                                            setSelectedPriceRanges(prev =>
                                                prev.includes(range.id)
                                                    ? prev.filter(id => id !== range.id)
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
                                            setSelectedColors(prev =>
                                                prev.includes(color.id)
                                                    ? prev.filter(id => id !== color.id)
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

                {/* 产品网格 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 mb-10">
                    {sortedProducts.map((product) => (
                        <Card
                            key={product.id}
                            isPressable={false}
                            isHoverable
                            shadow="sm"
                            className="overflow-hidden border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md relative"
                        >
                            {/* 点击区域 - 覆盖整个卡片但排除收藏按钮 */}
                            <div
                                className="absolute inset-0 z-[15] cursor-pointer"
                                onClick={() => navigateToProduct(product.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        navigateToProduct(product.id);
                                    }
                                }}
                                aria-label={`查看${product.name}详情`}
                            ></div>

                            {/* 图片容器 - 设置固定宽高比 */}
                            <div className="relative w-full aspect-square overflow-hidden">
                                {/* 图片包装器 */}
                                <div className="absolute inset-0 z-[5]">
                                    <Image
                                        removeWrapper
                                        isZoomed
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* 产品标签 - 绝对定位在图片上，提高z-index确保在图片上方 */}
                                <div className="absolute top-0 left-0 right-0 p-1.5 flex justify-between z-[20]">
                                    <div className="flex gap-1">
                                        {product.isNew && (
                                            <div className="bg-black text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                                {t('tags.new')}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {product.discount && (
                                            <div className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                                -{product.discount}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 收藏按钮 - 绝对定位在图片上，z-index高于点击区域 */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className="absolute bottom-1.5 right-1.5 bg-white/90 dark:bg-black/70 rounded-full z-[50] shadow-sm transition-transform duration-200 hover:scale-110 flex items-center justify-center w-7 h-7 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(product.id);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFavorite(product.id);
                                        }
                                    }}
                                    aria-label={`收藏${product.name}`}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'}`}
                                    />
                                </div>
                            </div>

                            <CardBody className="p-2.5">
                                <h3 className="text-text-primary-light dark:text-text-primary-dark font-semibold text-sm">{product.brand}</h3>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs line-clamp-1">{product.name}</p>
                                <div className="flex justify-between items-center w-full mt-1.5">
                                    <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
                                        ¥{product.price.toLocaleString()}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="text-text-tertiary-light dark:text-text-tertiary-dark line-through text-xs ml-1.5">
                                            ¥{product.originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 返回顶部按钮 */}
            {showTopButton && (
                <Button
                    className="fixed bottom-4 right-4 rounded-full w-10 h-10 bg-bg-tertiary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark shadow-md hover:shadow-lg z-10"
                    onClick={scrollToTop}
                    aria-label="返回顶部"
                >
                    <ChevronUp className="w-5 h-5" />
                </Button>
            )}
        </div>
    );
};

export default ProductListPage; 