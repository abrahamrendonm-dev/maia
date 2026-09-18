-- Blog integrado en MAIA — agrega el rol 'editor' a profiles.role, requerido
-- por las políticas editors_full_access / post_authors_editors_manage de
-- 007_blog_posts.sql.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 007_blog_posts.sql.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['mother', 'partner', 'support', 'consultant', 'editor']));
