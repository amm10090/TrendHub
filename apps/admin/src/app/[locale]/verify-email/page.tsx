"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const t = useTranslations("verifyEmail");
  const [isFlipped, setIsFlipped] = useState(false);

  // 添加初始动画效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 overflow-hidden relative">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/50 to-indigo-300/50"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              zIndex: 0,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 0.7,
              transition: {
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 5,
              },
            }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{
          rotateY: isFlipped ? 0 : 180,
          opacity: isFlipped ? 1 : 0,
          transition: {
            duration: 0.8,
            ease: "easeOut",
          },
        }}
        style={{ perspective: 1500 }}
      >
        <Card className="border border-blue-100 shadow-xl bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="space-y-3 pb-6 relative">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-800">
                {t("title", { fallback: "验证您的邮箱" })}
              </h1>
              <p className="text-gray-500 mt-2">
                {t("description", {
                  fallback:
                    "我们已向您的邮箱发送了一封包含登录链接的邮件。请查看您的邮箱并点击链接以完成登录。",
                })}
              </p>
            </motion.div>
          </CardHeader>
          <CardContent className="pb-6">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  {t("checkSpam", {
                    fallback: "如果您没有收到邮件，请检查您的垃圾邮件文件夹。",
                  })}
                </p>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => (window.location.href = "/login")}
              >
                {t("backToLogin", { fallback: "返回登录页面" })}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
