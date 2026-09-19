-- Fix: la política editors_full_access que quedó viva en producción era la
-- versión original de 007 (auth.jwt() ->> 'role'), no la corregida a
-- profiles.role que se pidió después. Editar 007_blog_posts.sql en el repo
-- nunca reaplica nada a una base ya migrada — hacía falta una migración nueva.
--
-- Diagnóstico confirmado en pg_policies: with_check de editors_full_access
-- era (auth.jwt() ->> 'role'::text) = 'editor'::text, que nunca puede ser
-- cierto porque este proyecto no configura ningún custom claim de JWT — por
-- eso cualquier insert/update de un editor fallaba con "new row violates
-- row-level security policy".
--
-- Correr manualmente en el SQL Editor de Supabase, después de 009_blog_media_bucket.sql.

drop policy if exists editors_full_access on public.blog_posts;

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

-- Mismo motivo de posible desfase: aseguramos que RLS + políticas de
-- post_authors también queden tal como están en 007_blog_posts.sql, sin
-- importar si ya se habían aplicado o no (drop if exists las hace seguras
-- de re-correr en cualquier caso).
alter table public.post_authors enable row level security;

drop policy if exists post_authors_public_read_published on public.post_authors;
create policy post_authors_public_read_published
  on public.post_authors for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.blog_posts bp
      where bp.id = post_authors.post_id and bp.status = 'published'
    )
  );

drop policy if exists post_authors_editors_manage on public.post_authors;
create policy post_authors_editors_manage
  on public.post_authors for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor'));
