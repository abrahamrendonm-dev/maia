import { supabase } from '../../services/supabaseClient';

// Mismo motivo que en BlogPostPage.tsx: post_authors.author_id referencia
// auth.users(id), no profiles(id), así que PostgREST no puede embeber
// profiles directamente — se resuelve en dos pasos, aquí por lote para
// listados (en vez de una consulta por tarjeta).
export async function fetchAuthorNamesByPost(postIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (postIds.length === 0) return result;

  const { data: links } = await supabase.from('post_authors').select('post_id, author_id').in('post_id', postIds);
  if (!links || links.length === 0) return result;

  const authorIds = [...new Set(links.map((l) => l.author_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', authorIds);
  const nameById = new Map((profiles || []).map((p) => [p.id, p.display_name || 'Colaborador']));

  for (const link of links) {
    const name = nameById.get(link.author_id);
    if (!name) continue;
    const list = result.get(link.post_id) ?? [];
    list.push(name);
    result.set(link.post_id, list);
  }

  return result;
}
