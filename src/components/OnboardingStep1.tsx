import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Users, Heart, Key, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingProps {
  userId: string;
  onNext: () => void;
}

export const OnboardingStep1 = ({ userId, onNext }: OnboardingProps) => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'mother' | 'partner' | 'support' | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  // Paso para Mamá: Genera su token único familiar
  const handleSelectMother = async () => {
    setLoading(true);
    try {
      const { data: tokenData, error: rpcError } = await supabase.rpc('generate_unique_family_token');
      if (rpcError) throw rpcError;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'mother',
          family_token: tokenData,
          onboarding_completed: true
        })
        .eq('id', userId);

      if (error) throw error;

      setGeneratedToken(tokenData);
      setRole('mother');
      toast.success('¡Código de vinculación familiar generado!');
    } catch (error: any) {
      toast.error('Error al configurar perfil de mamá: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Paso para Papá o Red de Apoyo: Valida el token y enlaza la cuenta
  const handleLinkFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || !role) return;

    setLoading(true);
    try {
      // Buscar a la mamá que posee el token ingresado
      const { data: motherProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('family_token', tokenInput.trim().toUpperCase())
        .eq('role', 'mother')
        .maybeSingle();

      if (searchError || !motherProfile) {
        toast.error('Código inválido. Verifica que sea el código correcto de la mamá.');
        setLoading(false);
        return;
      }

      // Guardar el rol seleccionado y enlazarlo al ID de la mamá hallada
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: role,
          linked_mother_id: motherProfile.id,
          onboarding_completed: true
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast.success(
        role === 'partner' 
          ? '¡Vinculación exitosa! Te has unido como Pareja.' 
          : '¡Vinculación exitosa! Te has unido como Red de Apoyo.'
      );
      onNext();
    } catch (error: any) {
      toast.error('Error al vincular la cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full justify-between">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E3C]">Configuración Inicial</span>
        <h2 className="text-2xl font-black text-[#2D3436] mt-1 mb-2">Tu lugar en MAIA</h2>
        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
          Selecciona tu rol para adaptar las herramientas de cuidado y acompañamiento de MAIA.
        </p>

        {/* 1. SELECTOR DE TRES PERFILES (MÁXIMA SIMETRÍA VISUAL) */}
        {!role && (
          <div className="mt-6 space-y-3">
            {/* Perfil: Mamá */}
            <button
              onClick={handleSelectMother}
              disabled={loading}
              className="w-full bg-white border-2 border-[#F5F2ED] hover:border-[#7A9482] p-4 rounded-[2rem] flex items-center gap-4 text-left transition-all group active:scale-98 disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-[#7A9482]/10 rounded-2xl flex items-center justify-center text-[#7A9482] group-hover:bg-[#7A9482] group-hover:text-white transition-all shrink-0">
                <Heart size={22} />
              </div>
              <div>
                <h3 className="font-black text-[#2D3436] text-sm">Soy la Mamá</h3>
                <p className="text-[11px] text-[#8B5E3C] font-medium leading-tight">Gestiona el embarazo, lactancia y controles del bebé.</p>
              </div>
            </button>

            {/* Perfil: Papá / Pareja */}
            <button
              onClick={() => setRole('partner')}
              className="w-full bg-white border-2 border-[#F5F2ED] hover:border-[#7A9482] p-4 rounded-[2rem] flex items-center gap-4 text-left transition-all group active:scale-98"
            >
              <div className="w-12 h-12 bg-[#8B5E3C]/10 rounded-2xl flex items-center justify-center text-[#8B5E3C] group-hover:bg-[#8B5E3C] group-hover:text-white transition-all shrink-0">
                <User size={22} />
              </div>
              <div>
                <h3 className="font-black text-[#2D3436] text-sm">Soy el Papá / Pareja</h3>
                <p className="text-[11px] text-[#8B5E3C] font-medium leading-tight">Acompaña el proceso y visualiza los registros compartidos.</p>
              </div>
            </button>

            {/* Perfil: Red de Apoyo (¡Nuevo!) */}
            <button
              onClick={() => setRole('support')}
              className="w-full bg-white border-2 border-[#F5F2ED] hover:border-[#7A9482] p-4 rounded-[2rem] flex items-center gap-4 text-left transition-all group active:scale-98"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-black text-[#2D3436] text-sm">Soy Red de Apoyo</h3>
                <p className="text-[11px] text-[#8B5E3C] font-medium leading-tight">Abuelos, familiares o cuidadores que ayudan en el día a día.</p>
              </div>
            </button>
          </div>
        )}

        {/* 2. VISTA PARA MAMÁ (MOSTRAR SU TOKEN) */}
        {role === 'mother' && generatedToken && (
          <div className="mt-6 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-[#7A9482] to-[#8BA895] p-6 rounded-[2rem] text-white text-center shadow-md">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Código de Vinculación</span>
              <h3 className="text-3xl font-black tracking-widest my-2 select-all">{generatedToken}</h3>
              <p className="text-xs opacity-90 font-medium px-2">
                Compártelo con tu pareja o red de apoyo para sincronizar las cuentas en tiempo real.
              </p>
            </div>
            <button
              onClick={onNext}
              className="w-full bg-[#7A9482] text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-[#7A9482]/90 active:scale-95 transition-all"
            >
              Entrar a MAIA <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* 3. VISTA PARA PAPÁ O RED DE APOYO (SOLICITAR TOKEN DE MAMÁ) */}
        {(role === 'partner' || role === 'support') && (
          <form onSubmit={handleLinkFamily} className="mt-6 space-y-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-5 rounded-[2rem] space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
                <Key size={12} /> Introduce el Código de la Mamá
              </label>
              <input
                type="text"
                placeholder="Ej: MAIA-A12B"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
                className="w-full bg-white border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-4 rounded-[1.5rem] text-center font-black text-lg tracking-widest text-[#2D3436] uppercase transition-all"
              />
              <p className="text-[10px] text-[#8B5E3C] font-semibold text-center italic">
                {role === 'partner' 
                  ? 'Te vincularás como Pareja.' 
                  : 'Te vincularás como Red de Apoyo Autorizada.'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole(null)}
                className="bg-[#F5F2ED] text-[#8B5E3C] px-4 rounded-[1.5rem] font-black text-xs uppercase tracking-wider hover:bg-[#F5F2ED]/70 active:scale-95 transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#7A9482] text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-[#7A9482]/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Vinculando...' : 'Vincular y Entrar'} <CheckCircle size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};