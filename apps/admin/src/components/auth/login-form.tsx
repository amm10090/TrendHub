"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  csrfToken: string;
}

export default function LoginForm({ csrfToken }: LoginFormProps) {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  // 解码 callbackUrl 并处理特殊情况
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  const callbackUrl = decodeURIComponent(rawCallbackUrl);
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const LoginSchema = z.object({
    email: z.string().min(1, { message: t("validation.emailRequired") }),
    password: z.string().min(1, { message: t("validation.passwordRequired") }),
  });

  type LoginFormValues = z.infer<typeof LoginSchema>;

  useEffect(() => {
    if (errorParam) {
      const errorKey = `errors.${errorParam}`;

      setServerError(t(errorKey, { fallback: t("errors.Default") }));
    }
  }, [errorParam, t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl: callbackUrl,
        redirect: false, // 不自动重定向，让我们手动处理
        csrfToken, // 包含 CSRF token 以增强安全性
      });

      if (result?.error) {
        const errorKey = `errors.${result.error}`;

        setServerError(t(errorKey, { fallback: t("errors.Default") }));
      } else if (result?.ok) {
        // 登录成功，手动重定向
        // 如果 callbackUrl 是根路径，重定向到 /en
        const finalRedirectUrl = callbackUrl === "/" ? "/en" : callbackUrl;

        window.location.href = finalRedirectUrl;
      } else {
        setServerError(t("errors.Default"));
      }
    } catch {
      setServerError(t("errors.Default"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 pt-4">
      {serverError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-200 text-red-800"
          >
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              delay: 0.3,
              duration: 0.5,
              ease: "easeOut",
            },
          }}
        >
          <Label htmlFor="email" className="text-gray-700 font-medium">
            {t("emailLabel")}
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="text"
              placeholder={t("emailPlaceholder")}
              autoComplete="username"
              className="pr-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              {...register("email")}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          {errors.email && (
            <motion.p
              className="text-xs text-red-500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.email.message}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              delay: 0.4,
              duration: 0.5,
              ease: "easeOut",
            },
          }}
        >
          <Label htmlFor="password" className="text-gray-700 font-medium">
            {t("passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              className="pr-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              {...register("password")}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          {errors.password && (
            <motion.p
              className="text-xs text-red-500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              delay: 0.5,
              duration: 0.5,
              ease: "easeOut",
            },
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden relative"
          >
            <span className="relative z-10">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  {t("loggingIn")}
                </>
              ) : (
                t("loginButton")
              )}
            </span>
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
