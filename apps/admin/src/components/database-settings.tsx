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
import { useState } from "react";

import {
  DbConnectionStatus,
  SettingsService,
} from "@/lib/services/settings-service";

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

  // 测试数据库连接
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await SettingsService.testDatabaseConnection();

      if (response.data) {
        setConnectionStatus(response.data);

        // 显示连接状态提示
        addToast({
          title: response.data.isConnected ? "连接成功" : "连接失败",
          description: response.data.message,
          variant: "solid",
          color: response.data.isConnected ? "success" : "danger",
          timeout: 3000,
          classNames: {
            base: `bg-gradient-to-r ${
              response.data.isConnected
                ? "from-success-500/90 to-success-600/90 dark:from-success-600/90 dark:to-success-700/90 border-success-500/20"
                : "from-danger-500/90 to-danger-600/90 dark:from-danger-600/90 dark:to-danger-700/90 border-danger-500/20"
            } 
              border dark:border-opacity-20 backdrop-blur-lg shadow-lg rounded-lg`,
            wrapper: "rounded-lg",
            title: "text-white dark:text-white font-medium text-base",
            description: "text-white/90 dark:text-white/90 text-sm",
            closeButton:
              "text-white/80 hover:text-white dark:text-white/80 dark:hover:text-white absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200 rounded-lg hover:bg-white/10",
            progressIndicator: "bg-white/30 dark:bg-white/20 rounded-lg",
          },
          radius: "lg",
          shouldShowTimeoutProgress: true,
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 rounded-2xl border border-default-200/50 dark:border-default-800/50 backdrop-blur-sm">
      <CardHeader className="border-b border-default-200/50 dark:border-default-800/50 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-default-900 dark:text-default-50">
              {t("database.title")}
            </h2>
            <DatabaseConnectionStatus status={connectionStatus} />
          </div>
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
            value={getSettingValue("dbHost", "db.trendhub.com")}
            onChange={(e) => handleFieldChange("dbHost", e.target.value)}
            variant="bordered"
            radius="md"
            className="w-full hover:border-primary-400 focus:border-primary-500 dark:hover:border-primary-600 dark:focus:border-primary-500 transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div>
            <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
              {t("database.name")}
            </label>
            <Input
              placeholder="my_database"
              value={getSettingValue("dbName", "trendhub_production")}
              onChange={(e) => handleFieldChange("dbName", e.target.value)}
              variant="bordered"
              radius="md"
              className="w-full hover:border-primary-400 focus:border-primary-500 dark:hover:border-primary-600 dark:focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
              {t("database.port")}
            </label>
            <Input
              placeholder="3306"
              value={getSettingValue("dbPort", "5432")}
              onChange={(e) => handleFieldChange("dbPort", e.target.value)}
              variant="bordered"
              radius="md"
              className="w-full hover:border-primary-400 focus:border-primary-500 dark:hover:border-primary-600 dark:focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div>
            <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
              {t("database.user")}
            </label>
            <Input
              placeholder="username"
              value={getSettingValue("dbUser", "trendhub_admin")}
              onChange={(e) => handleFieldChange("dbUser", e.target.value)}
              variant="bordered"
              radius="md"
              className="w-full hover:border-primary-400 focus:border-primary-500 dark:hover:border-primary-600 dark:focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-default-700 dark:text-default-300 mb-2">
              {t("database.password")}
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={getSettingValue("dbPassword", "••••••••••••")}
              onChange={(e) => handleFieldChange("dbPassword", e.target.value)}
              variant="bordered"
              radius="md"
              className="w-full hover:border-primary-400 focus:border-primary-500 dark:hover:border-primary-600 dark:focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-4">
          <Switch
            defaultSelected={getSettingValue("dbUseSSL", "true") === "true"}
            onChange={(isSelected) =>
              handleFieldChange("dbUseSSL", isSelected.toString())
            }
            id="db-ssl"
            color="primary"
          />
          <label
            htmlFor="db-ssl"
            className="text-default-700 dark:text-default-300 text-sm cursor-pointer"
          >
            {t("database.useSSL")}
          </label>
        </div>
        <div className="flex gap-4">
          <Button
            color="primary"
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            radius="md"
            isLoading={isTestingConnection}
            onPress={testConnection}
            startContent={
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            }
          >
            {isTestingConnection
              ? t("database.testingConnection")
              : t("database.testConnection")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
