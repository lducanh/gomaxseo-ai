'use client';
import * as React from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function TbButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors',
        active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-hover hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

const EDITOR_PROPS = {
  attributes: { class: 'prose-gomax min-h-[420px] max-w-none focus:outline-none' },
};

export function Editor({
  content,
  onChange,
  onEditor,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  onEditor?: (editor: TiptapEditor | null) => void;
  placeholder?: string;
}) {
  const extensions = React.useMemo(() => [
    // StarterKit v3 bundles Link — configure it here (do NOT add it again).
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', class: 'gomax-link' },
      },
    }),
    Placeholder.configure({ placeholder: placeholder || 'Bắt đầu viết…' }),
  ], [placeholder]);

  const initialContent = React.useRef(content);

  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR (TipTap v3)
    extensions,
    content: initialContent.current,
    editorProps: EDITOR_PROPS,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  }, [1]);

  React.useEffect(() => {
    onEditor?.(editor ?? null);
    return () => onEditor?.(null);
  }, [editor, onEditor]);

  if (!editor) {
    return <div className="min-h-[420px] animate-pulse rounded-md bg-surface-hover/30" />;
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface">
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-border bg-surface/95 px-2 py-1.5 backdrop-blur">
        <TbButton title="Đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </TbButton>
        <TbButton title="Nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </TbButton>
        <TbButton title="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </TbButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <TbButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </TbButton>
        <TbButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </TbButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <TbButton title="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </TbButton>
        <TbButton title="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </TbButton>
        <TbButton title="Liên kết" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </TbButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <TbButton title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </TbButton>
        <TbButton title="Làm lại" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </TbButton>
      </div>
      <div className="px-4 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
