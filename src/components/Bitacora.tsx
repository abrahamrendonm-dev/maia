import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Timer, Baby, Droplets, Utensils, Moon, History, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    userId: string;
}

export const Bitacora = ({ userId }: Props) => {
    const [activeTimer, setActiveTimer] = useState<'izquierda' | 'derecha' | null>(null);
    const [seconds, setSeconds] = useState(0);
    const [babyName, setBabyName] = useState('tu bebé');

    // Recuperar nombre del bebé al cargar
    useEffect(() => {
        const getBaby = async () => {
            const { data } = await supabase
                .from('children')
                .select('name')
                .eq('parent_id', userId)
                .limit(1)
                .single();
            if (data) setBabyName(data.name);
        };
        getBaby();
    }, [userId]);

    // Lógica del Cronómetro de Lactancia
    useEffect(() => {
        let interval: any;
        if (activeTimer) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleStopTimer = async () => {
        // Aquí guardaríamos la toma en la base de datos
        toast.success(`Toma de ${formatTime(seconds)} registrada en el lado ${activeTimer}`);
        setActiveTimer(null);
        setSeconds(0);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Saludo Personalizado */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#2D3436]">¡Hola, Mamá!</h2>
                    <p className="text-[#8B5E3C] text-xs font-bold">Hoy {babyName} ha comido 6 veces</p>
                </div>
                <div className="w-12 h-12 bg-[#F5F2ED] rounded-2xl flex items-center justify-center text-[#7A9482]">
                    <History size={24} />
                </div>
            </div>

            {/* SECCIÓN: CRONÓMETRO DE PECHO (Eje de LactApp) */}
            <div className="bg-[#7A9482]/10 p-6 rounded-[35px] border-2 border-[#7A9482]/5">
                <div className="flex items-center gap-2 mb-4">
                    <Timer className="text-[#7A9482]" size={20} />
                    <span className="font-black text-[#2D3436] uppercase text-[10px] tracking-widest">Cronómetro de Toma</span>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <button
                        onClick={() => activeTimer === 'izquierda' ? handleStopTimer() : setActiveTimer('izquierda')}
                        className={`flex-1 py-8 rounded-[30px] flex flex-col items-center gap-2 transition-all ${activeTimer === 'izquierda' ? 'bg-[#7A9482] text-white shadow-lg' : 'bg-white text-gray-400'}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Izquierdo</span>
                        <span className="text-2xl font-black">{activeTimer === 'izquierda' ? formatTime(seconds) : '00:00'}</span>
                    </button>

                    <button
                        onClick={() => activeTimer === 'derecha' ? handleStopTimer() : setActiveTimer('derecha')}
                        className={`flex-1 py-8 rounded-[30px] flex flex-col items-center gap-2 transition-all ${activeTimer === 'derecha' ? 'bg-[#7A9482] text-white shadow-lg' : 'bg-white text-gray-400'}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Derecho</span>
                        <span className="text-2xl font-black">{activeTimer === 'derecha' ? formatTime(seconds) : '00:00'}</span>
                    </button>
                </div>
            </div>

            {/* SECCIÓN: ACCIONES RÁPIDAS (Grid de 2x2) */}
            <div className="grid grid-cols-2 gap-4">
                {/* Pañal */}
                <button className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all">
                    <div className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-400 group-hover:text-white transition-colors">
                        <Droplets size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Pañal</span>
                </button>

                {/* Sueño */}
                <button className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all">
                    <div className="w-10 h-10 bg-purple-50 text-purple-400 rounded-xl flex items-center justify-center group-hover:bg-purple-400 group-hover:text-white transition-colors">
                        <Moon size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Sueño</span>
                </button>

                {/* Extracción (Eje de Nido) */}
                <button className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all">
                    <div className="w-10 h-10 bg-orange-50 text-orange-400 rounded-xl flex items-center justify-center group-hover:bg-orange-400 group-hover:text-white transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Extraer</span>
                </button>

                {/* Peso/Talla */}
                <button className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all">
                    <div className="w-10 h-10 bg-green-50 text-green-400 rounded-xl flex items-center justify-center group-hover:bg-green-400 group-hover:text-white transition-colors">
                        <Baby size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Crecimiento</span>
                </button>
            </div>

            {/* Botón de Emergencia / Ayuda (Superior a LactApp) */}
            <button className="w-full bg-[#8B5E3C] p-5 rounded-[30px] flex items-center justify-center gap-3 shadow-lg shadow-[#8B5E3C]/20">
                <Utensils className="text-white" size={20} />
                <span className="text-white font-black text-sm uppercase tracking-widest">¿Qué hago si no quiere comer?</span>
            </button>
        </div>
    );
};