'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
          disabled && 'opacity-60 cursor-not-allowed'
        ),
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  })

  // Sync external value changes to editor
  useEffect(() => {
    if (!editor) return
    const currentHTML = editor.getHTML()
    if (value !== currentHTML) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  // Sync disabled state
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'opacity-60'
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
        {/* Bold */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            editor?.isActive('bold') && 'bg-muted text-foreground'
          )}
          aria-label="Bold"
          title="Bold"
        >
          <span className="font-bold text-sm">B</span>
        </Button>

        {/* Italic */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(
            editor?.isActive('italic') && 'bg-muted text-foreground'
          )}
          aria-label="Italic"
          title="Italic"
        >
          <span className="italic text-sm">I</span>
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* H1 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(
            editor?.isActive('heading', { level: 1 }) &&
              'bg-muted text-foreground'
          )}
          aria-label="Heading 1"
          title="Heading 1"
        >
          <span className="text-xs font-semibold">H1</span>
        </Button>

        {/* H2 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={cn(
            editor?.isActive('heading', { level: 2 }) &&
              'bg-muted text-foreground'
          )}
          aria-label="Heading 2"
          title="Heading 2"
        >
          <span className="text-xs font-semibold">H2</span>
        </Button>

        {/* H3 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={cn(
            editor?.isActive('heading', { level: 3 }) &&
              'bg-muted text-foreground'
          )}
          aria-label="Heading 3"
          title="Heading 3"
        >
          <span className="text-xs font-semibold">H3</span>
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Bullet List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            editor?.isActive('bulletList') && 'bg-muted text-foreground'
          )}
          aria-label="Bullet List"
          title="Bullet List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </Button>

        {/* Ordered List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={cn(
            editor?.isActive('orderedList') && 'bg-muted text-foreground'
          )}
          aria-label="Ordered List"
          title="Ordered List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Blockquote */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={cn(
            editor?.isActive('blockquote') && 'bg-muted text-foreground'
          )}
          aria-label="Blockquote"
          title="Blockquote"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </Button>
      </div>

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  )
}
