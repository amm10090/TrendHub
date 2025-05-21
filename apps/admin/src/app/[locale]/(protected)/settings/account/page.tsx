"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const t = useTranslations("accountSettings");
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const MIN_PASSWORD_LENGTH = 6; // 与后端 Zod schema 保持一致

  const ChangePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: t("validation.currentPasswordRequired") }),
      newPassword: z.string().min(MIN_PASSWORD_LENGTH, {
        message: t("validation.newPasswordMinLength", {
          minLength: MIN_PASSWORD_LENGTH,
        }),
      }),
      confirmPassword: z
        .string()
        .min(1, { message: t("validation.confirmPasswordRequired") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitPasswordChange = async (data: ChangePasswordFormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/settings/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || t("passwordUpdateError");

        // 尝试从 details 中获取更具体的错误信息
        if (result.details?.formErrors?.length > 0) {
          setApiError(result.details.formErrors.join(", "));
        } else if (result.details?.fieldErrors) {
          const fieldErrorMessages = Object.values(result.details.fieldErrors)
            .flat()
            .join(", ");

          setApiError(fieldErrorMessages || errorMessage);
        } else {
          setApiError(errorMessage);
        }
        toast.error(apiError || errorMessage);
      } else {
        toast.success(t("passwordUpdateSuccess"));
        reset(); // 清空表单
      }
    } catch {
      const catchErrorMessage = t("passwordUpdateError");

      setApiError(catchErrorMessage);
      toast.error(catchErrorMessage);
    }
    setIsLoading(false);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    // 理论上受保护路由不会出现此情况，但作为保险
    return <p>{t("common.unauthorized")}</p>;
  }

  const isPresetAdmin =
    session.user.email === process.env.NEXT_PUBLIC_PRESET_ADMIN_EMAIL;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </header>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input id="name" value={session.user.name || "N/A"} readOnly />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input id="email" value={session.user.email || "N/A"} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("changePasswordTitle")}</CardTitle>
          {isPresetAdmin && (
            <Alert
              variant="default"
              className="mt-2 border-yellow-500/50 text-yellow-700 dark:border-yellow-500/30 dark:text-yellow-300"
            >
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                {t("warningTitle")}
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                {t("presetAdminPasswordChangeWarning")}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        {!isPresetAdmin && (
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmitPasswordChange)}
              className="space-y-4"
            >
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1">
                <Label htmlFor="currentPassword">
                  {t("currentPasswordLabel")}
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder={t("currentPasswordPlaceholder")}
                  {...register("currentPassword")}
                  disabled={isLoading}
                />
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="newPassword">{t("newPasswordLabel")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("newPasswordPlaceholder")}
                  {...register("newPassword")}
                  disabled={isLoading}
                />
                {errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">
                  {t("confirmPasswordLabel")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("savePasswordButton")}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
