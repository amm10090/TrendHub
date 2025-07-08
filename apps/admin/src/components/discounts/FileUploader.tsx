"use client";

import { Upload, File, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  accept?: string;
  onUpload: (file: File) => void | Promise<void>;
  loading?: boolean;
  maxSize?: number; // bytes
}

export function FileUploader({
  accept = ".csv,.tsv,.txt",
  onUpload,
  loading = false,
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploaderProps) {
  const t = useTranslations("discounts.import.fileUploader");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFileType = (file: File) => {
    const acceptedTypes = [".csv", ".tsv", ".txt"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    return acceptedTypes.includes(extension);
  };

  const handleFile = useCallback(
    async (file: File) => {
      // 文件类型检查
      if (!isValidFileType(file)) {
        toast.error(t("unsupportedFileType"));

        return;
      }

      // 文件大小检查
      if (file.size > maxSize) {
        toast.error(
          t("fileTooLarge", { size: Math.round(maxSize / 1024 / 1024) }),
        );

        return;
      }

      setSelectedFile(file);

      try {
        await onUpload(file);
      } catch {
        toast.error(t("uploadFailed"));
        setSelectedFile(null);
      }
    },
    [onUpload, maxSize],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loading) {
        setIsDragActive(true);
        setIsDragReject(false);
      }
    },
    [loading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setIsDragReject(false);

      if (loading) return;

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 0) {
        const file = files[0];

        await handleFile(file);
      }
    },
    [loading, handleFile],
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleClick = () => {
    if (!loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {!selectedFile ? (
        <Card
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors duration-200",
            isDragActive && !isDragReject && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            loading && "opacity-50 cursor-not-allowed",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "p-3 rounded-full",
                  isDragActive && !isDragReject && "bg-primary/10",
                  isDragReject && "bg-destructive/10",
                )}
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload
                    className={cn(
                      "w-8 h-8",
                      isDragActive && !isDragReject && "text-primary",
                      isDragReject && "text-destructive",
                      !isDragActive && "text-muted-foreground",
                    )}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="text-lg font-medium">
                  {isDragReject
                    ? t("unsupportedFileTypeTitle")
                    : t("dragFileHere")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("orText")}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    disabled={loading}
                  >
                    {t("clickToSelect")}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("supportedFormats")} |{" "}
                  {t("maxSize", { size: Math.round(maxSize / 1024 / 1024) })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{selectedFile.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)} • {t("uploadedAt")}{" "}
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {!loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {loading && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("processing")}
            </div>
          )}
        </Card>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          <strong>{t("supportedFormatsTitle")}</strong>
        </div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>CSV:</strong> {t("csvDescription")}
          </li>
          <li>
            <strong>TSV:</strong> {t("tsvDescription")}
          </li>
          <li>
            <strong>TXT:</strong> {t("txtDescription")}
          </li>
        </ul>
      </div>
    </div>
  );
}
