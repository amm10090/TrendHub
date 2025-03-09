'use client';

import { useRouter } from 'next/router';

// 这是一个简单的404页面，用于Next.js Pages Router结构
// 它被标记为客户端组件，避免在服务器端渲染时尝试使用客户端Context
export default function Custom404() {
  const router = useRouter();

  // 使用 Next.js router 进行导航
  const goToHome = () => {
    router.push('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <h1>404 - 页面未找到</h1>
      <p>抱歉，您请求的页面不存在。</p>
      <button
        onClick={goToHome}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        返回首页
      </button>
    </div>
  );
}
