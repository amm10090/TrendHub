"use client";

// import { Control } from "react-hook-form"; // Unused
// import { ContentBlockFormValues } from "./ContentBlockForm"; // Unused
import { PlusCircle, Edit3, Eye, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ContentItemFormValues } from "./ContentBlockForm";

interface TrendingSectionAdminPreviewProps {
  items: ContentItemFormValues[];
  onSelectSlot: (slotKey: string, itemIndex?: number) => void;
  t: (key: string, values?: object) => string;
}

const findItemBySlotKey = (
  slotKey: string,
  currentItems: ContentItemFormValues[],
): { item: ContentItemFormValues; index: number } | null => {
  if (!currentItems || currentItems.length === 0) {
    return null;
  }
  const foundIndex = currentItems.findIndex((it) => it.slotKey === slotKey);

  if (foundIndex !== -1) {
    return { item: currentItems[foundIndex], index: foundIndex };
  }

  return null;
};

const PREDEFINED_SLOTS = {
  MAIN_LARGE_LEFT: "trending_main_large_left",
  SLOT_TOP_RIGHT_IMAGE: "trending_slot_top_right_image",
  SLOT_BOTTOM_RIGHT_IMAGE: "trending_slot_bottom_right_image",
  MAIN_LARGE_RIGHT: "trending_main_large_right",
  SLOT_NEXT_TOP_LEFT_IMAGE: "trending_slot_next_top_left_image",
  SLOT_NEXT_BOTTOM_LEFT_IMAGE: "trending_slot_next_bottom_left_image",
};

