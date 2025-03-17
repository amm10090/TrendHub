"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  Tabs,
  Tab,
  Textarea,
  addToast,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Settings, Search, Database, Code } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CustomNavbar } from "@/components/custom-navbar";
import { DatabaseSettings } from "@/components/database-settings";
import {
  SettingsService,
  SettingPayload,
} from "@/lib/services/settings-service";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 初次加载时获取所有设置
  useEffect(() => {
    loadAllSettings();
  }, []);

  // 加载所有设置
  const loadAllSettings = async () => {
    setIsLoading(true);
    try {
      const response = await SettingsService.getAllSettings();

      if (response.success && response.data) {
        // 将所有类别的设置合并到一个扁平对象中
        const allSettings: Record<string, string> = {};

        Object.values(response.data).forEach((categorySettings) => {
          categorySettings.forEach((setting) => {
            allSettings[setting.key] = setting.value;
          });
        });

        setSettings(allSettings);
      } else {
        addToast({
          title: "加载设置失败",
          description: response.error || "无法加载设置",
          color: "danger",
          variant: "solid",
        });
      }
    } catch {
      addToast({
        title: "加载设置失败",
        description: "发生错误，请重试",
        color: "danger",
        variant: "solid",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
  };

  // 获取设置值
  const getSettingValue = (key: string, defaultValue: string = ""): string => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  // 处理字段变更
  const handleFieldChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  // 处理开关变更
  const handleSwitchChange = (key: string, isSelected: boolean) => {
    handleFieldChange(key, isSelected.toString());
  };

  // 保存设置
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // 将更改的设置转换为API需要的格式
      const settingsToSave: SettingPayload[] = Object.entries(settings).map(
        ([key, value]) => {
          // 根据设置键确定类别
          let category = "general";

          if (key.startsWith("meta") || key === "keywords") {
            category = "seo";
          } else if (key.startsWith("db")) {
            category = "database";
          } else if (key.startsWith("api")) {
            category = "api";
          } else if (
            [
              "colorMode",
              "primaryColor",
              "contentWidth",
              "navigationStyle",
              "fontSize",
              "fontFamily",
              "reducedMotion",
              "denseMode",
            ].includes(key)
          ) {
            category = "appearance";
          } else if (
            ["facebook", "instagram", "twitter", "pinterest"].includes(key)
          ) {
            category = "social";
          }

          return {
            key,
            value,
            category,
          };
        },
      );

      const response = await SettingsService.saveSettings(settingsToSave);

      if (response.success) {
        addToast({
          title: "保存成功",
          description: "设置已成功保存",
          color: "success",
          variant: "solid",
        });
        setHasChanges(false);
      } else {
        addToast({
          title: "保存失败",
          description: response.error || "无法保存设置",
          color: "danger",
          variant: "solid",
        });
      }
    } catch {
      addToast({
        title: "保存失败",
        description: "发生错误，请重试",
        color: "danger",
        variant: "solid",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 确认放弃更改
  const confirmDiscardChanges = () => {
    onOpen();
  };

  // 放弃更改
  const discardChanges = () => {
    loadAllSettings();
    setHasChanges(false);
    onClose();
  };

  // 如果正在加载，显示加载中
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-[#0A0A0A]">
        <CustomNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-[#4B5563] dark:text-[#9CA3AF]">
              加载设置中...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0A0A0A]">
      <CustomNavbar />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl p-4 md:p-8 transition-all">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-default-900 dark:text-default-50">
            {t("title")}
          </h1>
        </div>

        {/* 使用Tabs组件替换按钮组 */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          variant="light"
          color="primary"
          radius="md"
          className="mb-8"
          classNames={{
            tabList:
              "gap-2 p-1 bg-[#F3F4F6]/50 dark:bg-[#1F2937]/10 rounded-xl",
            tab: "rounded-lg data-[selected=true]:bg-white dark:data-[selected=true]:bg-[#0080FF] data-[selected=true]:shadow-md py-2.5 px-4 font-medium transition-all duration-300 hover:bg-[#E5E7EB]/50 dark:hover:bg-[#374151]/30",
            tabContent:
              "flex items-center gap-2 group-data-[selected=true]:text-[#0080FF] dark:group-data-[selected=true]:text-white",
            cursor:
              "bg-white dark:bg-[#0080FF] shadow-md shadow-[#0080FF]/10 dark:shadow-[#0080FF]/20 rounded-lg",
          }}
        >
          <Tab
            key="general"
            title={
              <div className="flex items-center gap-2">
                <Settings
                  size={18}
                  className="group-data-[selected=true]:text-[#0080FF] dark:group-data-[selected=true]:text-white"
                />
                <span>{t("tabs.general")}</span>
              </div>
            }
          />
          <Tab
            key="seo"
            title={
              <div className="flex items-center gap-2">
                <Search
                  size={18}
                  className="group-data-[selected=true]:text-[#0080FF] dark:group-data-[selected=true]:text-white"
                />
                <span>{t("tabs.seo")}</span>
              </div>
            }
          />

          <Tab
            key="database"
            title={
              <div className="flex items-center gap-2">
                <Database
                  size={18}
                  className="group-data-[selected=true]:text-[#0080FF] dark:group-data-[selected=true]:text-white"
                />
                <span>{t("tabs.database")}</span>
              </div>
            }
          />
          <Tab
            key="api"
            title={
              <div className="flex items-center gap-2">
                <Code
                  size={18}
                  className="group-data-[selected=true]:text-[#0080FF] dark:group-data-[selected=true]:text-white"
                />
                <span>{t("tabs.api")}</span>
              </div>
            }
          />
        </Tabs>

        {/* 内容区域 */}
        <div className="space-y-8">
          {/* 网站信息卡片 - 仅在General标签页显示 */}
          {activeTab === "general" && (
            <>
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1A1A] shadow-[#0080FF]/5 dark:shadow-[#3D9AFF]/10">
                <CardHeader className="border-b border-[#E5E7EB] dark:border-[#374151] pb-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F9FAFB]">
                      {t("websiteInfo.title")}
                    </h2>
                    <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                      {t("websiteInfo.description")}
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="space-y-8 p-6">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                      {t("websiteInfo.siteName")}
                    </label>
                    <Input
                      placeholder={t("websiteInfo.siteNamePlaceholder")}
                      value={getSettingValue("siteName", "TrendHub")}
                      onChange={(e) =>
                        handleFieldChange("siteName", e.target.value)
                      }
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                      {t("websiteInfo.siteDescription")}
                    </label>
                    <Textarea
                      placeholder={t("websiteInfo.siteDescriptionPlaceholder")}
                      value={getSettingValue(
                        "siteDescription",
                        t("websiteInfo.defaultDescription"),
                      )}
                      onChange={(e) =>
                        handleFieldChange("siteDescription", e.target.value)
                      }
                      variant="bordered"
                      radius="md"
                      minRows={3}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("websiteInfo.contactEmail")}
                      </label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={getSettingValue(
                          "contactEmail",
                          "support@trendhub.com",
                        )}
                        onChange={(e) =>
                          handleFieldChange("contactEmail", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("websiteInfo.contactPhone")}
                      </label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        value={getSettingValue(
                          "contactPhone",
                          "+1 (555) 987-6543",
                        )}
                        onChange={(e) =>
                          handleFieldChange("contactPhone", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                      {t("websiteInfo.businessAddress")}
                    </label>
                    <Textarea
                      placeholder={t("websiteInfo.addressPlaceholder")}
                      value={getSettingValue(
                        "businessAddress",
                        "123 E-commerce Street, Suite 100, New York, NY 10001, USA",
                      )}
                      onChange={(e) =>
                        handleFieldChange("businessAddress", e.target.value)
                      }
                      variant="bordered"
                      radius="md"
                      minRows={2}
                      className="w-full"
                    />
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1A1A] shadow-[#0080FF]/5 dark:shadow-[#3D9AFF]/10">
                <CardHeader className="border-b border-[#E5E7EB] dark:border-[#374151] pb-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F9FAFB]">
                      {t("socialMedia.title")}
                    </h2>
                    <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                      {t("socialMedia.description")}
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="space-y-8 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("socialMedia.facebook")}
                      </label>
                      <Input
                        placeholder="https://facebook.com/yourpage"
                        value={getSettingValue(
                          "facebook",
                          "https://facebook.com/trendhub",
                        )}
                        onChange={(e) =>
                          handleFieldChange("facebook", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#1877F2] dark:text-[#4267B2]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("socialMedia.instagram")}
                      </label>
                      <Input
                        placeholder="https://instagram.com/yourhandle"
                        value={getSettingValue(
                          "instagram",
                          "https://instagram.com/trendhub",
                        )}
                        onChange={(e) =>
                          handleFieldChange("instagram", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#E4405F] dark:text-[#E4405F]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("socialMedia.twitter")}
                      </label>
                      <Input
                        placeholder="https://twitter.com/yourhandle"
                        value={getSettingValue(
                          "twitter",
                          "https://twitter.com/trendhub",
                        )}
                        onChange={(e) =>
                          handleFieldChange("twitter", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#1DA1F2] dark:text-[#1DA1F2]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                        {t("socialMedia.pinterest")}
                      </label>
                      <Input
                        placeholder="https://pinterest.com/yourpage"
                        value={getSettingValue(
                          "pinterest",
                          "https://pinterest.com/trendhub",
                        )}
                        onChange={(e) =>
                          handleFieldChange("pinterest", e.target.value)
                        }
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#E60023] dark:text-[#E60023]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            />
                          </svg>
                        }
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* SEO 设置 - 仅在SEO标签页显示 */}
          {activeTab === "seo" && (
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1A1A] shadow-[#0080FF]/5 dark:shadow-[#3D9AFF]/10">
              <CardHeader className="border-b border-[#E5E7EB] dark:border-[#374151] pb-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {t("seo.title")}
                  </h2>
                  <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                    {t("seo.description")}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-8 p-6">
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                    {t("seo.metaTitle")}
                  </label>
                  <Input
                    placeholder={t("seo.metaTitlePlaceholder")}
                    value={getSettingValue(
                      "metaTitle",
                      "TrendHub - Fashion E-commerce Platform",
                    )}
                    onChange={(e) =>
                      handleFieldChange("metaTitle", e.target.value)
                    }
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                    {t("seo.metaDescription")}
                  </label>
                  <Textarea
                    placeholder={t("seo.metaDescriptionPlaceholder")}
                    value={getSettingValue(
                      "metaDescription",
                      t("seo.defaultMetaDescription"),
                    )}
                    onChange={(e) =>
                      handleFieldChange("metaDescription", e.target.value)
                    }
                    variant="bordered"
                    radius="md"
                    minRows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                    {t("seo.keywords")}
                  </label>
                  <Input
                    placeholder={t("seo.keywordsPlaceholder")}
                    value={getSettingValue(
                      "keywords",
                      "fashion, trend, shopping, ecommerce, platform",
                    )}
                    onChange={(e) =>
                      handleFieldChange("keywords", e.target.value)
                    }
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* 数据库设置 - 仅在Database标签页显示 */}
          {activeTab === "database" && (
            <DatabaseSettings
              getSettingValue={getSettingValue}
              handleFieldChange={handleFieldChange}
            />
          )}

          {/* 这里可以添加更多的标签页内容 */}

          {/* API设置 - 仅在API标签页显示 */}
          {activeTab === "api" && (
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1A1A] shadow-[#0080FF]/5 dark:shadow-[#3D9AFF]/10">
              <CardHeader className="border-b border-[#E5E7EB] dark:border-[#374151] pb-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {t("api.title")}
                  </h2>
                  <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                    {t("api.description")}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-8 p-6">
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                    API 密钥
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••"
                    value={getSettingValue("apiKey", "")}
                    onChange={(e) =>
                      handleFieldChange("apiKey", e.target.value)
                    }
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#D1D5DB] mb-2">
                    API 请求限制 (每分钟)
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={getSettingValue("apiRateLimit", "60")}
                    onChange={(e) =>
                      handleFieldChange("apiRateLimit", e.target.value)
                    }
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <Switch
                    isSelected={
                      getSettingValue("apiEnabled", "true") === "true"
                    }
                    onValueChange={(isSelected) =>
                      handleSwitchChange("apiEnabled", isSelected)
                    }
                    id="api-enabled"
                    color="primary"
                  />
                  <label
                    htmlFor="api-enabled"
                    className="text-[#374151] dark:text-[#D1D5DB] text-sm cursor-pointer"
                  >
                    启用 API 访问
                  </label>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              variant="bordered"
              color="default"
              radius="full"
              className="px-6 bg-white dark:bg-[#1A1A1A] border-[#D1D5DB] dark:border-[#4B5563] text-[#374151] dark:text-[#F3F4F6] transition-all duration-300 hover:bg-[#F3F4F6] dark:hover:bg-[#262626] hover:shadow-sm"
              onPress={confirmDiscardChanges}
              isDisabled={!hasChanges || isSaving}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              color="primary"
              variant="solid"
              radius="full"
              className="px-6 font-medium text-white transition-all duration-300 shadow-md shadow-[#0080FF]/20 hover:shadow-lg hover:shadow-[#0080FF]/30 hover:bg-[#0062C3] dark:hover:bg-[#0055AA] dark:text-white bg-black"
              onPress={saveSettings}
              isLoading={isSaving}
              isDisabled={!hasChanges}
            >
              {isSaving ? "保存中..." : t("actions.saveChanges")}
            </Button>
          </div>
        </div>
      </main>

      {/* 确认放弃更改的模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        backdrop="blur"
        classNames={{
          backdrop: "bg-[#111827]/60 backdrop-blur-sm",
          base: "border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl shadow-[#0080FF]/10 dark:shadow-[#3D9AFF]/20",
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-[#E5E7EB] dark:border-[#374151]">
            确认放弃更改
          </ModalHeader>
          <ModalBody>
            <p className="text-[#374151] dark:text-[#D1D5DB]">
              您确定要放弃所有未保存的更改吗？此操作无法撤销。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onClose}
              className="bg-[#F3F4F6] dark:bg-[#1F2937] text-[#374151] dark:text-[#F3F4F6] hover:bg-[#E5E7EB] dark:hover:bg-[#374151]"
            >
              取消
            </Button>
            <Button
              color="danger"
              onPress={discardChanges}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C] shadow-sm shadow-[#EF4444]/20 hover:shadow-[#EF4444]/30"
            >
              放弃更改
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
