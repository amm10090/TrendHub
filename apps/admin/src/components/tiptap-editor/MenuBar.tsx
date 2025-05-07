"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

interface MenuBarProps {
  editor: Editor | null;
}

const LinkSchema = z.object({
  url: z.string().url("请输入有效的URL"),
});

type LinkFormValues = z.infer<typeof LinkSchema>;

const ImageSchema = z.object({
  src: z.string().url("请输入有效的图片URL"),
  alt: z.string().optional(),
});

type ImageFormValues = z.infer<typeof ImageSchema>;

export function MenuBar({ editor }: MenuBarProps) {
  const t = useTranslations("tiptapEditor");

  const {
    register: registerLink,
    handleSubmit: handleLinkSubmit,
    setValue: setLinkValue,
    formState: { errors: linkErrors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(LinkSchema),
    defaultValues: { url: "" },
  });

  const {
    register: registerImage,
    handleSubmit: handleImageSubmit,
    setValue: setImageValue,
    formState: { errors: imageErrors },
  } = useForm<ImageFormValues>({
    resolver: zodResolver(ImageSchema),
    defaultValues: { src: "", alt: "" },
  });

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;

    setLinkValue("url", previousUrl || "");
    setIsLinkModalOpen(true);
  }, [editor, setLinkValue]);

  const onLinkSubmit = useCallback(
    (data: LinkFormValues) => {
      if (!editor) return;
      if (data.url) {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: data.url })
          .run();
      }
      setIsLinkModalOpen(false);
      setLinkValue("url", "");
    },
    [editor, setLinkValue],
  );

  const addImage = useCallback(() => {
    if (!editor) return;
    setIsImageModalOpen(true);
  }, [editor]);

  const onImageSubmit = useCallback(
    (data: ImageFormValues) => {
      if (!editor) return;
      if (data.src) {
        editor.chain().focus().setImage({ src: data.src, alt: data.alt }).run();
      }
      setIsImageModalOpen(false);
      setImageValue("src", "");
      setImageValue("alt", "");
    },
    [editor, setImageValue],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 border-b bg-background sticky top-0 z-10">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label={t("ariaLabels.bold")}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label={t("ariaLabels.italic")}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label={t("ariaLabels.underline")}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label={t("ariaLabels.strikethrough")}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-0.5 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          aria-label={t("ariaLabels.heading1")}
          className={
            editor.isActive("heading", { level: 1 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label={t("ariaLabels.heading2")}
          className={
            editor.isActive("heading", { level: 2 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label={t("ariaLabels.heading3")}
          className={
            editor.isActive("heading", { level: 3 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 4 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          aria-label={t("ariaLabels.heading4")}
          className={
            editor.isActive("heading", { level: 4 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading4 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 5 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          aria-label={t("ariaLabels.heading5")}
          className={
            editor.isActive("heading", { level: 5 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading5 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 6 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
          aria-label={t("ariaLabels.heading6")}
          className={
            editor.isActive("heading", { level: 6 })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <Heading6 className="h-4 w-4" />
        </Toggle>
      </div>
      <Toggle
        size="sm"
        pressed={editor.isActive("paragraph")}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        aria-label={t("ariaLabels.paragraph")}
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label={t("ariaLabels.bulletList")}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label={t("ariaLabels.orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label={t("ariaLabels.blockquote")}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("codeBlock")}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label={t("ariaLabels.codeBlock")}
      >
        <Code className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={setLink}
        aria-label={t("ariaLabels.setLink")}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={addImage}
        aria-label={t("ariaLabels.addImage")}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label={t("ariaLabels.horizontalRule")}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        aria-label={t("ariaLabels.alignLeft")}
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        aria-label={t("ariaLabels.alignCenter")}
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        aria-label={t("ariaLabels.alignRight")}
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "justify" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
        aria-label={t("ariaLabels.alignJustify")}
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Color Picker Section */}
      <div className="flex items-center gap-1">
        <Input
          type="color"
          className="w-8 h-8 p-0.5 border rounded cursor-pointer"
          value={editor.getAttributes("textStyle").color || "#000000"}
          onInput={(event) =>
            editor
              .chain()
              .focus()
              .setColor((event.target as HTMLInputElement).value)
              .run()
          }
          title={t("tooltips.customColor")}
        />
        <div className="flex items-center gap-0.5">
          {[
            "#ef4444",
            "#fb923c",
            "#facc15",
            "#4ade80",
            "#3b82f6",
            "#8b5cf6",
            "#000000",
            "#6b7280",
          ].map((color) => (
            <Button
              key={color}
              type="button"
              size="icon"
              variant="ghost"
              className="w-6 h-6 p-0 rounded-sm"
              onClick={() => editor.chain().focus().setColor(color).run()}
              style={{ backgroundColor: color }}
              title={t("tooltips.setColor", { color })}
              aria-label={t("tooltips.setColor", { color })}
            >
              {editor.isActive("textStyle", { color }) ? (
                <Check className="h-3 w-3 text-white mix-blend-difference" />
              ) : null}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().unsetColor().run()}
          disabled={!editor.getAttributes("textStyle").color}
          title={t("tooltips.clearColor")}
          className="px-2 text-xs"
        >
          {t("buttons.clear")}
        </Button>
      </div>

      {/* Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogs.link.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkSubmit(onLinkSubmit)} className="space-y-4">
            <div>
              <Input
                id="linkUrl"
                placeholder={t("placeholders.linkUrl")}
                {...registerLink("url")}
              />
              {linkErrors.url && (
                <p className="text-red-500 text-xs mt-1">
                  {linkErrors.url.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("buttons.cancel", { ns: "common" })}
                </Button>
              </DialogClose>
              <Button type="submit">{t("buttons.apply")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogs.image.title")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleImageSubmit(onImageSubmit)}
            className="space-y-4"
          >
            <div>
              <label htmlFor="imageUrl" className="text-sm font-medium">
                {t("labels.imageUrl")}
              </label>
              <Input
                id="imageUrl"
                placeholder={t("placeholders.imageUrl")}
                {...registerImage("src")}
              />
              {imageErrors.src && (
                <p className="text-red-500 text-xs mt-1">
                  {imageErrors.src.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="imageAlt" className="text-sm font-medium">
                {t("labels.imageAlt")}
              </label>
              <Input
                id="imageAlt"
                placeholder={t("placeholders.imageAlt")}
                {...registerImage("alt")}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("buttons.cancel", { ns: "common" })}
                </Button>
              </DialogClose>
              <Button type="submit">{t("buttons.insert")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TODO: Add more buttons for Table, TaskList, Youtube, Highlight, Subscript, Superscript etc. */}
    </div>
  );
}

// 需要在 TiptapEditor.tsx 中将 editor 实例通过 onEditorInstance prop 回传
// 然后在 PageForm.tsx 中接收 editor 实例并传递给 MenuBar
