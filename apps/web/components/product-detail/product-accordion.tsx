'use client';

import { Accordion, AccordionItem } from '@heroui/react';
import { useTranslations } from 'use-intl';

import { ProductDetail } from '@/types/product';

interface ProductAccordionProps {
    product: ProductDetail;
}

/**
 * 商品详情折叠面板组件
 * 使用Accordion组件展示商品的详细描述、材质和保养说明等信息
 */
export function ProductAccordion({ product }: ProductAccordionProps) {
    const t = useTranslations('product');

    // 准备折叠面板项目数据
    const accordionItems = [
        {
            key: 'description',
            title: t('accordion.description'),
            content: (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p className="mb-4">{product.description}</p>
                    {product.details && product.details.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1">
                            {product.details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ),
        },
        {
            key: 'material',
            title: t('accordion.material'),
            content: (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p>{product.material}</p>
                </div>
            ),
        },
        {
            key: 'care',
            title: t('accordion.care'),
            content: (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {product.careInstructions && product.careInstructions.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                            {product.careInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('accordion.noCareInstructions')}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'shipping',
            title: t('accordion.shipping'),
            content: (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p className="mb-2">{t('accordion.shippingInfo.free')}</p>
                    <p className="mb-2">{t('accordion.shippingInfo.delivery', { days: 3 })}</p>
                    <p>{t('accordion.shippingInfo.international')}</p>
                </div>
            ),
        },
        {
            key: 'returns',
            title: t('accordion.returns'),
            content: (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <p className="mb-2">{t('accordion.returnsInfo.free')}</p>
                    <p>{t('accordion.returnsInfo.period', { days: 30 })}</p>
                </div>
            ),
        },
    ];

    return (
        <div className="mt-6 border-t border-border-primary-light dark:border-border-primary-dark pt-6">
            <Accordion>
                {accordionItems.map((item) => (
                    <AccordionItem
                        key={item.key}
                        aria-label={item.title}
                        title={item.title}
                        classNames={{
                            base: 'group border-b border-border-primary-light dark:border-border-primary-dark py-3',
                            title: 'text-sm font-medium text-text-primary-light dark:text-text-primary-dark',
                            trigger: 'data-[hover=true]:bg-bg-secondary-light dark:data-[hover=true]:bg-bg-tertiary-dark rounded-md py-1 px-2',
                            content: 'text-text-secondary-light dark:text-text-secondary-dark pt-2 pb-3 px-3',
                            indicator: 'text-text-secondary-light dark:text-text-secondary-dark',
                        }}
                    >
                        {item.content}
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
} 