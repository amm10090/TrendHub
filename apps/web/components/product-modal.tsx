/**
 * 产品模态框组件
 *
 * 该组件是一个简化版的产品详情模态框，用于展示产品的基本信息
 * 并提供跳转到详细产品页面的功能
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
import { useState } from 'react';
import { useTranslations } from 'use-intl';

/**
 * 产品详情数据结构
 */
interface ProductDetail {
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
}

/**
 * 产品模态框组件属性
 */
interface ProductModalProps {
  product: ProductDetail;
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

  /**
   * 切换收藏状态
   */
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
        base: 'max-w-3xl',
        backdrop: 'bg-black/40 backdrop-blur-sm',
        body: 'p-0',
        closeButton:
          'top-3 right-3 text-default-600 hover:bg-default-100 dark:text-default-400 dark:hover:bg-default-200/20 transition-all duration-200',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent className="shadow-xl shadow-primary/10 dark:shadow-2xl transition-all duration-300 scrollbar-hide">
        <ModalHeader className="flex flex-col gap-1 bg-bg-primary-light dark:bg-bg-primary-dark rounded-t-xl px-6 py-5">
          <h2 className="text-xl font-medium text-default-900 dark:text-default-50">
            {product.name}
          </h2>
          <p className="text-sm text-default-600 dark:text-default-400">{product.brand}</p>
        </ModalHeader>
        <ModalBody>
          <Card className="border-none shadow-none bg-bg-primary-light dark:bg-bg-primary-dark rounded-b-xl scrollbar-hide">
            <CardBody className="p-0 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {/* 产品图片区域 */}
                <div className="aspect-3/4 relative overflow-hidden rounded-xl shadow-sm">
                  <Image
                    isZoomed
                    alt={product.name}
                    classNames={{
                      wrapper: 'w-full h-full transition-opacity duration-300',
                      img: 'w-full h-full object-cover object-center transition-transform duration-500 rounded-xl',
                      zoomedWrapper: 'transition-all duration-500',
                    }}
                    src={product.image}
                  />
                </div>

                {/* 产品信息卡片 */}
                <Card className="border border-default-200 dark:border-default-700 shadow-sm dark:shadow-md bg-bg-secondary-light dark:bg-bg-secondary-dark rounded-xl">
                  <CardHeader className="pb-0 pt-5 px-6 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col gap-y-1">
                        <p
                          className={`text-2xl font-medium ${product.discount ? 'text-danger-500 dark:text-danger-400' : 'text-default-900 dark:text-default-50'}`}
                        >
                          ¥{product.price.toLocaleString()}
                        </p>
                        {product.originalPrice && product.discount && (
                          <p className="text-sm line-through text-default-400 dark:text-default-500">
                            ¥{product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {product.discount && (
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

                  <CardBody className="py-4 px-6">
                    <div className="prose prose-sm dark:prose-invert text-default-900 dark:text-default-50">
                      <p>{product.description}</p>
                    </div>
                  </CardBody>

                  <CardFooter className="px-6 pt-0 pb-6 flex flex-col gap-3">
                    {/* 购买和收藏按钮 */}
                    <div className="w-full flex gap-3 mt-3">
                      {showRedirectButton ? (
                        <Link
                          isBlock
                          isExternal
                          showAnchorIcon
                          anchorIcon={<ExternalLink className="ml-1 h-4 w-4" />}
                          className="flex-1 py-3.5 px-5 font-medium bg-primary-500 text-white dark:bg-primary-600 dark:text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 hover:scale-102 shadow-md shadow-primary/10 transition-all duration-200 text-center"
                          isDisabled={product.availableQuantity === 0}
                          onPress={handleOpenInNewTab}
                        >
                          {trackT('redirect_now')}
                        </Link>
                      ) : null}
                      <Button
                        aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        className={`p-0 min-w-14 w-14 h-14 flex items-center justify-center rounded-lg shadow-md shadow-primary/10 hover:scale-105 transition-all duration-200 ${
                          isFavorite
                            ? 'bg-danger-500 text-white hover:bg-danger-600 dark:bg-danger-600 dark:hover:bg-danger-700'
                            : 'bg-default-100 dark:bg-default-800 text-default-900 dark:text-default-50 hover:bg-default-200 dark:hover:bg-default-700'
                        }`}
                        variant="flat"
                        onPress={toggleFavorite}
                      >
                        <Heart className="h-6 w-6" fill={isFavorite ? 'currentColor' : 'none'} />
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
