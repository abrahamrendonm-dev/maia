-- Fix: recursión infinita entre blog_posts y post_authors.
--
-- editors_full_access (blog_posts) consulta post_authors para saber si el
-- usuario es autor del post. Evaluar esa subquery dispara las políticas RLS
-- de post_authors, y post_authors_public_read_published volvía a consultar
-- blog_posts (bp.status = 'published') — ciclo infinito detectado por
-- Postgres ("infinite recursion detected in policy for relation
-- 'blog_posts'"), justo al intentar el RETURNING de un insert (select('id')
-- después de insert() obliga a evaluar si la fila insertada es visible).
--
-- Se rompe el ciclo con una función security definer (mismo patrón que
-- public.is_active_consultant_of en 002_consultant_panel.sql) que consulta
-- blog_posts sin volver a pasar por sus propias políticas RLS.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 010_fix_blog_posts_editor_policy.sql.

create or replace function public.is_blog_post_published(target_post_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blog_posts
    where id = target_post_id and status = 'published'
  );
$$;

revoke all on function public.is_blog_post_published(uuid) from public;
grant execute on function public.is_blog_post_published(uuid) to anon, authenticated;

drop policy if exists post_authors_public_read_published on public.post_authors;
create policy post_authors_public_read_published
  on public.post_authors for select
  to anon, authenticated
  using (public.is_blog_post_published(post_authors.post_id));
