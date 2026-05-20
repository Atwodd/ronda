// Utility function to format Colombian Pesos
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Utility function to get initials from a name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Categories
export interface Category {
  id: string;
  nombre: string;
}

export const categories: Category[] = [
  { id: 'entradas', nombre: 'Entradas' },
  { id: 'platos-fuertes', nombre: 'Platos Fuertes' },
  { id: 'postres', nombre: 'Postres' },
  { id: 'bebidas', nombre: 'Bebidas' },
];

// Menu Items
export interface MenuModifier {
  id: string;
  nombre_grupo: string;
  obligatorio: boolean;
  opciones: {
    texto: string;
    precio_extra: number;
  }[];
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string;
  foto_url: string;
  disponible: boolean;
  modificadores: MenuModifier[];
  tiempo_prep_min?: number;
}

export const menuItems: MenuItem[] = [
  {
    id: 'item-1',
    nombre: 'Empanadas',
    descripcion: 'Empanadas tradicionales con ají',
    precio: 15000,
    categoria_id: 'entradas',
    foto_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    disponible: true,
    modificadores: [],
  },
  {
    id: 'item-2',
    nombre: 'Patacones',
    descripcion: 'Plátano verde frito con hogao',
    precio: 18000,
    categoria_id: 'entradas',
    foto_url: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400',
    disponible: true,
    modificadores: [],
  },
  {
    id: 'item-3',
    nombre: 'Bandeja Paisa',
    descripcion: 'Plato típico con frijoles, arroz, chicharrón, huevo, aguacate',
    precio: 35000,
    categoria_id: 'platos-fuertes',
    foto_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    disponible: true,
    modificadores: [
      {
        id: 'mod-1',
        nombre_grupo: 'Proteína adicional',
        obligatorio: false,
        opciones: [
          { texto: 'Sin adicional', precio_extra: 0 },
          { texto: 'Chorizo', precio_extra: 5000 },
          { texto: 'Morcilla', precio_extra: 5000 },
        ],
      },
    ],
  },
  {
    id: 'item-4',
    nombre: 'Ajiaco',
    descripcion: 'Sopa tradicional bogotana con pollo y papas',
    precio: 28000,
    categoria_id: 'platos-fuertes',
    foto_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    disponible: true,
    modificadores: [],
  },
  {
    id: 'item-5',
    nombre: 'Tres Leches',
    descripcion: 'Pastel de tres leches tradicional',
    precio: 12000,
    categoria_id: 'postres',
    foto_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    disponible: true,
    modificadores: [],
  },
  {
    id: 'item-6',
    nombre: 'Jugo Natural',
    descripcion: 'Jugo de frutas frescas',
    precio: 8000,
    categoria_id: 'bebidas',
    foto_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    disponible: true,
    modificadores: [
      {
        id: 'mod-2',
        nombre_grupo: 'Sabor',
        obligatorio: true,
        opciones: [
          { texto: 'Mora', precio_extra: 0 },
          { texto: 'Lulo', precio_extra: 0 },
          { texto: 'Maracuyá', precio_extra: 0 },
          { texto: 'Mango', precio_extra: 0 },
        ],
      },
    ],
  },
];

// Menu CRUD utilities
export function generateMenuItemId(nombre: string) {
  return `MI-${nombre.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

export function createMenuItem(data: Partial<MenuItem>) {
  const id = data.id ?? generateMenuItemId(data.nombre ?? 'ITEM');
  const item: MenuItem = {
    id,
    nombre: data.nombre ?? 'Nuevo Item',
    descripcion: data.descripcion ?? '',
    precio: data.precio ?? 0,
    categoria_id: data.categoria_id ?? categories[0]?.id ?? 'entradas',
    foto_url: data.foto_url ?? '',
    disponible: data.disponible ?? true,
    modificadores: data.modificadores ?? [],
  };
  menuItems.push(item);
  return item;
}

export function updateMenuItem(id: string, changes: Partial<MenuItem>) {
  const idx = menuItems.findIndex(m => m.id === id);
  if (idx === -1) return null;
  menuItems[idx] = { ...menuItems[idx], ...changes };
  return menuItems[idx];
}

export function deleteMenuItem(id: string) {
  const idx = menuItems.findIndex(m => m.id === id);
  if (idx === -1) return false;
  menuItems.splice(idx, 1);
  return true;
}

// Tables
export interface Table {
  id?: string;
  qr_code: string;
  numero: string;
  estado: 'libre' | 'ocupada' | 'reservada';
  comensales: {
    nombre: string;
    color: string;
  }[];
}

// Iniciar sin mesas de ejemplo. El administrador creará mesas en tiempo de ejecución.
export const tables: Record<string, Table> = {};

// Utilidades para gestionar mesas en memoria (temporal, migrar a BD real posteriormente)
export function generateTableId(numero: string): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MESA-${numero}-${suffix}`;
}

