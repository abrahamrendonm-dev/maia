create table public.active_timers (
  child_id uuid not null,
  parent_id uuid null,
  start_time timestamp with time zone null default now(),
  side text null,
  created_at timestamp with time zone null default now(),
  constraint active_timers_pkey primary key (child_id),
  constraint active_timers_child_id_fkey foreign KEY (child_id) references children (id) on delete CASCADE,
  constraint active_timers_parent_id_fkey foreign KEY (parent_id) references profiles (id),
  constraint active_timers_side_check check (
    (
      side = any (
        array['izquierdo'::text, 'derecho'::text, 'ambos'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.appointments (
  id uuid not null default gen_random_uuid (),
  child_id uuid null,
  parent_id uuid not null,
  appointment_date timestamp with time zone not null,
  type text not null,
  doctor text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  pregnancy_id uuid null,
  subject text not null default 'bebe',
  constraint appointments_pkey primary key (id),
  constraint appointments_child_id_fkey foreign KEY (child_id) references children (id) on delete CASCADE,
  constraint appointments_parent_id_fkey foreign KEY (parent_id) references profiles (id) on delete CASCADE,
  constraint appointments_pregnancy_id_fkey foreign KEY (pregnancy_id) references pregnancies (id) on delete set null,
  constraint appointments_subject_check check ((subject = any (array['mama'::text, 'bebe'::text]))),
  constraint appointments_subject_child_check check ((subject <> 'bebe'::text or child_id is not null))
) TABLESPACE pg_default;

create index if not exists idx_appointments_child_id on public.appointments (child_id) TABLESPACE pg_default;
create index if not exists idx_appointments_parent_id on public.appointments (parent_id) TABLESPACE pg_default;
create index if not exists idx_appointments_date on public.appointments (appointment_date) TABLESPACE pg_default;
create index if not exists idx_appointments_pregnancy_id on public.appointments (pregnancy_id) TABLESPACE pg_default;

create table public.birth_plans (
  id uuid not null default extensions.uuid_generate_v4 (),
  parent_id uuid null,
  preferences jsonb null default '{}'::jsonb,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint birth_plans_pkey primary key (id),
  constraint birth_plans_parent_id_fkey foreign KEY (parent_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.children (
  id uuid not null default gen_random_uuid (),
  parent_id uuid not null,
  name text not null,
  birth_date date not null,
  is_premature boolean null default false,
  gestational_weeks integer null,
  gender text null,
  birth_weight_grams integer null,
  birth_length_cm numeric(4, 2) null,
  constraint children_pkey primary key (id),
  constraint children_parent_id_fkey foreign KEY (parent_id) references profiles (id) on delete CASCADE,
  constraint children_gender_check check (
    (
      gender = any (array['niño'::text, 'niña'::text, 'otro'::text])
    )
  ),
  constraint children_gestational_weeks_check check (
    (
      (gestational_weeks >= 20)
      and (gestational_weeks <= 42)
    )
  )
) TABLESPACE pg_default;

create index if not exists idx_children_parent_id on public.children (parent_id) TABLESPACE pg_default;


create table public.forum_categories (
  id serial not null,
  name text not null,
  slug text not null,
  constraint forum_categories_pkey primary key (id),
  constraint forum_categories_slug_key unique (slug)
) TABLESPACE pg_default;

create table public.forum_posts (
  id uuid not null default gen_random_uuid (),
  author_id uuid not null,
  category_id integer null,
  title text not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint forum_posts_pkey primary key (id),
  constraint forum_posts_author_id_fkey foreign KEY (author_id) references profiles (id),
  constraint forum_posts_category_id_fkey foreign KEY (category_id) references forum_categories (id)
) TABLESPACE pg_default;

create table public.growth_measurements (
  id uuid not null default gen_random_uuid (),
  child_id uuid not null,
  parent_id uuid not null,
  weight_grams integer null,
  height_cm numeric(5, 2) null,
  measured_at timestamp with time zone not null default now(),
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint growth_measurements_pkey primary key (id),
  constraint growth_measurements_child_id_fkey foreign KEY (child_id) references children (id) on delete CASCADE,
  constraint growth_measurements_parent_id_fkey foreign KEY (parent_id) references profiles (id) on delete CASCADE,
  constraint growth_measurements_has_data check (
    (
      weight_grams is not null
      or height_cm is not null
    )
  )
) TABLESPACE pg_default;

create index if not exists idx_growth_measurements_child_id on public.growth_measurements (child_id) TABLESPACE pg_default;
create index if not exists idx_growth_measurements_parent_id on public.growth_measurements (parent_id) TABLESPACE pg_default;

create table public.milk_inventory (
  id uuid not null default gen_random_uuid (),
  parent_id uuid not null,
  extraction_date timestamp with time zone null default now(),
  amount_ml integer not null,
  storage_location text null,
  is_consumed boolean null default false,
  consumed_at timestamp with time zone null,
  expiry_date timestamp with time zone null,
  constraint milk_inventory_pkey primary key (id),
  constraint milk_inventory_parent_id_fkey foreign KEY (parent_id) references profiles (id),
  constraint milk_inventory_storage_location_check check (
    (
      storage_location = any (array['refrigerador'::text, 'congelador'::text])
    )
  )
) TABLESPACE pg_default;

create trigger tr_set_milk_expiry BEFORE INSERT on milk_inventory for EACH row
execute FUNCTION set_milk_expiry ();

create table public.perfiles (
  id uuid not null,
  nombre text null,
  rol text null,
  edad_bebe_semanas integer null,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint perfiles_pkey primary key (id),
  constraint perfiles_id_fkey foreign KEY (id) references auth.users (id),
  constraint perfiles_rol_check check ((rol = any (array['mama'::text, 'papa'::text])))
) TABLESPACE pg_default;

create table public.pregnancies (
  id uuid not null default extensions.uuid_generate_v4 (),
  parent_id uuid null,
  fur_date date not null,
  ultrasound_date date null,
  pregnancy_number integer null default 1,
  has_complications boolean null default false,
  complications_notes text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint pregnancies_pkey primary key (id),
  constraint unique_active_pregnancy unique (parent_id),
  constraint pregnancies_parent_id_fkey foreign KEY (parent_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  updated_at timestamp with time zone null,
  username text null,
  display_name text null,
  avatar_url text null,
  bio text null,
  is_expert boolean null default false,
  onboarding_completed boolean null default false,
  rol text null,
  role text null,
  family_token text null,
  linked_mother_id uuid null,
  consultant_code text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_family_token_key unique (family_token),
  constraint profiles_username_key unique (username),
  constraint profiles_consultant_code_key unique (consultant_code),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_linked_mother_id_fkey foreign KEY (linked_mother_id) references auth.users (id),
  constraint profiles_role_check check (
    (
      role = any (
        array['mother'::text, 'partner'::text, 'support'::text, 'consultant'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger tr_generate_consultant_code BEFORE INSERT
or
UPDATE on profiles for EACH row
execute FUNCTION generate_consultant_code ();

create table public.consultant_patients (
  id uuid not null default gen_random_uuid (),
  consultant_id uuid not null,
  patient_id uuid not null,
  status text not null default 'active'::text,
  linked_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone null,
  constraint consultant_patients_pkey primary key (id),
  constraint consultant_patients_consultant_id_patient_id_key unique (consultant_id, patient_id),
  constraint consultant_patients_consultant_id_fkey foreign KEY (consultant_id) references profiles (id) on delete CASCADE,
  constraint consultant_patients_patient_id_fkey foreign KEY (patient_id) references profiles (id) on delete CASCADE,
  constraint consultant_patients_status_check check (
    (status = any (array['active'::text, 'revoked'::text]))
  )
) TABLESPACE pg_default;

create table public.consultant_notes (
  id uuid not null default gen_random_uuid (),
  consultant_id uuid not null,
  patient_id uuid not null,
  note text not null,
  created_at timestamp with time zone not null default now(),
  constraint consultant_notes_pkey primary key (id),
  constraint consultant_notes_consultant_id_fkey foreign KEY (consultant_id) references profiles (id) on delete CASCADE,
  constraint consultant_notes_patient_id_fkey foreign KEY (patient_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.registros_lactancia (
  id uuid not null default extensions.uuid_generate_v4 (),
  usuario_id uuid null,
  lado text null,
  duracion_minutos integer null,
  fecha timestamp with time zone null default timezone ('utc'::text, now()),
  notas text null,
  constraint registros_lactancia_pkey primary key (id),
  constraint registros_lactancia_usuario_id_fkey foreign KEY (usuario_id) references auth.users (id),
  constraint registros_lactancia_lado_check check (
    (
      lado = any (
        array['izquierdo'::text, 'derecho'::text, 'ambos'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.tracking_logs (
  id uuid not null default gen_random_uuid (),
  parent_id uuid not null,
  child_name text not null,
  type text null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone null,
  notes text null,
  metadata jsonb null,
  child_id uuid null,
  constraint tracking_logs_pkey primary key (id),
  constraint tracking_logs_child_id_fkey foreign KEY (child_id) references children (id) on delete CASCADE,
  constraint tracking_logs_parent_id_fkey foreign KEY (parent_id) references profiles (id),
  constraint tracking_logs_type_check check (
    (
      type = any (
        array[
          'lactancia'::text,
          'sueno'::text,
          'panal'::text,
          'otros'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create view public.v_children_age as
select
  id,
  parent_id,
  name,
  birth_date,
  is_premature,
  gestational_weeks,
  floor(
    EXTRACT(
      day
      from
        now() - birth_date::timestamp with time zone
    ) / 7::numeric
  ) as age_weeks_chronological,
  case
    when is_premature = true
    and gestational_weeks < 40 then floor(
      EXTRACT(
        day
        from
          now() - birth_date::timestamp with time zone
      ) / 7::numeric
    ) - (40 - gestational_weeks)::numeric
    else floor(
      EXTRACT(
        day
        from
          now() - birth_date::timestamp with time zone
      ) / 7::numeric
    )
  end as age_weeks_corrected
from
  children; 

  