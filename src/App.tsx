import { EditorContent } from "@tiptap/react";
import { useEdyx } from "./useEdyx";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings,
  ChevronDown,
  ChevronUp,
  Highlighter,
  Type,
  Maximize2,
  MousePointer2,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  Indent as IndentIcon,
  Outdent,
  Copy,
  Scissors,
  ClipboardPaste,
  Check,
  X,
  Globe,
  FileDown,
  Download,
  FileText,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface ToolbarBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tip?: string;
  down?: boolean;
}

interface ContextBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
}

const translations = {
  pt: {
    settings: "PREFERÊNCIAS",
    lang: "IDIOMA",
    close: "CONCLUÍDO",
    layout: "LAYOUT DE PÁGINA",
    font: "TIPOGRAFIA",
    size: "TAMANHO",
    color: "COR",
    highlight: "GRIFAR",
    abnt: "ABNT",
    spacing: "ESPAÇAMENTO",
    structure: "ESTRUTURA",
    paragraph: "ALINHAMENTO",
    margins: { t: "SUP", b: "INF", l: "ESQ", r: "DIR" },
    context: {
      copy: "COPIAR",
      cut: "RECORTAR",
      paste: "COLAR",
      clear: "LIMPAR",
      all: "SELECIONAR TUDO",
    },
    tips: {
      undo: "Desfazer",
      redo: "Refazer",
      bold: "Negrito",
      italic: "Itálico",
      underline: "Sublinhado",
      font: "Fonte",
      size: "Tamanho",
      color: "Cor",
      highlight: "Grifar",
      focus: "Foco",
      expand: "Barra",
      settings: "Configurações",
      bullet: "Marcadores",
      ordered: "Numeração",
      indent: "Aumentar Recuo",
      outdent: "Diminuir Recuo",
      line: "Entrelinhas",
      pdf: "PDF",
      docx: "DOCX",
    },
  },
  en: {
    settings: "PREFERENCES",
    lang: "LANGUAGE",
    close: "DONE",
    layout: "PAGE LAYOUT",
    font: "TYPOGRAPHY",
    size: "SIZE",
    color: "COLOR",
    highlight: "HIGHLIGHT",
    abnt: "ABNT",
    spacing: "SPACING",
    structure: "STRUCTURE",
    paragraph: "ALIGNMENT",
    margins: { t: "TOP", b: "BOT", l: "LFT", r: "RGT" },
    context: {
      copy: "COPY",
      cut: "CUT",
      paste: "PASTE",
      clear: "CLEAR",
      all: "SELECT ALL",
    },
    tips: {
      undo: "Undo",
      redo: "Redo",
      bold: "Bold",
      italic: "Italic",
      underline: "Underline",
      font: "Font",
      size: "Size",
      color: "Color",
      highlight: "Highlight",
      focus: "Focus",
      expand: "Toolbar",
      settings: "Settings",
      bullet: "Bullets",
      ordered: "Numbering",
      indent: "Indent",
      outdent: "Outdent",
      line: "Line Height",
      pdf: "PDF",
      docx: "DOCX",
    },
  },
};

const palette = [
  "#000000",
  "#1a1a1a",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#efefef",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
  "#dd7e6b",
  "#ea9999",
  "#f9cb9c",
  "#ffe599",
  "#b6d7a8",
  "#a2c4c9",
  "#a4c2f4",
  "#9fc5e8",
  "#b4a7d6",
  "#d5a6bd",
  "#cc4125",
  "#e06666",
  "#f6b26b",
  "#ffd966",
  "#93c47d",
  "#76a5af",
  "#6d9eeb",
  "#6fa8dc",
  "#8e7cc3",
  "#c27ba0",
];
const fontSizes = [
  "8pt",
  "10pt",
  "12pt",
  "14pt",
  "16pt",
  "18pt",
  "20pt",
  "24pt",
  "32pt",
  "48pt",
];

