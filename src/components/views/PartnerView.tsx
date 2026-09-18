import { Home } from '../Home';
import { Activity } from 'lucide-react';

interface ViewProps {
  userId: string;
  onOpenBitacora?: () => void;
}

export const PartnerView = ({ userId, onOpenBitacora }: ViewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* El Papá visualiza el mismo Home sincronizado por el linked_mother_id */}
      <Home userId={userId} onOpenBitacora={onOpenBitacora} />
      
      {/* Panel exclusivo para el rol de Papá */}
      <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-5 rounded-[2rem] space-y-3 shadow-sm">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E3C] flex items-center gap-1.5">
          <Activity size={12} /> Herramientas de Acompañamiento
        </span>
        <h3 className="font-black text-[#2D3436] text-sm">¿Cómo apoyar hoy?</h3>
        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
          Asegúrate de que mamá tenga agua cerca durante las tomas y ayuda a registrar los tiempos de sueño en la bitácora.
        </p>
      </div>
    </div>
  );
};