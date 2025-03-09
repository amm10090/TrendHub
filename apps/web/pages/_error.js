'use client';

import { useRouter } from 'next/router';

// 这是一个简单的错误页面，用于Next.js Pages Router结构
// 它被标记为客户端组件，避免在服务器端渲染时尝试使用客户端Context
function Error({ statusCode }) {
  const router = useRouter();

  // 使用 Next.js router 进行导航
  const goToHome = () => {
    router.push('/');
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>{statusCode ? `服务器返回了错误 ${statusCode}` : '客户端发生错误'}</h1>
      <p>抱歉，出现了错误。</p>
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
