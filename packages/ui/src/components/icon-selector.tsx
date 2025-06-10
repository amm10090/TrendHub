import * as React from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import {
  iconCategories,
  getAllIconNames,
  searchIcons,
  getIconComponent,
  getIconDisplayName,
} from "../lib/icons";
import { Button } from "./button";
import { Input } from "./input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog";

export interface IconSelectorTranslations {
  title: string;
  searchPlaceholder: string;
  allIcons: string;
  selectedPrefix: string;
  noIconsFound: string;
  iconCount: string; // 支持 {count} 占位符
  cancel: string;
  confirm: string;
  placeholder: string;
}

export interface IconSelectorProps {
  value?: string;
  onChange: (iconKey: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  translations?: IconSelectorTranslations;
}

export interface IconSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (iconKey: string) => void;
  currentValue?: string;
  translations: IconSelectorTranslations;
}

// 显示 icon 的组件
const IconDisplay: React.FC<{ iconName: string; size?: number }> = ({
  iconName,
  size = 20,
}) => {
  const IconComponent = getIconComponent(iconName);

  if (!IconComponent) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-400 dark:text-gray-500"
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className="text-gray-700 dark:text-gray-300"
    />
  );
};

// Icon 选择模态框
const IconSelectorModal: React.FC<IconSelectorModalProps> = ({
  open,
  onOpenChange,
  onSelect,
  currentValue,
  translations,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedIcon, setSelectedIcon] = React.useState<string>(
    currentValue || "",
  );

  // 获取当前显示的 icons
  const displayIcons = React.useMemo(() => {
    if (selectedCategory === "all") {
      return searchTerm ? searchIcons(searchTerm) : getAllIconNames();
    } else {
      const category = iconCategories.find(
        (cat) => cat.name === selectedCategory,
      );
      const categoryIcons = category ? category.icons : [];
      return searchTerm
        ? categoryIcons.filter((icon) =>
            icon.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : categoryIcons;
    }
  }, [searchTerm, selectedCategory]);

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelect(selectedIcon);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] max-w-[90vw] h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* 固定头部 */}
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-white dark:bg-gray-900">
          <DialogTitle>{translations.title}</DialogTitle>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 搜索和分类选择 - 固定区域 */}
          <div className="flex flex-col sm:flex-row gap-3 p-6 pb-4 border-b shrink-0 bg-white dark:bg-gray-900">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={translations.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[140px]"
            >
              <option value="all">{translations.allIcons}</option>
              {iconCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* 当前选中的图标 - 固定区域 */}
          {selectedIcon && (
            <div className="flex items-center gap-3 p-3 mx-6 my-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shrink-0">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {translations.selectedPrefix}
              </span>
              <IconDisplay iconName={selectedIcon} size={24} />
              <span className="text-sm font-medium dark:text-white flex-1 truncate">
                {getIconDisplayName(selectedIcon)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIcon("")}
                className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Icon 网格 - 可滚动区域 */}
          <div
            className="overflow-y-auto px-6 pb-6"
            style={{ height: "400px" }}
          >
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 py-2">
              {displayIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    "min-h-[60px] text-center",
                    selectedIcon === iconName &&
                      "bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500",
                  )}
                  title={getIconDisplayName(iconName)}
                >
                  <IconDisplay iconName={iconName} size={20} />
                  <span className="text-xs truncate w-full dark:text-gray-300 leading-tight">
                    {getIconDisplayName(iconName)}
                  </span>
                </button>
              ))}
            </div>

            {displayIcons.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {translations.noIconsFound}
              </div>
            )}

            {/* 显示图标总数信息 */}
            {displayIcons.length > 0 && (
              <div className="text-center py-3 text-xs text-gray-500 dark:text-gray-400 border-t mt-4">
                {translations.iconCount.replace(
                  "{count}",
                  displayIcons.length.toString(),
                )}
              </div>
            )}
          </div>
        </div>

        {/* 固定底部 */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-white dark:bg-gray-900">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translations.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedIcon}>
            {translations.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 默认翻译 (中文)
const defaultTranslations: IconSelectorTranslations = {
  title: "选择图标",
  searchPlaceholder: "搜索图标...",
  allIcons: "所有图标",
  selectedPrefix: "已选择:",
  noIconsFound: "未找到匹配的图标",
  iconCount: "共 {count} 个图标",
  cancel: "取消",
  confirm: "确认选择",
  placeholder: "选择图标",
};

// 英文翻译
export const englishTranslations: IconSelectorTranslations = {
  title: "Select Icon",
  searchPlaceholder: "Search icons...",
  allIcons: "All Icons",
  selectedPrefix: "Selected:",
  noIconsFound: "No matching icons found",
  iconCount: "{count} icons total",
  cancel: "Cancel",
  confirm: "Confirm Selection",
  placeholder: "Select an icon",
};

// 主要的 IconSelector 组件
export const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  translations = defaultTranslations,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleIconSelect = (iconKey: string) => {
    onChange(iconKey);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <>
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => !disabled && setIsModalOpen(true)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-left border rounded-md",
            "hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
            disabled && "opacity-50 cursor-not-allowed",
            "min-h-[2.5rem]",
          )}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <IconDisplay iconName={value} size={20} />
                <span className="text-sm">{getIconDisplayName(value)}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder || translations.placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
        </button>
      </div>

      <IconSelectorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleIconSelect}
        currentValue={value}
        translations={translations}
      />
    </>
  );
};

export default IconSelector;

// 导出默认翻译供外部使用
export { defaultTranslations as chineseTranslations };
