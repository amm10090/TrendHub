import { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { ScriptProps } from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { Navbar } from '@/components/navbar';
import { Providers } from '@/contexts/Providers';
import { CodeSnippet, SnippetLocation, SnippetType } from '@/lib/types';
import { cn } from '@/lib/utils';

import '@/styles/globals.css';

// 定义支持的语言列表
const locales = ['en', 'zh'];

// 初始化字体 - 需要在模块作用域内
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

interface SnippetData {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: string;
  location: string;
  paths: string[];
  priority: number;
  isActive: boolean;
}

// 定义代码片段抓取函数
async function getActiveCodeSnippets(path: string): Promise<CodeSnippet[]> {
  try {
    // 从环境变量获取或设置默认值
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';

    // 添加超时设置
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

    try {
      const response = await fetch(
        `${baseUrl}/api/public/code-snippets?path=${encodeURIComponent(path)}`,
        {
          cache: 'no-store',
          next: { revalidate: 60 },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId); // 清除超时

      if (!response.ok) {
        return [];
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // 确保返回的数据结构符合 CodeSnippet[] 类型
        return result.data.map((snippet: SnippetData) => ({
          ...snippet,
          // 确保类型正确映射
          type: snippet.type as SnippetType,
          location: snippet.location as SnippetLocation,
        })) as CodeSnippet[];
      } else {
        return [];
      }
    } catch {
      clearTimeout(timeoutId); // 确保清除超时

      return [];
    }
  } catch {
    return [];
  }
}

// 渲染代码片段的辅助函数
const renderSnippet = (snippet: CodeSnippet) => {
  try {
    const key = `snippet-${snippet.id}`;
    const scriptProps: Omit<ScriptProps, 'src' | 'strategy'> & {
      strategy?: ScriptProps['strategy'];
    } = {};

    // 确定 Script 组件的 strategy
    switch (snippet.location) {
      case SnippetLocation.HEAD:
      case SnippetLocation.BODY_START:
        scriptProps.strategy = 'beforeInteractive';
        break;
      case SnippetLocation.BODY_END:
        scriptProps.strategy = 'lazyOnload'; // 或者 "afterInteractive"
        break;
    }

    if (snippet.type === SnippetType.JS) {
      // 检查代码是否包含完整的script标签
      const isCompleteScriptTag =
        snippet.code.trim().startsWith('<script') && snippet.code.trim().endsWith('</script>');

      // 对于包含完整script标签的代码，我们直接使用dangerouslySetInnerHTML注入
      if (isCompleteScriptTag) {
        // 直接插入完整的script标签，由浏览器解析
        return (
          <div
            key={key}
            dangerouslySetInnerHTML={{ __html: snippet.code }}
            suppressHydrationWarning
          />
        );
      }

      // 检查代码是否是外部脚本引用（明确使用src属性的方式）
      const srcMatch = snippet.code.match(/src=["'](.*?)["']/);

      if (srcMatch && srcMatch[1]) {
        // 提取src，并去除可能的空格
        const src = srcMatch[1].trim();

        return <Script key={key} src={src} {...scriptProps} />;
      }

      // 包装JavaScript代码以隔离错误，防止影响整个页面
      const wrappedCode = `
try {
  ${snippet.code}
} catch (error) {
  console.error('[代码片段错误]', '${snippet.id}', error);
}`;

      // 内联脚本处理
      return (
        <Script
          key={key}
          id={key}
          dangerouslySetInnerHTML={{ __html: wrappedCode }}
          {...scriptProps}
        />
      );
    } else if (snippet.type === SnippetType.CSS) {
      return <style key={key} dangerouslySetInnerHTML={{ __html: snippet.code }} />;
    }
  } catch {
    return null;
  }

  return null;
};

export const metadata: Metadata = {
  // ... existing metadata ...
};

export function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const param = await params;
  const locale = param.locale;

  if (!locales.includes(locale)) {
    notFound();
  }

  await setRequestLocale(locale);
  const messages = await getMessages({ locale });

  // 获取当前路径
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || '/';

  // 获取并处理代码片段
  let snippets: CodeSnippet[] = [];

  try {
    snippets = await getActiveCodeSnippets(pathname);
  } catch {
    // 出错时使用空数组继续，不中断页面渲染
    return null;
  }

  // 按位置和优先级分组排序
  const snippetsByLocation = snippets.reduce(
    (acc, snippet) => {
      const location = snippet.location || SnippetLocation.BODY_END;

      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(snippet);

      return acc;
    },
    {} as Record<SnippetLocation, CodeSnippet[]>
  );

  // 对每个位置的片段按优先级排序 (数字越小优先级越高)
  for (const location in snippetsByLocation) {
    snippetsByLocation[location as SnippetLocation].sort(
      (a: CodeSnippet, b: CodeSnippet) => a.priority - b.priority
    );
  }

  // 获取每个位置的片段
  const headSnippets = snippetsByLocation[SnippetLocation.HEAD] || [];
  const bodyStartSnippets = snippetsByLocation[SnippetLocation.BODY_START] || [];
  const bodyEndSnippets = snippetsByLocation[SnippetLocation.BODY_END] || [];

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* 注入 HEAD 片段 */}
        {headSnippets.map(renderSnippet)}
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {/* 注入 BODY_START 片段 */}
        {bodyStartSnippets.map(renderSnippet)}

        {/*
         * 使用应用程序提供的Providers组件
         * 需要注意NextIntlClientProvider必须是第一层，为所有组件提供国际化
         */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/*
           * Providers组件内部已经包含了:
           * - ThemeProvider
           * - HeroUIProvider
           * - ProductModalProvider (解决useProductModal错误)
           * - ToastProvider
           */}
          <Providers>
            {/* 添加导航栏组件 */}
            <Navbar />
            {children}
          </Providers>
        </NextIntlClientProvider>

        {/* 注入 BODY_END 片段 */}
        {bodyEndSnippets.map(renderSnippet)}
      </body>
    </html>
  );
}
