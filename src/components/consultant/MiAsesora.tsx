import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Stethoscope, X, Key, ShieldOff, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MiAsesoraProps {
    patientId: string; // siempre el id de la mamá (targetParentId)
    onClose: () => void;
}

interface Vinculo {
    id: string;
    consultant_id: string;
    linked_at: string;
    consultantName: string;
}

export const MiAsesora = ({ patientId, onClose }: MiAsesoraProps) => {
    const [loading, setLoading] = useState(true);
    const [vinculo, setVinculo] = useState<Vinculo | null>(null);
    const [codeInput, setCodeInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const cargarVinculo = async () => {
        setLoading(true);
        const { data: link } = await supabase
            .from('consultant_patients')
            .select('id, consultant_id, linked_at')
            .eq('patient_id', patientId)
            .eq('status', 'active')
            .maybeSingle();

        if (link) {
            const { data: consultantProfile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', link.consultant_id)
                .maybeSingle();

            setVinculo({
                id: link.id,
                consultant_id: link.consultant_id,
                linked_at: link.linked_at,
                consultantName: consultantProfile?.display_name || 'Tu asesora',
            });
        } else {
            setVinculo(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        cargarVinculo();
    }, [patientId]);

    const handleVincular = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const codigo = codeInput.trim().toUpperCase();

        const { data: consultantProfile, error: searchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('consultant_code', codigo)
            .eq('role', 'consultant')
            .maybeSingle();

        if (searchError || !consultantProfile) {
            toast.error('Código inválido. Verifica el código con tu asesora.');
            setSubmitting(false);
            return;
        }

        const { error: insertError } = await supabase.from('consultant_patients').insert([
            {
                consultant_id: consultantProfile.id,
                patient_id: patientId,
                status: 'active',
            },
        ]);

        setSubmitting(false);

        if (insertError) {
            toast.error('No pudimos vincularte con tu asesora', { description: insertError.message });
        } else {
            toast.success('¡Vinculada con tu asesora de lactancia! ✨');
            setCodeInput('');
            cargarVinculo();
        }
    };

    const handleRevocar = async () => {
        if (!vinculo) return;
        setRevoking(true);

        const { error } = await supabase
            .from('consultant_patients')
            .update({ status: 'revoked', revoked_at: new Date().toISOString() })
            .eq('id', vinculo.id);

        setRevoking(false);

        if (error) {
            toast.error('No pudimos revocar el acceso', { description: error.message });
        } else {
            toast.success('Acceso revocado. Tu asesora ya no puede ver tu información.');
            setVinculo(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436] flex items-center gap-2">
                        <Stethoscope size={20} className="text-[#7A9482]" /> Mi Asesora
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <p className="text-xs text-[#8B5E3C] font-medium italic text-center py-6">Cargando...</p>
                ) : vinculo ? (
                    <div className="space-y-4">
                        <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-2xl space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Vinculada con</p>
                            <p className="text-sm font-black text-[#2D3436]">{vinculo.consultantName}</p>
                            <p className="text-[10px] text-[#8B5E3C]/70 font-medium">
                                Desde el {new Date(vinculo.linked_at).toLocaleDateString('es-MX')}
                            </p>
                        </div>
                        <p className="text-[11px] text-[#8B5E3C] font-medium leading-relaxed px-1">
                            Tu asesora puede ver tu bitácora, embarazo y datos del bebé en modo solo lectura, y dejarte notas
                            profesionales. Puedes revocar su acceso cuando quieras.
                        </p>
                        <button
                            onClick={handleRevocar}
                            disabled={revoking}
                            className="w-full bg-red-50 text-red-500 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <ShieldOff size={16} /> {revoking ? 'Revocando...' : 'Revocar acceso'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleVincular} className="space-y-4">
                        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed px-1">
                            Si tu asesora de lactancia certificada te dio un código, captúralo aquí para que pueda dar
                            seguimiento a tu bitácora. Tú decides — puedes revocar el acceso cuando quieras.
                        </p>
                        <div className="relative">
                            <Key className="absolute left-4 top-4 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ej: ASESORA-4F2A"
                                required
                                className="w-full bg-white border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-4 pl-12 rounded-2xl text-center font-black text-sm tracking-widest text-[#2D3436] uppercase transition-all"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !codeInput.trim()}
                            className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? 'Vinculando...' : 'Vincular'}
                            <Check size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
