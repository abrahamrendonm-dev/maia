import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Baby, Scale, Ruler, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LogCrecimientoModalProps {
    childId: string;
    parentId: string;
    childName: string;
    onClose: () => void;
    onSaved: () => void;
}

export const LogCrecimientoModal = ({ childId, parentId, childName, onClose, onSaved }: LogCrecimientoModalProps) => {
    const [weightKg, setWeightKg] = useState('');
    const [weightG, setWeightG] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [saving, setSaving] = useState(false);

    const hasData = weightKg.trim() || weightG.trim() || heightCm.trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasData) return;

        setSaving(true);

        const kg = parseInt(weightKg) || 0;
        const g = parseInt(weightG) || 0;
        const totalGrams = kg * 1000 + g;

        const { error } = await supabase.from('growth_measurements').insert([
            {
                child_id: childId,
                parent_id: parentId,
                weight_grams: weightKg.trim() || weightG.trim() ? totalGrams : null,
                height_cm: heightCm.trim() ? parseFloat(heightCm) : null,
            },
        ]);

        setSaving(false);

        if (error) {
            toast.error('No pudimos guardar la medición', { description: error.message });
        } else {
            toast.success('¡Medición registrada! 📏');
            onSaved();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436] flex items-center gap-2">
                        <Baby size={20} className="text-green-500" /> Peso y Talla
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-xs text-[#8B5E3C] font-medium mb-4">Registrando a {childName}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[#8B5E3C] ml-1 flex items-center gap-1">
                            <Scale size={12} /> Peso (opcional)
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <input
                                type="number"
                                min="0"
                                placeholder="kg"
                                className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                value={weightKg}
                                onChange={(e) => setWeightKg(e.target.value)}
                            />
                            <input
                                type="number"
                                min="0"
                                max="999"
                                placeholder="g"
                                className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                value={weightG}
                                onChange={(e) => setWeightG(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[#8B5E3C] ml-1 flex items-center gap-1">
                            <Ruler size={12} /> Talla en cm (opcional)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Ej: 58.5"
                            className="w-full mt-1 p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                            value={heightCm}
                            onChange={(e) => setHeightCm(e.target.value)}
                        />
                    </div>

                    <p className="text-[10px] text-[#8B5E3C]/60 font-medium text-center px-2">
                        Puedes registrar solo peso, solo talla, o ambos.
                    </p>

                    <button
                        type="submit"
                        disabled={saving || !hasData}
                        className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar medición'}
                        <Check size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
