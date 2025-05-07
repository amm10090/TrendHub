"use client";

import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
// import Mention from "@tiptap/extension-mention"; // 提及功能通常需要更复杂的配置 (如 suggestion)
import Youtube from "@tiptap/extension-youtube";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useTranslations } from "next-intl";

import "./tiptap.css"; // 引入编辑器基本样式

// 配置 lowlight
const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  editable?: boolean;
  onEditorInstance?: (editor: Editor) => void; // 用于传递 editor 实例给父组件 (例如 MenuBar)
}

const TiptapEditor = ({
  content,
  onChange,
  editable = true,
  onEditorInstance,
}: TiptapEditorProps) => {
  const t = useTranslations("tiptapEditor");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 确保heading配置正确
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // 其他配置
        codeBlock: false,
      }),
      Image.configure({
        // inline: true, // 如果希望图片是行内元素
        // allowBase64: true, // 如果需要支持 base64 图片
      }),
      Link.configure({
        openOnClick: false, // true 会在点击链接时打开，false 则不会
        autolink: true, // 自动将文本中的 URL 转换为链接
        // HTMLAttributes: { // 可以为链接添加自定义属性
        //   target: '_blank',
        //   rel: 'noopener noreferrer nofollow',
        // },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: t("placeholders.tiptapEditor"),
      }),
      CharacterCount.configure({
        // limit: 10000, // 可选：字数限制
      }),
      TextStyle,
      Color,
      // Mention.configure({
      //   HTMLAttributes: { class: 'mention' },
      //   suggestion: { /* ... */ }, // 提及建议的配置较复杂，暂时注释
      // }),
      Youtube.configure({
        controls: true,
        // nocookie: true, // 使用 youtube-nocookie.com 域名
      }),
      CodeBlockLowlight.configure({
        lowlight,
        // defaultLanguage: 'plaintext', // 可以设置默认语言
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    onCreate: ({ editor: currentEditor }) => {
      if (onEditorInstance) {
        onEditorInstance(currentEditor);
      }
    },
    // editorProps 用于 ProseMirror 的原生属性
    editorProps: {
      attributes: {
        class:
          "focus:outline-none p-2 border-0 min-h-[400px] max-w-full tiptap-custom-styling prose prose-sm sm:prose-base dark:prose-invert",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      {editor && (
        <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white bg-opacity-75 px-1 rounded z-[1]">
          {editor.storage.characterCount.characters()}
          {t("characterCountSuffix")}
          {/* {editor.storage.characterCount.words()} words */}
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
