import { CodeSnippet, SnippetLocation, SnippetType } from '@repo/types';
import { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Script, { ScriptProps } from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { Footer } from '@/components/footer';
import { MainNavbar } from '@/components/navbar';
import { Providers } from '@/contexts/Providers';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';

import '@/styles/globals.css';

// 定义支持的语言列表
const locales = ['en', 'zh'];

// 初始化字体 - 需要在模块作用域内
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Interface for raw snippet data from API before mapping
interface RawSnippetData {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: string; // Raw type is string from JSON
  location: string; // Raw location is string from JSON
  paths: string[];
  priority: number;
  isActive: boolean;
}

// -------------- 获取公共设置函数 --------------
async function getPublicSettings(): Promise<Record<string, string>> {
  // 使用环境变量配置的内部URL
  const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3005';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

  try {
    const response = await fetch(`${baseUrl}/api/public/settings`, {
      cache: 'force-cache', // 设置可以缓存，因为它们不常变动
      next: { revalidate: 3600 }, // 每小时重新验证一次
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {}; // 返回空对象以防止错误
    }

    const result = await response.json();

    if (result.success && typeof result.data === 'object' && result.data !== null) {
      return result.data as Record<string, string>;
    }

    return {};
  } catch {
    clearTimeout(timeoutId);

    return {}; // 网络错误等也返回空对象
  }
}

// -------------- 获取代码片段函数 --------------
// Moved existing getActiveCodeSnippets function here, minor adjustments if needed
// (Assuming the existing function is mostly correct, just ensure baseUrl usage)
async function getActiveCodeSnippets(path: string): Promise<CodeSnippet[]> {
  // 使用环境变量配置的内部URL
  const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3005';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

  try {
    const response = await fetch(
      `${baseUrl}/api/public/code-snippets?path=${encodeURIComponent(path)}`,
      {
        cache: 'no-store', // 片段可能根据路径变化，不缓存或短缓存
        next: { revalidate: 60 }, // 1分钟重新验证
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      // Map raw data to CodeSnippet type, ensuring enum values are correct
      return result.data.map((snippet: RawSnippetData) => ({
        ...snippet,
        type: snippet.type as SnippetType, // Ensure correct enum mapping
        location: snippet.location as SnippetLocation,
      })) as CodeSnippet[];
    } else {
      return [];
    }
  } catch {
    clearTimeout(timeoutId);

    return [];
  }
}

// -------------- 动态生成 Metadata --------------
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  // const { locale } = params; // <-- 移除此处的解构
  const awaitedParams = await params; // <-- 显式等待 params
  // Set locale early if needed for settings fetching (though likely not needed here)
  // await setRequestLocale(awaitedParams.locale); // 直接使用 awaitedParams.locale

  const settings = await getPublicSettings();

  // Provide sensible defaults
  const siteName = settings.siteName || 'TrendHub';
  const defaultTitle = settings.metaTitle || siteName; // Use siteName as fallback title
  const defaultDescription = settings.metaDescription || 'Discover the latest trends.';

  // Construct metadata object
  return {
    metadataBase: new URL('http://localhost:3000'), // Add metadataBase
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`, // Example: "About Us | TrendHub"
    },
    description: defaultDescription,
    keywords: settings.metaKeywords ? settings.metaKeywords.split(',').map((k) => k.trim()) : [],
    // Add other metadata fields as needed from settings
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      siteName: siteName,
      images: [
        {
          url: settings.ogImageUrl || '/images/og-default.png', // Provide a default OG image
          width: 1200,
          height: 630,
        },
      ],
      locale: awaitedParams.locale, // <-- 使用 awaitedParams.locale
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
      // images: [settings.twitterImageUrl || '/images/twitter-default.png'], // Provide a default Twitter image
    },
    // Example: Add icons from settings if available
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
      shortcut: settings.faviconShortcutUrl || '/favicon-16x16.png',
      apple: settings.appleTouchIconUrl || '/apple-touch-icon.png',
    },
    // Add canonical URL if available in settings or derivable
    // alternates: {
    //   canonical: settings.canonicalBaseUrl ? `${settings.canonicalBaseUrl}${pathname}` : undefined, // Needs pathname access if generating dynamically here
    // },
  };
}

export function generateStaticParams() {
  return locales.map((locale: string) => ({ locale }));
}

// -------------- 渲染代码片段辅助函数 (保持不变或微调) --------------
// (Ensure renderSnippet uses CodeSnippet type from @repo/types)
const renderSnippet = (snippet: CodeSnippet) => {
  try {
    const key = `snippet-${snippet.id}`;
    // Logic for strategy based on location (HEAD, BODY_START, BODY_END)
    let strategy: ScriptProps['strategy'] = 'afterInteractive'; // Default strategy

    if (
      snippet.location === SnippetLocation.HEAD ||
      snippet.location === SnippetLocation.BODY_START
    ) {
      strategy = 'beforeInteractive';
    } else if (snippet.location === SnippetLocation.BODY_END) {
      strategy = 'lazyOnload';
    }

    if (snippet.type === SnippetType.JS) {
      // Handle complete script tags, external scripts (src), and inline scripts
      const isCompleteScriptTag =
        snippet.code.trim().startsWith('<script') && snippet.code.trim().endsWith('</script>');
      const srcMatch = snippet.code.match(/src=["'](.*?)["']/);

      if (isCompleteScriptTag) {
        // Directly inject complete script tags
        return (
          <div
            key={key}
            dangerouslySetInnerHTML={{ __html: snippet.code }}
            suppressHydrationWarning
          />
        );
      } else if (srcMatch && srcMatch[1]) {
        // Render external script using next/script
        return <Script key={key} src={srcMatch[1].trim()} strategy={strategy} />;
      } else {
        // Wrap inline script for error isolation and render using next/script
        const wrappedCode = `try { ${snippet.code} } catch (e) { console.error('Snippet Error (${snippet.id}):', e); }`;

        return (
          <Script
            key={key}
            id={key}
            strategy={strategy}
            dangerouslySetInnerHTML={{ __html: wrappedCode }}
          />
        );
      }
    } else if (snippet.type === SnippetType.CSS) {
      // Render inline CSS using <style> tag
      return <style key={key} dangerouslySetInnerHTML={{ __html: snippet.code }} />;
    }
  } catch {
    return null; // Return null on error to prevent breaking layout
  }

  return null;
};

// -------------- 根布局组件 --------------
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // const { locale } = params; // <-- 移动解构位置
  const awaitedParams = await params; // <-- 显式等待 params

  // --- Start: Locale validation and setting ---
  // Move locale validation and setting to the very top
  if (!locales.includes(awaitedParams.locale)) {
    // <-- 使用 awaitedParams.locale
    notFound();
  }
  // Set request locale FIRST, before any async operations that might depend on it implicitly
  await setRequestLocale(awaitedParams.locale); // <-- 使用 awaitedParams.locale
  // --- End: Locale validation and setting ---

  // 现在可以安全地解构 locale，因为它已经被 setRequestLocale 使用
  // const { locale } = params; // <-- 移除这一行

  // Fetch messages for i18n (Now depends on the set locale)
  const messages = await getMessages({ locale: awaitedParams.locale }); // <-- 使用 awaitedParams.locale

  // Get current pathname from headers
  const headersList = await headers(); // Add await here
  const pathname = headersList.get('x-next-pathname') || '/';

  // Fetch settings and snippets in parallel
  let initialSettings: Record<string, string> = {};
  let initialSnippets: CodeSnippet[] = [];

  try {
    // Use Promise.allSettled for resilience: if one fails, the other can still succeed
    const results = await Promise.allSettled([
      getPublicSettings(),
      getActiveCodeSnippets(pathname),
    ]);

    if (results[0].status === 'fulfilled') {
      initialSettings = results[0].value;
    } else {
      // Keep initialSettings as {}
    }

    if (results[1].status === 'fulfilled') {
      initialSnippets = results[1].value;
    } else {
      // Keep initialSnippets as []
    }
  } catch {
    return null;
    // This catch block might be redundant with allSettled but kept for safety
    // Use default empty values
  }

  // 按位置和优先级分组排序 Snippets
  const snippetsByLocation = initialSnippets.reduce(
    (acc, snippet) => {
      const location = snippet.location || SnippetLocation.BODY_END; // Default to BODY_END if undefined

      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(snippet);

      return acc;
    },
    {} as Record<SnippetLocation, CodeSnippet[]>
  );

  // Sort snippets within each location by priority (lower number = higher priority)
  for (const location in snippetsByLocation) {
    snippetsByLocation[location as SnippetLocation].sort(
      (a, b) => (a.priority ?? 10) - (b.priority ?? 10)
    );
  }

  const headSnippets = snippetsByLocation[SnippetLocation.HEAD] || [];
  const bodyStartSnippets = snippetsByLocation[SnippetLocation.BODY_START] || [];
  const bodyEndSnippets = snippetsByLocation[SnippetLocation.BODY_END] || [];

  return (
    <html lang={awaitedParams.locale} suppressHydrationWarning>
      <head>
        {/* Metadata is now handled by generateMetadata */}
        {/* Inject HEAD snippets */}
        {headSnippets.map(renderSnippet)}
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        {/* Inject BODY_START snippets */}
        {bodyStartSnippets.map(renderSnippet)}

        <NextIntlClientProvider locale={awaitedParams.locale} messages={messages}>
          {/* Wrap existing Providers with SettingsProvider */}
          <SettingsProvider initialSettings={initialSettings} initialSnippets={initialSnippets}>
            <Providers>
              <MainNavbar />
              <main className="flex-grow">{children}</main> {/* Ensure main content grows */}
              {/* TODO: Add Footer component - It will consume settings via useSettings() */}
              <Footer /> {/* Render Footer */}
            </Providers>
          </SettingsProvider>
        </NextIntlClientProvider>

        {/* Inject BODY_END snippets */}
        {bodyEndSnippets.map(renderSnippet)}
      </body>
    </html>
  );
}
