# Brief técnico — Blog integrado en MAIA (Bere + Cognición)

Contexto: extensión del repo Next.js / Supabase existente de MAIA. No es un proyecto nuevo — reutiliza auth, hosting y base de datos actuales.

## 1. Alcance

Dos canales editoriales sobre el mismo motor:

| Canal | Audiencia | Tono |
|---|---|---|
| `bere` (Bere: Guardiana de la vida) | Materno-infantil, lactancia, crianza temprana | Primera persona, cercano |
| `cognicion` (Cognición) | Bienestar general, adultos | Documental, tercera persona |

Ambos aceptan colaboradores múltiples (Abraham y Berenice pueden co-firmar posts en cualquiera de los dos canales).

## 2. Esquema de base de datos (Supabase)

```sql
create table blog_posts (
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

create table post_authors (
  post_id uuid references blog_posts(id) on delete cascade,
  author_id uuid references auth.users(id),
  primary key (post_id, author_id)
);

-- Lectura pública, solo publicados
create policy "public_read_published"
on blog_posts for select
to anon, authenticated
using (status = 'published');

-- Escritura solo para editores (Abraham y Bere)
create policy "editors_full_access"
on blog_posts for all
to authenticated
using (auth.uid() in (select author_id from post_authors where post_id = blog_posts.id)
       or auth.jwt() ->> 'role' = 'editor')
with check (auth.jwt() ->> 'role' = 'editor');
```

Bucket de Storage: `blog-media`, lectura pública, subida restringida a rol `editor`.

## 3. Rutas (App Router)

```
app/
  (public)/
    blog/
      [channel]/
        page.tsx          -- listado del canal
        [slug]/
          page.tsx         -- post individual, SSG + ISR
  (admin)/
    blog-editor/
      page.tsx             -- listado de borradores/publicados (protegido)
      [id]/
        page.tsx            -- editor de un post (protegido)
```

`(public)` sin middleware de auth. `(admin)` protegido por rol `editor` vía middleware existente de MAIA.

## 4. Editor (`/blog-editor`)

Campos:
- Título (genera slug automático, editable)
- Canal: selector `bere` / `cognicion`
- Colaboradores: checkboxes (Abraham, Berenice) — alimenta `post_authors`
- Imagen de portada (sube a `blog-media`)
- Cuerpo: editor Tiptap (rich text → guarda como `jsonb`)
- Vista previa en vivo: usa el mismo componente visual del post público (fondo crema, serif, sin nav) para que se vea exactamente como se publicará
- Botones: Guardar borrador / Publicar

## 5. Página pública del post

Diseño ya validado: fondo `#F4EEE2`, tipografía serif, una columna, sin navegación, indicador de "X min de lectura", sin pop-ups ni banners.

## 6. Compartir

- **Móvil**: botón único que llama `navigator.share({ title, text, url })` — abre el menú nativo del sistema operativo con todas las apps instaladas.
- **Escritorio** (fallback, cuando `navigator.share` no existe): enlaces directos a
  - Facebook: `https://www.facebook.com/sharer/sharer.php?u={url}`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
  - WhatsApp Web: `https://wa.me/?text={title}%20{url}`
  - Botón "copiar enlace" (cubre el hueco de Instagram, que no tiene API de compartir web)

## 7. Rendimiento y SEO

- Generación estática (ISR) para `[slug]/page.tsx`, revalidación bajo demanda al publicar (`revalidatePath`)
- Open Graph / metadatos por post: título, excerpt, imagen de portada — para que se vea bien al compartirse en WhatsApp/redes

## 8. Fuera de alcance de esta primera versión

- Comentarios
- Analytics avanzado (más allá de lo que ya use MAIA)
- Newsletter / suscripción por email
