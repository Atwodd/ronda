import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  CreditCard,
  Settings,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ChefHat,
  Eye,
  X,
  LogOut,
  Copy
} from 'lucide-react';
import { formatCOP, Order, Payment, MenuItem, Table, Category } from '../../models/data/mockData';
import { useAdminAuth } from '../../models/context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import {
  SupabaseWaiterRow,
  createMenuItemRow,
  createTableRow,
  createWaiterRow,
  deleteMenuItemRow,
  deleteTableRow,
  deleteWaiterRow,
  fetchAdminDashboardData,
  updateMenuItemRow,
  updateOrderEstado,
  updateWaiterRow,
} from '../../models/lib/adminSupabase';
import { getSupabase } from '../../models/lib/supabaseClient';


type TabType = 'overview' | 'orders' | 'payments' | 'menu' | 'tables' | 'waiters';

export function AdminDashboard() {
  const { currentAdmin, ready, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [menuItemsState, setMenuItemsState] = useState<MenuItem[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [tablesState, setTablesState] = useState<Table[]>([]);
  const [waitersState, setWaitersState] = useState<SupabaseWaiterRow[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [newWaiterNombre, setNewWaiterNombre] = useState('');
  const [newWaiterUsuario, setNewWaiterUsuario] = useState('');
  const [newWaiterContrasena, setNewWaiterContrasena] = useState('');
  const [newWaiterActivo, setNewWaiterActivo] = useState(true);
  const [editingWaiterId, setEditingWaiterId] = useState<string | null>(null);
  const supabase = getSupabase();
  // Menu CRUD state (must stay before any conditional return)
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !currentAdmin) {
      navigate('/admin/login');
    }
  }, [ready, currentAdmin, navigate]);

  const reloadData = async () => {
    const data = await fetchAdminDashboardData();
    setCategoriesState(data.categories);
    setMenuItemsState(data.menuItems);
    setTablesState(data.tables);
    setWaitersState(data.waiters);
    setOrders(data.orders);
    setPayments(data.payments);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await reloadData();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!newItemCategory && categoriesState.length > 0) {
      setNewItemCategory(categoriesState[0].id);
    }
  }, [categoriesState, newItemCategory]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const totalTables = tablesState.length;
  const occupiedTables = tablesState.filter(t => t.estado !== 'libre').length;
  const pendingPayments = payments.filter(p => p.estado === 'pendiente').length;
  const activeOrders = orders.filter(o => o.estado !== 'servido').length;

  const totalSales = payments
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + p.monto, 0);

  const getTableNumber = (tableId?: string) => {
    if (!tableId) return 'N/A';
    return tablesState.find((table) => table.id === tableId)?.numero ?? 'N/A';
  };




  const handleToggleItemAvailability = async (itemId: string) => {
    const item = menuItemsState.find(current => current.id === itemId);
    if (!item) return;
    await updateMenuItemRow(itemId, { disponible: !item.disponible });
    await reloadData();
  };

  const handleApprovePayment = async (
    paymentId: string,
    orderId?: string | null
  ) => {

    // aprobar payment
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        estado: 'aprobado'
      })
      .eq('id', paymentId);

    if (paymentError) {
      console.error(paymentError);
      return;
    }

    // solo actualizar orden si existe
    if (orderId) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          estado_pago: 'pagado'
        })
        .eq('id', orderId);

      if (orderError) {
        console.error(orderError);
      }
    }

    await reloadData();
  };


  const handleRejectPayment = async (
    paymentId: string
  ) => {

    const { error } = await supabase
      .from('payments')
      .update({
        estado: 'rechazado'
      })
      .eq('id', paymentId);

    if (error) {
      console.error(error);
      return;
    }

    await reloadData();
  };

  const handleCreateTable = async () => {
    if (!newTableNumber) return;
    await createTableRow(newTableNumber);
    setNewTableNumber('');
    await reloadData();
  };

  const handleRemoveTable = async (qrCode: string) => {
    await deleteTableRow(qrCode);
    await reloadData();
  };

  const handleCreateMenuItem = async () => {
    if (!newItemName || !newItemCategory) return;

    let imageUrl = '';

    if (newItemImage) {

      const fileName = `${Date.now()}-${newItemImage.name}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, newItemImage);

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    await createMenuItemRow({
      nombre: newItemName,
      descripcion: newItemDesc,
      precio: Number(newItemPrice) || 0,
      categoria_id: newItemCategory,
      disponible: true,
      foto_url: 'imageUrl',
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    await reloadData();
  };

  const handleStartEditItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.nombre);
    setNewItemDesc(item.descripcion);
    setNewItemPrice(item.precio);
    setNewItemCategory(item.categoria_id);
  };

  const handleSaveEditItem = async () => {
    if (!editingItemId) return;
    await updateMenuItemRow(editingItemId, {
      nombre: newItemName,
      descripcion: newItemDesc,
      precio: Number(newItemPrice) || 0,
      categoria_id: newItemCategory,
    });
    setEditingItemId(null);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    await reloadData();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteMenuItemRow(id);
    await reloadData();
  };

  const handleCreateWaiter = async () => {
    if (!newWaiterNombre || !newWaiterUsuario || !newWaiterContrasena) return;
    await createWaiterRow({
      nombre_usuario: newWaiterNombre,
      usuario: newWaiterUsuario,
      contrasena: newWaiterContrasena,
      activo: newWaiterActivo,
    });
    setNewWaiterNombre('');
    setNewWaiterUsuario('');
    setNewWaiterContrasena('');
    setNewWaiterActivo(true);
    await reloadData();
  };

  const handleStartEditWaiter = (id: string) => {
    const waiter = waitersState.find(current => current.id === id);
    if (!waiter) return;
    setEditingWaiterId(id);
    setNewWaiterNombre(waiter.nombre_usuario);
    setNewWaiterUsuario(waiter.usuario);
    setNewWaiterContrasena('');
    setNewWaiterActivo(waiter.activo);
  };

  const handleSaveEditWaiter = async () => {
    if (!editingWaiterId) return;
    await updateWaiterRow(editingWaiterId, {
      nombre_usuario: newWaiterNombre,
      usuario: newWaiterUsuario,
      activo: newWaiterActivo,
      ...(newWaiterContrasena ? { contrasena: newWaiterContrasena } : {}),
    });
    setEditingWaiterId(null);
    setNewWaiterNombre('');
    setNewWaiterUsuario('');
    setNewWaiterContrasena('');
    setNewWaiterActivo(true);
    await reloadData();
  };

  const handleDeleteWaiter = async (id: string) => {
    await deleteWaiterRow(id);
    await reloadData();
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando panel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">Panel Administrador</h1>
              <p className="text-sm text-gray-600">La Mesa Redonda</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
                <ChefHat className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </div>
              <button
                onClick={() => void logout()}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <nav className="flex overflow-x-auto">
            <TabButton
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Resumen"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              icon={<Utensils className="w-5 h-5" />}
              label="Pedidos"
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              badge={activeOrders}
            />
            <TabButton
              icon={<CreditCard className="w-5 h-5" />}
              label="Pagos"
              active={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              badge={pendingPayments}
            />
            <TabButton
              icon={<ChefHat className="w-5 h-5" />}
              label="Menú"
              active={activeTab === 'menu'}
              onClick={() => setActiveTab('menu')}
            />
            <TabButton
              icon={<Users className="w-5 h-5" />}
              label="Mesas"
              active={activeTab === 'tables'}
              onClick={() => setActiveTab('tables')}
            />
            <TabButton
              icon={<Users className="w-5 h-5" />}
              label="Meseros"
              active={activeTab === 'waiters'}
              onClick={() => setActiveTab('waiters')}
            />
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-8 h-8 text-blue-600" />}
                label="Mesas Ocupadas"
                value={`${occupiedTables}/${totalTables}`}
                bgColor="bg-blue-50"
              />
              <StatCard
                icon={<Utensils className="w-8 h-8 text-orange-600" />}
                label="Pedidos Activos"
                value={activeOrders.toString()}
                bgColor="bg-orange-50"
              />
              <StatCard
                icon={<CreditCard className="w-8 h-8 text-purple-600" />}
                label="Pagos Pendientes"
                value={pendingPayments.toString()}
                bgColor="bg-purple-50"
              />
              <StatCard
                icon={<DollarSign className="w-8 h-8 text-green-600" />}
                label="Ventas Hoy"
                value={formatCOP(totalSales)}
                bgColor="bg-green-50"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg mb-4">Actividad Reciente</h2>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        Mesa {getTableNumber(order.table_id)} · {order.comensal || 'Cliente'}
                      </p>

                      <p className="text-sm text-gray-600">
                        {(order.items ?? []).length} items • {formatCOP(order.total)}
                      </p>
                    </div>

                    <OrderStatusBadge estado={order.estado} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg">Gestión de Pedidos</h2>
            </div>
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Mesa {getTableNumber(order.table_id)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{order.comensal || 'Cliente'}</span>
                      </div>
                      <p className="text-sm text-gray-500">{order.hora} • {order.fecha}</p>
                    </div>
                    <OrderStatusBadge estado={order.estado} />
                  </div>
                  <div className="space-y-2">
                    {(order.items ?? []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.cantidad}x</span> {item.nombre}

                          {(item.modificadores ?? []).length > 0 && (
                            <span className="text-gray-500 text-xs ml-2">
                              ({(item.modificadores ?? []).join(', ')})
                            </span>
                          )}
                        </div>

                        <span className="text-gray-600">
                          {formatCOP(item.precio * item.cantidad)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-medium">Total: {formatCOP(order.total)}</span>
                    <div className="flex gap-2">
                      {order.estado === 'pendiente' && (
                        <button
                          onClick={async () => {
                            await updateOrderEstado(order.id, 'en_preparacion');
                            await reloadData();
                          }}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                        >
                          Iniciar Preparación

                        </button>
                      )}
                      {order.estado === 'en_preparacion' && (
                        <button
                          onClick={async () => {
                            await updateOrderEstado(order.id, 'listo');
                            await reloadData();
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Marcar Listo
                        </button>
                      )}
                      {order.estado === 'listo' && (
                        <button
                          onClick={async () => {
                            await updateOrderEstado(order.id, 'servido');
                            await reloadData();
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          Marcar Servido
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg">Gestión de Pagos</h2>
            </div>
            <div className="divide-y">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Mesa {getTableNumber(payment.table_id)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{payment.comensal}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {payment.hora} • {payment.fecha}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ref: {payment.referencia}
                      </p>
                    </div>
                    <PaymentStatusBadge estado={payment.estado} />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Método de pago</p>
                      <p className="font-medium capitalize">{payment.metodo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Monto</p>
                      <p className="text-xl font-medium text-green-600">{formatCOP(payment.monto)}</p>
                    </div>
                  </div>

                  {payment.comprobante_url && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Comprobante</p>
                      <button
                        onClick={() => setViewingReceipt(payment.comprobante_url!)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Ver comprobante de pago
                      </button>
                    </div>
                  )}

                  {payment.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovePayment(payment.id, payment.order_id)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectPayment(payment.id)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium mb-3">Crear / Editar Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Nombre" className="px-3 py-2 border rounded-lg w-full" />
                <input value={newItemPrice as any} onChange={(e) => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Precio" className="px-3 py-2 border rounded-lg w-full" />
                <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
                  {categoriesState.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <input value={(newItemDesc)} onChange={(e) => setNewItemDesc(e.target.value)} placeholder="Descripción" className="px-3 py-2 border rounded-lg w-full" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewItemImage(file);
                    }
                  }}
                  className="px-3 py-2 border rounded-lg w-full"
                />
              </div>
              <div className="mt-3 flex gap-2">
                {!editingItemId ? (
                  <button onClick={handleCreateMenuItem} className="px-4 py-2 bg-green-600 text-white rounded-lg">Crear</button>
                ) : (
                  <>
                    <button onClick={handleSaveEditItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
                    <button onClick={() => { setEditingItemId(null); setNewItemName(''); setNewItemDesc(''); setNewItemPrice(''); }} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
                  </>
                )}
              </div>
            </div>

            {categoriesState.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-lg">{category.nombre}</h2>
                </div>
                <div className="divide-y">
                  {menuItemsState
                    .filter(item => item.categoria_id === category.id)
                    .map((item) => (
                      <div key={item.id} className="p-6 hover:bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {item.foto_url && (
                            <div className="w-28 h-28 overflow-hidden rounded-xl flex-shrink-0">
                              <img
                                src={item.foto_url}
                                alt={item.nombre}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{item.nombre}</h3>
                            <p className="text-sm text-gray-600">{item.descripcion}</p>
                            <div className="text-sm text-gray-500">{formatCOP(item.precio)}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleStartEditItem(item)} className="px-3 py-1 bg-yellow-500 text-white rounded-lg">Editar</button>
                          <button onClick={() => handleToggleItemAvailability(item.id)} className={`px-3 py-1 rounded-lg ${item.disponible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{item.disponible ? 'Disponible' : 'No disponible'}</button>
                          <button onClick={() => handleDeleteItem(item.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg">Eliminar</button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tables' && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <input
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Número de mesa"
                className="px-3 py-2 border rounded-lg w-48"
              />
              <button
                onClick={handleCreateTable}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Crear Mesa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tablesState.map((table) => (
                <div key={table.qr_code} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-medium">Mesa {table.numero}</h3>
                    </div>
                    <TableStatusBadge estado={table.estado} />
                  </div>

                  <div className="mb-4 flex flex-col items-start gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/table/${table.qr_code}`)}`}
                      alt={`QR mesa ${table.numero}`}
                      className="w-36 h-36 object-contain"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/table/${table.qr_code}`);
                        alert('Enlace copiado al portapapeles');
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors w-full justify-center"
                      title="Copiar enlace de la mesa"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="font-medium">Copiar Link de Mesa</span>
                    </button>
                  </div>

                  {table.comensales && table.comensales.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Comensales ({table.comensales.length})
                      </p>
                      <div className="space-y-2">
                        {table.comensales.map((comensal, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ backgroundColor: comensal.color }}
                            >
                              {comensal.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <span className="text-sm">{comensal.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {table.estado !== 'libre' && (
                      <button
                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Cerrar Mesa
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveTable(table.qr_code)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'waiters' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg mb-4">Gestión de Meseros</h2>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={newWaiterNombre}
                onChange={(e) => setNewWaiterNombre(e.target.value)}
                placeholder="Nombre completo"
                className="px-3 py-2 border rounded-lg w-full md:col-span-1"
              />
              <input
                value={newWaiterUsuario}
                onChange={(e) => setNewWaiterUsuario(e.target.value)}
                placeholder="Usuario"
                className="px-3 py-2 border rounded-lg w-full md:col-span-1"
              />
              <input
                value={newWaiterContrasena}
                onChange={(e) => setNewWaiterContrasena(e.target.value)}
                placeholder="Contraseña"
                type="password"
                className="px-3 py-2 border rounded-lg w-full md:col-span-1"
              />
            </div>

            <label className="inline-flex items-center gap-2 mb-4 text-sm text-gray-600">
              <input type="checkbox" checked={newWaiterActivo} onChange={(e) => setNewWaiterActivo(e.target.checked)} />
              Activo
            </label>

            <div className="flex gap-2 mb-6">
              {!editingWaiterId ? (
                <button onClick={handleCreateWaiter} className="px-4 py-2 bg-green-600 text-white rounded-lg">Crear Mesero</button>
              ) : (
                <>
                  <button onClick={handleSaveEditWaiter} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
                  <button onClick={() => { setEditingWaiterId(null); setNewWaiterNombre(''); setNewWaiterUsuario(''); setNewWaiterContrasena(''); setNewWaiterActivo(true); }} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
                </>
              )}
            </div>

            <div className="divide-y">
              {waitersState.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{w.nombre_usuario}</p>
                    <p className="text-sm text-gray-500">Usuario: {w.usuario} • {w.activo ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStartEditWaiter(w.id)} className="px-3 py-1 bg-yellow-500 text-white rounded-lg">Editar</button>
                    <button onClick={() => handleDeleteWaiter(w.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">Comprobante de Pago</h3>
              <button
                onClick={() => setViewingReceipt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={viewingReceipt}
                alt="Comprobante"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
  badge
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors relative ${active
        ? 'border-orange-500 text-orange-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgColor
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-medium mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ estado }: { estado: Order['estado'] }) {
  const styles = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    en_preparacion: 'bg-orange-100 text-orange-700',
    listo: 'bg-blue-100 text-blue-700',
    servido: 'bg-green-100 text-green-700',
  };

  const labels = {
    pendiente: 'Pendiente',
    en_preparacion: 'En preparación',
    listo: 'Listo',
    servido: 'Servido',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[estado]}`}>
      {labels[estado]}
    </span>
  );
}

function PaymentStatusBadge({ estado }: { estado: Payment['estado'] }) {
  const styles = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
  };

  const labels = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[estado]}`}>
      {labels[estado]}
    </span>
  );
}

function TableStatusBadge({ estado }: { estado: string }) {
  const styles = {
    libre: 'bg-green-100 text-green-700',
    ocupada: 'bg-blue-100 text-blue-700',
    pidiendo: 'bg-orange-100 text-orange-700',
    pagando: 'bg-purple-100 text-purple-700',
  };

  const labels = {
    libre: 'Libre',
    ocupada: 'Ocupada',
    pidiendo: 'Pidiendo',
    pagando: 'Pagando',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[estado as keyof typeof styles]}`}>
      {labels[estado as keyof typeof labels]}
    </span>
  );
}