export function createTable(numero: string, estado: Table['estado'] = 'libre') {
  const id = generateTableId(numero);
  const table: Table = {
    qr_code: id,
    numero: String(numero),
    estado,
    comensales: [],
  };
  tables[id] = table;
  return table;
}

export function deleteTable(qrCode: string) {
  if (tables[qrCode]) {
    delete tables[qrCode];
    return true;
  }
  return false;
}

// Orders
export interface Order {
  id: string;
  table_id?: string;
  mesa_numero?: string;
  comensal?: string;
  comensal_id?: string;
  items: {
    nombre: string;
    cantidad: number;
    precio: number;
    modificadores: string[];
  }[];
  total: number;
  estado: 'pendiente' | 'en_preparacion' | 'listo' | 'servido';
  fecha: string;
  hora: string;
  tipo: 'personal' | 'compartido';
}

// Sin órdenes de ejemplo; la aplicación creará órdenes reales en tiempo de ejecución.
export const mockOrders: Order[] = [];

// Payments
export interface Payment {
  id: string;
  table_id?: string;
  mesa_numero?: string;
  comensal: string;
  monto: number;
  metodo: 'nequi' | 'daviplata' | 'efectivo' | 'tarjeta';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  referencia: string;
  fecha: string;
  hora: string;
  comprobante_url?: string;
}

// Sin pagos de ejemplo; los pagos se registrarán en tiempo de ejecución.
export const mockPayments: Payment[] = [];

// Meseros, mesas y menú ahora se gestionan desde Supabase.
export interface Waiter {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export interface DinerAccount {
  nombre: string;
  color: string;
  pedidos: Order[];
  total: number;
  estado_pago: 'sin_pagar' | 'pendiente' | 'pagado';
  pago_id?: string;
}

export function getDinersByTable(tableNumber: string): DinerAccount[] {
  const table = Object.values(tables).find(t => t.numero === tableNumber);
  if (!table) return [];

  return table.comensales.map(comensal => {
    const dinerOrders = mockOrders.filter(o =>
      o.mesa_numero === tableNumber && o.comensal === comensal.nombre
    );
    const total = dinerOrders.reduce((sum, o) => sum + o.total, 0);
    const payment = mockPayments.find(p =>
      p.mesa_numero === tableNumber && p.comensal === comensal.nombre
    );

    let estado_pago: 'sin_pagar' | 'pendiente' | 'pagado' = 'sin_pagar';
    if (payment) {
      if (payment.estado === 'aprobado') estado_pago = 'pagado';
      else if (payment.estado === 'pendiente') estado_pago = 'pendiente';
    }

    return {
      nombre: comensal.nombre,
      color: comensal.color,
      pedidos: dinerOrders,
      total,
      estado_pago,
      pago_id: payment?.id,
    };
  });
}

// Restaurant configuration
export const restaurant = {
  nombre: 'La Mesa Redonda',
  metodos_pago: {
    nequi: {
      activo: true,
      numero: '3001234567',
    },
    daviplata: {
      activo: true,
      numero: '3109876543',
    },
    efectivo: {
      activo: true,
    },
    tarjeta: {
      activo: true,
    },
  },
};

// Generate payment reference code
export function generateReferenceCode(tableNumber: string, nombre: string): string {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const initials = getInitials(nombre);
  return `RONDA-${tableNumber}-${hours}${minutes}-${initials}`;
}
