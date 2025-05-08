import { UploadCloud, X } from "lucide-react";
import NextImage from "next/image";
import React, { useState, useCallback } from "react";

import { ImageUploader } from "@/components/image-uploader/ImageUploader"; // 确保路径正确
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSizeMb?: number; // 传递给 ImageUploader
}

/**
 * 图片上传字段组件
 * 提供一个输入框显示URL，一个上传按钮触发ImageUploader模态框，并显示预览。
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = "图片URL",
  className,
  disabled = false,
  maxSizeMb = 5,
}) => {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const handleImageUploaded = useCallback(
    (url: string) => {
      // altText 在这里可以被忽略，因为此字段主要关心URL
      // 如果需要存储altText，则需要修改onChange的签名和父组件的state
      onChange(url);
      setIsUploaderOpen(false);
    },
    [onChange],
  );

  const handleRemoveImage = useCallback(() => {
    onChange(null); // 设置URL为null或空字符串以移除图片
  }, [onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={label.replace(/\s+/g, "-").toLowerCase()}>
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Input
          id={label ? label.replace(/\s+/g, "-").toLowerCase() : undefined}
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)} // 允许手动输入/粘贴URL
          disabled={disabled}
          className="flex-grow"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsUploaderOpen(true)}
          disabled={disabled}
          title="上传图片"
        >
          <UploadCloud className="h-4 w-4" />
        </Button>
      </div>
      {value && (
        <div className="mt-2 relative group w-full max-w-xs h-32 bg-muted rounded-md overflow-hidden">
          <NextImage
            src={value}
            alt={label || "已上传图片"}
            fill
            style={{ objectFit: "contain" }}
            className="rounded-md"
            onError={(e) => {
              // 处理图片加载失败的情况，例如显示占位符或隐藏图片
              const imgElement = e.target as HTMLImageElement;

              imgElement.style.display = "none";
              //  可以考虑在这里调用 onChange(null) 来清除无效的URL
            }}
          />
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 bg-background/70 text-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="移除图片"
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <ImageUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImageUpload={handleImageUploaded}
        maxSizeMb={maxSizeMb}
      />
    </div>
  );
};
