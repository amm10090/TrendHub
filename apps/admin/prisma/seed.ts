import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // 导入 bcryptjs

const prisma = new PrismaClient();

async function main() {
  // --- 创建管理员用户 ---
  const adminEmail = "admin@trendhub.com";
  const adminPassword = "secureAdminPassword123"; // 请务必在实际使用中更改此密码并使用更强壮的密码！
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  try {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: "TrendHub Admin",
        passwordHash: hashedPassword,
        emailVerified: new Date(),
      },
      create: {
        email: adminEmail,
        name: "TrendHub Admin",
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        // 如果您的 User 模型有其他必填字段，请在此处添加
      },
    });
  } catch {
    return;
    // 根据您的错误处理策略，您可能希望在这里抛出错误或退出进程
  }
  // --- 管理员用户创建结束 ---

  // Clear existing data - order is important due to foreign key constraints
  // 注意：如果 User 表与其他表有关联，且 onDelete 不是 Cascade，直接删除 User 可能失败
  // 确保在删除 User 之前处理或删除依赖 User 的记录，或者调整删除顺序
  // 为安全起见，在 User 创建之后再执行这些删除操作，并确保依赖关系正确

  // 建议先删除依赖 User 的数据，或者如果 User 是新加的，之前没有 User 数据，则此步骤可以跳过或调整
  // 例如： await prisma.order.deleteMany({}); // 如果有 Order 表依赖 User

  await prisma.product.deleteMany({});
  await prisma.contentItem.deleteMany({}); // 新增，先删除 ContentItem
  await prisma.contentBlock.deleteMany({}); // 新增，再删除 ContentBlock
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  // 如果 User 是新模型，且之前数据库中没有 User 表，或者您希望保留现有的 User（除了 admin），
  // 则不应执行 prisma.user.deleteMany({})，除非您想清空所有用户只留下 admin。
  // 如果要保留其他用户，但清空其他数据，则调整此处的删除逻辑。
  // 假设我们目前只关心 admin 用户，并且其他表数据可以安全删除：
  // await prisma.user.deleteMany({ where: { email: { not: adminEmail } } }); // 可选：删除除 admin 外的所有用户

  // --- Create Brands ---
  const brandGucci = await prisma.brand.create({
    data: {
      name: "Gucci",
      slug: "gucci",
      logo: "https://placehold.co/150x50?text=Gucci",
      website: "https://www.gucci.com",
      popularity: true,
      isActive: true,
    },
  });

  const brandChanel = await prisma.brand.create({
    data: {
      name: "Chanel",
      slug: "chanel",
      logo: "https://placehold.co/150x50?text=Chanel",
      website: "https://www.chanel.com",
      popularity: true,
      isActive: true,
    },
  });

  const brandLouisVuitton = await prisma.brand.create({
    data: {
      name: "Louis Vuitton",
      slug: "louis-vuitton",
      logo: "https://placehold.co/150x50?text=LV",
      website: "https://www.louisvuitton.com",
      popularity: true,
      isActive: true,
    },
  });

  const brandPrada = await prisma.brand.create({
    data: {
      name: "Prada",
      slug: "prada",
      logo: "https://placehold.co/150x50?text=Prada",
      website: "https://www.prada.com",
      popularity: true,
      isActive: true,
    },
  });

  const brandDior = await prisma.brand.create({
    data: {
      name: "Dior",
      slug: "dior",
      logo: "https://placehold.co/150x50?text=Dior",
      website: "https://www.dior.com",
      popularity: true,
      isActive: true,
    },
  });

  const brandHermes = await prisma.brand.create({
    data: {
      name: "Hermès",
      slug: "hermes",
      logo: "https://placehold.co/150x50?text=Hermes",
      website: "https://www.hermes.com",
      popularity: true,
      isActive: true,
    },
  });

  const womenCategory = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      description: "Latest fashion and trends for women.",
      level: 1,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Women",
    },
  });
  const menCategory = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      description: "Stylish clothing and accessories for men.",
      level: 1,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men",
    },
  });

  const womenClothing = await prisma.category.create({
    data: {
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
  const womenAccessories = await prisma.category.create({
    data: {
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
  const womenShoes = await prisma.category.create({
    data: {
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
  const womenJewelry = await prisma.category.create({
    data: {
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

  const menClothing = await prisma.category.create({
    data: {
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
  const menAccessories = await prisma.category.create({
    data: {
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
  const menShoes = await prisma.category.create({
    data: {
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
  const menJewelry = await prisma.category.create({
    data: {
      name: "Jewelry",
      slug: "men-jewelry",
      description: "Stylish cufflinks, tie clips, and bracelets for men.",
      level: 2,
      parentId: menCategory.id,
      isActive: true,
      showInNavbar: true,
      image: "https://placehold.co/300x200?text=Men+Jewelry",
    },
  });

  // Women -> Clothing -> L3
  await prisma.category.create({
    data: {
      name: "Dresses",
      slug: "women-clothing-dresses",
      level: 3,
      parentId: womenClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Dresses",
    },
  });
  await prisma.category.create({
    data: {
      name: "Tops",
      slug: "women-clothing-tops",
      level: 3,
      parentId: womenClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Tops",
    },
  });
  await prisma.category.create({
    data: {
      name: "Outerwear",
      slug: "women-clothing-outerwear",
      level: 3,
      parentId: womenClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Outerwear",
    },
  }); // Renamed to avoid conflict
  await prisma.category.create({
    data: {
      name: "Pants",
      slug: "women-clothing-pants",
      level: 3,
      parentId: womenClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Pants",
    },
  });
  await prisma.category.create({
    data: {
      name: "Skirts",
      slug: "women-clothing-skirts",
      level: 3,
      parentId: womenClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Skirts",
    },
  });

  // Women -> Accessories -> L3
  const womenHandbags = await prisma.category.create({
    data: {
      name: "Handbags",
      slug: "women-accessories-handbags",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Handbags",
    },
  });

  await prisma.category.create({
    data: {
      name: "Wallets & SLGs",
      slug: "women-accessories-wallets-slgs",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Wallets",
    },
  });
  await prisma.category.create({
    data: {
      name: "Scarves & Shawls",
      slug: "women-accessories-scarves",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Scarves",
    },
  });
  await prisma.category.create({
    data: {
      name: "Belts",
      slug: "women-accessories-belts",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Belts",
    },
  });
  const womenSunglassesL3 = await prisma.category.create({
    data: {
      name: "Sunglasses",
      slug: "women-accessories-sunglasses",
      level: 3,
      parentId: womenAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Sunglasses",
    },
  });

  // Women -> Shoes -> L3
  const womenHeels = await prisma.category.create({
    data: {
      name: "Heels",
      slug: "women-shoes-heels",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Heels",
    },
  });
  const womenFlats = await prisma.category.create({
    data: {
      name: "Flats & Ballerinas",
      slug: "women-shoes-flats",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Flats",
    },
  });
  const womenSneakersL3 = await prisma.category.create({
    data: {
      name: "Sneakers",
      slug: "women-shoes-sneakers",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Sneakers",
    },
  });

  await prisma.category.create({
    data: {
      name: "Boots & Ankle Boots",
      slug: "women-shoes-boots",
      level: 3,
      parentId: womenShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Boots",
    },
  });

  // Women -> Jewelry -> L3
  await prisma.category.create({
    data: {
      name: "Necklaces",
      slug: "women-jewelry-necklaces",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Necklaces",
    },
  });
  const womenEarrings = await prisma.category.create({
    data: {
      name: "Earrings",
      slug: "women-jewelry-earrings",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Earrings",
    },
  });

  await prisma.category.create({
    data: {
      name: "Bracelets",
      slug: "women-jewelry-bracelets",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Bracelets",
    },
  });
  const womenRings = await prisma.category.create({
    data: {
      name: "Rings",
      slug: "women-jewelry-rings",
      level: 3,
      parentId: womenJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=W+Rings",
    },
  });

  // Men -> Clothing -> L3
  await prisma.category.create({
    data: {
      name: "Shirts",
      slug: "men-clothing-shirts",
      level: 3,
      parentId: menClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Shirts",
    },
  });
  await prisma.category.create({
    data: {
      name: "T-shirts & Polos",
      slug: "men-clothing-tshirts-polos",
      level: 3,
      parentId: menClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=T-shirts",
    },
  });
  await prisma.category.create({
    data: {
      name: "Outerwear",
      slug: "men-clothing-outerwear",
      level: 3,
      parentId: menClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Outerwear",
    },
  }); // Renamed
  await prisma.category.create({
    data: {
      name: "Pants & Shorts",
      slug: "men-clothing-pants-shorts",
      level: 3,
      parentId: menClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Pants",
    },
  });
  await prisma.category.create({
    data: {
      name: "Suits & Blazers",
      slug: "men-clothing-suits-blazers",
      level: 3,
      parentId: menClothing.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Suits",
    },
  });

  // Men -> Accessories -> L3
  await prisma.category.create({
    data: {
      name: "Bags & Backpacks",
      slug: "men-accessories-bags",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Bags",
    },
  });
  await prisma.category.create({
    data: {
      name: "Wallets & Cardholders",
      slug: "men-accessories-wallets-slgs",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Wallets",
    },
  });
  await prisma.category.create({
    data: {
      name: "Ties & Pocket Squares",
      slug: "men-accessories-ties",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Ties",
    },
  });
  await prisma.category.create({
    data: {
      name: "Belts",
      slug: "men-accessories-belts",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Belts",
    },
  }); // Renamed
  const menScarves = await prisma.category.create({
    data: {
      name: "Scarves",
      slug: "men-accessories-scarves",
      level: 3,
      parentId: menAccessories.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Scarves",
    },
  });

  // Men -> Shoes -> L3
  await prisma.category.create({
    data: {
      name: "Formal Shoes",
      slug: "men-shoes-formal",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Formal+Shoes",
    },
  });
  const menCasualShoes = await prisma.category.create({
    data: {
      name: "Casual Shoes & Loafers",
      slug: "men-shoes-casual-loafers",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Casual+Shoes",
    },
  });
  const menSneakersL3 = await prisma.category.create({
    data: {
      name: "Sneakers",
      slug: "men-shoes-sneakers",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Sneakers",
    },
  });

  await prisma.category.create({
    data: {
      name: "Boots",
      slug: "men-shoes-boots",
      level: 3,
      parentId: menShoes.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Boots",
    },
  });

  // Men -> Jewelry -> L3
  await prisma.category.create({
    data: {
      name: "Cufflinks & Tie Clips",
      slug: "men-jewelry-cufflinks-tieclips",
      level: 3,
      parentId: menJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=Cufflinks",
    },
  });
  const menBraceletsL3 = await prisma.category.create({
    data: {
      name: "Bracelets",
      slug: "men-jewelry-bracelets",
      level: 3,
      parentId: menJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Bracelets",
    },
  }); // Renamed

  await prisma.category.create({
    data: {
      name: "Rings",
      slug: "men-jewelry-rings",
      level: 3,
      parentId: menJewelry.id,
      isActive: true,
      showInNavbar: false,
      image: "https://placehold.co/300x200?text=M+Rings",
    },
  }); // Renamed

  await prisma.product.createMany({
    data: [
      // --- Gucci Products ---
      {
        name: "Gucci Horsebit 1955 Shoulder Bag",
        price: 2980.0,
        originalPrice: 3150.0,
        status: "ACTIVE",
        description:
          "The Gucci Horsebit 1955 shoulder bag is recreated from an archival design, featuring the iconic Horsebit detail and a modern spirit.",
        images: ["https://placehold.co/600x600?text=Gucci+Horsebit+Bag"],
        sku: "GUCCI-WHB-HB1955-BEIGE",
        inventory: 12,
        source: "SEED_DATA",
        brandId: brandGucci.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Beige/Ebony GG Supreme", "White Leather"],
        sizes: ["One Size"],
        material: "GG Supreme canvas, Leather trim",
        tags: ["Gucci", "Handbag", "Horsebit 1955", "Luxury"],
        gender: "WOMEN",
        cautions:
          "Please avoid contact with sharp objects to prevent scratches. Clean with a soft, dry cloth.",
        coupon: "GUCCILUV24",
        couponDescription:
          "Get ¥1000 off on select Gucci items with a minimum spend of ¥20000.",
        couponExpirationDate: new Date("2025-12-31T23:59:59Z"),
        currency: "USD",
        isNew: true,
      },
      {
        name: "Gucci Princetown Leather Slipper",
        price: 850.0,
        status: "ACTIVE",
        description:
          "The Princetown slipper in black leather with Gucci's signature Horsebit detail. A contemporary take on a classic.",
        images: ["https://placehold.co/600x600?text=Gucci+Princetown"],
        sku: "GUCCI-WSLP-PRNCE-BLK-37",
        inventory: 25,
        source: "SEED_DATA",
        brandId: brandGucci.id,
        categoryId: womenFlats.id, // Women -> Shoes -> Flats
        colors: ["Black", "White", "Rose Beige"],
        sizes: ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40"],
        material: "Leather",
        tags: ["Gucci", "Slippers", "Princetown", "Leather Shoes", "Horsebit"],
        gender: "WOMEN",
        cautions:
          "Leather material, please keep dry and avoid rain. Maintain regularly with leather conditioner.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },
      {
        name: "Gucci Interlocking G Sterling Silver Bracelet",
        price: 450.0,
        status: "ACTIVE",
        description:
          "A sterling silver bracelet featuring the Interlocking G motif, a distinctive House code.",
        images: ["https://placehold.co/600x600?text=Gucci+Silver+Bracelet"],
        sku: "GUCCI-MJWL-IGBRC-SILV",
        inventory: 30,
        source: "SEED_DATA",
        brandId: brandGucci.id,
        categoryId: menBraceletsL3.id, // Men -> Jewelry -> Bracelets (can be unisex)
        colors: ["Silver"],
        sizes: ["17cm", "19cm"],
        material: "925 Sterling Silver",
        tags: ["Gucci", "Bracelet", "Silver Jewelry", "Interlocking G"],
        gender: "UNISEX",
        cautions:
          "Sterling silver jewelry should avoid contact with chemicals. Store in a sealed bag when not worn.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },

      // --- Chanel Products ---
      {
        name: "Chanel 19 Handbag",
        price: 6500.0,
        status: "ACTIVE",
        description:
          "The Chanel 19 handbag in quilted lambskin, featuring an aged gold-tone, silver-tone and ruthenium-finish metal chain.",
        images: ["https://placehold.co/600x600?text=Chanel+19+Bag"],
        sku: "CHANEL-WHB-19BAG-BLK-LRG",
        inventory: 8,
        source: "SEED_DATA",
        brandId: brandChanel.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Black", "Beige", "Navy Blue"],
        sizes: ["Large"],
        material: "Lambskin Leather",
        tags: ["Chanel", "Handbag", "Chanel 19", "Luxury Bag", "Quilted"],
        gender: "WOMEN",
        cautions:
          "Lambskin leather is delicate, please handle with care to avoid scratches and oil stains.",
        coupon: "CHANELVIP",
        couponDescription: "Chanel VIP exclusive 10% off.",
        couponExpirationDate: new Date("2025-10-31T23:59:59Z"),
        currency: "USD",
        isNew: true,
      },
      {
        name: "Chanel Slingback Pumps",
        price: 1150.0,
        status: "ACTIVE",
        description:
          "Iconic Chanel slingback pumps in beige goatskin and black grosgrain, with a comfortable block heel.",
        images: ["https://placehold.co/600x600?text=Chanel+Slingbacks"],
        sku: "CHANEL-WSHOE-SLING-BEIBLK-38",
        inventory: 15,
        source: "SEED_DATA",
        brandId: brandChanel.id,
        categoryId: womenHeels.id, // Women -> Shoes -> Heels
        colors: ["Beige/Black"],
        sizes: ["EU 37", "EU 38", "EU 39"],
        material: "Goatskin, Grosgrain",
        tags: ["Chanel", "Slingbacks", "Pumps", "Two-tone", "Luxury Shoes"],
        gender: "WOMEN",
        cautions:
          "Please avoid prolonged walking on uneven surfaces to protect the heels.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },
      {
        name: "Chanel Coco Crush Ring in Yellow Gold",
        price: 3200.0,
        status: "ACTIVE",
        description:
          "The Coco Crush ring in 18K yellow gold, featuring the iconic quilted motif. A statement piece of fine jewelry.",
        images: ["https://placehold.co/600x600?text=Chanel+Coco+Ring"],
        sku: "CHANEL-WJWL-COCOCR-YG-52",
        inventory: 10,
        source: "SEED_DATA",
        brandId: brandChanel.id,
        categoryId: womenRings.id, // Women -> Jewelry -> Rings
        colors: ["Yellow Gold"],
        sizes: ["EU 50", "EU 52", "EU 54"],
        material: "18K Yellow Gold",
        tags: ["Chanel", "Ring", "Coco Crush", "Fine Jewelry", "Gold"],
        gender: "WOMEN",
        cautions:
          "Precious metal jewelry, avoid collisions and chemical corrosion.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },

      // --- Louis Vuitton Products ---
      {
        name: "Louis Vuitton Neverfull MM Tote Bag",
        price: 2030.0,
        status: "ACTIVE",
        description:
          "The Neverfull MM tote in Monogram canvas combines iconic design with everyday practicality. Spacious yet not bulky, it is ideal for both city and travel.",
        images: ["https://placehold.co/600x600?text=LV+Neverfull+MM"],
        sku: "LV-WTOTE-NEVERMM-MONO",
        inventory: 22,
        source: "SEED_DATA",
        brandId: brandLouisVuitton.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Monogram Canvas/Beige", "Damier Ebene/Rose Ballerine"],
        sizes: ["MM (Medium)"],
        material: "Monogram Canvas, Cowhide Leather Trim",
        tags: ["Louis Vuitton", "Tote Bag", "Neverfull", "Monogram"],
        gender: "WOMEN",
        cautions:
          "Clean canvas material with a damp cloth, avoid sun exposure.",
        coupon: "LVSUMMER24",
        couponDescription: "Louis Vuitton summer new arrivals 12% off.",
        couponExpirationDate: new Date("2025-08-31T23:59:59Z"),
        currency: "USD",
      },
      {
        name: "Louis Vuitton Archlight Sneaker",
        price: 1250.0,
        status: "ACTIVE",
        description:
          "The iconic LV Archlight sneaker is revisited in a mix of technical materials. Its oversized, wave-shaped outsole is a signature of this avant-garde design.",
        images: ["https://placehold.co/600x600?text=LV+Archlight"],
        sku: "LV-WSNK-ARCHL-WHT-37",
        inventory: 18,
        source: "SEED_DATA",
        brandId: brandLouisVuitton.id,
        categoryId: womenSneakersL3.id, // Women -> Shoes -> Sneakers
        colors: ["White", "Black/White"],
        sizes: ["EU 36", "EU 37", "EU 38"],
        material: "Technical Fabrics, Leather",
        tags: ["Louis Vuitton", "Sneakers", "Archlight", "Luxury Sneakers"],
        gender: "WOMEN",
        cautions:
          "Professional cleaning recommended for sneakers, avoid machine washing.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
        isNew: true,
      },
      {
        name: "Louis Vuitton Monogram Classic Scarf",
        price: 595.0,
        status: "ACTIVE",
        description:
          "A timeless accessory, the Monogram Classic scarf is woven from a soft, warm blend of silk and wool. It features an allover Monogram pattern with a subtle jacquard weave.",
        images: ["https://placehold.co/600x600?text=LV+Monogram+Scarf"],
        sku: "LV-MACC-SCARFMONO-GRY",
        inventory: 35,
        source: "SEED_DATA",
        brandId: brandLouisVuitton.id,
        categoryId: menScarves.id, // Correctly linked to men's scarves category
        colors: ["Grey", "Black", "Beige"],
        sizes: ["One Size"],
        material: "60% Silk, 40% Wool",
        tags: [
          "Louis Vuitton",
          "Scarf",
          "Monogram",
          "Silk Scarf",
          "Mens Accessories",
        ],
        gender: "UNISEX",
        cautions:
          "Silk and wool blend, dry clean or gentle hand wash recommended.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },

      // --- Prada Products ---
      {
        name: "Prada Galleria Saffiano Leather Bag",
        price: 3200.0,
        status: "ACTIVE",
        description:
          "The Prada Galleria bag, an icon of timeless elegance, is crafted in Saffiano leather. It features double handles and a detachable shoulder strap.",
        images: ["https://placehold.co/600x600?text=Prada+Galleria"],
        sku: "PRADA-WHBG-GALLERIA-BLK-MED",
        inventory: 15,
        source: "SEED_DATA",
        brandId: brandPrada.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Black", "Caramel", "Red"],
        sizes: ["Medium"],
        material: "Saffiano Leather",
        tags: ["Prada", "Handbag", "Galleria", "Saffiano", "Luxury Bag"],
        gender: "WOMEN",
        cautions:
          "Saffiano leather is durable but should still avoid scratches from hard objects. Clean with professional care products.",
        coupon: "PRADA100",
        couponDescription:
          "Get ¥1000 off on select Prada items with a minimum spend of ¥15000.",
        couponExpirationDate: new Date("2025-09-30T23:59:59Z"),
        currency: "USD",
      },
      {
        name: "Prada Monolith Brushed Leather Loafers",
        price: 1100.0,
        status: "ACTIVE",
        description:
          "Prada Monolith loafers in brushed leather with a distinctive chunky sole, embodying a modern and bold aesthetic.",
        images: ["https://placehold.co/600x600?text=Prada+Monolith+Loafers"],
        sku: "PRADA-MSHO-MONOLITH-BLK-8",
        inventory: 20,
        source: "SEED_DATA",
        brandId: brandPrada.id,
        categoryId: menCasualShoes.id, // Men -> Shoes -> Casual Shoes
        colors: ["Black"],
        sizes: ["UK 7", "UK 8", "UK 9"],
        material: "Brushed Leather",
        tags: ["Prada", "Loafers", "Monolith", "Chunky Sole", "Mens Shoes"],
        gender: "MEN",
        cautions:
          "Brushed leather, protect from water and stains. Clean promptly after wearing.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
        isNew: true,
      },
      {
        name: "Prada Symbole Sunglasses",
        price: 480.0,
        status: "ACTIVE",
        description:
          "Acetate sunglasses characterized by their geometric design and the iconic Prada Symbole triangle logo on the temples.",
        images: ["https://placehold.co/600x600?text=Prada+Symbole+Sunglasses"],
        sku: "PRADA-WSUN-SYMBOLE-BLK",
        inventory: 28,
        source: "SEED_DATA",
        brandId: brandPrada.id,
        categoryId: womenSunglassesL3.id, // Women -> Accessories -> Sunglasses
        colors: ["Black", "Tortoise"],
        sizes: ["One Size"],
        material: "Acetate",
        tags: ["Prada", "Sunglasses", "Symbole", "Geometric"],
        gender: "WOMEN",
        cautions:
          "Please use a professional lens cloth to wipe the lenses. Store in a case when not in use.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },

      // --- Dior Products ---
      {
        name: "Dior Lady Dior Bag Medium",
        price: 5900.0,
        status: "ACTIVE",
        description:
          "The Lady Dior bag embodies Dior's vision of elegance and beauty. Crafted in black lambskin with Cannage stitching, its timeless silhouette is an icon of sophistication.",
        images: ["https://placehold.co/600x600?text=Dior+Lady+Dior"],
        sku: "DIOR-WHBG-LADYDIOR-MED-BLK",
        inventory: 7,
        source: "SEED_DATA",
        brandId: brandDior.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Black", "Cloud Blue", "Latte"],
        sizes: ["Medium"],
        material: "Lambskin Leather, Cannage Stitching",
        tags: ["Dior", "Lady Dior", "Handbag", "Iconic", "Luxury"],
        gender: "WOMEN",
        cautions:
          "Classic Lady Dior bag, please handle with care to avoid pressure and deformation.",
        coupon: "DIORNEW",
        couponDescription: "Dior new arrivals, 5% off any single item.",
        couponExpirationDate: new Date("2025-11-11T23:59:59Z"),
        currency: "USD",
      },
      {
        name: "Dior B23 High-Top Sneaker",
        price: 1150.0,
        status: "ACTIVE",
        description:
          "The B23 high-top sneaker showcases the iconic Dior Oblique motif. A timeless Dior essential, it pairs easily with any casual outfit.",
        images: ["https://placehold.co/600x600?text=Dior+B23+Sneaker"],
        sku: "DIOR-MSNK-B23HIGH-OBLGRY-42",
        inventory: 16,
        source: "SEED_DATA",
        brandId: brandDior.id,
        categoryId: menSneakersL3.id, // Men -> Shoes -> Sneakers
        colors: ["Dior Oblique Jacquard"],
        sizes: ["EU 41", "EU 42", "EU 43"],
        material: "Dior Oblique Technical Fabric",
        tags: ["Dior", "Sneakers", "B23", "High-Top", "Oblique"],
        gender: "MEN",
        cautions: "Avoid washing canvas uppers, clean with a soft brush.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },
      {
        name: "Dior Tribales Earrings",
        price: 520.0,
        status: "ACTIVE",
        description:
          "The Dior Tribales earrings offer an iconic and timeless design. The asymmetric pair features a smaller pearl that rests on the ear while the larger one elegantly hangs below.",
        images: ["https://placehold.co/600x600?text=Dior+Tribales+Earrings"],
        sku: "DIOR-WJWL-TRIBALES-PEARL",
        inventory: 20,
        source: "SEED_DATA",
        brandId: brandDior.id,
        categoryId: womenEarrings.id, // Women -> Jewelry -> Earrings
        colors: ["White Resin Pearls", "Gold-Finish Metal"],
        sizes: ["One Size"],
        material: "Resin Pearls, Gold-Finish Metal",
        tags: ["Dior", "Earrings", "Tribales", "Pearl Earrings"],
        gender: "WOMEN",
        cautions:
          "Resin pearls should avoid contact with perfume and other chemicals to prevent surface damage.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },

      // --- Hermès Products (Example) ---
      {
        name: "Hermès Birkin 30 Bag",
        price: 22000.0, // Example price, Birkins vary greatly
        status: "ACTIVE",
        description:
          "The iconic Hermès Birkin 30 in Togo leather. A symbol of ultimate luxury and craftsmanship. Availability is extremely limited.",
        images: ["https://placehold.co/600x600?text=Hermes+Birkin+30"],
        sku: "HERMES-WHBG-BIRKIN30-TOGO-GOLD",
        inventory: 1, // Birkins are rare
        source: "SEED_DATA_RARE",
        brandId: brandHermes.id,
        categoryId: womenHandbags.id, // Women -> Accessories -> Handbags
        colors: ["Gold (Brown)", "Noir (Black)", "Etoupe (Grey)"],
        sizes: ["30cm"],
        material: "Togo Leather",
        tags: [
          "Hermès",
          "Birkin",
          "Luxury Handbag",
          "Iconic",
          "Investment Piece",
        ],
        gender: "WOMEN",
        cautions:
          "Top-grade leather goods, please entrust to professional institutions for care and maintenance.",
        coupon: null, // 爱马仕通常不参与打折活动
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },
      {
        name: "Hermès Oran Sandals",
        price: 730.0,
        status: "ACTIVE",
        description:
          'An iconic Hermès style, this Oran sandal in calfskin leather features the legendary "H" cut-out. A chic and comfortable choice for summer.',
        images: ["https://placehold.co/600x600?text=Hermes+Oran+Sandals"],
        sku: "HERMES-WSHOE-ORAN-GOLD-38",
        inventory: 25,
        source: "SEED_DATA",
        brandId: brandHermes.id,
        categoryId: womenFlats.id, // Women -> Shoes -> Flats (or Sandals if category exists)
        colors: ["Gold (Tan)", "Black", "White"],
        sizes: ["EU 37", "EU 38", "EU 39"],
        material: "Calfskin Leather",
        tags: ["Hermès", "Sandals", "Oran", "Leather Shoes", "Summer"],
        gender: "WOMEN",
        cautions:
          "Calfskin sandals, please clean after wearing and store in a ventilated place.",
        coupon: null,
        couponDescription: null,
        couponExpirationDate: null,
        currency: "USD",
      },
    ],
  });
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
