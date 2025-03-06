/**
 * 产品详情模态框组件
 * 
 * 该组件用于展示产品的详细信息，包括：
 * - 产品图片、名称、品牌
 * - 价格信息（含折扣处理）
 * - 库存状态
 * - 产品描述
 * - 收藏功能
 * - 跳转到商品详情页功能
 */

'use client';

import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Image,
    Link,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader
} from '@heroui/react';
import { ChevronDown, ExternalLink, Heart } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';

/**
 * 产品详情数据结构
 * @interface ProductDetail
 * @property {string} id - 产品唯一标识符
 * @property {string} name - 产品名称
 * @property {string} brand - 品牌名称
 * @property {number} price - 当前价格
 * @property {string} image - 主图片URL
 * @property {string} description - 产品描述
 * @property {number} availableQuantity - 可用库存数量
 * @property {boolean} [isFavorite] - 是否已收藏
 * @property {number} [discount] - 折扣百分比
 * @property {number} [originalPrice] - 原价
 * @property {boolean} [isNew] - 是否新品
 * @property {string[]} [details] - 产品详细信息列表
 * @property {string[]} [images] - 产品图片URL列表
 * @property {string[]} [sizes] - 可选尺码列表
 * @property {Array<{name: string; value: string}>} [colors] - 可选颜色列表
 * @property {string} [material] - 材质信息
 * @property {string[]} [careInstructions] - 保养说明
 * @property {string} [sku] - 商品编号
 * @property {ProductDetail[]} [relatedProducts] - 相关产品列表
 */
export interface ProductDetail {
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
    description: string;
    availableQuantity: number;
    isFavorite?: boolean;
    discount?: number;
    originalPrice?: number;
    isNew?: boolean;
    details?: string[];
    images?: string[];
    sizes?: string[];
    colors?: { name: string; value: string; }[];
    material?: string;
    careInstructions?: string[];
    sku?: string;
    relatedProducts?: ProductDetail[];
}

/**
 * 产品模态框组件属性
 * @interface ProductModalProps
 * @property {ProductDetail} product - 产品详情数据
 * @property {boolean} isOpen - 控制模态框显示状态
 * @property {() => void} onClose - 关闭模态框的回调函数
 * @property {() => void} [onOpenInNewTab] - 可选的新标签页打开回调
 * @property {boolean} [showRedirectButton=true] - 是否显示跳转按钮，默认显示
 */
interface ProductModalProps {
    product: ProductDetail;
    isOpen: boolean;
    onClose: () => void;
    onOpenInNewTab?: () => void; // 设为可选
    showRedirectButton?: boolean; // 是否显示跳转按钮
}

