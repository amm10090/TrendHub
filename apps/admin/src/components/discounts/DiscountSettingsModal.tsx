"use client";

import { Settings, Loader2, Save } from "lucide-react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// FMTC 分类选项映射 - 基于实际FMTC网站结构
const FMTC_CATEGORY_OPTIONS = [
  { value: "Alcohol / Beer", label: "Alcohol / Beer", id: "1" },
  { value: "Animals & Pet Supplies", label: "Animals & Pet Supplies", id: "6" },
  { value: "Arts & Entertainment", label: "Arts & Entertainment", id: "11" },
  { value: "Auctions", label: "Auctions", id: "24" },
  { value: "B2B", label: "B2B", id: "25" },
  { value: "Babies & Kids", label: "Babies & Kids", id: "35" },
  { value: "Charity", label: "Charity", id: "43" },
  { value: "Clothing & Apparel", label: "Clothing & Apparel", id: "44" },
  {
    value: "Computers & Accessories",
    label: "Computers & Accessories",
    id: "69",
  },
  { value: "Consumer Electronics", label: "Consumer Electronics", id: "90" },
  { value: "Consumer Services", label: "Consumer Services", id: "113" },
  { value: "COVID Related", label: "COVID Related", id: "119" },
  { value: "Curbside Pickup", label: "Curbside Pickup", id: "120" },
  { value: "Department Stores", label: "Department Stores", id: "121" },
  { value: "Education", label: "Education", id: "122" },
  { value: "Erotic", label: "Erotic", id: "126" },
  { value: "Financial", label: "Financial", id: "132" },
  { value: "Food & Gourmet", label: "Food & Gourmet", id: "146" },
  { value: "Gambling", label: "Gambling", id: "164" },
  { value: "Gifts", label: "Gifts", id: "165" },
  {
    value: "Green Living (Eco-Friendly)",
    label: "Green Living (Eco-Friendly)",
    id: "172",
  },
  { value: "Group Discount", label: "Group Discount", id: "173" },
  { value: "Hardware", label: "Hardware", id: "183" },
  { value: "Health & Beauty", label: "Health & Beauty", id: "186" },
  { value: "Holidays & Occasions", label: "Holidays & Occasions", id: "195" },
  { value: "Household", label: "Household", id: "239" },
  { value: "Kids", label: "Kids", id: "253" },
  { value: "Local Deals", label: "Local Deals", id: "254" },
  { value: "Luggage & Bags", label: "Luggage & Bags", id: "282" },
  { value: "Media", label: "Media", id: "284" },
  { value: "Mens", label: "Mens", id: "288" },
  { value: "Office", label: "Office", id: "289" },
  { value: "Sporting Goods", label: "Sporting Goods", id: "294" },
  { value: "Tobacco", label: "Tobacco", id: "321" },
  { value: "Toys & Games", label: "Toys & Games", id: "324" },
  { value: "Travel", label: "Travel", id: "338" },
  { value: "Vehicles & Parts", label: "Vehicles & Parts", id: "344" },
  { value: "Weapons", label: "Weapons", id: "352" },
  { value: "Womens", label: "Womens", id: "353" },
];

// 分类智能匹配函数
function matchCategory(input: string) {
  const trimmedInput = input.trim();

  // 1. 精确文字匹配（优先级最高）
  const exactMatch = FMTC_CATEGORY_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmedInput.toLowerCase(),
  );

  if (exactMatch) {
    return { type: "exact", match: exactMatch };
  }

  // 2. 包含文字匹配
  const containsMatch = FMTC_CATEGORY_OPTIONS.find(
    (option) =>
      option.value.toLowerCase().includes(trimmedInput.toLowerCase()) ||
      trimmedInput.toLowerCase().includes(option.value.toLowerCase()),
  );

  if (containsMatch) {
    return { type: "contains", match: containsMatch };
  }

  // 3. ID 匹配
  const idMatch = FMTC_CATEGORY_OPTIONS.find(
    (option) => option.id === trimmedInput,
  );

  if (idMatch) {
    return { type: "id", match: idMatch };
  }

  // 4. 如果都不匹配，返回原始输入
  return { type: "custom", value: trimmedInput };
}

