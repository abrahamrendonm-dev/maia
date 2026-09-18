import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Droplets, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MilkInventoryListProps {
    parentId: string;
    readOnly?: boolean;
}

interface Entry {
    id: string;
    amount_ml: number;
    storage_location: 'refrigerador' | 'congelador' | null;
    extraction_date: string;
    expiry_date: string | null;
    is_consumed: boolean;
}

const etiquetaUbicacion = (loc: Entry['storage_location']) => {
    switch (loc) {
        case 'refrigerador':
            return 'Refrigerador';
        case 'congelador':
            return 'Congelador';
        default:
            return 'Consumo inmediato';
    }
};

export const MilkInventoryList = ({ parentId, readOnly = false }: MilkInventoryListProps) => {
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const cargar = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('milk_inventory')
                .select('id, amount_ml, storage_location, extraction_date, expiry_date, is_consumed')
                .eq('parent_id', parentId)
                .order('extraction_date', { ascending: false });

            setEntries(data || []);
            setLoading(false);
        };

        cargar();
    }, [parentId]);

    const handleMarcarConsumida = async (id: string) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from('milk_inventory')
            .update({ is_consumed: true, consumed_at: new Date().toISOString() })
            .eq('id', id);

        setUpdatingId(null);

        if (error) {
            toast.error('No pudimos actualizar la extracción', { description: error.message });
        } else {
            setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_consumed: true } : e)));
        }
    };

    if (loading) {
        return <p className="text-xs text-[#8B5E3C] font-medium italic py-2">Cargando extracciones...</p>;
    }

    if (entries.length === 0) {
        return <p className="text-xs text-[#8B5E3C]/70 font-medium py-2">Aún no hay extracciones registradas.</p>;
    }

    return (
        <div className="space-y-2">
            {entries.map((entry) => {
                const isExpired = !entry.is_consumed && entry.expiry_date && new Date(entry.expiry_date) < new Date();

                return (
                    <div
                        key={entry.id}
                        className="bg-[#F5F2ED]/50 p-3 rounded-xl flex items-center justify-between gap-2"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 bg-orange-50 text-orange-400 rounded-lg flex items-center justify-center shrink-0">
                                <Droplets size={14} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-[#2D3436]">
                                    {entry.amount_ml} ml · {etiquetaUbicacion(entry.storage_location)}
                                </p>
                                <p className="text-[10px] text-[#8B5E3C]/70 font-medium truncate">
                                    Extraída: {new Date(entry.extraction_date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                                {entry.expiry_date && (
                                    <p className={`text-[10px] font-bold ${entry.is_consumed ? 'text-[#8B5E3C]/50' : isExpired ? 'text-red-500' : 'text-[#7A9482]'}`}>
                                        {entry.is_consumed
                                            ? 'Consumida'
                                            : isExpired
                                                ? 'Caducada'
                                                : `Buena hasta ${new Date(entry.expiry_date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!readOnly && !entry.is_consumed && (
                            <button
                                onClick={() => handleMarcarConsumida(entry.id)}
                                disabled={updatingId === entry.id}
                                title="Marcar como consumida"
                                className="w-8 h-8 bg-white border-2 border-[#F5F2ED] rounded-lg flex items-center justify-center text-[#7A9482] hover:bg-[#7A9482] hover:text-white active:scale-90 transition-all shrink-0 disabled:opacity-50"
                            >
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
