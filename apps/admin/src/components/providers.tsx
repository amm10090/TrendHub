"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";

// 动态导入 HeroUI 组件以避免 SSR 问题
const DynamicHeroUIProvider = dynamic(
  () => import("@heroui/react").then((mod) => mod.HeroUIProvider),
  { ssr: false },
);

const DynamicToastProvider = dynamic(
  () => import("@heroui/react").then((mod) => mod.ToastProvider),
  { ssr: false },
);

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DynamicHeroUIProvider>
          <DynamicToastProvider
            placement="bottom-right"
            toastProps={{
              radius: "md",
              color: "success",
              variant: "solid",
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              classNames: {
                closeButton:
                  "text-success-foreground absolute right-4 top-1/2 -translate-y-1/2",
                base: "bg-success-500 dark:bg-success-500 border border-success-600 dark:border-success-400",
                title:
                  "text-success-foreground dark:text-success-foreground font-medium",
                description:
                  "text-success-foreground/90 dark:text-success-foreground/90",
              },
            }}
          />
          {children}
        </DynamicHeroUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
