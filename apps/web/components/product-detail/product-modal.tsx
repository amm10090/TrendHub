/**
 * 产品详情模态框组件
 *
 * 该组件用于展示产品的详细信息，包括：
 * - 产品图片轮播展示
 * - 产品名称、品牌、价格信息
 * - 库存状态
 * - 产品描述和详细信息
 * - 收藏功能
 * - 跳转到商品详情页功能
 * - Lyst风格的"Buy Now"按钮
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
  ModalHeader,
} from '@heroui/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Info,
  Layers,
  Palette,
  Ruler,
  Shirt,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';

// 从共享类型导入 ProductDetail
import type { ProductDetail as SharedProductDetailType } from '@/types/product';

/**
 * 产品模态框组件属性
 * @interface ProductModalProps
 * @property {SharedProductDetailType} product - 产品详情数据 (使用共享类型)
 * @property {boolean} isOpen - 控制模态框显示状态
 * @property {() => void} onClose - 关闭模态框的回调函数
 * @property {() => void} [onOpenInNewTab] - 可选的新标签页打开回调
 * @property {boolean} [showRedirectButton=true] - 是否显示跳转按钮，默认显示
 */
interface ProductModalProps {
  product: SharedProductDetailType; // 使用导入的共享类型
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // activeImage 初始化使用 product.images[0] (如果存在)
  const [activeImage, setActiveImage] = useState(
    product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // allImages 直接使用 product.images (确保 product.images 总是数组)
  const allImages = useMemo(() => {
    return product.images && product.images.length > 0
      ? product.images
      : ['/images/placeholder.jpg'];
  }, [product.images]);

  // 修改图片切换函数，添加过渡动画逻辑
  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = (selectedImageIndex + 1) % allImages.length;

    setTimeout(() => {
      setSelectedImageIndex(newIndex);
      setActiveImage(allImages[newIndex]);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 50);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = selectedImageIndex === 0 ? allImages.length - 1 : selectedImageIndex - 1;

    setTimeout(() => {
      setSelectedImageIndex(newIndex);
      setActiveImage(allImages[newIndex]);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 50);
  };

  const setImageByIndex = (index: number) => {
    if (isTransitioning || index === selectedImageIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedImageIndex(index);
      setActiveImage(allImages[index]);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 50);
  };

  // 当产品变化时重置图片索引
  useEffect(() => {
    setSelectedImageIndex(0);
    // setActiveImage(product.image); // 改为使用 images[0]
    setActiveImage(
      product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg'
    );
  }, [product]);

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
        base: 'max-w-6xl',
        backdrop: 'bg-black/40 backdrop-blur-sm',
        body: 'p-0',
        closeButton:
          'top-3 right-3 text-text-tertiary-light dark:text-text-tertiary-dark hover:bg-bg-tertiary-light dark:hover:bg-bg-tertiary-dark transition-all duration-200',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent className="shadow-xl dark:shadow-2xl transition-all duration-300 scrollbar-hide">
        <ModalHeader className="flex flex-col gap-1 bg-[#EDF5FF] dark:bg-bg-primary-dark rounded-t-xl px-6 py-4">
          <h2 className="text-xl font-medium text-[#001833] dark:text-text-primary-dark">
            {product.name}
          </h2>
          {/* product.brand 现在是对象，需要访问其 name 属性 */}
          <p className="text-sm text-[#004A94] dark:text-text-secondary-dark">
            {product.brand.name}
          </p>
        </ModalHeader>
        <ModalBody>
          <Card className="border-none shadow-none bg-[#ffffff] dark:bg-bg-primary-dark rounded-b-xl scrollbar-hide">
            <CardBody className="p-0 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
                {/* 产品图片轮播区域 - Lyst风格 */}
                <div className="flex flex-col gap-y-3">
                  <div className="aspect-[4/5] relative overflow-hidden rounded-xl shadow-sm">
                    {/* 主图片 */}
                    <Image
                      isZoomed={false}
                      alt={product.name}
                      classNames={{
                        wrapper: 'w-full h-full transition-opacity duration-300',
                        img: 'w-full h-full object-cover object-center transition-transform duration-500 rounded-xl',
                        zoomedWrapper: 'transition-all duration-500',
                      }}
                      src={activeImage}
                    />

                    {/* NEW标签 - 提高z-index确保显示在图片上方 */}
                    {product.isNew && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium text-[#ffffff] bg-[#0080FF] dark:bg-blue-700 rounded-md shadow-sm z-20">
                        {t('tags.new')}
                      </span>
                    )}

                    {/* 左右箭头导航 - 圆润设计 */}
                    {allImages.length > 1 && (
                      <>
                        <Button
                          isIconOnly
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#ffffff]/90 dark:bg-bg-tertiary-dark/90 rounded-full w-9 h-9 flex items-center justify-center z-10 shadow-md hover:bg-[#F3F4F6] hover:scale-105 dark:hover:bg-bg-tertiary-dark transition-all duration-200"
                          onPress={prevImage}
                          variant="flat"
                        >
                          <ChevronLeft className="h-5 w-5 text-[#1a1a1a] dark:text-text-primary-dark" />
                        </Button>
                        <Button
                          isIconOnly
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#ffffff]/90 dark:bg-bg-tertiary-dark/90 rounded-full w-9 h-9 flex items-center justify-center z-10 shadow-md hover:bg-[#F3F4F6] hover:scale-105 dark:hover:bg-bg-tertiary-dark transition-all duration-200"
                          onPress={nextImage}
                          variant="flat"
                        >
                          <ChevronRight className="h-5 w-5 text-[#1a1a1a] dark:text-text-primary-dark" />
                        </Button>
                      </>
                    )}

                    {/* 底部指示器 - 长条短条设计（黑白色自适应） */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-x-2 z-10">
                        {allImages.map((_, index) => (
                          <Button
                            isIconOnly
                            key={index}
                            aria-label={`Go to image ${index + 1}`}
                            className={`transition-all duration-300 rounded-full ${
                              selectedImageIndex === index
                                ? 'w-8 h-1.5 bg-[#1a1a1a] dark:bg-text-primary-dark'
                                : 'w-1.5 h-1.5 bg-[#999999]/30 dark:bg-text-tertiary-dark/50 hover:bg-[#666666]/60 dark:hover:bg-text-tertiary-dark/70'
                            }`}
                            onPress={() => setImageByIndex(index)}
                            variant="flat"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 缩略图导航 - Lyst风格 */}
                  {allImages.length > 1 && (
                    <div className="overflow-x-auto flex gap-x-2 pb-1 scrollbar-hide px-1">
                      {allImages.map((image, index) => (
                        <Button
                          key={index}
                          aria-label={`选择图片 ${index + 1}`}
                          className={`relative min-w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                            index === selectedImageIndex
                              ? 'opacity-100 scale-105 shadow-md ring-2 ring-[#D0E4FF] dark:ring-border-primary-dark'
                              : 'opacity-70 hover:opacity-100 hover:scale-102 hover:shadow-sm hover:ring-1 hover:ring-[#D0E4FF] dark:hover:ring-border-primary-dark'
                          }`}
                          onPress={() => setImageByIndex(index)}
                          variant="flat"
                        >
                          <Image
                            alt={`Thumbnail ${index + 1}`}
                            classNames={{
                              wrapper: 'w-full h-full',
                              img: 'w-full h-full object-cover object-center transition-all duration-300',
                            }}
                            src={image}
                          />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 产品信息卡片 - Lyst风格 */}
                <Card className="border-none shadow-sm dark:shadow-md bg-[#faf9f6] dark:bg-bg-secondary-dark rounded-xl">
                  <CardHeader className="pb-0 pt-4 px-5 flex flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-y-1">
                        <div className="flex items-center gap-x-3">
                          <p
                            className={`text-2xl font-medium ${product.discount ? 'text-[#EF4444] dark:text-red-400' : 'text-[#1a1a1a] dark:text-text-primary-dark'}`}
                          >
                            ¥{product.price.toLocaleString()}
                          </p>
                          {product.discount && (
                            <span className="px-2 py-0.5 text-xs font-medium text-[#ffffff] bg-[#EF4444] dark:bg-red-700 rounded-md shadow-sm">
                              -{product.discount}% {t('discount')}
                            </span>
                          )}
                        </div>
                        {product.originalPrice && product.discount && (
                          <p className="text-sm line-through text-[#999999] dark:text-text-tertiary-dark">
                            ¥{product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-[#999999] dark:text-text-tertiary-dark mt-2">
                      {product.availableQuantity > 0 ? (
                        <>
                          <span className="text-[#22C55E] dark:text-green-400 font-medium">
                            {t('inStock')}
                          </span>
                          {' - '}
                          {t('availableItems', { count: product.availableQuantity })}
                        </>
                      ) : (
                        <span className="text-[#EF4444] dark:text-red-400 font-medium">
                          {t('outOfStock')}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardBody className="py-3 px-5">
                    <div className="prose prose-sm dark:prose-invert text-[#1a1a1a] dark:text-text-primary-dark">
                      <p>{product.description}</p>
                    </div>

                    {/* 使用Accordion组件展示产品详情 */}
                    <div className="mt-4">
                      {product.sizes && product.sizes.length > 0 && (
                        <Accordion className="mb-2" variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.sizes')}
                            classNames={{
                              title:
                                'font-medium text-base text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-2.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded-lg',
                              content: 'pb-2.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded-lg',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1.5 rounded-md">
                                <div className="w-5 h-5 text-[#1a1a1a] dark:text-text-primary-dark flex items-center justify-center">
                                  <Ruler size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.sizes')}
                          >
                            <div className="flex flex-wrap gap-2 py-2 px-1">
                              {product.sizes.map((size, index) => (
                                <Button
                                  key={index}
                                  className="min-w-12 bg-[#f5f5f2] dark:bg-bg-tertiary-dark text-[#1a1a1a] dark:text-text-primary-dark hover:bg-[#f5f5f2] dark:hover:bg-hover-background hover:scale-105 transition-all duration-200"
                                  size="sm"
                                  variant="flat"
                                  radius="sm"
                                >
                                  {size}
                                </Button>
                              ))}
                            </div>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.colors && product.colors.length > 0 && (
                        <Accordion className="mb-2" variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.colors')}
                            classNames={{
                              title:
                                'font-medium text-base text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-2.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded-lg',
                              content: 'pb-2.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded-lg',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1.5 rounded-md">
                                <div className="w-5 h-5 text-[#1a1a1a] dark:text-text-primary-dark flex items-center justify-center">
                                  <Palette size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.colors')}
                          >
                            <div className="flex flex-wrap gap-3 py-2 px-1">
                              {product.colors.map((color, index) => {
                                // 判断颜色是否为黑色或深色
                                const isBlackOrDark =
                                  color.value.toLowerCase() === '#000000' ||
                                  color.value.toLowerCase() === '#000' ||
                                  color.value.toLowerCase() === 'black' ||
                                  color.value.toLowerCase().includes('rgb(0, 0, 0)') ||
                                  color.value.toLowerCase().includes('rgba(0, 0, 0');

                                return (
                                  <Button
                                    key={index}
                                    className={`min-w-12 ${isBlackOrDark ? 'text-[#ffffff]' : 'text-[#1a1a1a]'} dark:text-text-primary-dark hover:scale-105 transition-all duration-200 shadow-sm`}
                                    size="sm"
                                    style={{ backgroundColor: color.value }}
                                    variant="flat"
                                    radius="sm"
                                  >
                                    {color.name}
                                  </Button>
                                );
                              })}
                            </div>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.details && product.details.length > 0 && (
                        <Accordion className="mb-2" variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.details')}
                            classNames={{
                              title:
                                'font-medium text-base text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-2.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded-lg',
                              content: 'pb-2.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded-lg',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1.5 rounded-md">
                                <div className="w-5 h-5 text-[#1a1a1a] dark:text-text-primary-dark flex items-center justify-center">
                                  <Info size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.details')}
                          >
                            <ul className="list-disc pl-5 flex flex-col gap-y-2 text-[#1a1a1a] dark:text-text-primary-dark px-1">
                              {product.details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.material && (
                        <Accordion className="mb-2" variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.material')}
                            classNames={{
                              title:
                                'font-medium text-base text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-2.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded-lg',
                              content: 'pb-2.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded-lg',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1.5 rounded-md">
                                <div className="w-5 h-5 text-[#1a1a1a] dark:text-text-primary-dark flex items-center justify-center">
                                  <Layers size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.material')}
                          >
                            <p className="text-[#1a1a1a] dark:text-text-primary-dark px-1 py-1">
                              {product.material}
                            </p>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.careInstructions && product.careInstructions.length > 0 && (
                        <Accordion className="mb-2" variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.careInstructions')}
                            classNames={{
                              title:
                                'font-medium text-base text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-2.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded-lg',
                              content: 'pb-2.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded-lg',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1.5 rounded-md">
                                <div className="w-5 h-5 text-[#1a1a1a] dark:text-text-primary-dark flex items-center justify-center">
                                  <Shirt size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.careInstructions')}
                          >
                            <ul className="list-disc pl-5 flex flex-col gap-y-2 text-[#1a1a1a] dark:text-text-primary-dark px-1">
                              {product.careInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </CardBody>

                  <CardFooter className="px-5 pt-0 pb-5 flex flex-col gap-3">
                    {product.sku && (
                      <div className="text-xs text-[#999999] dark:text-text-tertiary-dark w-full">
                        {t('sku')}: {product.sku}
                      </div>
                    )}

                    {/* 购买和收藏按钮 */}
                    <div className="w-full flex gap-3 mt-2">
                      {showRedirectButton ? (
                        <Link
                          isBlock
                          isExternal
                          showAnchorIcon
                          anchorIcon={<ExternalLink className="ml-1 h-4 w-4" />}
                          className="flex-1 py-3 px-5 font-medium bg-[#0080FF] text-[#ffffff] dark:bg-text-primary-dark dark:text-bg-primary-dark rounded-lg hover:bg-[#0062C3] dark:hover:bg-hover-text hover:scale-102 shadow-sm transition-all duration-200 text-center"
                          isDisabled={product.availableQuantity === 0}
                          onPress={handleOpenInNewTab}
                        >
                          {trackT('redirect_now')}
                        </Link>
                      ) : null}
                      <Button
                        aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        className={`p-0 min-w-12 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm hover:scale-105 transition-all duration-200 ${
                          isFavorite
                            ? 'bg-[#EF4444] text-[#ffffff] hover:bg-[#DC2626] dark:bg-red-600 dark:hover:bg-red-700'
                            : 'bg-[#faf9f6] dark:bg-bg-tertiary-dark text-[#1a1a1a] dark:text-text-primary-dark hover:bg-[#f5f5f2] dark:hover:bg-bg-secondary-dark'
                        }`}
                        variant="flat"
                        onPress={toggleFavorite}
                      >
                        <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
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