// 分类选择器组件
function CategorySelector({
  value,
  onChange,
  placeholder = "Select category or enter custom value",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState(value);

  const matchResult = matchCategory(value);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__custom__") {
      setIsCustomInput(true);
      setCustomValue(value);
    } else {
      setIsCustomInput(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomValue(inputValue);
    onChange(inputValue);
  };

  const handleToggleCustom = () => {
    if (isCustomInput) {
      setIsCustomInput(false);
      // 如果有匹配项，使用匹配项的值，否则保持当前值
      const match = matchCategory(customValue);

      if (match.type !== "custom") {
        onChange(match.match!.value);
      }
    } else {
      setIsCustomInput(true);
      setCustomValue(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isCustomInput ? (
          <Select
            value={value}
            onValueChange={handleSelectChange}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {FMTC_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      ID: {option.id}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="__custom__">
                <div className="flex items-center text-muted-foreground">
                  <span>Custom input...</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={customValue}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder="Enter category name or ID"
            className="flex-1"
            disabled={disabled}
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleCustom}
          disabled={disabled}
        >
          {isCustomInput ? <X className="w-4 h-4" /> : "Custom"}
        </Button>
      </div>

      {/* 显示匹配结果 */}
      {value && (
        <div className="text-sm text-muted-foreground">
          {matchResult.type === "exact" && (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-3 h-3" />
              <span>
                Exact match: {matchResult.match.label} (ID:{" "}
                {matchResult.match.id})
              </span>
            </div>
          )}
          {matchResult.type === "contains" && (
            <div className="flex items-center gap-1 text-blue-600">
              <Check className="w-3 h-3" />
              <span>
                Partial match: {matchResult.match.label} (ID:{" "}
                {matchResult.match.id})
              </span>
            </div>
          )}
          {matchResult.type === "id" && (
            <div className="flex items-center gap-1 text-purple-600">
              <Check className="w-3 h-3" />
              <span>
                ID match: {matchResult.match.label} (ID: {matchResult.match.id})
              </span>
            </div>
          )}
          {matchResult.type === "custom" && (
            <div className="flex items-center gap-1 text-orange-600">
              <span>Custom input: &quot;{matchResult.value}&quot;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  fmtc: {
    // 基础配置
    defaultUsername: string;
    defaultPassword: string;
    maxMerchants: number;
    requestDelay: number;
    enableImageDownload: boolean;
    headlessMode: boolean;
    debugMode: boolean;
    maxConcurrency: number;

    // reCAPTCHA配置
    recaptchaMode: string;
    recaptchaManualTimeout: number;
    recaptchaAutoTimeout: number;
    recaptchaRetryAttempts: number;
    recaptchaRetryDelay: number;

    // 2captcha配置
    twoCaptchaApiKey: string;
    twoCaptchaSoftId: number;
    twoCaptchaServerDomain: string;
    twoCaptchaCallback: string;

    // 搜索配置
    searchText: string;
    searchNetworkId: string;
    searchOpmProvider: string;
    searchCategory: string;
    searchCountry: string;
    searchShippingCountry: string;
    searchDisplayType: string;

    // 搜索行为配置
    searchEnableRandomDelay: boolean;
    searchMinDelay: number;
    searchMaxDelay: number;
    searchTypingDelayMin: number;
    searchTypingDelayMax: number;
    searchEnableMouseMovement: boolean;

    // 高级配置
    sessionTimeout: number;
    maxConsecutiveErrors: number;
    errorCooldownPeriod: number;
  };
}

// 处理从 API 加载的数据，确保字符串字段不为 null
const sanitizeSettings = (
  settings: Record<string, unknown>,
): Record<string, unknown> => {
  if (!settings || typeof settings !== "object") {
    return settings;
  }

  const sanitized = { ...settings };

  // 遍历所有属性
  for (const key in sanitized) {
    if (sanitized[key] === null) {
      // 如果是 null，设置为空字符串
      sanitized[key] = "";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // 如果是对象，递归处理
      sanitized[key] = sanitizeSettings(
        sanitized[key] as Record<string, unknown>,
      );
    }
  }

  return sanitized;
};

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
  fmtc: {
    // 基础配置
    defaultUsername: "",
    defaultPassword: "",
    maxMerchants: 500,
    requestDelay: 2000,
    enableImageDownload: false,
    headlessMode: true,
    debugMode: false,
    maxConcurrency: 1,

    // reCAPTCHA配置
    recaptchaMode: "manual",
    recaptchaManualTimeout: 120000,
    recaptchaAutoTimeout: 180000,
    recaptchaRetryAttempts: 3,
    recaptchaRetryDelay: 5000,

    // 2captcha配置
    twoCaptchaApiKey: "",
    twoCaptchaSoftId: 4580,
    twoCaptchaServerDomain: "2captcha.com",
    twoCaptchaCallback: "",

    // 搜索配置
    searchText: "",
    searchNetworkId: "",
    searchOpmProvider: "",
    searchCategory: "",
    searchCountry: "",
    searchShippingCountry: "",
    searchDisplayType: "all",

    // 搜索行为配置
    searchEnableRandomDelay: true,
    searchMinDelay: 500,
    searchMaxDelay: 2000,
    searchTypingDelayMin: 50,
    searchTypingDelayMax: 200,
    searchEnableMouseMovement: true,

    // 高级配置
    sessionTimeout: 1800000,
    maxConsecutiveErrors: 5,
    errorCooldownPeriod: 30000,
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

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载折扣设置和FMTC配置
      const [discountResponse, fmtcResponse] = await Promise.all([
        fetch("/api/discounts/settings"),
        fetch("/api/fmtc/config"),
      ]);

      let discountSettings = {};
      let fmtcSettings = {};

      if (discountResponse.ok) {
        discountSettings = await discountResponse.json();
      }

      if (fmtcResponse.ok) {
        const fmtcData = await fmtcResponse.json();

        if (fmtcData.success && fmtcData.data) {
          fmtcSettings = fmtcData.data;
        }
      }

      setSettings({
        ...defaultSettings,
        ...sanitizeSettings(discountSettings),
        fmtc: {
          ...defaultSettings.fmtc,
          ...sanitizeSettings(fmtcSettings),
        },
      });
    } catch {
      toast.error(t("loadingError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 加载设置
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open, loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // 分离FMTC配置和其他设置
      const { fmtc, ...otherSettings } = settings;

      // 并行保存折扣设置和FMTC配置
      const [discountResponse, fmtcResponse] = await Promise.all([
        fetch("/api/discounts/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(otherSettings),
        }),
        fetch("/api/fmtc/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fmtc),
        }),
      ]);

      if (discountResponse.ok && fmtcResponse.ok) {
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

  const updateFMTCSettings = (
    key: keyof DiscountSettings["fmtc"],
    value: boolean | number | string,
  ) => {
    setSettings((prev) => ({
      ...prev,
      fmtc: { ...prev.fmtc, [key]: value },
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scheduler">{t("scheduler.title")}</TabsTrigger>
            <TabsTrigger value="notifications">
              {t("notifications.title")}
            </TabsTrigger>
            <TabsTrigger value="brandMatching">
              {t("brandMatching.title")}
            </TabsTrigger>
            <TabsTrigger value="fmtc">{t("fmtc.title")}</TabsTrigger>
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

          <TabsContent value="fmtc" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 基础配置 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("fmtc.basic.title")}</CardTitle>
                  <CardDescription>
                    {t("fmtc.basic.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fmtc-username">
                      {t("fmtc.basic.username")}
                    </Label>
                    <Input
                      id="fmtc-username"
                      type="email"
                      value={settings.fmtc.defaultUsername}
                      onChange={(e) =>
                        updateFMTCSettings("defaultUsername", e.target.value)
                      }
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fmtc-password">
                      {t("fmtc.basic.password")}
                    </Label>
                    <Input
                      id="fmtc-password"
                      type="password"
                      value={settings.fmtc.defaultPassword}
                      onChange={(e) =>
                        updateFMTCSettings("defaultPassword", e.target.value)
                      }
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-max-merchants">
                        {t("fmtc.basic.maxMerchants")}
                      </Label>
                      <Input
                        id="fmtc-max-merchants"
                        type="number"
                        min="1"
                        max="10000"
                        value={settings.fmtc.maxMerchants}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "maxMerchants",
                            parseInt(e.target.value),
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        页面大小将根据商户数量自动优化 (≤100个使用100页面大小,
                        ≤500个使用500, &gt;500个使用1000)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-request-delay">
                        {t("fmtc.basic.requestDelay")}
                      </Label>
                      <Input
                        id="fmtc-request-delay"
                        type="number"
                        min="500"
                        max="10000"
                        value={settings.fmtc.requestDelay}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "requestDelay",
                            parseInt(e.target.value),
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("fmtc.basic.requestDelayHint")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-max-concurrency">
                        {t("fmtc.basic.maxConcurrency")}
                      </Label>
                      <Input
                        id="fmtc-max-concurrency"
                        type="number"
                        min="1"
                        max="5"
                        value={settings.fmtc.maxConcurrency}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "maxConcurrency",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fmtc-image-download"
                        checked={settings.fmtc.enableImageDownload}
                        onCheckedChange={(checked) =>
                          updateFMTCSettings(
                            "enableImageDownload",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor="fmtc-image-download">
                        {t("fmtc.basic.enableImageDownload")}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fmtc-headless"
                        checked={settings.fmtc.headlessMode}
                        onCheckedChange={(checked) =>
                          updateFMTCSettings("headlessMode", checked as boolean)
                        }
                      />
                      <Label htmlFor="fmtc-headless">
                        {t("fmtc.basic.headlessMode")}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fmtc-debug"
                        checked={settings.fmtc.debugMode}
                        onCheckedChange={(checked) =>
                          updateFMTCSettings("debugMode", checked as boolean)
                        }
                      />
                      <Label htmlFor="fmtc-debug">
                        {t("fmtc.basic.debugMode")}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* reCAPTCHA 配置 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("fmtc.recaptcha.title")}</CardTitle>
                  <CardDescription>
                    {t("fmtc.recaptcha.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fmtc-recaptcha-mode">
                      {t("fmtc.recaptcha.mode")}
                    </Label>
                    <Select
                      value={settings.fmtc.recaptchaMode}
                      onValueChange={(value) =>
                        updateFMTCSettings("recaptchaMode", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          {t("fmtc.recaptcha.manual")}
                        </SelectItem>
                        <SelectItem value="auto">
                          {t("fmtc.recaptcha.auto")}
                        </SelectItem>
                        <SelectItem value="skip">
                          {t("fmtc.recaptcha.skip")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-manual-timeout">
                        {t("fmtc.recaptcha.manualTimeout")}
                      </Label>
                      <Input
                        id="fmtc-manual-timeout"
                        type="number"
                        min="10000"
                        max="300000"
                        value={settings.fmtc.recaptchaManualTimeout}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "recaptchaManualTimeout",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-auto-timeout">
                        {t("fmtc.recaptcha.autoTimeout")}
                      </Label>
                      <Input
                        id="fmtc-auto-timeout"
                        type="number"
                        min="30000"
                        max="600000"
                        value={settings.fmtc.recaptchaAutoTimeout}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "recaptchaAutoTimeout",
                            parseInt(e.target.value),
                          )
                        }
                        disabled={settings.fmtc.recaptchaMode !== "auto"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-retry-attempts">
                        {t("fmtc.recaptcha.retryAttempts")}
                      </Label>
                      <Input
                        id="fmtc-retry-attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.fmtc.recaptchaRetryAttempts}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "recaptchaRetryAttempts",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-retry-delay">
                        {t("fmtc.recaptcha.retryDelay")}
                      </Label>
                      <Input
                        id="fmtc-retry-delay"
                        type="number"
                        min="1000"
                        max="30000"
                        value={settings.fmtc.recaptchaRetryDelay}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "recaptchaRetryDelay",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2captcha 配置 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("fmtc.twoCaptcha.title")}</CardTitle>
                  <CardDescription>
                    {t("fmtc.twoCaptcha.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fmtc-2captcha-api">
                      {t("fmtc.twoCaptcha.apiKey")}
                    </Label>
                    <Input
                      id="fmtc-2captcha-api"
                      type="password"
                      value={settings.fmtc.twoCaptchaApiKey}
                      onChange={(e) =>
                        updateFMTCSettings("twoCaptchaApiKey", e.target.value)
                      }
                      placeholder="2captcha API key"
                      disabled={settings.fmtc.recaptchaMode !== "auto"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-2captcha-soft-id">
                        {t("fmtc.twoCaptcha.softId")}
                      </Label>
                      <Input
                        id="fmtc-2captcha-soft-id"
                        type="number"
                        value={settings.fmtc.twoCaptchaSoftId}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "twoCaptchaSoftId",
                            parseInt(e.target.value),
                          )
                        }
                        disabled={settings.fmtc.recaptchaMode !== "auto"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-2captcha-domain">
                        {t("fmtc.twoCaptcha.serverDomain")}
                      </Label>
                      <Input
                        id="fmtc-2captcha-domain"
                        type="text"
                        value={settings.fmtc.twoCaptchaServerDomain}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "twoCaptchaServerDomain",
                            e.target.value,
                          )
                        }
                        disabled={settings.fmtc.recaptchaMode !== "auto"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fmtc-2captcha-callback">
                      {t("fmtc.twoCaptcha.callback")}
                    </Label>
                    <Input
                      id="fmtc-2captcha-callback"
                      type="url"
                      value={settings.fmtc.twoCaptchaCallback}
                      onChange={(e) =>
                        updateFMTCSettings("twoCaptchaCallback", e.target.value)
                      }
                      placeholder="https://example.com/callback"
                      disabled={settings.fmtc.recaptchaMode !== "auto"}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 搜索配置 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("fmtc.search.title")}</CardTitle>
                  <CardDescription>
                    {t("fmtc.search.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fmtc-search-text">
                      {t("fmtc.search.searchText")}
                    </Label>
                    <Input
                      id="fmtc-search-text"
                      type="text"
                      value={settings.fmtc.searchText}
                      onChange={(e) =>
                        updateFMTCSettings("searchText", e.target.value)
                      }
                      placeholder={t("fmtc.search.searchTextPlaceholder")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-search-category">
                        {t("fmtc.search.category")}
                      </Label>
                      <CategorySelector
                        value={settings.fmtc.searchCategory}
                        onChange={(value) =>
                          updateFMTCSettings("searchCategory", value)
                        }
                        placeholder={t("fmtc.search.categoryPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-search-network">
                        {t("fmtc.search.networkId")}
                      </Label>
                      <Input
                        id="fmtc-search-network"
                        type="text"
                        value={settings.fmtc.searchNetworkId}
                        onChange={(e) =>
                          updateFMTCSettings("searchNetworkId", e.target.value)
                        }
                        placeholder="Network ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="fmtc-search-country">
                        {t("fmtc.search.country")}
                      </Label>
                      <Input
                        id="fmtc-search-country"
                        type="text"
                        value={settings.fmtc.searchCountry}
                        onChange={(e) =>
                          updateFMTCSettings("searchCountry", e.target.value)
                        }
                        placeholder="US"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fmtc-search-shipping">
                        {t("fmtc.search.shippingCountry")}
                      </Label>
                      <Input
                        id="fmtc-search-shipping"
                        type="text"
                        value={settings.fmtc.searchShippingCountry}
                        onChange={(e) =>
                          updateFMTCSettings(
                            "searchShippingCountry",
                            e.target.value,
                          )
                        }
                        placeholder="US"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fmtc-display-type">
                      {t("fmtc.search.displayType")}
                    </Label>
                    <Select
                      value={settings.fmtc.searchDisplayType}
                      onValueChange={(value) =>
                        updateFMTCSettings("searchDisplayType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("fmtc.search.displayAll")}
                        </SelectItem>
                        <SelectItem value="accepting">
                          {t("fmtc.search.displayAccepting")}
                        </SelectItem>
                        <SelectItem value="not_accepting">
                          {t("fmtc.search.displayNotAccepting")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
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
