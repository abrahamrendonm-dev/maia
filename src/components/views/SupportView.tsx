import React from 'react';
import { Home } from '../Home';
import { Users, Info } from 'lucide-react';

interface ViewProps {
  userId: string;
  onOpenBitacora?: () => void;
}

export const SupportView = ({ userId, onOpenBitacora }: ViewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Comparten la misma raíz de datos de gestación/lactancia */}
      <Home userId={userId} onOpenBitacora={onOpenBitacora} />
      
      {/* Panel exclusivo para la Red de Apoyo */}
      <div className="bg-blue-50/50 border-2 border-blue-100 p-5 rounded-[2rem] space-y-2 shadow-sm">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-1.5">
          <Info size={12} /> Modo Cuidador Activo
        </span>
        <h3 className="font-black text-[#2D3436] text-sm">Información Importante</h3>
        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
          Estás visualizando la bitácora autorizada de MAIA. Tu acceso te permite conocer las necesidades del bebé en tiempo real.
        </p>
      </div>
    </div>
  );
};