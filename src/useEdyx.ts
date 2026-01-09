import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "./editor/FontSize";
import { LineHeight } from "./editor/LineHeight";
import { Indent } from "./editor/Indent";
import { useState } from "react";

export const useEdyx = (
  initialContent: string,
  onUpdate: (html: string) => void
) => {
  const [, setTick] = useState(0);

  return useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: { HTMLAttributes: { class: "list-disc" } },
        orderedList: { HTMLAttributes: { class: "list-decimal" } },
        listItem: {},
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      LineHeight,
      Indent,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["paragraph", "listItem"] }),
    ],
    editorProps: {
      attributes: {
        class: "ProseMirror focus:outline-none",
      },
    },
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onSelectionUpdate: () => {
      setTick((t) => t + 1);
    },
  });
};
