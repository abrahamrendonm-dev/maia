import { supabase } from '../../services/supabaseClient';

export async function uploadBlogMedia(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('blog-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('blog-media').getPublicUrl(path);
  return data.publicUrl;
}
