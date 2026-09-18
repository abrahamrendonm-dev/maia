import { renderTiptapContent } from '../blog/tiptapRenderer';

interface BlogPostPreviewProps {
  title: string;
  authorNames: string[];
  coverImage: string;
  readingTimeMinutes: number;
  content: unknown;
}

// Duplica a propósito el layout de src/pages/blog/BlogPostPage.tsx (mismo fondo
// #F4EEE2, mismo font-serif) para que la vista previa se vea igual a la página
// pública. No se extrajo un componente compartido porque esta tarea pidió no
// tocar las rutas públicas del blog ya existentes.
export const BlogPostPreview = ({
  title,
  authorNames,
  coverImage,
  readingTimeMinutes,
  content,
}: BlogPostPreviewProps) => (
  <article className="bg-[#F4EEE2] font-serif px-6 py-16 rounded-2xl">
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-[#2D3436]/50 mb-4">{readingTimeMinutes} min de lectura</p>

      <h1 className="text-3xl md:text-4xl leading-tight mb-4">{title || '(Sin título)'}</h1>

      {authorNames.length > 0 && <p className="text-sm text-[#2D3436]/60 mb-8">Por {authorNames.join(' y ')}</p>}

      {coverImage && <img src={coverImage} alt="" className="w-full mb-10 rounded" />}

      <div className="text-lg">{renderTiptapContent(content)}</div>
    </div>
  </article>
);
