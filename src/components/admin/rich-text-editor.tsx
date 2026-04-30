'use client'

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  LinkIcon,
  ImageIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  CodeIcon,
  MinusIcon,
  Undo2Icon,
  Redo2Icon,
  XIcon,
  CheckIcon,
} from 'lucide-react'

// YouTube icon (not in this version of lucide-react)
function YtIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Toolbar separator
// ---------------------------------------------------------------------------

function Sep() {
  return <div className="mx-0.5 h-5 w-px bg-border shrink-0" />
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        'hover:bg-muted hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground'
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline popover for link / image / youtube insertion
// ---------------------------------------------------------------------------

type PopoverType = 'link' | 'image' | 'youtube' | null

function InsertPopover({
  type,
  onClose,
  onInsert,
}: {
  type: PopoverType
  onClose: () => void
  onInsert: (value: string, altText?: string) => void
}) {
  const [url, setUrl] = React.useState('')
  const [alt, setAlt] = React.useState('')

  if (!type) return null

  const labels: Record<NonNullable<PopoverType>, { title: string; placeholder: string }> = {
    link: { title: 'Insert Link', placeholder: 'https://example.com' },
    image: { title: 'Insert Image', placeholder: 'https://example.com/image.jpg' },
    youtube: { title: 'Insert YouTube Video', placeholder: 'https://youtube.com/watch?v=...' },
  }

  const { title, placeholder } = labels[type]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (url.trim()) {
      onInsert(url.trim(), alt.trim() || undefined)
      setUrl('')
      setAlt('')
    }
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-popover p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 hover:bg-muted"
          aria-label="Close"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
          autoFocus
        />
        {type === 'image' && (
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text (optional)"
            className="h-8 text-sm"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!url.trim()}>
            <CheckIcon className="size-3.5" />
            Insert
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Heading selector
// ---------------------------------------------------------------------------

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
  { label: 'Heading 4', value: 4 },
] as const

// ---------------------------------------------------------------------------
// RichTextEditor
// ---------------------------------------------------------------------------

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
}: RichTextEditorProps) {
  const [popover, setPopover] = React.useState<PopoverType>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    // Prevent SSR/hydration mismatch — only render on client
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable extensions we're adding separately with custom config
        link: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      HorizontalRule,
      Placeholder.configure({
        placeholder: placeholder ?? 'Write your post content here…',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none min-h-[320px] px-4 py-3 focus:outline-none',
          disabled && 'opacity-60 cursor-not-allowed'
        ),
      },
    },
  })

  // Sync external value
  React.useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  // Sync disabled
  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  // Close popover on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ---------------------------------------------------------------------------
  // Insert handlers
  // ---------------------------------------------------------------------------

  function handleInsert(url: string, alt?: string) {
    if (!editor) return
    if (popover === 'link') {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else if (popover === 'image') {
      editor.chain().focus().setImage({ src: url, alt: alt ?? '' }).run()
    } else if (popover === 'youtube') {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
    setPopover(null)
  }

  // ---------------------------------------------------------------------------
  // Active heading level
  // ---------------------------------------------------------------------------

  function getActiveHeading(): number {
    if (!editor) return 0
    for (let i = 1; i <= 4; i++) {
      if (editor.isActive('heading', { level: i })) return i
    }
    return 0
  }

  function setHeading(level: number) {
    if (!editor) return
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
    }
  }

  const activeHeading = getActiveHeading()

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'opacity-60'
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={toolbarRef}
        className="relative flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5"
      >
        {/* Heading / Paragraph selector */}
        <select
          value={activeHeading}
          onChange={(e) => setHeading(Number(e.target.value))}
          disabled={disabled}
          className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
          aria-label="Text style"
        >
          {HEADING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Sep />

        {/* Bold */}
        <ToolbarBtn
          active={editor?.isActive('bold')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <BoldIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Italic */}
        <ToolbarBtn
          active={editor?.isActive('italic')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <ItalicIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Underline */}
        <ToolbarBtn
          active={editor?.isActive('underline')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Strikethrough */}
        <ToolbarBtn
          active={editor?.isActive('strike')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <StrikethroughIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Text color */}
        <label
          title="Text Color"
          className={cn(
            'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors',
            'hover:bg-muted',
            disabled && 'pointer-events-none opacity-40'
          )}
        >
          <span className="relative">
            <span className="text-xs font-bold" style={{ color: editor?.getAttributes('textStyle').color ?? 'currentColor' }}>A</span>
            <span
              className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-sm"
              style={{ backgroundColor: editor?.getAttributes('textStyle').color ?? '#000' }}
            />
          </span>
          <input
            type="color"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        <Sep />

        {/* Align left */}
        <ToolbarBtn
          active={editor?.isActive({ textAlign: 'left' })}
          disabled={disabled}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          title="Align Left"
        >
          <AlignLeftIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Align center */}
        <ToolbarBtn
          active={editor?.isActive({ textAlign: 'center' })}
          disabled={disabled}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          title="Align Center"
        >
          <AlignCenterIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Align right */}
        <ToolbarBtn
          active={editor?.isActive({ textAlign: 'right' })}
          disabled={disabled}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          title="Align Right"
        >
          <AlignRightIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Align justify */}
        <ToolbarBtn
          active={editor?.isActive({ textAlign: 'justify' })}
          disabled={disabled}
          onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
          title="Justify"
        >
          <AlignJustifyIcon className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Bullet list */}
        <ToolbarBtn
          active={editor?.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <ListIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Ordered list */}
        <ToolbarBtn
          active={editor?.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrderedIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Blockquote */}
        <ToolbarBtn
          active={editor?.isActive('blockquote')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <QuoteIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Code block */}
        <ToolbarBtn
          active={editor?.isActive('codeBlock')}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <CodeIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Horizontal rule */}
        <ToolbarBtn
          disabled={disabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <MinusIcon className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <ToolbarBtn
          active={editor?.isActive('link') || popover === 'link'}
          disabled={disabled}
          onClick={() => setPopover(popover === 'link' ? null : 'link')}
          title="Insert Link"
        >
          <LinkIcon className="size-3.5" />
        </ToolbarBtn>

        {/* Image */}
        <ToolbarBtn
          active={popover === 'image'}
          disabled={disabled}
          onClick={() => setPopover(popover === 'image' ? null : 'image')}
          title="Insert Image"
        >
          <ImageIcon className="size-3.5" />
        </ToolbarBtn>

        {/* YouTube */}
        <ToolbarBtn
          active={popover === 'youtube'}
          disabled={disabled}
          onClick={() => setPopover(popover === 'youtube' ? null : 'youtube')}
          title="Embed YouTube Video"
        >
          <YtIcon className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Undo */}
        <ToolbarBtn
          disabled={disabled || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2Icon className="size-3.5" />
        </ToolbarBtn>

        {/* Redo */}
        <ToolbarBtn
          disabled={disabled || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2Icon className="size-3.5" />
        </ToolbarBtn>

        {/* Insert popover */}
        <InsertPopover
          type={popover}
          onClose={() => setPopover(null)}
          onInsert={handleInsert}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Editor content                                                       */}
      {/* ------------------------------------------------------------------ */}
      <EditorContent editor={editor} />
    </div>
  )
}
