import Link from "next/link";

export const metadata = {
  title: "404 - 页面未找到",
  description: "抱歉，您请求的页面不存在。",
};

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)]">
      <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
      <h2 className="text-2xl font-medium mb-8 text-muted-foreground">
        页面未找到
      </h2>
      <p className="text-muted-foreground mb-8">
        抱歉，您请求的管理页面不存在。
      </p>
      <Link
        href="/en"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        返回管理面板
      </Link>
    </div>
  );
}
