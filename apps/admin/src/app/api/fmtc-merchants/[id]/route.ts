import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";

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
  } catch (error) {
    console.error("FMTC Merchant Detail Error:", error);

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
  } catch (error) {
    console.error("FMTC Merchant Update Error:", error);

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
  } catch (error) {
    console.error("FMTC Merchant Delete Error:", error);

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
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
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
        // 这里可以集成爬虫服务来重新抓取数据
        result = await db.fMTCMerchant.update({
          where: { id },
          data: { lastScrapedAt: new Date() },
        });
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
  } catch (error) {
    console.error("FMTC Merchant Action Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
