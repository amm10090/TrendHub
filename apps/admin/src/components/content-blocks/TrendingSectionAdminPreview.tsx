"use client";

// import { Control } from "react-hook-form"; // Unused
// import { ContentBlockFormValues } from "./ContentBlockForm"; // Unused
import { PlusCircle, Edit3 } from "lucide-react";
import Image from "next/image";

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

export const TrendingSectionAdminPreview: React.FC<
  TrendingSectionAdminPreviewProps
> = ({ items, onSelectSlot, t }) => {
  const renderSlot = (
    slotKey: string,
    className?: string,
    aspectRatio?: string,
    isImageOnly = false,
  ) => {
    const result = findItemBySlotKey(slotKey, items);
    const item = result?.item;
    const itemIndex = result?.index;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectSlot(slotKey, itemIndex);
      }
    };

    return (
      <div
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-center p-4 relative group hover:border-blue-500 transition-colors cursor-pointer",
          className,
          aspectRatio,
        )}
        onClick={() => onSelectSlot(slotKey, itemIndex)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={t("visualEditor.selectSlot", {
          slotName: t(`slotKeys.${slotKey}`) || slotKey,
        })}
        data-slot-key={slotKey}
      >
        {item && item.data ? (
          <>
            <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Edit3 size={16} />
            </div>
            {item.data.imageUrl ? (
              <Image
                src={item.data.imageUrl as string}
                alt={(item.data.title as string) || slotKey}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                {t("visualEditor.noImage")}
                <br />
                {(item.data.title as string) || t("visualEditor.unnamedItem")}
              </span>
            )}
            {!isImageOnly && item.data.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                {item.data.title as string}
              </div>
            )}
          </>
        ) : (
          <>
            <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-gray-500 text-sm">
              {t("visualEditor.addItemToSlotPlaceholderNamed", {
                slotName: t(`slotKeys.${slotKey}`) || slotKey,
              })}
            </span>
          </>
        )}
        {item && (
          <span className="absolute top-0 left-0 bg-gray-700 text-white text-xs px-1 py-0.5 rounded-br-md opacity-70">
            {item.name}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-8">
      <p className="text-sm text-gray-600 mb-4">
        {t("visualEditor.previewDescription")}
      </p>

      {/* First Group (Top Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 md:row-span-2">
          {renderSlot(
            PREDEFINED_SLOTS.MAIN_LARGE_LEFT,
            "min-h-[300px] lg:min-h-[400px]",
            "aspect-[4/3]",
          )}
        </div>
        <div className="flex flex-col gap-4 lg:col-start-3">
          {renderSlot(
            PREDEFINED_SLOTS.SLOT_TOP_RIGHT_IMAGE,
            "min-h-[150px] flex-1 lg:min-h-0",
            "aspect-[16/9]",
            true,
          )}
          {renderSlot(
            PREDEFINED_SLOTS.SLOT_BOTTOM_RIGHT_IMAGE,
            "min-h-[150px] flex-1 lg:min-h-0",
            "aspect-[16/9]",
            true,
          )}
        </div>
      </div>

      {/* Second Group (Bottom Section - visually mimics frontend's second block) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          {renderSlot(
            PREDEFINED_SLOTS.SLOT_NEXT_TOP_LEFT_IMAGE,
            "min-h-[150px] flex-1 lg:min-h-0",
            "aspect-[16/9]",
            true,
          )}
          {renderSlot(
            PREDEFINED_SLOTS.SLOT_NEXT_BOTTOM_LEFT_IMAGE,
            "min-h-[150px] flex-1 lg:min-h-0",
            "aspect-[16/9]",
            true,
          )}
        </div>
        <div className="lg:col-span-2 md:row-span-2 lg:col-start-2">
          {renderSlot(
            PREDEFINED_SLOTS.MAIN_LARGE_RIGHT,
            "min-h-[300px] lg:min-h-[400px]",
            "aspect-[4/3]",
          )}
        </div>
      </div>
    </div>
  );
};
