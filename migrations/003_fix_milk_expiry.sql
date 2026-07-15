-- Fase 1, punto 2 (fix): milk_inventory tenía un trigger (tr_set_milk_expiry ->
-- set_milk_expiry()) que intentaba escribir en NEW.expiry_date, pero esa columna
-- nunca existió en la tabla -> "record "new" has no field "expiry_date"" en cada
-- INSERT. Además la función original solo distinguía 'refrigerador' de "cualquier
-- otro valor" (6 meses), lo que le daba 6 meses de caducidad incluso a
-- "consumo inmediato". Corrige ambas cosas.
--
-- Correr manualmente en el SQL Editor de Supabase, después de 002_consultant_panel.sql.

alter table public.milk_inventory
  add column if not exists expiry_date timestamptz;

-- Mismo nombre/firma que ya usa el trigger tr_set_milk_expiry (BEFORE INSERT),
-- así que no hace falta tocar el trigger — create or replace basta.
create or replace function public.set_milk_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.storage_location = 'refrigerador' then
    NEW.expiry_date := NEW.extraction_date + interval '4 days';
  elsif NEW.storage_location = 'congelador' then
    NEW.expiry_date := NEW.extraction_date + interval '6 months';
  elsif NEW.storage_location is null then
    -- "Consumo inmediato": LogExtraccionModal.tsx guarda NULL para este caso
    -- (milk_inventory_storage_location_check solo permite 'refrigerador' o
    -- 'congelador' como strings no nulos).
    NEW.expiry_date := NEW.extraction_date + interval '4 hours';
  else
    -- Valor no reconocido: nunca asumimos el caso más largo (6 meses). Usamos el
    -- más corto para no mostrar leche insegura como "todavía buena".
    NEW.expiry_date := NEW.extraction_date + interval '4 hours';
  end if;
  return NEW;
end;
$$;
