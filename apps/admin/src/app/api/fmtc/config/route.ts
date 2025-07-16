import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

// FMTC配置验证模式
const FMTCConfigSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),

  // 基础配置
  defaultUsername: z.string().optional(),
  defaultPassword: z.string().optional(),
  maxPages: z.number().min(1).max(100).optional(),
  maxMerchants: z.number().min(1).max(10000).optional(),
  requestDelay: z.number().min(500).max(10000).optional(),
  enableImageDownload: z.boolean().optional(),
  headlessMode: z.boolean().optional(),
  debugMode: z.boolean().optional(),
  maxConcurrency: z.number().min(1).max(5).optional(),

  // reCAPTCHA配置
  recaptchaMode: z.enum(["manual", "auto", "skip"]).optional(),
  recaptchaManualTimeout: z.number().min(10000).max(300000).optional(),
  recaptchaAutoTimeout: z
    .number()
    .min(30000)
    .max(600000)
    .default(60000)
    .optional(),
  recaptchaRetryAttempts: z.number().min(1).max(10).optional(),
  recaptchaRetryDelay: z.number().min(1000).max(30000).optional(),

  // 2captcha配置
  twoCaptchaApiKey: z.string().optional(),
  twoCaptchaSoftId: z.number().optional(),
  twoCaptchaServerDomain: z.string().optional(),
  twoCaptchaCallback: z.string().optional(),

  // 搜索配置
  searchText: z.string().optional(),
  searchNetworkId: z.string().optional(),
  searchOpmProvider: z.string().optional(),
  searchCategory: z.string().optional(),
  searchCountry: z.string().optional(),
  searchShippingCountry: z.string().optional(),
  searchDisplayType: z.enum(["all", "accepting", "not_accepting"]).optional(),

  // 搜索行为配置
  searchEnableRandomDelay: z.boolean().optional(),
  searchMinDelay: z.number().min(0).max(10000).optional(),
  searchMaxDelay: z.number().min(0).max(30000).optional(),
  searchTypingDelayMin: z.number().min(0).max(1000).optional(),
  searchTypingDelayMax: z.number().min(0).max(2000).optional(),
  searchEnableMouseMovement: z.boolean().optional(),

  // 高级配置
  sessionTimeout: z.number().min(60000).max(7200000).optional(),
  maxConsecutiveErrors: z.number().min(1).max(20).optional(),
  errorCooldownPeriod: z.number().min(1000).max(120000).optional(),

  isEnabled: z.boolean().optional(),
});

/**
 * 获取FMTC配置
 */
export async function GET() {
  try {
    // 查找默认配置，如果不存在则创建
    let config = await db.fMTCScraperConfig.findFirst({
      where: { name: "default" },
    });

    if (!config) {
      // 创建默认配置
      config = await db.fMTCScraperConfig.create({
        data: {
          name: "default",
          description: "默认FMTC爬虫配置",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("获取FMTC配置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get FMTC configuration",
      },
      { status: 500 },
    );
  }
}

/**
 * 更新FMTC配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求数据
    const validationResult = FMTCConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid configuration data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const configData = validationResult.data;

    // 查找或创建默认配置
    let config = await db.fMTCScraperConfig.findFirst({
      where: { name: "default" },
    });

    if (!config) {
      // 创建默认配置
      config = await db.fMTCScraperConfig.create({
        data: {
          name: "default",
          description: "默认FMTC爬虫配置",
          ...configData,
        },
      });
    } else {
      // 更新现有配置
      config = await db.fMTCScraperConfig.update({
        where: { id: config.id },
        data: {
          ...configData,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "FMTC配置更新成功",
      data: config,
    });
  } catch (error) {
    console.error("更新FMTC配置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update FMTC configuration",
      },
      { status: 500 },
    );
  }
}

/**
 * 重置FMTC配置为默认值
 */
export async function DELETE() {
  try {
    // 删除现有的默认配置
    await db.fMTCScraperConfig.deleteMany({
      where: { name: "default" },
    });

    // 创建新的默认配置
    const config = await db.fMTCScraperConfig.create({
      data: {
        name: "default",
        description: "默认FMTC爬虫配置",
      },
    });

    return NextResponse.json({
      success: true,
      message: "FMTC配置已重置为默认值",
      data: config,
    });
  } catch (error) {
    console.error("重置FMTC配置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset FMTC configuration",
      },
      { status: 500 },
    );
  }
}
