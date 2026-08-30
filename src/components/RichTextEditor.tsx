import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Mark, mergeAttributes, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4, 
  Heading5, 
  Heading6, 
  Heading as HeadingIcon,
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  Check,
  X,
  ChevronDown,
  Minus,
  RemoveFormatting,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Highlighter
} from 'lucide-react';

// Custom TipTap Font Size Mark
const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, '') || null,
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return {
            style: `font-size: ${attributes.size}`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: (element) => {
          const fontSize = (element as HTMLElement).style.fontSize;
          return fontSize ? { size: fontSize } : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

// Custom TipTap Highlight Mark
const HighlightMark = Mark.create({
  name: 'highlight',
  addAttributes() {
    return {
      color: {
        default: '#fef08a',
        parseHTML: (element) => element.style.backgroundColor || '#fef08a',
        renderHTML: (attributes) => {
          return {
            style: `background-color: ${attributes.color || '#fef08a'}; padding: 0.1em 0.3em; border-radius: 0.15rem;`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'mark',
      },
      {
        tag: 'span[style*="background-color"]',
        getAttrs: (element) => {
          const bg = (element as HTMLElement).style.backgroundColor;
          return bg ? { color: bg } : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0];
  },
});

// Custom Text Alignment Extension
const CustomTextAlign = Extension.create({
  name: 'customTextAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph'],
        attributes: {
          textAlign: {
            default: 'left',
            parseHTML: (element) => element.style.textAlign || 'left',
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === 'left') {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

const FONT_SIZE_PRESETS = [
  { label: '12px (Small / Caption)', value: '12px', size: 12 },
  { label: '14px (Compact Text)', value: '14px', size: 14 },
  { label: '16px (Normal Body)', value: '16px', size: 16 },
  { label: '18px (Large Body / Reading)', value: '18px', size: 18 },
  { label: '20px (Lead Paragraph)', value: '20px', size: 20 },
  { label: '24px (Sub-headline)', value: '24px', size: 24 },
  { label: '28px (Section Title)', value: '28px', size: 28 },
  { label: '32px (Display Accent)', value: '32px', size: 32 },
];

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);

  const headingMenuRef = useRef<HTMLDivElement>(null);
  const fontSizeMenuRef = useRef<HTMLDivElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to preserve text selection when interacting with popups & inputs
  const savedSelectionRef = useRef<{ from: number; to: number; text: string } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      FontSize,
      HighlightMark,
      CustomTextAlign,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'editorial-link text-brand-accent underline decoration-brand-accent underline-offset-4 hover:opacity-80 transition-opacity font-semibold cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your story here... Format body text, add headings and hyperlinks.',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[340px] p-6 font-serif leading-relaxed text-slate-800',
      },
    },
  });

  // Sync content if changed externally and editor is not focused
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false);
      }
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
        setShowFontSizeMenu(false);
      }
      if (linkModalRef.current && !linkModalRef.current.contains(e.target as Node)) {
        setShowLinkModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open Link Dialog and strictly preserve selection
  const openLinkDialog = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const previousUrl = editor.getAttributes('link').href || '';
    const previousTarget = editor.getAttributes('link').target;

    savedSelectionRef.current = { from, to, text: selectedText };
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setLinkTargetBlank(previousTarget !== '_self');
    setShowLinkModal(true);

    setTimeout(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    }, 60);
  }, [editor]);

  // Save and Apply Link with rock-solid selection restoration
  const applyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editor) return;

    const saved = savedSelectionRef.current;
    let formattedUrl = linkUrl.trim();

    if (!formattedUrl) {
      // If empty URL, unset link
      if (saved && saved.from !== saved.to) {
        editor.chain().focus().setTextSelection({ from: saved.from, to: saved.to }).extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setShowLinkModal(false);
      return;
    }

    // Auto-normalize protocol if user enters e.g. "google.com" or "techquo.com"
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://') &&
      !formattedUrl.startsWith('mailto:') &&
      !formattedUrl.startsWith('tel:') &&
      !formattedUrl.startsWith('/') &&
      !formattedUrl.startsWith('#')
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (saved && saved.from !== saved.to) {
      // Text was selected
      editor.chain().focus().setTextSelection({ from: saved.from, to: saved.to }).run();

      // Check if user changed the link text in the modal
      if (linkText.trim() && linkText.trim() !== saved.text.trim()) {
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(
            `<a href="${formattedUrl}" ${linkTargetBlank ? 'target="_blank" rel="noopener noreferrer"' : ''} class="editorial-link text-brand-accent underline font-semibold">${linkText.trim()}</a> `
          )
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({
            href: formattedUrl,
            target: linkTargetBlank ? '_blank' : null,
          })
          .run();
      }
    } else {
      // No text was selected: insert new anchor link with text or URL
      const textToInsert = linkText.trim() || formattedUrl;
      const targetPos = saved ? saved.from : editor.state.selection.from;
      
      editor
        .chain()
        .focus()
        .setTextSelection(targetPos)
        .insertContent(
          `<a href="${formattedUrl}" ${linkTargetBlank ? 'target="_blank" rel="noopener noreferrer"' : ''} class="editorial-link text-brand-accent underline font-semibold">${textToInsert}</a> `
        )
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    savedSelectionRef.current = null;
  };

  // Remove Link command
  const removeLink = () => {
    if (!editor) return;
    const saved = savedSelectionRef.current;
    if (saved && saved.from !== saved.to) {
      editor.chain().focus().setTextSelection({ from: saved.from, to: saved.to }).extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
    savedSelectionRef.current = null;
  };

  // Apply Font Size to selection or current block
  const handleSetFontSize = (sizeVal: string) => {
    if (!editor) return;
    if (sizeVal === 'default') {
      editor.chain().focus().unsetMark('fontSize').run();
    } else {
      editor.chain().focus().setMark('fontSize', { size: sizeVal }).run();
    }
    setShowFontSizeMenu(false);
  };

  // Stepper: Increase / Decrease Font Size
  const stepFontSize = (delta: number) => {
    if (!editor) return;
    const currentSizeStr = editor.getAttributes('fontSize').size;
    let currentNum = 16;
    if (currentSizeStr) {
      const match = currentSizeStr.match(/\d+/);
      if (match) currentNum = parseInt(match[0], 10);
    }
    const newNum = Math.max(10, Math.min(60, currentNum + delta));
    editor.chain().focus().setMark('fontSize', { size: `${newNum}px` }).run();
  };

  // Hotkey support for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (editor?.isFocused) {
          e.preventDefault();
          openLinkDialog();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, openLinkDialog]);

  if (!editor) {
    return null;
  }

  const activeHeadingLevel = [1, 2, 3, 4, 5, 6].find((level) =>
    editor.isActive('heading', { level: level as any })
  );

  const currentFontSize = editor.getAttributes('fontSize').size || '16px';
  const isLinkActive = editor.isActive('link');
  const activeLinkHref = editor.getAttributes('link').href;

  const getHeadingLabel = () => {
    if (activeHeadingLevel) return `H${activeHeadingLevel}`;
    if (editor.isActive('paragraph')) return 'Body (P)';
    return 'Style';
  };

  return (
    <div className="border border-slate-300 bg-white rounded-none shadow-xs overflow-visible relative">
      {/* Editorial Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 border-b border-slate-200 select-none">
        
        {/* Headings Dropdown Selector */}
        <div className="relative" ref={headingMenuRef}>
          <button
            type="button"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-xs font-bold uppercase tracking-wider text-slate-800 rounded transition-colors shadow-2xs"
            title="Heading / Structure Type"
          >
            <HeadingIcon size={14} className="text-brand-accent" />
            <span className="min-w-[60px] text-left">{getHeadingLabel()}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 shadow-xl rounded-sm py-1.5 z-40">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  !activeHeadingLevel && editor.isActive('paragraph')
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-700'
                }`}
              >
                <span className="font-serif">Normal Body Paragraph</span>
                {!activeHeadingLevel && editor.isActive('paragraph') && <Check size={14} />}
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-base flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 1 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-800'
                }`}
              >
                <span className="font-editorial font-bold text-lg">H1 - Main Section</span>
                {editor.isActive('heading', { level: 1 }) && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-800'
                }`}
              >
                <span className="font-editorial font-bold text-base">H2 - Major Header</span>
                {editor.isActive('heading', { level: 2 }) && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-800'
                }`}
              >
                <span className="font-editorial font-semibold text-sm">H3 - Subsection</span>
                {editor.isActive('heading', { level: 3 }) && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 4 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 4 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-700'
                }`}
              >
                <span className="font-editorial font-medium">H4 - Subtitle / Callout</span>
                {editor.isActive('heading', { level: 4 }) && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 5 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 5 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-700'
                }`}
              >
                <span className="font-sans font-bold uppercase tracking-wider text-[11px]">H5 - Micro Heading</span>
                {editor.isActive('heading', { level: 5 }) && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 6 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  editor.isActive('heading', { level: 6 })
                    ? 'bg-blue-50 text-brand-accent font-bold'
                    : 'text-slate-700'
                }`}
              >
                <span className="font-sans font-bold uppercase tracking-widest text-[10px] text-slate-500">H6 - Eyebrow Lead</span>
                {editor.isActive('heading', { level: 6 }) && <Check size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Fast Heading Buttons (H1 - H6) */}
        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            active={editor.isActive('heading', { level: 4 })}
            title="Heading 4"
          >
            <Heading4 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            active={editor.isActive('heading', { level: 5 })}
            title="Heading 5"
          >
            <Heading5 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
            active={editor.isActive('heading', { level: 6 })}
            title="Heading 6"
          >
            <Heading6 size={16} />
          </ToolbarButton>
        </div>

        {/* BODY TEXT CONTROLS: Font Size Selector & Stepper */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-1.5">
          <div className="relative" ref={fontSizeMenuRef}>
            <button
              type="button"
              onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
              className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-xs font-mono text-slate-800 rounded transition-colors shadow-2xs"
              title="Change Body / Text Font Size"
            >
              <Type size={13} className="text-slate-600" />
              <span className="font-bold">{currentFontSize}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {showFontSizeMenu && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-300 shadow-xl rounded-sm py-1.5 z-40">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Body Font Size
                </div>
                {FONT_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSetFontSize(preset.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                      currentFontSize === preset.value
                        ? 'bg-blue-50 text-brand-accent font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {currentFontSize === preset.value && <Check size={13} />}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => handleSetFontSize('default')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>Reset to Default (16px)</span>
                  <RemoveFormatting size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Stepper Buttons */}
          <ToolbarButton
            onClick={() => stepFontSize(-2)}
            title="Decrease Font Size (-2px)"
          >
            <ZoomOut size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => stepFontSize(2)}
            title="Increase Font Size (+2px)"
          >
            <ZoomIn size={15} />
          </ToolbarButton>
        </div>

        {/* Text Formats: Bold, Italic, Underline, Strike, Code, Highlight */}
        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleMark('highlight', { color: '#fef08a' }).run()}
            active={editor.isActive('highlight')}
            title="Text Highlighter"
          >
            <Highlighter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().updateAttributes('paragraph', { textAlign: 'left' }).updateAttributes('heading', { textAlign: 'left' }).run()}
            active={!editor.getAttributes('paragraph').textAlign || editor.getAttributes('paragraph').textAlign === 'left'}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().updateAttributes('paragraph', { textAlign: 'center' }).updateAttributes('heading', { textAlign: 'center' }).run()}
            active={editor.getAttributes('paragraph').textAlign === 'center'}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().updateAttributes('paragraph', { textAlign: 'right' }).updateAttributes('heading', { textAlign: 'right' }).run()}
            active={editor.getAttributes('paragraph').textAlign === 'right'}
            title="Align Right"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().updateAttributes('paragraph', { textAlign: 'justify' }).updateAttributes('heading', { textAlign: 'justify' }).run()}
            active={editor.getAttributes('paragraph').textAlign === 'justify'}
            title="Justify Text"
          >
            <AlignJustify size={16} />
          </ToolbarButton>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Pull Quote / Callout"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Divider"
          >
            <Minus size={16} />
          </ToolbarButton>
        </div>

        {/* LINK CONTROLS */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-1.5 relative">
          <button
            type="button"
            onClick={openLinkDialog}
            className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
              isLinkActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-800 hover:border-black hover:bg-slate-100'
            }`}
            title="Insert or Edit Hyperlink (Ctrl+K)"
          >
            <LinkIcon size={14} />
            <span>{isLinkActive ? 'Edit Link' : 'Add Link'}</span>
          </button>

          {isLinkActive && (
            <ToolbarButton
              onClick={removeLink}
              title="Remove / Unlink"
            >
              <Unlink size={16} className="text-red-500" />
            </ToolbarButton>
          )}

          {/* Interactive Link Popover Modal */}
          {showLinkModal && (
            <div
              ref={linkModalRef}
              className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white border-2 border-slate-900 shadow-2xl rounded-sm p-4 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-brand-accent text-white flex items-center justify-center rounded-xs">
                    <LinkIcon size={13} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {isLinkActive ? 'Edit Hyperlink' : 'Insert Hyperlink'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="text-slate-400 hover:text-black p-1 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    applyLink();
                  }
                }} 
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Web URL / Target Address
                  </label>
                  <input
                    ref={urlInputRef}
                    type="text"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com or /category/story-slug"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-black rounded-none shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts full URLs (https://...), relative links (/category/...), or anchors.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Anchor Text / Link Label
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Text to display in story (e.g. Read full report)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-black rounded-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={linkTargetBlank}
                      onChange={(e) => setLinkTargetBlank(e.target.checked)}
                      className="w-4 h-4 text-brand-accent rounded border-slate-300"
                    />
                    <span>Open link in new tab</span>
                  </label>

                  {linkUrl && (
                    <a
                      href={linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand-accent hover:underline flex items-center gap-1 font-bold"
                    >
                      <ExternalLink size={12} /> Test URL
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  {isLinkActive ? (
                    <button
                      type="button"
                      onClick={removeLink}
                      className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Unlink size={13} /> Unlink
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => applyLink()}
                      className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-accent transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Check size={14} /> Apply Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Undo, Redo, Clear */}
        <div className="flex items-center gap-0.5 ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear Formatting"
          >
            <RemoveFormatting size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Floating Active Link Inspector Bar */}
      {isLinkActive && activeLinkHref && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium truncate max-w-md">
            <LinkIcon size={13} className="text-blue-600 shrink-0" />
            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Linked To:</span>
            <span className="font-mono text-xs text-blue-950 truncate underline">{activeLinkHref}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={activeLinkHref.startsWith('http') ? activeLinkHref : `https://${activeLinkHref}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 hover:border-blue-400 text-blue-800 rounded text-[11px] font-bold"
            >
              <ExternalLink size={12} /> Test Link
            </a>
            <button
              type="button"
              onClick={openLinkDialog}
              className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700 transition-colors"
            >
              Edit Link
            </button>
            <button
              type="button"
              onClick={removeLink}
              className="px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="bg-white min-h-[340px]">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>{editor.getText().split(/\s+/).filter(Boolean).length} Words</span>
          <span>•</span>
          <span>{editor.getText().length} Characters</span>
          <span>•</span>
          <span>Current Size: <strong className="text-slate-800">{currentFontSize}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Tip: Select text and click <strong>Add Link</strong> (or press <strong>Ctrl+K</strong>)</span>
        </div>
      </div>

      {/* TipTap Editorial Prose Styles */}
      <style>{`
        .ProseMirror {
          min-height: 320px;
          outline: none;
        }
        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #2563eb;
          padding-left: 1.25rem;
          margin: 1.25rem 0;
          font-style: italic;
          color: #475569;
        }
        .ProseMirror h1 {
          font-family: 'DM Serif Display', serif;
          font-weight: 700;
          font-size: 2.25rem;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          color: #0f172a;
        }
        .ProseMirror h2 {
          font-family: 'DM Serif Display', serif;
          font-weight: 700;
          font-size: 1.75rem;
          margin-top: 1.5rem;
          margin-bottom: 0.65rem;
          line-height: 1.25;
          color: #0f172a;
        }
        .ProseMirror h3 {
          font-family: 'DM Serif Display', serif;
          font-weight: 600;
          font-size: 1.4rem;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
          color: #1e293b;
        }
        .ProseMirror h4 {
          font-family: 'DM Serif Display', serif;
          font-weight: 600;
          font-size: 1.2rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
          color: #334155;
        }
        .ProseMirror h5 {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1rem;
          margin-bottom: 0.35rem;
          color: #475569;
        }
        .ProseMirror h6 {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
          color: #64748b;
        }
        .ProseMirror p {
          font-family: 'EB Garamond', serif;
          font-size: 1.15rem;
          line-height: 1.8;
          margin-bottom: 1.25rem;
          color: #1e293b;
        }
        .ProseMirror a, .ProseMirror a.editorial-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          text-underline-offset: 3px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.1em 0.3em;
          border-radius: 0.15rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ProseMirror code {
          background-color: #f1f5f9;
          color: #0f172a;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        .ProseMirror hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}

const ToolbarButton = ({ 
  children, 
  onClick, 
  active = false, 
  disabled = false,
  title 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  active?: boolean;
  disabled?: boolean;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-all flex items-center justify-center ${
      active 
        ? 'bg-black text-white shadow-xs' 
        : 'text-slate-700 hover:bg-slate-200/80 hover:text-black'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);