// 模拟前端的 TrendingCard 组件
const TrendingCardPreview: React.FC<{
  item: ContentItemFormValues | null;
  slotKey: string;
  className?: string;
  onEdit: () => void;
  isEditMode: boolean;
  t: (key: string, values?: object) => string;
  isLargeCard?: boolean;
}> = ({
  item,
  slotKey,
  className,
  onEdit,
  isEditMode,
  t,
  isLargeCard = false,
}) => {
  if (!item || !item.data) {
    // 空槽位占位符
    return (
      <div
        className={cn(
          "group relative border-2 border-dashed border-muted-foreground/30 bg-muted/10 rounded-xl",
          "hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer",
          "flex flex-col items-center justify-center p-6 text-center",
          className,
        )}
        onClick={onEdit}
        onKeyDown={(e) => e.key === "Enter" && onEdit()}
        tabIndex={0}
        role="button"
      >
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
          <PlusCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {t("visualEditor.addItemToSlotPlaceholderNamed", {
            slotName: t(`slotKeys.${slotKey}`) || slotKey,
          })}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {t("visualEditor.clickToAddContent")}
        </p>
      </div>
    );
  }

  const data = item.data;
  const displayTitle =
    data.dataItemTitleText || data.itemTitleText || data.title;
  const displaySubtitle = data.dataLabelText || data.labelText || data.subtitle;
  const imageUrl = data.imageUrl as string;
  const hideDescription = data.hideDescription !== false;
  const textPlacement = data.textPlacement || "overlay";
  const textPosition = data.textPosition || "bottom";
  const topLabel = data.topLabel;

  // 对于大卡片，使用覆盖式布局
  if (isLargeCard || textPlacement === "overlay") {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl cursor-pointer bg-gray-100 dark:bg-gray-800",
          className,
        )}
        onClick={onEdit}
        onKeyDown={(e) => e.key === "Enter" && onEdit()}
        tabIndex={0}
        role="button"
      >
        {/* 编辑模式控制 */}
        {isEditMode && (
          <>
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm shadow-sm"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 z-10 text-xs bg-background/90 backdrop-blur-sm"
            >
              {t(`slotKeys.${slotKey}`) || slotKey}
            </Badge>
          </>
        )}

        {/* 图片 */}
        <div className="relative w-full h-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayTitle || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          {/* 高端渐变遮罩 - 更细腻的层次感 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-85" />

          {/* 微妙的边框高光效果 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />

          {/* 内容覆盖 */}
          <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 lg:p-10">
            {/* Top Label */}
            {topLabel && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center w-auto max-w-[calc(100%-3rem)]">
                <span className="text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-[0.25em] text-white bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-md px-4 py-1.5 rounded-full whitespace-nowrap font-medium border border-white/30 shadow-lg shadow-black/50">
                  {topLabel}
                </span>
              </div>
            )}

            {/* 根据 textPosition 定位内容 */}
            {textPosition === "center" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white max-w-lg mx-auto">
                  {/* 高端排版设计 */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light tracking-tight leading-[1.1] mb-4 sm:mb-6">
                      <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                        {displayTitle}
                      </span>
                    </h3>
                    {displaySubtitle && (
                      <div className="relative">
                        <div className="w-12 h-[1px] bg-white/40 mx-auto mb-4" />
                        <p className="text-sm sm:text-base font-light opacity-90 tracking-wide leading-relaxed">
                          {displaySubtitle}
                        </p>
                      </div>
                    )}
                  </div>

                  {!hideDescription && data.description && (
                    <div className="mb-6 sm:mb-8">
                      <p className="text-xs sm:text-sm font-light opacity-80 tracking-wide leading-relaxed line-clamp-3 max-w-md mx-auto">
                        {data.description}
                      </p>
                    </div>
                  )}

                  {/* 精致的CTA按钮 */}
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-light uppercase tracking-[0.2em] text-white/90 border border-white/30 px-6 sm:px-8 py-3 sm:py-4 rounded-none backdrop-blur-sm">
                    <span>{t("trending.discover_more")}</span>
                    <span className="text-[10px]">→</span>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-grow" />
                <div className="flex flex-col items-center text-white text-center p-0">
                  <div className="w-full text-center mb-4 sm:mb-6">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight leading-[1.1] mb-3 sm:mb-4">
                      <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                        {displayTitle}
                      </span>
                    </h3>

                    {displaySubtitle && (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-[1px] bg-white/40 mb-3" />
                        <p className="text-sm sm:text-base font-light opacity-85 tracking-wide leading-relaxed max-w-sm">
                          {displaySubtitle}
                        </p>
                      </div>
                    )}
                  </div>

                  {!hideDescription && data.description && (
                    <div className="w-full text-center mb-6 sm:mb-8">
                      <p className="text-xs sm:text-sm font-light opacity-75 tracking-wide leading-relaxed line-clamp-2 max-w-md mx-auto">
                        {data.description}
                      </p>
                    </div>
                  )}

                  {/* 底部CTA按钮 - 更精致的设计 */}
                  <div className="w-full text-center">
                    <span className="inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-white/80 border-b border-white/30 pb-1">
                      <span>{t("trending.discover_more")}</span>
                      <span className="text-[10px]">→</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 非覆盖式布局（below-image, above-image）
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl cursor-pointer bg-white dark:bg-gray-800 shadow-sm",
        "hover:shadow-lg transition-all",
        className,
      )}
      onClick={onEdit}
      onKeyDown={(e) => e.key === "Enter" && onEdit()}
      tabIndex={0}
      role="button"
    >
      {/* 编辑模式控制 */}
      {isEditMode && (
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        className={`flex flex-col h-full ${textPlacement === "above-image" ? "flex-col-reverse" : "flex-col"}`}
      >
        {/* 图片部分 */}
        <div className="relative flex-grow overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayTitle || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {topLabel && textPlacement !== "above-image" && (
            <div className="absolute top-4 left-0 right-0 text-center">
              <span className="text-xs uppercase tracking-wider text-white bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-lg shadow-black/50">
                {topLabel}
              </span>
            </div>
          )}
        </div>

        {/* 文本部分 */}
        <div
          className={`p-4 ${textPlacement === "above-image" ? "pb-2" : "pt-4"} text-center`}
        >
          <h3 className="text-lg font-bold mb-1">{displayTitle}</h3>
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground mb-2">
              {displaySubtitle}
            </p>
          )}
          {!hideDescription && data.description && (
            <>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {data.description}
              </p>
              <span className="text-sm font-medium text-primary hover:underline inline-block mt-3">
                {t("trending.discover_more")}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrendingSectionAdminPreview: React.FC<
  TrendingSectionAdminPreviewProps
> = ({ items, onSelectSlot, t }) => {
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  // 获取中间文本区域的数据
  const getTextAreaData = (topSlotKey: string, bottomSlotKey: string) => {
    const topResult = findItemBySlotKey(topSlotKey, items);
    const bottomResult = findItemBySlotKey(bottomSlotKey, items);

    // 标签文字来自上方卡片的标题
    const labelText = topResult?.item?.data?.title;
    const labelLink = topResult?.item?.data?.href;

    // 主标题文字来自下方卡片的标题
    const titleText = bottomResult?.item?.data?.title;
    const titleLink = bottomResult?.item?.data?.href;

    return { labelText, labelLink, titleText, titleLink };
  };

  // 仅渲染图片的槽位
  const renderImageOnlySlot = (slotKey: string, className?: string) => {
    const result = findItemBySlotKey(slotKey, items);
    const item = result?.item;
    const itemIndex = result?.index;

    if (!item || !item.data) {
      if (previewMode === "preview") return null;

      return (
        <div
          className={cn(
            "group relative border-2 border-dashed border-muted-foreground/30 bg-muted/10 rounded-xl",
            "hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer",
            "flex items-center justify-center",
            className,
          )}
          onClick={() => onSelectSlot(slotKey)}
          onKeyDown={(e) => e.key === "Enter" && onSelectSlot(slotKey)}
          tabIndex={0}
          role="button"
        >
          <div className="text-center p-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("visualEditor.clickToAddImage")}
            </p>
          </div>
        </div>
      );
    }

    const handleClick = () => onSelectSlot(slotKey, itemIndex);
    const imageUrl = item.data.imageUrl as string;

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl cursor-pointer",
          "hover:shadow-lg transition-all",
          className,
        )}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        tabIndex={0}
        role="button"
      >
        {previewMode === "edit" && (
          <>
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 z-10 text-xs bg-background/90 backdrop-blur-sm"
            >
              {t(`slotKeys.${slotKey}`) || slotKey}
            </Badge>
          </>
        )}

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.data.title || "Image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
      </div>
    );
  };

  // 渲染中间文本区域
  const renderTextArea = (topSlotKey: string, bottomSlotKey: string) => {
    const { labelText, titleText } = getTextAreaData(topSlotKey, bottomSlotKey);

    if (previewMode === "preview" && !labelText && !titleText) {
      return (
        <div className="min-h-[100px] sm:min-h-[130px] max-h-[100px] sm:max-h-[130px]" />
      );
    }

    return (
      <div className="flex flex-col justify-center items-center text-center min-h-[100px] sm:min-h-[130px] max-h-[100px] sm:max-h-[130px] bg-background rounded-xl p-4 overflow-hidden">
        {labelText && (
          <div className="mb-1 sm:mb-2 flex-shrink-0">
            <span className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground font-semibold line-clamp-1">
              {labelText}
            </span>
          </div>
        )}
        {titleText && (
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight line-clamp-2 flex-grow flex items-center">
            <span className="text-center w-full">{titleText}</span>
          </h3>
        )}
        {!labelText && !titleText && previewMode === "edit" && (
          <p className="text-sm text-muted-foreground">
            {t("visualEditor.textAreaPlaceholder")}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {t("visualEditor.trendingPreviewTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {previewMode === "edit"
              ? t("visualEditor.editModeDescription")
              : t("visualEditor.previewModeDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={previewMode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("edit")}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {t("visualEditor.editMode")}
          </Button>
          <Button
            type="button"
            variant={previewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("preview")}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {t("visualEditor.previewMode")}
          </Button>
        </div>
      </div>

      {/* 主要内容区域 - 完全复刻前端布局 */}
      <div className="w-full bg-[#f5f5f5] dark:bg-gray-900 rounded-2xl p-4 sm:p-6 mx-auto">
        <div className="container px-4 sm:px-6 mx-auto">
          {/* 第一组布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 左侧大卡片 */}
            <div className="lg:row-span-2 h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px]">
              <TrendingCardPreview
                item={
                  findItemBySlotKey(PREDEFINED_SLOTS.MAIN_LARGE_LEFT, items)
                    ?.item || null
                }
                slotKey={PREDEFINED_SLOTS.MAIN_LARGE_LEFT}
                className="w-full h-full"
                onEdit={() =>
                  onSelectSlot(
                    PREDEFINED_SLOTS.MAIN_LARGE_LEFT,
                    findItemBySlotKey(PREDEFINED_SLOTS.MAIN_LARGE_LEFT, items)
                      ?.index,
                  )
                }
                isEditMode={previewMode === "edit"}
                t={t}
                isLargeCard={true}
              />
            </div>

            {/* 右侧网格 */}
            <div className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] gap-y-4">
              {renderImageOnlySlot(
                PREDEFINED_SLOTS.SLOT_TOP_RIGHT_IMAGE,
                "w-full h-full",
              )}
              {renderTextArea(
                PREDEFINED_SLOTS.SLOT_TOP_RIGHT_IMAGE,
                PREDEFINED_SLOTS.SLOT_BOTTOM_RIGHT_IMAGE,
              )}
              {renderImageOnlySlot(
                PREDEFINED_SLOTS.SLOT_BOTTOM_RIGHT_IMAGE,
                "w-full h-full",
              )}
            </div>
          </div>

          {/* 第二组布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧网格 */}
            <div className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] gap-y-4 lg:order-last">
              {renderImageOnlySlot(
                PREDEFINED_SLOTS.SLOT_NEXT_TOP_LEFT_IMAGE,
                "w-full h-full",
              )}
              {renderTextArea(
                PREDEFINED_SLOTS.SLOT_NEXT_TOP_LEFT_IMAGE,
                PREDEFINED_SLOTS.SLOT_NEXT_BOTTOM_LEFT_IMAGE,
              )}
              {renderImageOnlySlot(
                PREDEFINED_SLOTS.SLOT_NEXT_BOTTOM_LEFT_IMAGE,
                "w-full h-full",
              )}
            </div>

            {/* 右侧大卡片 */}
            <div className="lg:row-span-2 h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] lg:order-first">
              <TrendingCardPreview
                item={
                  findItemBySlotKey(PREDEFINED_SLOTS.MAIN_LARGE_RIGHT, items)
                    ?.item || null
                }
                slotKey={PREDEFINED_SLOTS.MAIN_LARGE_RIGHT}
                className="w-full h-full"
                onEdit={() =>
                  onSelectSlot(
                    PREDEFINED_SLOTS.MAIN_LARGE_RIGHT,
                    findItemBySlotKey(PREDEFINED_SLOTS.MAIN_LARGE_RIGHT, items)
                      ?.index,
                  )
                }
                isEditMode={previewMode === "edit"}
                t={t}
                isLargeCard={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 底部编辑提示 */}
      {previewMode === "edit" && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                {t("visualEditor.editingTips.title")}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t("visualEditor.editingTips.addNew")}</li>
                <li>• {t("visualEditor.editingTips.editExisting")}</li>
                <li>• {t("visualEditor.editingTips.togglePreview")}</li>
                <li>• {t("visualEditor.editingTips.autoSave")}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
