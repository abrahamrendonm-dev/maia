import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNELS, BLOG_CHANNEL_LABELS, type BlogChannel } from '../blog/channels';
import { uploadBlogMedia } from './uploadBlogMedia';

interface Resource {
  id: string;
  channel: BlogChannel;
  title: string;
  meta: string | null;
  file_url: string;
}

export const BlogResourcesAdmin = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<BlogChannel>('bere');
  const [meta, setMeta] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const cargarRecursos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blog_resources')
      .select('id, channel, title, meta, file_url')
      .order('created_at', { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarRecursos();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !file) {
      toast.error('Título y archivo PDF son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const fileUrl = await uploadBlogMedia(file);
      const { error } = await supabase
        .from('blog_resources')
        .insert({ title: title.trim(), channel, meta: meta.trim() || null, file_url: fileUrl });

      if (error) {
        toast.error(`No se pudo crear el recurso: ${error.message}`);
        return;
      }

      setTitle('');
      setMeta('');
      setFile(null);
      toast.success('Recurso agregado.');
      await cargarRecursos();
    } catch {
      toast.error('No se pudo subir el archivo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_resources').delete().eq('id', id);
    if (error) {
      toast.error(`No se pudo borrar: ${error.message}`);
      return;
    }
    toast.success('Recurso eliminado.');
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog-editor" className="text-sm text-[#8B5E3C] hover:underline">
          ← Volver al listado de posts
        </Link>

        <h1 className="text-2xl font-black text-[#7A9482] mt-4 mb-8">Recursos descargables</h1>

        <div className="bg-white rounded-2xl shadow p-6 mb-10 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#8B5E3C]">Nuevo recurso</h2>
          <input
            type="text"
            placeholder="Título (ej. Guía de extracción y conservación de leche)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30"
          />
          <input
            type="text"
            placeholder="Meta (ej. PDF · 12 páginas) — opcional"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as BlogChannel)}
            className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30"
          >
            {BLOG_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {BLOG_CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide bg-[#7A9482] text-white disabled:opacity-50"
          >
            Agregar recurso
          </button>
        </div>

        {loading ? (
          <p className="text-[#8B5E3C]">Cargando...</p>
        ) : resources.length === 0 ? (
          <p className="text-[#8B5E3C]">Todavía no hay recursos.</p>
        ) : (
          <ul className="space-y-3">
            {resources.map((r) => (
              <li key={r.id} className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#2D3436]">{r.title}</p>
                  <p className="text-xs text-[#8B5E3C]">
                    {BLOG_CHANNEL_LABELS[r.channel]}
                    {r.meta ? ` · ${r.meta}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4A6352]">
                    Ver PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="text-sm text-red-500"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
