import 'react';

// 扩展 React 的类型定义，解决 React 18.3.1 和 Next.js 15.2.2 的类型冲突
declare module 'react' {
  // 确保 ReactNode 类型兼容
  interface ReactPortal {
    children?: ReactNode;
  }
}
