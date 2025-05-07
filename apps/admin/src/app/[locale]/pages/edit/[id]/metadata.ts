import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db"; // 假设 db 实例的路径

// 动态生成 metadata
export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages" });

  // 可选：获取页面标题用于 metadata
  let pageTitle = t("editPage"); // 默认标题

  try {
    const page = await db.page.findUnique({
      where: { id },
      select: { title: true },
    });

    if (page && page.title) {
      pageTitle = page.title;
    }
  } catch {
    return;
  }

  return {
    title: `${t("editPage")} - ${pageTitle} | ${t("metadata.adminTitle")}`,
    description: t("metadata.editDescription", { pageTitle }), // 需要在语言文件中添加
  };
}
