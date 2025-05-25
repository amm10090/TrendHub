import { getTranslations } from "next-intl/server";

import LoginForm from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { getCsrfTokenServerSide } from "@/lib/auth-utils";

export default async function LoginPage() {
  // 在服务器端获取 CSRF token
  const csrfToken = await getCsrfTokenServerSide();
  const t = await getTranslations("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/50 to-indigo-300/50"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              zIndex: 0,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md z-10">
        <Card className="border border-blue-100 shadow-xl bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="space-y-3 pb-6 relative">
            <div className="text-center">
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
            </div>
          </CardHeader>
          <CardContent>
            <LoginForm csrfToken={csrfToken} />
          </CardContent>
          <CardFooter className="text-center border-t border-gray-100 py-4">
            <p className="text-xs text-gray-500 w-full">{t("footer")}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
