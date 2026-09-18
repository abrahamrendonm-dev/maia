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

  // Mismo destino al que el resto de la app manda a cualquier usuario sin
  // acceso a una vista: la raíz, donde App.tsx decide qué mostrarle (login
  // si no hay sesión, o su propia home según su rol real).
  if (!isEditor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
