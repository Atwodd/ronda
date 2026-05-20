-- Ronda Figma / La Mesa Redonda
-- Base de datos inicial para Supabase
-- Pegar este archivo completo en el SQL Editor de Supabase

-- Extensiones
create extension if not exists "pgcrypto";

-- ENUMS
create type public.user_role as enum ('admin', 'waiter');
create type public.table_status as enum ('libre', 'ocupada', 'reservada');
create type public.order_status as enum ('pendiente', 'en_preparacion', 'listo', 'servido');
create type public.payment_method as enum ('nequi', 'daviplata', 'efectivo', 'tarjeta');
create type public.payment_status as enum ('pendiente', 'aprobado', 'rechazado');

-- Perfiles de autenticación (admin y meseros)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nombre text not null,
  email text unique,
  rol public.user_role not null default 'waiter',
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Meseros (si prefieres mantener una tabla separada para gestión administrativa)
create table if not exists public.waiters (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  email text unique,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mesas
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  qr_code text not null unique,
  numero text not null unique,
  estado public.table_status not null default 'libre',
  activo boolean not null default true,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comensales por mesa (para grupos o sesiones múltiples)
create table if not exists public.table_comensales (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  nombre text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now()
);

-- Categorías del menú
create table if not exists public.categories (
  id text primary key,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Items del menú
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nombre text not null,
  descripcion text not null default '',
  precio numeric(12,2) not null default 0,
  categoria_id text not null references public.categories(id) on delete restrict,
  foto_url text not null default '',
  disponible boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Modificadores de menú
create table if not exists public.menu_modifiers (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  nombre_grupo text not null,
  obligatorio boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Opciones de modificadores
create table if not exists public.menu_modifier_options (
  id uuid primary key default gen_random_uuid(),
  modifier_id uuid not null references public.menu_modifiers(id) on delete cascade,
  texto text not null,
  precio_extra numeric(12,2) not null default 0,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Órdenes
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  waiter_id uuid references public.waiters(id) on delete set null,
  comensal text not null,
  tipo text not null default 'personal' check (tipo in ('personal', 'compartido')),
  estado public.order_status not null default 'pendiente',
  total numeric(12,2) not null default 0,
  fecha date not null default current_date,
  hora time not null default localtime,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ítems de la orden
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  nombre text not null,
  cantidad int not null default 1,
  precio numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Modificadores elegidos en la orden
create table if not exists public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  texto text not null,
  precio_extra numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Pagos
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  table_id uuid references public.tables(id) on delete set null,
  waiter_id uuid references public.waiters(id) on delete set null,
  comensal text not null,
  monto numeric(12,2) not null default 0,
  metodo public.payment_method not null,
  estado public.payment_status not null default 'pendiente',
  referencia text not null unique,
  comprobante_url text,
  fecha date not null default current_date,
  hora time not null default localtime,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sesiones por QR / acceso a mesa
create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  qr_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Trigger genérico para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers updated_at
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_waiters_updated_at
before update on public.waiters
for each row execute function public.set_updated_at();

create trigger trg_tables_updated_at
before update on public.tables
for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger trg_menu_items_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Índices útiles
create index if not exists idx_tables_estado on public.tables(estado);
create index if not exists idx_orders_table_id on public.orders(table_id);
create index if not exists idx_orders_waiter_id on public.orders(waiter_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_menu_items_categoria_id on public.menu_items(categoria_id);
create index if not exists idx_menu_items_disponible on public.menu_items(disponible);
create index if not exists idx_waiters_auth_user_id on public.waiters(auth_user_id);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.waiters enable row level security;
alter table public.tables enable row level security;
alter table public.table_comensales enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_modifiers enable row level security;
alter table public.menu_modifier_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.payments enable row level security;
alter table public.table_sessions enable row level security;

-- Políticas base: ajusta según tu app. Estas permiten lectura pública de catálogo y acceso autenticado a gestión.
create policy "Public read categories"
  on public.categories for select
  using (true);

create policy "Public read menu items"
  on public.menu_items for select
  using (true);

create policy "Public read tables"
  on public.tables for select
  using (true);

create policy "Authenticated manage profiles"
  on public.profiles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage waiters"
  on public.waiters for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage tables"
  on public.tables for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage table_comensales"
  on public.table_comensales for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage menu modifiers"
  on public.menu_modifiers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage menu modifier options"
  on public.menu_modifier_options for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage orders"
  on public.orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage order items"
  on public.order_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage order item modifiers"
  on public.order_item_modifiers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage payments"
  on public.payments for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage sessions"
  on public.table_sessions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Datos iniciales de categorías
insert into public.categories (id, nombre) values
  ('entradas', 'Entradas'),
  ('platos-fuertes', 'Platos Fuertes'),
  ('postres', 'Postres'),
  ('bebidas', 'Bebidas')
on conflict (id) do nothing;

-- Nota:
-- Para crear usuarios admin y meseros:
-- 1) Crea usuarios en Supabase Auth.
-- 2) Inserta sus perfiles en public.profiles con rol admin o waiter.
-- 3) Inserta meseros en public.waiters enlazando auth_user_id.
