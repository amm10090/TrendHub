import { PrismaClient } from "@prisma/client";

// 使用全局变量保存PrismaClient实例，防止热重载时创建多个实例
// 这在开发环境中尤为重要，可以避免创建过多的数据库连接
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 创建或复用PrismaClient实例
export const db = globalForPrisma.prisma || new PrismaClient();

// 只在非生产环境下将prisma实例赋值给global对象
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
