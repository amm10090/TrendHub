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
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@heroui/react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
// import { useTranslations } from 'next-intl';
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

/**
 * 产品模态框组件属性
 * @interface ProductModalProps
 * @property {SharedProductDetailType} product - 产品详情数据 (使用共享类型)
 * @property {boolean} isOpen - 控制模态框显示状态
 * @property {() => void} onClose - 关闭模态框的回调函数
 * @property {() => void} [onOpenInNewTab] - 可选的新标签页打开回调
 * @property {boolean} [showRedirectButton=true] - 是否显示跳转按钮，默认显示
 * @property {SharedProductDetailType[]} [relatedProducts] - 相关产品列表
 */
interface ProductModalProps {
  product: SharedProductDetailType; // 使用导入的共享类型
  isOpen: boolean;
  onClose: () => void;
  onOpenInNewTab?: () => void;
  showRedirectButton?: boolean;
  relatedProducts?: SharedProductDetailType[];
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onOpenInNewTab,
  relatedProducts = [],
}: ProductModalProps) {
  // 暂时保留，未来用于国际化
  // const t = useTranslations('product');
  // const trackT = useTranslations('track');
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
   * 处理新标签页打开商品详情
   * 根据示例HTML的设计，立即打开新标签页而不关闭模态框
   */
  const handleOpenInNewTab = () => {
    // 立即在新标签页打开联盟链接
    const newWindow = window.open(buyNowUrl, '_blank');

    if (newWindow) {
      newWindow.focus();
    }
    // 不关闭模态框，让用户可以继续浏览相关产品
  };

  /**
   * 处理购买按钮点击
   */

  const handleBuyNowClick = () => {
    handleOpenInNewTab();
    // 如果提供了自定义回调，也调用它
    if (onOpenInNewTab) {
      onOpenInNewTab();
    }
  };

  return (
    <Modal
      classNames={{
        base: 'max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-2 sm:mx-4 h-[90vh] sm:h-[95vh]',
        backdrop: 'bg-black/50 backdrop-blur-sm',
        body: 'p-0 h-full',
        closeButton:
          'top-3 right-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 z-50 w-8 h-8',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent className="shadow-2xl transition-all duration-300 h-[90vh] sm:h-[95vh] flex flex-col bg-white">
        <ModalHeader className="flex-shrink-0 flex flex-col gap-1 bg-white px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-black truncate">{product.name}</h2>
          <p
            className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
            onClick={() => {
              const currentLocale = getCurrentLocale();

              window.open(`/${currentLocale}/brands/${product.brand.slug}`, '_blank');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const currentLocale = getCurrentLocale();

                window.open(`/${currentLocale}/brands/${product.brand.slug}`, '_blank');
              }
            }}
            role="button"
            tabIndex={0}
            title={`View ${product.brand.name} brand page`}
          >
            {product.brand.name}
          </p>
        </ModalHeader>

        <ModalBody className="p-0 flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row h-full">
            {/* 左侧：产品图片区域 - 纯白色背景 */}
            <div className="w-full lg:flex-1 bg-white relative flex items-center justify-center min-h-[250px] sm:min-h-[300px] lg:h-full lg:max-w-[50%]">
              <div className="w-full h-full flex items-center justify-center p-6 lg:p-8">
                <div className="relative w-full max-w-lg h-full max-h-[600px] flex items-center justify-center">
                  {/* 主图片 */}
                  <Image
                    isZoomed={false}
                    alt={product.name}
                    classNames={{
                      wrapper: 'w-full aspect-square flex items-center justify-center',
                      img: 'max-w-full max-h-full object-contain',
                    }}
                    src={activeImage}
                  />

                  {/* 左右箭头导航 */}
                  {allImages.length > 1 && (
                    <>
                      <Button
                        isIconOnly
                        aria-label="Previous image"
                        className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center z-10 shadow-lg hover:bg-white transition-all duration-200"
                        onPress={prevImage}
                        variant="flat"
                      >
                        <LucideChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
                      </Button>
                      <Button
                        isIconOnly
                        aria-label="Next image"
                        className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center z-10 shadow-lg hover:bg-white transition-all duration-200"
                        onPress={nextImage}
                        variant="flat"
                      >
                        <LucideChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
                      </Button>
                    </>
                  )}

                  {/* 底部指示器 */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 lg:bottom-4 left-0 right-0 flex justify-center gap-x-2 z-10">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          aria-label={`Go to image ${index + 1}`}
                          className={`transition-all duration-300 rounded-full ${
                            selectedImageIndex === index
                              ? 'w-6 h-2 lg:w-8 lg:h-2 bg-black'
                              : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                          onClick={() => setImageByIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：产品详情区域 */}
            <div className="w-full lg:flex-1 bg-white flex flex-col lg:max-w-[50%] lg:min-w-[400px] flex-1 lg:h-full">
              {/* 滚动容器 */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain scroll-smooth min-h-0"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db transparent',
                }}
              >
                {/* 产品基本信息 */}
                <div className="flex-shrink-0 p-4 lg:p-6 sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm lg:shadow-none">
                  {/* 品牌名称 */}
                  <div className="mb-1">
                    <h3
                      className="text-lg font-semibold text-black hover:text-gray-600 cursor-pointer transition-colors"
                      onClick={() => {
                        const currentLocale = getCurrentLocale();

                        window.open(`/${currentLocale}/brands/${product.brand.slug}`, '_blank');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const currentLocale = getCurrentLocale();

                          window.open(`/${currentLocale}/brands/${product.brand.slug}`, '_blank');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`View ${product.brand.name} brand page`}
                    >
                      {product.brand.name}
                    </h3>
                  </div>

                  {/* 产品名称 */}
                  <h2 className="text-lg sm:text-xl font-normal text-black mb-4 line-clamp-2">
                    {product.name}
                  </h2>

                  {/* 价格信息 */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-[#e74c3c]">
                      ¥{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.discount && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          ¥{product.originalPrice.toLocaleString()}
                        </span>
                        <span className="bg-[#e74c3c] text-white px-2 py-1 rounded text-sm font-semibold">
                          -{product.discount}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Buy now 按钮 */}
                  <Button
                    className="w-full py-3 text-base font-semibold bg-black text-white hover:bg-gray-800 transition-all duration-200 mb-3 rounded-lg"
                    onPress={handleBuyNowClick}
                  >
                    Buy now
                  </Button>

                  {/* 零售商信息 */}
                  <div className="text-sm text-gray-600">
                    From <strong>{product.brand.name.toUpperCase()}</strong>
                  </div>
                </div>

                {/* 可滚动内容区域 */}
                <div className="px-4 lg:px-6 pb-4">
                  {/* 价格比较区域 */}
                  <div className="bg-gray-50 p-4 rounded-lg text-center mb-6">
                    <div className="text-sm font-semibold text-black mb-2">Compare 2 prices</div>
                    <Button
                      className="text-sm border border-black text-black hover:bg-black hover:text-white transition-all duration-200 px-4 py-2 rounded"
                      variant="ghost"
                    >
                      Compare all prices
                    </Button>
                  </div>

                  {/* 产品描述 */}
                  <div className="mb-6">
                    <p className="text-sm leading-relaxed text-gray-600">
                      {product.description || 'Check out this amazing product.'}
                    </p>
                  </div>

                  {/* 手风琴组件 */}
                  <div className="mb-8">
                    <Accordion
                      variant="bordered"
                      className="px-0"
                      itemClasses={{
                        base: 'border-gray-200 border-b border-t-0 border-l-0 border-r-0 rounded-none',
                        title: 'font-semibold text-black text-sm',
                        trigger: 'py-3 px-0 hover:bg-transparent',
                        content: 'text-sm text-gray-600 pb-3',
                        indicator: 'text-gray-400',
                      }}
                    >
                      <AccordionItem
                        key="size-fit"
                        title="Size & fit"
                        indicator={<LucideChevronDown className="w-4 h-4" />}
                      >
                        For up-to-date size availability and fit information, please visit the
                        retailer.
                      </AccordionItem>

                      <AccordionItem
                        key="product-details"
                        title="Product details"
                        indicator={<LucideChevronDown className="w-4 h-4" />}
                      >
                        Detailed product information available on retailer website.
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* 更多类似产品区域 */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-black">More like this</h3>
                    </div>
                    <div
                      className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      {relatedProducts.length > 0
                        ? relatedProducts.slice(0, 6).map((relatedProduct) => {
                            const relatedBuyNowUrl = `/${getCurrentLocale()}/track-redirect/product/${relatedProduct.id}`;

                            return (
                              <div
                                key={relatedProduct.id}
                                className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg border-2 border-transparent hover:border-black cursor-pointer transition-all duration-200 overflow-hidden"
                                onClick={() => {
                                  const newWindow = window.open(relatedBuyNowUrl, '_blank');

                                  if (newWindow) {
                                    newWindow.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    const newWindow = window.open(relatedBuyNowUrl, '_blank');

                                    if (newWindow) {
                                      newWindow.focus();
                                    }
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                title={`${relatedProduct.brand.name} - ${relatedProduct.name}`}
                              >
                                {relatedProduct.images && relatedProduct.images.length > 0 ? (
                                  <Image
                                    alt={relatedProduct.name}
                                    classNames={{
                                      wrapper: 'w-full h-full',
                                      img: 'w-full h-full object-cover object-center transition-all duration-300 hover:scale-110',
                                    }}
                                    src={relatedProduct.images[0]}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center text-xs text-gray-500 font-semibold">
                                    {relatedProduct.brand.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        : [1, 2, 3, 4].map((item) => (
                            <div
                              key={item}
                              className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg border-2 border-transparent cursor-not-allowed opacity-50"
                            >
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center text-xs text-gray-500">
                                •••
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
