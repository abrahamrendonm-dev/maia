import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Baby, Calendar, Droplets, Moon, Timer, ClipboardList, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { MilkInventoryList } from '../MilkInventoryList';

interface ConsultantPatientDetailProps {
    consultantId: string;
    patientId: string;
    patientName: string;
    onBack: () => void;
}

interface TrackingLog {
    id: string;
    type: string;
    start_time: string;
    end_time: string | null;
    metadata: any;
    child_name: string;
}

interface Note {
    id: string;
    note: string;
    created_at: string;
}

const iconoPorTipo = (type: string) => {
    switch (type) {
        case 'lactancia':
            return <Timer size={14} className="text-[#7A9482]" />;
        case 'panal':
            return <Droplets size={14} className="text-blue-400" />;
        case 'sueno':
            return <Moon size={14} className="text-purple-400" />;
        default:
            return <ClipboardList size={14} className="text-[#8B5E3C]" />;
    }
};

const etiquetaPorTipo = (type: string) => {
    switch (type) {
        case 'lactancia':
            return 'Toma de pecho';
        case 'panal':
            return 'Pañal';
        case 'sueno':
            return 'Sueño';
        default:
            return type;
    }
};

export const ConsultantPatientDetail = ({ consultantId, patientId, patientName, onBack }: ConsultantPatientDetailProps) => {
    const [loading, setLoading] = useState(true);
    const [pregnancy, setPregnancy] = useState<any>(null);
    const [children, setChildren] = useState<{ id: string; name: string; birth_date: string }[]>([]);
    const [logs, setLogs] = useState<TrackingLog[]>([]);
    const [birthPlan, setBirthPlan] = useState<any>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [sendingNote, setSendingNote] = useState(false);

    const cargarNotas = async () => {
        const { data } = await supabase
            .from('consultant_notes')
            .select('id, note, created_at')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: true });
        setNotes(data || []);
    };

    useEffect(() => {
        const cargarDetalle = async () => {
            setLoading(true);

            const [{ data: preg }, { data: kids }, { data: kidsLogs }, { data: plan }] = await Promise.all([
                supabase.from('pregnancies').select('*').eq('parent_id', patientId).maybeSingle(),
                supabase.from('children').select('id, name, birth_date').eq('parent_id', patientId),
                supabase
                    .from('tracking_logs')
                    .select('id, type, start_time, end_time, metadata, child_name')
                    .eq('parent_id', patientId)
                    .order('start_time', { ascending: false })
                    .limit(20),
                supabase.from('birth_plans').select('*').eq('parent_id', patientId).maybeSingle(),
            ]);

            setPregnancy(preg);
            setChildren(kids || []);
            setLogs(kidsLogs || []);
            setBirthPlan(plan);
            await cargarNotas();

            setLoading(false);
        };

        cargarDetalle();
    }, [patientId]);

    const handleEnviarNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSendingNote(true);
        const { error } = await supabase.from('consultant_notes').insert([
            {
                consultant_id: consultantId,
                patient_id: patientId,
                note: newNote.trim(),
            },
        ]);
        setSendingNote(false);

        if (error) {
            toast.error('No pudimos guardar la nota', { description: error.message });
        } else {
            setNewNote('');
            cargarNotas();
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-[#7A9482] font-medium italic animate-pulse">Cargando expediente...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-[#F5F2ED] rounded-2xl flex items-center justify-center text-[#7A9482] active:scale-95 transition-transform"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-black text-[#2D3436]">{patientName}</h2>
                    <p className="text-[10px] text-[#8B5E3C] font-black uppercase tracking-wider">Modo solo lectura</p>
                </div>
            </div>

            {/* Embarazo */}
            {pregnancy && (
                <div className="bg-gradient-to-br from-[#7A9482] to-[#8BA895] p-5 rounded-[2rem] text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Embarazo</span>
                    <p className="text-sm font-bold mt-1">FUR: {new Date(pregnancy.fur_date).toLocaleDateString('es-MX')}</p>
                    {pregnancy.has_complications && (
                        <p className="text-xs mt-1 bg-white/20 rounded-lg px-2 py-1 inline-block">
                            ⚠️ Complicaciones reportadas
                        </p>
                    )}
                </div>
            )}

            {/* Bebés */}
            <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-2">
                <div className="flex items-center gap-2">
                    <Baby size={16} className="text-[#7A9482]" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Bebés</p>
                </div>
                {children.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {children.map((c) => (
                            <span key={c.id} className="text-xs font-bold text-[#2D3436] bg-[#F5F2ED] px-3 py-1.5 rounded-xl">
                                {c.name} · {new Date(c.birth_date).toLocaleDateString('es-MX')}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#8B5E3C]/70 font-medium">Aún no hay bebés registrados.</p>
                )}
            </div>

            {/* Plan de parto */}
            <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-2">
                <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-[#7A9482]" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Plan de Parto</p>
                </div>
                {birthPlan && birthPlan.preferences && Object.keys(birthPlan.preferences).length > 0 ? (
                    <pre className="text-[11px] text-[#2D3436] font-medium whitespace-pre-wrap">
                        {JSON.stringify(birthPlan.preferences, null, 2)}
                    </pre>
                ) : (
                    <p className="text-xs text-[#8B5E3C]/70 font-medium">Aún no lo ha configurado.</p>
                )}
            </div>

            {/* Bitácora reciente */}
            <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-3">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#7A9482]" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Bitácora reciente</p>
                </div>
                {logs.length > 0 ? (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-xs border-b border-[#F5F2ED] pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                    {iconoPorTipo(log.type)}
                                    <span className="font-bold text-[#2D3436]">{etiquetaPorTipo(log.type)}</span>
                                    {log.metadata?.lado && (
                                        <span className="text-[#8B5E3C]/70">({log.metadata.lado})</span>
                                    )}
                                </div>
                                <span className="text-[#8B5E3C]/70 font-medium">
                                    {new Date(log.start_time).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#8B5E3C]/70 font-medium">Aún no hay registros en la bitácora.</p>
                )}
            </div>

            {/* Leche extraída */}
            <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-3">
                <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-orange-400" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Leche extraída</p>
                </div>
                <MilkInventoryList parentId={patientId} readOnly />
            </div>

            {/* Notas profesionales */}
            <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-3">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#7A9482]" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">
                        Notas profesionales (visibles para la paciente)
                    </p>
                </div>

                {notes.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {notes.map((n) => (
                            <div key={n.id} className="bg-[#F5F2ED]/60 p-3 rounded-xl">
                                <p className="text-xs text-[#2D3436] font-medium whitespace-pre-wrap">{n.note}</p>
                                <p className="text-[9px] text-[#8B5E3C]/60 font-bold mt-1">
                                    {new Date(n.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#8B5E3C]/70 font-medium">Aún no has dejado notas para esta paciente.</p>
                )}

                <form onSubmit={handleEnviarNota} className="flex gap-2 pt-1">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Escribe una nota profesional..."
                        rows={2}
                        className="flex-1 bg-[#FFFDF9] border-2 border-[#F5F2ED] focus:border-[#7A9482] focus:outline-none p-3 rounded-xl text-xs font-medium text-[#2D3436] resize-none"
                    />
                    <button
                        type="submit"
                        disabled={sendingNote || !newNote.trim()}
                        className="bg-[#7A9482] text-white px-4 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
