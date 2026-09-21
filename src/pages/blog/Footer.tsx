import { Link } from 'react-router-dom';

// TODO: reemplazar por las URLs reales de las redes sociales antes de producción.
const INSTAGRAM_URL = 'https://instagram.com/TODO_usuario_maia';
const FACEBOOK_URL = 'https://facebook.com/TODO_pagina_maia';

// TODO: reemplazar por el correo de contacto real del blog.
const CONTACT_EMAIL = 'TODO@maia.app';

const linkClass = 'hover:text-[#2D3436] transition-colors';

export const Footer = () => (
  <footer className="mt-20 pt-8 border-t border-[#2D3436]/10 text-sm text-[#2D3436]/60">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Instagram
      </a>
      <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Facebook
      </a>
      <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
        {CONTACT_EMAIL}
      </a>
      <Link to="/" className={linkClass}>
        ← Volver a MAIA
      </Link>
    </div>

    <p className="text-xs text-[#2D3436]/40">© {new Date().getFullYear()} MAIA. Todos los derechos reservados.</p>

    {/*
      TODO/PLACEHOLDER — este aviso NO es texto legal definitivo, es relleno
      genérico solo para tener algo en el layout. Antes de producción alguien
      con criterio legal real debe redactar/revisar esto (privacidad, cookies,
      deslinde de responsabilidad sobre contenido de salud/lactancia, etc.).
    */}
    <p className="text-xs text-[#2D3436]/40 mt-1">
      [PLACEHOLDER — texto legal pendiente de revisión real] El contenido de este blog es
      informativo y no sustituye la orientación de un profesional de la salud.
    </p>
  </footer>
);
