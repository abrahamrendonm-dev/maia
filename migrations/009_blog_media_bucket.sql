-- Blog integrado en MAIA — bucket de Storage 'blog-media' (brief-tecnico-blog.md,
-- sección 2: "lectura pública, subida restringida a rol editor"). Nunca se había
-- creado — 007_blog_posts.sql solo cubrió las tablas. Lo necesita /blog-editor
-- para subir imagen de portada y las imágenes insertadas en el cuerpo del post.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 008_profiles_role_editor.sql.

insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

create policy blog_media_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-media');

create policy blog_media_editors_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  );

create policy blog_media_editors_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  )
  with check (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  );

create policy blog_media_editors_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'editor')
  );
