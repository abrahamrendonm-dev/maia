export const BLOG_CHANNELS = ['bere', 'cognicion'] as const;

export type BlogChannel = (typeof BLOG_CHANNELS)[number];

export const BLOG_CHANNEL_LABELS: Record<BlogChannel, string> = {
  bere: 'Bere: Guardiana de la vida',
  cognicion: 'Cognición',
};

export function isBlogChannel(value: string | undefined): value is BlogChannel {
  return value != null && (BLOG_CHANNELS as readonly string[]).includes(value);
}
