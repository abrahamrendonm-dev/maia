import { Link } from 'react-router-dom';
import { BLOG_CHANNEL_LABELS, type BlogChannel } from './channels';

interface PostCardProps {
  channel: BlogChannel;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  // BlogChannelPage no la necesita (ya es obvio en qué canal estás). BlogHome
  // sí, porque combina posts de los dos canales en una sola lista.
  showChannel?: boolean;
}

export const PostCard = ({ channel, slug, title, excerpt, publishedAt, showChannel = false }: PostCardProps) => (
  <Link to={`/blog/${channel}/${slug}`} className="block group">
    {showChannel && (
      <p className="text-xs uppercase tracking-wide text-[#2D3436]/40 mb-1">{BLOG_CHANNEL_LABELS[channel]}</p>
    )}
    <h2 className="text-xl group-hover:underline">{title}</h2>
    {excerpt && <p className="mt-1 text-[#2D3436]/70">{excerpt}</p>}
    {publishedAt && (
      <p className="mt-2 text-sm text-[#2D3436]/50">
        {new Date(publishedAt).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    )}
  </Link>
);
