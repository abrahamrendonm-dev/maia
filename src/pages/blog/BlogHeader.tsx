import { Link } from 'react-router-dom';
import { BLOG_CHANNEL_LABELS } from './channels';

const navLinkClass = 'text-[#2D3436] no-underline py-3';

export const BlogHeader = () => (
  <header className="bg-[#FFFDF9] border-b border-[#E4DED4]">
    <nav
      aria-label="Principal"
      className="max-w-[1200px] mx-auto px-6 py-[18px] flex flex-wrap items-center justify-between gap-4"
    >
      <Link to="/" className="flex items-center gap-3 no-underline text-[#2D3436]">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="18" fill="#7A9482" />
          <path
            d="M11 24c0-7 4-12 12-13-1 8-5 12-12 13Z"
            fill="none"
            stroke="#FFFDF9"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M11 24l7-7" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="flex flex-col leading-tight">
          <span className="font-serif font-bold text-[22px] tracking-wide">Guardiana de la Vida</span>
          <span className="text-xs font-semibold text-[#5C6466] tracking-widest uppercase">Blog de MAIA</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[15px] font-semibold">
        <Link to="/" className={navLinkClass}>
          Inicio
        </Link>
        <Link to={`/bere`} className={navLinkClass}>
          {BLOG_CHANNEL_LABELS.bere}
        </Link>
        <Link to={`/cognicion`} className={navLinkClass}>
          {BLOG_CHANNEL_LABELS.cognicion}
        </Link>
        <Link to="/#recursos" className={navLinkClass}>
          Recursos
        </Link>
        <Link to="/#metodologia" className={navLinkClass}>
          Quiénes somos
        </Link>
        <Link to="/maia" className="bg-[#4A6352] text-[#FFFDF9] no-underline px-5 py-3 rounded-full">
          Conoce la app MAIA
        </Link>
      </div>
    </nav>
  </header>
);
