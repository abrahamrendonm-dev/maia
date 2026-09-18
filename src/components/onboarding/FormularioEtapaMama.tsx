import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Sparkles, Calendar, Baby, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface FormularioEtapaProps {
  userId: string;
  onCompleted: () => void; // Callback para sincronizar el estado global en App.tsx y MotherView
}

export const FormularioEtapaMama = ({ userId, onCompleted }: FormularioEtapaProps) => {
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState<'prenatal' | 'lactancia' | null>(null);
  
  // --- ESTADOS MODO GESTACIÓN (PRENATAL) ---
  const [furDate, setFurDate] = useState('');

  // --- ESTADOS MODO LACTANCIA ERGONÓMICO (CHILDREN) ---
  const [babyName, setBabyName] = useState('');
  const apelativosRapidos = ['Mi bebé', 'Mi princesa', 'Mi campeón', 'Escribir nombre'];
  const [mostrarInputNombre, setMostrarInputNombre] = useState(false);

  // Fecha de Nacimiento del Bebé (Sin Teclado)
  const [diaBirth, setDiaBirth] = useState(1);
  const [mesBirth, setMesBirth] = useState(0); // Index 0 = Enero
  const [añoBirth, setAñoBirth] = useState(2026);

  // Somatometría inicial con contadores ergonómicos incrementales
  const [pesoKilos, setPesoKilos] = useState(3);
  const [pesoGramos, setPesoGramos] = useState(200); // Pasos de 100g
  const [tallaCm, setTallaCm] = useState(50);

  const [isPremature, setIsPremature] = useState<boolean | null>(null);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleSeleccionarApelativo = (opcion: string) => {
    if (opcion === 'Escribir nombre') {
      setMostrarInputNombre(true);
      setBabyName('');
    } else {
      setMostrarInputNombre(false);
      setBabyName(opcion);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (etapa === 'prenatal') {
        if (!furDate) {
          toast.error('Por favor, selecciona la fecha de tu última regla (FUR).');
          setLoading(false);
          return;
        }

        // Inserción en la tabla pregnancies (Modo Gestación)
        const { error } = await supabase
          .from('pregnancies')
          .insert([{ parent_id: userId, fur_date: furDate, pregnancy_number: 1 }]);

        if (error) throw error;
        toast.success('¡Diario de embarazo activado! ❤️');

      } else if (etapa === 'lactancia') {
        const nombreFinal = babyName.trim() || 'Mi bebé';
        const fechaNacimientoConstruida = `${añoBirth}-${String(mesBirth + 1).padStart(2, '0')}-${String(diaBirth).padStart(2, '0')}`;

        // CONVERSIÓN MATEMÁTICA: La base de datos exige gramos enteros (integer)
        const pesoTotalEnGramos = (pesoKilos * 1000) + pesoGramos;

        // INSERCIÓN CORRECTA: Mapeo exacto con la caché del esquema de Supabase
        const { error } = await supabase
          .from('children')
          .insert([
            {
              parent_id: userId,                  // UUID de la madre (Unique key)
              name: nombreFinal,                  // Texto obligatorio
              birth_date: fechaNacimientoConstruida, // Date string (YYYY-MM-DD)
              is_premature: isPremature ?? false,    // Booleano controlado
              birth_weight_grams: pesoTotalEnGramos, // integer (Ej: 3200)
              birth_length_cm: tallaCm            // numeric(4,2) (Ej: 50.00)
            }
          ]);

        if (error) throw error;
        toast.success('¡Bienvenido a MAIA! Bitácora de lactancia lista. 👶');
      }

      // Desmontar el onboarding y refrescar la UI dinámica
      onCompleted();
    } catch (error: any) {
      toast.error('Error al guardar en MAIA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-5 animate-in fade-in duration-500 max-h-[520px] overflow-y-auto pr-1 scrollbar-none flex flex-col justify-between"
    >
      {/* SECCIÓN 1: IDENTIDAD TEXTUAL */}
      <div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E3C]">Etapa en MAIA</span>
        <h2 className="text-2xl font-black text-[#2D3436] mt-0.5 mb-1">Configuración del momento</h2>
        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
          Ajustaremos las herramientas de MAIA dinámicamente según el momento en el que te encuentres hoy.
        </p>
      </div>

      {/* SECCIÓN 2: SELECTOR GLOBAL DE ETAPA (DOS BOTONES GIGANTES PARA EL PULGAR) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setEtapa('prenatal')}
          className={`p-4 rounded-[2rem] border-2 text-center transition-all flex flex-col items-center gap-2 active:scale-95 ${
            etapa === 'prenatal' ? 'bg-[#7A9482]/10 border-[#7A9482]' : 'bg-white border-[#F5F2ED]'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${etapa === 'prenatal' ? 'bg-[#7A9482] text-white' : 'bg-[#7A9482]/10 text-[#7A9482]'}`}>
            <Sparkles size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2D3436]">Estoy Embarazada</span>
        </button>

        <button
          type="button"
          onClick={() => setEtapa('lactancia')}
          className={`p-4 rounded-[2rem] border-2 text-center transition-all flex flex-col items-center gap-2 active:scale-95 ${
            etapa === 'lactancia' ? 'bg-[#7A9482]/10 border-[#7A9482]' : 'bg-white border-[#F5F2ED]'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${etapa === 'lactancia' ? 'bg-[#7A9482] text-white' : 'bg-[#7A9482]/10 text-[#7A9482]'}`}>
            <Baby size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2D3436]">Ya nació mi bebé</span>
        </button>
      </div>

      {/* BLOQUE DINÁMICO GESTACIÓN: PRENATAL (ESTABLE) */}
      {etapa === 'prenatal' && (
        <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-5 rounded-[2rem] space-y-3 log-form animate-in zoom-in-95">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
            <Calendar size={12} /> Fecha de Última Regla (FUR)
          </label>
          <input
            type="date"
            value={furDate}
            onChange={(e) => setFurDate(e.target.value)}
            required
            className="w-full bg-white border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-3.5 rounded-[1.5rem] text-sm text-[#2D3436] font-medium transition-colors"
          />
        </div>
      )}

      {/* BLOQUE DINÁMICO LACTANCIA: ERGONÓMICO ULTRA-RÁPIDO A UNA SOLA MANO */}
      {etapa === 'lactancia' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-400">
          
          {/* A. Selector de Nombre Rápido (Evita desplegar el teclado) */}
          <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-4 rounded-[2rem] space-y-2.5 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] block">Nombre o Cariño</span>
            <div className="flex gap-1.5 flex-wrap">
              {apelativosRapidos.map((opc) => (
                <button
                  key={opc}
                  type="button"
                  onClick={() => handleSeleccionarApelativo(opc)}
                  className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all active:scale-95 ${
                    (babyName === opc || (opc === 'Escribir nombre' && mostrarInputNombre))
                      ? 'bg-[#7A9482] text-white border-[#7A9482]'
                      : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                  }`}
                >
                  {opc}
                </button>
              ))}
            </div>
            
            {mostrarInputNombre && (
              <input
                type="text"
                placeholder="Escribe su nombre aquí"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                required
                className="w-full bg-white border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-3 rounded-[1.2rem] text-xs font-bold text-[#2D3436] animate-in fade-in duration-300"
              />
            )}
          </div>

          {/* B. Fecha de Nacimiento del Bebé (Selector de un Toque) */}
          <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-4 rounded-[2rem] space-y-2 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1">
              <Calendar size={12} /> Cuándo nació
            </span>
            {/* Carrusel Horizontal de Meses */}
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none snap-x">
              {meses.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMesBirth(idx)}
                  className={`px-3.5 py-1.5 text-[10px] font-bold rounded-xl border snap-center shrink-0 transition-all ${
                    mesBirth === idx ? 'bg-[#7A9482] text-white border-[#7A9482]' : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {/* Contadores Incrementales de Día y Año */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-[#F5F2ED] p-2 rounded-xl flex items-center justify-between shadow-xs">
                <button type="button" onClick={() => setDiaBirth(d => Math.max(1, d - 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">-</button>
                <span className="font-black text-xs text-[#2D3436]">Día {diaBirth}</span>
                <button type="button" onClick={() => setDiaBirth(d => Math.min(31, d + 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">+</button>
              </div>
              <div className="bg-white border border-[#F5F2ED] p-2 rounded-xl flex items-center justify-between shadow-xs">
                <button type="button" onClick={() => setAñoBirth(a => a - 1)} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">-</button>
                <span className="font-black text-xs text-[#2D3436]">Año {añoBirth}</span>
                <button type="button" onClick={() => setAñoBirth(a => a + 1)} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">+</button>
              </div>
            </div>
          </div>

          {/* C. Peso y Talla (Contadores de Toque Único en la Zona del Pulgar) */}
          <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-4 rounded-[2rem] space-y-2 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5E3C]">Peso y Talla al Nacer</span>
            <div className="grid grid-cols-2 gap-2">
              {/* Selector Kilos */}
              <div className="bg-white border border-[#F5F2ED] p-2 rounded-xl flex items-center justify-between shadow-xs">
                <button type="button" onClick={() => setPesoKilos(k => Math.max(1, k - 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">-</button>
                <span className="font-black text-xs text-[#2D3436]">{pesoKilos} kg</span>
                <button type="button" onClick={() => setPesoKilos(k => Math.min(6, k + 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">+</button>
              </div>
              {/* Selector Gramos */}
              <div className="bg-white border border-[#F5F2ED] p-2 rounded-xl flex items-center justify-between shadow-xs">
                <button type="button" onClick={() => setPesoGramos(g => Math.max(0, g - 100))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">-</button>
                <span className="font-black text-xs text-[#2D3436]">{pesoGramos} g</span>
                <button type="button" onClick={() => setPesoGramos(g => Math.min(900, g + 100))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">+</button>
              </div>
            </div>
            {/* Talla en Centímetros */}
            <div className="bg-white border border-[#F5F2ED] p-2 rounded-xl flex items-center justify-between max-w-xs mx-auto shadow-xs">
              <button type="button" onClick={() => setTallaCm(t => Math.max(30, t - 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">-</button>
              <span className="font-black text-xs text-[#2D3436]">Talla: {tallaCm} cm</span>
              <button type="button" onClick={() => setTallaCm(t => Math.min(65, t + 1))} className="w-7 h-7 bg-[#F5F2ED] rounded-lg font-black text-xs active:scale-90 transition-transform">+</button>
            </div>
          </div>

          {/* D. Condición del Bebé: ¿Prematuro? */}
          <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-4 rounded-[2rem] space-y-2 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] block text-center">¿Nació prematuro?</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPremature(true)}
                className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all active:scale-95 ${
                  isPremature === true 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                    : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                }`}
              >
                Sí, nació antes
              </button>
              <button
                type="button"
                onClick={() => setIsPremature(false)}
                className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all active:scale-95 ${
                  isPremature === false 
                    ? 'bg-[#7A9482] text-white border-[#7A9482] shadow-md' 
                    : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                }`}
              >
                No, a término
              </button>
            </div>
          </div>

        </div>
      )}

      {/* BOTÓN DE ACCIÓN FINAL EN LA ZONA TOTAL DEL PULGAR */}
      {etapa && (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7A9482] text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-[#7A9482]/90 active:scale-95 transition-all disabled:opacity-50 mt-4 relative z-50"
        >
          {loading ? 'Activando MAIA...' : 'Comenzar experiencia MAIA'} <ArrowRight size={15} />
        </button>
      )}
    </form>
  );
};