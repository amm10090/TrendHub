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

import type { ProductDetail as SharedProductDetailType } from '@/types/product';

type LucideIconProps = {
  className?: string;
  size?: number;
  fill?: string;
};

const LucideChevronLeft = ChevronLeft as React.ComponentType<LucideIconProps>;
const LucideChevronRight = ChevronRight as React.ComponentType<LucideIconProps>;
const LucideChevronDown = ChevronDown as React.ComponentType<LucideIconProps>;
const LucideRuler = Ruler as React.ComponentType<LucideIconProps>;
const LucidePalette = Palette as React.ComponentType<LucideIconProps>;
const LucideInfo = Info as React.ComponentType<LucideIconProps>;
const LucideLayers = Layers as React.ComponentType<LucideIconProps>;
const LucideShirt = Shirt as React.ComponentType<LucideIconProps>;
const LucideExternalLink = ExternalLink as React.ComponentType<LucideIconProps>;
const LucideHeart = Heart as React.ComponentType<LucideIconProps>;

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

  const buyNowUrl = useMemo(() => {
    const currentLocale = getCurrentLocale();

    // 总是使用中转页，以确保点击追踪
    return `/${currentLocale}/track-redirect/product/${product.id}`;
  }, [product.id]);

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
      window.open(buyNowUrl, '_blank');
      onClose();
    });

  return (
    <Modal
      classNames={{
        base: 'max-w-sm sm:max-w-lg md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-2 sm:mx-4 max-h-[90vh]',
        backdrop: 'bg-black/40 backdrop-blur-sm',
        body: 'p-0',
        closeButton:
          'top-1.5 right-1.5 text-text-tertiary-light dark:text-text-tertiary-dark hover:bg-bg-tertiary-light dark:hover:bg-bg-tertiary-dark transition-all duration-200 z-50 w-7 h-7',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent className="shadow-xl dark:shadow-2xl transition-all duration-300 scrollbar-hide max-h-[90vh] flex flex-col">
        <ModalHeader className="flex-shrink-0 flex flex-col gap-0.5 bg-[#EDF5FF] dark:bg-bg-primary-dark rounded-t-xl px-2 sm:px-3 lg:px-4 py-1.5">
          <h2 className="text-sm sm:text-base lg:text-lg font-medium text-[#001833] dark:text-text-primary-dark truncate">
            {product.name}
          </h2>
          {/* product.brand 现在是对象，需要访问其 name 属性 */}
          <p className="text-xs text-[#004A94] dark:text-text-secondary-dark">
            {product.brand.name}
          </p>
        </ModalHeader>
        <ModalBody className="flex-1 min-h-0 max-h-[calc(90vh-80px)]">
          <Card className="h-full border-none shadow-none bg-[#ffffff] dark:bg-bg-primary-dark rounded-b-xl scrollbar-hide">
            <CardBody className="h-full p-0 scrollbar-hide">
              <div className="flex flex-col lg:flex-row h-full gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:p-3">
                {/* 产品图片轮播区域 - 更紧凑的尺寸 */}
                <div className="flex flex-col gap-y-1 sm:gap-y-1.5 lg:w-[55%] lg:flex-shrink-0">
                  <div className="relative w-full h-[500px] overflow-hidden rounded-lg shadow-sm flex items-center justify-center ">
                    {/* 主图片 */}
                    <Image
                      isZoomed={false}
                      alt={product.name}
                      classNames={{
                        wrapper: 'w-full h-full flex items-center justify-center',
                        img: 'max-w-full max-h-full object-contain transition-transform duration-500 rounded-lg',
                        zoomedWrapper: 'transition-all duration-500',
                      }}
                      src={activeImage}
                    />

                    {/* NEW标签 */}
                    {product.isNew && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 text-xs font-medium text-[#ffffff] bg-[#0080FF] dark:bg-blue-700 rounded shadow-sm z-20">
                        {t('tags.new')}
                      </span>
                    )}

                    {/* 左右箭头导航 - 更小的设计 */}
                    {allImages.length > 1 && (
                      <>
                        <Button
                          isIconOnly
                          aria-label="Previous image"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#ffffff]/90 dark:bg-bg-tertiary-dark/90 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center z-10 shadow-md hover:bg-[#F3F4F6] hover:scale-105 dark:hover:bg-bg-tertiary-dark transition-all duration-200"
                          onPress={prevImage}
                          variant="flat"
                        >
                          <LucideChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1a1a1a] dark:text-text-primary-dark" />
                        </Button>
                        <Button
                          isIconOnly
                          aria-label="Next image"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ffffff]/90 dark:bg-bg-tertiary-dark/90 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center z-10 shadow-md hover:bg-[#F3F4F6] hover:scale-105 dark:hover:bg-bg-tertiary-dark transition-all duration-200"
                          onPress={nextImage}
                          variant="flat"
                        >
                          <LucideChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1a1a1a] dark:text-text-primary-dark" />
                        </Button>
                      </>
                    )}

                    {/* 底部指示器 */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-x-1.5 z-10">
                        {allImages.map((_, index) => (
                          <Button
                            isIconOnly
                            key={index}
                            aria-label={`Go to image ${index + 1}`}
                            className={`transition-all duration-300 rounded-full ${
                              selectedImageIndex === index
                                ? 'w-6 h-1.5 bg-[#1a1a1a] dark:bg-text-primary-dark'
                                : 'w-1.5 h-1.5 bg-[#999999]/40 dark:bg-text-tertiary-dark/60 hover:bg-[#666666]/60 dark:hover:bg-text-tertiary-dark/80'
                            }`}
                            onPress={() => setImageByIndex(index)}
                            variant="flat"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 缩略图导航 - 更紧凑 */}
                  {allImages.length > 1 && (
                    <div className="flex-shrink-0 overflow-x-auto flex gap-x-0.5 pb-0.5 scrollbar-hide">
                      {allImages.map((image, index) => (
                        <Button
                          key={index}
                          aria-label={`选择图片 ${index + 1}`}
                          className={`relative min-w-8 h-8 sm:min-w-9 sm:h-9 rounded overflow-hidden cursor-pointer transition-all duration-200 ${
                            index === selectedImageIndex
                              ? 'opacity-100 scale-105 shadow-md ring-1 ring-[#D0E4FF] dark:ring-border-primary-dark'
                              : 'opacity-70 hover:opacity-100 hover:scale-102'
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

                {/* 产品信息卡片 - 灵活宽度 */}
                <div className="flex flex-col lg:flex-1 lg:min-w-0 bg-[#faf9f6] dark:bg-bg-secondary-dark rounded-lg border border-[#e8e6e3] dark:border-border-primary-dark">
                  {/* 头部信息区域 - 价格和收藏 */}
                  <div className="flex-shrink-0 p-2.5 sm:p-3 border-b border-[#e8e6e3] dark:border-border-primary-dark">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex flex-col flex-1 gap-y-0.5">
                        <div className="flex flex-col gap-y-0.5 sm:flex-row sm:items-center sm:gap-x-2">
                          <p
                            className={`text-lg sm:text-xl lg:text-2xl font-semibold ${product.discount ? 'text-[#EF4444] dark:text-red-400' : 'text-[#1a1a1a] dark:text-text-primary-dark'}`}
                          >
                            ¥{product.price.toLocaleString()}
                          </p>
                          {product.discount && (
                            <span className="px-1.5 py-0.5 text-xs font-medium text-[#ffffff] bg-[#EF4444] dark:bg-red-700 rounded shadow-sm w-fit">
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
                      {/* 收藏按钮 */}
                      <Button
                        isIconOnly
                        aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        className={`min-w-8 w-8 h-8 sm:min-w-9 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg shadow-sm hover:scale-105 transition-all duration-200 ${
                          isFavorite
                            ? 'bg-[#EF4444] text-[#ffffff] hover:bg-[#DC2626] dark:bg-red-600 dark:hover:bg-red-700'
                            : 'bg-[#ffffff] dark:bg-bg-tertiary-dark text-[#1a1a1a] dark:text-text-primary-dark hover:bg-[#f5f5f2] dark:hover:bg-bg-secondary-dark'
                        }`}
                        variant="flat"
                        onPress={toggleFavorite}
                      >
                        <LucideHeart
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                          fill={isFavorite ? 'currentColor' : 'none'}
                        />
                      </Button>
                    </div>

                    {/* 库存状态 */}
                    <div className="text-sm text-[#999999] dark:text-text-tertiary-dark">
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
                  </div>

                  {/* 内容区域 - 描述和详情 */}
                  <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto scrollbar-hide">
                    {/* 产品描述 */}
                    <div className="mb-2">
                      <p className="text-sm leading-relaxed text-[#1a1a1a] dark:text-text-primary-dark line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    {/* 产品详情手风琴 - 紧凑间距 */}
                    <div className="space-y-0.5">
                      {product.sizes && product.sizes.length > 0 && (
                        <Accordion className="mb-1" variant="bordered">
                          <AccordionItem
                            key="sizes"
                            aria-label={t('accordion.sizes')}
                            classNames={{
                              title:
                                'font-medium text-sm text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-1.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded min-h-8',
                              content: 'pb-1.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded',
                            }}
                            indicator={({ isOpen }) => (
                              <LucideChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                size={14}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1 rounded">
                                <LucideRuler
                                  size={14}
                                  className="text-[#1a1a1a] dark:text-text-primary-dark"
                                />
                              </div>
                            }
                            title={t('accordion.sizes')}
                          >
                            <div className="flex flex-wrap gap-1.5 py-1.5 px-1">
                              {product.sizes.map((size, index) => (
                                <Button
                                  key={index}
                                  className="min-w-10 h-7 bg-[#f5f5f2] dark:bg-bg-tertiary-dark text-[#1a1a1a] dark:text-text-primary-dark hover:bg-[#f5f5f2] dark:hover:bg-hover-background hover:scale-105 transition-all duration-200 text-xs"
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
                        <Accordion className="mb-1" variant="bordered">
                          <AccordionItem
                            key="colors"
                            aria-label={t('accordion.colors')}
                            classNames={{
                              title:
                                'font-medium text-sm text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-1.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded min-h-8',
                              content: 'pb-1.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded',
                            }}
                            indicator={({ isOpen }) => (
                              <LucideChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                size={14}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1 rounded">
                                <LucidePalette
                                  size={14}
                                  className="text-[#1a1a1a] dark:text-text-primary-dark"
                                />
                              </div>
                            }
                            title={t('accordion.colors')}
                          >
                            <div className="flex flex-wrap gap-2 py-1.5 px-1">
                              {product.colors.map((color, index) => {
                                const isBlackOrDark =
                                  color.value.toLowerCase() === '#000000' ||
                                  color.value.toLowerCase() === '#000' ||
                                  color.value.toLowerCase() === 'black' ||
                                  color.value.toLowerCase().includes('rgb(0, 0, 0)') ||
                                  color.value.toLowerCase().includes('rgba(0, 0, 0');

                                return (
                                  <Button
                                    key={index}
                                    className={`min-w-10 h-7 ${isBlackOrDark ? 'text-[#ffffff]' : 'text-[#1a1a1a]'} dark:text-text-primary-dark hover:scale-105 transition-all duration-200 shadow-sm text-xs`}
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
                        <Accordion className="mb-1" variant="bordered">
                          <AccordionItem
                            key="details"
                            aria-label={t('accordion.details')}
                            classNames={{
                              title:
                                'font-medium text-sm text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-1.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded min-h-8',
                              content: 'pb-1.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded',
                            }}
                            indicator={({ isOpen }) => (
                              <LucideChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                size={14}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1 rounded">
                                <LucideInfo
                                  size={14}
                                  className="text-[#1a1a1a] dark:text-text-primary-dark"
                                />
                              </div>
                            }
                            title={t('accordion.details')}
                          >
                            <ul className="list-disc pl-4 flex flex-col gap-y-1 text-[#1a1a1a] dark:text-text-primary-dark px-1 text-sm">
                              {product.details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.material && (
                        <Accordion className="mb-1" variant="bordered">
                          <AccordionItem
                            key="material"
                            aria-label={t('accordion.material')}
                            classNames={{
                              title:
                                'font-medium text-sm text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-1.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded min-h-8',
                              content: 'pb-1.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded',
                            }}
                            indicator={({ isOpen }) => (
                              <LucideChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                size={14}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1 rounded">
                                <LucideLayers
                                  size={14}
                                  className="text-[#1a1a1a] dark:text-text-primary-dark"
                                />
                              </div>
                            }
                            title={t('accordion.material')}
                          >
                            <p className="text-[#1a1a1a] dark:text-text-primary-dark px-1 py-1 text-sm">
                              {product.material}
                            </p>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.careInstructions && product.careInstructions.length > 0 && (
                        <Accordion className="mb-1" variant="bordered">
                          <AccordionItem
                            key="care"
                            aria-label={t('accordion.careInstructions')}
                            classNames={{
                              title:
                                'font-medium text-sm text-[#1a1a1a] dark:text-text-primary-dark',
                              trigger:
                                'py-1.5 hover:bg-[#f5f5f2]/50 dark:hover:bg-bg-tertiary-dark/50 transition-colors duration-200 rounded min-h-8',
                              content: 'pb-1.5',
                              base: 'border-[#e8e6e3] dark:border-border-primary-dark rounded',
                            }}
                            indicator={({ isOpen }) => (
                              <LucideChevronDown
                                className={`text-[#999999] dark:text-text-tertiary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                size={14}
                              />
                            )}
                            startContent={
                              <div className="bg-[#f5f5f2] dark:bg-bg-tertiary-dark p-1 rounded">
                                <LucideShirt
                                  size={14}
                                  className="text-[#1a1a1a] dark:text-text-primary-dark"
                                />
                              </div>
                            }
                            title={t('accordion.careInstructions')}
                          >
                            <ul className="list-disc pl-4 flex flex-col gap-y-1 text-[#1a1a1a] dark:text-text-primary-dark px-1 text-sm">
                              {product.careInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>

                  {/* 底部操作区域 */}
                  <div className="flex-shrink-0 p-2.5 sm:p-3 border-t border-[#e8e6e3] dark:border-border-primary-dark">
                    {product.sku && (
                      <div className="mb-1.5 text-xs text-[#999999] dark:text-text-tertiary-dark">
                        {t('sku')}: {product.sku}
                      </div>
                    )}

                    {/* 购买按钮 */}
                    {showRedirectButton && (
                      <Link
                        isBlock
                        isExternal
                        showAnchorIcon
                        href={buyNowUrl}
                        anchorIcon={<LucideExternalLink className="ml-1 h-3.5 w-3.5" />}
                        className="flex-1 py-2.5 px-4 font-medium bg-[#0080FF] text-[#ffffff] dark:bg-text-primary-dark dark:text-bg-primary-dark rounded-lg hover:bg-[#0062C3] dark:hover:bg-hover-text hover:scale-102 shadow-sm transition-all duration-200 text-center text-sm"
                        isDisabled={product.availableQuantity === 0}
                        onPress={handleOpenInNewTab}
                      >
                        {trackT('redirect_now')}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