function App() {
  const [docContent, setDocContent] = useLocalStorage("edyx-content", "");
  const editor = useEdyx(docContent, setDocContent);
  const [lang, setLang] = useLocalStorage<"pt" | "en">("edyx-lang", "pt");
  const [expanded, setExpanded] = useLocalStorage("edyx-expanded", true);
  const [showSettings, setShowSettings] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [mT, setMT] = useLocalStorage("m-t", 3);
  const [mB, setMB] = useLocalStorage("m-b", 2);
  const [mL, setML] = useLocalStorage("m-l", 3);
  const [mR, setMR] = useLocalStorage("m-r", 2);

  const t = translations[lang];

  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--edyx-mt", `${mT}cm`);
    s.setProperty("--edyx-mb", `${mB}cm`);
    s.setProperty("--edyx-ml", `${mL}cm`);
    s.setProperty("--edyx-mr", `${mR}cm`);
  }, [mT, mB, mL, mR]);

  const handleGlobalClick = useCallback(() => {
    setShowColor(false);
    setShowDownload(false);
    setContextMenu(null);
  }, []);

  useEffect(() => {
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [handleGlobalClick]);

  const exportFile = async (type: "pdf" | "docx") => {
    try {
      const response = await fetch(`http://localhost:8080/export/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editor?.getHTML(),
          title: "Documento_Edyx",
          margins: { t: mT, b: mB, l: mL, r: mR },
        }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Documento_Edyx.${type === "pdf" ? "pdf" : "doc"}`;
      a.click();
    } catch {
      alert("Erro ao exportar. Verifique se o servidor Go está rodando.");
    }
  };

  if (!editor) return null;

  const attrs = editor.getAttributes("textStyle");
  const curSize = attrs.fontSize || "12pt";
  const curFont = attrs.fontFamily || "Arial";
  const curLine = editor.getAttributes("paragraph").lineHeight || "1.5";

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f5f2ed] text-[#1a1a1a] font-sans selection:bg-[#f8d7da]">
      <header className="bg-[#fcfaf7] border-b border-[#dad4c9] z-40 select-none relative shadow-none">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img
              src="/logoo.png"
              alt="Logo"
              className="h-20 mt-3 w-auto object-contain"
            />
            <div className="w-px h-8 bg-[#dad4c9] mx-2" />

            <div className="flex gap-0.5">
              <ToolbarBtn
                onClick={() => editor.chain().focus().undo().run()}
                tip={t.tips.undo}
                down
              >
                <Undo2 size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().redo().run()}
                tip={t.tips.redo}
                down
              >
                <Redo2 size={15} />
              </ToolbarBtn>
            </div>

            <div className="flex bg-[#efebe4] p-1 rounded-sm gap-0.5 ml-2 border border-black/5">
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                tip={t.tips.bold}
                down
              >
                <Bold size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                tip={t.tips.italic}
                down
              >
                <Italic size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                tip={t.tips.underline}
                down
              >
                <Underline size={15} />
              </ToolbarBtn>
            </div>

            <div className="w-px h-8 bg-[#dad4c9] mx-2" />

            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1 text-[#6a665c]">
                  <Type size={10} strokeWidth={2} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">
                    {t.font}
                  </span>
                </div>
                <select
                  value={curFont}
                  onChange={(e) =>
                    editor.chain().focus().setFontFamily(e.target.value).run()
                  }
                  className="bg-transparent text-[12px] font-bold outline-none cursor-pointer appearance-none text-black w-28 tracking-tight font-sans"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>
              <div className="w-px h-8 bg-[#dad4c9] mx-1" />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#6a665c] uppercase mb-1 tracking-widest">
                  {t.size}
                </span>
                <select
                  value={curSize}
                  onChange={(e) =>
                    editor.chain().focus().setFontSize(e.target.value).run()
                  }
                  className="bg-transparent text-[12px] font-bold outline-none cursor-pointer appearance-none text-black w-14 text-center font-sans"
                >
                  {fontSizes.map((s) => (
                    <option key={s} value={s}>
                      {parseInt(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-px h-8 bg-[#dad4c9] mx-2" />

            <div className="flex items-center gap-8">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColor(!showColor);
                  }}
                  className="flex flex-col items-start group cursor-pointer"
                >
                  <span className="text-[8px] font-bold text-[#6a665c] uppercase mb-1 tracking-widest group-hover:text-black">
                    {t.color}
                  </span>
                  <div
                    className="w-10 h-1.5 border border-black/10 shadow-none"
                    style={{ backgroundColor: attrs.color || "#1a1a1a" }}
                  />
                </button>
                {showColor && (
                  <div
                    className="absolute top-12 left-0 bg-white border border-[#dad4c9] p-3 grid grid-cols-8 gap-1 w-64 z-50 rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {palette.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          editor.chain().focus().setColor(c).run();
                          setShowColor(false);
                        }}
                        className="w-6 h-6 border border-zinc-100 hover:border-black hover:scale-110 transition-all"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div
                className="flex flex-col items-start group cursor-pointer"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                <span className="text-[8px] font-bold text-[#6a665c] uppercase mb-1 tracking-widest group-hover:text-black">
                  {t.highlight}
                </span>
                <div className="w-10 h-1.5 border border-black/10 bg-[#ffe203]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="relative h-10 flex items-center"
              onMouseEnter={() => setShowDownload(true)}
              onMouseLeave={() => setShowDownload(false)}
            >
              <button className="p-2 text-[#6a665c] hover:text-black transition-all cursor-pointer">
                <FileDown size={20} />
              </button>
              {showDownload && (
                <div className="absolute top-full right-0 bg-white border border-[#dad4c9] py-1 w-32 z-50 rounded-sm shadow-xl">
                  <button
                    onClick={() => exportFile("pdf")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-[#4a463c] hover:bg-[#efebe4] hover:text-black transition-colors uppercase tracking-widest cursor-pointer font-sans"
                  >
                    <Download size={12} /> {t.tips.pdf}
                  </button>
                  <button
                    onClick={() => exportFile("docx")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-[#4a463c] hover:bg-[#efebe4] hover:text-black transition-colors uppercase tracking-widest cursor-pointer font-sans"
                  >
                    <FileText size={12} /> {t.tips.docx}
                  </button>
                </div>
              )}
            </div>
            <ToolbarBtn
              onClick={() => document.documentElement.requestFullscreen()}
              tip={t.tips.focus}
              down
            >
              <Maximize2 size={16} />
            </ToolbarBtn>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center px-4 h-10 rounded-sm ml-4 transition-all cursor-pointer ${
                expanded
                  ? "bg-black text-white"
                  : "bg-[#efebe4] text-black hover:bg-[#dad4c9]"
              }`}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-[#6a665c] hover:text-black ml-4 transition-colors cursor-pointer"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 bg-[#fcfaf7] border-t border-[#dad4c9] ${
            expanded ? "h-24" : "h-0"
          }`}
        >
          <div className="max-w-screen-2xl mx-auto px-6 h-full flex items-center gap-16">
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-[#3a362c] uppercase mb-3 tracking-[0.15em] opacity-80">
                {t.structure}
              </span>
              <div className="flex bg-[#efebe4] p-1 rounded-sm gap-0.5 border border-black/5 shadow-none">
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  active={editor.isActive("bulletList")}
                  tip={t.tips.bullet}
                >
                  <List size={15} />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  active={editor.isActive("orderedList")}
                  tip={t.tips.ordered}
                >
                  <ListOrdered size={15} />
                </ToolbarBtn>
              </div>
            </div>
            <div className="w-px h-12 bg-[#dad4c9]" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-[#3a362c] uppercase mb-3 tracking-[0.15em] opacity-80">
                {t.paragraph}
              </span>
              <div className="flex bg-[#efebe4] p-1 rounded-sm gap-0.5 border border-black/5 shadow-none">
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  active={editor.isActive({ textAlign: "left" })}
                  tip={t.tips.left}
                >
                  <AlignLeft size={15} />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  active={editor.isActive({ textAlign: "center" })}
                  tip={t.tips.center}
                >
                  <AlignCenter size={15} />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  active={editor.isActive({ textAlign: "right" })}
                  tip={t.tips.right}
                >
                  <AlignRight size={15} />
                </ToolbarBtn>
                <div className="w-px h-4 bg-[#dad4c9] mx-1" />
                <ToolbarBtn
                  onClick={() => editor.chain().focus().indent().run()}
                  tip={t.tips.indent}
                >
                  <IndentIcon size={15} />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor.chain().focus().outdent().run()}
                  tip={t.tips.outdent}
                >
                  <Outdent size={15} />
                </ToolbarBtn>
              </div>
            </div>
            <div className="w-px h-12 bg-[#dad4c9]" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-[#3a362c] uppercase mb-3 tracking-[0.15em] opacity-80">
                {t.spacing}
              </span>
              <div className="flex bg-[#efebe4] p-1 rounded-sm gap-px border border-black/5 shadow-none">
                {[1.0, 1.5, 2.0].map((v) => (
                  <button
                    key={v}
                    onClick={() =>
                      editor.chain().focus().setLineHeight(v.toString()).run()
                    }
                    className={`px-4 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                      curLine === v.toString()
                        ? "bg-white text-black shadow-none"
                        : "text-[#8c887d] hover:bg-white/40"
                    }`}
                  >
                    {v.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-12 bg-[#dad4c9]" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-[#3a362c] uppercase mb-3 tracking-[0.15em] opacity-80">
                {t.layout}
              </span>
              <div className="flex items-center gap-3 bg-[#efebe4] px-4 h-10 rounded-sm border border-black/5 shadow-none">
                {[
                  { k: "t", v: mT, s: setMT },
                  { k: "b", v: mB, s: setMB },
                  { k: "l", v: mL, s: setML },
                  { k: "r", v: mR, s: setMR },
                ].map((m) => (
                  <div key={m.k} className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-[#8c887d] uppercase">
                      {t.margins[m.k as keyof typeof t.margins]}
                    </span>
                    <div className="flex items-center bg-white/80 border border-black/5 rounded-sm px-1.5 focus-within:bg-white transition-all">
                      <input
                        type="text"
                        value={m.v}
                        onChange={(e) =>
                          m.s(Number(e.target.value.replace(/\D/g, "")))
                        }
                        className="w-4 h-7 text-center text-[11px] font-medium outline-none bg-transparent"
                      />
                      <span className="text-[8px] font-bold text-[#8c887d]">
                        CM
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setMT(3);
                    setMB(2);
                    setML(3);
                    setMR(2);
                  }}
                  className="h-7 px-4 text-[9px] font-bold bg-black text-white rounded-sm uppercase tracking-widest active:scale-95 transition-all ml-1 cursor-pointer"
                >
                  {t.abnt}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        onContextMenu={onContextMenu}
        className="flex-1 overflow-y-auto no-scrollbar py-6 bg-[#f0ede9]"
      >
        <div className="flex justify-center min-h-full pb-20">
          <EditorContent editor={editor} />
        </div>
      </main>

      {contextMenu && (
        <div
          className="fixed z-[100] bg-[#fcfaf7] border border-[#dad4c9] w-56 py-1 rounded-sm select-none shadow-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextBtn
            onClick={() => {
              document.execCommand("copy");
              setContextMenu(null);
            }}
            icon={<Copy size={13} />}
          >
            {t.context.copy}
          </ContextBtn>
          <ContextBtn
            onClick={() => {
              document.execCommand("cut");
              setContextMenu(null);
            }}
            icon={<Scissors size={13} />}
          >
            {t.context.cut}
          </ContextBtn>
          <ContextBtn
            onClick={async () => {
              const text = await navigator.clipboard.readText();
              editor.chain().focus().insertContent(text).run();
              setContextMenu(null);
            }}
            icon={<ClipboardPaste size={13} />}
          >
            {t.context.paste}
          </ContextBtn>
          <div className="h-px bg-[#dad4c9] my-1 mx-2" />
          <ContextBtn
            onClick={() => {
              editor.chain().focus().selectAll().run();
              setContextMenu(null);
            }}
            icon={<MousePointer2 size={13} />}
          >
            {t.context.all}
          </ContextBtn>
        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/10 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white w-[340px] p-6 rounded-sm border border-[#dad4c9] shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-black">
                {t.settings}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  <Globe size={12} /> {t.lang}
                </label>
                <div className="grid grid-cols-2 gap-px bg-[#dad4c9] border border-[#dad4c9]">
                  <button
                    onClick={() => setLang("pt")}
                    className={`py-4 text-[10px] font-bold cursor-pointer font-sans ${
                      lang === "pt"
                        ? "bg-white text-black"
                        : "bg-[#fcfaf7] text-gray-400"
                    }`}
                  >
                    PORTUGUÊS
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`py-4 text-[10px] font-bold cursor-pointer font-sans ${
                      lang === "en"
                        ? "bg-white text-black"
                        : "bg-[#fcfaf7] text-gray-400"
                    }`}
                  >
                    ENGLISH
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3 text-[11px] font-bold bg-black text-white uppercase tracking-widest rounded-sm font-sans"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({ children, onClick, active, tip, down }: ToolbarBtnProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2.5 rounded-sm transition-all cursor-pointer shadow-none ${
          active
            ? "bg-white text-black border border-black/5"
            : "text-[#8c887d] hover:text-black hover:bg-white/70"
        }`}
      >
        {children}
      </button>
      {tip && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${
            down ? "top-full mt-2" : "bottom-full mb-2"
          } px-2.5 py-1.5 bg-[#ffffff] border border-[#dad4c9] text-[#5a564c] text-[10px] font-medium rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-50 shadow-none whitespace-nowrap font-sans`}
        >
          {tip}
        </div>
      )}
    </div>
  );
}

function ContextBtn({ children, onClick, icon }: ContextBtnProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 text-[11px] font-bold text-[#4a463c] hover:bg-[#efebe4] hover:text-black transition-colors text-left uppercase tracking-widest cursor-pointer font-sans"
    >
      <span className="opacity-40">{icon}</span> {children}
    </button>
  );
}

export default App;
