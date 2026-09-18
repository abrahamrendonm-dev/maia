import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Node serverless (no Edge) — lo pide el uso de @supabase/supabase-js aquí.
export const config = { runtime: 'nodejs' };

const BLOG_CHANNELS = ['bere', 'cognicion'];
const BLOG_BASE_URL = 'https://maia-pearl.vercel.app';

// No se importa src/services/supabaseClient.ts: ese archivo lee
// import.meta.env, que Vite resuelve solo al compilar el bundle del
// navegador y no existe en el runtime Node de una función serverless.
// Mismas variables de entorno que ya usa el resto del proyecto
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), leídas aquí vía
// process.env — no es una credencial nueva ni duplicada, solo un cliente
// aparte para un runtime distinto.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// createClient('', '') lanza de inmediato si faltan estas env vars en el
// proyecto de Vercel (son distintas del .env local, que no se sube). Sin
// este guard, esa excepción tumba la función entera con un
// FUNCTION_INVOCATION_FAILED opaco en vez de decir qué falta.
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendNotFound(res: VercelResponse) {
  res.status(404).send('Post no encontrado');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabase) {
    console.error('api/og: faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en las env vars de Vercel');
    return res.status(500).send('Configuración de Supabase faltante en el servidor');
  }

  const channel = typeof req.query.channel === 'string' ? req.query.channel : '';
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';

  if (!BLOG_CHANNELS.includes(channel) || !slug) {
    return sendNotFound(res);
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image')
    .eq('channel', channel)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !post) {
    return sendNotFound(res);
  }

  const postUrl = `${BLOG_BASE_URL}/blog/${channel}/${slug}`;
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.excerpt ?? '');
  const image = post.cover_image ? escapeHtml(post.cover_image) : '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    <meta property="og:url" content="${postUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>${title}</title>
  </head>
  <body>
    <a href="${postUrl}">${title}</a>
  </body>
</html>`);
}
