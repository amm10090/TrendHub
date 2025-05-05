'use client';

import { CodeSnippet } from '@repo/types'; // 从共享包导入类型
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

// 定义 Context 状态的接口
interface SettingsContextState {
  settings: Record<string, string>; // 网站设置键值对
  snippets: CodeSnippet[]; // 代码片段数组
  isLoading: boolean; // 添加加载状态
}

// 创建 Context，并提供默认值
const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

// 创建 Provider 组件
interface SettingsProviderProps {
  children: ReactNode;
  initialSettings: Record<string, string>; // 通过 prop 接收初始设置
  initialSnippets: CodeSnippet[]; // 通过 prop 接收初始片段
}

export function SettingsProvider({
  children,
  initialSettings,
  initialSnippets,
}: SettingsProviderProps) {
  const [settings] = useState<Record<string, string>>(initialSettings);
  const [snippets] = useState<CodeSnippet[]>(initialSnippets);
  // 初始状态直接由 props 决定，所以 isLoading 默认为 false
  const [isLoading] = useState(false);

  // 使用 useMemo 优化 Context 值，避免不必要的重渲染
  const value = useMemo(
    () => ({
      settings,
      snippets,
      isLoading,
    }),
    [settings, snippets, isLoading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// 创建自定义 Hook 以方便消费 Context
export function useSettings(): SettingsContextState {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings 必须在 SettingsProvider 内部使用');
  }

  return context;
}
