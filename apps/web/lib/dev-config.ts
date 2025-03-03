// 开发者功能配置
export const devConfig = {
    // 是否启用传统商品详情页面
    enableTraditionalProductPage: false,
    // 是否启用商品弹窗
    enableProductModal: true,
    // 是否启用中转页面
    enableTrackingPage: true,
    // 是否启用收藏功能
    enableWishlist: true,
    // 是否启用购物车功能
    enableCart: false,
    // 是否启用搜索功能
    enableSearch: true,
    // 是否启用多语言
    enableI18n: true,
    // 是否启用暗色模式
    enableDarkMode: true,
    // 是否启用调试模式
    enableDebug: process.env.NODE_ENV === 'development',
} as const;

// 开发者功能类型
export type DevConfig = typeof devConfig;

// 获取开发者配置
export function getDevConfig(): DevConfig {
    return devConfig;
}

// 检查功能是否启用
export function isFeatureEnabled(feature: keyof DevConfig): boolean {
    return devConfig[feature];
} 