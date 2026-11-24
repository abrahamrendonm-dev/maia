import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNELS, BLOG_CHANNEL_LABELS, BLOG_CHANNEL_DESCRIPTIONS, type BlogChannel } from './channels';
import { PostCard, type PostCardData } from './PostCard';
import { fetchAuthorNamesByPost } from './fetchAuthorNames';
import { BlogHeader } from './BlogHeader';
import { Footer } from './Footer';

const RECIENTES_LIMIT = 6;

interface Resource {
  id: string;
  channel: BlogChannel;
  title: string;
  meta: string | null;
  file_url: string;
}

// TODO (Abraham/Bere): confirmar que estos 3 principios reflejan de verdad el
// proceso editorial antes de publicar — hoy son redacción de ejemplo.
const PRINCIPIOS = [
  {
    n: '01',
    titulo: 'Revisión profesional',
    texto: 'Cada artículo materno-infantil es escrito o revisado por una consultora certificada en lactancia (IBCLC).',
  },
  {
    n: '02',
    titulo: 'Fuentes citadas',
    texto: 'Citamos guías de organismos de salud y literatura científica al final de cada publicación.',
  },
  {
    n: '03',
    titulo: 'Actualización y transparencia',
    texto: 'Indicamos la fecha de revisión y corregimos públicamente cuando la evidencia cambia.',
  },
];

