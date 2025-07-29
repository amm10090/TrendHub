import { Prisma } from "@prisma/client";
import { scrapeSingleFMTCMerchant } from "@repo/scraper/src/sites/fmtc";
import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

import { auth } from "@/../auth";
import { db } from "@/lib/db";
import { uploadImageToR2 } from "@/lib/imageService";

/**
 * GET /api/fmtc-merchants/[id]
 * 获取单个商户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const merchant = await db.fMTCMerchant.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
          },
        },
        networks: {
          select: {
            id: true,
            networkName: true,
            networkId: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "商户不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: merchant,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc-merchants/[id]
 * 更新单个商户信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 验证商户是否存在
    const existingMerchant = await db.fMTCMerchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { success: false, error: "商户不存在" },
        { status: 404 },
      );
    }

    // 更新商户信息
    const updatedMerchant = await db.fMTCMerchant.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
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
            id: true,
            networkName: true,
            networkId: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMerchant,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants/[id]
 * 删除单个商户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 验证商户是否存在
    const existingMerchant = await db.fMTCMerchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { success: false, error: "商户不存在" },
        { status: 404 },
      );
    }

    // 真删除 - 从数据库中完全删除记录
    await db.fMTCMerchant.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: "商户已删除" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants/[id]
 * 执行商户特定操作
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    // 验证商户是否存在
    const existingMerchant = await db.fMTCMerchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { success: false, error: "商户不存在" },
        { status: 404 },
      );
    }

    let result;

    switch (action) {
      case "refresh_data":
        // 触发重新抓取商户数据
        try {
          // 获取FMTC配置以获取登录凭据
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

          // 优先使用数据库中的sourceUrl，如果没有则通过fmtcId构建
          const merchantUrl =
            existingMerchant.sourceUrl ||
            (existingMerchant.fmtcId
              ? `https://account.fmtc.co/cp/program_directory/m/${existingMerchant.fmtcId}/`
              : undefined);

          if (!merchantUrl) {
            return NextResponse.json(
              {
                success: false,
                error: "无法获取商户详情URL，缺少sourceUrl和FMTC ID",
              },
              { status: 400 },
            );
          }

          // 创建一个临时task和execution以获取有效的CUID executionId
          const tempTask = await db.fMTCScraperTask.create({
            data: {
              name: `单商户抓取_${new Date().toISOString()}`,
              description: "临时任务用于生成executionId",
              taskType: "DATA_REFRESH", // 设置为数据刷新任务类型
              credentials: {},
              config: {},
              isEnabled: false,
            },
          });

          const tempExecution = await db.fMTCScraperExecution.create({
            data: {
              taskId: tempTask.id,
              status: "QUEUED",
              startedAt: new Date(),
            },
          });

          // 保存executionId，保留临时记录用于日志系统
          const executionId = tempExecution.id;

          // 执行单商户抓取
          const scrapingResult = await scrapeSingleFMTCMerchant({
            merchantUrl: merchantUrl,
            merchantId: existingMerchant.fmtcId || undefined,
            merchantName: existingMerchant.name,
            credentials: {
              username: fmtcConfig.defaultUsername,
              password: fmtcConfig.defaultPassword,
            },
            downloadImages: false, // 单独抓取不下载图片
            captureScreenshot: true, // 启用FMTC页面截图
            screenshotUploadCallback: async (
              buffer: Buffer,
              filename: string,
            ) => {
              return await uploadImageToR2(buffer, filename);
            },
            executionId: executionId,
            config: {
              username: fmtcConfig.defaultUsername,
              password: fmtcConfig.defaultPassword,
              headlessMode: fmtcConfig.headlessMode ?? true,
              debugMode: fmtcConfig.debugMode ?? false,
              sessionTimeout: fmtcConfig.sessionTimeout ?? 30 * 60 * 1000,

              // reCAPTCHA 配置
              recaptchaMode: fmtcConfig.recaptchaMode || "manual",
              recaptchaManualTimeout:
                fmtcConfig.recaptchaManualTimeout || 60000,
              recaptchaAutoTimeout: fmtcConfig.recaptchaAutoTimeout || 30000,
              recaptchaRetryAttempts: fmtcConfig.recaptchaRetryAttempts || 3,
              recaptchaRetryDelay: fmtcConfig.recaptchaRetryDelay || 5000,

              // 2captcha 配置
              twoCaptchaApiKey: fmtcConfig.twoCaptchaApiKey,
              twoCaptchaSoftId: fmtcConfig.twoCaptchaSoftId,
              twoCaptchaServerDomain: fmtcConfig.twoCaptchaServerDomain,
              twoCaptchaCallback: fmtcConfig.twoCaptchaCallback,

              // 搜索行为配置
              searchEnableRandomDelay:
                fmtcConfig.searchEnableRandomDelay ?? true,
              searchMinDelay: fmtcConfig.searchMinDelay ?? 1000,
              searchMaxDelay: fmtcConfig.searchMaxDelay ?? 3000,
              searchEnableMouseMovement:
                fmtcConfig.searchEnableMouseMovement ?? true,
            },
          });

          if (!scrapingResult.success) {
            // 更新execution状态为失败
            await db.fMTCScraperExecution.update({
              where: { id: executionId },
              data: {
                status: "FAILED",
                completedAt: new Date(),
                errorMessage: scrapingResult.error,
              },
            });

            return NextResponse.json(
              {
                success: false,
                error: `商户抓取失败: ${scrapingResult.error}`,
                logs: scrapingResult.logs,
              },
              { status: 500 },
            );
          }

          // 更新数据库中的商户信息
          const merchantData = scrapingResult.merchantData!;
          const updatedMerchant = await db.fMTCMerchant.update({
            where: { id },
            data: {
              name: merchantData.name || existingMerchant.name,
              homepage: merchantData.homepage,
              country: merchantData.country,
              network: merchantData.network,
              primaryCategory: merchantData.primaryCategory,
              primaryCountry: merchantData.primaryCountry,
              shipsTo: merchantData.shipsTo,
              fmtcId: merchantData.fmtcId || existingMerchant.fmtcId,
              networkId: merchantData.networkId,
              freshReachSupported: merchantData.freshReachSupported || false,
              logo120x60: merchantData.logo120x60,
              logo88x31: merchantData.logo88x31,
              screenshot280x210: merchantData.screenshot280x210,
              screenshot600x450: merchantData.screenshot600x450,
              fmtcPageScreenshotUrl: merchantData.fmtcPageScreenshotUrl,
              fmtcPageScreenshotUploadedAt:
                merchantData.fmtcPageScreenshotUploadedAt,
              affiliateUrl: merchantData.affiliateUrl,
              previewDealsUrl: merchantData.previewDealsUrl,
              affiliateLinks: merchantData.affiliateLinks as Prisma.JsonValue,
              freshReachUrls: merchantData.freshReachUrls,
              lastScrapedAt: new Date(),
              updatedAt: new Date(),
            },
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
                  id: true,
                  networkName: true,
                  networkId: true,
                  status: true,
                  isActive: true,
                },
              },
            },
          });

          // 更新网络关联信息（如果有）
          if (merchantData.networks && merchantData.networks.length > 0) {
            // 先删除现有的网络关联
            await db.fMTCMerchantNetwork.deleteMany({
              where: { merchantId: id },
            });

            // 创建新的网络关联
            await db.fMTCMerchantNetwork.createMany({
              data: merchantData.networks.map((network) => ({
                merchantId: id,
                networkName: network.networkName,
                networkId: network.networkId,
                status: network.status,
                isActive: true,
              })),
            });
          }

          // 更新execution状态为成功
          await db.fMTCScraperExecution.update({
            where: { id: executionId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              merchantsCount: 1,
              newMerchantsCount: 0,
              updatedMerchantsCount: 1,
            },
          });

          result = {
            ...updatedMerchant,
            scrapingInfo: {
              success: true,
              scrapedAt: scrapingResult.scrapedAt,
              processingTime: scrapingResult.processingTime,
              merchantUrl: scrapingResult.merchantUrl,
            },
          };
        } catch {
          // 至少更新lastScrapedAt字段，表示尝试过抓取
          result = await db.fMTCMerchant.update({
            where: { id },
            data: {
              lastScrapedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          return NextResponse.json(
            {
              success: false,
              error: `商户数据刷新失败: ${(error as Error).message}`,
              data: result,
            },
            { status: 500 },
          );
        }
        break;

      case "confirm_brand_match":
        if (!data?.brandId) {
          return NextResponse.json(
            { success: false, error: "品牌ID不能为空" },
            { status: 400 },
          );
        }
        result = await db.fMTCMerchant.update({
          where: { id },
          data: {
            brandId: data.brandId,
            brandMatchConfirmed: true,
            brandMatchConfidence: new Prisma.Decimal(1.0),
          },
        });
        break;

      case "reject_brand_match":
        result = await db.fMTCMerchant.update({
          where: { id },
          data: {
            brandId: null,
            brandMatchConfirmed: false,
            brandMatchConfidence: null,
          },
        });
        break;

      case "update_networks":
        if (!data?.networks || !Array.isArray(data.networks)) {
          return NextResponse.json(
            { success: false, error: "网络数据格式不正确" },
            { status: 400 },
          );
        }

        // 删除现有网络关联
        await db.fMTCMerchantNetwork.deleteMany({
          where: { merchantId: id },
        });

        // 创建新的网络关联
        if (data.networks.length > 0) {
          await db.fMTCMerchantNetwork.createMany({
            data: data.networks.map(
              (network: {
                networkName: string;
                networkId?: string;
                status: string;
                isActive?: boolean;
              }) => ({
                merchantId: id,
                networkName: network.networkName,
                networkId: network.networkId,
                status: network.status,
                isActive: network.isActive !== false,
              }),
            ),
          });
        }

        result = await db.fMTCMerchant.findUnique({
          where: { id },
          include: {
            networks: true,
          },
        });
        break;

      case "capture_screenshot":
        try {
          // 获取FMTC配置以获取登录凭据
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

          // 构建商户详情页面URL
          const merchantUrl =
            existingMerchant.sourceUrl ||
            (existingMerchant.fmtcId
              ? `https://account.fmtc.co/cp/program_directory/m/${existingMerchant.fmtcId}/`
              : undefined);

          if (!merchantUrl) {
            return NextResponse.json(
              {
                success: false,
                error: "无法获取商户详情URL，缺少sourceUrl和FMTC ID",
              },
              { status: 400 },
            );
          }

          // 启动浏览器并截图
          const browser = await chromium.launch({
            headless: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-accelerated-2d-canvas",
              "--no-first-run",
              "--no-zygote",
              "--disable-gpu",
            ],
          });

          const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          });

          const page = await context.newPage();

          try {
            // 首先登录FMTC
            await page.goto("https://account.fmtc.co/cp/login", {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });

            // 填写登录表单
            await page.fill('input[name="email"]', fmtcConfig.defaultUsername);
            await page.fill(
              'input[name="password"]',
              fmtcConfig.defaultPassword,
            );

            // 点击登录按钮
            await page.click('button[type="submit"]');

            // 等待登录完成
            await page.waitForURL("**/cp/dash**", { timeout: 30000 });

            // 导航到商户详情页面
            await page.goto(merchantUrl, {
              waitUntil: "networkidle",
              timeout: 30000,
            });

            // 等待页面加载完成
            await page.waitForTimeout(3000);

            // 截取全页面截图
            const screenshotBuffer = await page.screenshot({
              fullPage: true,
              type: "png",
            });

            // 上传截图到R2
            const filename = `fmtc-page-${existingMerchant.id}-${Date.now()}.png`;
            const screenshotUrl = await uploadImageToR2(
              screenshotBuffer,
              filename,
            );

            // 更新数据库中的截图信息
            result = await db.fMTCMerchant.update({
              where: { id },
              data: {
                fmtcPageScreenshotUrl: screenshotUrl,
                fmtcPageScreenshotUploadedAt: new Date(),
                updatedAt: new Date(),
              },
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                    description: true,
                  },
                },
                networks: {
                  select: {
                    id: true,
                    networkName: true,
                    networkId: true,
                    status: true,
                    isActive: true,
                  },
                },
              },
            });
          } finally {
            await page.close();
            await context.close();
            await browser.close();
          }
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: `FMTC页面截图失败: ${(error as Error).message}`,
            },
            { status: 500 },
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
