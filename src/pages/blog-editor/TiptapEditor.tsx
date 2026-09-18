import type { ReactNode } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import { Bold, Italic, Heading2, List, ListOrdered, Quote, ImageIcon, Link as LinkIcon } from 'lucide-react';
import { uploadBlogMedia } from './uploadBlogMedia';

interface TiptapEditorProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}

const ToolbarButton = ({ active, onClick, label, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-2 rounded-lg transition-colors ${
      active ? 'bg-[#7A9482] text-white' : 'text-[#2D3436] hover:bg-[#7A9482]/10'
    }`}
  >
    {children}
  </button>
);

export const TiptapEditor = ({ editor }: TiptapEditorProps) => {
  if (!editor) return null;

  const handleInsertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadBlogMedia(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // El estado de error se maneja a nivel de formulario; aquí solo evitamos
        // que una subida fallida rompa el editor.
      }
    };
    input.click();
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del link', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-[#7A9482]/20 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#7A9482]/20 bg-[#F5F2ED]">
        <ToolbarButton
          label="Negrita"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Encabezado"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Cita"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={18} />
        </ToolbarButton>
        <ToolbarButton label="Imagen" onClick={handleInsertImage}>
          <ImageIcon size={18} />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={handleSetLink}>
          <LinkIcon size={18} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="prose-editor px-4 py-3 min-h-[300px] max-h-[600px] overflow-y-auto" />
    </div>
  );
};
