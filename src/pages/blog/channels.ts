export const BLOG_CHANNELS = ['bere', 'cognicion'] as const;

export type BlogChannel = (typeof BLOG_CHANNELS)[number];

export const BLOG_CHANNEL_LABELS: Record<BlogChannel, string> = {
  bere: 'Bere: Guardiana de la vida',
  cognicion: 'Cognición',
};

// TODO (Bere): descripción corta real de cada canal, en tu voz — esto es
// texto de relleno solo para maquetar el layout de portada y canal.
export const BLOG_CHANNEL_DESCRIPTIONS: Record<BlogChannel, string> = {
  bere: 'TODO — descripción corta del canal Bere, en tu voz.',
  cognicion: 'TODO — descripción corta del canal Cognición, en tu voz.',
};

export function isBlogChannel(value: string | undefined): value is BlogChannel {
  return value != null && (BLOG_CHANNELS as readonly string[]).includes(value);
}
