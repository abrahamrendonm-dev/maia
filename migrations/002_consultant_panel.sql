-- Fase 1, punto 1.5: Panel de Asesora de Lactancia (B2B2C).
-- Correr manualmente en el SQL Editor de Supabase, después de 001_children_multiple.sql.
--
-- Nota de diseño: el ROADMAP.md original sugiere que consultant_id/patient_id
-- referencien auth.users(id). Aquí referencian public.profiles(id) en su lugar,
-- por consistencia con el resto del esquema (children, pregnancies, tracking_logs,
-- birth_plans ya lo hacen así) y porque permite los joins automáticos de
-- PostgREST/Supabase (profiles!consultant_patients_patient_id_fkey) que usa el frontend.

-- ============================================================================
-- 1. Nuevo rol 'consultant' + código único de asesora
-- ============================================================================
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['mother', 'partner', 'support', 'consultant']));

alter table public.profiles add column if not exists consultant_code text unique;

-- Genera el código automáticamente al asignar el rol (evita condiciones de carrera
-- si se generara desde el frontend). Ej: ASESORA-4F2A
create or replace function public.generate_consultant_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  if new.role = 'consultant' and new.consultant_code is null then
    loop
      candidate := 'ASESORA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
      exit when not exists (select 1 from public.profiles where consultant_code = candidate);
    end loop;
    new.consultant_code := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_generate_consultant_code on public.profiles;
create trigger tr_generate_consultant_code
  before insert or update on public.profiles
  for each row
  execute function public.generate_consultant_code();

-- ============================================================================
-- 2. Vínculo paciente-asesora (la paciente inicia el vínculo, nunca la asesora)
-- ============================================================================
create table public.consultant_patients (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (consultant_id, patient_id)
);

alter table public.consultant_patients enable row level security;

-- ============================================================================
-- 3. Notas profesionales (visibles para la asesora Y la paciente)
-- ============================================================================
create table public.consultant_notes (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.consultant_notes enable row level security;

-- ============================================================================
-- 4. Función helper para las políticas de solo lectura
-- ============================================================================
create or replace function public.is_active_consultant_of(target_patient_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.consultant_patients
    where consultant_id = auth.uid()
      and patient_id = target_patient_id
      and status = 'active'
  );
$$;

revoke all on function public.is_active_consultant_of(uuid) from public;
grant execute on function public.is_active_consultant_of(uuid) to authenticated;

-- ============================================================================
-- 5. Políticas RLS — consultant_patients
-- ============================================================================
-- Solo la paciente (y solo si su rol es 'mother') puede crear el vínculo:
-- el consentimiento SIEMPRE lo inicia ella, nunca la asesora.
create policy consultant_patients_patient_insert
  on public.consultant_patients
  for insert
  with check (
    patient_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'mother')
  );

-- Ambas partes del vínculo pueden verlo (paciente para saber a quién dio
-- acceso, asesora para listar a sus pacientes).
create policy consultant_patients_select
  on public.consultant_patients
  for select
  using (patient_id = auth.uid() or consultant_id = auth.uid());

-- Solo la paciente puede modificar su propio vínculo (revocar acceso).
-- La asesora no tiene UPDATE: no puede reactivarse a sí misma tras ser revocada.
create policy consultant_patients_patient_revoke
  on public.consultant_patients
  for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- ============================================================================
-- 6. Políticas RLS — consultant_notes
-- ============================================================================
create policy consultant_notes_select
  on public.consultant_notes
  for select
  using (patient_id = auth.uid() or consultant_id = auth.uid());

-- Solo la asesora escribe notas, y solo mientras el vínculo siga activo.
create policy consultant_notes_consultant_insert
  on public.consultant_notes
  for insert
  with check (
    consultant_id = auth.uid()
    and public.is_active_consultant_of(patient_id)
  );

create policy consultant_notes_consultant_update
  on public.consultant_notes
  for update
  using (consultant_id = auth.uid())
  with check (consultant_id = auth.uid());

-- ============================================================================
-- 7. Políticas RLS adicionales de solo lectura para la asesora
--    (se suman a las políticas existentes, no las reemplazan — en Postgres
--    las políticas permisivas del mismo comando se combinan con OR)
-- ============================================================================
create policy consultant_readonly_children
  on public.children for select
  using (public.is_active_consultant_of(parent_id));

create policy consultant_readonly_pregnancies
  on public.pregnancies for select
  using (public.is_active_consultant_of(parent_id));

create policy consultant_readonly_tracking_logs
  on public.tracking_logs for select
  using (public.is_active_consultant_of(parent_id));

create policy consultant_readonly_milk_inventory
  on public.milk_inventory for select
  using (public.is_active_consultant_of(parent_id));

create policy consultant_readonly_birth_plans
  on public.birth_plans for select
  using (public.is_active_consultant_of(parent_id));

-- Necesaria para que la asesora pueda leer el nombre de su paciente en su panel
-- (no está en la lista original del ROADMAP, pero sin ella no hay forma de
-- mostrar "display_name" en ConsultantDashboard).
create policy consultant_readonly_profiles
  on public.profiles for select
  using (public.is_active_consultant_of(id));