export const BlogHome = () => {
  const [featured, setFeatured] = useState<PostCardData | null>(null);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);

      const [{ data: rows }, { data: resourceRows }] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, channel, slug, title, excerpt, published_at, cover_image, tema, reading_time_minutes')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(RECIENTES_LIMIT + 1),
        supabase
          .from('blog_resources')
          .select('id, channel, title, meta, file_url')
          .order('created_at', { ascending: false }),
      ]);

      const allRows = rows || [];
      const authorsByPost = await fetchAuthorNamesByPost(allRows.map((r) => r.id));

      const toCard = (r: (typeof allRows)[number]): PostCardData => ({
        channel: r.channel,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        publishedAt: r.published_at,
        coverImage: r.cover_image,
        tema: r.tema,
        readingTimeMinutes: r.reading_time_minutes,
        authorNames: authorsByPost.get(r.id) ?? [],
      });

      setFeatured(allRows.length > 0 ? toCard(allRows[0]) : null);
      setPosts(allRows.slice(1).map(toCard));
      setResources(resourceRows || []);
      setLoading(false);
    };

    cargar();
  }, []);

  const temas = useMemo(() => {
    const map = new Map<string, BlogChannel>();
    for (const p of [...(featured ? [featured] : []), ...posts]) {
      if (p.tema && !map.has(p.tema)) map.set(p.tema, p.channel);
    }
    return [...map.entries()];
  }, [featured, posts]);

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Barra superior institucional */}
      <div className="bg-[#4A6352] text-[#FFFDF9] text-[13px] font-sans font-semibold">
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex flex-wrap justify-between gap-2">
          <span>Contenido informativo revisado por profesionales. No sustituye la consulta médica.</span>
          <a href="#metodologia" className="text-[#FFFDF9] underline">
            Cómo revisamos la información
          </a>
        </div>
      </div>

      <BlogHeader />

      <main className="font-sans">
        {/* Hero */}
        <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-[72px] grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-14 items-center">
          <div className="flex flex-col gap-6">
            {/* TODO (Bere): texto de presentación del blog en general, en tu
                voz — quién escribe, para quién es, qué van a encontrar en los
                dos canales. Placeholder solo para maquetar el layout. */}
            <span className="text-xs font-bold tracking-widest uppercase text-[#8B5E3C]">
              [TODO — presentación de Bere]
            </span>
            <h1 className="m-0 font-serif font-semibold text-[42px] sm:text-[54px] leading-tight text-[#2D3436]">
              Información confiable para acompañar cada etapa de la familia
            </h1>
            <p className="m-0 font-serif text-xl leading-relaxed text-[#4A5254] max-w-[560px]">
              TODO: un párrafo breve presentando el proyecto — quién escribe, para quién es, y qué
              van a encontrar en los dos canales.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#recientes"
                className="bg-[#4A6352] text-[#FFFDF9] no-underline font-bold text-base px-7 py-3.5 rounded-full"
              >
                Explorar artículos
              </a>
              <a
                href="#metodologia"
                className="bg-transparent text-[#4A6352] no-underline font-bold text-base px-6 py-3 rounded-full border-2 border-[#4A6352]"
              >
                Nuestra metodología
              </a>
            </div>
          </div>

          {featured && <PostCard post={featured} variant="grid" />}
        </section>

        {/* Canales */}
        <section aria-labelledby="canales" className="bg-[#FFFDF9] border-y border-[#E4DED4]">
          <div className="max-w-[1200px] mx-auto px-6 py-[72px] flex flex-col gap-10">
            <div className="flex flex-col gap-3 max-w-[640px]">
              <h2 id="canales" className="m-0 font-serif font-semibold text-4xl leading-tight">
                Dos canales, un mismo compromiso
              </h2>
              <p className="m-0 font-serif text-lg text-[#4A5254]">
                Organizamos el contenido según la etapa y la necesidad de quien lee.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
              {BLOG_CHANNELS.map((c) => (
                <Link
                  key={c}
                  to={`/${c}`}
                  className={`flex flex-col gap-4 p-9 rounded-2xl no-underline text-[#2D3436] border-t-[6px] ${
                    c === 'bere' ? 'bg-[#F4EEE2] border-[#8B5E3C]' : 'bg-[#EEF2EF] border-[#7A9482]'
                  }`}
                >
                  <span
                    className={`text-xs font-bold tracking-widest uppercase ${
                      c === 'bere' ? 'text-[#8B5E3C]' : 'text-[#4A6352]'
                    }`}
                  >
                    {c === 'bere' ? 'Canal materno-infantil' : 'Canal de bienestar general'}
                  </span>
                  <span className="font-serif font-semibold text-[30px]">{BLOG_CHANNEL_LABELS[c]}</span>
                  <span className="font-serif text-[17px] leading-relaxed text-[#4A5254]">
                    {BLOG_CHANNEL_DESCRIPTIONS[c]}
                  </span>
                  <span
                    className={`font-bold text-[15px] flex items-center gap-2 ${
                      c === 'bere' ? 'text-[#8B5E3C]' : 'text-[#4A6352]'
                    }`}
                  >
                    Ver artículos del canal →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Explora por tema */}
        {temas.length > 0 && (
          <section aria-labelledby="temas" className="max-w-[1200px] mx-auto px-6 pt-[72px] pb-6 flex flex-col gap-6">
            <h2 id="temas" className="m-0 font-serif font-semibold text-[28px]">
              Explora por tema
            </h2>
            <div className="flex flex-wrap gap-3">
              {temas.map(([t, c]) => (
                <Link
                  key={t}
                  to={`/${c}?tema=${encodeURIComponent(t)}`}
                  className="px-5 py-3 rounded-full bg-[#FFFDF9] border border-[#D6CFC3] text-[#2D3436] no-underline font-semibold text-[15px]"
                >
                  {t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recientes */}
        <section id="recientes" aria-labelledby="recientes-t" className="max-w-[1200px] mx-auto px-6 pt-12 pb-20 flex flex-col gap-8">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <h2 id="recientes-t" className="m-0 font-serif font-semibold text-4xl">
              Publicaciones recientes
            </h2>
          </div>

          {loading ? (
            <p className="text-[#2D3436]/60">Cargando...</p>
          ) : posts.length === 0 && !featured ? (
            <p className="text-[#2D3436]/60">Todavía no hay publicaciones.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-7">
              {posts.map((p) => (
                <PostCard key={`${p.channel}-${p.slug}`} post={p} variant="grid" />
              ))}
            </div>
          )}
        </section>

        {/* Metodología */}
        <section id="metodologia" aria-labelledby="metodologia-t" className="bg-[#2F4436] text-[#FFFDF9]">
          <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col gap-12">
            <div className="flex flex-col gap-4 max-w-[720px]">
              <span className="text-xs font-bold tracking-widest uppercase text-[#C9D6CD]">
                Compromiso editorial
              </span>
              <h2 id="metodologia-t" className="m-0 font-serif font-semibold text-[40px] leading-tight">
                Cómo cuidamos la información que publicamos
              </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10">
              {PRINCIPIOS.map((m) => (
                <div key={m.n} className="flex flex-col gap-3 pt-5 border-t border-[#5E7A66]">
                  <span className="font-serif text-lg text-[#C9D6CD]">{m.n}</span>
                  <span className="font-serif font-semibold text-2xl">{m.titulo}</span>
                  <span className="font-serif text-[17px] leading-relaxed text-[#E3EAE5]">{m.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" aria-labelledby="recursos-t" className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col gap-8">
          <div className="flex flex-col gap-3 max-w-[640px]">
            <h2 id="recursos-t" className="m-0 font-serif font-semibold text-4xl">
              Guías y recursos gratuitos
            </h2>
            <p className="m-0 font-serif text-lg text-[#4A5254]">
              Material práctico para imprimir o consultar en el teléfono.
            </p>
          </div>

          {resources.length === 0 ? (
            <p className="text-[#2D3436]/60">Todavía no hay recursos publicados.</p>
          ) : (
            <div className="flex flex-col bg-[#FFFDF9] border border-[#E4DED4] rounded-2xl">
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-7 py-6 border-b border-[#EDE8DF] last:border-0"
                >
                  <div className="flex items-center gap-5">
                    <span className="w-12 h-12 rounded-xl bg-[#EEF2EF] text-[#4A6352] flex items-center justify-center shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                        <path d="M14 3v5h5M9 13h6M9 17h6" />
                      </svg>
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-serif font-semibold text-xl">{r.title}</span>
                      <span className="text-sm font-semibold text-[#5C6466]">
                        {BLOG_CHANNEL_LABELS[r.channel]}
                        {r.meta ? ` · ${r.meta}` : ''}
                      </span>
                    </span>
                  </div>
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[15px] px-5 py-3 rounded-full border-2 border-[#4A6352] no-underline text-[#2D3436]"
                  >
                    Descargar PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* App MAIA */}
        <section className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="bg-[#DCE4DE] rounded-3xl p-12 flex flex-wrap items-center justify-between gap-8">
            <div className="flex flex-col gap-3 max-w-[620px]">
              <h2 className="m-0 font-serif font-semibold text-[32px] leading-snug">
                Lleva el seguimiento de tu bebé en MAIA
              </h2>
              <p className="m-0 font-serif text-lg leading-relaxed text-[#3B4446]">
                Bitácora de tomas, extracción y conservación de leche, crecimiento y citas médicas, con la
                opción de compartirlo con tu consultora.
              </p>
            </div>
            <Link
              to="/maia"
              className="bg-[#4A6352] text-[#FFFDF9] no-underline font-bold text-base px-8 py-4 rounded-full"
            >
              Abrir la app MAIA
            </Link>
          </div>
        </section>
      </main>

      {/* Pie extendido (solo en la portada) */}
      <footer className="font-sans bg-[#FFFDF9] border-t border-[#E4DED4]">
        <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-10 flex flex-col gap-10">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            <div className="flex flex-col gap-3">
              <span className="font-serif font-bold text-[22px] tracking-wide">Guardiana de la Vida</span>
              <span className="font-serif text-base leading-relaxed text-[#4A5254]">
                Acompañamiento perinatal e información de bienestar para familias hispanohablantes.
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-[15px] font-semibold">
              <span className="text-xs tracking-widest uppercase text-[#5C6466]">Canales</span>
              {BLOG_CHANNELS.map((c) => (
                <Link key={c} to={`/${c}`} className="text-[#4A6352]">
                  {BLOG_CHANNEL_LABELS[c]}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 text-[15px] font-semibold">
              <span className="text-xs tracking-widest uppercase text-[#5C6466]">Institucional</span>
              <a href="#metodologia" className="text-[#4A6352]">
                Quiénes somos
              </a>
              <a href="#metodologia" className="text-[#4A6352]">
                Política editorial
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E4DED4]">
            <Footer />
          </div>
        </div>
      </footer>
    </div>
  );
};
