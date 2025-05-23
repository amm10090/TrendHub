"use client";

import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EnvCheckResult {
  missing: string[];
  present: string[];
  suggestedMissing: string[];
  generatedAuthSecret?: string;
}

const DOTENV_EXAMPLE_CONTENT = `
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3001"
CLOUDFLARE_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
# RESEND_API_KEY="" (Optional: for email functionality)
LOG_LEVEL="info"
NODE_ENV="development"
`.trim();

export default function SetupPage() {
  const t = useTranslations("setupPage");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [envCheckResult, setEnvCheckResult] = useState<EnvCheckResult | null>(
    null,
  );
  const [isCheckingEnv, setIsCheckingEnv] = useState(true);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [siteName, setSiteName] = useState("TrendHub");

  const checkEnvVars = useCallback(
    async (generateSecret = false) => {
      setIsCheckingEnv(true);
      try {
        const response = await fetch(
          `/api/setup/check-env${generateSecret ? "?generateAuthSecret=true" : ""}`,
        );
        const data: EnvCheckResult = await response.json();

        setEnvCheckResult(data);
        if (data.generatedAuthSecret) {
          setGeneratedSecret(data.generatedAuthSecret);
          toast.success(t("envCheck.secretGenerated"));
        }
        if (data.missing.length === 0) {
          toast.success(t("envCheck.allRequiredPresent"));
        }
      } catch {
        toast.error(t("envCheck.fetchError"));
      } finally {
        setIsCheckingEnv(false);
      }
    },
    [t],
  );

  useEffect(() => {
    checkEnvVars();
  }, [checkEnvVars]);

  const handleGenerateSecret = () => {
    checkEnvVars(true);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(t("envCheck.copiedToClipboard"));
      },
      () => {
        toast.error(t("envCheck.copyFailed"));
      },
    );
  };

  const handleInitialize = async () => {
    if (envCheckResult && envCheckResult.missing.length > 0) {
      toast.error(t("errors.missingEnvVars"));

      return;
    }
    if (!adminEmail || !adminPassword) {
      toast.error(t("errors.adminCredentialsRequired"));

      return;
    }

    setIsLoading(true);
    setInitError(null);
    try {
      const response = await fetch("/api/setup/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminEmail,
          adminPassword,
          siteName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || t("errors.default"));
      }

      toast.success(t("messages.success"));
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      setInitError(errorMessage);
      toast.error(t("errors.default"), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allRequiredEnvVarsPresent =
    envCheckResult && envCheckResult.missing.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {t("envCheck.title")}
            </h3>
            {isCheckingEnv && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("envCheck.checking")}
              </div>
            )}
            {!isCheckingEnv && envCheckResult && (
              <>
                {envCheckResult.missing.length > 0 && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-700 dark:text-red-300">
                          {t("envCheck.missingRequired")}
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                          {envCheckResult.missing.map((varName) => (
                            <li key={varName}>
                              <code>{varName}</code>
                              {varName === "AUTH_SECRET" && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={handleGenerateSecret}
                                  className="ml-2 p-0 h-auto text-red-600 dark:text-red-400 hover:underline"
                                >
                                  <RefreshCw className="mr-1 h-3 w-3" />
                                  {t("envCheck.generateSecret")}
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                        {generatedSecret &&
                          envCheckResult.missing.includes("AUTH_SECRET") && (
                            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {t("envCheck.generatedSecretValue")}
                              </p>
                              <div className="flex items-center mt-1">
                                <Input
                                  readOnly
                                  value={generatedSecret}
                                  className="text-xs flex-grow"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleCopyToClipboard(generatedSecret)
                                  }
                                  className="ml-2"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {t("envCheck.copyAndSave")}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
                {allRequiredEnvVarsPresent && (
                  <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        {t("envCheck.allRequiredPresent")}
                      </p>
                    </div>
                  </div>
                )}
                {envCheckResult.suggestedMissing.length > 0 && (
                  <div className="mt-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                          {t("envCheck.suggestedMissing")}
                        </p>
                        <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400">
                          {envCheckResult.suggestedMissing.map((varName) => (
                            <li key={varName}>
                              <code>{varName}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {t("envCheck.seeExample")}
                  </p>
                  <Textarea
                    readOnly
                    value={DOTENV_EXAMPLE_CONTENT}
                    className="w-full h-40 text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
                    aria-label={t("envCheck.envExampleContent")}
                  />
                </div>
              </>
            )}
          </div>

          {allRequiredEnvVarsPresent && (
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {t("adminSetup.title")}
              </h3>
              <div className="space-y-2">
                <Label htmlFor="siteName">
                  {t("adminSetup.siteNameLabel")}
                </Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder={t("adminSetup.siteNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">{t("adminSetup.emailLabel")}</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder={t("adminSetup.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">
                  {t("adminSetup.passwordLabel")}
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={t("adminSetup.passwordPlaceholder")}
                />
              </div>
            </div>
          )}

          {initError && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm">
              <p className="font-semibold">{t("errors.title")}</p>
              <p>{initError}</p>
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t("explanation")}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleInitialize}
            disabled={
              isLoading ||
              !allRequiredEnvVarsPresent ||
              !adminEmail ||
              !adminPassword
            }
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
