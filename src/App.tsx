import { useAuth } from './hooks/useAuth';
import { Bitacora } from './components/Bitacora';
import { AuthForm } from './components/AuthForm';
import { OnboardingStep1 } from './components/OnboardingStep1';
import { MotherView } from './components/views/MotherView';
import { PartnerView } from './components/views/PartnerView';
import { SupportView } from './components/views/SupportView';
import { ConsultantDashboard } from './components/consultant/ConsultantDashboard';
import { Bird, LogOut, Home as HomeIcon } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { useState, useEffect } from 'react';

function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'loading' | 'auth' | 'onboarding' | 'app'>('loading');
  const [userRole, setUserRole] = useState<'mother' | 'partner' | 'support' | 'consultant' | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'bitacora'>('home');

  useEffect(() => {
    const syncView = async () => {
      if (loading) return;
      if (!user) { 
        setView('auth'); 
        setUserRole(null);
        return; 
      }
      
      try {
        // Sincronizamos el estado de onboarding y extraemos el rol específico
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed, role')
          .eq('id', user.id)
          .maybeSingle();

        // Las asesoras se activan por SQL, no por el onboarding familiar (Mamá/Papá/Red
        // de Apoyo) — nunca deben pasar por ahí, sin importar onboarding_completed, o
        // corren el riesgo de que un clic ahí les sobrescriba el rol.
        if (data?.role === 'consultant') {
          setUserRole('consultant');
          setView('app');
          return;
        }

        if (data && data.onboarding_completed === true) {
          setUserRole(data.role as 'mother' | 'partner' | 'support' | 'consultant');
          setView('app');
        } else {
          setView('onboarding');
        }
      } catch (err) { 
        setView('onboarding'); 
      }
    };
    
    syncView();
  }, [user, loading]);

  // Red de seguridad estructural: si el usuario autenticado cambia (login/logout/switch
  // de cuenta en la misma pestaña), la pantalla siempre vuelve a "home". El árbol
  // autenticado abajo además usa key={user.id} para forzar un remount completo — así
  // ningún estado local de la cuenta anterior (p. ej. pacientes ya cargados en
  // ConsultantDashboard) puede sobrevivir al cambio, sin depender de que la recarga
  // completa de handleSignOut sea la única garantía.
  useEffect(() => {
    setCurrentScreen('home');
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      setView('loading');
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    } catch (error) { 
      window.location.href = '/'; 
    }
  };

  // RENDERIZADOR COMPUESTO DE PERFILES (Distribución Limpia)
  const renderProfileView = () => {
    if (!user) return null;
    
    const onOpenBitacora = () => setCurrentScreen('bitacora');

    switch (userRole) {
      case 'mother':
        return <MotherView userId={user.id} onOpenBitacora={onOpenBitacora} />;
      case 'partner':
        return <PartnerView userId={user.id} onOpenBitacora={onOpenBitacora} />;
      case 'support':
        return <SupportView userId={user.id} onOpenBitacora={onOpenBitacora} />;
      case 'consultant':
        return <ConsultantDashboard userId={user.id} />;
      default:
        // Fallback defensivo por si hay inconsistencias
        return (
          <div className="p-6 text-center text-xs text-[#8B5E3C] font-medium">
            Error cargando tu perfil. Por favor, re-inicia sesión.
          </div>
        );
    }
  };

  // Pantalla de carga unificada con la identidad visual estricta v1.6
  if (view === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2ED] p-6 text-center">
        <Bird className="animate-bounce text-[#7A9482] mb-4" size={48} />
        <p className="text-[#7A9482] font-medium italic animate-pulse">Sincronizando Maia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] p-4 sm:p-6 flex flex-col items-center">
      {/* Encabezado Estable */}
      <header className="text-center mt-6 mb-8">
        <div className="bg-[#7A9482] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg border-4 border-white transition-all active:scale-95">
          <Bird className="text-white" size={28} />
        </div>
        <h1 className="text-4xl font-black text-[#7A9482] tracking-[0.1em]">MAIA</h1>
        <p className="text-[#8B5E3C] text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Lactancia & Cuidado</p>
      </header>

      {/* Contenedor Principal (Crema MAIA con Curvatura Máxima) */}
      <main className="w-full max-w-md bg-[#FFFDF9] rounded-[2.5rem] p-8 shadow-2xl border border-white/50 relative overflow-hidden min-h-[550px] flex flex-col">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7A9482]/5 rounded-full blur-3xl z-0" />
        
        {view === 'auth' && <AuthForm />}
        
        {view === 'onboarding' && user && (
          <OnboardingStep1
            key={user.id}
            userId={user.id}
            onNext={() => { 
              // Forzamos el refresco de estados para evaluar el nuevo rol asignado
              setView('loading');
              window.location.reload();
            }} 
          />
        )}

        {view === 'app' && user && (
          <div key={user.id} className="space-y-6 animate-in fade-in duration-700 h-full flex flex-col relative z-10">
            {/* Barra de Navegación Superior Interna */}
            <div className="flex justify-between items-center mb-4 relative z-50">
              {currentScreen !== 'home' ? (
                <button 
                  onClick={() => setCurrentScreen('home')} 
                  className="flex items-center gap-2 text-[#7A9482] font-black text-xs uppercase tracking-widest p-2 -ml-2 active:scale-95 transition-transform"
                >
                  <HomeIcon size={18} /> Inicio
                </button>
              ) : <div />}
              
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-2 text-[#8B5E3C] hover:text-red-500 p-2 -mr-2 group active:scale-95 transition-transform"
              >
                <span className="text-xs font-black uppercase tracking-[0.15em]">Salir</span>
                <div className="bg-[#8B5E3C]/10 p-2.5 rounded-xl"><LogOut size={20} /></div>
              </button>
            </div>

            {/* Inyección Dinámica del Módulo */}
            <div className="flex-1">
              {currentScreen === 'home' ? renderProfileView() : <Bitacora userId={user.id} />}
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-auto py-8">
        <p className="text-[9px] text-[#7A9482] uppercase font-black tracking-[0.2em] opacity-30 text-center">Protocolo MAIA v1.6</p>
      </footer>
    </div>
  );
}

export default App;