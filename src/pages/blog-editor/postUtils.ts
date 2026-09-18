const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface TiptapNodeLike {
  text?: string;
  content?: TiptapNodeLike[];
}

function extractPlainText(node: unknown): string {
  const n = node as TiptapNodeLike | null;
  if (!n) return '';
  if (typeof n.text === 'string') return n.text;
  if (Array.isArray(n.content)) return n.content.map(extractPlainText).join(' ');
  return '';
}

// ~200 palabras por minuto, redondeado, mínimo 1 minuto.
export function estimateReadingMinutes(content: unknown): number {
  const words = extractPlainText(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
