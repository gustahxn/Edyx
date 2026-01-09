import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "listItem"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) =>
              parseInt(element.style.paddingLeft) / 40 || 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return { style: `padding-left: ${attributes.indent * 40}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (
              node.type.name === "paragraph" ||
              node.type.name === "heading" ||
              node.type.name === "listItem"
            ) {
              const indent = (node.attrs.indent || 0) + 1;
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (
              node.type.name === "paragraph" ||
              node.type.name === "heading" ||
              node.type.name === "listItem"
            ) {
              const indent = Math.max(0, (node.attrs.indent || 0) - 1);
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});
