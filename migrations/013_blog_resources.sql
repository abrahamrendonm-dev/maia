-- Rediseño del blog: sección "Guías y recursos gratuitos" de la portada
-- (Main.dc.html) — PDFs descargables por canal, independientes de cualquier
-- post puntual. Tabla nueva, no vive dentro de blog_posts.
--
-- Mismo patrón de RLS que blog_posts/post_authors: lectura pública, gestión
-- solo para profiles.role = 'editor'. No referencia blog_posts ni
-- post_authors, así que no hay riesgo de la recursión que se resolvió en
-- 011_fix_blog_posts_rls_recursion.sql.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 012_blog_posts_content_fields.sql.

create table public.blog_resources (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('bere', 'cognicion')),
  title text not null,
  meta text,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_resources_channel on public.blog_resources (channel);

alter table public.blog_resources enable row level security;

create policy blog_resources_public_read
  on public.blog_resources for select
  to anon, authenticated
  using (true);

create policy blog_resources_editors_manage
  on public.blog_resources for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'));
