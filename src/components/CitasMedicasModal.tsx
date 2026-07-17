import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Calendar, X, Check, Plus, Pencil, Trash2, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface CitasMedicasModalProps {
    parentId: string;
    subject: 'mama' | 'bebe';
    pregnancyId: string | null;
    kids: { id: string; name: string }[];
    title: string;
    quickTypes: string[];
    onClose: () => void;
    onChanged: () => void;
}

interface Appointment {
    id: string;
    child_id: string | null;
    appointment_date: string;
    type: string;
    doctor: string | null;
    notes: string | null;
}

const emptyForm = {
    childId: '',
    fecha: '',
    hora: '',
    tipo: '',
    doctor: '',
    notas: '',
};

export const CitasMedicasModal = ({
    parentId,
    subject,
    pregnancyId,
    kids,
    title,
    quickTypes,
    onClose,
    onChanged,
}: CitasMedicasModalProps) => {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const esBebe = subject === 'bebe';

    const cargar = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('appointments')
            .select('id, child_id, appointment_date, type, doctor, notes')
            .eq('parent_id', parentId)
            .eq('subject', subject)
            .order('appointment_date', { ascending: true });
        setAppointments(data || []);
        setLoading(false);
    };

    useEffect(() => {
        cargar();
    }, [parentId, subject]);

    const abrirNuevaCita = () => {
        setEditingId(null);
        setForm({ ...emptyForm, childId: esBebe ? kids[0]?.id || '' : '' });
        setShowForm(true);
    };

    const abrirEdicion = (appt: Appointment) => {
        const d = new Date(appt.appointment_date);
        const pad = (n: number) => String(n).padStart(2, '0');
        setEditingId(appt.id);
        setForm({
            childId: appt.child_id || '',
            fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
            tipo: appt.type,
            doctor: appt.doctor || '',
            notas: appt.notes || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((esBebe && !form.childId) || !form.fecha || !form.hora || !form.tipo.trim()) return;

        setSaving(true);
        const appointment_date = new Date(`${form.fecha}T${form.hora}`).toISOString();
        const payload = {
            child_id: esBebe ? form.childId : null,
            parent_id: parentId,
            subject,
            pregnancy_id: pregnancyId,
            appointment_date,
            type: form.tipo.trim(),
            doctor: form.doctor.trim() || null,
            notes: form.notas.trim() || null,
        };

        const { error } = editingId
            ? await supabase.from('appointments').update(payload).eq('id', editingId)
            : await supabase.from('appointments').insert([payload]);

        setSaving(false);

        if (error) {
            toast.error('No pudimos guardar la cita', { description: error.message });
        } else {
            toast.success(editingId ? 'Cita actualizada' : '¡Cita agregada!');
            setShowForm(false);
            cargar();
            onChanged();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta cita?')) return;

        const { error } = await supabase.from('appointments').delete().eq('id', id);

        if (error) {
            toast.error('No pudimos eliminar la cita', { description: error.message });
        } else {
            toast.success('Cita eliminada');
            cargar();
            onChanged();
        }
    };

    const now = new Date();
    const proximas = appointments.filter((a) => new Date(a.appointment_date) >= now);
    const anteriores = appointments
        .filter((a) => new Date(a.appointment_date) < now)
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

    const nombreBebe = (childId: string | null) => kids.find((c) => c.id === childId)?.name || 'Bebé';

    const renderCita = (appt: Appointment) => (
        <div key={appt.id} className="bg-[#F5F2ED]/50 p-3 rounded-xl flex items-center justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs font-black text-[#2D3436]">
                    {appt.type}
                    {esBebe && ` · ${nombreBebe(appt.child_id)}`}
                </p>
                <p className="text-[10px] text-[#8B5E3C]/80 font-medium">
                    {new Date(appt.appointment_date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    {appt.doctor && ` · ${appt.doctor}`}
                </p>
                {appt.notes && <p className="text-[10px] text-[#8B5E3C]/60 font-medium mt-0.5">{appt.notes}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
                <button
                    onClick={() => abrirEdicion(appt)}
                    className="w-8 h-8 bg-white border-2 border-[#F5F2ED] rounded-lg flex items-center justify-center text-[#7A9482] hover:bg-[#7A9482] hover:text-white active:scale-90 transition-all"
                >
                    <Pencil size={13} />
                </button>
                <button
                    onClick={() => handleDelete(appt.id)}
                    className="w-8 h-8 bg-white border-2 border-[#F5F2ED] rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-white active:scale-90 transition-all"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFDF9] rounded-[2rem] p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-[#2D3436] flex items-center gap-2">
                        <Stethoscope size={20} className="text-[#7A9482]" /> {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                {showForm ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {esBebe && kids.length > 1 && (
                            <div>
                                <label className="text-xs font-bold text-[#8B5E3C] ml-1">Bebé</label>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    {kids.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, childId: c.id }))}
                                            className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all active:scale-95 ${
                                                form.childId === c.id
                                                    ? 'bg-[#7A9482] text-white border-[#7A9482]'
                                                    : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-[#8B5E3C] ml-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full mt-1 p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                    value={form.fecha}
                                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#8B5E3C] ml-1">Hora</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full mt-1 p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                    value={form.hora}
                                    onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-[#8B5E3C] ml-1">Tipo de cita</label>
                            <div className="flex gap-1.5 flex-wrap mt-1 mb-2">
                                {quickTypes.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, tipo: t === 'Otro' ? '' : t }))}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all active:scale-95 ${
                                            form.tipo === t
                                                ? 'bg-[#7A9482] text-white border-[#7A9482]'
                                                : 'bg-white text-[#2D3436] border-[#F5F2ED]'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder={esBebe ? 'Ej: Vacuna pentavalente' : 'Ej: Ultrasonido morfológico'}
                                required
                                className="w-full p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                                value={form.tipo}
                                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Doctor(a) (opcional)"
                            className="w-full p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm"
                            value={form.doctor}
                            onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
                        />

                        <textarea
                            placeholder="Notas (opcional)"
                            rows={2}
                            className="w-full p-3.5 rounded-xl border-2 border-[#F5F2ED] outline-none focus:border-[#7A9482] text-sm resize-none"
                            value={form.notas}
                            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                        />

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-[#F5F2ED] text-[#8B5E3C] px-4 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving || (esBebe && !form.childId) || !form.fecha || !form.hora || !form.tipo.trim()}
                                className="flex-1 bg-[#7A9482] text-white py-3.5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar cita'}
                                <Check size={16} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        <button
                            onClick={abrirNuevaCita}
                            disabled={esBebe && kids.length === 0}
                            className="w-full bg-[#7A9482] text-white py-3.5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={18} /> Nueva cita
                        </button>
                        {esBebe && kids.length === 0 && (
                            <p className="text-[10px] text-[#8B5E3C]/70 font-medium text-center -mt-3">
                                Necesitas registrar al menos un bebé antes de agregar citas.
                            </p>
                        )}

                        {loading ? (
                            <p className="text-xs text-[#8B5E3C] font-medium italic text-center py-4">Cargando citas...</p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-[#7A9482]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5E3C]">Próximas</span>
                                    </div>
                                    {proximas.length > 0 ? (
                                        <div className="space-y-2">{proximas.map(renderCita)}</div>
                                    ) : (
                                        <p className="text-xs text-[#8B5E3C]/70 font-medium">No hay citas próximas.</p>
                                    )}
                                </div>

                                {anteriores.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5E3C]">Anteriores</span>
                                        <div className="space-y-2">{anteriores.map(renderCita)}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
