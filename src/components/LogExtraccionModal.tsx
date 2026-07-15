import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Droplets, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LogExtraccionModalProps {
    parentId: string;
    onClose: () => void;
    onSaved: () => void;
}

export const LogExtraccionModal = ({ parentId, onClose, onSaved }: LogExtraccionModalProps) => {
    const [amountMl, setAmountMl] = useState('');
    const [storageLocation, setStorageLocation] = useState<'refrigerador' | 'congelador' | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data, error } = await supabase
            .from('milk_inventory')
            .insert([
                {
                    parent_id: parentId,
                    amount_ml: parseInt(amountMl),
                    storage_location: storageLocation,
                },
            ])
            .select('expiry_date')
            .single();

        setSaving(false);

        if (error) {
            toast.error('No pudimos guardar la extracción', { description: error.message });
        } else {
            const expiryLabel = data?.expiry_date
                ? new Date(data.expiry_date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                : null;
            toast.success('¡Extracción registrada! 🍼', {
                description: expiryLabel ? `Buena hasta ${expiryLabel}` : undefined,
            });
            onSaved();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436] flex items-center gap-2">
                        <Droplets size={20} className="text-orange-400" /> Registrar extracción
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[#8B5E3C] ml-1">Cantidad extraída (ml)</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Ej: 90"
                            required
                            autoFocus
                            className="w-full mt-1 p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                            value={amountMl}
                            onChange={(e) => setAmountMl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[#8B5E3C] ml-1">¿Dónde la vas a guardar?</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {([
                                { value: null, label: 'Consumo inmediato' },
                                { value: 'refrigerador', label: 'Refrigerador' },
                                { value: 'congelador', label: 'Congelador' },
                            ] as const).map((opt) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setStorageLocation(opt.value)}
                                    className={`py-3 px-1 text-[10px] font-black uppercase tracking-wide rounded-xl border-2 transition-all active:scale-95 ${
                                        storageLocation === opt.value
                                            ? 'bg-[#7A9482] text-white border-[#7A9482]'
                                            : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving || !amountMl}
                        className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar extracción'}
                        <Check size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
