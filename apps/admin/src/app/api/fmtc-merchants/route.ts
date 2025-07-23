import { Prisma } from "@prisma/client";
import {
  executeBatchMerchantScraping,
  type BatchScrapingOptions,
  type MerchantTask,
} from "@repo/scraper/src/sites/fmtc";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";
import { uploadImageToR2 } from "@/lib/imageService";

/**
 * GET /api/fmtc-merchants
 * 获取 FMTC 商户列表
 * 查询参数: page, limit, search, country, network, status, brandMatched
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const network = searchParams.get("network") || "";
    const status = searchParams.get("status") || "";
    const brandMatched = searchParams.get("brandMatched") || "";
    const activeStatus = searchParams.get("activeStatus") || ""; // 新增：商户活跃状态筛选

    const offset = (page - 1) * limit;

    // 构建查询条件
    const andConditions: Prisma.FMTCMerchantWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { homepage: { contains: search, mode: "insensitive" } },
          { primaryCategory: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (country) {
      andConditions.push({ country: country });
    }

    if (network) {
      andConditions.push({ network: network });
    }

    if (status) {
      andConditions.push({ status: status });
    }

    if (brandMatched === "matched") {
      andConditions.push({ brandId: { not: null } });
    } else if (brandMatched === "unmatched") {
      andConditions.push({ brandId: null });
    }

    // 添加活跃状态筛选
    if (activeStatus === "active") {
      andConditions.push({ isActive: true });
    } else if (activeStatus === "inactive") {
      andConditions.push({ isActive: false });
    }
    // 如果不指定activeStatus或为"all"，则显示所有商户

    const where: Prisma.FMTCMerchantWhereInput = {
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    // 获取商户列表
    const [merchants, totalCount] = await Promise.all([
      db.fMTCMerchant.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          networks: {
            select: {
              networkName: true,
              networkId: true,
              status: true,
            },
          },
        },
        orderBy: [{ lastScrapedAt: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      db.fMTCMerchant.count({ where }),
    ]);

    // 获取统计信息 - 包含所有商户状态
    const stats = await Promise.all([
      // 总商户数（包括活跃和禁用的）
      db.fMTCMerchant.count(),
      // 活跃商户数
      db.fMTCMerchant.count({ where: { isActive: true } }),
      // 禁用商户数
      db.fMTCMerchant.count({ where: { isActive: false } }),
      // 品牌匹配数（所有商户）
      db.fMTCMerchant.count({ where: { brandId: { not: null } } }),
      // 未匹配数（所有商户）
      db.fMTCMerchant.count({ where: { brandId: null } }),
      // 最近更新数（所有商户）
      db.fMTCMerchant.count({
        where: {
          lastScrapedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          totalMerchants: stats[0],
          activeMerchants: stats[1],
          inactiveMerchants: stats[2],
          brandMatched: stats[3],
          unmatched: stats[4],
          recentlyUpdated: stats[5],
        },
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants
 * 创建或更新商户信息
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { merchants, action = "create" } = body;

    if (!merchants || !Array.isArray(merchants)) {
      return NextResponse.json(
        { success: false, error: "商户数据格式不正确" },
        { status: 400 },
      );
    }

    if (action === "create") {
      // 批量创建商户
      const createdMerchants = [];
      const errors = [];

      for (const merchantData of merchants) {
        try {
          // 检查是否已存在
          const existing = await db.fMTCMerchant.findFirst({
            where: {
              name: merchantData.name,
              isActive: true,
            },
          });

          if (existing) {
            // 更新现有商户
            const updated = await db.fMTCMerchant.update({
              where: { id: existing.id },
              data: {
                ...merchantData,
                lastScrapedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            createdMerchants.push(updated);
          } else {
            // 创建新商户
            const created = await db.fMTCMerchant.create({
              data: {
                ...merchantData,
                lastScrapedAt: new Date(),
              },
            });

            createdMerchants.push(created);
          }
        } catch (error) {
          errors.push({
            merchantName: merchantData.name,
            error: error instanceof Error ? error.message : "创建失败",
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          created: createdMerchants.length,
          errors: errors.length,
          merchants: createdMerchants,
          errorDetails: errors,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的操作" },
      { status: 400 },
    );
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc-merchants
 * 批量更新商户信息
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, action, data } = body;

    // 改进的参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "商户ID列表不能为空" },
        { status: 400 },
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { success: false, error: "操作类型不能为空" },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "activate":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: { isActive: true },
        });
        break;

      case "deactivate":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false },
        });
        break;

      case "update_brand":
        if (!data?.brandId) {
          return NextResponse.json(
            { success: false, error: "品牌ID不能为空" },
            { status: 400 },
          );
        }
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: {
            brandId: data.brandId,
            brandMatchConfirmed: true,
            brandMatchConfidence: new Prisma.Decimal(1.0),
          },
        });
        break;

      case "remove_brand":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: {
            brandId: null,
            brandMatchConfirmed: false,
            brandMatchConfidence: null,
          },
        });
        break;

      case "batch_refresh_data": {
        // 使用新的高效批量抓取器

        // 获取FMTC配置
        const fmtcConfig = await db.fMTCScraperConfig.findFirst({
          where: { name: "default" },
        });

        if (!fmtcConfig) {
          return NextResponse.json(
            {
              success: false,
              error: "FMTC配置未找到，请先在设置中配置FMTC登录凭据",
            },
            { status: 400 },
          );
        }

        if (!fmtcConfig.defaultUsername || !fmtcConfig.defaultPassword) {
          return NextResponse.json(
            {
              success: false,
              error: "FMTC登录凭据未配置，请在设置中添加用户名和密码",
            },
            { status: 400 },
          );
        }

        // 批量获取商户信息
        const merchants = await db.fMTCMerchant.findMany({
          where: { id: { in: ids } },
        });

        if (merchants.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "未找到任何指定的商户",
            },
            { status: 400 },
          );
        }

        // 创建临时任务用于生成executionId
        const tempTask = await db.fMTCScraperTask.create({
          data: {
            name: `高效批量商户抓取_${new Date().toISOString()}`,
            description: "使用高效并发批量抓取器刷新商户数据",
            taskType: "DATA_REFRESH", // 设置为数据刷新任务类型
            credentials: {},
            config: {},
            isEnabled: false,
          },
        });

        const tempExecution = await db.fMTCScraperExecution.create({
          data: {
            taskId: tempTask.id,
            status: "RUNNING",
            startedAt: new Date(),
          },
        });

        // 准备批量抓取任务
        const merchantTasks = merchants
          .map((merchant) => {
            let merchantUrl = merchant.sourceUrl;

            // 如果没有sourceUrl，根据fmtcId构建标准URL
            if (!merchantUrl && merchant.fmtcId) {
              merchantUrl = `https://account.fmtc.co/cp/program_directory/details/m/${merchant.fmtcId}/${merchant.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
            }

            // URL标准化和修复
            if (merchantUrl) {
              // 修复已知的URL损坏问题
              if (merchantUrl.includes("program_dtails")) {
                merchantUrl = merchantUrl.replace(
                  "program_dtails",
                  "program_directory",
                );
              }

              // 确保URL格式正确（/details/m/ 格式）
              if (
                merchantUrl.includes("program_directory/m/") &&
                !merchantUrl.includes("program_directory/details/m/")
              ) {
                merchantUrl = merchantUrl.replace(
                  "program_directory/m/",
                  "program_directory/details/m/",
                );
              }
            }

            return {
              merchantId: merchant.id,
              merchantName: merchant.name,
              merchantUrl: merchantUrl || "",
            };
          })
          .filter((task) => task.merchantUrl); // 过滤掉没有URL的商户

        if (merchantTasks.length === 0) {
          await db.fMTCScraperExecution.update({
            where: { id: tempExecution.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              errorMessage: "所有商户都缺少抓取URL",
            },
          });

          return NextResponse.json(
            {
              success: false,
              error: "所有商户都缺少sourceUrl或FMTC ID，无法进行抓取",
            },
            { status: 400 },
          );
        }

        // 创建批量抓取选项（优化配置）
        const batchOptions: BatchScrapingOptions = {
          merchantTasks,
          credentials: {
            username: fmtcConfig.defaultUsername,
            password: fmtcConfig.defaultPassword,
          },
          concurrency: Math.min(3, merchantTasks.length), // 最多3个并发，提升速度
          downloadImages: false,
          captureScreenshot: true, // 启用FMTC页面截图
          screenshotUploadCallback: async (
            buffer: Buffer,
            filename: string,
          ) => {
            return await uploadImageToR2(buffer, filename);
          },
          executionId: tempExecution.id,
          config: {
            username: fmtcConfig.defaultUsername,
            password: fmtcConfig.defaultPassword,
            headlessMode: fmtcConfig.headlessMode ?? true,
            debugMode: fmtcConfig.debugMode ?? false,
            sessionTimeout: fmtcConfig.sessionTimeout ?? 30 * 60 * 1000,
            recaptchaMode: fmtcConfig.recaptchaMode || "manual",
            recaptchaManualTimeout: fmtcConfig.recaptchaManualTimeout || 60000,
            recaptchaAutoTimeout: fmtcConfig.recaptchaAutoTimeout || 30000,
            recaptchaRetryAttempts: fmtcConfig.recaptchaRetryAttempts || 3,
            recaptchaRetryDelay: fmtcConfig.recaptchaRetryDelay || 5000,
            twoCaptchaApiKey: fmtcConfig.twoCaptchaApiKey,
            twoCaptchaSoftId: fmtcConfig.twoCaptchaSoftId,
            twoCaptchaServerDomain: fmtcConfig.twoCaptchaServerDomain,
            twoCaptchaCallback: fmtcConfig.twoCaptchaCallback,
            // 批量模式：优化延迟配置
            searchEnableRandomDelay: true,
            searchMinDelay: 500, // 减少延迟提升速度
            searchMaxDelay: 1500, // 减少延迟提升速度
            searchEnableMouseMovement:
              fmtcConfig.searchEnableMouseMovement ?? true,
          },
          onTaskComplete: async (task: MerchantTask) => {
            if (task.result) {
              // 更新数据库中的商户信息
              const merchantData = task.result;

              await db.fMTCMerchant.update({
                where: { id: task.merchantId },
                data: {
                  name: merchantData.name || task.merchantName,
                  homepage: merchantData.homepage,
                  country: merchantData.country,
                  network: merchantData.network,
                  primaryCategory: merchantData.primaryCategory,
                  primaryCountry: merchantData.primaryCountry,
                  shipsTo: merchantData.shipsTo,
                  fmtcId: merchantData.fmtcId,
                  networkId: merchantData.networkId,
                  freshReachSupported:
                    merchantData.freshReachSupported || false,
                  logo120x60: merchantData.logo120x60,
                  logo88x31: merchantData.logo88x31,
                  screenshot280x210: merchantData.screenshot280x210,
                  screenshot600x450: merchantData.screenshot600x450,
                  fmtcPageScreenshotUrl: merchantData.fmtcPageScreenshotUrl,
                  fmtcPageScreenshotUploadedAt:
                    merchantData.fmtcPageScreenshotUploadedAt,
                  affiliateUrl: merchantData.affiliateUrl,
                  previewDealsUrl: merchantData.previewDealsUrl,
                  affiliateLinks:
                    merchantData.affiliateLinks as Prisma.JsonValue,
                  freshReachUrls: merchantData.freshReachUrls,
                  lastScrapedAt: new Date(),
                  updatedAt: new Date(),
                },
              });

              // 更新网络关联信息（如果有）
              if (merchantData.networks && merchantData.networks.length > 0) {
                // 先删除现有的网络关联
                await db.fMTCMerchantNetwork.deleteMany({
                  where: { merchantId: task.merchantId },
                });

                // 创建新的网络关联
                await db.fMTCMerchantNetwork.createMany({
                  data: merchantData.networks.map((network) => ({
                    merchantId: task.merchantId,
                    networkName: network.networkName,
                    networkId: network.networkId,
                    status: network.status,
                    isActive: true,
                  })),
                });
              }
            }
          },
        };

        // 立即返回executionId，并异步启动批量抓取
        result = {
          count: 0, // 初始值
          total: merchantTasks.length,
          completed: 0,
          failed: 0,
          executionId: tempExecution.id, // 立即返回executionId用于SSE连接
          message: "批量抓取已启动，请通过SSE连接监听实时进度",
        };

        // 异步启动批量抓取，不阻塞响应
        setImmediate(async () => {
          try {
            // 执行高效批量抓取
            const batchResult =
              await executeBatchMerchantScraping(batchOptions);

            // 更新execution状态
            await db.fMTCScraperExecution.update({
              where: { id: tempExecution.id },
              data: {
                status: batchResult.success ? "COMPLETED" : "PARTIAL",
                completedAt: new Date(),
                merchantsCount: batchResult.total,
                newMerchantsCount: 0,
                updatedMerchantsCount: batchResult.completed,
                errorMessage:
                  batchResult.failed > 0
                    ? `${batchResult.failed}个商户抓取失败: ${batchResult.failedTasks.map((t) => t.error).join("; ")}`
                    : undefined,
              },
            });
          } catch (error) {
            // 批量抓取失败，更新execution状态
            await db.fMTCScraperExecution.update({
              where: { id: tempExecution.id },
              data: {
                status: "FAILED",
                completedAt: new Date(),
                errorMessage:
                  error instanceof Error ? error.message : "批量抓取失败",
              },
            });
          }
        });

        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `不支持的操作: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        action,
        ...result, // 包含完整的result对象，包括executionId
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants
 * 批量删除商户
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "商户ID列表不能为空" },
        { status: 400 },
      );
    }

    // 真删除 - 从数据库中完全删除记录
    const result = await db.fMTCMerchant.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
