import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  Baby, Sparkles, ArrowRight, Calendar, Activity,
  Stethoscope, Heart, User, ShieldCheck, Info
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  userId: string;
  onNext: () => void;
}

export const OnboardingStep1 = ({ userId, onNext }: Props) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<'mama' | 'papa' | 'cuidador' | null>(null);

  // Estado para Embarazo (Gestación)
  const [gestacion, setGestacion] = useState({
    fur: '',
    numEmbarazo: '1',
    complicaciones: false,
    notasComplicaciones: ''
  });

  // Estado para Bebé Nacido
  const [baby, setBaby] = useState({
    name: '', birthDate: '', isPremature: false
  });

  const finalizarGestacion = async () => {
    setLoading(true);
    try {
      // 1. Actualizar Perfil
      await supabase.from('profiles').upsert({
        id: userId,
        onboarding_completed: true,
        rol
      });

      // 2. Guardar datos de Gestación
      const { error } = await supabase.from('pregnancies').upsert({
        parent_id: userId,
        fur_date: gestacion.fur,
        pregnancy_number: parseInt(gestacion.numEmbarazo),
        has_complications: gestacion.complicaciones,
        complications_notes: gestacion.notasComplicaciones
      });

      if (error) throw error;

      toast.success("¡Bienvenida a MAIA! Acompañaremos tu dulce espera. ✨");
      onNext();
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* PASO 1: ROL */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#2D3436]">¿Quién eres hoy?</h2>
            <p className="text-[#8B5E3C] text-[10px] font-bold uppercase tracking-widest opacity-60">Maia se adapta a ti</p>
          </div>
          <div className="grid gap-3">
            {['mama', 'papa', 'cuidador'].map((r) => (
              <button
                key={r}
                onClick={() => { setRol(r as any); setStep(2); }}
                className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex items-center gap-4 hover:border-[#7A9482]/30 transition-all group"
              >
                <div className="w-10 h-10 bg-[#7A9482]/10 rounded-xl flex items-center justify-center">
                  {r === 'mama' ? <Heart size={20} className="text-[#7A9482]" /> : <User size={20} className="text-[#7A9482]" />}
                </div>
                <span className="font-bold capitalize">{r}</span>
                <ArrowRight className="ml-auto opacity-20 group-hover:opacity-100" size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: ETAPA */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#2D3436]">¿En qué etapa están?</h2>
            <p className="text-[#7A9482] text-[10px] font-bold uppercase tracking-widest">Información y Orientación</p>
          </div>
          <div className="grid gap-4">
            <button onClick={() => setStep(10)} className="w-full bg-white p-6 rounded-[35px] border-2 border-[#F5F2ED] flex items-center gap-5 text-left transition-all hover:bg-[#7A9482]/5">
              <Sparkles className="text-[#7A9482]" size={24} />
              <div>
                <span className="block font-bold text-[#2D3436]">En espera (Gestación)</span>
                <span className="text-[10px] text-gray-400">Calcularemos tus semanas y desarrollo</span>
              </div>
            </button>
            <button onClick={() => setStep(3)} className="w-full bg-white p-6 rounded-[35px] border-2 border-[#F5F2ED] flex items-center gap-5 text-left transition-all hover:bg-[#7A9482]/5">
              <Baby className="text-[#7A9482]" size={24} />
              <div>
                <span className="block font-bold text-[#2D3436]">Ya nació (Lactancia)</span>
                <span className="text-[10px] text-gray-400">Seguimiento de bitácora diaria</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PASO GESTACIÓN (NUEVO) */}
      {step === 10 && (
        <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-[#7A9482]/10 p-4 rounded-2xl flex gap-3">
            <Info className="text-[#7A9482] shrink-0" size={18} />
            <p className="text-[11px] text-[#7A9482] leading-tight">
              La <b>Fecha de Última Regla</b> nos ayuda a darte información precisa sobre el desarrollo de tu bebé.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#8B5E3C] ml-1">Fecha de Última Regla (FUR)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="date"
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-[#7A9482]/20 transition-all"
                  value={gestacion.fur}
                  onChange={(e) => setGestacion({ ...gestacion, fur: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#8B5E3C] ml-1"># de Embarazo</label>
                <select
                  className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none"
                  value={gestacion.numEmbarazo}
                  onChange={(e) => setGestacion({ ...gestacion, numEmbarazo: e.target.value })}
                >
                  <option value="1">Primero</option>
                  <option value="2">Segundo</option>
                  <option value="3">Tercero</option>
                  <option value="4">Cuarto o +</option>
                </select>
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-black uppercase text-[#8B5E3C]">¿Complicaciones?</label>
                <div className="flex justify-center items-center h-full pt-2">
                  <input
                    type="checkbox"
                    className="w-6 h-6 accent-[#7A9482]"
                    checked={gestacion.complicaciones}
                    onChange={(e) => setGestacion({ ...gestacion, complicaciones: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {gestacion.complicaciones && (
              <textarea
                placeholder="Ej: Preeclampsia previa, diabetes..."
                className="w-full p-4 rounded-2xl bg-orange-50 border-none text-xs outline-none animate-in zoom-in-95"
                rows={2}
                value={gestacion.notasComplicaciones}
                onChange={(e) => setGestacion({ ...gestacion, notasComplicaciones: e.target.value })}
              />
            )}
          </div>

          <button
            onClick={finalizarGestacion}
            disabled={!gestacion.fur || loading}
            className="w-full bg-[#7A9482] text-white py-5 rounded-[2rem] font-black shadow-xl disabled:opacity-30 active:scale-95 transition-all mt-4"
          >
            {loading ? 'Preparando tu nido...' : 'Comenzar mi Gestación'}
          </button>
        </div>
      )}
    </div>
  );
};