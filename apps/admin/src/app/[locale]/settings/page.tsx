"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  Textarea,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CustomNavbar } from "@/components/custom-navbar";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("general");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary-light dark:bg-bg-primary-dark">
      <CustomNavbar />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl p-4 md:p-8 transition-all">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-default-900 dark:text-default-50">
            {t("title")}
          </h1>
        </div>

        {/* 标签页导航 */}
        <div className="flex flex-wrap gap-3 border-b border-default-200 dark:border-default-800 pb-4 mb-8">
          {["general", "seo", "appearance", "database", "api"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "solid" : "light"}
              color={activeTab === tab ? "primary" : "default"}
              className="capitalize transition-all duration-300"
              onPress={() => handleTabChange(tab)}
            >
              {t(`tabs.${tab}`)}
            </Button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="space-y-8">
          {/* 网站信息卡片 - 仅在General标签页显示 */}
          {activeTab === "general" && (
            <>
              <Card className="shadow-lg hover:shadow-xl transition-all rounded-xl border border-default-200 dark:border-default-800">
                <CardHeader className="border-b border-default-200 dark:border-default-800 pb-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold text-default-900 dark:text-default-50">
                      {t("websiteInfo.title")}
                    </h2>
                    <p className="text-sm text-default-600 dark:text-default-400">
                      {t("websiteInfo.description")}
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="space-y-8 p-6">
                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("websiteInfo.siteName")}
                    </label>
                    <Input
                      placeholder={t("websiteInfo.siteNamePlaceholder")}
                      defaultValue="TrendHub"
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("websiteInfo.siteDescription")}
                    </label>
                    <Textarea
                      placeholder={t("websiteInfo.siteDescriptionPlaceholder")}
                      defaultValue={t("websiteInfo.defaultDescription")}
                      variant="bordered"
                      radius="md"
                      minRows={3}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("websiteInfo.contactEmail")}
                      </label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        defaultValue="support@trendhub.com"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("websiteInfo.contactPhone")}
                      </label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        defaultValue="+1 (555) 987-6543"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("websiteInfo.businessAddress")}
                    </label>
                    <Textarea
                      placeholder={t("websiteInfo.addressPlaceholder")}
                      defaultValue="123 E-commerce Street, Suite 100, New York, NY 10001, USA"
                      variant="bordered"
                      radius="md"
                      minRows={2}
                      className="w-full"
                    />
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all rounded-xl border border-default-200 dark:border-default-800">
                <CardHeader className="border-b border-default-200 dark:border-default-800 pb-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold text-default-900 dark:text-default-50">
                      {t("socialMedia.title")}
                    </h2>
                    <p className="text-sm text-default-600 dark:text-default-400">
                      {t("socialMedia.description")}
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="space-y-8 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("socialMedia.facebook")}
                      </label>
                      <Input
                        placeholder="https://facebook.com/yourpage"
                        defaultValue="https://facebook.com/trendhub"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-default-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("socialMedia.instagram")}
                      </label>
                      <Input
                        placeholder="https://instagram.com/yourhandle"
                        defaultValue="https://instagram.com/trendhub"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-default-500"
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
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("socialMedia.twitter")}
                      </label>
                      <Input
                        placeholder="https://twitter.com/yourhandle"
                        defaultValue="https://twitter.com/trendhub"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-default-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                        {t("socialMedia.pinterest")}
                      </label>
                      <Input
                        placeholder="https://pinterest.com/yourpage"
                        defaultValue="https://pinterest.com/trendhub"
                        variant="bordered"
                        radius="md"
                        className="w-full"
                        startContent={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-default-500"
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

          {/* 数据库设置 - 仅在Database标签页显示 */}
          {activeTab === "database" && (
            <Card className="shadow-lg hover:shadow-xl transition-all rounded-xl border border-default-200 dark:border-default-800">
              <CardHeader className="border-b border-default-200 dark:border-default-800 pb-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-default-900 dark:text-default-50">
                    {t("database.title")}
                  </h2>
                  <p className="text-sm text-default-600 dark:text-default-400">
                    {t("database.description")}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-8 p-6">
                <div>
                  <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                    {t("database.host")}
                  </label>
                  <Input
                    placeholder="localhost"
                    defaultValue="db.trendhub.com"
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("database.name")}
                    </label>
                    <Input
                      placeholder="my_database"
                      defaultValue="trendhub_production"
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("database.port")}
                    </label>
                    <Input
                      placeholder="3306"
                      defaultValue="5432"
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("database.user")}
                    </label>
                    <Input
                      placeholder="username"
                      defaultValue="trendhub_admin"
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                      {t("database.password")}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      defaultValue="••••••••••••"
                      variant="bordered"
                      radius="md"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <Switch defaultSelected id="db-ssl" color="primary" />
                  <label
                    htmlFor="db-ssl"
                    className="text-default-700 dark:text-default-300 text-sm cursor-pointer"
                  >
                    {t("database.useSSL")}
                  </label>
                </div>
                <Button color="primary" className="mt-4" radius="md">
                  {t("database.testConnection")}
                </Button>
              </CardBody>
            </Card>
          )}

          {/* SEO 设置 - 仅在SEO标签页显示 */}
          {activeTab === "seo" && (
            <Card className="shadow-lg hover:shadow-xl transition-all rounded-xl border border-default-200 dark:border-default-800">
              <CardHeader className="border-b border-default-200 dark:border-default-800 pb-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-default-900 dark:text-default-50">
                    {t("seo.title")}
                  </h2>
                  <p className="text-sm text-default-600 dark:text-default-400">
                    {t("seo.description")}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-8 p-6">
                <div>
                  <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                    {t("seo.metaTitle")}
                  </label>
                  <Input
                    placeholder={t("seo.metaTitlePlaceholder")}
                    defaultValue="TrendHub - Fashion E-commerce Platform"
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                    {t("seo.metaDescription")}
                  </label>
                  <Textarea
                    placeholder={t("seo.metaDescriptionPlaceholder")}
                    defaultValue={t("seo.defaultMetaDescription")}
                    variant="bordered"
                    radius="md"
                    minRows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
                    {t("seo.keywords")}
                  </label>
                  <Input
                    placeholder={t("seo.keywordsPlaceholder")}
                    defaultValue="fashion, trend, shopping, ecommerce, platform"
                    variant="bordered"
                    radius="md"
                    className="w-full"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* 这里可以添加更多的标签页内容 */}

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              variant="flat"
              color="default"
              radius="md"
              className="transition-all duration-300"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              color="primary"
              radius="md"
              className="transition-all duration-300 shadow-md shadow-primary/20"
            >
              {t("actions.saveChanges")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
