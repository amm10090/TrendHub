'use client';

import { Button, Image, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';

// 产品类型定义
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

    // 获取当前语言
    const getCurrentLocale = () => {
        if (typeof window === 'undefined') return 'zh';
        return window.location.pathname.split('/')[1] || 'zh';
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    // 如果没有提供onOpenInNewTab，则创建一个默认实现
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
                base: 'max-w-4xl',
                backdrop: 'bg-black/20 backdrop-blur-sm',
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-bg-primary-light dark:bg-bg-secondary-dark shadow-[inset_0_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
                                <Image
                                    alt={product.name}
                                    src={product.image}
                                    classNames={{
                                        wrapper: 'w-full h-full',
                                        img: 'w-full h-full object-cover object-center',
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-6 p-4">
                            <div>
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
                                            -{product.discount}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
                                    {product.availableQuantity > 0 ? (
                                        <>
                                            <span className="text-green-600 dark:text-green-400">{t('inStock')}</span>
                                            {' - '}{t('availableItems', { count: product.availableQuantity })}
                                        </>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400">{t('outOfStock')}</span>
                                    )}
                                </div>
                                <div className="prose prose-sm dark:prose-invert">
                                    <p>{product.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="w-full flex gap-3">
                        {showRedirectButton ? (
                            <Button
                                className="flex-1 py-6 font-medium"
                                isDisabled={product.availableQuantity === 0}
                                onClick={handleOpenInNewTab}
                            >
                                {t('addToCart')}
                            </Button>
                        ) : null}
                        <Button
                            className={`p-0 min-w-14 w-14 h-14 flex items-center justify-center ${isFavorite
                                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                                : 'bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark'
                                }`}
                            variant="flat"
                            onClick={toggleFavorite}
                        >
                            <Heart className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} />
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 