# @repo/ui - UI 组件库

这是一个共享的 UI 组件库，包含图标选择器等通用组件。

## IconSelector 组件

一个可视化的图标选择器组件，支持搜索、分类和国际化。

### 基本使用

```tsx
import { IconSelector } from "@repo/ui";

function MyForm() {
  const [iconKey, setIconKey] = useState("");

  return (
    <IconSelector
      value={iconKey}
      onChange={setIconKey}
      placeholder="选择一个图标"
    />
  );
}
```

### 国际化支持

组件提供了完整的国际化支持，您可以传入自定义翻译：

#### 使用预设翻译

```tsx
import {
  IconSelector,
  chineseTranslations,
  englishTranslations
} from '@repo/ui';

// 中文界面
<IconSelector
  value={iconKey}
  onChange={setIconKey}
  translations={chineseTranslations}
/>

// 英文界面
<IconSelector
  value={iconKey}
  onChange={setIconKey}
  translations={englishTranslations}
/>
```

#### 自定义翻译

```tsx
import { IconSelector, IconSelectorTranslations } from "@repo/ui";

const customTranslations: IconSelectorTranslations = {
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

<IconSelector
  value={iconKey}
  onChange={setIconKey}
  translations={customTranslations}
/>;
```

### 在 React Hook Form 中使用

```tsx
import { Controller } from "react-hook-form";
import { IconSelector, englishTranslations } from "@repo/ui";

<Controller
  name="iconKey"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <>
      <IconSelector
        value={field.value}
        onChange={field.onChange}
        placeholder="选择图标"
        translations={englishTranslations}
      />
      {error && <p className="error">{error.message}</p>}
    </>
  )}
/>;
```

### API 参考

#### IconSelectorProps

| 属性         | 类型                      | 默认值              | 说明               |
| ------------ | ------------------------- | ------------------- | ------------------ |
| value        | string                    | undefined           | 当前选中的图标名称 |
| onChange     | (iconKey: string) => void | -                   | 选择回调函数       |
| placeholder  | string                    | undefined           | 占位符文本         |
| className    | string                    | undefined           | 自定义样式类       |
| disabled     | boolean                   | false               | 是否禁用           |
| translations | IconSelectorTranslations  | chineseTranslations | 翻译文本           |

#### IconSelectorTranslations

| 属性              | 类型   | 说明                                |
| ----------------- | ------ | ----------------------------------- |
| title             | string | 模态框标题                          |
| searchPlaceholder | string | 搜索框占位符                        |
| allIcons          | string | "所有图标"选项文本                  |
| selectedPrefix    | string | 已选择提示前缀                      |
| noIconsFound      | string | 未找到图标时的提示                  |
| iconCount         | string | 图标总数显示（支持 {count} 占位符） |
| cancel            | string | 取消按钮文本                        |
| confirm           | string | 确认按钮文本                        |
| placeholder       | string | 默认占位符文本                      |

### 功能特性

- 🔍 **实时搜索**: 支持图标名称搜索
- 📂 **分类浏览**: 按业务场景分类（商业、安全、服务、物流等）
- 🌐 **国际化**: 完整的多语言支持
- 🎨 **主题支持**: 支持亮色/暗色主题
- ♿ **无障碍访问**: 键盘导航和屏幕阅读器支持
- 📱 **响应式**: 适配不同屏幕尺寸
- 🚀 **性能优化**: 虚拟滚动和图标懒加载

### 图标库

基于 Tabler Icons (3000+ 专业图标)，涵盖：

- 商业类: 购物车、信用卡、包裹、礼品等
- 安全保障: 盾牌、锁、证书、徽章等
- 服务支持: 耳机、电话、邮件、帮助等
- 配送物流: 卡车、飞机、地图、时钟等
