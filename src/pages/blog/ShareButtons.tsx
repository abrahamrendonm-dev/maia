import { useState } from 'react';
import { Share2, Facebook, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  excerpt: string | null;
}

const linkClass = 'flex items-center gap-2 text-sm text-[#2D3436]/60 hover:text-[#2D3436] transition-colors';

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
    <div className="mt-12 pt-8 border-t border-[#2D3436]/10 flex flex-wrap gap-6">
      {/* navigator.share ya no implica "es móvil" — varios navegadores de
          escritorio también lo implementan. Se muestra como opción extra,
          no en lugar de los enlaces directos. */}
      {canNativeShare && (
        <button type="button" onClick={handleNativeShare} className={linkClass}>
          <Share2 size={16} />
          Compartir
        </button>
      )}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <Facebook size={16} />
        Facebook
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <Linkedin size={16} />
        LinkedIn
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitleAndUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <MessageCircle size={16} />
        WhatsApp
      </a>
      <button type="button" onClick={handleCopyLink} className={linkClass}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? '¡Copiado!' : 'Copiar enlace'}
      </button>
    </div>
  );
};
