import { Link } from 'react-router-dom';

// TODO: reemplazar por las URLs reales de las redes sociales antes de producción.
const INSTAGRAM_URL = 'https://instagram.com/TODO_usuario_maia';
const FACEBOOK_URL = 'https://facebook.com/TODO_pagina_maia';

// TODO: reemplazar por el correo de contacto real del blog.
const CONTACT_EMAIL = 'TODO@maia.app';

const linkClass = 'hover:text-[#2D3436] transition-colors';

export const Footer = () => (
  <footer className="font-sans mt-16 pt-7 border-t border-[#E2D9C8] text-sm font-semibold text-[#5C6466]">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Instagram
      </a>
      <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Facebook
      </a>
      <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
        {CONTACT_EMAIL}
      </a>
      <Link to="/maia" className={linkClass}>
        Conoce la app MAIA →
      </Link>
    </div>

    <p className="text-xs">
      {/*
        TODO/PLACEHOLDER — este aviso NO es texto legal definitivo, es relleno
        genérico solo para tener algo en el layout. Antes de producción alguien
        con criterio legal real debe redactar/revisar esto (privacidad, cookies,
        deslinde de responsabilidad sobre contenido de salud/lactancia, etc.).
      */}
      [PLACEHOLDER — texto legal pendiente de revisión real] La información de este sitio es
      educativa y no reemplaza la valoración de un profesional de la salud.
    </p>
    <p className="text-xs mt-1">© {new Date().getFullYear()} MAIA</p>
  </footer>
);
