import { ImageIcon, X } from "lucide-react";
import NextImage from "next/image"; // 使用 NextImage 以便区分 HTMLImageElement
import React, { useState, useCallback, ChangeEvent, DragEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // 假设这是您的 shadcn/ui Dialog 组件
import { Input } from "@/components/ui/input"; // 假设这是您的 shadcn/ui Input 组件
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpload: (url: string, altText?: string) => void; // altText 是可选的
  maxSizeMb?: number;
}

/**
 * 图片上传组件 (Modal)
 * 用于选择、预览图片并将其上传到服务器。
 */
export function ImageUploader({
  isOpen,
  onClose,
  onImageUpload,
  maxSizeMb = 5,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const resetForm = useCallback(() => {
    setFile(null);
    setPreview(null);
    setAltText("");
    setError(null);
    setUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const validateFile = useCallback(
    (selectedFile: File): boolean => {
      // 验证文件类型
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!validTypes.includes(selectedFile.type.toLowerCase())) {
        setError(`图片格式无效。支持的格式: JPG, PNG, GIF, WebP, SVG`);

        return false;
      }

      // 验证文件大小
      if (selectedFile.size > maxSizeBytes) {
        setError(`图片大小不能超过 ${maxSizeMb}MB`);

        return false;
      }

      return true;
    },
    [maxSizeBytes, maxSizeMb],
  );

  const processFile = useCallback(
    (selectedFile: File) => {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setError(null);
        setAltText(selectedFile.name.split(".").slice(0, -1).join(".")); // 默认 alt 为文件名 (不含扩展名)

        const reader = new FileReader();

        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    },
    [validateFile, setFile, setError, setAltText, setPreview],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (selectedFile) {
        processFile(selectedFile);
      }
      e.target.value = ""; // 允许重复选择相同文件
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "上传失败");
      }
      onImageUpload(data.url, altText || file.name);
      handleClose(); // 成功后关闭并重置
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传过程中发生错误");
    } finally {
      setUploading(false);
    }
  }, [file, altText, onImageUpload, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>上传图片</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {preview ? (
            <div className="space-y-4">
              <div className="relative group w-full aspect-video flex items-center justify-center bg-muted rounded-md overflow-hidden">
                <NextImage
                  src={preview}
                  alt="图片预览"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-md"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm} // 只重置表单，不关闭弹窗
                  className="absolute top-2 right-2 bg-background/70 text-foreground rounded-full p-1 opacity-50 group-hover:opacity-100 transition-opacity"
                  title="移除图片"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label htmlFor="alt-text" className="text-sm font-medium">
                  描述文本 (Alt Text)
                </Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="例如：一只可爱的猫咪"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  为图片提供描述，有助于SEO和可访问性。
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-md p-6 text-center hover:border-primary transition-colors cursor-pointer min-h-60"
              onClick={() =>
                document.getElementById("image-uploader-input")?.click()
              }
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  document.getElementById("image-uploader-input")?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="点击或拖拽图片到此处上传"
            >
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <p className="text-sm text-foreground">点击或拖拽图片到此处</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 JPG, PNG, GIF, WebP, SVG (最大 {maxSizeMb}MB)
                </p>
              </div>
              <Input
                id="image-uploader-input"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleFileChange}
              />
            </div>
          )}

          {error && (
            <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "上传中..." : "上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
