"use client"; // 保持为客户端组件，如果将来有交互

import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard"); // 假设您的翻译文件中有 dashboard 命名空间

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p>{t("welcomeMessage")}</p>
      {/* 后续可以添加仪表盘的具体内容 */}
    </div>
  );
}
