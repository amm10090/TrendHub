// packages/scraper/src/sites/mytheresa/selectors.ts
export const SELECTORS = {
  // Product List Page (PLP)
  PLP_PRODUCT_ITEM_SELECTORS: [
    "div.item",
    'div[data-testid="product-card"]',
    "li.item.product.product-item",
  ],
  PLP_PRODUCT_LINK: "a.item__link", // 修正：实际主链接是 a.item__link
  PLP_BRAND: "div.item__info__header__designer",
  PLP_NAME: "div.item__info__name a",
  PLP_IMAGE: "div.item__images__image img",
  PLP_SIZES: "span.item__sizes__size",
  PLP_TAG: "div.labels__wrapper span.labels__label",
  PLP_LOAD_MORE_BUTTON:
    'div.loadmore__button > a.button--active:has-text("Show more")',
  PLP_LOAD_MORE_INFO: "div.loadmore__info",

  // Enhanced PLP selectors - 根据实际HTML结构优化
  PLP_PRICE: ".pricing__prices__price", // 通用价格选择器
  PLP_ORIGINAL_PRICE:
    ".pricing__prices__value--original .pricing__prices__price", // 原价
  PLP_DISCOUNT_PRICE:
    ".pricing__prices__value--discount .pricing__prices__price", // 折扣价
  PLP_COLOR_INFO: ".item__info__colorway, .item__colorway",
  PLP_IMAGES_ALL: ".item__images img", // 根据实际结构简化
  PLP_AVAILABILITY: ".item__availability, .item__sizes__availability",

  // Product Detail Page (PDP) - 根据实际HTML结构优化
  PDP_BRAND: ".product__area__branding__designer__link", // ✅ 正确
  PDP_NAME: ".product__area__branding__name", // ✅ 正确
  PDP_DETAILS_ACCORDION_CONTENT:
    "div.accordion__item--active div.accordion__body__content", // ✅ 正确
  PDP_BREADCRUMBS:
    "div.breadcrumb div.breadcrumb__item a.breadcrumb__item__link",
  PDP_PRICE_CONTAINER: "div.productinfo__price",
  PDP_DISCOUNT_PRICE:
    "span.pricing__prices__value--discount span.pricing__prices__price",
  PDP_ORIGINAL_PRICE:
    "span.pricing__prices__value--original span.pricing__prices__price",
  PDP_IMAGES:
    "div.photocarousel__items div.swiper-slide img.product__gallery__thumbscarousel__image",

  // Enhanced PDP selectors for missing data - 根据实际HTML结构优化
  PDP_COLOR_SELECTOR:
    ".product__area__colorpicker__wrapper .colorpicker__colorstyle",
  PDP_COLOR_NAME: ".product__area__colorpicker__wrapper .colorpicker__name",
  PDP_DESIGNER_COLOR: ".product__area__branding__color",
  // 商品详情信息 - 从实际HTML结构提取
  PDP_DESCRIPTION: "[data-overlayscrollbars-contents] p", // 商品描述段落
  PDP_DETAIL_LIST: "[data-overlayscrollbars-contents] ul li", // 详情列表项
  PDP_MATERIAL_INFO: "[data-overlayscrollbars-contents] ul li", // 包含材质、颜色、SKU等信息
  PDP_COMPOSITION: "[data-overlayscrollbars-contents] ul li", // 材质信息在li中
  PDP_CARE_INSTRUCTIONS: "[data-overlayscrollbars-contents] ul li", // 护理说明
  PDP_MAIN_IMAGES: ".product__gallery__wrapper .swiper-slide img",
  PDP_THUMBNAIL_IMAGES: ".product__gallery__thumbscarousel .swiper-slide img",
  PDP_ALL_IMAGES:
    ".product__gallery img, .product__gallery__thumbscarousel img",
  PDP_SIZE_SELECTOR: ".productinfo__size .size__wrapper .size__item",
  PDP_SIZE_GUIDE: ".productinfo__size .size__guide",
  PDP_AVAILABILITY: ".productinfo__availability, .product__availability",
  PDP_SKU: ".product__area__branding__partnumber, .product__partnumber",

  // 特定信息提取选择器 - 基于实际HTML结构
  PDP_SIZE_FIT_ACCORDION:
    ".accordion__item[data-section='size fit'] .accordion__body__content",
  PDP_SIZE_FIT_INFO:
    ".accordion__item[data-section='size fit'] .accordion__body__content ul li",
  PDP_PRICE_DESCRIPTION: ".productinfo__pricedescription", // 价格说明
};
