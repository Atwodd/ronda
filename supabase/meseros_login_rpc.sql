-- RPC para login de meseros usando la tabla existente `meseros`
-- Pegar en el SQL Editor de Supabase después de tener la tabla `meseros` creada

create extension if not exists pgcrypto;

create or replace function public.login_mesero(p_usuario text, p_contrasena text)
returns table (
  id uuid,
  nombre_usuario varchar,
  usuario varchar,
  activo boolean,
  created_at timestamp
)
language plpgsql
security definer
as $$
begin
  return query
  select
    m.id,
    m.nombre_usuario,
    m.usuario,
    m.activo,
    m.created_at
  from public.meseros m
  where m.usuario = p_usuario
    and m.activo = true
    and (
      m.contrasena = crypt(p_contrasena, m.contrasena)
      or m.contrasena = p_contrasena
    )
  limit 1;
end;
$$;

revoke all on function public.login_mesero(text, text) from public;
grant execute on function public.login_mesero(text, text) to anon, authenticated;
