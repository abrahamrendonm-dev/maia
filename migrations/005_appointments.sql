-- Fase 1, punto 5: Citas Médicas — tabla nueva + CRUD básico. Campos: fecha/hora,
-- tipo de cita, doctor, notas. Sin campo de "completada" (solo importa la fecha,
-- ver decisión con el usuario). Recordatorios: solo un aviso visual en Home para
-- citas próximas (sin notificaciones push, eso es Fase 2).
--
-- Correr manualmente en el SQL Editor de Supabase, después de 004_growth_measurements.sql.

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  appointment_date timestamptz not null,
  type text not null,
  doctor text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_child_id on public.appointments (child_id);
create index if not exists idx_appointments_parent_id on public.appointments (parent_id);
create index if not exists idx_appointments_date on public.appointments (appointment_date);

alter table public.appointments enable row level security;

-- Acceso familiar (mismo patrón inferido usado en growth_measurements): la mamá
-- sobre sus propios registros, o pareja/red de apoyo vinculada. A diferencia de
-- extracciones/crecimiento, una cita sí necesita poder editarse o cancelarse.
create policy appointments_family_select
  on public.appointments for select
  using (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

create policy appointments_family_insert
  on public.appointments for insert
  with check (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

create policy appointments_family_update
  on public.appointments for update
  using (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  )
  with check (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

create policy appointments_family_delete
  on public.appointments for delete
  using (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

-- Solo lectura para la asesora de lactancia vinculada (mismo patrón del punto 1.5).
create policy consultant_readonly_appointments
  on public.appointments for select
  using (public.is_active_consultant_of(parent_id));
