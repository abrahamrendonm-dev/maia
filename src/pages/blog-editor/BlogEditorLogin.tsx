import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

// Login propio del blog — separado a propósito del de MAIA (AuthForm.tsx):
// no tiene marca de MAIA ni las opciones de registro mamá/pareja/red de
// apoyo, solo inicio de sesión. Las cuentas de editor se dan de alta aparte
// (profiles.role = 'editor' en Supabase), no por auto-registro aquí. Por
// debajo sigue siendo la misma cuenta de Supabase Auth — RequireEditor es
// quien decide si esa cuenta tiene permiso de editor o no.
export const BlogEditorLogin = () => {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Ya hay sesión (sea editor o no) — que RequireEditor decida a dónde va.
  if (!authLoading && user) {
    return <Navigate to="/blog-editor" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('No se pudo iniciar sesión', { description: error.message });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/blog-editor` },
    });
    if (error) toast.error('Error al conectar con Google');
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#8B5E3C] mb-2">
          Guardiana de la Vida
        </p>
        <h1 className="text-center text-xl font-black text-[#7A9482] mb-8">Acceso para editores</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-[32px] shadow-sm border border-[#7A9482]/10 space-y-4"
        >
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200"
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#7A9482] text-white font-bold py-3 rounded-2xl disabled:opacity-50"
          >
            Ingresar <ArrowRight size={18} />
          </button>

          <div className="flex items-center gap-3 py-1 text-xs font-semibold text-gray-400">
            <span className="flex-1 border-t border-gray-200" />
            O
            <span className="flex-1 border-t border-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 py-3 rounded-2xl font-semibold"
          >
            <Chrome size={18} className="text-blue-500" />
            Google
          </button>
        </form>
      </div>
    </div>
  );
};
