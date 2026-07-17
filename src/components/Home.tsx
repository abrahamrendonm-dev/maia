import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sparkles, Calendar, ClipboardList, BookOpen, Heart, Share2, Users, NotebookPen, Plus, Baby, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { AddChildModal } from './AddChildModal';
import { MiAsesora } from './consultant/MiAsesora';
import { PlanDePartoModal } from './PlanDePartoModal';

interface HomeProps {
  userId: string;
  onOpenBitacora?: () => void;
}

export const Home = ({ userId, onOpenBitacora }: HomeProps) => {
  const [loading, setLoading] = useState(true);
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [weeks, setWeeks] = useState({ total: 0, days: 0 });
  const [userProfile, setUserProfile] = useState<{ role: string; family_token?: string; linked_mother_id?: string } | null>(null);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showMiAsesora, setShowMiAsesora] = useState(false);
  const [showPlanParto, setShowPlanParto] = useState(false);

  const fetchStatus = async () => {
    try {
      // 1. Obtener el perfil del usuario actual para conocer su rol y vinculaciones
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, family_token, linked_mother_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // 2. Determinar el ID objetivo (si es pareja/apoyo usa el de la mamá, de lo contrario el propio)
      const resolvedParentId = profile?.linked_mother_id || userId;
      setTargetParentId(resolvedParentId);

      // 3. Consultar la tabla de embarazos con el ID resuelto
      const { data: pregnancyData, error: pregnancyError } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('parent_id', resolvedParentId)
        .maybeSingle();

      if (pregnancyError) throw pregnancyError;

      if (pregnancyData) {
        setPregnancy(pregnancyData);
        calcularSemanas(pregnancyData.fur_date);
      }

      // 4. Consultar los bebés de la familia (puede haber más de uno)
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, name')
        .eq('parent_id', resolvedParentId)
        .order('birth_date', { ascending: false });

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);
    } catch (error: any) {
      console.error('Error al sincronizar datos del Home:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const calcularSemanas = (fur: string) => {
    const inicio = new Date(fur);
    const hoy = new Date();
    const dif = hoy.getTime() - inicio.getTime();
    const totalDias = Math.floor(dif / (1000 * 60 * 60 * 24));
    setWeeks({ total: Math.floor(totalDias / 7), days: totalDias % 7 });
  };

  const copiarCodigoFamiliar = () => {
    if (userProfile?.family_token) {
      navigator.clipboard.writeText(userProfile.family_token);
      toast.success('¡Código familiar copiado al portapapeles!');
    }
  };

  if (loading) return <div className="p-10 text-center text-[#7A9482] font-medium italic animate-pulse">Cargando tu mundo...</div>;

  // Tarjeta de "Mis bebés": lista a los hijos de la familia y permite a la mamá agregar más (gemelos, hermanos)
  const childrenSection = (
    <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#7A9482]/10 p-2 rounded-xl text-[#7A9482]">
            <Baby size={16} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Mis bebés</p>
        </div>
        {userProfile?.role === 'mother' && (
          <button
            onClick={() => setShowAddChild(true)}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#7A9482] bg-[#7A9482]/10 hover:bg-[#7A9482]/20 px-3 py-2 rounded-xl transition-colors active:scale-95"
          >
            <Plus size={14} /> Agregar
          </button>
        )}
      </div>
      {children.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <span key={child.id} className="text-xs font-bold text-[#2D3436] bg-[#F5F2ED] px-3 py-1.5 rounded-xl">
              {child.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#8B5E3C]/70 font-medium">Aún no hay bebés registrados.</p>
      )}
    </div>
  );

  const addChildModal = showAddChild && targetParentId && (
    <AddChildModal
      parentId={targetParentId}
      onClose={() => setShowAddChild(false)}
      onAdded={() => {
        setShowAddChild(false);
        fetchStatus();
      }}
    />
  );

  // Botón "Mi Asesora": solo la mamá decide vincularse/revocar a una asesora de lactancia
  const miAsesoraButton = userProfile?.role === 'mother' && targetParentId && (
    <button
      onClick={() => setShowMiAsesora(true)}
      className="w-full bg-white border-2 border-[#F5F2ED] p-3.5 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-[#7A9482] hover:bg-[#7A9482]/5 transition-all active:scale-95"
    >
      <Stethoscope size={16} /> Mi Asesora
    </button>
  );

  const miAsesoraModal = showMiAsesora && targetParentId && (
    <MiAsesora patientId={targetParentId} onClose={() => setShowMiAsesora(false)} />
  );

  if (pregnancy) {
    return (
      <>
      <div className="space-y-6 animate-in fade-in duration-700">

        {/* Tarjeta de Progreso Principal (Gradiente Verde MAIA) */}
        <div className="bg-gradient-to-br from-[#7A9482] to-[#8BA895] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {userProfile?.role === 'mother' ? 'Tu embarazo' : 'Embarazo en seguimiento'}
            </span>
            <h2 className="text-4xl font-black mt-1">Semana {weeks.total}</h2>
            <p className="text-sm font-medium opacity-90">{weeks.days} días de puro amor</p>
          </div>
          <Sparkles className="absolute right-[-10px] bottom-[-10px] text-white/20" size={120} />
        </div>

        {/* Tarjeta de Comparativa de Tamaño (Crema MAIA con Bordes Arena) */}
        <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl select-none">
            {getEmojiTamaño(weeks.total)}
          </div>
          <div>
            <h3 className="font-black text-[#2D3436] text-sm">Tamaño del bebé</h3>
            <p className="text-xs text-[#8B5E3C] font-medium">{getTextoTamaño(weeks.total)}</p>
          </div>
        </div>

        {/* Sección Informativa de Vinculación / Código Familiar */}
        {userProfile?.role === 'mother' && userProfile?.family_token && (
          <div className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#7A9482]/10 p-2 rounded-xl text-[#7A9482]">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-[#8B5E3C]">Red de Apoyo</p>
                <p className="text-xs font-bold text-[#2D3436]">Código: {userProfile.family_token}</p>
              </div>
            </div>
            <button 
              onClick={copiarCodigoFamiliar}
              className="bg-[#F5F2ED] hover:bg-[#7A9482]/10 p-2.5 rounded-xl text-[#8B5E3C] hover:text-[#7A9482] transition-colors group"
              title="Copiar código familiar"
            >
              <Share2 size={16} className="group-active:scale-90 transition-transform" />
            </button>
          </div>
        )}

        {userProfile?.role !== 'mother' && userProfile?.linked_mother_id && (
          <div className="bg-white border-2 border-[#F5F2ED] p-3 rounded-[1.5rem] text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8B5E3C]">
              Vinculado a MAIA con mamá ❤️
            </p>
          </div>
        )}

        {childrenSection}

        {miAsesoraButton}

        {/* Acceso directo a la Bitácora de registro diario */}
        {onOpenBitacora && (
          <button
            onClick={onOpenBitacora}
            className="w-full bg-[#7A9482] text-white p-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#7A9482]/90 active:scale-95 transition-all"
          >
            <NotebookPen size={18} /> Ir a mi Bitácora
          </button>
        )}

        {/* Cuadrícula de Acciones de la Aplicación */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPlanParto(true)}
            className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all active:scale-95 group"
          >
            <ClipboardList className="text-[#7A9482] group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D3436]">Plan de Parto</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all active:scale-95 group">
            <Calendar className="text-[#7A9482] group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D3436]">Citas Médicas</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all active:scale-95 group">
            <BookOpen className="text-[#7A9482] group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D3436]">Cursos</span>
          </button>
          <button className="bg-white border-2 border-[#F5F2ED] p-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-[#7A9482]/5 transition-all active:scale-95 group">
            <Heart className="text-[#7A9482] group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D3436]">Bienestar</span>
          </button>
        </div>

      </div>
      {addChildModal}
      {miAsesoraModal}
      {showPlanParto && targetParentId && (
        <PlanDePartoModal parentId={targetParentId} onClose={() => setShowPlanParto(false)} />
      )}
      </>
    );
  }

  // Estado fallback por defecto: Modo Lactancia Activo si no hay registro de embarazo
  return (
    <>
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[300px] animate-in fade-in">
      <div className="bg-[#FFFDF9] border-2 border-[#F5F2ED] p-8 rounded-[2.5rem] text-center max-w-xs shadow-sm">
        <div className="w-16 h-16 bg-[#7A9482]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#7A9482]">
          <Heart size={28} />
        </div>
        <h3 className="font-black text-[#2D3436] text-base mb-1">Modo Lactancia Activo</h3>
        <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">
          Tu espacio en MAIA está listo para el registro diario y seguimiento de alimentación.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {childrenSection}
        {miAsesoraButton}
      </div>

      {onOpenBitacora && (
        <button
          onClick={onOpenBitacora}
          className="w-full max-w-xs bg-[#7A9482] text-white p-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#7A9482]/90 active:scale-95 transition-all"
        >
          <NotebookPen size={18} /> Ir a mi Bitácora
        </button>
      )}

      <p className="text-center text-[#8B5E3C]/40 text-[9px] font-black uppercase tracking-[0.2em]">
        Protocolo MAIA Activo
      </p>
    </div>
    {addChildModal}
    {miAsesoraModal}
    </>
  );
};

// ============================================================================
// LÓGICA DE APOYO VISUAL ESTABLE (Conservada intacta)
// ============================================================================

const getEmojiTamaño = (sem: number) => {
  if (sem < 5) return '🌱'; 
  if (sem < 9) return '🍓'; 
  if (sem < 13) return '🍋'; 
  if (sem < 17) return '🍎'; 
  if (sem < 22) return '🥥'; 
  return '🍉';
};

const getTextoTamaño = (sem: number) => {
  if (sem < 5) return 'Tu bebé es una pequeña semilla de esperanza.'; 
  if (sem < 9) return 'Tiene el tamaño de una fresa.'; 
  if (sem < 13) return 'Es como un limón, ¡ya se mueve mucho!'; 
  if (sem < 17) return 'Del tamaño de una manzana.'; 
  if (sem < 22) return 'Es como un coco pequeño.'; 
  return '¡Ya es una sandía hermosa!';
};