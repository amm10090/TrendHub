import { redirect } from "next/navigation"; // 从 next/navigation 导入 redirect

import { auth } from "@/../auth"; // 导入 auth 函数
import { CustomNavbar } from "@/components/custom-navbar"; // 假设您的导航栏组件路径

// 定义子组件可能包含的属性
interface ChildrenProps {
  props?: {
    router?: {
      pathname?: string;
    };
  };
}

export default async function ProtectedLayout({
  children,
  params: { locale }, // 从 params 获取 locale
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth(); // 在服务端获取会话

  if (!session?.user) {
    // 此处重定向主要作为后备，核心重定向逻辑在 middleware 中
    const childrenProps = children as unknown as ChildrenProps;
    const pathname = childrenProps?.props?.router?.pathname || "/";
    const callbackUrl = encodeURIComponent(`/${locale}${pathname}`);

    redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar /> {/* 假设您的导航栏在这里 */}
      <main className="flex-1 p-4 md:p-8 pt-6">{children}</main>{" "}
      {/* 调整内边距以适应不同屏幕 */}
    </div>
  );
}
