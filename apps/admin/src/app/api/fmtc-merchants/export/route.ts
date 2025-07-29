import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";

// 字段映射和翻译
const getFieldHeaders = (locale: string) => {
  const headers = {
    en: {
      id: "ID",
      name: "Merchant Name",
      country: "Country",
      network: "Network Platform",
      homepage: "Homepage",
      primaryCategory: "Primary Category",
      primaryCountry: "Primary Country",
      fmtcId: "FMTC ID",
      networkId: "Network ID",
      status: "Status",
      isActive: "Active Status",
      brandId: "Brand ID",
      brandName: "Brand Name",
      brandMatchConfirmed: "Brand Match Confirmed",
      brandMatchConfidence: "Brand Match Confidence",
      freshReachSupported: "FreshReach Supported",
      shipsTo: "Ships To",
      logo120x60: "Logo URL",
      premiumSubscriptions: "Premium Subscriptions",
      dateAdded: "Date Added",
      lastScrapedAt: "Last Scraped",
      createdAt: "Created At",
      updatedAt: "Updated At",
      networkCount: "Network Count",
      affiliateLinksCount: "Affiliate Links Count",
      freshReachUrlsCount: "FreshReach URLs Count",
    },
    cn: {
      id: "ID",
      name: "商户名称",
      country: "国家",
      network: "网络平台",
      homepage: "官方网站",
      primaryCategory: "主要分类",
      primaryCountry: "主要国家",
      fmtcId: "FMTC ID",
      networkId: "网络ID",
      status: "状态",
      isActive: "活跃状态",
      brandId: "品牌ID",
      brandName: "品牌名称",
      brandMatchConfirmed: "品牌匹配确认",
      brandMatchConfidence: "品牌匹配置信度",
      freshReachSupported: "支持FreshReach",
      shipsTo: "配送地区",
      logo120x60: "Logo链接",
      premiumSubscriptions: "高级订阅数",
      dateAdded: "添加日期",
      lastScrapedAt: "最后抓取时间",
      createdAt: "创建时间",
      updatedAt: "更新时间",
      networkCount: "网络关联数",
      affiliateLinksCount: "联盟链接数",
      freshReachUrlsCount: "FreshReach链接数",
    },
  };

  return headers[locale as keyof typeof headers] || headers.en;
};

// 转换数据为导出格式
const transformMerchantData = (
  merchant: Record<string, unknown>,
  headers: Record<string, string>,
) => {
  return {
    [headers.id]: merchant.id,
    [headers.name]: merchant.name,
    [headers.country]: merchant.country || "",
    [headers.network]: merchant.network || "",
    [headers.homepage]: merchant.homepage || "",
    [headers.primaryCategory]: merchant.primaryCategory || "",
    [headers.primaryCountry]: merchant.primaryCountry || "",
    [headers.fmtcId]: merchant.fmtcId || "",
    [headers.networkId]: merchant.networkId || "",
    [headers.status]: merchant.status || "",
    [headers.isActive]: merchant.isActive ? "Active" : "Inactive",
    [headers.brandId]: merchant.brandId || "",
    [headers.brandName]: merchant.brand?.name || "",
    [headers.brandMatchConfirmed]: merchant.brandMatchConfirmed ? "Yes" : "No",
    [headers.brandMatchConfidence]: merchant.brandMatchConfidence || "",
    [headers.freshReachSupported]: merchant.freshReachSupported ? "Yes" : "No",
    [headers.shipsTo]: Array.isArray(merchant.shipsTo)
      ? merchant.shipsTo.join(", ")
      : "",
    [headers.logo120x60]: merchant.logo120x60 || "",
    [headers.premiumSubscriptions]: merchant.premiumSubscriptions || 0,
    [headers.dateAdded]: merchant.dateAdded
      ? new Date(merchant.dateAdded).toISOString()
      : "",
    [headers.lastScrapedAt]: merchant.lastScrapedAt
      ? new Date(merchant.lastScrapedAt).toISOString()
      : "",
    [headers.createdAt]: new Date(merchant.createdAt).toISOString(),
    [headers.updatedAt]: new Date(merchant.updatedAt).toISOString(),
    [headers.networkCount]: merchant.networks?.length || 0,
    [headers.affiliateLinksCount]: merchant.affiliateLinks
      ? Object.keys(merchant.affiliateLinks).length
      : 0,
    [headers.freshReachUrlsCount]: merchant.freshReachUrls?.length || 0,
  };
};

