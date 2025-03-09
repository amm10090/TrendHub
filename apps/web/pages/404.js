import Link from 'next/link';

// 这是一个简单的404页面，用于Next.js Pages Router结构
// 它被标记为客户端组件，避免在服务器端渲染时尝试使用客户端Context
export default function Custom404() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1 className="text-2xl font-bold mb-4">404 - 页面未找到</h1>
      <p className="text-gray-600 mb-8">抱歉，您请求的页面不存在。</p>
      <Link
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        href="/"
      >
        返回首页
      </Link>
    </div>
  );
}
