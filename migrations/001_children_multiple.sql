-- Fase 1, punto 1: permitir múltiples bebés (gemelos, más de un hijo) por mamá.
-- Correr manualmente en el SQL Editor de Supabase.

alter table public.children
  drop constraint children_parent_id_key;

create index if not exists idx_children_parent_id
  on public.children (parent_id);
