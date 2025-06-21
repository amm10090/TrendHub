// packages/scraper/src/sites/mytheresa/selectors.ts
export const SELECTORS = {
  // Product List Page (PLP)
  PLP_PRODUCT_ITEM_SELECTORS: [
    "div.item",
    'div[data-testid="product-card"]',
    "li.item.product.product-item",
  ],
  PLP_PRODUCT_LINK: "a.item__link",
  PLP_BRAND: "div.item__info__header__designer",
  PLP_NAME: "div.item__info__name a",
  PLP_IMAGE: "div.item__images__image img",
  PLP_SIZES: "span.item__sizes__size",
  PLP_TAG: "div.labels__wrapper span.labels__label",
  PLP_LOAD_MORE_BUTTON:
    'div.loadmore__button > a.button--active:has-text("Show more")',
  PLP_LOAD_MORE_INFO: "div.loadmore__info",

  // Product Detail Page (PDP)
  PDP_BRAND: ".product__area__branding__designer__link",
  PDP_NAME: ".product__area__branding__name",
  PDP_DETAILS_ACCORDION_CONTENT:
    "div.accordion__item--active div.accordion__body__content",
  PDP_BREADCRUMBS:
    "div.breadcrumb div.breadcrumb__item a.breadcrumb__item__link",
  PDP_PRICE_CONTAINER: "div.productinfo__price",
  PDP_DISCOUNT_PRICE:
    "span.pricing__prices__value--discount span.pricing__prices__price",
  PDP_ORIGINAL_PRICE:
    "span.pricing__prices__value--original span.pricing__prices__price",
  PDP_IMAGES:
    "div.photocarousel__items div.swiper-slide img.product__gallery__thumbscarousel__image",
};
