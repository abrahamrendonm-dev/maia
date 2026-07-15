update public.profiles set role = 'consultant'
  where id = (select id from auth.users where email = 'correo_de_tu_esposa@ejemplo.com');