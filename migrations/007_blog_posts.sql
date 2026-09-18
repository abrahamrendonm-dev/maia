-- Blog integrado en MAIA (Bere + Cognición) — tablas blog_posts y post_authors.
-- Ver brief-tecnico-blog.md, sección 2, para el contexto completo (dos canales
-- editoriales, colaboradores múltiples vía checkboxes en el editor).
--
-- Correr manualmente en el SQL Editor de Supabase, después de 006_appointments_subject.sql.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('bere', 'cognicion')),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb not null, -- formato del editor Tiptap
  cover_image text,
  reading_time_minutes int,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_authors (
  post_id uuid references public.blog_posts(id) on delete cascade,
  author_id uuid references auth.users(id),
  primary key (post_id, author_id)
);

create index if not exists idx_blog_posts_channel_status on public.blog_posts (channel, status);
create index if not exists idx_post_authors_author_id on public.post_authors (author_id);

alter table public.blog_posts enable row level security;

-- Políticas del brief técnico (sección 2), con editors_full_access adaptada al
-- patrón del resto del esquema: rol vía public.profiles.role (ver
-- 002_consultant_panel.sql), no vía auth.jwt() ->> 'role'. Requiere que
-- profiles.role admita 'editor' — ver 008_profiles_role_editor.sql.
create policy public_read_published
  on public.blog_posts for select
  to anon, authenticated
  using (status = 'published');

create policy editors_full_access
  on public.blog_posts for all
  to authenticated
  using (
    auth.uid() in (select author_id from public.post_authors where post_id = blog_posts.id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  );

alter table public.post_authors enable row level security;

-- Lectura pública solo de autores de posts publicados (mismo criterio que
-- public_read_published en blog_posts).
create policy post_authors_public_read_published
  on public.post_authors for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.blog_posts bp
      where bp.id = post_authors.post_id and bp.status = 'published'
    )
  );

-- Gestión completa solo para editores (mismo criterio que editors_full_access).
create policy post_authors_editors_manage
  on public.post_authors for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'));
