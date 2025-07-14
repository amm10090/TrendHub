"use client";

import {
  Play,
  Square,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 抓取任务接口
interface FMTCScraperTask {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  cronExpression?: string;
  lastExecutedAt?: string;
  nextExecuteAt?: string;
  executions: FMTCScraperExecution[];
  createdAt: string;
  updatedAt: string;
}

// 执行记录接口
interface FMTCScraperExecution {
  id: string;
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt?: string;
  completedAt?: string;
  merchantsCount: number;
  newMerchantsCount: number;
  updatedMerchantsCount: number;
  errorMessage?: string;
  metrics?: Record<string, unknown>;
}

// 抓取任务统计接口
interface FMTCScraperStats {
  enabledTasks: number;
  runningTasks: number;
  completedToday: number;
  failedToday: number;
}

interface FMTCScraperPanelProps {
  onStatsUpdate: (stats: FMTCScraperStats) => void;
  refreshTrigger: number;
}

export function FMTCScraperPanel({
  onStatsUpdate,
  refreshTrigger,
}: FMTCScraperPanelProps) {
  const t = useTranslations();

  // 状态管理
  const [tasks, setTasks] = useState<FMTCScraperTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<FMTCScraperTask | null>(
    null,
  );

  // 模态框状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stopConfirmTask, setStopConfirmTask] = useState<string | null>(null);

  // 操作状态管理
  const [taskActionLoading, setTaskActionLoading] = useState<{
    [taskId: string]: string | null;
  }>({});
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);

  // 表单状态
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    isEnabled: true,
    cronExpression: "",
    maxPages: 10,
    maxMerchants: 500,
    includeDetails: true,
    downloadImages: false,
    username: "",
    password: "",
  });

  // 获取抓取任务列表
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/fmtc-merchants/scraper");

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setTasks(result.data.tasks);
          onStatsUpdate(result.data.stats);
        }
      }
    } catch (error) {
      console.error("获取抓取任务失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onStatsUpdate]);

  // 创建抓取任务
  const handleCreateTask = async () => {
    if (creatingTask) return;

    setCreatingTask(true);
    toast.loading(t("fmtcMerchants.scraper.actions.creating"), {
      id: "create-task",
    });

    try {
      const response = await fetch("/api/fmtc-merchants/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_task",
          taskData: {
            name: taskForm.name,
            description: taskForm.description,
            isEnabled: taskForm.isEnabled,
            cronExpression: taskForm.cronExpression || null,
            credentials: {
              username: taskForm.username,
              password: taskForm.password,
            },
            config: {
              maxPages: taskForm.maxPages,
              maxMerchantsPerRun: taskForm.maxMerchants,
              includeDetails: taskForm.includeDetails,
              downloadImages: taskForm.downloadImages,
            },
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(t("fmtcMerchants.scraper.messages.createSuccess"), {
          id: "create-task",
        });
        setIsCreateModalOpen(false);
        resetForm();
        await fetchTasks();
      } else {
        const errorMessage =
          result.error || t("fmtcMerchants.scraper.messages.operationFailed");

        toast.error(errorMessage, { id: "create-task" });
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      toast.error(t("fmtcMerchants.scraper.messages.networkError"), {
        id: "create-task",
      });
    } finally {
      setCreatingTask(false);
    }
  };

  // 更新任务
  const handleUpdateTask = async () => {
    if (!selectedTask || updatingTask) return;

    setUpdatingTask(true);
    toast.loading(t("fmtcMerchants.scraper.actions.updating"), {
      id: "update-task",
    });

    try {
      const response = await fetch("/api/fmtc-merchants/scraper", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          updates: {
            name: taskForm.name,
            description: taskForm.description,
            isEnabled: taskForm.isEnabled,
            cronExpression: taskForm.cronExpression || null,
            credentials: taskForm.password
              ? {
                  username: taskForm.username,
                  password: taskForm.password,
                }
              : taskForm.username && !taskForm.password
                ? {
                    username: taskForm.username,
                    password:
                      ((selectedTask.credentials as Record<string, unknown>)
                        ?.password as string) || "",
                  }
                : undefined,
            config: {
              maxPages: taskForm.maxPages,
              maxMerchantsPerRun: taskForm.maxMerchants,
              includeDetails: taskForm.includeDetails,
              downloadImages: taskForm.downloadImages,
            },
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(t("fmtcMerchants.scraper.messages.updateSuccess"), {
          id: "update-task",
        });
        setIsEditModalOpen(false);
        setSelectedTask(null);
        resetForm();
        await fetchTasks();
      } else {
        const errorMessage =
          result.error || t("fmtcMerchants.scraper.messages.operationFailed");

        toast.error(errorMessage, { id: "update-task" });
      }
    } catch (error) {
      console.error("更新任务失败:", error);
      toast.error(t("fmtcMerchants.scraper.messages.networkError"), {
        id: "update-task",
      });
    } finally {
      setUpdatingTask(false);
    }
  };

  // 处理停止任务的确认
  const handleStopConfirm = (taskId: string) => {
    setStopConfirmTask(taskId);
  };

  // 执行停止任务
  const executeStopTask = async () => {
    if (!stopConfirmTask) return;
    await handleTaskAction(stopConfirmTask, "stop");
    setStopConfirmTask(null);
  };

  // 执行任务操作
  const handleTaskAction = async (taskId: string, action: string) => {
    // 防止重复操作
    if (taskActionLoading[taskId]) {
      return;
    }

    // 设置加载状态
    setTaskActionLoading((prev) => ({ ...prev, [taskId]: action }));

    try {
      // 显示操作开始的提示
      const actionText =
        {
          start: t("fmtcMerchants.scraper.actions.starting"),
          stop: t("fmtcMerchants.scraper.actions.stopping"),
          enable: t("fmtcMerchants.scraper.actions.enabling"),
          disable: t("fmtcMerchants.scraper.actions.disabling"),
          reset: t("fmtcMerchants.scraper.actions.resetting"),
        }[action] || t("fmtcMerchants.scraper.actions.executing");

      toast.loading(actionText, { id: `task-${taskId}-${action}` });

      const response = await fetch(`/api/fmtc-merchants/scraper/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 成功提示
        const successText =
          {
            start: t("fmtcMerchants.scraper.messages.startSuccess"),
            stop: t("fmtcMerchants.scraper.messages.stopSuccess"),
            enable: t("fmtcMerchants.scraper.messages.enableSuccess"),
            disable: t("fmtcMerchants.scraper.messages.disableSuccess"),
            reset: t("fmtcMerchants.scraper.messages.resetSuccess"),
          }[action] || t("fmtcMerchants.scraper.messages.operationSuccess");

        toast.success(successText, { id: `task-${taskId}-${action}` });

        // 刷新任务列表
        await fetchTasks();
      } else {
        // 错误提示
        const errorMessage =
          result.error || t("fmtcMerchants.scraper.messages.operationFailed");

        toast.error(errorMessage, { id: `task-${taskId}-${action}` });
      }
    } catch (error) {
      console.error("任务操作失败:", error);
      toast.error(t("fmtcMerchants.scraper.messages.networkError"), {
        id: `task-${taskId}-${action}`,
      });
    } finally {
      // 清除加载状态
      setTaskActionLoading((prev) => {
        const newState = { ...prev };

        delete newState[taskId];

        return newState;
      });
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t("fmtcMerchants.scraper.confirmDelete"))) return;

    if (deletingTask) return;

    setDeletingTask(taskId);
    toast.loading(t("fmtcMerchants.scraper.actions.deleting"), {
      id: `delete-task-${taskId}`,
    });

    try {
      const response = await fetch(
        `/api/fmtc-merchants/scraper?taskId=${taskId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(t("fmtcMerchants.scraper.messages.deleteSuccess"), {
          id: `delete-task-${taskId}`,
        });
        await fetchTasks();
      } else {
        const errorMessage =
          result.error || t("fmtcMerchants.scraper.messages.operationFailed");

        toast.error(errorMessage, { id: `delete-task-${taskId}` });
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      toast.error(t("fmtcMerchants.scraper.messages.networkError"), {
        id: `delete-task-${taskId}`,
      });
    } finally {
      setDeletingTask(null);
    }
  };

  // 重置表单
  const resetForm = () => {
    setTaskForm({
      name: "",
      description: "",
      isEnabled: true,
      cronExpression: "",
      maxPages: 10,
      maxMerchants: 500,
      includeDetails: true,
      downloadImages: false,
      username: "",
      password: "",
    });
  };

  // 打开编辑模态框
  const openEditModal = (task: FMTCScraperTask) => {
    setSelectedTask(task);

    // 从任务配置中读取实际值，如果不存在则使用默认值
    const config = task.config || {};
    const credentials = task.credentials || {};

    setTaskForm({
      name: task.name,
      description: task.description || "",
      isEnabled: task.isEnabled,
      cronExpression: task.cronExpression || "",
      maxPages: config.maxPages || config.maxPagesPerRun || 10,
      maxMerchants: config.maxMerchants || config.maxMerchantsPerRun || 500,
      includeDetails: config.includeDetails !== false,
      downloadImages: config.downloadImages || false,
      username: credentials.username || "",
      password: "", // 出于安全考虑，不显示已保存的密码
    });
    setIsEditModalOpen(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RUNNING":
        return <Play className="h-3 w-3" />;
      case "COMPLETED":
        return <CheckCircle className="h-3 w-3" />;
      case "FAILED":
        return <XCircle className="h-3 w-3" />;
      case "CANCELLED":
        return <Square className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {t("fmtcMerchants.scraper.title")}
        </h2>
        <div className="flex space-x-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("fmtcMerchants.scraper.createTask")}
          </Button>
          <Button variant="outline" onClick={fetchTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">{t("common.loading")}</div>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                {t("fmtcMerchants.scraper.noTasks")}
              </div>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const latestExecution = task.executions[0];
            const isRunning = latestExecution?.status === "RUNNING";

            return (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{task.name}</span>
                        <div className="flex items-center space-x-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              task.isEnabled ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {task.isEnabled
                              ? t("common.enabled")
                              : t("common.disabled")}
                          </span>
                        </div>
                      </CardTitle>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isRunning ? (
                        <AlertDialog
                          open={stopConfirmTask === task.id}
                          onOpenChange={(open) => {
                            if (!open) setStopConfirmTask(null);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStopConfirm(task.id)}
                              disabled={!!taskActionLoading[task.id]}
                            >
                              {taskActionLoading[task.id] === "stop" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t(
                                  "fmtcMerchants.scraper.messages.confirmStop",
                                )}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t(
                                  "fmtcMerchants.scraper.messages.confirmStopMessage",
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("common.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={executeStopTask}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("fmtcMerchants.scraper.actions.stop")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleTaskAction(task.id, "start")}
                          disabled={
                            !task.isEnabled || !!taskActionLoading[task.id]
                          }
                        >
                          {taskActionLoading[task.id] === "start" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isRunning || deletingTask === task.id}
                      >
                        {deletingTask === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t("fmtcMerchants.scraper.lastRun")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.lastExecutedAt
                          ? formatDate(task.lastExecutedAt)
                          : t("common.never")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t("fmtcMerchants.scraper.nextRun")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.nextExecuteAt
                          ? formatDate(task.nextExecuteAt)
                          : task.cronExpression || t("common.manual")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t("common.columns.status")}
                      </p>
                      {latestExecution ? (
                        <Badge
                          className={cn(
                            getStatusColor(latestExecution.status),
                            "transition-all duration-200",
                            isRunning && "animate-pulse",
                          )}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(latestExecution.status)}
                            <span>
                              {t(
                                `fmtcMerchants.scraper.status.${latestExecution.status.toLowerCase()}`,
                                { fallback: latestExecution.status },
                              )}
                            </span>
                            {taskActionLoading[task.id] && (
                              <Loader2 className="h-3 w-3 animate-spin ml-1" />
                            )}
                          </div>
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t("common.noData")}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t("fmtcMerchants.scraper.merchants")}
                      </p>
                      {latestExecution ? (
                        <p className="text-sm text-muted-foreground">
                          {latestExecution.merchantsCount} (
                          {latestExecution.newMerchantsCount} {t("common.new")})
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  {/* 执行进度 */}
                  {isRunning && (
                    <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {t("fmtcMerchants.scraper.progress")}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm text-muted-foreground">
                            {t("fmtcMerchants.scraper.running")}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={65}
                        className="h-2 transition-all duration-300"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {taskActionLoading[task.id]
                            ? t(
                                `fmtcMerchants.scraper.actions.${taskActionLoading[task.id]}`,
                              )
                            : t("fmtcMerchants.scraper.running")}
                        </span>
                        <span>65%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 创建任务模态框 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("fmtcMerchants.scraper.createTask")}</DialogTitle>
            <DialogDescription>
              {t("fmtcMerchants.scraper.createTaskDescription")}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{t("common.basic")}</TabsTrigger>
              <TabsTrigger value="credentials">
                {t("fmtcMerchants.scraper.credentials")}
              </TabsTrigger>
              <TabsTrigger value="config">{t("common.config")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("common.name")}</Label>
                  <Input
                    id="name"
                    value={taskForm.name}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, name: e.target.value })
                    }
                    placeholder={t("fmtcMerchants.scraper.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("common.description")}</Label>
                  <Textarea
                    id="description"
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    placeholder={t(
                      "fmtcMerchants.scraper.descriptionPlaceholder",
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={taskForm.isEnabled}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, isEnabled: checked })
                    }
                  />
                  <Label htmlFor="enabled">{t("common.enabled")}</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cron">
                    {t("fmtcMerchants.scraper.cronExpression")}
                  </Label>
                  <Input
                    id="cron"
                    value={taskForm.cronExpression}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        cronExpression: e.target.value,
                      })
                    }
                    placeholder="0 2 * * * (每天凌晨2点)"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {t("fmtcMerchants.scraper.username")}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={taskForm.username}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t("fmtcMerchants.scraper.password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={taskForm.password}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, password: e.target.value })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPages">
                    {t("fmtcMerchants.scraper.maxPages")}
                  </Label>
                  <Input
                    id="maxPages"
                    type="number"
                    min="1"
                    max="100"
                    value={taskForm.maxPages}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        maxPages: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMerchants">
                    {t("fmtcMerchants.scraper.maxMerchants")}
                  </Label>
                  <Input
                    id="maxMerchants"
                    type="number"
                    min="1"
                    max="10000"
                    value={taskForm.maxMerchants}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        maxMerchants: parseInt(e.target.value) || 500,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeDetails"
                    checked={taskForm.includeDetails}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, includeDetails: checked })
                    }
                  />
                  <Label htmlFor="includeDetails">
                    {t("fmtcMerchants.scraper.includeDetails")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="downloadImages"
                    checked={taskForm.downloadImages}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, downloadImages: checked })
                    }
                  />
                  <Label htmlFor="downloadImages">
                    {t("fmtcMerchants.scraper.downloadImages")}
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!taskForm.name || !taskForm.username || creatingTask}
            >
              {creatingTask ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("fmtcMerchants.scraper.actions.creating")}
                </>
              ) : (
                t("common.create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑任务模态框 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("fmtcMerchants.scraper.editTask")}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{t("common.basic")}</TabsTrigger>
              <TabsTrigger value="credentials">
                {t("fmtcMerchants.scraper.credentials")}
              </TabsTrigger>
              <TabsTrigger value="config">{t("common.config")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t("common.name")}</Label>
                  <Input
                    id="edit-name"
                    value={taskForm.name}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    {t("common.description")}
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enabled"
                    checked={taskForm.isEnabled}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, isEnabled: checked })
                    }
                  />
                  <Label htmlFor="edit-enabled">{t("common.enabled")}</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cron">
                    {t("fmtcMerchants.scraper.cronExpression")}
                  </Label>
                  <Input
                    id="edit-cron"
                    value={taskForm.cronExpression}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        cronExpression: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">
                    {t("fmtcMerchants.scraper.username")}
                  </Label>
                  <Input
                    id="edit-username"
                    type="text"
                    value={taskForm.username}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, username: e.target.value })
                    }
                    placeholder="请输入用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    {t("fmtcMerchants.scraper.password")}
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={taskForm.password}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, password: e.target.value })
                    }
                    placeholder="请输入密码"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-maxPages">
                    {t("fmtcMerchants.scraper.maxPages")}
                  </Label>
                  <Input
                    id="edit-maxPages"
                    type="number"
                    min="1"
                    max="100"
                    value={taskForm.maxPages}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        maxPages: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxMerchants">
                    {t("fmtcMerchants.scraper.maxMerchants")}
                  </Label>
                  <Input
                    id="edit-maxMerchants"
                    type="number"
                    min="1"
                    max="10000"
                    value={taskForm.maxMerchants}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        maxMerchants: parseInt(e.target.value) || 500,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-includeDetails"
                    checked={taskForm.includeDetails}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, includeDetails: checked })
                    }
                  />
                  <Label htmlFor="edit-includeDetails">
                    {t("fmtcMerchants.scraper.includeDetails")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-downloadImages"
                    checked={taskForm.downloadImages}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, downloadImages: checked })
                    }
                  />
                  <Label htmlFor="edit-downloadImages">
                    {t("fmtcMerchants.scraper.downloadImages")}
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateTask} disabled={updatingTask}>
              {updatingTask ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("fmtcMerchants.scraper.actions.updating")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情模态框 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.name}</DialogTitle>
            <DialogDescription>
              {t("fmtcMerchants.scraper.taskDetails")}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t("common.columns.status")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTask.isEnabled
                      ? t("common.enabled")
                      : t("common.disabled")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t("fmtcMerchants.scraper.cronExpression")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTask.cronExpression || t("common.manual")}
                  </p>
                </div>
              </div>

              {/* 执行历史 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">
                  {t("fmtcMerchants.scraper.executionHistory")}
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.columns.status")}</TableHead>
                        <TableHead>{t("common.startTime")}</TableHead>
                        <TableHead>{t("common.duration")}</TableHead>
                        <TableHead>
                          {t("fmtcMerchants.scraper.merchants")}
                        </TableHead>
                        <TableHead>{t("common.errors.error")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTask.executions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            {t("fmtcMerchants.scraper.noExecutions")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedTask.executions.map((execution) => (
                          <TableRow key={execution.id}>
                            <TableCell>
                              <Badge
                                className={getStatusColor(execution.status)}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(execution.status)}
                                  <span>
                                    {t(
                                      `fmtcMerchants.scraper.status.${execution.status.toLowerCase()}`,
                                      { fallback: execution.status },
                                    )}
                                  </span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {execution.startedAt
                                ? formatDate(execution.startedAt)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {execution.startedAt && execution.completedAt
                                ? `${Math.round(
                                    (new Date(execution.completedAt).getTime() -
                                      new Date(execution.startedAt).getTime()) /
                                      1000,
                                  )}s`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {execution.merchantsCount} (
                              {execution.newMerchantsCount} {t("common.new")})
                            </TableCell>
                            <TableCell>
                              {execution.errorMessage ? (
                                <span className="text-sm text-red-600">
                                  {execution.errorMessage}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
