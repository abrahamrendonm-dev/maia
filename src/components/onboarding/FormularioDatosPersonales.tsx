import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DatosPersonalesProps {
  userId: string;
  onNext: () => void;
}

export const FormularioDatosPersonales = ({ userId, onNext }: DatosPersonalesProps) => {
  const [loading, setLoading] = useState(false);
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  
  // Campo de control para el paso de teléfonos
  const [telefonoActivo, setTelefonoActivo] = useState<'personal' | 'apoyo'>('personal');

  // --- ESTADOS DE DATOS ---
  const [nombre, setNombre] = useState('');
  
  // Fecha de Nacimiento Ergonómica
  const [diaNacimiento, setDiaNacimiento] = useState(15);
  const [mesNacimiento, setMesNacimiento] = useState(0); // Index 0 = Enero
  const [añoNacimiento, setAñoNacimiento] = useState(1995);

  // Teléfonos Ergonómicos (Vaciados mediante botonera)
  const [telefono, setTelefono] = useState('');
  const [telefonoApoyo, setTelefonoApoyo] = useState('');

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // --- MANEJO DE BOTONERA NUMÉRICA PROPIA ---
  const handlePresionarNumero = (num: string) => {
    if (telefonoActivo === 'personal') {
      if (telefono.length < 10) setTelefono(prev => prev + num);
    } else {
      if (telefonoApoyo.length < 10) setTelefonoApoyo(prev => prev + num);
    }
  };

  const handleBorrarNumero = () => {
    if (telefonoActivo === 'personal') {
      setTelefono(prev => prev.slice(0, -1));
    } else {
      setTelefonoApoyo(prev => prev.slice(0, -1));
    }
  };

  const handleSiguienteMódulo = async () => {
    if (!nombre.trim()) {
      toast.error('Por favor, dinos tu nombre para personalizar tu experiencia en MAIA.');
      setSubStep(1);
      return;
    }
    if (telefono.length < 10) {
      toast.error('Tu teléfono de contacto debe ser de 10 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const nombreFinal = nombre.trim();
      const fechaNacimientoConstruida = `${añoNacimiento}-${String(mesNacimiento + 1).padStart(2, '0')}-${String(diaNacimiento).padStart(2, '0')}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: nombreFinal,
          bio: JSON.stringify({
            nombre: nombreFinal,
            fechaNacimiento: fechaNacimientoConstruida,
            telefono: telefono,
            telefonoApoyo: telefonoApoyo || 'No proporcionado'
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Identidad resguardada en MAIA.');
      onNext();
    } catch (error: any) {
      toast.error('Error al guardar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-400 flex flex-col justify-between min-h-[500px]">
      
      {/* Barra de progreso superior */}
      <div>
        <div className="flex gap-1 mb-1">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= subStep ? 'bg-[#7A9482]' : 'bg-[#F5F2ED]'
              }`} 
            />
          ))}
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E3C]">
          Onboarding Ergonómico • Paso {subStep} de 3
        </span>
      </div>

      {/* CUERPO CENTRAL DE PREGUNTAS */}
      <div className="flex-1 flex flex-col justify-center">
        
        {/* SUB-PASO 1: NOMBRE DE PILA */}
        {subStep === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            <h3 className="text-xl font-black text-[#2D3436] text-center">¿Cómo te llamas?</h3>
            <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-2 rounded-[2rem]">
              <input
                type="text"
                placeholder="Tu nombre de pila (Ej: Elena)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-white border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-4 rounded-[1.5rem] text-center font-bold text-base text-[#2D3436]"
              />
            </div>
            <p className="text-[10px] text-[#8B5E3C] text-center font-medium px-4 leading-tight">
              Solo necesitamos tu nombre de pila para dirigirnos a ti de forma cálida en MAIA.
            </p>
          </div>
        )}

        {/* SUB-PASO 2: FECHA COMPLETA ERGONÓMICA (Día, Mes, Año sin teclado) */}
        {subStep === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            <h3 className="text-lg font-black text-[#2D3436] text-center">¿Cuál es tu fecha de nacimiento?</h3>
            
            <div className="space-y-2">
              {/* Selector de Mes (Desplegable Táctil de Botones Horizontales) */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C] px-1">Mes</span>
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none snap-x">
                  {meses.map((mes, index) => (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => setMesNacimiento(index)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border snap-center shrink-0 transition-all ${
                        mesNacimiento === index 
                          ? 'bg-[#7A9482] text-white border-[#7A9482]' 
                          : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                      }`}
                    >
                      {mes}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contadores para Día y Año */}
              <div className="grid grid-cols-2 gap-2">
                {/* Selector de Día */}
                <div className="bg-white border-2 border-[#F5F2ED] p-2 rounded-[1.5rem] text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C] block mb-1">Día</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setDiaNacimiento(d => Math.max(1, d - 1))} className="w-8 h-8 bg-[#F5F2ED] rounded-lg font-black text-sm">-</button>
                    <span className="font-black text-sm text-[#2D3436]">{diaNacimiento}</span>
                    <button type="button" onClick={() => setDiaNacimiento(d => Math.min(31, d + 1))} className="w-8 h-8 bg-[#F5F2ED] rounded-lg font-black text-sm">+</button>
                  </div>
                </div>

                {/* Selector de Año */}
                <div className="bg-white border-2 border-[#F5F2ED] p-2 rounded-[1.5rem] text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C] block mb-1">Año</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setAñoNacimiento(a => a - 1)} className="w-8 h-8 bg-[#F5F2ED] rounded-lg font-black text-sm">-</button>
                    <span className="font-black text-sm text-[#2D3436]">{añoNacimiento}</span>
                    <button type="button" onClick={() => setAñoNacimiento(a => a + 1)} className="w-8 h-8 bg-[#F5F2ED] rounded-lg font-black text-sm">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PASO 3: TELÉFONOS CON BOTONERA NUMÉRICA TÁCTIL INTEGRADA */}
        {subStep === 3 && (
          <div className="space-y-3 animate-in slide-in-from-right-5 duration-300">
            {/* Pestañas de Selección de Campo */}
            <div className="grid grid-cols-2 gap-2 bg-[#F5F2ED] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTelefonoActivo('personal')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  telefonoActivo === 'personal' ? 'bg-white text-[#7A9482] shadow-sm' : 'text-[#8B5E3C]'
                }`}
              >
                Tu Teléfono
              </button>
              <button
                type="button"
                onClick={() => setTelefonoActivo('apoyo')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  telefonoActivo === 'apoyo' ? 'bg-white text-[#7A9482] shadow-sm' : 'text-[#8B5E3C]'
                }`}
              >
                Contacto Apoyo
              </button>
            </div>

            {/* Pantalla Visora de Números Digitados */}
            <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] py-2.5 px-4 rounded-[1.5rem] text-center">
              {telefonoActivo === 'personal' ? (
                <div>
                  <span className="text-[8px] font-black text-[#8B5E3C] uppercase tracking-widest block">Tu número de contacto *</span>
                  <span className="text-lg font-black text-[#2D3436] tracking-widest block min-h-[28px]">
                    {telefono ? telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'Introduce 10 dígitos'}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-[8px] font-black text-[#8B5E3C] uppercase tracking-widest block">Número de red de apoyo (Opcional)</span>
                  <span className="text-lg font-black text-[#2D3436] tracking-widest block min-h-[28px]">
                    {telefonoApoyo ? telefonoApoyo.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'Introduce 10 dígitos'}
                  </span>
                </div>
              )}
            </div>

            {/* BOTONERA NUMÉRICA INTEGRADA (Ergonomía de una mano en tercio inferior) */}
            <div className="bg-white border border-[#F5F2ED] p-2 rounded-[2rem] shadow-sm max-w-[280px] mx-auto">
              <div className="grid grid-cols-3 gap-1.5 justify-items-center">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePresionarNumero(num)}
                    className="w-11 h-11 bg-[#FFFDF9] hover:bg-[#F5F2ED] active:scale-90 border border-[#F5F2ED] font-black text-sm text-[#2D3436] rounded-xl transition-all"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBorrarNumero}
                  className="w-11 h-11 bg-orange-50 hover:bg-orange-100 active:scale-90 font-bold text-xs text-orange-700 rounded-xl transition-all flex items-center justify-center"
                >
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={() => handlePresionarNumero('0')}
                  className="w-11 h-11 bg-[#FFFDF9] hover:bg-[#F5F2ED] active:scale-90 border border-[#F5F2ED] font-black text-sm text-[#2D3436] rounded-xl transition-all"
                >
                  0
                </button>
                <div className="w-11 h-11 bg-[#7A9482]/10 text-[#7A9482] rounded-xl flex items-center justify-center">
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* CONTROLES DE ACCIÓN DE NAVEGACIÓN INFERIOR */}
      <div className="flex gap-2 pt-2 border-t border-[#F5F2ED] relative z-50">
        {subStep > 1 && (
          <button
            type="button"
            onClick={() => setSubStep(prev => (prev - 1) as any)}
            className="bg-[#F5F2ED] text-[#8B5E3C] px-5 rounded-[1.5rem] font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Atrás
          </button>
        )}
        
        {subStep < 3 ? (
          <button
            type="button"
            onClick={() => setSubStep(prev => (prev + 1) as any)}
            className="flex-1 bg-[#7A9482] text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            Siguiente <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSiguienteMódulo}
            disabled={loading}
            className="flex-1 bg-[#7A9482] text-white p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Finalizar Registro'}
          </button>
        )}
      </div>

    </div>
  );
};