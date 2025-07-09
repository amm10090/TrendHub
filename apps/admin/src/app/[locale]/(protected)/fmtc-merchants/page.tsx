"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FMTCMerchantsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到 Discount Management 页面的 FMTC 标签页
    router.replace("/discounts?tab=fmtc-merchants");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">正在重定向...</h2>
        <p className="text-muted-foreground">
          FMTC 商户管理已整合到折扣管理页面中
        </p>
      </div>
    </div>
  );
}
