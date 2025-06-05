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
 * Image uploader component (Modal)
 * Used to select, preview and upload images to the server.
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
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!validTypes.includes(selectedFile.type.toLowerCase())) {
        setError(
          `Invalid image format. Supported formats: JPG, PNG, GIF, WebP, SVG`,
        );

        return false;
      }

      // Validate file size
      if (selectedFile.size > maxSizeBytes) {
        setError(`Image size cannot exceed ${maxSizeMb}MB`);

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
        setAltText(selectedFile.name.split(".").slice(0, -1).join(".")); // Default alt text is filename without extension

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
      e.target.value = ""; // Allow selecting the same file again
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
        throw new Error(data.error || "Upload failed");
      }
      onImageUpload(data.url, altText || file.name);
      handleClose(); // Close and reset after success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upload",
      );
    } finally {
      setUploading(false);
    }
  }, [file, altText, onImageUpload, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {preview ? (
            <div className="space-y-4">
              <div className="relative group w-full aspect-video flex items-center justify-center bg-muted rounded-md overflow-hidden">
                <NextImage
                  src={preview}
                  alt="Image preview"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-md"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm} // Only reset form, don't close modal
                  className="absolute top-2 right-2 bg-background/70 text-foreground rounded-full p-1 opacity-50 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label htmlFor="alt-text" className="text-sm font-medium">
                  Alt Text
                </Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g.: A beautiful landscape"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a description for the image to help with SEO and
                  accessibility.
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
              aria-label="Click or drag image here to upload"
            >
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <p className="text-sm text-foreground">
                  Click or drag image here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPG, PNG, GIF, WebP, SVG (max {maxSizeMb}MB)
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
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
