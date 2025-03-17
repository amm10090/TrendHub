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

// 执行种子数据初始化
async function main() {
  console.log("开始初始化默认设置...");

  try {
    // 使用upsert批量操作，避免重复添加
    const promises = defaultSettings.map((setting) =>
      prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value }, // 如果存在则更新value
        create: setting, // 如果不存在则创建
      }),
    );

    // 执行所有upsert操作
    const results = await Promise.all(promises);

    console.log(`成功初始化了 ${results.length} 条设置数据。`);
  } catch (error) {
    console.error("初始化设置失败:", error);
  } finally {
    // 关闭数据库连接
    await prisma.$disconnect();
  }
}

// 执行main函数
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
