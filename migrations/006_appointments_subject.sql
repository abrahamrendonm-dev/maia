-- Fase 1, punto 5 (ajuste): las citas médicas ahora cubren 3 contextos —
-- prenatal (mamá, antes del nacimiento), posparto de mamá, y bebé — en vez
-- de asumir siempre un bebé ya registrado. child_id deja de ser obligatorio
-- porque durante el embarazo todavía no existe fila en children.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 005_appointments.sql.

alter table public.appointments
  alter column child_id drop not null;

alter table public.appointments
  add column pregnancy_id uuid null references public.pregnancies(id) on delete set null;

alter table public.appointments
  add column subject text not null default 'bebe' check (subject in ('mama', 'bebe'));

-- Todas las citas creadas hasta ahora exigían child_id, así que ya cumplen
-- esta relación de forma natural con el default 'bebe' — no requieren backfill.
alter table public.appointments
  add constraint appointments_subject_child_check
  check (subject <> 'bebe' or child_id is not null);

create index if not exists idx_appointments_pregnancy_id on public.appointments (pregnancy_id);

-- Nota: las políticas RLS de 005_appointments.sql (appointments_family_*,
-- consultant_readonly_appointments) filtran únicamente por parent_id, nunca
-- por child_id, así que no necesitan ajuste con child_id ahora nullable.
