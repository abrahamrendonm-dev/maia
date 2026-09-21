import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNEL_LABELS, isBlogChannel } from './channels';
import { BlogNotFound } from './BlogNotFound';
import { PostCard } from './PostCard';
import { Footer } from './Footer';

interface PostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  cover_image: string | null;
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
        .select('slug, title, excerpt, published_at, cover_image')
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

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-[#F4EEE2] font-serif px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl mb-10">{BLOG_CHANNEL_LABELS[channel]}</h1>

        {posts.length === 0 ? (
          <p className="text-[#2D3436]/60">Todavía no hay publicaciones.</p>
        ) : (
          <>
            <Link to={`/blog/${channel}/${featured.slug}`} className="block group mb-14">
              {featured.cover_image && (
                <img src={featured.cover_image} alt="" className="w-full mb-6 rounded" />
              )}
              <h2 className="text-3xl leading-tight group-hover:underline">{featured.title}</h2>
              {featured.excerpt && <p className="mt-3 text-lg text-[#2D3436]/70">{featured.excerpt}</p>}
              {featured.published_at && (
                <p className="mt-3 text-sm text-[#2D3436]/50">
                  {new Date(featured.published_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </Link>

            {rest.length > 0 && (
              <ul className="space-y-10">
                {rest.map((post) => (
                  <li key={post.slug}>
                    <PostCard
                      channel={channel}
                      slug={post.slug}
                      title={post.title}
                      excerpt={post.excerpt}
                      publishedAt={post.published_at}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <Footer />
      </div>
    </div>
  );
};
