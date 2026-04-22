import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sparkles, Calendar, ClipboardList, BookOpen, Heart } from 'lucide-react';

export const Home = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [weeks, setWeeks] = useState({ total: 0, days: 0 });

  useEffect(() => {
    const fetchStatus = async () => {
      // 1. Buscamos si hay un embarazo registrado
      const { data, error } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('parent_id', userId)
        .maybeSingle();

      if (data) {
        setPregnancy(data);
        calcularSemanas(data.fur_date);
      }
      setLoading(false);
    };

    fetchStatus();
  }, [userId]);

  const calcularSemanas = (fur: string) => {
    const inicio = new Date(fur);
    const hoy = new Date();
    const dif = hoy.getTime() - inicio.getTime();
    const totalDias = Math.floor(dif / (1000 * 60 * 60 * 24));
    setWeeks({
      total: Math.floor(totalDias / 7),
      days: totalDias % 7
    });
  };

  if (loading) return <div className="p-10 text-center text-[#7A9482]">Cargando tu mundo...</div>;

  // VISTA DE GESTACIÓN
  if (pregnancy) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Card de Progreso */}
        <div className="bg-gradient-to-br from-[#7A9482] to-[#8BA895] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Tu embarazo</span>
            <h2 className="text-4xl font-black mt-1">Semana {weeks.total}</h2>
            <p className="text-sm font-medium opacity-90">{weeks.days} días de puro amor</p>
          </div>
          <Sparkles className="absolute right-[-10px] bottom-[-10px] text-white/20" size={120} />
        </div>

        {/* Comparativo Creativo (Base del requerimiento) */}
        <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-5 rounded-[2rem] flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">
            {getEmojiTamaño(weeks.total)}
          </div>
          <div>
            <h3 className="font-black text-[#2D3436] text-sm">Tamaño del bebé</h3>
            <p className="text-xs text-[#8B5E3C] font-medium">{getTextoTamaño(weeks.total)}</p>
          </div>
        </div>

        {/* Botones de Acción: Orientación y Empatía */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all">
            <ClipboardList className="text-[#7A9482]" />
            <span className="text-[10px] font-bold uppercase">Plan de Parto</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all">
            <Calendar className="text-[#7A9482]" />
            <span className="text-[10px] font-bold uppercase">Citas Médicas</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all">
            <BookOpen className="text-[#7A9482]" />
            <span className="text-[10px] font-bold uppercase">Cursos</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all">
            <Heart className="text-[#7A9482]" />
            <span className="text-[10px] font-bold uppercase">Bienestar</span>
          </button>
        </div>
      </div>
    );
  }

  // Si no hay embarazo, mostramos el dashboard de Lactancia original (lo que ya tenías)
  return (
    <div className="space-y-6">
      {/* Aquí va tu código original de Lactancia/Home */}
      <p className="text-center text-gray-400 text-xs">Modo Lactancia Activo</p>
    </div>
  );
};

// Funciones auxiliares para el "Comparativo Creativo"
const getEmojiTamaño = (sem: number) => {
  if (sem < 5) return '🌱';
  if (sem < 9) return '🍓';
  if (sem < 13) return '🍋';
  if (sem < 17) return '🍎';
  if (sem < 22) return '🥥';
  return '🍉';
};

const getTextoTamaño = (sem: number) => {
  if (sem < 5) return 'Tu bebé es una pequeña semilla de esperanza.';
  if (sem < 9) return 'Tiene el tamaño de una fresa.';
  if (sem < 13) return 'Es como un limón, ¡ya se mueve mucho!';
  if (sem < 17) return 'Del tamaño de una manzana.';
  if (sem < 22) return 'Es como un coco pequeño.';
  return '¡Ya es una sandía hermosa!';
};