"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  const t = useTranslations("setupPage");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/setup/initialize", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || t("errors.default"));
      }

      toast.success(t("messages.success"));
      // 初始化成功后，可以重定向到登录页或仪表盘
      // 这里我们重定向到登录页
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      toast.error(t("errors.default"), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm">
              <p className="font-semibold">{t("errors.title")}</p>
              <p>{error}</p>
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t("explanation")}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleInitialize}
            disabled={isLoading}
            className="w-full text-lg py-6 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 text-primary-foreground dark:text-primary-foreground"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? t("buttons.initializing") : t("buttons.start")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// 翻译条目 (apps/admin/src/messages/cn.json 和 en.json)
/*
cn.json:
{
  "setupPage": {
    "title": "系统初始化向导",
    "description": "欢迎使用 TrendHub！首次启动需要进行系统初始化。",
    "explanation": "此过程将设置数据库结构并填充初始数据。点击下方按钮开始初始化。请确保您的数据库服务已启动并正确配置。",
    "buttons": {
      "start": "开始初始化",
      "initializing": "正在初始化..."
    },
    "messages": {
      "success": "系统初始化成功！即将跳转到登录页面。"
    },
    "errors": {
      "title": "初始化错误",
      "default": "系统初始化过程中发生错误，请检查后台日志或联系管理员。"
    }
  }
}

en.json:
{
  "setupPage": {
    "title": "System Setup Wizard",
    "description": "Welcome to TrendHub! First-time setup requires system initialization.",
    "explanation": "This process will set up the database schema and populate initial data. Click the button below to begin. Please ensure your database service is running and configured correctly.",
    "buttons": {
      "start": "Start Initialization",
      "initializing": "Initializing..."
    },
    "messages": {
      "success": "System initialization successful! Redirecting to login page..."
    },
    "errors": {
      "title": "Initialization Error",
      "default": "An error occurred during system initialization. Please check server logs or contact an administrator."
    }
  }
}
*/
