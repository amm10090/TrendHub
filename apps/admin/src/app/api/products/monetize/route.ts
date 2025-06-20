import { NextResponse, NextRequest } from "next/server";

import { db } from "@/lib/db";
import { monetizeUrlsBatch } from "@/lib/services/sovrn.service";

/**
 * 检测URL是否被双重编码
 */
function isDoubleEncodedUrl(url: string): boolean {
  return (
    url.includes("%25") && (url.includes("%253A") || url.includes("%252F"))
  );
}

/**
 * 批量为现有商品生成货币化URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, batchSize = 50, fixDoubleEncoded = false } = body;

    // 构建基础查询条件
    const baseWhere = {
      isDeleted: false,
      url: { not: null },
    };

    // 根据模式添加特定条件
    const whereClause = {
      ...baseWhere,
      ...(fixDoubleEncoded
        ? { adurl: { not: null } } // 修复模式：处理有问题的货币化URL
        : { adurl: null }), // 正常模式：只处理还没有货币化URL的商品
      ...(productIds && Array.isArray(productIds) && productIds.length > 0
        ? { id: { in: productIds } }
        : {}),
    };

    // 获取需要处理的商品
    const products = await db.product.findMany({
      where: whereClause,
      select: {
        id: true,
        url: true,
        adurl: true,
        source: true,
        name: true,
      },
      take: batchSize,
    });

    if (products.length === 0) {
      return NextResponse.json({
        message: fixDoubleEncoded
          ? "没有找到需要修复的商品"
          : "没有找到需要处理的商品",
        processed: 0,
        total: 0,
      });
    }

    let urlsToProcess: string[] = [];
    let productsToUpdate: typeof products = [];

    if (fixDoubleEncoded) {
      // 修复模式：检查现有的adurl是否有双重编码问题
      products.forEach((product) => {
        if (product.adurl && isDoubleEncodedUrl(product.adurl)) {
          // 提取原始URL并重新处理
          if (product.url) {
            urlsToProcess.push(product.url);
            productsToUpdate.push(product);
          }
        }
      });

      if (urlsToProcess.length === 0) {
        return NextResponse.json({
          message: "没有找到需要修复双重编码的URL",
          processed: 0,
          total: products.length,
        });
      }
    } else {
      // 正常模式：处理没有货币化URL的商品
      urlsToProcess = products.filter((p) => p.url).map((p) => p.url as string);
      productsToUpdate = products.filter((p) => p.url);
    }

    // 批量生成货币化URL
    const monetizationResults = await monetizeUrlsBatch(urlsToProcess, {
      utm_source: "trendhub",
      utm_medium: fixDoubleEncoded ? "fix_double_encoded" : "batch_update",
      utm_campaign: fixDoubleEncoded ? "url_fix" : "existing_products",
    });

    // 更新数据库
    const updatePromises = productsToUpdate.map(async (product) => {
      if (!product.url) return { success: false, error: "No URL" };

      const result = monetizationResults.get(product.url);

      if (result?.success && result.monetizedUrl) {
        try {
          await db.product.update({
            where: { id: product.id },
            data: { adurl: result.monetizedUrl },
          });

          return {
            success: true,
            productId: product.id,
            url: product.url,
            oldAdurl: product.adurl,
            newAdurl: result.monetizedUrl,
            wasDoubleEncoded:
              fixDoubleEncoded && product.adurl
                ? isDoubleEncodedUrl(product.adurl)
                : false,
          };
        } catch (error) {
          return {
            success: false,
            productId: product.id,
            error: error instanceof Error ? error.message : "Update failed",
          };
        }
      } else {
        return {
          success: false,
          productId: product.id,
          error: result?.error || "Monetization failed",
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const message = fixDoubleEncoded
      ? `修复完成：${successful.length} 个URL修复成功，${failed.length} 个失败`
      : `处理完成：${successful.length} 个成功，${failed.length} 个失败`;

    return NextResponse.json({
      message,
      processed: results.length,
      successful: successful.length,
      failed: failed.length,
      mode: fixDoubleEncoded ? "fix_double_encoded" : "normal",
      results: {
        successful,
        failed,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `批量货币化处理失败: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

/**
 * 获取货币化统计信息
 */
export async function GET() {
  try {
    const stats = await db.product.groupBy({
      by: ["source"],
      where: {
        isDeleted: false,
        url: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const monetizedStats = await db.product.groupBy({
      by: ["source"],
      where: {
        isDeleted: false,
        url: { not: null },
        adurl: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const totalProducts = await db.product.count({
      where: {
        isDeleted: false,
        url: { not: null },
      },
    });

    const totalMonetized = await db.product.count({
      where: {
        isDeleted: false,
        url: { not: null },
        adurl: { not: null },
      },
    });

    // 检查双重编码的URL数量
    const productsWithAdurl = await db.product.findMany({
      where: {
        isDeleted: false,
        adurl: { not: null },
      },
      select: {
        id: true,
        adurl: true,
      },
    });

    const doubleEncodedCount = productsWithAdurl.filter(
      (p) => p.adurl && isDoubleEncodedUrl(p.adurl),
    ).length;

    const sourceStats = stats.map((stat) => {
      const monetized =
        monetizedStats.find((m) => m.source === stat.source)?._count.id || 0;

      return {
        source: stat.source,
        total: stat._count.id,
        monetized,
        pending: stat._count.id - monetized,
        percentage:
          stat._count.id > 0
            ? Math.round((monetized / stat._count.id) * 100)
            : 0,
      };
    });

    return NextResponse.json({
      overview: {
        totalProducts,
        totalMonetized,
        totalPending: totalProducts - totalMonetized,
        overallPercentage:
          totalProducts > 0
            ? Math.round((totalMonetized / totalProducts) * 100)
            : 0,
        doubleEncodedUrls: doubleEncodedCount,
      },
      bySource: sourceStats,
      issues: {
        doubleEncodedUrls: doubleEncodedCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `获取统计信息失败: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
