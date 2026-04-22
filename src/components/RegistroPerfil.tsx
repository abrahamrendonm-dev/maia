import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Baby, Calendar, Scale, Ruler, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RegistroPerfilProps {
    userId: string;
    onComplete: () => void;
}

export const RegistroPerfil = ({ userId, onComplete }: RegistroPerfilProps) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Rol, 2: Datos del Bebé

    // Estado para el perfil de usuario
    const [rol, setRol] = useState<'mama' | 'papa'>('mama');

    // Estado para el bebé
    const [babyData, setBabyData] = useState({
        name: '',
        birthDate: '',
        isPremature: false,
        gestationalWeeks: 40,
        weight: '',
        length: '',
        gender: 'niño' as 'niño' | 'niña' | 'otro'
    });

    const guardarPerfilCompleto = async () => {
        setLoading(true);

        // 1. Actualizar el rol en la tabla perfiles
        const { error: profileError } = await supabase
            .from('perfiles')
            .update({ rol: rol })
            .eq('id', userId);

        if (profileError) {
            toast.error("Error al actualizar perfil");
            setLoading(false);
            return;
        }

        // 2. Insertar el bebé en la nueva tabla children
        const { error: babyError } = await supabase
            .from('children')
            .insert([
                {
                    parent_id: userId,
                    name: babyData.name,
                    birth_date: babyData.birthDate,
                    is_premature: babyData.isPremature,
                    gestational_weeks: babyData.isPremature ? babyData.gestationalWeeks : 40,
                    gender: babyData.gender,
                    birth_weight_grams: parseInt(babyData.weight),
                    birth_length_cm: parseFloat(babyData.length)
                }
            ]);

        setLoading(false);

        if (babyError) {
            toast.error("Vaya, algo falló al registrar al bebé");
            console.error(babyError);
        } else {
            toast.success("¡Perfil y bebé registrados! ✨");
            onComplete();
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8 p-4 animate-in fade-in duration-700">

            {step === 1 ? (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-[#2D3436] mb-2">¿Quién eres?</h2>
                        <p className="text-gray-500">Queremos personalizar tu experiencia en el nido.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(['mama', 'papa'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRol(r)}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${rol === r
                                        ? 'border-[#7A9482] bg-[#7A9482]/5'
                                        : 'border-gray-100 bg-white'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rol === r ? 'bg-[#7A9482] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Baby size={24} />
                                </div>
                                <span className={`font-bold capitalize ${rol === r ? 'text-[#7A9482]' : 'text-gray-400'}`}>
                                    {r}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg"
                    >
                        Siguiente: Datos del Bebé
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-[#2D3436]">Datos de tu Bebé</h2>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nombre del bebé"
                            className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482]"
                            value={babyData.name}
                            onChange={(e) => setBabyData({ ...babyData, name: e.target.value })}
                        />

                        <div className="relative">
                            <Calendar className="absolute left-4 top-4 text-gray-400" size={20} />
                            <input
                                type="date"
                                className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482]"
                                value={babyData.birthDate}
                                onChange={(e) => setBabyData({ ...babyData, birthDate: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-[#F5F2ED]/50 rounded-2xl">
                            <input
                                type="checkbox"
                                id="premature"
                                className="w-5 h-5 accent-[#7A9482]"
                                checked={babyData.isPremature}
                                onChange={(e) => setBabyData({ ...babyData, isPremature: e.target.checked })}
                            />
                            <label htmlFor="premature" className="text-sm font-semibold text-gray-600">
                                ¿Nació de forma prematura?
                            </label>
                        </div>

                        {babyData.isPremature && (
                            <div className="animate-in zoom-in-95 duration-300">
                                <label className="text-xs font-bold text-[#7A9482] ml-2">Semanas de gestación al nacer</label>
                                <input
                                    type="number"
                                    min="20"
                                    max="37"
                                    placeholder="Semanas (ej. 32)"
                                    className="w-full p-4 rounded-2xl border-2 border-[#7A9482]/30 outline-none"
                                    value={babyData.gestationalWeeks}
                                    onChange={(e) => setBabyData({ ...babyData, gestationalWeeks: parseInt(e.target.value) })}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Scale className="absolute left-4 top-4 text-gray-400" size={20} />
                                <input
                                    type="number"
                                    placeholder="Peso (g)"
                                    className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none"
                                    value={babyData.weight}
                                    onChange={(e) => setBabyData({ ...babyData, weight: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <Ruler className="absolute left-4 top-4 text-gray-400" size={20} />
                                <input
                                    type="number"
                                    placeholder="Talla (cm)"
                                    className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none"
                                    value={babyData.length}
                                    onChange={(e) => setBabyData({ ...babyData, length: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={guardarPerfilCompleto}
                        disabled={loading || !babyData.name || !babyData.birthDate}
                        className="w-full bg-[#8B5E3C] text-white py-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Creando nido...' : 'Finalizar Registro'}
                        <Check size={20} />
                    </button>

                    <button
                        onClick={() => setStep(1)}
                        className="w-full text-gray-400 text-sm font-bold"
                    >
                        Volver
                    </button>
                </div>
            )}
        </div>
    );
};