// 生成CSV格式
const generateCSV = (
  data: Record<string, unknown>[],
  headers: Record<string, string>,
) => {
  if (data.length === 0) return "";

  const csvHeaders = Object.values(headers).join(",");
  const csvRows = data.map((row) =>
    Object.values(row)
      .map((value) =>
        typeof value === "string" && value.includes(",")
          ? `"${value.replace(/"/g, '""')}"`
          : value,
      )
      .join(","),
  );

  return [csvHeaders, ...csvRows].join("\n");
};

// 生成Excel格式 (简化为TSV)
const generateExcel = (
  data: Record<string, unknown>[],
  headers: Record<string, string>,
) => {
  if (data.length === 0) return "";

  const tsvHeaders = Object.values(headers).join("\t");
  const tsvRows = data.map((row) =>
    Object.values(row)
      .map((value) =>
        typeof value === "string" ? value.replace(/\t/g, " ") : value,
      )
      .join("\t"),
  );

  return [tsvHeaders, ...tsvRows].join("\n");
};

/**
 * GET /api/fmtc-merchants/export
 * 导出FMTC商户数据
 * 查询参数: format (csv|excel|json), locale (en|cn), 以及所有筛选参数
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // 导出参数
    const format = searchParams.get("format") || "csv";
    const locale = searchParams.get("locale") || "en";

    // 筛选参数
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const network = searchParams.get("network") || "";
    const status = searchParams.get("status") || "";
    const brandMatched = searchParams.get("brandMatched") || "";
    const activeStatus = searchParams.get("activeStatus") || "";

    // 构建查询条件 (与主API相同的逻辑)
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

    // 活跃状态筛选
    if (activeStatus === "active") {
      andConditions.push({ isActive: true });
    } else if (activeStatus === "inactive") {
      andConditions.push({ isActive: false });
    }

    const where: Prisma.FMTCMerchantWhereInput = {
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    // 首先获取总数，避免意外导出过量数据
    const totalCount = await db.fMTCMerchant.count({ where });

    // 设置最大导出限制
    const MAX_EXPORT_LIMIT = 10000;
    const limit = searchParams.get("limit");
    const actualLimit = limit
      ? Math.min(parseInt(limit), MAX_EXPORT_LIMIT)
      : MAX_EXPORT_LIMIT;

    if (totalCount > actualLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `数据量过大（${totalCount} 条记录）。最大支持导出 ${actualLimit} 条记录。请使用筛选条件缩小范围或联系管理员。`,
          totalCount,
          maxLimit: actualLimit,
        },
        { status: 400 },
      );
    }

    // 获取匹配的商户数据
    const merchants = await db.fMTCMerchant.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
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
      take: actualLimit,
    });

    // 获取字段标题
    const headers = getFieldHeaders(locale);

    // 转换数据
    const transformedData = merchants.map((merchant) =>
      transformMerchantData(merchant, headers),
    );

    // 生成文件名
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:]/g, "")
      .replace(/-/g, "");
    const filename = `fmtc-merchants-${timestamp}`;

    // 根据格式返回数据
    switch (format.toLowerCase()) {
      case "csv": {
        const csvContent = generateCSV(transformedData, headers);

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}.csv"`,
          },
        });
      }

      case "excel": {
        const excelContent = generateExcel(transformedData, headers);

        return new NextResponse(excelContent, {
          headers: {
            "Content-Type": "application/vnd.ms-excel; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}.xls"`,
          },
        });
      }

      case "json": {
        const jsonContent = JSON.stringify(
          {
            exportInfo: {
              timestamp: new Date().toISOString(),
              locale,
              totalRecords: transformedData.length,
              filters: {
                search,
                country,
                network,
                status,
                brandMatched,
                activeStatus,
              },
            },
            data: transformedData,
          },
          null,
          2,
        );

        return new NextResponse(jsonContent, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}.json"`,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "不支持的导出格式。支持的格式：csv, excel, json",
          },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
