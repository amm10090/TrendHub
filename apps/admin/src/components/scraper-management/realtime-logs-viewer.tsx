"use client";

import { ScraperLogLevel } from "@prisma/client";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  InfoIcon,
  AlertTriangle,
  XIcon,
  RefreshCw,
  WifiOff,
  Wifi,
  Download,
  Play,
  Pause,
  SkipBack,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useRef, useCallback } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LogEntry {
  id: string;
  level: ScraperLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface ConnectionInfo {
  executionId: string;
  timestamp: string;
  taskName: string;
  taskSite: string;
}

interface RealtimeLogsViewerProps {
  executionId: string;
  taskName: string;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
}

type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

export function RealtimeLogsViewer({
  executionId,
  taskName,
  onClose,
  onStatusChange,
}: RealtimeLogsViewerProps) {
  const t = useTranslations(
    "scraperManagement.executionsTab.realtimeLogsViewer",
  );

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("CONNECTING");
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  const maxRetries = 5;
  const retryDelay = 1000;

  // 格式化时间戳
  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Invalid Date";
    return format(date, "HH:mm:ss.SSS");
  };

  // 获取日志级别徽章
  const getLevelBadge = (level: ScraperLogLevel) => {
    switch (level) {
      case "ERROR":
        return (
          <Badge variant="destructive" className="mr-2 h-6">
            <AlertCircle className="mr-1 h-3 w-3" /> ERROR
          </Badge>
        );
      case "WARN":
        return (
          <Badge
            variant="secondary"
            className="mr-2 h-6 bg-amber-500 text-white"
          >
            <AlertTriangle className="mr-1 h-3 w-3" /> WARN
          </Badge>
        );
      case "INFO":
        return (
          <Badge variant="secondary" className="mr-2 h-6">
            <InfoIcon className="mr-1 h-3 w-3" /> INFO
          </Badge>
        );
      case "DEBUG":
        return (
          <Badge variant="outline" className="mr-2 h-6">
            DEBUG
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="mr-2 h-6">
            {level}
          </Badge>
        );
    }
  };

  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "CONNECTED":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "CONNECTING":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "DISCONNECTED":
      case "ERROR":
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  // 过滤日志
  const filterLogs = useCallback(
    (allLogs: LogEntry[]) => {
      if (filterLevel === "all") {
        return allLogs;
      }
      return allLogs.filter((log) => log.level === filterLevel);
    },
    [filterLevel],
  );

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [autoScroll]);

  // 创建EventSource连接
  const createEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams({
      executionId,
      ...(filterLevel !== "all" && { level: filterLevel }),
      ...(includeContext && { includeContext: "true" }),
      ...(lastEventId && { lastEventId }),
    });

    const eventSource = new EventSource(
      `/api/admin/scraper-tasks/logs/stream?${params.toString()}`,
    );

    eventSourceRef.current = eventSource;
    setConnectionStatus("CONNECTING");
    setError(null);

    // 连接成功
    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data) as ConnectionInfo;
      setConnectionInfo(data);
      setConnectionStatus("CONNECTED");
      retryCount.current = 0;
      console.log("Connected to realtime logs:", data);
    });

    // 接收新日志
    eventSource.addEventListener("logs", (event) => {
      if (isPaused) return;

      const newLogs = JSON.parse(event.data) as LogEntry[];
      setLogs((prev) => [...prev, ...newLogs]);

      // 更新最后事件ID
      if (newLogs.length > 0) {
        setLastEventId(newLogs[newLogs.length - 1].id);
      }
    });

    // 状态更新
    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      console.log("Status update:", data);
      onStatusChange?.(data.status);

      if (data.isFinished) {
        setConnectionStatus("DISCONNECTED");
        eventSource.close();
      }
    });

    // 错误处理
    eventSource.addEventListener("error", (event) => {
      const data = JSON.parse(event.data);
      setError(data.message);
      console.error("SSE error:", data);
    });

    // 连接关闭
    eventSource.addEventListener("close", (event) => {
      const data = JSON.parse(event.data);
      console.log("Connection closed:", data.reason);
      setConnectionStatus("DISCONNECTED");
    });

    // 处理连接错误
    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setConnectionStatus("ERROR");

      // 自动重连
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        const delay = retryDelay * Math.pow(2, retryCount.current - 1); // 指数退避

        reconnectTimeoutRef.current = setTimeout(() => {
          createEventSource();
        }, delay);
      } else {
        setError("连接失败，已达到最大重试次数");
      }
    };

    return eventSource;
  }, [
    executionId,
    filterLevel,
    includeContext,
    lastEventId,
    isPaused,
    onStatusChange,
  ]);

  // 手动重连
  const handleReconnect = () => {
    retryCount.current = 0;
    createEventSource();
  };

  // 清空日志
  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  // 导出日志
  const handleExportLogs = () => {
    const logsToExport = filteredLogs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      ...(log.context && { context: log.context }),
    }));

    const blob = new Blob([JSON.stringify(logsToExport, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scraper-logs-${executionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 初始化连接
  useEffect(() => {
    createEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [createEventSource]);

  // 过滤日志
  useEffect(() => {
    setFilteredLogs(filterLogs(logs));
  }, [logs, filterLogs]);

  // 自动滚动
  useEffect(() => {
    if (filteredLogs.length > 0) {
      scrollToBottom();
    }
  }, [filteredLogs, scrollToBottom]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t("title")}: {taskName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {connectionInfo && (
          <div className="text-sm text-muted-foreground">
            {t("taskSite")}: {connectionInfo.taskSite} • {t("executionId")}:{" "}
            {executionId.substring(0, 8)}...
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* 控制面板 */}
        <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className="text-sm font-medium">
              {t(`connectionStatus.${connectionStatus.toLowerCase()}`)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allLevels")}</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="include-context"
                checked={includeContext}
                onCheckedChange={setIncludeContext}
              />
              <Label htmlFor="include-context" className="text-sm">
                {t("controls.includeContext")}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll" className="text-sm">
                {t("controls.autoScroll")}
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {isPaused ? t("controls.resume") : t("controls.pause")}
            </Button>

            <Button variant="outline" size="sm" onClick={handleClearLogs}>
              <SkipBack className="h-4 w-4" />
              {t("controls.clear")}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download className="h-4 w-4" />
              {t("controls.export")}
            </Button>

            {connectionStatus === "ERROR" && (
              <Button variant="outline" size="sm" onClick={handleReconnect}>
                <RefreshCw className="h-4 w-4" />
                {t("controls.reconnect")}
              </Button>
            )}
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* 日志内容 */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {connectionStatus === "CONNECTING"
                ? t("status.connecting")
                : t("status.noLogs")}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.id}-${index}`}
                  className={`p-3 rounded-md border ${
                    log.level === "ERROR"
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-950/50"
                      : log.level === "WARN"
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-950/50"
                        : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {getLevelBadge(log.level)}
                    </div>
                    <time className="text-xs text-muted-foreground font-mono">
                      {formatDateTime(log.timestamp)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm mb-2 font-mono">
                    {log.message}
                  </p>
                  {log.context && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="context" className="border-t-0">
                        <AccordionTrigger className="py-2 text-xs">
                          {t("logEntry.context")}
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="p-2 rounded bg-muted text-xs overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 状态栏 */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            {t("status.totalLogs", { count: filteredLogs.length })}
            {filterLevel !== "all" && (
              <span className="ml-2">
                ({t("status.filtered", { level: filterLevel })})
              </span>
            )}
          </div>

          {isPaused && (
            <div className="text-sm text-amber-600 font-medium">
              {t("status.paused")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
