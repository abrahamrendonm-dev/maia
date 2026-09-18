import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNEL_LABELS, isBlogChannel } from './channels';
import { BlogNotFound } from './BlogNotFound';

interface PostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
}

export const BlogChannelPage = () => {
  const { channel } = useParams<{ channel: string }>();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isBlogChannel(channel)) {
      setLoading(false);
      return;
    }

    const cargarPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, published_at')
        .eq('channel', channel)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      setPosts(data || []);
      setLoading(false);
    };

    cargarPosts();
  }, [channel]);

  if (!isBlogChannel(channel)) {
    return <BlogNotFound />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EEE2] font-serif flex items-center justify-center">
        <p className="text-[#2D3436]/60">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EEE2] font-serif px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl mb-10">{BLOG_CHANNEL_LABELS[channel]}</h1>

        {posts.length === 0 ? (
          <p className="text-[#2D3436]/60">Todavía no hay publicaciones.</p>
        ) : (
          <ul className="space-y-10">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${channel}/${post.slug}`} className="block group">
                  <h2 className="text-xl group-hover:underline">{post.title}</h2>
                  {post.excerpt && <p className="mt-1 text-[#2D3436]/70">{post.excerpt}</p>}
                  {post.published_at && (
                    <p className="mt-2 text-sm text-[#2D3436]/50">
                      {new Date(post.published_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
