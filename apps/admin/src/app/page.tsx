import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // 获取Accept-Language请求头
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // 检查Accept-Language头是否包含中文
  // 简体中文对应的语言代码可能是zh-CN、zh-Hans等
  const prefersChinese = acceptLanguage.includes("zh");

  // 根据首选语言重定向
  if (prefersChinese) {
    redirect("/cn");
  } else {
    redirect("/en");
  }
}
