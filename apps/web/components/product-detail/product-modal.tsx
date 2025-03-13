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
import { useEffect, useState, useMemo } from 'react';
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
  colors?: { name: string; value: string }[];
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
  showRedirectButton = true, // 默认显示
}: ProductModalProps) {
  const t = useTranslations('product');
  const trackT = useTranslations('track');
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(product.image);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const allImages = useMemo(() => {
    return product.images ? [product.image, ...product.images] : [product.image];
  }, [product.image, product.images]);

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
    setActiveImage(product.image);
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
        base: 'max-w-5xl',
        backdrop: 'bg-black/30 backdrop-blur-xs',
        body: 'p-0',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
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
                {/* 产品图片轮播区域 - Lyst风格 */}
                <div className="flex flex-col gap-y-4">
                  <div className="aspect-3/4 relative overflow-hidden rounded-md pl-3">
                    {/* 主图片 */}
                    <Image
                      isZoomed
                      alt={product.name}
                      classNames={{
                        wrapper: 'w-full h-full transition-opacity duration-300',
                        img: 'w-full h-full object-cover object-center transition-transform duration-500',
                        zoomedWrapper: 'transition-all duration-500',
                      }}
                      src={activeImage}
                    />

                    {/* 左右箭头导航 - 圆润设计 */}
                    {allImages.length > 1 && (
                      <>
                        <Button
                          isIconOnly
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-xs hover:bg-white dark:hover:bg-black transition-all"
                          onPress={prevImage}
                          variant="flat"
                        >
                          <ChevronLeft className="h-5 w-5 text-black dark:text-white" />
                        </Button>
                        <Button
                          isIconOnly
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-xs hover:bg-white dark:hover:bg-black transition-all"
                          onPress={nextImage}
                          variant="flat"
                        >
                          <ChevronRight className="h-5 w-5 text-black dark:text-white" />
                        </Button>
                      </>
                    )}

                    {/* 底部指示器 - 长条短条设计（黑白色自适应） */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center flex flex-row gap-x-2 z-10">
                        {allImages.map((_, index) => (
                          <Button
                            isIconOnly
                            key={index}
                            aria-label={`Go to image ${index + 1}`}
                            className={`transition-all duration-300 rounded-full ${
                              selectedImageIndex === index
                                ? 'w-8 h-1.5 bg-black dark:bg-white'
                                : 'w-1.5 h-1.5 bg-black/30 dark:bg-white/50'
                            }`}
                            onPress={() => setImageByIndex(index)}
                            variant="flat"
                          />
                        ))}
                      </div>
                    )}

                    {/* NEW标签 */}
                    {product.isNew && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-sm">
                        {t('tags.new')}
                      </span>
                    )}
                  </div>

                  {/* 缩略图导航 - Lyst风格 */}
                  {allImages.length > 1 && (
                    <div className="flex overflow-x-auto flex flex-row gap-x-2 pb-1 scrollbar-hide">
                      {allImages.map((image, index) => (
                        <Button
                          key={index}
                          aria-label={`选择图片 ${index + 1}`}
                          className={`relative min-w-16 h-16 rounded-sm overflow-hidden cursor-pointer transition-all ${
                            index === selectedImageIndex
                              ? 'opacity-100 scale-105'
                              : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
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
                <Card className="border-none shadow-xs dark:shadow-md">
                  <CardHeader className="pb-0 pt-4 px-4 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col gap-y-1">
                        <p
                          className={`text-xl font-medium ${product.discount ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}
                        >
                          ¥{product.price.toLocaleString()}
                        </p>
                        {product.originalPrice && product.discount && (
                          <p className="text-sm line-through text-text-tertiary-light dark:text-text-tertiary-dark">
                            ¥{product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {product.discount && (
                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 dark:bg-red-700 rounded-sm">
                          -{product.discount}% {t('discount')}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark mt-2">
                      {product.availableQuantity > 0 ? (
                        <>
                          <span className="text-green-600 dark:text-green-400">{t('inStock')}</span>
                          {' - '}
                          {t('availableItems', { count: product.availableQuantity })}
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
                      {product.sizes && product.sizes.length > 0 && (
                        <Accordion className="mb-2" defaultExpandedKeys={['1']} variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.sizes')}
                            classNames={{
                              title: 'font-medium text-base',
                              trigger: 'py-3',
                              content: 'pb-3',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-default-400 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                  <Ruler size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.sizes')}
                          >
                            <div className="flex flex-wrap gap-2 py-2">
                              {product.sizes.map((size, index) => (
                                <Button key={index} className="min-w-12" size="sm" variant="flat">
                                  {size}
                                </Button>
                              ))}
                            </div>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.colors && product.colors.length > 0 && (
                        <Accordion className="mb-2" defaultExpandedKeys={['1']} variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.colors')}
                            classNames={{
                              title: 'font-medium text-base',
                              trigger: 'py-3',
                              content: 'pb-3',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-default-400 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                  <Palette size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.colors')}
                          >
                            <div className="flex flex-wrap gap-3 py-2">
                              {product.colors.map((color, index) => (
                                <Button
                                  key={index}
                                  className="min-w-12"
                                  size="sm"
                                  style={{ backgroundColor: color.value }}
                                  variant="flat"
                                >
                                  {color.name}
                                </Button>
                              ))}
                            </div>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.details && product.details.length > 0 && (
                        <Accordion className="mb-2" defaultExpandedKeys={['1']} variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.details')}
                            classNames={{
                              title: 'font-medium text-base',
                              trigger: 'py-3',
                              content: 'pb-3',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-default-400 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                  <Info size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.details')}
                          >
                            <ul className="list-disc pl-5 flex flex-col gap-y-1">
                              {product.details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.material && (
                        <Accordion className="mb-2" defaultExpandedKeys={['1']} variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.material')}
                            classNames={{
                              title: 'font-medium text-base',
                              trigger: 'py-3',
                              content: 'pb-3',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-default-400 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                  <Layers size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.material')}
                          >
                            <p>{product.material}</p>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {product.careInstructions && product.careInstructions.length > 0 && (
                        <Accordion className="mb-2" defaultExpandedKeys={['1']} variant="bordered">
                          <AccordionItem
                            key="1"
                            aria-label={t('accordion.careInstructions')}
                            classNames={{
                              title: 'font-medium text-base',
                              trigger: 'py-3',
                              content: 'pb-3',
                            }}
                            indicator={({ isOpen }) => (
                              <ChevronDown
                                className={`text-default-400 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                              />
                            )}
                            startContent={
                              <div className="bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-md">
                                <div className="w-5 h-5 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                                  <Shirt size={16} />
                                </div>
                              </div>
                            }
                            title={t('accordion.careInstructions')}
                          >
                            <ul className="list-disc pl-5 flex flex-col gap-y-1">
                              {product.careInstructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ul>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </CardBody>

                  <CardFooter className="px-4 pt-0 pb-4 flex flex-col gap-3">
                    {product.sku && (
                      <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark w-full">
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
                          className="flex-1 py-3 px-4 font-medium bg-black text-white rounded-md hover:bg-gray-900 dark:bg-black dark:hover:bg-gray-900 text-center"
                          isDisabled={product.availableQuantity === 0}
                          onPress={handleOpenInNewTab}
                        >
                          {trackT('redirect_now')}
                        </Link>
                      ) : null}
                      <Button
                        aria-label={isFavorite ? t('remove_from_favorites') : t('add_to_favorites')}
                        className={`p-0 min-w-14 w-14 h-14 flex items-center justify-center rounded-md ${
                          isFavorite
                            ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                            : 'bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark'
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
