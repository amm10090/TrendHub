import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  addToast,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

import { DbConnectionStatus } from "@/lib/services/settings-service";

import { DatabaseConnectionStatus } from "./database-connection-status";

interface DatabaseSettingsProps {
  getSettingValue: (key: string, defaultValue?: string) => string;
  handleFieldChange: (key: string, value: string) => void;
}

export function DatabaseSettings({
  getSettingValue,
  handleFieldChange,
}: DatabaseSettingsProps) {
  const t = useTranslations("settings");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<DbConnectionStatus | null>(null);

  // 用于存储表单引用
  const hostInputRef = useRef<HTMLInputElement>(null);
  const portInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const sslSwitchRef = useRef<HTMLInputElement>(null);

  // 初始化数据库配置默认值
  useEffect(() => {
    const initDefaultValues = async () => {
      // 检查是否已经有设置值
      const hostValue = getSettingValue("dbHost", "");

      if (!hostValue) {
        // 如果没有设置值，设置为环境变量中的默认配置
        handleFieldChange("dbHost", "localhost");
        handleFieldChange("dbPort", "5432");
        handleFieldChange("dbName", "trendhub_production");
        handleFieldChange("dbUser", "trendhub_admin");
        handleFieldChange("dbPassword", "admin12345");
        handleFieldChange("dbUseSSL", "false");
      }
    };

    initDefaultValues();
  }, [getSettingValue, handleFieldChange]);

  // 测试数据库连接 - 使用当前表单值
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // 直接从表单中获取当前值
      const formSettings = {
        dbHost:
          hostInputRef.current?.value || getSettingValue("dbHost", "localhost"),
        dbPort:
          portInputRef.current?.value || getSettingValue("dbPort", "5432"),
        dbName:
          nameInputRef.current?.value ||
          getSettingValue("dbName", "trendhub_production"),
        dbUser:
          userInputRef.current?.value ||
          getSettingValue("dbUser", "trendhub_admin"),
        dbPassword:
          passwordInputRef.current?.value || getSettingValue("dbPassword", ""),
        dbUseSSL: sslSwitchRef.current?.checked ? "true" : "false",
      };

      // 覆盖默认设置服务的行为，直接调用API进行测试
      const response = await fetch("/api/settings/test-db-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: formSettings.dbHost,
          port: formSettings.dbPort,
          database: formSettings.dbName,
          user: formSettings.dbUser,
          password: formSettings.dbPassword,
          ssl: formSettings.dbUseSSL === "true",
        }),
      });

      const data = await response.json();

      if (data.data) {
        setConnectionStatus(data.data);

        // 显示连接状态提示
        addToast({
          title: data.data.isConnected ? "连接成功" : "连接失败",
          description: data.data.message,
          variant: "solid",
          color: "success",
          timeout: 3000,
          classNames: {},
          shouldShowTimeoutProgress: true,
        });
      }
    } catch (error) {
      addToast({
        title: "连接测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "solid",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="shadow-lg shadow-gray-500/5 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              {t("database.title")}
            </h2>
            <div className="text-sm text-green-600 dark:text-green-400 pl-2">
              <DatabaseConnectionStatus status={connectionStatus} />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("database.description")}
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-8 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("database.host")}
          </label>
          <Input
            placeholder="localhost"
            value={getSettingValue("dbHost", "localhost")}
            onChange={(e) => handleFieldChange("dbHost", e.target.value)}
            variant="bordered"
            radius="md"
            ref={hostInputRef}
            className="w-full hover:border-blue-600 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("database.name")}
            </label>
            <Input
              placeholder="trendhub_production"
              value={getSettingValue("dbName", "trendhub_production")}
              onChange={(e) => handleFieldChange("dbName", e.target.value)}
              variant="bordered"
              radius="md"
              ref={nameInputRef}
              className="w-full hover:border-blue-600 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("database.port")}
            </label>
            <Input
              placeholder="5432"
              value={getSettingValue("dbPort", "5432")}
              onChange={(e) => handleFieldChange("dbPort", e.target.value)}
              variant="bordered"
              radius="md"
              ref={portInputRef}
              className="w-full hover:border-blue-600 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("database.user")}
            </label>
            <Input
              placeholder="trendhub_admin"
              value={getSettingValue("dbUser", "trendhub_admin")}
              onChange={(e) => handleFieldChange("dbUser", e.target.value)}
              variant="bordered"
              radius="md"
              ref={userInputRef}
              className="w-full hover:border-blue-600 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("database.password")}
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={getSettingValue("dbPassword", "")}
              onChange={(e) => handleFieldChange("dbPassword", e.target.value)}
              variant="bordered"
              radius="md"
              ref={passwordInputRef}
              className="w-full hover:border-blue-600 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-4">
          <Switch
            defaultSelected={getSettingValue("dbUseSSL", "false") === "true"}
            onChange={(isSelected) =>
              handleFieldChange("dbUseSSL", isSelected.toString())
            }
            id="db-ssl"
            ref={sslSwitchRef}
            color="primary"
            className="data-[selected=true]:bg-blue-600"
          />
          <label
            htmlFor="db-ssl"
            className="text-gray-700 dark:text-gray-300 text-sm cursor-pointer"
          >
            {t("database.useSSL")}
          </label>
        </div>
        <div className="flex gap-4">
          <Button
            color="default"
            variant="solid"
            size="lg"
            className="bg-gradient-to-tr from-blue-500 to-blue-800 text-white shadow-lg rounded-full"
            radius="full"
            isLoading={isTestingConnection}
            onPress={testConnection}
            startContent={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            }
          >
            <span className="font-medium">
              {isTestingConnection
                ? t("database.testingConnection")
                : t("database.testConnection")}
            </span>
          </Button>
        </div>

        {connectionStatus && connectionStatus.isConnected && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>上次连接成功，延迟：{connectionStatus.latency}ms</span>
          </div>
        )}

        {connectionStatus &&
          !connectionStatus.isConnected &&
          connectionStatus.error && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                错误详情：
              </h3>
              <pre className="mt-1 text-xs text-red-600 dark:text-red-300 overflow-auto max-h-32">
                {connectionStatus.error}
              </pre>
            </div>
          )}
      </CardBody>
    </Card>
  );
}
