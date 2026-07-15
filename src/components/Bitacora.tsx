import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Timer, Baby, Droplets, Utensils, Moon, History, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { LogExtraccionModal } from './LogExtraccionModal';
import { MilkInventoryList } from './MilkInventoryList';

interface Props {
    userId: string;
}

export const Bitacora = ({ userId }: Props) => {
    const [activeTimer, setActiveTimer] = useState<'izquierda' | 'derecha' | null>(null);
    const [seconds, setSeconds] = useState(0);
    const [babyName, setBabyName] = useState('tu bebé');
    const [childId, setChildId] = useState<string | null>(null);
    const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
    const [parentId, setParentId] = useState<string | null>(null); // "raíz familiar" (id de la mamá)
    const [savingQuick, setSavingQuick] = useState<'panal' | 'sueno' | null>(null);
    const [showExtraccion, setShowExtraccion] = useState(false);
    const [showMilkInventory, setShowMilkInventory] = useState(false);
    const [milkRefreshToken, setMilkRefreshToken] = useState(0);

    const activeChildStorageKey = (targetParentId: string) => `maia_active_child_${targetParentId}`;

    const selectChild = (child: { id: string; name: string }, targetParentId: string) => {
        setChildId(child.id);
        setBabyName(child.name);
        localStorage.setItem(activeChildStorageKey(targetParentId), child.id);
    };

    // Recuperar la raíz familiar (mamá) y los bebés de esa familia al cargar
    useEffect(() => {
        const init = async () => {
            // 1. Determinar el id de la mamá (si el usuario ES la mamá, es su propio id;
            //    si es papá/apoyo, usamos linked_mother_id)
            const { data: profile } = await supabase
                .from('profiles')
                .select('linked_mother_id')
                .eq('id', userId)
                .maybeSingle();

            const targetParentId = profile?.linked_mother_id || userId;
            setParentId(targetParentId);

            // 2. Buscar a los bebés de esa familia (puede haber más de uno: gemelos, hermanos)
            const { data: kids } = await supabase
                .from('children')
                .select('id, name')
                .eq('parent_id', targetParentId)
                .order('birth_date', { ascending: false });

            if (kids && kids.length > 0) {
                setChildren(kids);

                // Recordar la última selección de esta familia, si sigue existiendo
                const savedId = localStorage.getItem(activeChildStorageKey(targetParentId));
                const savedChild = kids.find(k => k.id === savedId);
                selectChild(savedChild || kids[0], targetParentId);
            }
        };
        init();
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
        if (!parentId) {
            toast.error('No pudimos identificar el nido. Intenta de nuevo en unos segundos.');
            return;
        }

        const lado = activeTimer; // 'izquierda' | 'derecha'
        const totalSeconds = seconds;
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - totalSeconds * 1000);

        // Optimista: reseteamos la UI primero para que se sienta instantáneo
        setActiveTimer(null);
        setSeconds(0);

        const { error } = await supabase.from('tracking_logs').insert([
            {
                parent_id: parentId,
                child_id: childId,
                child_name: babyName,
                type: 'lactancia',
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                metadata: { lado },
            },
        ]);

        if (error) {
            toast.error('No pudimos guardar la toma', { description: error.message });
        } else {
            toast.success(`Toma de ${formatTime(totalSeconds)} registrada en el lado ${lado}`);
        }
    };

    // Registro rápido para Pañal / Sueño (un solo tap, sin cronómetro)
    const handleQuickLog = async (type: 'panal' | 'sueno') => {
        if (!parentId) {
            toast.error('No pudimos identificar el nido. Intenta de nuevo en unos segundos.');
            return;
        }

        setSavingQuick(type);
        const now = new Date().toISOString();

        const { error } = await supabase.from('tracking_logs').insert([
            {
                parent_id: parentId,
                child_id: childId,
                child_name: babyName,
                type,
                start_time: now,
                end_time: now,
            },
        ]);

        setSavingQuick(null);

        if (error) {
            toast.error('No pudimos guardar el registro', { description: error.message });
        } else {
            toast.success(type === 'panal' ? 'Pañal registrado' : 'Sueño registrado');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Saludo Personalizado */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#2D3436]">¡Hola, Mamá!</h2>
                    <p className="text-[#8B5E3C] text-xs font-bold">Registra las tomas y cuidados de {babyName}</p>
                </div>
                <div className="w-12 h-12 bg-[#F5F2ED] rounded-2xl flex items-center justify-center text-[#7A9482]">
                    <History size={24} />
                </div>
            </div>

            {/* Selector de bebé activo — solo se muestra cuando hay más de un hijo (gemelos, hermanos) */}
            {children.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                    {children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => parentId && selectChild(child, parentId)}
                            className={`px-4 py-2 text-xs font-bold rounded-2xl border-2 snap-center shrink-0 transition-all active:scale-95 ${
                                childId === child.id
                                    ? 'bg-[#7A9482] text-white border-[#7A9482]'
                                    : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                            }`}
                        >
                            {child.name}
                        </button>
                    ))}
                </div>
            )}

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
                <button
                    onClick={() => handleQuickLog('panal')}
                    disabled={savingQuick === 'panal'}
                    className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all disabled:opacity-50"
                >
                    <div className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-400 group-hover:text-white transition-colors">
                        <Droplets size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">{savingQuick === 'panal' ? 'Guardando...' : 'Pañal'}</span>
                </button>

                {/* Sueño */}
                <button
                    onClick={() => handleQuickLog('sueno')}
                    disabled={savingQuick === 'sueno'}
                    className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all disabled:opacity-50"
                >
                    <div className="w-10 h-10 bg-purple-50 text-purple-400 rounded-xl flex items-center justify-center group-hover:bg-purple-400 group-hover:text-white transition-colors">
                        <Moon size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">{savingQuick === 'sueno' ? 'Guardando...' : 'Sueño'}</span>
                </button>

                {/* Extracción */}
                <button
                    onClick={() => setShowExtraccion(true)}
                    className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all"
                >
                    <div className="w-10 h-10 bg-orange-50 text-orange-400 rounded-xl flex items-center justify-center group-hover:bg-orange-400 group-hover:text-white transition-colors">
                        <Droplets size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Extraer</span>
                </button>

                {/* Peso/Talla (pendiente de conectar — no forma parte de esta limpieza) */}
                <button className="bg-white p-5 rounded-[30px] border-2 border-[#F5F2ED] flex flex-col items-center gap-3 group active:scale-95 transition-all opacity-60">
                    <div className="w-10 h-10 bg-green-50 text-green-400 rounded-xl flex items-center justify-center group-hover:bg-green-400 group-hover:text-white transition-colors">
                        <Baby size={20} />
                    </div>
                    <span className="font-bold text-sm text-[#2D3436]">Crecimiento</span>
                </button>
            </div>

            {/* Botón de Emergencia / Ayuda */}
            <button className="w-full bg-[#8B5E3C] p-5 rounded-[30px] flex items-center justify-center gap-3 shadow-lg shadow-[#8B5E3C]/20">
                <Utensils className="text-white" size={20} />
                <span className="text-white font-black text-sm uppercase tracking-widest">¿Qué hago si no quiere comer?</span>
            </button>

            {/* SECCIÓN: EXTRACCIONES REGISTRADAS (colapsable) */}
            <div className="bg-white border-2 border-[#F5F2ED] rounded-[30px] overflow-hidden">
                <button
                    onClick={() => setShowMilkInventory((v) => !v)}
                    className="w-full p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-orange-400" />
                        <span className="font-black text-[#2D3436] text-xs uppercase tracking-widest">Extracciones registradas</span>
                    </div>
                    <ChevronDown
                        size={18}
                        className={`text-[#8B5E3C] transition-transform ${showMilkInventory ? 'rotate-180' : ''}`}
                    />
                </button>
                {showMilkInventory && parentId && (
                    <div className="px-4 pb-4">
                        <MilkInventoryList key={milkRefreshToken} parentId={parentId} />
                    </div>
                )}
            </div>

            {showExtraccion && parentId && (
                <LogExtraccionModal
                    parentId={parentId}
                    onClose={() => setShowExtraccion(false)}
                    onSaved={() => {
                        setShowExtraccion(false);
                        setMilkRefreshToken((t) => t + 1);
                        setShowMilkInventory(true);
                    }}
                />
            )}
        </div>
    );
};
