"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
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

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const LoginSchema = z.object({
    email: z
      .string()
      .min(1, { message: t("validation.emailRequired") })
      .email({ message: t("validation.emailInvalid") }),
    password: z.string().min(1, { message: t("validation.passwordRequired") }),
  });

  type LoginFormValues = z.infer<typeof LoginSchema>;

  useEffect(() => {
    if (errorParam) {
      const errorKey = `errors.${errorParam}`;

      setServerError(t(errorKey, { fallback: t("errors.Default") }));
    }
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
      let redirectUrl = callbackUrl;

      if (redirectUrl.startsWith("%2F")) {
        redirectUrl = decodeURIComponent(redirectUrl);
      }
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
        const errorKey = `errors.${result.error}`;

        setServerError(t(errorKey, { fallback: t("errors.Default") }));
        setIsLoading(false);
      } else if (result?.url) {
        toast.success(t("loginSuccess", { fallback: "登录成功" }));
        setIsLoading(false);

        let finalUrl = result.url;
        if (finalUrl.includes("localhost") || finalUrl.includes("127.0.0.1")) {
          try {
            const urlObj = new URL(finalUrl);
            finalUrl = urlObj.pathname + urlObj.search + urlObj.hash;
            console.log("转换后的相对URL:", finalUrl);
          } catch (e) {
            console.error("URL转换错误:", e);
          }
        }

        router.push(finalUrl);
      } else {
        setServerError(t("errors.Default"));
        setIsLoading(false);
      }
    } catch (error) {
      let errorMessage = "errors.Default";

      if (error instanceof Error) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 overflow-hidden relative">
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
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
