import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { isBlogChannel } from './channels';
import { BlogNotFound } from './BlogNotFound';
import { renderTiptapContent } from './tiptapRenderer';
import { ShareButtons } from './ShareButtons';
import { Footer } from './Footer';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  cover_image: string | null;
  reading_time_minutes: number | null;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const BlogPostPage = () => {
  const { channel, slug } = useParams<{ channel: string; slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [authorNames, setAuthorNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isBlogChannel(channel) || !slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const cargarPost = async () => {
      setLoading(true);
      setNotFound(false);

      const { data: postData, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, content, cover_image, reading_time_minutes')
        .eq('channel', channel)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error || !postData) {
        setPost(null);
        setAuthorNames([]);
        setLoading(false);
        setNotFound(true);
        return;
      }

      setPost(postData);

      // post_authors.author_id referencia auth.users(id), no public.profiles(id),
      // así que PostgREST no puede embeber profiles directamente en un solo select:
      // se resuelve en dos pasos.
      const { data: authors } = await supabase
        .from('post_authors')
        .select('author_id')
        .eq('post_id', postData.id);

      if (authors && authors.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in(
            'id',
            authors.map((a) => a.author_id),
          );

        setAuthorNames((profiles || []).map((p) => p.display_name).filter((n): n is string => !!n));
      } else {
        setAuthorNames([]);
      }

      setLoading(false);
    };

    cargarPost();
  }, [channel, slug]);

  useEffect(() => {
    if (!post) return;

    document.title = post.title;
    setMetaTag('name', 'description', post.excerpt ?? '');
    setMetaTag('property', 'og:title', post.title);
    setMetaTag('property', 'og:description', post.excerpt ?? '');
    if (post.cover_image) {
      setMetaTag('property', 'og:image', post.cover_image);
    }
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EEE2] font-serif flex items-center justify-center">
        <p className="text-[#2D3436]/60">Cargando...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return <BlogNotFound />;
  }

  return (
    <article className="min-h-screen bg-[#F4EEE2] font-serif px-6 py-16">
      <div className="max-w-2xl mx-auto">
        {post.reading_time_minutes != null && (
          <p className="text-sm text-[#2D3436]/50 mb-4">{post.reading_time_minutes} min de lectura</p>
        )}

        <h1 className="text-3xl md:text-4xl leading-tight mb-4">{post.title}</h1>

        {authorNames.length > 0 && (
          <p className="text-sm text-[#2D3436]/60 mb-8">Por {authorNames.join(' y ')}</p>
        )}

        {post.cover_image && <img src={post.cover_image} alt="" className="w-full mb-10 rounded" />}

        <div className="text-lg">{renderTiptapContent(post.content)}</div>

        <ShareButtons title={post.title} excerpt={post.excerpt} />

        <Footer />
      </div>
    </article>
  );
};
