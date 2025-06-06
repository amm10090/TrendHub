"use client";

import { addToast } from "@heroui/react";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SettingsService } from "@/lib/services/settings-service";
import {
  ThemeContextType,
  ThemeSettings,
  FontSize,
  FontFamily,
  ColorMode,
  PrimaryColor,
  ContentWidth,
  NavigationStyle,
} from "@/lib/types/theme";

const defaultTheme: ThemeSettings = {
  colorMode: "system",
  primaryColor: "blue",
  contentWidth: "boxed",
  navigationStyle: "sidebar",
  fontSize: "base",
  fontFamily: "inter",
  reducedMotion: false,
  denseMode: false,
};

export const ThemeContext = createContext<ThemeContextType>({
  ...defaultTheme,
  setTheme: async () => {},
  isLoading: true,
});

// 错误边界组件
class ThemeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    addToast({
      title: "主题加载错误",
      description: "主题系统出现问题，已回退到默认主题",
      color: "danger",
      variant: "solid",
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 useCallback 优化主题更新方法
  const handleSetTheme = useCallback(
    async (newSettings: Partial<ThemeSettings>) => {
      try {
        const updatedTheme = { ...theme, ...newSettings };

        setTheme(updatedTheme);

        // 保存到数据库
        const settingsToUpdate = Object.entries(newSettings).map(
          ([key, value]) => ({
            key,
            value: String(value),
            category: "appearance",
          }),
        );

        const response = await SettingsService.saveSettings(settingsToUpdate);

        if (!response.success) {
          throw new Error(response.error || "保存失败");
        }
      } catch {
        addToast({
          title: "保存主题设置失败",
          description: "无法保存主题设置，请重试",
          color: "danger",
          variant: "solid",
        });
      }
    },
    [theme],
  );

  // 使用 useMemo 优化主题状态
  const themeValue = useMemo(
    () => ({
      ...theme,
      setTheme: handleSetTheme,
      isLoading,
    }),
    [theme, isLoading, handleSetTheme],
  );

  // 加载主题设置
  useEffect(() => {
    loadThemeSettings();
  }, []);

  // 应用颜色模式 - 优化的主题切换逻辑
  useEffect(() => {
    const root = document.documentElement;

    // 移除之前的主题类
    root.classList.remove("light", "dark");

    if (theme.colorMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const applySystemTheme = (isDark: boolean) => {
        requestAnimationFrame(() => {
          root.classList.toggle("dark", isDark);
          root.classList.toggle("light", !isDark);
        });
      };

      // 立即应用当前系统主题
      applySystemTheme(mediaQuery.matches);

      // 监听系统主题变化
      const handleChange = (e: MediaQueryListEvent) => {
        applySystemTheme(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // 手动主题模式
      requestAnimationFrame(() => {
        root.classList.add(theme.colorMode);
      });
    }
  }, [theme.colorMode]);

  // 应用其他主题设置
  useEffect(() => {
    const root = document.documentElement;

    // 添加平滑过渡效果
    if (!theme.reducedMotion) {
      root.style.setProperty(
        "--theme-transition",
        "background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      );
    } else {
      root.style.removeProperty("--theme-transition");
    }

    // 主题色
    requestAnimationFrame(() => {
      root.style.setProperty(
        "--color-primary",
        `var(--color-${theme.primaryColor}-500)`,
      );
      root.style.setProperty(
        "--color-primary-foreground",
        theme.primaryColor === "yellow" || theme.primaryColor === "green"
          ? `var(--color-${theme.primaryColor}-950)`
          : `var(--color-${theme.primaryColor}-50)`,
      );
    });

    // 字体大小
    root.style.setProperty(
      "--font-size-base",
      getFontSizeValue(theme.fontSize),
    );

    // 字体家族
    root.style.setProperty(
      "--font-family",
      getFontFamilyValue(theme.fontFamily),
    );

    // 减少动画
    root.classList.toggle("motion-reduce", theme.reducedMotion);

    // 紧凑模式
    root.classList.toggle("dense", theme.denseMode);

    // 布局样式
    root.dataset.layout = theme.navigationStyle;
    root.dataset.width = theme.contentWidth;

    return () => {
      root.style.removeProperty("--theme-transition");
    };
  }, [theme]);

  // 加载主题设置
  const loadThemeSettings = async () => {
    try {
      const response =
        await SettingsService.getSettingsByCategory("appearance");

      if (response.success && response.data) {
        const settings = response.data.reduce<Partial<ThemeSettings>>(
          (acc, item) => {
            const key = item.key as keyof ThemeSettings;
            const value = item.value;

            switch (key) {
              case "reducedMotion":
              case "denseMode":
                acc[key] = value === "true";
                break;
              case "colorMode":
                acc[key] = value as ColorMode;
                break;
              case "primaryColor":
                acc[key] = value as PrimaryColor;
                break;
              case "contentWidth":
                acc[key] = value as ContentWidth;
                break;
              case "navigationStyle":
                acc[key] = value as NavigationStyle;
                break;
              case "fontSize":
                acc[key] = value as FontSize;
                break;
              case "fontFamily":
                acc[key] = value as FontFamily;
                break;
            }

            return acc;
          },
          {},
        );

        setTheme((prev) => ({
          ...prev,
          ...settings,
        }));
      }
    } catch {
      addToast({
        title: "加载主题设置失败",
        description: "无法加载主题设置，将使用默认主题",
        color: "danger",
        variant: "solid",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeErrorBoundary>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </ThemeErrorBoundary>
  );
}

// 辅助函数
function getFontSizeValue(size: FontSize): string {
  switch (size) {
    case "sm":
      return "0.875rem";
    case "lg":
      return "1.125rem";
    default:
      return "1rem";
  }
}

function getFontFamilyValue(family: FontFamily): string {
  switch (family) {
    case "roboto":
      return "Roboto, sans-serif";
    case "poppins":
      return "Poppins, sans-serif";
    case "openSans":
      return "'Open Sans', sans-serif";
    default:
      return "Inter, sans-serif";
  }
}
