import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { isBlogChannel, BLOG_CHANNEL_LABELS } from './channels';
import { BlogNotFound } from './BlogNotFound';
import { renderTiptapContent } from './tiptapRenderer';
import { PuntosClave, SenalesAlarma, Referencias } from './ArticleExtras';
import { PostCard, type PostCardData } from './PostCard';
import { fetchAuthorNamesByPost } from './fetchAuthorNames';
import { ShareButtons } from './ShareButtons';
import { Footer } from './Footer';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  cover_image: string | null;
  reading_time_minutes: number | null;
  tema: string | null;
  puntos_clave: string[];
  senales_alarma: string[];
  referencias: string[];
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
  const [relacionados, setRelacionados] = useState<PostCardData[]>([]);
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
        .select(
          'id, title, excerpt, content, cover_image, reading_time_minutes, tema, puntos_clave, senales_alarma, referencias',
        )
        .eq('channel', channel)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error || !postData) {
        setPost(null);
        setAuthorNames([]);
        setRelacionados([]);
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

      const { data: relacionadosData } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, published_at, cover_image, tema, reading_time_minutes')
        .eq('channel', channel)
        .eq('status', 'published')
        .neq('id', postData.id)
        .order('published_at', { ascending: false })
        .limit(3);

      const rows = relacionadosData || [];
      const authorsByPost = await fetchAuthorNamesByPost(rows.map((r) => r.id));
      setRelacionados(
        rows.map((r) => ({
          channel,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          publishedAt: r.published_at,
          coverImage: r.cover_image,
          tema: r.tema,
          readingTimeMinutes: r.reading_time_minutes,
          authorNames: authorsByPost.get(r.id) ?? [],
        })),
      );

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
      <div className="min-h-screen bg-[#F4EEE2] flex items-center justify-center">
        <p className="font-sans text-[#2D3436]/60">Cargando...</p>
      </div>
    );
  }

  if (notFound || !post || !isBlogChannel(channel)) {
    return <BlogNotFound />;
  }

  return (
    <div className="bg-[#F4EEE2] font-serif min-h-screen">
      {/* Encabezado mínimo (lectura sin distracciones) */}
      <header className="border-b border-[#E2D9C8]">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between gap-4 font-sans font-semibold text-[15px]">
          <Link to={`/${channel}`} className="flex items-center gap-2 no-underline text-[#2D3436] py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Volver al blog
          </Link>
          <Link to="/" className="font-serif font-bold text-lg tracking-wide text-[#2D3436] no-underline">
            Guardiana de la Vida
          </Link>
        </div>
      </header>

      <main>
        <article className="max-w-[720px] mx-auto px-6 pt-14 pb-8 flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <nav aria-label="Ruta" className="font-sans flex flex-wrap gap-2 text-xs font-bold tracking-wide uppercase">
              <Link to={`/${channel}`} className="text-[#8B5E3C] no-underline">
                {BLOG_CHANNEL_LABELS[channel]}
              </Link>
              {post.tema && (
                <>
                  <span className="text-[#8F8A80]" aria-hidden="true">
                    /
                  </span>
                  <span className="text-[#8B5E3C]">{post.tema}</span>
                </>
              )}
            </nav>

            <h1 className="m-0 font-semibold text-[32px] sm:text-[44px] leading-tight">{post.title}</h1>

            {post.excerpt && (
              <p className="m-0 text-xl leading-relaxed text-[#4A5254] italic">{post.excerpt}</p>
            )}

            {(authorNames.length > 0 || post.reading_time_minutes != null) && (
              <div className="font-sans flex flex-wrap items-center gap-4 py-4 border-t border-b border-[#E2D9C8] text-sm font-semibold text-[#5C6466]">
                {authorNames.length > 0 && <span className="text-[#2D3436] font-bold">{authorNames.join(' y ')}</span>}
                {post.reading_time_minutes != null && <span>{post.reading_time_minutes} min de lectura</span>}
              </div>
            )}
          </div>

          {post.cover_image && <img src={post.cover_image} alt="" className="rounded-2xl w-full" />}

          <PuntosClave items={post.puntos_clave} />

          <div className="text-xl leading-[1.75]">{renderTiptapContent(post.content)}</div>

          <SenalesAlarma items={post.senales_alarma} />

          <Referencias items={post.referencias} />

          <p className="font-sans text-xs font-semibold leading-relaxed text-[#5C6466] m-0">
            Este contenido es informativo y no sustituye la consulta con un profesional de la salud.
          </p>

          <ShareButtons title={post.title} excerpt={post.excerpt} />
        </article>

        {relacionados.length > 0 && (
          <section aria-labelledby="sigue-leyendo" className="border-t border-[#E2D9C8] bg-[#F5F2ED]">
            <div className="max-w-[1040px] mx-auto px-6 pt-14 pb-16 flex flex-col gap-7">
              <h2 id="sigue-leyendo" className="m-0 font-semibold text-[28px]">
                Sigue leyendo
              </h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {relacionados.map((r) => (
                  <PostCard key={r.slug} post={r} variant="grid" />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-[720px] mx-auto px-6 pb-14">
          <Footer />
        </div>
      </main>
    </div>
  );
};
