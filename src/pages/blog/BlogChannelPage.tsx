import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNELS, BLOG_CHANNEL_LABELS, BLOG_CHANNEL_DESCRIPTIONS, isBlogChannel } from './channels';
import { BlogNotFound } from './BlogNotFound';
import { BlogHeader } from './BlogHeader';
import { PostCard, type PostCardData } from './PostCard';
import { fetchAuthorNamesByPost } from './fetchAuthorNames';
import { Footer } from './Footer';

const TODOS = 'Todos';

export const BlogChannelPage = () => {
  const { channel } = useParams<{ channel: string }>();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tema, setTema] = useState(searchParams.get('tema') || TODOS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isBlogChannel(channel)) {
      setLoading(false);
      return;
    }

    setTema(searchParams.get('tema') || TODOS);
    setSearch('');

    const cargarPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, published_at, cover_image, tema, reading_time_minutes')
        .eq('channel', channel)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const rows = data || [];
      const authorsByPost = await fetchAuthorNamesByPost(rows.map((r) => r.id));

      setPosts(
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

    cargarPosts();
  }, [channel]);

  const temas = useMemo(() => {
    const vistos = new Set(posts.map((p) => p.tema).filter((t): t is string => !!t));
    return [TODOS, ...vistos];
  }, [posts]);

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const coincideTema = tema === TODOS || p.tema === tema;
      const coincideBusqueda = q === '' || p.title.toLowerCase().includes(q);
      return coincideTema && coincideBusqueda;
    });
  }, [posts, tema, search]);

  if (!isBlogChannel(channel)) {
    return <BlogNotFound />;
  }

  const otroCanal = BLOG_CHANNELS.find((c) => c !== channel)!;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <p className="text-[#2D3436]/60">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      <BlogHeader />

      {/* Cabecera del canal */}
      <section className="bg-[#F4EEE2] border-b border-[#E2D9C8]">
        <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-14">
          <nav aria-label="Ruta" className="flex gap-2 text-xs font-bold tracking-wide uppercase mb-5">
            <Link to="/" className="text-[#5C6466] no-underline">
              Inicio
            </Link>
            <span className="text-[#8F8A80]" aria-hidden="true">
              /
            </span>
            <span className="text-[#8B5E3C]">{BLOG_CHANNEL_LABELS[channel]}</span>
          </nav>
          <h1 className="m-0 font-serif font-semibold text-[42px] sm:text-[50px] leading-tight">
            {BLOG_CHANNEL_LABELS[channel]}
          </h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-[#4A5254] max-w-[600px]">
            {BLOG_CHANNEL_DESCRIPTIONS[channel]}
          </p>
        </div>
      </section>

      {/* Filtros y listado */}
      <section className="max-w-[1200px] mx-auto px-6 pt-12 pb-20 flex flex-col gap-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div role="group" aria-label="Filtrar por tema" className="flex flex-wrap gap-2.5">
            {temas.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTema(t)}
                aria-pressed={t === tema}
                className={`min-h-11 px-5 rounded-full text-[15px] font-bold ${
                  t === tema
                    ? 'bg-[#8B5E3C] text-[#FFFDF9] border border-[#8B5E3C]'
                    : 'bg-[#FFFDF9] text-[#2D3436] border border-[#CFC7BA]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2.5 text-sm font-semibold text-[#5C6466]">
            <span>Buscar en el canal</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. extracción"
              className="h-11 w-60 box-border px-4 rounded-full border border-[#CFC7BA] bg-[#FFFDF9] text-[15px] text-[#2D3436]"
            />
          </label>
        </div>

        <span className="text-sm font-semibold text-[#5C6466]">
          {visibles.length} {visibles.length === 1 ? 'publicación' : 'publicaciones'}
        </span>

        {visibles.length === 0 ? (
          <p className="text-[#2D3436]/60">
            {posts.length === 0 ? 'Todavía no hay publicaciones en este canal.' : 'Nada coincide con ese filtro.'}
          </p>
        ) : (
          <div className="flex flex-col bg-[#FFFDF9] border border-[#E4DED4] rounded-[20px]">
            {visibles.map((post) => (
              <PostCard key={post.slug} post={post} variant="row" />
            ))}
          </div>
        )}
      </section>

      {/* Cruce al otro canal */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <Link
          to={`/${otroCanal}`}
          className="flex flex-wrap items-center justify-between gap-6 px-10 py-9 rounded-[20px] bg-[#EEF2EF] border-t-[6px] border-[#7A9482] no-underline text-[#2D3436]"
        >
          <span className="flex flex-col gap-2 max-w-[640px]">
            <span className="text-xs font-bold tracking-widest uppercase text-[#4A6352]">
              También te puede interesar
            </span>
            <span className="font-serif font-semibold text-[26px]">{BLOG_CHANNEL_LABELS[otroCanal]}</span>
          </span>
          <span className="font-bold text-[15px] text-[#4A6352]">Ir al canal</span>
        </Link>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 pb-16">
        <Footer />
      </div>
    </div>
  );
};
