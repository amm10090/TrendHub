import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 清空现有数据
  await prisma.category.deleteMany();

  // 创建一级分类
  const electronics = await prisma.category.create({
    data: {
      name: "电子产品",
      slug: "electronics",
      description: "包括手机、电脑、平板等电子产品",
      level: 1,
      isActive: true,
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: "服装",
      slug: "clothing",
      description: "包括男装、女装、童装等服装类目",
      level: 1,
      isActive: true,
    },
  });

  const food = await prisma.category.create({
    data: {
      name: "食品",
      slug: "food",
      description: "包括零食、饮料、生鲜等食品类目",
      level: 1,
      isActive: true,
    },
  });

  // 创建二级分类
  await prisma.category.createMany({
    data: [
      {
        name: "手机",
        slug: "phones",
        description: "智能手机和配件",
        level: 2,
        parentId: electronics.id,
        isActive: true,
      },
      {
        name: "电脑",
        slug: "computers",
        description: "笔记本电脑和台式电脑",
        level: 2,
        parentId: electronics.id,
        isActive: true,
      },
      {
        name: "男装",
        slug: "mens-clothing",
        description: "男士服装",
        level: 2,
        parentId: clothing.id,
        isActive: true,
      },
      {
        name: "女装",
        slug: "womens-clothing",
        description: "女士服装",
        level: 2,
        parentId: clothing.id,
        isActive: true,
      },
      {
        name: "零食",
        slug: "snacks",
        description: "休闲零食",
        level: 2,
        parentId: food.id,
        isActive: true,
      },
      {
        name: "饮料",
        slug: "beverages",
        description: "饮料和酒水",
        level: 2,
        parentId: food.id,
        isActive: true,
      },
    ],
  });

  console.log("种子数据创建成功");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
