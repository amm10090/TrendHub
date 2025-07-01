import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - 获取单个折扣详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const discount = await db.discount.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            website: true,
          },
        },
      },
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, error: "折扣不存在" },
        { status: 404 },
      );
    }

    // 检查是否过期
    const isExpired = discount.endDate ? discount.endDate < new Date() : false;

    // 如果过期状态不匹配，更新数据库
    if (isExpired !== discount.isExpired) {
      await db.discount.update({
        where: { id },
        data: { isExpired },
      });
      discount.isExpired = isExpired;
    }

    return NextResponse.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "获取折扣详情失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - 更新单个折扣
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      merchantName,
      title,
      code,
      type,
      value,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      rating,
      dealStatus,
      brandId,
      isActive,
    } = body;

    // 验证折扣是否存在
    const existingDiscount = await db.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { success: false, error: "折扣不存在" },
        { status: 404 },
      );
    }

    // 数据验证
    if (merchantName !== undefined && !merchantName?.trim()) {
      return NextResponse.json(
        { success: false, error: "商家名称不能为空" },
        { status: 400 },
      );
    }

    if (title !== undefined && !title?.trim()) {
      return NextResponse.json(
        { success: false, error: "折扣标题不能为空" },
        { status: 400 },
      );
    }

    // 如果更新折扣码，检查重复
    if (code && code !== existingDiscount.code) {
      const duplicateDiscount = await db.discount.findFirst({
        where: {
          code,
          merchantName: merchantName || existingDiscount.merchantName,
          isActive: true,
          NOT: { id },
        },
      });

      if (duplicateDiscount) {
        return NextResponse.json(
          { success: false, error: "该商家的折扣码已存在" },
          { status: 409 },
        );
      }
    }

    // 准备更新数据
    const updateData: Record<string, unknown> = {};

    if (merchantName !== undefined) updateData.merchantName = merchantName;
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code || null;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined)
      updateData.value = value ? parseFloat(value) : null;
    if (minAmount !== undefined)
      updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (maxAmount !== undefined)
      updateData.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
      updateData.isExpired = endDate ? new Date(endDate) < new Date() : false;
    }
    if (rating !== undefined)
      updateData.rating = rating ? parseFloat(rating) : null;
    if (dealStatus !== undefined) updateData.dealStatus = dealStatus;
    if (brandId !== undefined) updateData.brandId = brandId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // 更新折扣
    const updatedDiscount = await db.discount.update({
      where: { id },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            website: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDiscount,
      message: "折扣更新成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "更新折扣失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - 删除单个折扣
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // 验证折扣是否存在
    const existingDiscount = await db.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { success: false, error: "折扣不存在" },
        { status: 404 },
      );
    }

    // 删除折扣
    await db.discount.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "折扣删除成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "删除折扣失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PATCH - 更新折扣使用统计
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (action === "increment_use") {
      const discount = await db.discount.update({
        where: { id },
        data: {
          useCount: {
            increment: 1,
          },
        },
      });

      // 检查是否达到最大使用次数
      if (discount.maxUses && discount.useCount >= discount.maxUses) {
        await db.discount.update({
          where: { id },
          data: { isActive: false },
        });
      }

      return NextResponse.json({
        success: true,
        data: { useCount: discount.useCount },
        message: "使用统计更新成功",
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的操作类型" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "更新统计失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
