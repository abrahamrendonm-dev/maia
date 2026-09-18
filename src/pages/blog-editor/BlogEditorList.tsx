import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { BLOG_CHANNEL_LABELS, type BlogChannel } from '../blog/channels';

interface PostRow {
  id: string;
  title: string;
  channel: BlogChannel;
  status: 'draft' | 'published';
  updated_at: string;
}

export const BlogEditorList = () => {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, channel, status, updated_at')
        .order('updated_at', { ascending: false });

      setPosts(data || []);
      setLoading(false);
    };

    cargarPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F2ED] px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-[#7A9482]">Blog — Posts</h1>
          <Link
            to="/blog-editor/new"
            className="bg-[#7A9482] text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide"
          >
            Nuevo post
          </Link>
        </div>

        {loading ? (
          <p className="text-[#8B5E3C]">Cargando...</p>
        ) : posts.length === 0 ? (
          <p className="text-[#8B5E3C]">Todavía no hay posts.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#7A9482]/10 text-[#8B5E3C] uppercase text-xs tracking-wide">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Última edición</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-[#7A9482]/5 last:border-0 hover:bg-[#F5F2ED]/50">
                    <td className="px-4 py-3">
                      <Link to={`/blog-editor/${post.id}`} className="font-medium text-[#2D3436] hover:underline">
                        {post.title || '(Sin título)'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8B5E3C]">{BLOG_CHANNEL_LABELS[post.channel]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          post.status === 'published'
                            ? 'text-[#7A9482] font-bold'
                            : 'text-[#8B5E3C]/70 font-bold'
                        }
                      >
                        {post.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8B5E3C]">
                      {new Date(post.updated_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
