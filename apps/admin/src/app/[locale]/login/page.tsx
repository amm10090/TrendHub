"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Github, Mail } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // 定义登录表单的 Zod Schema，使用国际化错误消息
  const LoginSchema = z.object({
    email: z
      .string()
      .min(1, { message: t("validation.emailRequired") })
      .email({ message: t("validation.emailInvalid") }),
    password: z.string().min(1, { message: t("validation.passwordRequired") }),
  });

  type LoginFormValues = z.infer<typeof LoginSchema>;

  // 检查是否有来自URL的错误参数
  useEffect(() => {
    if (errorParam) {
      const errorKey = `errors.${errorParam}`;

      setServerError(t(errorKey, { fallback: t("errors.Default") }));
    }

    // 添加初始动画效果
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 500);

    return () => clearTimeout(timer);
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
      // 获取并处理回调 URL
      let redirectUrl = callbackUrl;

      // 如果 callbackUrl 是编码的，则解码
      if (redirectUrl.startsWith("%2F")) {
        redirectUrl = decodeURIComponent(redirectUrl);
      }
      // 确保它是绝对路径或以 / 开头
      if (!redirectUrl.startsWith("/") && !redirectUrl.startsWith("http")) {
        redirectUrl = `/${redirectUrl}`;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl: redirectUrl,
      });

      if (result?.error) {
        // 处理错误，尝试使用翻译映射表来匹配各种错误类型
        const errorKey = `errors.${result.error}`;

        setServerError(t(errorKey, { fallback: t("errors.Default") }));
        setIsLoading(false);
      } else if (result?.url) {
        // 登录成功
        toast.success(t("loginSuccess", { fallback: "登录成功" }));
        setIsLoading(false); // 在重定向前设置isLoading为false
        router.push(result.url);
      } else {
        setServerError(t("errors.Default"));
        setIsLoading(false);
      }
    } catch (error) {
      // 尝试确定错误类型
      let errorMessage = "errors.Default";

      if (error instanceof Error) {
        // 检查是否包含 URL 相关的错误字符串，这可能表明是配置问题
        if (
          error.message.includes("URL") ||
          error.message.includes("NEXTAUTH_URL")
        ) {
          errorMessage = "errors.Configuration";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = "errors.NetworkError";
        }
      }

      setServerError(t(errorMessage));
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setOauthLoading(provider);
    setServerError(null);

    try {
      // 获取并处理回调 URL
      let redirectUrl = callbackUrl;

      if (redirectUrl.startsWith("%2F")) {
        redirectUrl = decodeURIComponent(redirectUrl);
      }
      if (!redirectUrl.startsWith("/") && !redirectUrl.startsWith("http")) {
        redirectUrl = `/${redirectUrl}`;
      }

      await signIn(provider, { callbackUrl: redirectUrl });
      // 注意：不需要设置loading为false，因为会有页面跳转
    } catch {
      // 处理错误
      setServerError(t("errors.OAuthError"));
      setOauthLoading(null);
    }
  };

  // 处理邮箱登录
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailAddress || !emailAddress.includes("@")) {
      setServerError(t("validation.emailInvalid"));

      return;
    }

    setOauthLoading("email");
    setServerError(null);

    try {
      // 获取并处理回调 URL
      let redirectUrl = callbackUrl;

      if (redirectUrl.startsWith("%2F")) {
        redirectUrl = decodeURIComponent(redirectUrl);
      }
      if (!redirectUrl.startsWith("/") && !redirectUrl.startsWith("http")) {
        redirectUrl = `/${redirectUrl}`;
      }

      const result = await signIn("resend", {
        email: emailAddress,
        redirect: false,
        callbackUrl: redirectUrl,
      });

      if (result?.error) {
        setServerError(t("errors.EmailSignInError"));
      } else {
        setIsEmailSent(true);
        toast.success(t("emailSent", { fallback: "登录链接已发送到您的邮箱" }));
      }
    } catch {
      setServerError(t("errors.EmailSignInError"));
    } finally {
      setOauthLoading(null);
    }
  };

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
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">
                {t("title")}
              </h1>
              <p className="text-gray-500 mt-2">{t("description")}</p>
            </motion.div>
          </CardHeader>
          <CardContent>
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

            {!isEmailSent ? (
              <>
                {/* OAuth 登录按钮 */}
                <motion.div
                  className="flex flex-col space-y-3 mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: {
                      delay: 0.2,
                      duration: 0.5,
                      ease: "easeOut",
                    },
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center w-full h-11 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === "google" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    {t("continueWithGoogle", {
                      fallback: "使用Google账号登录",
                    })}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center w-full h-11 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                    onClick={() => handleOAuthSignIn("github")}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === "github" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Github className="mr-2 h-5 w-5" />
                    )}
                    {t("continueWithGithub", {
                      fallback: "使用GitHub账号登录",
                    })}
                  </Button>

                  {/* 邮箱登录部分 */}
                  <div className="relative">
                    <Separator className="my-2" />
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                      {t("orLabel", { fallback: "或" })}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder", {
                        fallback: "请输入您的邮箱",
                      })}
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      disabled={!!oauthLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleEmailSignIn}
                      disabled={!!oauthLoading || !emailAddress}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {oauthLoading === "email" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                <div className="relative my-4">
                  <Separator />
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    {t("orWithPassword", { fallback: "或使用密码登录" })}
                  </div>
                </div>

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
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-medium"
                    >
                      {t("emailLabel")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        autoComplete="email"
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
                    <Label
                      htmlFor="password"
                      className="text-gray-700 font-medium"
                    >
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
              </>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t("checkEmail", { fallback: "查看您的邮箱" })}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {t("emailLinkSent", {
                    fallback: "我们已经向 {email} 发送了登录链接。",
                    email: emailAddress,
                  })}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmailAddress("");
                  }}
                  className="w-full"
                >
                  {t("backToLogin", { fallback: "返回登录页面" })}
                </Button>
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="text-center border-t border-gray-100 py-4">
            <motion.p
              className="text-xs text-gray-500 w-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  delay: 0.6,
                  duration: 0.5,
                },
              }}
            >
              {t("footer")}
            </motion.p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
