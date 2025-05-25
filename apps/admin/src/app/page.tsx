import { redirect } from "next/navigation";

export default async function RootPage() {
  // 直接重定向到默认语言页面
  redirect("/en");
}
