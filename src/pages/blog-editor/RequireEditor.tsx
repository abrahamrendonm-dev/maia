import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

interface RequireEditorProps {
  children: ReactNode;
}

export const RequireEditor = ({ children }: RequireEditorProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isEditor, setIsEditor] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsEditor(false);
      return;
    }

    let cancelled = false;
    setIsEditor(null);

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsEditor(data?.role === 'editor');
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || isEditor === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED]">
        <p className="text-[#7A9482] font-medium italic animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  if (!isEditor) {
    // Sin sesión: login propio del blog, no el de MAIA — son logins
    // separados a propósito, aunque compartan la misma cuenta por debajo.
    // Con sesión pero sin role='editor': es un usuario real de MAIA (mamá,
    // pareja, etc.) que no es editor, así que su destino correcto sigue
    // siendo /maia, su app de verdad.
    return <Navigate to={user ? '/maia' : '/blog-editor/login'} replace />;
  }

  return <>{children}</>;
};
