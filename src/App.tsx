import { useAuth } from './hooks/useAuth'
import { Home } from './components/Home'
import { Bitacora } from './components/Bitacora'
import { AuthForm } from './components/AuthForm'
import { OnboardingStep1 } from './components/OnboardingStep1'
import { Bird, LogOut, Home as HomeIcon } from 'lucide-react'
import { Toaster } from 'sonner'
import { supabase } from './services/supabaseClient'
import { useState, useEffect } from 'react'

function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<'loading' | 'auth' | 'onboarding' | 'app'>('loading')
  const [currentScreen, setCurrentScreen] = useState<'home' | 'bitacora'>('home')

  useEffect(() => {
    const syncView = async () => {
      if (loading) return;

      if (!user) {
        setView('auth');
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (data && data.onboarding_completed === true) {
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

  const handleSignOut = async () => {
    try {
      setView('loading');
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    } catch (error) {
      console.error("Error al salir:", error);
      window.location.href = '/';
    }
  };

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
      <Toaster position="top-center" richColors closeButton />

      {/* HEADER PRINCIPAL ACTUALIZADO A MAIA */}
      <header className="text-center mt-6 mb-8">
        <div className="bg-[#7A9482] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg border-4 border-white transition-all active:scale-95">
          <Bird className="text-white" size={28} />
        </div>
        <h1 className="text-4xl font-black text-[#7A9482] tracking-[0.1em]">MAIA</h1>
        <p className="text-[#8B5E3C] text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
          Lactancia & Cuidado
        </p>
      </header>

      {/* CONTENEDOR DE LA TARJETA */}
      <main className="w-full max-w-md bg-[#FFFDF9] rounded-[2.5rem] p-8 shadow-2xl shadow-[#7A9482]/5 border border-white/50 relative overflow-hidden min-h-[550px] flex flex-col">

        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7A9482]/5 rounded-full blur-3xl z-0" />

        {/* VISTAS */}
        {view === 'auth' && <AuthForm />}

        {view === 'onboarding' && user && (
          <OnboardingStep1
            userId={user.id}
            onNext={() => {
              setView('app');
              setCurrentScreen('home');
            }}
          />
        )}

        {view === 'app' && user && (
          <div className="space-y-6 animate-in fade-in duration-700 h-full flex flex-col relative z-10">

            {/* BARRA DE NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center mb-4 relative z-50">
              {currentScreen !== 'home' ? (
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="flex items-center gap-2 text-[#7A9482] font-black text-xs uppercase tracking-widest hover:opacity-70 transition-all p-2 -ml-2"
                >
                  <HomeIcon size={18} /> Inicio
                </button>
              ) : <div />}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-[#8B5E3C] hover:text-red-500 transition-colors p-2 -mr-2 group"
                title="Cerrar Sesión"
              >
                <span className="text-xs font-black uppercase tracking-[0.15em] group-hover:mr-1 transition-all">Salir</span>
                <div className="bg-[#8B5E3C]/10 p-2.5 rounded-xl group-hover:bg-red-50 transition-colors">
                  <LogOut size={20} className="group-hover:text-red-500" />
                </div>
              </button>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="flex-1">
              {currentScreen === 'home' ? (
                <Home
                  userId={user.id}
                  onNavigate={(screen) => screen === 'bitacora' && setCurrentScreen('bitacora')}
                />
              ) : (
                <Bitacora userId={user.id} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8">
        <p className="text-[9px] text-[#7A9482] uppercase font-black tracking-[0.2em] opacity-30 text-center">
          Protocolo MAIA v1.6
        </p>
      </footer>
    </div>
  )
}

export default App;