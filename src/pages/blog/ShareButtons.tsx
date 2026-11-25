import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  excerpt: string | null;
}

const pillClass =
  'px-[18px] py-2.5 rounded-full bg-[#FFFDF9] border border-[#D6CFC3] text-[#2D3436] no-underline text-sm font-semibold';

export const ShareButtons = ({ title, excerpt }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const canNativeShare = typeof navigator.share === 'function';

  const handleNativeShare = () => {
    navigator.share({ title, text: excerpt ?? undefined, url: window.location.href }).catch(() => {});
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el acceso al clipboard no hay mucho más que
      // hacer aquí — el usuario siempre puede copiar la URL manualmente.
    }
  };

  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitleAndUrl = encodeURIComponent(`${title} ${url}`);

  return (
    <div className="font-sans flex flex-wrap items-center gap-3 py-6 border-t border-b border-[#E2D9C8]">
      <span className="text-[15px] font-bold mr-2">Compartir este artículo</span>

      {/* navigator.share ya no implica "es móvil" — varios navegadores de
          escritorio también lo implementan. Se muestra como opción extra,
          no en lugar de los enlaces directos. */}
      {canNativeShare && (
        <button type="button" onClick={handleNativeShare} className={`${pillClass} flex items-center gap-1.5`}>
          <Share2 size={14} />
          Compartir
        </button>
      )}

      <a href={`https://wa.me/?text=${encodedTitleAndUrl}`} target="_blank" rel="noopener noreferrer" className={pillClass}>
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        Facebook
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        className="px-[18px] py-2.5 rounded-full bg-[#4A6352] text-[#FFFDF9] text-sm font-bold flex items-center gap-1.5"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '¡Copiado!' : 'Copiar enlace'}
      </button>
    </div>
  );
};
