import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ClipboardList, X, Check, Heart, Phone, Ban, StickyNote } from 'lucide-react';
import { toast } from 'sonner';

interface PlanDePartoModalProps {
    parentId: string;
    onClose: () => void;
}

type TipoParto = 'vaginal' | 'cesarea' | 'sin_preferencia';
type ManejoDolor = 'natural' | 'epidural' | 'sin_preferencia';

interface Preferencias {
    tipo_parto: TipoParto;
    manejo_dolor: ManejoDolor;
    acompanante: string;
    piel_con_piel_inmediato: boolean;
    lactancia_primera_hora: boolean;
    evitar_formula_sin_indicacion: boolean;
    contacto1_nombre: string;
    contacto1_telefono: string;
    contacto2_nombre: string;
    contacto2_telefono: string;
    cosas_a_evitar: string;
    notas_adicionales: string;
}

const defaultPreferencias: Preferencias = {
    tipo_parto: 'sin_preferencia',
    manejo_dolor: 'sin_preferencia',
    acompanante: '',
    piel_con_piel_inmediato: true,
    lactancia_primera_hora: true,
    evitar_formula_sin_indicacion: true,
    contacto1_nombre: '',
    contacto1_telefono: '',
    contacto2_nombre: '',
    contacto2_telefono: '',
    cosas_a_evitar: '',
    notas_adicionales: '',
};

const TileGroup = <T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) => (
    <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`py-3 px-1 text-[10px] font-black uppercase tracking-wide rounded-xl border-2 transition-all active:scale-95 ${
                    value === opt.value
                        ? 'bg-[#7A9482] text-white border-[#7A9482]'
                        : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export const PlanDePartoModal = ({ parentId, onClose }: PlanDePartoModalProps) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [planId, setPlanId] = useState<string | null>(null);
    const [prefs, setPrefs] = useState<Preferencias>(defaultPreferencias);

    useEffect(() => {
        const cargar = async () => {
            const { data } = await supabase
                .from('birth_plans')
                .select('id, preferences')
                .eq('parent_id', parentId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setPlanId(data.id);
                setPrefs({ ...defaultPreferencias, ...(data.preferences || {}) });
            }
            setLoading(false);
        };
        cargar();
    }, [parentId]);

    const set = <K extends keyof Preferencias>(key: K, value: Preferencias[K]) =>
        setPrefs((p) => ({ ...p, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = { preferences: prefs, updated_at: new Date().toISOString() };

        const { error } = planId
            ? await supabase.from('birth_plans').update(payload).eq('id', planId)
            : await supabase.from('birth_plans').insert([{ parent_id: parentId, ...payload }]);

        setSaving(false);

        if (error) {
            toast.error('No pudimos guardar tu plan de parto', { description: error.message });
        } else {
            toast.success('¡Plan de parto guardado! 💛');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436] flex items-center gap-2">
                        <ClipboardList size={20} className="text-[#7A9482]" /> Plan de Parto
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <p className="text-xs text-[#8B5E3C] font-medium italic text-center py-6">Cargando...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 1. Preferencias de parto */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C]">
                                Tipo de parto
                            </label>
                            <TileGroup
                                value={prefs.tipo_parto}
                                onChange={(v) => set('tipo_parto', v)}
                                options={[
                                    { value: 'vaginal', label: 'Vaginal' },
                                    { value: 'cesarea', label: 'Cesárea' },
                                    { value: 'sin_preferencia', label: 'Sin preferencia' },
                                ]}
                            />

                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C]">
                                Manejo del dolor
                            </label>
                            <TileGroup
                                value={prefs.manejo_dolor}
                                onChange={(v) => set('manejo_dolor', v)}
                                options={[
                                    { value: 'natural', label: 'Natural' },
                                    { value: 'epidural', label: 'Epidural' },
                                    { value: 'sin_preferencia', label: 'Sin preferencia' },
                                ]}
                            />

                            <input
                                type="text"
                                placeholder="¿Quién te acompaña en el parto?"
                                className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                value={prefs.acompanante}
                                onChange={(e) => set('acompanante', e.target.value)}
                            />
                        </div>

                        {/* 2. Contacto piel con piel / lactancia inmediata */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
                                <Heart size={12} /> Al nacer
                            </label>
                            {([
                                ['piel_con_piel_inmediato', 'Contacto piel con piel inmediato'],
                                ['lactancia_primera_hora', 'Lactancia en la primera hora'],
                                ['evitar_formula_sin_indicacion', 'Evitar fórmula sin indicación médica'],
                            ] as const).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-3 p-3.5 bg-white border-2 border-[#F5F2ED] rounded-2xl">
                                    <input
                                        type="checkbox"
                                        id={key}
                                        className="w-5 h-5 accent-[#7A9482]"
                                        checked={prefs[key]}
                                        onChange={(e) => set(key, e.target.checked)}
                                    />
                                    <label htmlFor={key} className="text-xs font-semibold text-[#2D3436]">
                                        {label}
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* 3. Contactos de emergencia */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
                                <Phone size={12} /> Contactos de emergencia
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    className="p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-xs"
                                    value={prefs.contacto1_nombre}
                                    onChange={(e) => set('contacto1_nombre', e.target.value)}
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono"
                                    className="p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-xs"
                                    value={prefs.contacto1_telefono}
                                    onChange={(e) => set('contacto1_telefono', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Nombre (opcional)"
                                    className="p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-xs"
                                    value={prefs.contacto2_nombre}
                                    onChange={(e) => set('contacto2_nombre', e.target.value)}
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono (opcional)"
                                    className="p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-xs"
                                    value={prefs.contacto2_telefono}
                                    onChange={(e) => set('contacto2_telefono', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 4. Cosas que prefiere evitar */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
                                <Ban size={12} /> Prefiero evitar
                            </label>
                            <textarea
                                placeholder="Ej: episiotomía de rutina, separación innecesaria del bebé..."
                                rows={3}
                                className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm resize-none"
                                value={prefs.cosas_a_evitar}
                                onChange={(e) => set('cosas_a_evitar', e.target.value)}
                            />
                        </div>

                        {/* 5. Notas adicionales */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8B5E3C] flex items-center gap-1.5">
                                <StickyNote size={12} /> Notas adicionales
                            </label>
                            <textarea
                                placeholder="Cualquier otra cosa que quieras que tu equipo sepa..."
                                rows={3}
                                className="w-full p-4 rounded-2xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm resize-none"
                                value={prefs.notas_adicionales}
                                onChange={(e) => set('notas_adicionales', e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar plan de parto'}
                            <Check size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