export function ProductModal({
    product,
    isOpen,
    onClose,
    onOpenInNewTab,
    showRedirectButton = true // 默认显示
}: ProductModalProps) {
    const t = useTranslations('product');
    const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);
    const [selectedImage, setSelectedImage] = useState(product.image);

    /**
     * 获取当前语言设置
     * 优先从URL路径中获取语言代码，默认返回'zh'
     * @returns {string} 语言代码
     */
    const getCurrentLocale = () => {
        if (typeof window === 'undefined') return 'zh';
        return window.location.pathname.split('/')[1] || 'zh';
    };

    /**
     * 切换收藏状态
     * 注意：这里只改变了本地状态，实际项目中需要与后端同步
     */
    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    /**
     * 处理新标签页打开商品详情
     * 如果没有提供自定义处理函数，则使用默认实现：
     * - 根据当前语言和商品ID构建跳转URL
     * - 新标签页打开并关闭当前模态框
     */
    const handleOpenInNewTab = onOpenInNewTab || (() => {
        const currentLocale = getCurrentLocale();
        window.open(`/${currentLocale}/track-redirect/product/${product.id}`, '_blank');
        onClose();
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            classNames={{
                base: 'max-w-5xl',
                backdrop: 'bg-black/30 backdrop-blur-sm',
                body: 'p-0',
            }}
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                        {product.name}
                    </h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {product.brand}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <Card className="border-none shadow-none bg-transparent">
                        <CardBody className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {/* 主图片展示区域 - 使用HeroUI的Image组件增强效果 */}
                                    <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
                                        <Image
                                            alt={product.name}
                                            src={selectedImage}
                                            isZoomed
                                            classNames={{
                                                wrapper: 'w-full h-full',
                                                img: 'w-full h-full object-cover object-center',
                                                zoomedWrapper: 'transition-all duration-500'
                                            }}
                                        />
                                        {product.isNew && (
                                            <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white bg-blue-600 dark:bg-blue-700 rounded">
                                                {t('tags.new')}
                                            </span>
                                        )}
                                    </div>

                                    {/* 缩略图展示区域 - 如果有多张图片 */}
                                    {product.images && product.images.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {[product.image, ...product.images].map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImage(img)}
                                                    className={`relative min-w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedImage === img
                                                        ? 'border-primary-500 dark:border-primary-400'
                                                        : 'border-transparent'
                                                        }`}
                                                >
                                                    <Image
                                                        alt={`${product.name} - ${index}`}
                                                        src={img}
                                                        classNames={{
                                                            wrapper: 'w-full h-full',
                                                            img: 'w-full h-full object-cover object-center'
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 产品信息卡片 */}
                                <Card className="border-none shadow-sm dark:shadow-md">
                                    <CardHeader className="pb-0 pt-4 px-4 flex flex-col gap-1">
                                        <div className="flex items-baseline justify-between">
                                            <div className="space-y-1">
                                                <p className={`text-xl font-medium ${product.discount ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                                                    ¥{product.price.toLocaleString()}
                                                </p>
                                                {product.originalPrice && product.discount && (
                                                    <p className="text-sm line-through text-text-tertiary-light dark:text-text-tertiary-dark">
                                                        ¥{product.originalPrice.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            {product.discount && (
                                                <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 dark:bg-red-700 rounded">
                                                    -{product.discount}% {t('discount')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark mt-2">
                                            {product.availableQuantity > 0 ? (
                                                <>
                                                    <span className="text-green-600 dark:text-green-400">{t('inStock')}</span>
                                                    {' - '}{t('availableItems', { count: product.availableQuantity })}
                                                </>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400">{t('outOfStock')}</span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardBody className="py-3 px-4">
                                        <div className="prose prose-sm dark:prose-invert">
                                            <p>{product.description}</p>
                                        </div>

                                        {/* 使用Accordion组件展示产品详情 */}
                                        <div className="mt-4">
                                            {(product.sizes && product.sizes.length > 0) && (
                                                <Accordion variant="bordered" className="mb-2" defaultExpandedKeys={["1"]}>
                                                    <AccordionItem
                                                        key="1"
                                                        aria-label={t('accordion.sizes')}
                                                        title={t('accordion.sizes')}
                                                        startContent={
                                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                                                    <span className="text-xs font-medium">{t('product_count', { count: product.sizes.length })}</span>
                                                                </div>
                                                            </div>
                                                        }
                                                        indicator={({ isOpen }) => (
                                                            <ChevronDown
                                                                className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        )}
                                                        classNames={{
                                                            title: "font-medium text-base",
                                                            trigger: "py-3",
                                                            content: "pb-3"
                                                        }}
                                                    >
                                                        <div className="flex flex-wrap gap-2 py-2">
                                                            {product.sizes.map((size, index) => (
                                                                <Button
                                                                    key={index}
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="min-w-12"
                                                                >
                                                                    {size}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}

                                            {(product.colors && product.colors.length > 0) && (
                                                <Accordion variant="bordered" className="mb-2" defaultExpandedKeys={["1"]}>
                                                    <AccordionItem
                                                        key="1"
                                                        aria-label={t('accordion.colors')}
                                                        title={t('accordion.colors')}
                                                        startContent={
                                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                                                    <span className="text-xs font-medium">{t('product_count', { count: product.colors.length })}</span>
                                                                </div>
                                                            </div>
                                                        }
                                                        indicator={({ isOpen }) => (
                                                            <ChevronDown
                                                                className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        )}
                                                        classNames={{
                                                            title: "font-medium text-base",
                                                            trigger: "py-3",
                                                            content: "pb-3"
                                                        }}
                                                    >
                                                        <div className="flex flex-wrap gap-3 py-2">
                                                            {product.colors.map((color, index) => (
                                                                <Button
                                                                    key={index}
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="min-w-12"
                                                                    style={{ backgroundColor: color.value }}
                                                                >
                                                                    {color.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}

                                            {(product.details && product.details.length > 0) && (
                                                <Accordion variant="bordered" className="mb-2" defaultExpandedKeys={["1"]}>
                                                    <AccordionItem
                                                        key="1"
                                                        aria-label={t('accordion.details')}
                                                        title={t('accordion.details')}
                                                        startContent={
                                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                                                    <span className="text-xs font-medium">{t('product_count', { count: product.details.length })}</span>
                                                                </div>
                                                            </div>
                                                        }
                                                        indicator={({ isOpen }) => (
                                                            <ChevronDown
                                                                className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        )}
                                                        classNames={{
                                                            title: "font-medium text-base",
                                                            trigger: "py-3",
                                                            content: "pb-3"
                                                        }}
                                                    >
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            {product.details.map((detail, index) => (
                                                                <li key={index}>{detail}</li>
                                                            ))}
                                                        </ul>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}

                                            {product.material && (
                                                <Accordion variant="bordered" className="mb-2" defaultExpandedKeys={["1"]}>
                                                    <AccordionItem
                                                        key="1"
                                                        aria-label={t('accordion.material')}
                                                        title={t('accordion.material')}
                                                        indicator={({ isOpen }) => (
                                                            <ChevronDown
                                                                className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        )}
                                                        classNames={{
                                                            title: "font-medium text-base",
                                                            trigger: "py-3",
                                                            content: "pb-3"
                                                        }}
                                                    >
                                                        <p>{product.material}</p>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}

                                            {(product.careInstructions && product.careInstructions.length > 0) && (
                                                <Accordion variant="bordered" className="mb-2" defaultExpandedKeys={["1"]}>
                                                    <AccordionItem
                                                        key="1"
                                                        aria-label={t('accordion.careInstructions')}
                                                        title={t('accordion.careInstructions')}
                                                        startContent={
                                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                                                    <span className="text-xs font-medium">{t('product_count', { count: product.careInstructions.length })}</span>
                                                                </div>
                                                            </div>
                                                        }
                                                        indicator={({ isOpen }) => (
                                                            <ChevronDown
                                                                className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                            />
                                                        )}
                                                        classNames={{
                                                            title: "font-medium text-base",
                                                            trigger: "py-3",
                                                            content: "pb-3"
                                                        }}
                                                    >
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            {product.careInstructions.map((instruction, index) => (
                                                                <li key={index}>{instruction}</li>
                                                            ))}
                                                        </ul>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}
                                        </div>
                                    </CardBody>

                                    {product.sku && (
                                        <CardFooter className="pt-0 pb-3 px-4">
                                            <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                                                {t('sku')}: {product.sku}
                                            </div>
                                        </CardFooter>
                                    )}
                                </Card>
                            </div>
                        </CardBody>
                    </Card>
                </ModalBody>
                <ModalFooter>
                    <div className="w-full flex gap-3">
                        {showRedirectButton ? (
                            <Link
                                isBlock
                                isExternal
                                showAnchorIcon
                                anchorIcon={<ExternalLink className="ml-1 h-4 w-4" />}
                                className="flex-1 py-3 px-4 font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-center"
                                isDisabled={product.availableQuantity === 0}
                                onClick={handleOpenInNewTab}
                            >
                                {t('addToCart')}
                            </Link>
                        ) : null}
                        <Button
                            className={`p-0 min-w-14 w-14 h-14 flex items-center justify-center ${isFavorite
                                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                                : 'bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark'
                                }`}
                            variant="flat"
                            onClick={toggleFavorite}
                            aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        >
                            <Heart className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} />
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 