import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Stethoscope, Users, ChevronRight, Baby } from 'lucide-react';
import { ConsultantPatientDetail } from './ConsultantPatientDetail';

interface ConsultantDashboardProps {
    userId: string;
}

interface PatientRow {
    linkId: string;
    patientId: string;
    displayName: string;
    childrenNames: string[];
    lastActivity: string | null;
}

export const ConsultantDashboard = ({ userId }: ConsultantDashboardProps) => {
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<PatientRow[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

    useEffect(() => {
        const cargarPacientes = async () => {
            setLoading(true);

            const { data: links, error: linksError } = await supabase
                .from('consultant_patients')
                .select('id, patient_id, linked_at')
                .eq('consultant_id', userId)
                .eq('status', 'active')
                .order('linked_at', { ascending: false });

            if (linksError || !links || links.length === 0) {
                setPatients([]);
                setLoading(false);
                return;
            }

            const patientIds = links.map((l) => l.patient_id);

            const [{ data: profilesData }, { data: childrenData }, { data: recentLogs }] = await Promise.all([
                supabase.from('profiles').select('id, display_name').in('id', patientIds),
                supabase.from('children').select('id, name, parent_id').in('parent_id', patientIds),
                supabase
                    .from('tracking_logs')
                    .select('parent_id, start_time')
                    .in('parent_id', patientIds)
                    .order('start_time', { ascending: false }),
            ]);

            const lastActivityByPatient = new Map<string, string>();
            (recentLogs || []).forEach((log) => {
                if (!lastActivityByPatient.has(log.parent_id)) {
                    lastActivityByPatient.set(log.parent_id, log.start_time);
                }
            });

            const rows: PatientRow[] = links.map((link) => {
                const profile = (profilesData || []).find((p) => p.id === link.patient_id);
                const kids = (childrenData || []).filter((c) => c.parent_id === link.patient_id);
                return {
                    linkId: link.id,
                    patientId: link.patient_id,
                    displayName: profile?.display_name || 'Paciente sin nombre',
                    childrenNames: kids.map((k) => k.name),
                    lastActivity: lastActivityByPatient.get(link.patient_id) || null,
                };
            });

            setPatients(rows);
            setLoading(false);
        };

        cargarPacientes();
    }, [userId]);

    if (selectedPatientId) {
        const patient = patients.find((p) => p.patientId === selectedPatientId);
        return (
            <ConsultantPatientDetail
                consultantId={userId}
                patientId={selectedPatientId}
                patientName={patient?.displayName || 'Paciente'}
                onBack={() => setSelectedPatientId(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#2D3436]">Panel de Asesora</h2>
                    <p className="text-[#8B5E3C] text-xs font-bold">Seguimiento de tus pacientes vinculadas</p>
                </div>
                <div className="w-12 h-12 bg-[#F5F2ED] rounded-2xl flex items-center justify-center text-[#7A9482]">
                    <Stethoscope size={24} />
                </div>
            </div>

            {loading ? (
                <p className="text-xs text-[#8B5E3C] font-medium italic text-center py-10">Cargando pacientes...</p>
            ) : patients.length === 0 ? (
                <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-8 rounded-[2rem] text-center space-y-2">
                    <Users className="mx-auto text-[#7A9482]/40" size={36} />
                    <p className="text-sm font-black text-[#2D3436]">Aún no tienes pacientes vinculadas</p>
                    <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
                        Comparte tu código de asesora con tus pacientes. Ellas deciden vincularse desde "Mi Asesora" en su
                        perfil — el acceso siempre lo autorizan ellas primero.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {patients.map((patient) => (
                        <button
                            key={patient.linkId}
                            onClick={() => setSelectedPatientId(patient.patientId)}
                            className="w-full bg-white border-2 border-[#F5F2ED] hover:border-[#7A9482] p-4 rounded-[1.5rem] flex items-center justify-between gap-3 text-left transition-all active:scale-98"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 bg-[#7A9482]/10 rounded-2xl flex items-center justify-center text-[#7A9482] shrink-0">
                                    <Baby size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-[#2D3436] text-sm truncate">{patient.displayName}</p>
                                    <p className="text-[11px] text-[#8B5E3C] font-medium truncate">
                                        {patient.childrenNames.length > 0
                                            ? patient.childrenNames.join(', ')
                                            : 'Sin bebé registrado aún'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="text-[#7A9482]/50 shrink-0" size={18} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
