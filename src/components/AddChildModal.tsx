import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Calendar, Scale, Ruler, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AddChildModalProps {
    parentId: string;
    onClose: () => void;
    onAdded: () => void;
}

export const AddChildModal = ({ parentId, onClose, onAdded }: AddChildModalProps) => {
    const [loading, setLoading] = useState(false);
    const [babyData, setBabyData] = useState({
        name: '',
        birthDate: '',
        isPremature: false,
        gestationalWeeks: 40,
        weight: '',
        length: '',
        gender: 'niño' as 'niño' | 'niña' | 'otro',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('children').insert([
            {
                parent_id: parentId,
                name: babyData.name,
                birth_date: babyData.birthDate,
                is_premature: babyData.isPremature,
                gestational_weeks: babyData.isPremature ? babyData.gestationalWeeks : 40,
                gender: babyData.gender,
                birth_weight_grams: babyData.weight ? parseInt(babyData.weight) : null,
                birth_length_cm: babyData.length ? parseFloat(babyData.length) : null,
            },
        ]);

        setLoading(false);

        if (error) {
            toast.error('No pudimos registrar al bebé', { description: error.message });
        } else {
            toast.success('¡Bebé agregado a MAIA! ✨');
            onAdded();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436]">Agregar otro bebé</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nombre del bebé"
                        required
                        className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                        value={babyData.name}
                        onChange={(e) => setBabyData({ ...babyData, name: e.target.value })}
                    />

                    <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-gray-400" size={18} />
                        <input
                            type="date"
                            required
                            className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                            value={babyData.birthDate}
                            onChange={(e) => setBabyData({ ...babyData, birthDate: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(['niño', 'niña', 'otro'] as const).map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setBabyData({ ...babyData, gender: g })}
                                className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 capitalize transition-all active:scale-95 ${
                                    babyData.gender === g
                                        ? 'bg-[#7A9482] text-white border-[#7A9482]'
                                        : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-[#F5F2ED]/50 rounded-2xl">
                        <input
                            type="checkbox"
                            id="add-child-premature"
                            className="w-5 h-5 accent-[#7A9482]"
                            checked={babyData.isPremature}
                            onChange={(e) => setBabyData({ ...babyData, isPremature: e.target.checked })}
                        />
                        <label htmlFor="add-child-premature" className="text-sm font-semibold text-gray-600">
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
                                className="w-full p-4 rounded-2xl border-2 border-[#7A9482]/30 outline-none text-sm"
                                value={babyData.gestationalWeeks}
                                onChange={(e) => setBabyData({ ...babyData, gestationalWeeks: parseInt(e.target.value) })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Scale className="absolute left-4 top-4 text-gray-400" size={18} />
                            <input
                                type="number"
                                placeholder="Peso (g)"
                                className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none text-sm"
                                value={babyData.weight}
                                onChange={(e) => setBabyData({ ...babyData, weight: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <Ruler className="absolute left-4 top-4 text-gray-400" size={18} />
                            <input
                                type="number"
                                placeholder="Talla (cm)"
                                className="w-full p-4 pl-12 rounded-2xl border-2 border-[#F5F2ED] outline-none text-sm"
                                value={babyData.length}
                                onChange={(e) => setBabyData({ ...babyData, length: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !babyData.name || !babyData.birthDate}
                        className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Agregar bebé'}
                        <Check size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
