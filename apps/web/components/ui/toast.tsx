'use client';

import { ToastProvider, addToast } from '@heroui/react';

// 导出Toast Provider组件
export function Toaster() {
  return (
    <ToastProvider
      placement="bottom-right"
      maxVisibleToasts={5}
      toastProps={{
        color: 'primary',
        variant: 'flat',
        timeout: 5000,
      }}
    />
  );
}

// 导出toast函数便于调用
export { addToast as toast };
