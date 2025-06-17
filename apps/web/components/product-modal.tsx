/**
 * 产品模态框组件 (更新版)
 *
 * 使用标准 ProductDetail 类型
 */

'use client';

import {
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
  ModalHeader,
} from '@heroui/react';
import { ExternalLink, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

// 导入标准 ProductDetail 类型
import { type ProductDetail as AppProductDetailType } from '@/types/product';

/**
 * 产品模态框组件属性 (使用标准类型)
 */
interface ProductModalProps {
  product: AppProductDetailType;
  isOpen: boolean;
  onClose: () => void;
  onOpenInNewTab?: () => void;
  showRedirectButton?: boolean;
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onOpenInNewTab,
  showRedirectButton = true,
}: ProductModalProps) {
  const t = useTranslations('product');
  const trackT = useTranslations('track');
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);

  // 当 product prop 变化时，同步 isFavorite 状态
  useEffect(() => {
    setIsFavorite(product.isFavorite || false);
  }, [product.isFavorite, product.id]);

  /**
   * 切换收藏状态
   */
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: 调用 API 更新收藏状态
  };

  /**
   * 获取当前语言设置
   */
  const getCurrentLocale = (): string => {
    if (typeof window === 'undefined') return 'zh';

    return window.location.pathname.split('/')[1] || 'zh';
  };

  /**
   * 处理新标签页打开商品详情
   */
  const handleOpenInNewTab =
    onOpenInNewTab ||
    (() => {
      const currentLocale = getCurrentLocale();

      window.open(`/${currentLocale}/track-redirect/product/${product.id}`, '_blank');
      onClose();
    });

  return (
    <Modal
      classNames={{
        base: 'max-w-sm sm:max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-4 max-h-[90vh]',
        backdrop: 'bg-black/40 backdrop-blur-sm',
        body: 'p-0',
        closeButton:
          'top-3 right-3 text-default-600 hover:bg-default-100 dark:text-default-400 dark:hover:bg-default-200/20 transition-all duration-200',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent className="shadow-xl shadow-primary/10 dark:shadow-2xl transition-all duration-300 scrollbar-hide max-h-[90vh] flex flex-col">
        <ModalHeader className="flex-shrink-0 flex flex-col gap-1 bg-bg-primary-light dark:bg-bg-primary-dark rounded-t-xl px-4 sm:px-6 py-2 sm:py-4">
          <h2 className="text-lg sm:text-xl font-medium text-default-900 dark:text-default-50">
            {product.name}
          </h2>
          <p className="text-sm text-default-600 dark:text-default-400">{product.brand.name}</p>
        </ModalHeader>
        <ModalBody className="flex-1 min-h-0">
          <Card className="border-none shadow-none bg-bg-primary-light dark:bg-bg-primary-dark rounded-b-xl scrollbar-hide h-full">
            <CardBody className="p-0 scrollbar-hide h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 h-full">
                {/* 产品图片区域 */}
                <div className="aspect-3/4 lg:aspect-[4/5] relative overflow-hidden rounded-lg sm:rounded-xl shadow-sm max-h-[45vh] lg:max-h-[50vh] xl:max-h-[55vh]">
                  <Image
                    isZoomed
                    alt={product.name}
                    classNames={{
                      wrapper: 'w-full h-full transition-opacity duration-300',
                      img: 'w-full h-full object-cover object-center transition-transform duration-500 rounded-lg sm:rounded-xl',
                      zoomedWrapper: 'transition-all duration-500',
                    }}
                    src={product.images?.[0] || '/images/products/placeholder.jpg'}
                  />
                </div>

                {/* 产品信息卡片 */}
                <Card className="border border-default-200 dark:border-default-700 shadow-sm dark:shadow-md bg-bg-secondary-light dark:bg-bg-secondary-dark rounded-lg sm:rounded-xl flex flex-col h-full">
                  <CardHeader className="flex-shrink-0 pb-0 pt-3 sm:pt-4 px-3 sm:px-6 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col gap-y-1">
                        <p
                          className={`text-xl sm:text-2xl font-medium ${product.discount ? 'text-danger-500 dark:text-danger-400' : 'text-default-900 dark:text-default-50'}`}
                        >
                          ¥{Number(product.price).toLocaleString()}
                        </p>
                        {product.originalPrice && product.discount && (
                          <p className="text-sm line-through text-default-400 dark:text-default-500">
                            ¥{Number(product.originalPrice).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {product.discount != null && (
                        <span className="px-2.5 py-1 text-xs font-medium text-white bg-danger-500 dark:bg-danger-600 rounded-md shadow-sm">
                          -{product.discount}% {t('discount')}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-default-500 dark:text-default-400 mt-3">
                      {product.availableQuantity > 0 ? (
                        <>
                          <span className="text-success-600 dark:text-success-400 font-medium">
                            {t('inStock')}
                          </span>
                          {' - '}
                          {t('availableItems', { count: product.availableQuantity })}
                        </>
                      ) : (
                        <span className="text-danger-600 dark:text-danger-400 font-medium">
                          {t('outOfStock')}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardBody className="flex-1 py-3 sm:py-4 px-3 sm:px-6 overflow-y-auto min-h-0">
                    <div className="prose prose-sm dark:prose-invert text-default-900 dark:text-default-50">
                      <p className="text-sm sm:text-base leading-relaxed line-clamp-4">
                        {product.description}
                      </p>
                    </div>
                  </CardBody>

                  <CardFooter className="flex-shrink-0 px-3 sm:px-6 pt-2 pb-3 sm:pb-5 flex flex-col gap-1 sm:gap-2 border-t border-default-200 dark:border-default-700">
                    {/* 购买和收藏按钮 */}
                    <div className="w-full flex gap-2 sm:gap-3">
                      {showRedirectButton ? (
                        <Link
                          isBlock
                          isExternal
                          showAnchorIcon
                          anchorIcon={<ExternalLink className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />}
                          className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-5 font-medium bg-primary-500 text-white dark:bg-primary-600 dark:text-white rounded-md sm:rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 hover:scale-102 shadow-md shadow-primary/10 transition-all duration-200 text-center text-sm sm:text-base"
                          isDisabled={product.availableQuantity === 0}
                          onPress={handleOpenInNewTab}
                        >
                          {trackT('redirect_now')}
                        </Link>
                      ) : null}
                      <Button
                        aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        className={`p-0 min-w-10 w-10 h-10 sm:min-w-14 sm:w-14 sm:h-14 flex items-center justify-center rounded-md sm:rounded-lg shadow-md shadow-primary/10 hover:scale-105 transition-all duration-200 ${
                          isFavorite
                            ? 'bg-danger-500 text-white hover:bg-danger-600 dark:bg-danger-600 dark:hover:bg-danger-700'
                            : 'bg-default-100 dark:bg-default-800 text-default-900 dark:text-default-50 hover:bg-default-200 dark:hover:bg-default-700'
                        }`}
                        variant="flat"
                        onPress={toggleFavorite}
                      >
                        <Heart
                          className="h-4 w-4 sm:h-6 sm:w-6"
                          fill={isFavorite ? 'currentColor' : 'none'}
                        />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
