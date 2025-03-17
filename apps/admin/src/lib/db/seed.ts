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

// 定义示例产品数据
const defaultProducts = [
  {
    name: "经典白色T恤",
    description: "100%纯棉，简约舒适的基础款T恤",
    price: 199.0,
    brand: "TrendBasics",
    category: "上装",
    status: "In Stock",
    images: ["/products/white-tshirt.jpg"],
    inventory: 100,
    sku: "TB-WT-001",
  },
  {
    name: "复古牛仔夹克",
    description: "水洗工艺，复古做旧效果的牛仔外套",
    price: 599.0,
    brand: "VintageDenim",
    category: "外套",
    status: "In Stock",
    images: ["/products/denim-jacket.jpg"],
    inventory: 50,
    sku: "VD-DJ-001",
  },
  {
    name: "运动休闲裤",
    description: "弹力面料，舒适透气的运动裤",
    price: 299.0,
    brand: "SportLife",
    category: "裤装",
    status: "In Stock",
    images: ["/products/sport-pants.jpg"],
    inventory: 80,
    sku: "SL-SP-001",
  },
  {
    name: "真皮小方包",
    description: "进口牛皮，简约时尚的单肩包",
    price: 899.0,
    brand: "LuxLeather",
    category: "配饰",
    status: "Low Stock",
    images: ["/products/leather-bag.jpg"],
    inventory: 10,
    sku: "LL-LB-001",
  },
  {
    name: "羊毛针织衫",
    description: "澳洲美利奴羊毛，保暖舒适的针织衫",
    price: 499.0,
    brand: "WoolMaster",
    category: "上装",
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

    // 初始化产品数据
    const productPromises = defaultProducts.map((product) => {
      const { sku, ...productData } = product;

      return prisma.product.upsert({
        where: { sku },
        update: productData,
        create: product,
      });
    });

    // 并行执行所有初始化操作
    const [settingResults, productResults] = await Promise.all([
      Promise.all(settingPromises),
      Promise.all(productPromises),
    ]);

    console.log(
      `Successfully initialized ${settingResults.length} settings and ${productResults.length} products.`,
    );
  } catch (error) {
    console.error("Failed to initialize data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行main函数
main().catch((error) => {
  console.error("Failed to run seed script:", error);
  process.exit(1);
});
