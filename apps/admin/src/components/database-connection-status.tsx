import { DbConnectionStatus } from "@/lib/services/settings-service";

interface DatabaseConnectionStatusProps {
  status: DbConnectionStatus | null;
}

export function DatabaseConnectionStatus({
  status,
}: DatabaseConnectionStatusProps) {
  if (!status) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        status.isConnected
          ? "bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400"
          : "bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          status.isConnected
            ? "bg-success-500 dark:bg-success-400"
            : "bg-danger-500 dark:bg-danger-400"
        }`}
      />
      <span>{status.message}</span>
      {status.isConnected && status.latency && (
        <span className="text-xs text-success-600 dark:text-success-400">
          ({status.latency}ms)
        </span>
      )}
    </div>
  );
}
