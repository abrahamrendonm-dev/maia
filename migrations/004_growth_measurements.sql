-- Fase 1, punto 3: registro de Peso y Talla (sin percentiles OMS todavía, eso es
-- Fase 2). No existía ninguna tabla para mediciones a través del tiempo — solo
-- birth_weight_grams/birth_length_cm en children, que son del nacimiento (una vez).
--
-- Correr manualmente en el SQL Editor de Supabase, después de 003_fix_milk_expiry.sql.

create table public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  weight_grams integer,
  height_cm numeric(5, 2),
  measured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  constraint growth_measurements_has_data check (weight_grams is not null or height_cm is not null)
);

create index if not exists idx_growth_measurements_child_id on public.growth_measurements (child_id);
create index if not exists idx_growth_measurements_parent_id on public.growth_measurements (parent_id);

alter table public.growth_measurements enable row level security;

-- Acceso familiar: la mamá sobre sus propios registros, o pareja/red de apoyo
-- vinculada vía linked_mother_id (mismo patrón inferido del comportamiento ya
-- probado de tracking_logs — tabla nueva, no había política previa que heredar).
create policy growth_measurements_family_select
  on public.growth_measurements for select
  using (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

create policy growth_measurements_family_insert
  on public.growth_measurements for insert
  with check (
    parent_id = auth.uid()
    or parent_id = (select linked_mother_id from public.profiles where id = auth.uid())
  );

-- Solo lectura para la asesora de lactancia vinculada (mismo patrón del punto 1.5).
create policy consultant_readonly_growth_measurements
  on public.growth_measurements for select
  using (public.is_active_consultant_of(parent_id));
