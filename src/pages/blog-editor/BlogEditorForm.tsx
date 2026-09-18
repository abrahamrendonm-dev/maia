import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { BLOG_CHANNELS, BLOG_CHANNEL_LABELS, type BlogChannel } from '../blog/channels';
import { slugify, estimateReadingMinutes } from './postUtils';
import { uploadBlogMedia } from './uploadBlogMedia';
import { TiptapEditor } from './TiptapEditor';
import { BlogPostPreview } from './BlogPostPreview';

interface EditorProfile {
  id: string;
  display_name: string | null;
}

export const BlogEditorForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'new';

  const [loadingPost, setLoadingPost] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [channel, setChannel] = useState<BlogChannel>('bere');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const [content, setContent] = useState<unknown>(null);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const [editorsList, setEditorsList] = useState<EditorProfile[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [StarterKit, Image, LinkExtension.configure({ openOnClick: false })],
    content: '',
    onUpdate: ({ editor }) => setContent(editor.getJSON()),
  });

  // Lista de colaboradores posibles: mismo patrón de fetch de profiles usado en
  // BlogPostPage.tsx para autores.
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, display_name')
      .eq('role', 'editor')
      .then(({ data }) => setEditorsList(data || []));
  }, []);

  // Carga del post existente (y sus colaboradores) cuando no es "new".
  useEffect(() => {
    if (isNew || !id) return;

    let cancelled = false;

    const cargarPost = async () => {
      setLoadingPost(true);

      const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();

      if (cancelled) return;

      if (post) {
        setTitle(post.title);
        setSlug(post.slug);
        setSlugTouched(true);
        setChannel(post.channel);
        setExcerpt(post.excerpt || '');
        setCoverImage(post.cover_image || '');
        setContent(post.content);
        setStatus(post.status);
        setPublishedAt(post.published_at);
      }

      const { data: authors } = await supabase.from('post_authors').select('author_id').eq('post_id', id);

      if (!cancelled) {
        setSelectedAuthorIds((authors || []).map((a) => a.author_id));
        setLoadingPost(false);
      }
    };

    cargarPost();

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  // El contenido llega después de que el post carga y de que el editor está
  // listo — no se puede fijar como `content` inicial de useEditor porque ese
  // valor solo se usa una vez, en el primer render.
  useEffect(() => {
    if (editor && content && !loadingPost) {
      editor.commands.setContent(content as never);
    }
    // Solo queremos sincronizar el contenido cargado del post una vez que
    // termina de cargar, no en cada cambio de `content` (eso lo dispara el
    // propio editor mientras el usuario escribe).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, loadingPost]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadBlogMedia(file);
      setCoverImage(url);
    } catch {
      toast.error('No se pudo subir la imagen de portada.');
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleAuthor = (authorId: string) => {
    setSelectedAuthorIds((prev) =>
      prev.includes(authorId) ? prev.filter((a) => a !== authorId) : [...prev, authorId],
    );
  };

  // 'draft'/'publish' son las acciones de siempre para un post nuevo o en
  // borrador. 'update' guarda cambios de un post ya publicado sin tocar
  // status/published_at. 'unpublish' es la única forma de volver a draft un
  // post publicado, y no borra published_at (queda como fecha de la primera
  // publicación por si se vuelve a publicar).
  const handleSave = async (action: 'draft' | 'publish' | 'update' | 'unpublish') => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Título y slug son obligatorios.');
      return;
    }

    setSaving(true);

    const postContent = editor?.getJSON() ?? content ?? { type: 'doc', content: [] };
    const readingTimeMinutes = estimateReadingMinutes(postContent);

    let nextStatus = status;
    let nextPublishedAt = publishedAt;

    switch (action) {
      case 'draft':
        nextStatus = 'draft';
        break;
      case 'publish':
        nextStatus = 'published';
        if (!nextPublishedAt) nextPublishedAt = new Date().toISOString();
        break;
      case 'unpublish':
        nextStatus = 'draft';
        break;
      case 'update':
        // status y published_at se quedan tal cual están.
        break;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      channel,
      excerpt: excerpt.trim() || null,
      cover_image: coverImage || null,
      content: postContent,
      reading_time_minutes: readingTimeMinutes,
      status: nextStatus,
      published_at: nextPublishedAt,
    };

    let postId = isNew ? null : id!;

    if (isNew) {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select('id').single();
      if (error || !data) {
        toast.error(`No se pudo crear el post: ${error?.message ?? 'error desconocido'}`);
        setSaving(false);
        return;
      }
      postId = data.id;
    } else {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', postId!);
      if (error) {
        toast.error(`No se pudo guardar el post: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    await supabase.from('post_authors').delete().eq('post_id', postId!);
    if (selectedAuthorIds.length > 0) {
      await supabase
        .from('post_authors')
        .insert(selectedAuthorIds.map((authorId) => ({ post_id: postId, author_id: authorId })));
    }

    setStatus(nextStatus);
    setPublishedAt(nextPublishedAt);
    setSaving(false);

    const messages: Record<typeof action, string> = {
      draft: 'Borrador guardado.',
      publish: 'Post publicado.',
      update: 'Cambios guardados.',
      unpublish: 'Post despublicado.',
    };
    toast.success(messages[action]);

    if (isNew) {
      navigate(`/blog-editor/${postId}`, { replace: true });
    }
  };

  const readingTimePreview = estimateReadingMinutes(editor?.getJSON() ?? content);
  const authorNamesPreview = editorsList
    .filter((e) => selectedAuthorIds.includes(e.id))
    .map((e) => e.display_name || 'Colaborador');

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED]">
        <p className="text-[#7A9482] font-medium italic animate-pulse">Cargando post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/blog-editor" className="text-sm text-[#8B5E3C] hover:underline">
            ← Volver al listado
          </Link>
          <div className="flex gap-3">
            {status === 'published' ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('unpublish')}
                  className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide border border-red-400 text-red-500 disabled:opacity-50"
                >
                  Despublicar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('update')}
                  className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide bg-[#7A9482] text-white disabled:opacity-50"
                >
                  Guardar cambios
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('draft')}
                  className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide border border-[#7A9482] text-[#7A9482] disabled:opacity-50"
                >
                  Guardar borrador
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('publish')}
                  className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide bg-[#7A9482] text-white disabled:opacity-50"
                >
                  Publicar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna de edición */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30 bg-white"
                placeholder="Título del post"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30 bg-white font-mono text-sm"
                placeholder="titulo-del-post"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Canal
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as BlogChannel)}
                className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30 bg-white"
              >
                {BLOG_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {BLOG_CHANNEL_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Colaboradores
              </label>
              <div className="flex flex-wrap gap-4 bg-white px-3 py-2 rounded-xl border border-[#7A9482]/30">
                {editorsList.length === 0 ? (
                  <p className="text-sm text-[#8B5E3C]/70">No hay editores registrados todavía.</p>
                ) : (
                  editorsList.map((editorProfile) => (
                    <label key={editorProfile.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedAuthorIds.includes(editorProfile.id)}
                        onChange={() => toggleAuthor(editorProfile.id)}
                      />
                      {editorProfile.display_name || 'Sin nombre'}
                      {editorProfile.id === user?.id ? ' (yo)' : ''}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30 bg-white"
                placeholder="Resumen corto — se usa en el listado y como descripción al compartir"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Imagen de portada
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
                className="text-sm"
              />
              {uploadingCover && <p className="text-xs text-[#8B5E3C] mt-1">Subiendo...</p>}
              {coverImage && <img src={coverImage} alt="" className="mt-2 h-32 rounded-lg object-cover" />}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">
                Contenido ({readingTimePreview} min de lectura)
              </label>
              <TiptapEditor editor={editor} />
            </div>
          </div>

          {/* Columna de vista previa */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">Vista previa</p>
            <div className="border border-[#7A9482]/20 rounded-2xl overflow-hidden">
              <BlogPostPreview
                title={title}
                authorNames={authorNamesPreview}
                coverImage={coverImage}
                readingTimeMinutes={readingTimePreview}
                content={editor?.getJSON() ?? content}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
