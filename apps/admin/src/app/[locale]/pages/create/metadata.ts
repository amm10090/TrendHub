import type { Metadata } from "next";
import { getTranslations } from "next-intl/server"; // 使用 server-side getTranslations

// export const metadata: Metadata = {
//   title: "Create New Page | E-commerce Aggregation Admin",
//   description: "Add a new page to your website",
// };

// 动态生成 metadata
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages" });

  return {
    title: `${t("createPage")} | ${t("metadata.adminTitle")}`,
    description: t("metadata.createDescription"), // 需要在语言文件中添加
  };
}
