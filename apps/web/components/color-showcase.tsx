'use client';

import { Button, Card, CardBody, CardHeader, Divider, Tabs, Tab } from '@heroui/react';
import { useTheme } from 'next-themes';
import { FC, useState, useEffect, useMemo } from 'react';

import { SunIcon, MoonIcon } from '@/components/icons';

interface ColorBlockProps {
  colorName: string;
  colorClass: string;
  textClass?: string;
  hexValue: string;
}

const ColorBlock: FC<ColorBlockProps> = ({
  colorName,
  colorClass,
  textClass = 'text-white',
  hexValue,
}) => {
  return (
    <div className={`${colorClass} p-4 rounded-md shadow-sm`}>
      <p className={`font-medium ${textClass}`}>{colorName}</p>
      <p className={`text-xs mt-1 ${textClass}`}>{hexValue}</p>
    </div>
  );
};

export const ColorShowcase: FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('light');
  const [colorValues, setColorValues] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === 'dark';

  // 当activeTab改变时，切换主题
  useEffect(() => {
    if (activeTab === 'light') {
      setTheme('light');
    } else if (activeTab === 'dark') {
      setTheme('dark');
    }
  }, [activeTab, setTheme]);

  // 使用 useMemo 定义 colorCategories，避免重复计算
  const colorCategories = useMemo(
    () => [
      {
        name: '主要颜色 (Primary)',
        colors: [
          {
            name: 'primary-50',
            class: isDarkMode ? 'bg-[#001833]' : 'bg-[#EDF5FF]',
            text: isDarkMode ? 'text-white' : 'text-primary-900',
            var: '--primary-50',
          },
          {
            name: 'primary-100',
            class: isDarkMode ? 'bg-[#003166]' : 'bg-[#D0E4FF]',
            text: isDarkMode ? 'text-white' : 'text-primary-900',
            var: '--primary-100',
          },
          {
            name: 'primary-200',
            class: isDarkMode ? 'bg-[#004A94]' : 'bg-[#B3D4FF]',
            text: isDarkMode ? 'text-white' : 'text-primary-900',
            var: '--primary-200',
          },
          {
            name: 'primary-300',
            class: isDarkMode ? 'bg-[#0062C3]' : 'bg-[#66AFFF]',
            text: isDarkMode ? 'text-white' : 'text-primary-900',
            var: '--primary-300',
          },
          {
            name: 'primary-400',
            class: isDarkMode ? 'bg-[#0080FF]' : 'bg-[#3D9AFF]',
            text: 'text-white',
            var: '--primary-400',
          },
          {
            name: 'primary-500',
            class: isDarkMode ? 'bg-[#3D9AFF]' : 'bg-[#0080FF]',
            text: 'text-white',
            var: '--primary-500',
          },
          {
            name: 'primary-600',
            class: isDarkMode ? 'bg-[#66AFFF]' : 'bg-[#0062C3]',
            text: 'text-white',
            var: '--primary-600',
          },
          {
            name: 'primary-700',
            class: isDarkMode ? 'bg-[#B3D4FF]' : 'bg-[#004A94]',
            text: 'text-white',
            var: '--primary-700',
          },
          {
            name: 'primary-800',
            class: isDarkMode ? 'bg-[#D0E4FF]' : 'bg-[#003166]',
            text: 'text-white',
            var: '--primary-800',
          },
          {
            name: 'primary-900',
            class: isDarkMode ? 'bg-[#EDF5FF]' : 'bg-[#001833]',
            text: 'text-white',
            var: '--primary-900',
          },
        ],
      },
      {
        name: '次要颜色 (Secondary)',
        colors: [
          {
            name: 'secondary-50',
            class: isDarkMode ? 'bg-[#4C1D95]' : 'bg-[#F4F0FF]',
            text: isDarkMode ? 'text-white' : 'text-secondary-900',
            var: '--secondary-50',
          },
          {
            name: 'secondary-100',
            class: isDarkMode ? 'bg-[#5B21B6]' : 'bg-[#EBE3FF]',
            text: isDarkMode ? 'text-white' : 'text-secondary-900',
            var: '--secondary-100',
          },
          {
            name: 'secondary-200',
            class: isDarkMode ? 'bg-[#6D28D9]' : 'bg-[#D9CCFF]',
            text: isDarkMode ? 'text-white' : 'text-secondary-900',
            var: '--secondary-200',
          },
          {
            name: 'secondary-300',
            class: isDarkMode ? 'bg-[#7C3AED]' : 'bg-[#BEA6FF]',
            text: isDarkMode ? 'text-white' : 'text-secondary-900',
            var: '--secondary-300',
          },
          {
            name: 'secondary-400',
            class: isDarkMode ? 'bg-[#8B5CF6]' : 'bg-[#A683FF]',
            text: 'text-white',
            var: '--secondary-400',
          },
          {
            name: 'secondary-500',
            class: isDarkMode ? 'bg-[#A683FF]' : 'bg-[#8B5CF6]',
            text: 'text-white',
            var: '--secondary-500',
          },
          {
            name: 'secondary-600',
            class: isDarkMode ? 'bg-[#BEA6FF]' : 'bg-[#7C3AED]',
            text: 'text-white',
            var: '--secondary-600',
          },
          {
            name: 'secondary-700',
            class: isDarkMode ? 'bg-[#D9CCFF]' : 'bg-[#6D28D9]',
            text: 'text-white',
            var: '--secondary-700',
          },
          {
            name: 'secondary-800',
            class: isDarkMode ? 'bg-[#EBE3FF]' : 'bg-[#5B21B6]',
            text: 'text-white',
            var: '--secondary-800',
          },
          {
            name: 'secondary-900',
            class: isDarkMode ? 'bg-[#F4F0FF]' : 'bg-[#4C1D95]',
            text: 'text-white',
            var: '--secondary-900',
          },
        ],
      },
      {
        name: '成功颜色 (Success)',
        colors: [
          {
            name: 'success-50',
            class: isDarkMode ? 'bg-[#14532D]' : 'bg-[#F0FDF4]',
            text: isDarkMode ? 'text-white' : 'text-success-900',
            var: '--success-50',
          },
          {
            name: 'success-100',
            class: isDarkMode ? 'bg-[#166534]' : 'bg-[#DCFCE7]',
            text: isDarkMode ? 'text-white' : 'text-success-900',
            var: '--success-100',
          },
          {
            name: 'success-200',
            class: isDarkMode ? 'bg-[#15803D]' : 'bg-[#BBF7D0]',
            text: isDarkMode ? 'text-white' : 'text-success-900',
            var: '--success-200',
          },
          {
            name: 'success-300',
            class: isDarkMode ? 'bg-[#16A34A]' : 'bg-[#86EFAC]',
            text: isDarkMode ? 'text-white' : 'text-success-900',
            var: '--success-300',
          },
          {
            name: 'success-400',
            class: isDarkMode ? 'bg-[#22C55E]' : 'bg-[#4ADE80]',
            text: 'text-white',
            var: '--success-400',
          },
          {
            name: 'success-500',
            class: isDarkMode ? 'bg-[#4ADE80]' : 'bg-[#22C55E]',
            text: 'text-white',
            var: '--success-500',
          },
          {
            name: 'success-600',
            class: isDarkMode ? 'bg-[#86EFAC]' : 'bg-[#16A34A]',
            text: 'text-white',
            var: '--success-600',
          },
          {
            name: 'success-700',
            class: isDarkMode ? 'bg-[#BBF7D0]' : 'bg-[#15803D]',
            text: 'text-white',
            var: '--success-700',
          },
          {
            name: 'success-800',
            class: isDarkMode ? 'bg-[#DCFCE7]' : 'bg-[#166534]',
            text: 'text-white',
            var: '--success-800',
          },
          {
            name: 'success-900',
            class: isDarkMode ? 'bg-[#F0FDF4]' : 'bg-[#14532D]',
            text: 'text-white',
            var: '--success-900',
          },
        ],
      },
      {
        name: '警告颜色 (Warning)',
        colors: [
          {
            name: 'warning-50',
            class: isDarkMode ? 'bg-[#78350F]' : 'bg-[#FFFBEB]',
            text: isDarkMode ? 'text-white' : 'text-warning-900',
            var: '--warning-50',
          },
          {
            name: 'warning-100',
            class: isDarkMode ? 'bg-[#92400E]' : 'bg-[#FEF3C7]',
            text: isDarkMode ? 'text-white' : 'text-warning-900',
            var: '--warning-100',
          },
          {
            name: 'warning-200',
            class: isDarkMode ? 'bg-[#B45309]' : 'bg-[#FDE68A]',
            text: isDarkMode ? 'text-white' : 'text-warning-900',
            var: '--warning-200',
          },
          {
            name: 'warning-300',
            class: isDarkMode ? 'bg-[#D97706]' : 'bg-[#FCD34D]',
            text: isDarkMode ? 'text-white' : 'text-warning-900',
            var: '--warning-300',
          },
          {
            name: 'warning-400',
            class: isDarkMode ? 'bg-[#F59E0B]' : 'bg-[#FBBF24]',
            text: 'text-white',
            var: '--warning-400',
          },
          {
            name: 'warning-500',
            class: isDarkMode ? 'bg-[#FBBF24]' : 'bg-[#F59E0B]',
            text: 'text-white',
            var: '--warning-500',
          },
          {
            name: 'warning-600',
            class: isDarkMode ? 'bg-[#FCD34D]' : 'bg-[#D97706]',
            text: 'text-white',
            var: '--warning-600',
          },
          {
            name: 'warning-700',
            class: isDarkMode ? 'bg-[#FDE68A]' : 'bg-[#B45309]',
            text: 'text-white',
            var: '--warning-700',
          },
          {
            name: 'warning-800',
            class: isDarkMode ? 'bg-[#FEF3C7]' : 'bg-[#92400E]',
            text: 'text-white',
            var: '--warning-800',
          },
          {
            name: 'warning-900',
            class: isDarkMode ? 'bg-[#FFFBEB]' : 'bg-[#78350F]',
            text: 'text-white',
            var: '--warning-900',
          },
        ],
      },
      {
        name: '危险颜色 (Danger)',
        colors: [
          {
            name: 'danger-50',
            class: isDarkMode ? 'bg-[#7F1D1D]' : 'bg-[#FEF2F2]',
            text: isDarkMode ? 'text-white' : 'text-danger-900',
            var: '--danger-50',
          },
          {
            name: 'danger-100',
            class: isDarkMode ? 'bg-[#991B1B]' : 'bg-[#FEE2E2]',
            text: isDarkMode ? 'text-white' : 'text-danger-900',
            var: '--danger-100',
          },
          {
            name: 'danger-200',
            class: isDarkMode ? 'bg-[#B91C1C]' : 'bg-[#FECACA]',
            text: isDarkMode ? 'text-white' : 'text-danger-900',
            var: '--danger-200',
          },
          {
            name: 'danger-300',
            class: isDarkMode ? 'bg-[#DC2626]' : 'bg-[#FCA5A5]',
            text: isDarkMode ? 'text-white' : 'text-danger-900',
            var: '--danger-300',
          },
          {
            name: 'danger-400',
            class: isDarkMode ? 'bg-[#EF4444]' : 'bg-[#F87171]',
            text: 'text-white',
            var: '--danger-400',
          },
          {
            name: 'danger-500',
            class: isDarkMode ? 'bg-[#F87171]' : 'bg-[#EF4444]',
            text: 'text-white',
            var: '--danger-500',
          },
          {
            name: 'danger-600',
            class: isDarkMode ? 'bg-[#FCA5A5]' : 'bg-[#DC2626]',
            text: 'text-white',
            var: '--danger-600',
          },
          {
            name: 'danger-700',
            class: isDarkMode ? 'bg-[#FECACA]' : 'bg-[#B91C1C]',
            text: 'text-white',
            var: '--danger-700',
          },
          {
            name: 'danger-800',
            class: isDarkMode ? 'bg-[#FEE2E2]' : 'bg-[#991B1B]',
            text: 'text-white',
            var: '--danger-800',
          },
          {
            name: 'danger-900',
            class: isDarkMode ? 'bg-[#FEF2F2]' : 'bg-[#7F1D1D]',
            text: 'text-white',
            var: '--danger-900',
          },
        ],
      },
      {
        name: '默认颜色 (Default)',
        colors: [
          {
            name: 'default-50',
            class: isDarkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--default-50',
          },
          {
            name: 'default-100',
            class: isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--default-100',
          },
          {
            name: 'default-200',
            class: isDarkMode ? 'bg-[#374151]' : 'bg-[#E5E7EB]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--default-200',
          },
          {
            name: 'default-300',
            class: isDarkMode ? 'bg-[#4B5563]' : 'bg-[#D1D5DB]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--default-300',
          },
          {
            name: 'default-400',
            class: isDarkMode ? 'bg-[#6B7280]' : 'bg-[#9CA3AF]',
            text: 'text-white',
            var: '--default-400',
          },
          {
            name: 'default-500',
            class: isDarkMode ? 'bg-[#9CA3AF]' : 'bg-[#6B7280]',
            text: 'text-white',
            var: '--default-500',
          },
          {
            name: 'default-600',
            class: isDarkMode ? 'bg-[#D1D5DB]' : 'bg-[#4B5563]',
            text: 'text-white',
            var: '--default-600',
          },
          {
            name: 'default-700',
            class: isDarkMode ? 'bg-[#E5E7EB]' : 'bg-[#374151]',
            text: 'text-white',
            var: '--default-700',
          },
          {
            name: 'default-800',
            class: isDarkMode ? 'bg-[#F3F4F6]' : 'bg-[#1F2937]',
            text: 'text-white',
            var: '--default-800',
          },
          {
            name: 'default-900',
            class: isDarkMode ? 'bg-[#F9FAFB]' : 'bg-[#111827]',
            text: 'text-white',
            var: '--default-900',
          },
        ],
      },
      // 新增背景色类别
      {
        name: '背景颜色 (Background)',
        colors: [
          {
            name: 'bg-primary',
            class: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#ffffff]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-bg-primary-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'bg-secondary',
            class: isDarkMode ? 'bg-[#121212]' : 'bg-[#faf9f6]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-bg-secondary-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'bg-tertiary',
            class: isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f2]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-bg-tertiary-' + (isDarkMode ? 'dark' : 'light'),
          },
        ],
      },
      // 新增文本色类别
      {
        name: '文本颜色 (Text)',
        colors: [
          {
            name: 'text-primary',
            class: isDarkMode ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]',
            text: isDarkMode ? 'text-default-900' : 'text-white',
            var: '--color-text-primary-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'text-secondary',
            class: isDarkMode ? 'bg-[#b3b3b3]' : 'bg-[#666666]',
            text: isDarkMode ? 'text-default-900' : 'text-white',
            var: '--color-text-secondary-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'text-tertiary',
            class: isDarkMode ? 'bg-[#808080]' : 'bg-[#999999]',
            text: isDarkMode ? 'text-default-900' : 'text-white',
            var: '--color-text-tertiary-' + (isDarkMode ? 'dark' : 'light'),
          },
        ],
      },
      // 新增边框色类别
      {
        name: '边框颜色 (Border)',
        colors: [
          {
            name: 'border-primary',
            class: isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#e8e6e3]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-border-primary-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'border-secondary',
            class: isDarkMode ? 'bg-[#262626]' : 'bg-[#f0f0f0]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-border-secondary-' + (isDarkMode ? 'dark' : 'light'),
          },
        ],
      },
      // 新增悬停色类别
      {
        name: '悬停颜色 (Hover)',
        colors: [
          {
            name: 'hover-bg',
            class: isDarkMode ? 'bg-[#262626]' : 'bg-[#f5f5f2]',
            text: isDarkMode ? 'text-white' : 'text-default-900',
            var: '--color-hover-bg-' + (isDarkMode ? 'dark' : 'light'),
          },
          {
            name: 'hover-text',
            class: isDarkMode ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]',
            text: isDarkMode ? 'text-default-900' : 'text-white',
            var: '--color-hover-text-' + (isDarkMode ? 'dark' : 'light'),
          },
        ],
      },
    ],
    [isDarkMode]
  );

  // 使用 useEffect 确保只在客户端运行
  useEffect(() => {
    // 获取计算后的CSS变量值的函数
    const getComputedColor = (varName: string): string => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

      return value || 'undefined'; // 如果没有获取到值，返回'undefined'字符串
    };

    // 创建一个存储所有颜色变量值的对象
    const values: Record<string, string> = {};

    // 获取所有颜色类别的颜色变量值
    colorCategories.forEach((category) => {
      category.colors.forEach((color) => {
        values[color.var] = getComputedColor(color.var);
      });
    });

    setColorValues(values);
    setMounted(true);
  }, [resolvedTheme, colorCategories]);

  // 如果还没有挂载，显示加载界面或返回无内容
  if (!mounted) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">HeroUI 颜色系统展示</h1>
        </div>
        <p className="text-default-600">正在加载颜色数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">HeroUI 颜色系统展示</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-600">当前主题: {isDarkMode ? '暗色' : '亮色'}</span>
        </div>
      </div>

      <p className="text-default-600">
        以下是TrendHub项目中使用的HeroUI颜色系统，包括主要的语义颜色和不同的色调。
        颜色会根据当前的主题模式（亮色/暗色）自动调整。
      </p>

      <Tabs
        aria-label="颜色主题选项"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        color="primary"
        variant="underlined"
        classNames={{
          base: 'w-full',
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-primary',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-primary',
        }}
      >
        <Tab
          key="light"
          title={
            <div className="flex items-center gap-2">
              <SunIcon className="h-4 w-4" />
              <span>亮色模式颜色</span>
            </div>
          }
        />
        <Tab
          key="dark"
          title={
            <div className="flex items-center gap-2">
              <MoonIcon className="h-4 w-4" />
              <span>暗色模式颜色</span>
            </div>
          }
        />
      </Tabs>

      {colorCategories.map((category) => (
        <div key={category.name} className="space-y-2">
          <h2 className="text-xl font-semibold">{category.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {category.colors.map((color) => (
              <ColorBlock
                key={color.name}
                colorName={color.name}
                colorClass={color.class}
                textClass={color.text}
                hexValue={colorValues[color.var] || '未定义'}
              />
            ))}
          </div>
        </div>
      ))}

      <Divider className="my-8" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">HeroUI 组件示例</h2>
        <p className="text-default-600">
          以下是使用HeroUI颜色系统的组件示例，展示了如何在组件中使用这些颜色。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#003166]' : 'bg-[#D0E4FF]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#EDF5FF]' : 'text-[#001833]'}`}
              >
                主要卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#66AFFF]' : 'text-[#004A94]'}>
                这是一个使用主要颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#3D9AFF] text-black' : 'bg-[#0080FF] text-white'}`}
              >
                主要按钮
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#5B21B6]' : 'bg-[#EBE3FF]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#F4F0FF]' : 'text-[#4C1D95]'}`}
              >
                次要卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#BEA6FF]' : 'text-[#6D28D9]'}>
                这是一个使用次要颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#A683FF] text-black' : 'bg-[#8B5CF6] text-white'}`}
              >
                次要按钮
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#166534]' : 'bg-[#DCFCE7]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#F0FDF4]' : 'text-[#14532D]'}`}
              >
                成功卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#86EFAC]' : 'text-[#15803D]'}>
                这是一个使用成功颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#4ADE80] text-black' : 'bg-[#22C55E] text-white'}`}
              >
                成功按钮
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#92400E]' : 'bg-[#FEF3C7]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#FFFBEB]' : 'text-[#78350F]'}`}
              >
                警告卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#FCD34D]' : 'text-[#B45309]'}>
                这是一个使用警告颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#FBBF24] text-black' : 'bg-[#F59E0B] text-white'}`}
              >
                警告按钮
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#991B1B]' : 'bg-[#FEE2E2]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#FEF2F2]' : 'text-[#7F1D1D]'}`}
              >
                危险卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#FCA5A5]' : 'text-[#B91C1C]'}>
                这是一个使用危险颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#F87171] text-black' : 'bg-[#EF4444] text-white'}`}
              >
                危险按钮
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className={isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]'}>
              <h3
                className={`text-lg font-medium ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}
              >
                默认卡片
              </h3>
            </CardHeader>
            <CardBody>
              <p className={isDarkMode ? 'text-[#D1D5DB]' : 'text-[#374151]'}>
                这是一个使用默认颜色的卡片示例。
              </p>
              <Button
                className={`mt-4 ${isDarkMode ? 'bg-[#9CA3AF] text-black' : 'bg-[#6B7280] text-white'}`}
              >
                默认按钮
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
