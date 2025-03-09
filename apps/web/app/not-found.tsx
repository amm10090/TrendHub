import Link from 'next/link';

export const metadata = {
  title: '404 - 页面未找到',
  description: '抱歉，您请求的页面不存在。',
};

// 这是一个简单的404页面，用于Next.js Pages Router结构
// 它被标记为客户端组件，避免在服务器端渲染时尝试使用客户端Context
export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)]">
      <h1 className="text-4xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">
        404
      </h1>
      <h2 className="text-2xl font-medium mb-8 text-text-secondary-light dark:text-text-secondary-dark">
        页面未找到
      </h2>
      <p className="text-text-tertiary-light dark:text-text-tertiary-dark mb-8">
        抱歉，您请求的页面不存在。
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
