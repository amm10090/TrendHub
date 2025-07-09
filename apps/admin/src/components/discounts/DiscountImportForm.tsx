"use client";

import { Loader2, Upload, Eye, Download, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FMTCDiscountData,
  fmtcParserService,
  ParseStats,
} from "@/lib/services/fmtc-parser.service";

import { DiscountPreviewTable } from "./DiscountPreviewTable";
import { FileUploader } from "./FileUploader";

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: "idle" | "parsing" | "importing" | "completed" | "error";
}

interface DiscountImportFormProps {
  onSuccess?: () => void;
}

export function DiscountImportForm({
  onSuccess,
}: DiscountImportFormProps = {}) {
  const t = useTranslations("discounts.import");
  const router = useRouter();
  const [importMode, setImportMode] = useState<"paste" | "file">("paste");
  const [pastedContent, setPastedContent] = useState("");
  const [previewData, setPreviewData] = useState<FMTCDiscountData[]>([]);
  const [parseStats, setParseStats] = useState<ParseStats | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: "idle",
  });

  // 预览解析结果
  const handlePreview = async () => {
    if (!pastedContent.trim()) {
      toast.error(t("messages.pasteRequired"));

      return;
    }

    setIsPreviewLoading(true);
    setImportProgress((prev) => ({ ...prev, status: "parsing" }));

    try {
      const { data, stats } =
        await fmtcParserService.parsePastedContent(pastedContent);
      const validated = fmtcParserService.validateDiscountData(data);

      setPreviewData(validated.validData);
      setParseStats(stats);
      setValidationErrors(validated.errors);

      if (validated.errors.length > 0) {
        toast.warning(
          t("messages.parseWarning", { count: validated.errors.length }),
        );
      } else {
        toast.success(
          t("messages.parseSuccess", { count: validated.validData.length }),
        );
      }
    } catch {
      toast.error(t("messages.parseError"));
      setValidationErrors([t("messages.validationError")]);
    } finally {
      setIsPreviewLoading(false);
      setImportProgress((prev) => ({ ...prev, status: "idle" }));
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error(t("messages.noDataToImport"));

      return;
    }

    setImportProgress({
      total: previewData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      status: "importing",
    });

    try {
      const response = await fetch("/api/discounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discounts: previewData,
          source: "FMTC_MANUAL",
          importType: importMode.toUpperCase(),
          rawContent: pastedContent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportProgress({
          total: result.total || previewData.length,
          processed: result.total || previewData.length,
          successful: result.imported || 0,
          failed: result.errors || 0,
          status: "completed",
        });

        toast.success(t("messages.importSuccess", { count: result.imported }));

        // 导入成功后调用回调或跳转
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          setTimeout(() => {
            router.push("/discounts");
          }, 3000);
        }
      } else {
        throw new Error(result.error || t("messages.importError"));
      }
    } catch {
      setImportProgress((prev) => ({ ...prev, status: "error" }));
      toast.error(t("messages.importRetry"));
    }
  };

  // 文件上传处理
  const handleFileUpload = async (file: File) => {
    setIsPreviewLoading(true);

    try {
      const content = await file.text();

      setPastedContent(content);
      setImportMode("file");

      // 自动解析文件内容
      await handlePreview();
    } catch {
      toast.error(t("messages.fileReadError"));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 下载示例文件
  const downloadExample = () => {
    const exampleData = `Merchant\tDeal\tCode\tUpdated\tStart\tEnd\tRating
Gap CA\t"not started Extra 20% Off Purchase"\tADDON\t06/25/25 10:45am PDT\t06/25/25 12:00pm PDT\t07/03/25 11:59pm PDT\t24.5
Gap US\t"not started Extra 15% Off Purchase"\tADDON\t06/25/25 10:40am PDT\t06/25/25 12:00pm PDT\t07/03/25 11:59pm PDT\t24.5
Dermstore (US)\t"new Express shipping with orders $100+"\tSHIP\t06/25/25 10:07am PDT\t06/25/25 10:04am PDT\t07/14/25 10:01am PDT\t22.7`;

    const blob = new Blob([exampleData], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "fmtc-example.tsv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 导入模式选择 */}
          <Tabs
            value={importMode}
            onValueChange={(v) => setImportMode(v as "paste" | "file")}
          >
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="paste">{t("pasteContent")}</TabsTrigger>
                <TabsTrigger value="file">{t("fileUpload")}</TabsTrigger>
              </TabsList>

              <Button variant="outline" size="sm" onClick={downloadExample}>
                <Download className="w-4 h-4 mr-2" />
                {t("downloadSample")}
              </Button>
            </div>

            <TabsContent value="paste" className="space-y-4">
              <div>
                <Label htmlFor="pastedContent">{t("pasteLabel")}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("pasteDescription")}
                </p>
                <Textarea
                  id="pastedContent"
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder={t("pastePlaceholder")}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handlePreview}
                disabled={!pastedContent.trim() || isPreviewLoading}
                className="w-full"
              >
                {isPreviewLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {t("previewResults")}
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <FileUploader
                accept=".csv,.tsv,.txt"
                onUpload={handleFileUpload}
                loading={isPreviewLoading}
              />
            </TabsContent>
          </Tabs>

          {/* 解析统计 */}
          {parseStats && (
            <Alert>
              <AlertDescription>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    {t("stats.total")}: <strong>{parseStats.totalLines}</strong>{" "}
                    {t("stats.lines")}
                  </span>
                  <span>
                    {t("stats.success")}:{" "}
                    <strong className="text-green-600">
                      {parseStats.parsedCount}
                    </strong>{" "}
                    {t("stats.items")}
                  </span>
                  <span>
                    {t("stats.error")}:{" "}
                    <strong className="text-red-600">
                      {parseStats.errorCount}
                    </strong>{" "}
                    {t("stats.items")}
                  </span>
                  <span>
                    {t("stats.skipped")}:{" "}
                    <strong className="text-yellow-600">
                      {parseStats.skippedCount}
                    </strong>{" "}
                    {t("stats.items")}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 验证错误 */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{t("validation.title")}</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>
                        {t("stats.moreErrors", {
                          count: validationErrors.length - 5,
                        })}
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 导入进度 */}
          {importProgress.status !== "idle" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{t("importProgress")}</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      importProgress.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {importProgress.status === "parsing" && t("status.parsing")}
                    {importProgress.status === "importing" &&
                      t("status.importing")}
                    {importProgress.status === "completed" &&
                      t("status.completed")}
                    {importProgress.status === "error" && t("status.failed")}
                  </Badge>
                </div>
              </div>

              {importProgress.total > 0 && (
                <>
                  <Progress
                    value={
                      (importProgress.processed / importProgress.total) * 100
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {importProgress.processed} / {importProgress.total}
                    </span>
                    <span>
                      {t("progress.success", {
                        successful: importProgress.successful,
                      })}{" "}
                      |{" "}
                      {t("progress.failed", { failed: importProgress.failed })}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览区域 */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {t("previewData")} ({previewData.length} {t("stats.items")})
                </CardTitle>
                <CardDescription>{t("previewDescription")}</CardDescription>
              </div>

              <Button
                onClick={handleImport}
                disabled={
                  importProgress.status === "importing" ||
                  previewData.length === 0
                }
                size="lg"
              >
                {importProgress.status === "importing" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {t("confirmImport")} ({previewData.length} {t("stats.items")})
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <DiscountPreviewTable data={previewData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
