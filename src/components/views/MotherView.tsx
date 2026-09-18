import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Home } from '../Home';
import { FormularioDatosPersonales } from '../onboarding/FormularioDatosPersonales';
import { FormularioEtapaMama } from '../onboarding/FormularioEtapaMama';

interface ViewProps {
  userId: string;
  onOpenBitacora?: () => void;
}

export const MotherView = ({ userId, onOpenBitacora }: ViewProps) => {
  const [step, setStep] = useState<'loading' | 'datos_personales' | 'etapa' | 'home'>('loading');

  const evaluarFlujoRegistro = async () => {
    try {
      // 1. Consultar el perfil de la madre
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();

      // Si no tiene nombre registrado, se queda en el Paso 1 (Datos Personales)
      if (!profile || !profile.display_name) {
        setStep('datos_personales');
        return;
      }

      // 2. Si ya tiene datos personales, verificar si ya tiene configurada su etapa (Embarazo o Hijo)
      const { data: preg } = await supabase.from('pregnancies').select('id').eq('parent_id', userId).maybeSingle();
      const { data: child } = await supabase.from('children').select('id').eq('parent_id', userId).limit(1).maybeSingle();

      if (preg || child) {
        setStep('home'); // Todo listo, va al Dashboard directo
      } else {
        setStep('etapa'); // Le falta decir si está embarazada o ya nació
      }
    } catch (error) {
      setStep('datos_personales');
    }
  };

  useEffect(() => {
    evaluarFlujoRegistro();
  }, [userId]);

  // Renderizador de control de pasos modulares e incrementales
  switch (step) {
    case 'loading':
      return <div className="p-10 text-center text-[#7A9482] font-medium italic animate-pulse">Sincronizando expediente...</div>;
    
    case 'datos_personales':
      return <FormularioDatosPersonales userId={userId} onNext={evaluarFlujoRegistro} />;
    
    case 'etapa':
      return <FormularioEtapaMama userId={userId} onCompleted={evaluarFlujoRegistro} />;
    
    case 'home':
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Home userId={userId} onOpenBitacora={onOpenBitacora} />
        </div>
      );
  }
};