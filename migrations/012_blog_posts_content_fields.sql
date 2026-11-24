-- Rediseño del blog (guardianadelavida.com): campos nuevos que el nuevo
-- diseño de artículo necesita y que no existían — tema/etiqueta para los
-- filtros del canal, puntos clave, señales de alarma y referencias.
--
-- Arrays de texto simple (no jsonb) porque son listas planas de líneas de
-- texto, sin estructura interna que justifique más que eso.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 011_fix_blog_posts_rls_recursion.sql.

alter table public.blog_posts add column if not exists tema text;
alter table public.blog_posts add column if not exists puntos_clave text[] not null default '{}';
alter table public.blog_posts add column if not exists senales_alarma text[] not null default '{}';
alter table public.blog_posts add column if not exists referencias text[] not null default '{}';

create index if not exists idx_blog_posts_tema on public.blog_posts (tema);
