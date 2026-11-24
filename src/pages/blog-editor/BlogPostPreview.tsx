import { renderTiptapContent } from '../blog/tiptapRenderer';
import { PuntosClave, SenalesAlarma, Referencias } from '../blog/ArticleExtras';

interface BlogPostPreviewProps {
  title: string;
  authorNames: string[];
  coverImage: string;
  readingTimeMinutes: number;
  content: unknown;
  puntosClave: string[];
  senalesAlarma: string[];
  referencias: string[];
}

// Duplica a propósito el layout general de src/pages/blog/BlogPostPage.tsx
// (mismo fondo #F4EEE2, mismo font-serif) para que la vista previa se vea
// igual a la página pública — los bloques de puntos clave / alerta /
// referencias sí se comparten de verdad (ver ArticleExtras.tsx).
export const BlogPostPreview = ({
  title,
  authorNames,
  coverImage,
  readingTimeMinutes,
  content,
  puntosClave,
  senalesAlarma,
  referencias,
}: BlogPostPreviewProps) => (
  <article className="bg-[#F4EEE2] font-serif px-6 py-16 rounded-2xl">
    <div className="max-w-2xl mx-auto flex flex-col gap-7">
      <div>
        <p className="font-sans text-sm text-[#2D3436]/50 mb-4">{readingTimeMinutes} min de lectura</p>
        <h1 className="text-3xl md:text-4xl leading-tight mb-4">{title || '(Sin título)'}</h1>
        {authorNames.length > 0 && (
          <p className="font-sans text-sm text-[#2D3436]/60">Por {authorNames.join(' y ')}</p>
        )}
      </div>

      {coverImage && <img src={coverImage} alt="" className="w-full rounded" />}

      <PuntosClave items={puntosClave} />

      <div className="text-lg">{renderTiptapContent(content)}</div>

      <SenalesAlarma items={senalesAlarma} />

      <Referencias items={referencias} />
    </div>
  </article>
);
