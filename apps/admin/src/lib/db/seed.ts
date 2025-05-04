import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 定义默认设置数据
const defaultSettings = [
  // 常规设置
  { key: "siteName", value: "TrendHub", category: "general" },
  { key: "siteDescription", value: "时尚电商聚合平台", category: "general" },
  { key: "contactEmail", value: "support@trendhub.com", category: "general" },
  { key: "contactPhone", value: "+1 (555) 987-6543", category: "general" },
  {
    key: "businessAddress",
    value: "123 E-commerce Street, Suite 100, New York, NY 10001, USA",
    category: "general",
  },

  // 社交媒体链接
  {
    key: "facebook",
    value: "https://facebook.com/trendhub",
    category: "social",
  },
  {
    key: "instagram",
    value: "https://instagram.com/trendhub",
    category: "social",
  },
  { key: "twitter", value: "https://twitter.com/trendhub", category: "social" },
  {
    key: "pinterest",
    value: "https://pinterest.com/trendhub",
    category: "social",
  },

  // SEO设置
  { key: "metaTitle", value: "TrendHub - 时尚电商聚合平台", category: "seo" },
  {
    key: "metaDescription",
    value:
      "TrendHub是一个汇集全球时尚品牌与潮流趋势的电商聚合平台，为消费者提供一站式购物体验。",
    category: "seo",
  },
  {
    key: "keywords",
    value: "fashion, trend, shopping, ecommerce, platform",
    category: "seo",
  },

  // 外观设置
  { key: "logoUrl", value: "/logo.png", category: "appearance" },
  { key: "faviconUrl", value: "/favicon.ico", category: "appearance" },
  { key: "primaryColor", value: "#3b82f6", category: "appearance" },
  { key: "secondaryColor", value: "#6366f1", category: "appearance" },
];

// 定义默认品牌数据
const defaultBrands = [
  { name: "TrendBasics", slug: "trend-basics", description: "基础时尚品牌" },
  { name: "VintageDenim", slug: "vintage-denim", description: "复古牛仔品牌" },
  { name: "SportLife", slug: "sport-life", description: "运动生活品牌" },
  { name: "LuxLeather", slug: "lux-leather", description: "奢华皮具品牌" },
  { name: "WoolMaster", slug: "wool-master", description: "羊毛制品专家" },
];

// 定义默认分类数据
const defaultCategories = [
  { name: "上装", slug: "tops", level: 1, description: "各类上衣" },
  { name: "外套", slug: "outerwear", level: 1, description: "各类外套" },
  { name: "裤装", slug: "bottoms", level: 1, description: "各类裤子" },
  { name: "配饰", slug: "accessories", level: 1, description: "各类配饰" },
];

// 定义示例产品数据
const defaultProducts = [
  {
    name: "经典白色T恤",
    description: "100%纯棉，简约舒适的基础款T恤",
    price: 199.0,
    brandSlug: "trend-basics",
    categorySlug: "tops",
    status: "In Stock",
    images: ["/products/white-tshirt.jpg"],
    inventory: 100,
    sku: "TB-WT-001",
  },
  {
    name: "复古牛仔夹克",
    description: "水洗工艺，复古做旧效果的牛仔外套",
    price: 599.0,
    brandSlug: "vintage-denim",
    categorySlug: "outerwear",
    status: "In Stock",
    images: ["/products/denim-jacket.jpg"],
    inventory: 50,
    sku: "VD-DJ-001",
  },
  {
    name: "运动休闲裤",
    description: "弹力面料，舒适透气的运动裤",
    price: 299.0,
    brandSlug: "sport-life",
    categorySlug: "bottoms",
    status: "In Stock",
    images: ["/products/sport-pants.jpg"],
    inventory: 80,
    sku: "SL-SP-001",
  },
  {
    name: "真皮小方包",
    description: "进口牛皮，简约时尚的单肩包",
    price: 899.0,
    brandSlug: "lux-leather",
    categorySlug: "accessories",
    status: "Low Stock",
    images: ["/products/leather-bag.jpg"],
    inventory: 10,
    sku: "LL-LB-001",
  },
  {
    name: "羊毛针织衫",
    description: "澳洲美利奴羊毛，保暖舒适的针织衫",
    price: 499.0,
    brandSlug: "wool-master",
    categorySlug: "tops",
    status: "In Stock",
    images: ["/products/wool-sweater.jpg"],
    inventory: 60,
    sku: "WM-WS-001",
  },
];

// 执行种子数据初始化
async function main() {
  try {
    // 初始化设置数据
    const settingPromises = defaultSettings.map((setting) =>
      prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      }),
    );

    // 初始化品牌数据
    const brandPromises = defaultBrands.map((brand) =>
      prisma.brand.upsert({
        where: { slug: brand.slug },
        update: brand,
        create: { ...brand, isActive: true },
      }),
    );

    // 初始化分类数据
    const categoryPromises = defaultCategories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: { ...category, isActive: true },
      }),
    );

    // 等待品牌和分类创建完成
    const [brands, categories] = await Promise.all([
      Promise.all(brandPromises),
      Promise.all(categoryPromises),
    ]);

    // 创建品牌和分类的映射
    const brandMap = new Map(brands.map((b) => [b.slug, b.id]));
    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

    // 初始化产品数据
    const productPromises = defaultProducts.map((product) => {
      const { brandSlug, categorySlug, ...productData } = product;

      return prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          ...productData,
          brandId: brandMap.get(brandSlug)!,

          categoryId: categoryMap.get(categorySlug)!,
        },
        create: {
          ...productData,
          brandId: brandMap.get(brandSlug)!,

          categoryId: categoryMap.get(categorySlug)!,
        },
      });
    });

    // 执行所有初始化操作
    const [settingResults, productResults] = await Promise.all([
      Promise.all(settingPromises),
      Promise.all(productPromises),
    ]);

    console.log(
      `Successfully initialized ${settingResults.length} settings and ${productResults.length} products.`,
    );
  } catch {
    return;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行main函数
main().catch((error) => {
  console.error("Failed to run seed script:", error);
  process.exit(1);
});
