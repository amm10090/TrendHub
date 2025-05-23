import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // 导入 bcryptjs

const prisma = new PrismaClient();

interface SeedOptions {
  adminEmail?: string;
  adminPassword?: string;
  siteName?: string;
}

export async function main(options?: SeedOptions) {
  // --- 创建管理员用户 ---
  const defaultAdminEmail = "admin@trendhub.com";
  const defaultAdminPassword = "secureAdminPassword123"; // 默认密码，仅在未提供参数时使用
  const saltRounds = 10;

  const emailToUse = options?.adminEmail || defaultAdminEmail;
  const passwordToUse = options?.adminPassword || defaultAdminPassword;
  const siteNameToUse = options?.siteName || "TrendHub"; // 默认站点名称

  const hashedPassword = await bcrypt.hash(passwordToUse, saltRounds);

  // 检查用户是否已存在，如果存在则更新，否则创建
  const existingUser = await prisma.user.findUnique({
    where: { email: emailToUse },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email: emailToUse },
      data: {
        name: "TrendHub Admin", // 或根据 options 传递的用户名
        passwordHash: hashedPassword,
        emailVerified: new Date(), // 首次设置时验证邮箱
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: emailToUse,
        name: "TrendHub Admin", // 或根据 options 传递的用户名
        passwordHash: hashedPassword,
        emailVerified: new Date(),
      },
    });
  }
  // --- 管理员用户创建结束 ---

  // --- 设置站点名称 ---
  await prisma.siteSetting.upsert({
    where: { key: "siteName" },
    update: { value: siteNameToUse, category: "general" },
    create: { key: "siteName", value: siteNameToUse, category: "general" },
  });
  // --- 站点名称设置结束 ---

  // 清理旧数据 (如果不是首次初始化，并且策略是清空)
  // 注意: 此处不清空 User 和 SiteSetting 表，因为我们刚创建/更新了管理员和站点名称
  // await prisma.product.deleteMany({});
  // await prisma.contentItem.deleteMany({});
  // await prisma.contentBlock.deleteMany({});
  // await prisma.category.deleteMany({});
  // await prisma.brand.deleteMany({});

  // --- 创建品牌 ---
  const brandGucci = await prisma.brand.upsert({
    where: { slug: "gucci" },
    update: {
      name: "Gucci",
      logo: "https://placehold.co/150x50?text=Gucci",
      website: "https://www.gucci.com",
      popularity: true,
      isActive: true,
    },
    create: {
      name: "Gucci",
      slug: "gucci",
      logo: "https://placehold.co/150x50?text=Gucci",
      website: "https://www.gucci.com",
      popularity: true,
      isActive: true,
    },
  });
  // ... (其他品牌数据使用 upsert 确保幂等性) ...
  const brandChanel = await prisma.brand.upsert({
    where: { slug: "chanel" },
    update: { name: "Chanel" },
    create: {
      name: "Chanel",
      slug: "chanel",
      logo: "https://placehold.co/150x50?text=Chanel",
      website: "https://www.chanel.com",
      popularity: true,
      isActive: true,
    },
  });
  const brandLouisVuitton = await prisma.brand.upsert({
    where: { slug: "louis-vuitton" },
    update: { name: "Louis Vuitton" },
    create: {
      name: "Louis Vuitton",
      slug: "louis-vuitton",
      logo: "https://placehold.co/150x50?text=LV",
      website: "https://www.louisvuitton.com",
      popularity: true,
      isActive: true,
    },
  });
  const brandPrada = await prisma.brand.upsert({
    where: { slug: "prada" },
    update: { name: "Prada" },
    create: {
      name: "Prada",
      slug: "prada",
      logo: "https://placehold.co/150x50?text=Prada",
      website: "https://www.prada.com",
      popularity: true,
      isActive: true,
    },
  });
  const brandDior = await prisma.brand.upsert({
    where: { slug: "dior" },
    update: { name: "Dior" },
    create: {
      name: "Dior",
      slug: "dior",
      logo: "https://placehold.co/150x50?text=Dior",
      website: "https://www.dior.com",
      popularity: true,
      isActive: true,
    },
  });
  const brandHermes = await prisma.brand.upsert({
    where: { slug: "hermes" },
    update: { name: "Hermès" },
    create: {
      name: "Hermès",
      slug: "hermes",
      logo: "https://placehold.co/150x50?text=Hermes",
      website: "https://www.hermes.com",
      popularity: true,
      isActive: true,
    },
  });

  // --- 创建分类 ---
  const womenCategory = await prisma.category.upsert({
    where: { slug: "women" },
    update: { name: "Women" },
    create: {
      name: "Women",
      slug: "women",
      description: "Latest fashion and trends for women.",
      level: 1,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women",
    },
  });
  const menCategory = await prisma.category.upsert({
    where: { slug: "men" },
    update: { name: "Men" },
    create: {
      name: "Men",
      slug: "men",
      description: "Stylish clothing and accessories for men.",
      level: 1,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men",
    },
  });

  // L2 Categories for Women
  const womenClothing = await prisma.category.upsert({
    where: { slug: "women-clothing" },
    update: { name: "Clothing" },
    create: {
      name: "Clothing",
      slug: "women-clothing",
      description: "Women's apparel including dresses, tops, and outerwear.",
      level: 2,
      parentId: womenCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women+Clothing",
    },
  });

  void womenClothing; // 标记为有意未使用
  const womenAccessories = await prisma.category.upsert({
    where: { slug: "women-accessories" },
    update: { name: "Accessories" },
    create: {
      name: "Accessories",
      slug: "women-accessories",
      description: "Handbags, scarves, belts, and more for women.",
      level: 2,
      parentId: womenCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women+Accessories",
    },
  });
  const womenShoes = await prisma.category.upsert({
    where: { slug: "women-shoes" },
    update: { name: "Shoes" },
    create: {
      name: "Shoes",
      slug: "women-shoes",
      description: "A wide range of women's footwear.",
      level: 2,
      parentId: womenCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women+Shoes",
    },
  });
  const womenJewelry = await prisma.category.upsert({
    where: { slug: "women-jewelry" },
    update: { name: "Jewelry" },
    create: {
      name: "Jewelry",
      slug: "women-jewelry",
      description:
        "Elegant necklaces, earrings, bracelets, and rings for women.",
      level: 2,
      parentId: womenCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women+Jewelry",
    },
  });

  // L3 Categories for Women (Handbags, Flats, Heels, Sneakers, Earrings, Rings)
  const womenHandbags = await prisma.category.upsert({
    where: { slug: "women-accessories-handbags" },
    update: {},
    create: {
      name: "Handbags",
      slug: "women-accessories-handbags",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=Handbags",
    },
  });
  const womenFlats = await prisma.category.upsert({
    where: { slug: "women-shoes-flats" },
    update: {},
    create: {
      name: "Flats & Ballerinas",
      slug: "women-shoes-flats",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=Flats",
    },
  });
  const womenHeels = await prisma.category.upsert({
    where: { slug: "women-shoes-heels" },
    update: {},
    create: {
      name: "Heels",
      slug: "women-shoes-heels",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=Heels",
    },
  });
  const womenSneakersL3 = await prisma.category.upsert({
    where: { slug: "women-shoes-sneakers" },
    update: {},
    create: {
      name: "Sneakers",
      slug: "women-shoes-sneakers",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=W+Sneakers",
    },
  });
  const womenEarrings = await prisma.category.upsert({
    where: { slug: "women-jewelry-earrings" },
    update: {},
    create: {
      name: "Earrings",
      slug: "women-jewelry-earrings",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=Earrings",
    },
  });
  const womenRings = await prisma.category.upsert({
    where: { slug: "women-jewelry-rings" },
    update: {},
    create: {
      name: "Rings",
      slug: "women-jewelry-rings",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=W+Rings",
    },
  });
  const womenSunglassesL3 = await prisma.category.upsert({
    where: { slug: "women-accessories-sunglasses" },
    update: {},
    create: {
      name: "Sunglasses",
      slug: "women-accessories-sunglasses",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Sunglasses",
    },
  });

  // L2 Categories for Men
  const menClothing = await prisma.category.upsert({
    where: { slug: "men-clothing" },
    update: { name: "Clothing" },
    create: {
      name: "Clothing",
      slug: "men-clothing",
      description: "Men's apparel including shirts, pants, and suits.",
      level: 2,
      parentId: menCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men+Clothing",
    },
  });

  void menClothing; // 标记为有意未使用
  const menAccessories = await prisma.category.upsert({
    where: { slug: "men-accessories" },
    update: { name: "Accessories" },
    create: {
      name: "Accessories",
      slug: "men-accessories",
      description: "Bags, wallets, ties, and more for men.",
      level: 2,
      parentId: menCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men+Accessories",
    },
  });
  const menShoes = await prisma.category.upsert({
    where: { slug: "men-shoes" },
    update: { name: "Shoes" },
    create: {
      name: "Shoes",
      slug: "men-shoes",
      description: "A variety of men's footwear.",
      level: 2,
      parentId: menCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men+Shoes",
    },
  });

  // L3 Categories for Men (Casual Shoes, Sneakers, Bracelets, Scarves)
  const menCasualShoes = await prisma.category.upsert({
    where: { slug: "men-shoes-casual-loafers" },
    update: {},
    create: {
      name: "Casual Shoes & Loafers",
      slug: "men-shoes-casual-loafers",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=Casual+Shoes",
    },
  });
  const menSneakersL3 = await prisma.category.upsert({
    where: { slug: "men-shoes-sneakers" },
    update: {},
    create: {
      name: "Sneakers",
      slug: "men-shoes-sneakers",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=M+Sneakers",
    },
  });
  const menBraceletsL3 = await prisma.category.upsert({
    where: { slug: "men-jewelry-bracelets" },
    update: {},
    create: {
      name: "Bracelets",
      slug: "men-jewelry-bracelets",
      level: 3,
      parentId: menAccessories.id,
      /* Placeholder: menJewelry.id not created, using menAccessories */ isActive:
        true,
      image: "https://placehold.co/300x200?text=M+Bracelets",
    },
  });
  const menScarves = await prisma.category.upsert({
    where: { slug: "men-accessories-scarves" },
    update: {},
    create: {
      name: "Scarves",
      slug: "men-accessories-scarves",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      image: "https://placehold.co/300x200?text=M+Scarves",
    },
  });

  // --- 创建示例产品 (确保幂等性) ---
  const productsToSeed = [
    {
      name: "Gucci Horsebit 1955 Shoulder Bag",
      sku: "GUCCI-WHB-HB1955-BEIGE",
      price: 2980.0,
      brandId: brandGucci.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Iconic bag.",
      images: ["https://placehold.co/600x600?text=Gucci+Horsebit+Bag"],
      inventory: 12,
      source: "SEED_DATA",
      colors: ["Beige/Ebony GG Supreme", "White Leather"],
      sizes: ["One Size"],
      material: "GG Supreme canvas, Leather trim",
      tags: ["Gucci", "Handbag", "Horsebit 1955", "Luxury"],
      gender: "WOMEN",
      isNew: true,
    },
    {
      name: "Gucci Princetown Leather Slipper",
      sku: "GUCCI-WSLP-PRNCE-BLK-37",
      price: 850.0,
      brandId: brandGucci.id,
      categoryId: womenFlats.id,
      status: "ACTIVE",
      description: "Classic slipper.",
      images: ["https://placehold.co/600x600?text=Gucci+Princetown"],
      inventory: 25,
      source: "SEED_DATA",
      colors: ["Black", "White", "Rose Beige"],
      sizes: ["EU 36", "EU 37", "EU 38"],
      material: "Leather",
      tags: ["Gucci", "Slippers", "Princetown"],
      gender: "WOMEN",
    },
    {
      name: "Gucci Interlocking G Sterling Silver Bracelet",
      sku: "GUCCI-MJWL-IGBRC-SILV",
      price: 450.0,
      brandId: brandGucci.id,
      categoryId: menBraceletsL3.id,
      status: "ACTIVE",
      description: "Silver bracelet.",
      images: ["https://placehold.co/600x600?text=Gucci+Silver+Bracelet"],
      inventory: 30,
      source: "SEED_DATA",
      colors: ["Silver"],
      sizes: ["17cm", "19cm"],
      material: "925 Sterling Silver",
      tags: ["Gucci", "Bracelet", "Silver"],
      gender: "UNISEX",
    },
    {
      name: "Chanel 19 Handbag",
      sku: "CHANEL-WHB-19BAG-BLK-LRG",
      price: 6500.0,
      brandId: brandChanel.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Chanel 19.",
      images: ["https://placehold.co/600x600?text=Chanel+19+Bag"],
      inventory: 8,
      source: "SEED_DATA",
      colors: ["Black"],
      sizes: ["Large"],
      material: "Lambskin Leather",
      tags: ["Chanel", "Handbag"],
      gender: "WOMEN",
      isNew: true,
    },
    {
      name: "Chanel Slingback Pumps",
      sku: "CHANEL-WSHOE-SLING-BEIBLK-38",
      price: 1150.0,
      brandId: brandChanel.id,
      categoryId: womenHeels.id,
      status: "ACTIVE",
      description: "Slingbacks.",
      images: ["https://placehold.co/600x600?text=Chanel+Slingbacks"],
      inventory: 15,
      source: "SEED_DATA",
      colors: ["Beige/Black"],
      sizes: ["EU 38"],
      material: "Goatskin",
      tags: ["Chanel", "Pumps"],
      gender: "WOMEN",
    },
    {
      name: "Chanel Coco Crush Ring in Yellow Gold",
      sku: "CHANEL-WJWL-COCOCR-YG-52",
      price: 3200.0,
      brandId: brandChanel.id,
      categoryId: womenRings.id,
      status: "ACTIVE",
      description: "Coco Crush.",
      images: ["https://placehold.co/600x600?text=Chanel+Coco+Ring"],
      inventory: 10,
      source: "SEED_DATA",
      colors: ["Yellow Gold"],
      sizes: ["EU 52"],
      material: "18K Yellow Gold",
      tags: ["Chanel", "Ring"],
      gender: "WOMEN",
    },
    {
      name: "Louis Vuitton Neverfull MM Tote Bag",
      sku: "LV-WTOTE-NEVERMM-MONO",
      price: 2030.0,
      brandId: brandLouisVuitton.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Neverfull.",
      images: ["https://placehold.co/600x600?text=LV+Neverfull+MM"],
      inventory: 22,
      source: "SEED_DATA",
      colors: ["Monogram"],
      sizes: ["MM"],
      material: "Canvas",
      tags: ["Louis Vuitton", "Tote"],
      gender: "WOMEN",
    },
    {
      name: "Louis Vuitton Archlight Sneaker",
      sku: "LV-WSNK-ARCHL-WHT-37",
      price: 1250.0,
      brandId: brandLouisVuitton.id,
      categoryId: womenSneakersL3.id,
      status: "ACTIVE",
      description: "Archlight.",
      images: ["https://placehold.co/600x600?text=LV+Archlight"],
      inventory: 18,
      source: "SEED_DATA",
      colors: ["White"],
      sizes: ["EU 37"],
      material: "Technical Fabrics",
      tags: ["Louis Vuitton", "Sneakers"],
      gender: "WOMEN",
      isNew: true,
    },
    {
      name: "Louis Vuitton Monogram Classic Scarf",
      sku: "LV-MACC-SCARFMONO-GRY",
      price: 595.0,
      brandId: brandLouisVuitton.id,
      categoryId: menScarves.id,
      status: "ACTIVE",
      description: "Monogram Scarf.",
      images: ["https://placehold.co/600x600?text=LV+Monogram+Scarf"],
      inventory: 35,
      source: "SEED_DATA",
      colors: ["Grey"],
      sizes: ["One Size"],
      material: "Silk/Wool",
      tags: ["Louis Vuitton", "Scarf"],
      gender: "UNISEX",
    },
    {
      name: "Prada Galleria Saffiano Leather Bag",
      sku: "PRADA-WHBG-GALLERIA-BLK-MED",
      price: 3200.0,
      brandId: brandPrada.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Galleria Bag.",
      images: ["https://placehold.co/600x600?text=Prada+Galleria"],
      inventory: 15,
      source: "SEED_DATA",
      colors: ["Black"],
      sizes: ["Medium"],
      material: "Saffiano Leather",
      tags: ["Prada", "Handbag"],
      gender: "WOMEN",
    },
    {
      name: "Prada Monolith Brushed Leather Loafers",
      sku: "PRADA-MSHO-MONOLITH-BLK-8",
      price: 1100.0,
      brandId: brandPrada.id,
      categoryId: menCasualShoes.id,
      status: "ACTIVE",
      description: "Monolith Loafers.",
      images: ["https://placehold.co/600x600?text=Prada+Monolith+Loafers"],
      inventory: 20,
      source: "SEED_DATA",
      colors: ["Black"],
      sizes: ["UK 8"],
      material: "Brushed Leather",
      tags: ["Prada", "Loafers"],
      gender: "MEN",
      isNew: true,
    },
    {
      name: "Prada Symbole Sunglasses",
      sku: "PRADA-WSUN-SYMBOLE-BLK",
      price: 480.0,
      brandId: brandPrada.id,
      categoryId: womenSunglassesL3.id,
      status: "ACTIVE",
      description: "Symbole Sunglasses.",
      images: ["https://placehold.co/600x600?text=Prada+Symbole+Sunglasses"],
      inventory: 28,
      source: "SEED_DATA",
      colors: ["Black"],
      sizes: ["One Size"],
      material: "Acetate",
      tags: ["Prada", "Sunglasses"],
      gender: "WOMEN",
    },
    {
      name: "Dior Lady Dior Bag Medium",
      sku: "DIOR-WHBG-LADYDIOR-MED-BLK",
      price: 5900.0,
      brandId: brandDior.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Lady Dior.",
      images: ["https://placehold.co/600x600?text=Dior+Lady+Dior"],
      inventory: 7,
      source: "SEED_DATA",
      colors: ["Black"],
      sizes: ["Medium"],
      material: "Lambskin",
      tags: ["Dior", "Handbag"],
      gender: "WOMEN",
    },
    {
      name: "Dior B23 High-Top Sneaker",
      sku: "DIOR-MSNK-B23HIGH-OBLGRY-42",
      price: 1150.0,
      brandId: brandDior.id,
      categoryId: menSneakersL3.id,
      status: "ACTIVE",
      description: "B23 Sneaker.",
      images: ["https://placehold.co/600x600?text=Dior+B23+Sneaker"],
      inventory: 16,
      source: "SEED_DATA",
      colors: ["Dior Oblique"],
      sizes: ["EU 42"],
      material: "Technical Fabric",
      tags: ["Dior", "Sneakers"],
      gender: "MEN",
    },
    {
      name: "Dior Tribales Earrings",
      sku: "DIOR-WJWL-TRIBALES-PEARL",
      price: 520.0,
      brandId: brandDior.id,
      categoryId: womenEarrings.id,
      status: "ACTIVE",
      description: "Tribales Earrings.",
      images: ["https://placehold.co/600x600?text=Dior+Tribales+Earrings"],
      inventory: 20,
      source: "SEED_DATA",
      colors: ["White Resin Pearls"],
      sizes: ["One Size"],
      material: "Resin Pearls",
      tags: ["Dior", "Earrings"],
      gender: "WOMEN",
    },
    {
      name: "Hermès Birkin 30 Bag",
      sku: "HERMES-WHBG-BIRKIN30-TOGO-GOLD",
      price: 22000.0,
      brandId: brandHermes.id,
      categoryId: womenHandbags.id,
      status: "ACTIVE",
      description: "Birkin 30.",
      images: ["https://placehold.co/600x600?text=Hermes+Birkin+30"],
      inventory: 1,
      source: "SEED_DATA_RARE",
      colors: ["Gold"],
      sizes: ["30cm"],
      material: "Togo Leather",
      tags: ["Hermès", "Birkin"],
      gender: "WOMEN",
    },
    {
      name: "Hermès Oran Sandals",
      sku: "HERMES-WSHOE-ORAN-GOLD-38",
      price: 730.0,
      brandId: brandHermes.id,
      categoryId: womenFlats.id,
      status: "ACTIVE",
      description: "Oran Sandals.",
      images: ["https://placehold.co/600x600?text=Hermes+Oran+Sandals"],
      inventory: 25,
      source: "SEED_DATA",
      colors: ["Gold"],
      sizes: ["EU 38"],
      material: "Calfskin Leather",
      tags: ["Hermès", "Sandals"],
      gender: "WOMEN",
    },
  ];

  for (const productData of productsToSeed) {
    const { brandId, categoryId, ...restOfProductData } = productData;

    const existingProduct = await prisma.product.findFirst({
      where: { sku: productData.sku },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          ...restOfProductData, // 不再包含 brandId 和 categoryId
          brand: { connect: { id: brandId } },
          category: { connect: { id: categoryId } },
        },
      });
    } else {
      await prisma.product.create({
        data: {
          ...restOfProductData, // 不再包含 brandId 和 categoryId
          brand: { connect: { id: brandId } },
          category: { connect: { id: categoryId } },
        },
      });
    }
  }
}

// 如果直接运行此脚本，则调用 main
// (通常在 prisma db seed 命令中是这样)
// if (require.main === module) {
//   main()
//     .catch((e) => {
//       console.error(e);
//       process.exit(1);
//     })
//     .finally(async () => {
//       await prisma.$disconnect();
//     });
// }
