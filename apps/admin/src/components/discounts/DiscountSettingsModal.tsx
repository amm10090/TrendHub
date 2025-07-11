"use client";

import { Settings, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DiscountSettings {
  scheduler: {
    enabled: boolean;
    intervalMinutes: number;
    cleanup: boolean;
    retentionDays: number;
  };
  notifications: {
    enabled: boolean;
    criticalThreshold: number;
    warningThreshold: number;
    channels: {
      email: boolean;
      webhook: boolean;
      dashboard: boolean;
    };
  };
  brandMatching: {
    autoMatch: boolean;
    confidenceLevel: number;
    fuzzyMatch: boolean;
  };
}

const defaultSettings: DiscountSettings = {
  scheduler: {
    enabled: true,
    intervalMinutes: 60,
    cleanup: true,
    retentionDays: 30,
  },
  notifications: {
    enabled: true,
    criticalThreshold: 100,
    warningThreshold: 500,
    channels: {
      email: true,
      webhook: false,
      dashboard: true,
    },
  },
  brandMatching: {
    autoMatch: true,
    confidenceLevel: 0.8,
    fuzzyMatch: true,
  },
};

export function DiscountSettingsModal({
  open,
  onOpenChange,
}: DiscountSettingsModalProps) {
  const t = useTranslations("discounts.settings");
  const [settings, setSettings] = useState<DiscountSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载设置
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]); // loadSettings 是稳定的函数，不需要添加到依赖数组

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/discounts/settings");

      if (response.ok) {
        const data = await response.json();

        setSettings({ ...defaultSettings, ...data });
      }
    } catch {
      toast.error(t("loadingError"));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/discounts/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success(t("saveSuccess"));
        onOpenChange(false);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const updateSchedulerSettings = (
    key: keyof DiscountSettings["scheduler"],
    value: boolean | number,
  ) => {
    setSettings((prev) => ({
      ...prev,
      scheduler: { ...prev.scheduler, [key]: value },
    }));
  };

  const updateNotificationSettings = (
    key: keyof DiscountSettings["notifications"],
    value: boolean | number,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateNotificationChannel = (
    channel: keyof DiscountSettings["notifications"]["channels"],
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channels: { ...prev.notifications.channels, [channel]: value },
      },
    }));
  };

  const updateBrandMatchingSettings = (
    key: keyof DiscountSettings["brandMatching"],
    value: boolean | number,
  ) => {
    setSettings((prev) => ({
      ...prev,
      brandMatching: { ...prev.brandMatching, [key]: value },
    }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">{t("loading")}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scheduler" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scheduler">{t("scheduler.title")}</TabsTrigger>
            <TabsTrigger value="notifications">
              {t("notifications.title")}
            </TabsTrigger>
            <TabsTrigger value="brandMatching">
              {t("brandMatching.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduler" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("scheduler.title")}</CardTitle>
                <CardDescription>{t("scheduler.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("scheduler.enabled")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("scheduler.enabledDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.scheduler.enabled}
                    onCheckedChange={(checked) =>
                      updateSchedulerSettings("enabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="interval">{t("scheduler.interval")}</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.scheduler.intervalMinutes}
                    onChange={(e) =>
                      updateSchedulerSettings(
                        "intervalMinutes",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!settings.scheduler.enabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("scheduler.intervalDescription")}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("scheduler.cleanup")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("scheduler.cleanupDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.scheduler.cleanup}
                    onCheckedChange={(checked) =>
                      updateSchedulerSettings("cleanup", checked)
                    }
                    disabled={!settings.scheduler.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention">{t("scheduler.retention")}</Label>
                  <Input
                    id="retention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.scheduler.retentionDays}
                    onChange={(e) =>
                      updateSchedulerSettings(
                        "retentionDays",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={
                      !settings.scheduler.enabled || !settings.scheduler.cleanup
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("scheduler.retentionDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("notifications.title")}</CardTitle>
                <CardDescription>
                  {t("notifications.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("notifications.enabled")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("notifications.enabledDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enabled}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings("enabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="critical">
                      {t("notifications.critical")}
                    </Label>
                    <Input
                      id="critical"
                      type="number"
                      min="1"
                      value={settings.notifications.criticalThreshold}
                      onChange={(e) =>
                        updateNotificationSettings(
                          "criticalThreshold",
                          parseInt(e.target.value),
                        )
                      }
                      disabled={!settings.notifications.enabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("notifications.criticalDescription")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warning">
                      {t("notifications.warning")}
                    </Label>
                    <Input
                      id="warning"
                      type="number"
                      min="1"
                      value={settings.notifications.warningThreshold}
                      onChange={(e) =>
                        updateNotificationSettings(
                          "warningThreshold",
                          parseInt(e.target.value),
                        )
                      }
                      disabled={!settings.notifications.enabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("notifications.warningDescription")}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>{t("notifications.channels")}</Label>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={settings.notifications.channels.email}
                        onCheckedChange={(checked) =>
                          updateNotificationChannel("email", checked as boolean)
                        }
                        disabled={!settings.notifications.enabled}
                      />
                      <Label htmlFor="email">{t("notifications.email")}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="webhook"
                        checked={settings.notifications.channels.webhook}
                        onCheckedChange={(checked) =>
                          updateNotificationChannel(
                            "webhook",
                            checked as boolean,
                          )
                        }
                        disabled={!settings.notifications.enabled}
                      />
                      <Label htmlFor="webhook">
                        {t("notifications.webhook")}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dashboard"
                        checked={settings.notifications.channels.dashboard}
                        onCheckedChange={(checked) =>
                          updateNotificationChannel(
                            "dashboard",
                            checked as boolean,
                          )
                        }
                        disabled={!settings.notifications.enabled}
                      />
                      <Label htmlFor="dashboard">
                        {t("notifications.dashboard")}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brandMatching" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("brandMatching.title")}</CardTitle>
                <CardDescription>
                  {t("brandMatching.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("brandMatching.autoMatch")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("brandMatching.autoMatchDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.brandMatching.autoMatch}
                    onCheckedChange={(checked) =>
                      updateBrandMatchingSettings("autoMatch", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="confidence">
                    {t("brandMatching.confidence")}
                  </Label>
                  <Input
                    id="confidence"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.brandMatching.confidenceLevel}
                    onChange={(e) =>
                      updateBrandMatchingSettings(
                        "confidenceLevel",
                        parseFloat(e.target.value),
                      )
                    }
                    disabled={!settings.brandMatching.autoMatch}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("brandMatching.confidenceDescription")}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("brandMatching.fuzzyMatch")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("brandMatching.fuzzyMatchDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.brandMatching.fuzzyMatch}
                    onCheckedChange={(checked) =>
                      updateBrandMatchingSettings("fuzzyMatch", checked)
                    }
                    disabled={!settings.brandMatching.autoMatch}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
