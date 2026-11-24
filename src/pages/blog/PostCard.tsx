import { Link } from 'react-router-dom';
import { BLOG_CHANNEL_LABELS, type BlogChannel } from './channels';

export interface PostCardData {
  channel: BlogChannel;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  coverImage: string | null;
  tema: string | null;
  readingTimeMinutes: number | null;
  authorNames: string[];
}

interface PostCardProps {
  post: PostCardData;
  // 'grid': tarjeta vertical (imagen arriba) — portada del blog.
  // 'row': fila horizontal (imagen a la izquierda) — listado de un canal.
  variant?: 'grid' | 'row';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CoverPlaceholder = ({ className }: { className: string }) => (
  <div className={`bg-[#E6DDCB] flex items-center justify-center text-[#6B4A30] text-sm font-semibold ${className}`}>
    [Imagen]
  </div>
);

export const PostCard = ({ post, variant = 'grid' }: PostCardProps) => {
  const authorLine = post.authorNames.length > 0 ? post.authorNames.join(' y ') : null;

  if (variant === 'row') {
    return (
      <Link
        to={`/${post.channel}/${post.slug}`}
        className="flex flex-wrap gap-7 p-7 border-b border-[#EDE8DF] last:border-0 no-underline text-[#2D3436]"
      >
        {post.coverImage ? (
          <img src={post.coverImage} alt="" className="w-[220px] h-[148px] shrink-0 rounded-xl object-cover" />
        ) : (
          <CoverPlaceholder className="w-[220px] h-[148px] shrink-0 rounded-xl" />
        )}
        <div className="flex-[999_1_360px] min-w-0 flex flex-col gap-2">
          {post.tema && (
            <span className="text-xs font-bold tracking-wide uppercase text-[#8B5E3C]">{post.tema}</span>
          )}
          <span className="font-serif font-semibold text-2xl leading-snug">{post.title}</span>
          {post.excerpt && <span className="font-serif text-lg leading-relaxed text-[#4A5254]">{post.excerpt}</span>}
          <span className="text-sm font-semibold text-[#5C6466]">
            {authorLine ? `${authorLine} · ` : ''}
            {post.readingTimeMinutes != null ? `${post.readingTimeMinutes} min de lectura` : null}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/${post.channel}/${post.slug}`}
      className="flex flex-col bg-[#FFFDF9] border border-[#E4DED4] rounded-2xl overflow-hidden no-underline text-[#2D3436]"
    >
      {post.coverImage ? (
        <img src={post.coverImage} alt="" className="h-[180px] w-full object-cover" />
      ) : (
        <CoverPlaceholder className="h-[180px] w-full" />
      )}
      <div className="p-6 flex flex-col gap-2 grow">
        <span className="text-xs font-bold tracking-wide uppercase text-[#8B5E3C]">
          {BLOG_CHANNEL_LABELS[post.channel]}
          {post.tema ? ` · ${post.tema}` : ''}
        </span>
        <span className="font-serif font-semibold text-[22px] leading-snug">{post.title}</span>
        {post.excerpt && (
          <span className="font-serif text-base leading-relaxed text-[#4A5254] grow">{post.excerpt}</span>
        )}
        <span className="text-[13px] font-semibold text-[#5C6466] pt-2 border-t border-[#EDE8DF]">
          {authorLine ? `${authorLine} · ` : ''}
          {post.readingTimeMinutes != null ? `${post.readingTimeMinutes} min de lectura` : ''}
          {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ''}
        </span>
      </div>
    </Link>
  );
};
