import { useTranslations } from "next-intl";

import { DbConnectionStatus } from "@/lib/services/settings-service";

interface DatabaseConnectionStatusProps {
  status: DbConnectionStatus | null;
}

export function DatabaseConnectionStatus({
  status,
}: DatabaseConnectionStatusProps) {
  const t = useTranslations("settings");

  if (!status) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        status.isConnected
          ? "bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/30"
          : "bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/30"
      } transition-all duration-300`}
    >
      <div
        className={`w-2.5 h-2.5 rounded-full animate-pulse ${
          status.isConnected
            ? "bg-success-500 dark:bg-success-400"
            : "bg-danger-500 dark:bg-danger-400"
        }`}
      />
      <span>
        {status.isConnected
          ? t("database.connected")
          : t("database.disconnected")}
      </span>
      {status.isConnected && status.latency && (
        <span className="text-xs opacity-80 whitespace-nowrap">
          {status.latency}ms
        </span>
      )}
    </div>
  );
}
