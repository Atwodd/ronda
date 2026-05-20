import { getSupabase } from './supabaseClient';
import { Category, MenuItem, Order, Payment, Table } from '../data/mockData';

export interface SupabaseWaiterRow {
  id: string;
  nombre_usuario: string;
  usuario: string;
  contrasena?: string;
  pin?: string;
  activo: boolean;
  created_at?: string;
}

export interface AdminDashboardData {
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  waiters: SupabaseWaiterRow[];
  orders: Order[];
  payments: Payment[];
}

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

async function safeSelect<T>(
  promise: Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const result = await promise;

  if (result.error) {
    console.error('SUPABASE ERROR:', result.error);
    return [];
  }

  return (result.data ?? []) as T[];
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = assertSupabase();
  const [categories, menuItems, tables, waiters, orders, payments] = await Promise.all([
    safeSelect<Category>(supabase.from('categories').select('*').order('nombre', { ascending: true })),
    safeSelect<MenuItem>(supabase.from('menu_items').select('*').order('created_at', { ascending: false })),
    safeSelect<Table>(supabase.from('tables').select('*').order('numero', { ascending: true })),
    safeSelect<SupabaseWaiterRow>(supabase.from('waiters').select('*').order('created_at', { ascending: false })),
    safeSelect<Order>(supabase.from('orders').select('*').order('created_at', { ascending: false })),
    safeSelect<Payment>(supabase.from('payments').select('*').order('created_at', { ascending: false })),
  ]);

  return {
    categories,
    menuItems,
    tables,
    waiters,
    orders,
    payments,
  };
}

export async function createTableRow(
  numero: string,
  estado: Table['estado'] = 'libre'
) {
  const supabase = assertSupabase();

  const qr_code = `MESA-${String(numero).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('tables')
    .insert({
      numero: String(numero),
      qr_code,
      estado,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Table;
}

export async function deleteTableRow(qr_code: string) {
  const supabase = assertSupabase();
  const { error } = await supabase.from('tables').delete().eq('qr_code', qr_code);
  if (error) throw error;
}

export async function createMenuItemRow(payload: Partial<MenuItem>) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from('menu_items').insert({
    nombre: payload.nombre,
    descripcion: payload.descripcion ?? '',
    precio: payload.precio ?? 0,
    categoria_id: payload.categoria_id,
    foto_url: payload.foto_url ?? '',
    disponible: payload.disponible ?? true,
  }).select().single();
  if (error) throw error;
  return data as MenuItem;
}

export async function updateMenuItemRow(id: string, changes: Partial<MenuItem>) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from('menu_items').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as MenuItem;
}

export async function deleteMenuItemRow(id: string) {
  const supabase = assertSupabase();
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function createWaiterRow(payload: { nombre_usuario: string; usuario: string; contrasena: string; activo?: boolean; pin?: string }) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from('waiters').insert({
    nombre_usuario: payload.nombre_usuario,
    usuario: payload.usuario,
    contrasena: payload.contrasena,
    pin: payload.pin ?? null,
    activo: payload.activo ?? true,
  }).select().single();
  if (error) throw error;
  return data as SupabaseWaiterRow;
}

export async function updateWaiterRow(id: string, changes: Partial<SupabaseWaiterRow>) {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from('waiters').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as SupabaseWaiterRow;
}

export async function deleteWaiterRow(id: string) {
  const supabase = assertSupabase();
  const { error } = await supabase.from('meseros').delete().eq('id', id);
  if (error) throw error;
}

export async function updateOrderEstado(orderId: string, estado: Order['estado']) {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from('orders')
    .update({ estado })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

