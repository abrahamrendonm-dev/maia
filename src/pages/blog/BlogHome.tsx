import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNELS, BLOG_CHANNEL_LABELS, type BlogChannel } from './channels';
import { PostCard } from './PostCard';
import { Footer } from './Footer';

interface PostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  channel: BlogChannel;
}

const LATEST_POSTS_LIMIT = 6;

// TODO (Bere): descripción corta real de cada canal, en tu voz — esto es
// texto de relleno solo para maquetar el layout de las tarjetas.
const CHANNEL_DESCRIPTIONS: Record<BlogChannel, string> = {
  bere: 'TODO — descripción corta del canal Bere.',
  cognicion: 'TODO — descripción corta del canal Cognición.',
};

export const BlogHome = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, published_at, channel')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(LATEST_POSTS_LIMIT);

      setPosts(data || []);
      setLoading(false);
    };

    cargarPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EEE2] font-serif px-6 py-16">
      <div className="max-w-3xl mx-auto">
        {/*
          TODO (Bere): texto de presentación del blog en general, en tu voz —
          quién escribe, para quién es, qué van a encontrar en los dos
          canales. Esto es placeholder solo para maquetar el layout, no lo
          redacto yo como definitivo.
        */}
        <p className="text-sm text-[#2D3436]/50 mb-2">[TODO — presentación de Bere]</p>
        <h1 className="text-3xl leading-tight mb-16 max-w-xl">
          TODO: un párrafo breve presentando el proyecto — quién escribe, para quién es, y qué
          van a encontrar en los dos canales.
        </h1>

        <div className="grid sm:grid-cols-2 gap-6 mb-20">
          {BLOG_CHANNELS.map((channel) => (
            <Link
              key={channel}
              to={`/blog/${channel}`}
              className="block group border border-[#2D3436]/10 rounded-2xl p-8 hover:border-[#2D3436]/30 transition-colors"
            >
              <h2 className="text-2xl mb-2 group-hover:underline">{BLOG_CHANNEL_LABELS[channel]}</h2>
              <p className="text-[#2D3436]/60">{CHANNEL_DESCRIPTIONS[channel]}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-xs uppercase tracking-wide text-[#2D3436]/50 mb-8">Últimas publicaciones</h2>

        {loading ? (
          <p className="text-[#2D3436]/60">Cargando...</p>
        ) : posts.length === 0 ? (
          <p className="text-[#2D3436]/60">Todavía no hay publicaciones.</p>
        ) : (
          <ul className="space-y-10">
            {posts.map((post) => (
              <li key={`${post.channel}-${post.slug}`}>
                <PostCard
                  channel={post.channel}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  publishedAt={post.published_at}
                  showChannel
                />
              </li>
            ))}
          </ul>
        )}

        <Footer />
      </div>
    </div>
  );
};
