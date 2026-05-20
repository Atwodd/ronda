import { useState, useEffect } from 'react';
import { 
  Utensils, 
  CreditCard, 
  Users,
  CheckCircle,
  Clock,
  ChefHat,
  DollarSign,
  Receipt,
  AlertCircle,
  XCircle,
  Image as ImageIcon,
  X,
  Eye,
  LogOut
} from 'lucide-react';
import { tables, mockOrders, mockPayments, formatCOP, Order, Payment, getInitials, getDinersByTable } from '../../models/data/mockData';
import { useWaiterAuth } from '../../models/context/WaiterAuthContext';
import { useNavigate } from 'react-router-dom';

type ViewType = 'tables' | 'orders' | 'payments';

export function WaiterDashboard() {
  const { currentWaiter, logout } = useWaiterAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentWaiter) navigate('/waiter/login');
  }, [currentWaiter, navigate]);
  const [activeView, setActiveView] = useState<ViewType>('tables');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const tablesArray = Object.values(tables);
  const occupiedTables = tablesArray.filter(t => t.estado !== 'libre');

  const handleMarkServed = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, estado: 'servido' as const } : o)
    );
  };

  const handleApprovePayment = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p => p.id === paymentId ? { ...p, estado: 'aprobado' as const } : p)
    );
    setSelectedPayment(null);
  };

  const handleRejectPayment = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p => p.id === paymentId ? { ...p, estado: 'rechazado' as const } : p)
    );
    setSelectedPayment(null);
  };

  const handleRegisterCashPayment = (tableNumber: string, comensal: string, monto: number) => {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      mesa_numero: tableNumber,
      comensal,
      monto,
      metodo: 'efectivo',
      estado: 'aprobado',
      referencia: `RONDA-${tableNumber}-${new Date().getHours()}${new Date().getMinutes()}-EF`,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().substring(0, 5),
    };
    setPayments(prev => [...prev, newPayment]);
  };

  const getTableOrders = (tableNumber: string) => {
    return orders.filter(o => o.mesa_numero === tableNumber);
  };

  const getTableTotal = (tableNumber: string) => {
    return getTableOrders(tableNumber).reduce((sum, o) => sum + o.total, 0);
  };

  const pendingOrders = orders.filter(o => o.estado === 'pendiente' || o.estado === 'en_preparacion');
  const readyOrders = orders.filter(o => o.estado === 'listo');
  const pendingPayments = payments.filter(p => p.estado === 'pendiente');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">Panel Camarero</h1>
              <p className="text-sm text-gray-600">La Mesa Redonda</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Mesero</span>
              </div>
              <button
                onClick={() => logout()}
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
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mesas Activas</p>
              <p className="text-2xl font-medium">{occupiedTables.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pedidos Pendientes</p>
              <p className="text-2xl font-medium">{pendingOrders.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pedidos Listos</p>
              <p className="text-2xl font-medium">{readyOrders.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagos Pendientes</p>
              <p className="text-2xl font-medium">{pendingPayments.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <nav className="flex">
            <ViewButton
              icon={<Users className="w-5 h-5" />}
              label="Mesas"
              active={activeView === 'tables'}
              onClick={() => setActiveView('tables')}
            />
            <ViewButton
              icon={<Utensils className="w-5 h-5" />}
              label="Comandas"
              active={activeView === 'orders'}
              onClick={() => setActiveView('orders')}
              badge={readyOrders.length}
            />
            <ViewButton
              icon={<CreditCard className="w-5 h-5" />}
              label="Cobros"
              active={activeView === 'payments'}
              onClick={() => setActiveView('payments')}
              badge={pendingPayments.length}
            />
          </nav>
        </div>

        {/* Content */}
        {activeView === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tablesArray.map((table) => {
              const tableOrders = getTableOrders(table.numero);
              const tableTotal = getTableTotal(table.numero);
              const hasReadyOrders = tableOrders.some(o => o.estado === 'listo');
              const diners = getDinersByTable(table.numero);
              const hasPendingPayments = diners.some(d => d.estado_pago === 'pendiente');

              return (
                <div 
                  key={table.qr_code} 
                  className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all hover:shadow-md ${
                    table.estado === 'libre' ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedTable(table.numero)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-medium">Mesa {table.numero}</h3>
                      <TableStatusBadge estado={table.estado} />
                    </div>
                    <div className="flex gap-2">
                      {hasReadyOrders && (
                        <div className="bg-green-100 p-2 rounded-full" title="Pedidos listos">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      {hasPendingPayments && (
                        <div className="bg-yellow-100 p-2 rounded-full" title="Pagos pendientes">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {table.comensales.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Comensales ({table.comensales.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {table.comensales.map((comensal, idx) => {
                          const diner = diners.find(d => d.nombre === comensal.nombre);
                          return (
                            <div key={idx} className="relative">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md"
                                style={{ backgroundColor: comensal.color }}
                              >
                                {getInitials(comensal.nombre)}
                              </div>
                              {diner?.estado_pago === 'pagado' && (
                                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {diner?.estado_pago === 'pendiente' && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                  <Clock className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {tableOrders.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {tableOrders.length} {tableOrders.length === 1 ? 'pedido' : 'pedidos'}
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCOP(tableTotal)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'orders' && (
          <div className="space-y-4">
            {/* Ready Orders First */}
            {readyOrders.length > 0 && (
              <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-medium text-green-900">Pedidos Listos para Servir</h2>
                </div>
                <div className="space-y-3">
                  {readyOrders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onMarkServed={handleMarkServed}
                      highlight={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Orders */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg">Todas las Comandas</h2>
              </div>
              <div className="divide-y">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No hay pedidos activos
                  </div>
                ) : (
                  orders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onMarkServed={handleMarkServed}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'payments' && (
          <div className="space-y-6">
            {/* Pending Payments Alert */}
            {pendingPayments.length > 0 && (
              <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-medium text-yellow-900">
                    Pagos Digitales Pendientes de Aprobación
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="bg-white rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Mesa {payment.mesa_numero}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{payment.comensal}</span>
                          </div>
                          <p className="text-sm text-gray-500">{payment.hora} • Ref: {payment.referencia}</p>
                        </div>
                        <span className="text-xl font-medium text-green-600">
                          {formatCOP(payment.monto)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 capitalize">Método: {payment.metodo}</span>
                        {payment.comprobante_url && (
                          <button
                            onClick={() => setViewingReceipt(payment.comprobante_url!)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver comprobante
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePayment(payment.id)}
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {occupiedTables.map((table) => {
                const diners = getDinersByTable(table.numero);
                const tableTotal = diners.reduce((sum, d) => sum + d.total, 0);
                const allPaid = diners.every(d => d.estado_pago === 'pagado');
                
                if (diners.length === 0) return null;

                return (
                  <div key={table.qr_code} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-medium">Mesa {table.numero}</h3>
                        <p className="text-sm text-gray-500">
                          {table.comensales.length} {table.comensales.length === 1 ? 'comensal' : 'comensales'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-gray-400" />
                        {allPaid && (
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown by Diner */}
                    <div className="space-y-3 mb-4">
                      {diners.map((diner, idx) => {
                        if (diner.total === 0) return null;

                        return (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-md"
                                  style={{ backgroundColor: diner.color }}
                                >
                                  {getInitials(diner.nombre)}
                                </div>
                                <div>
                                  <p className="font-medium">{diner.nombre}</p>
                                  <p className="text-sm text-gray-600">
                                    {diner.pedidos.length} {diner.pedidos.length === 1 ? 'pedido' : 'pedidos'}
                                  </p>
                                </div>
                              </div>
                              <PaymentStatusBadge estado={diner.estado_pago} />
                            </div>

                            {/* Order Details */}
                            <div className="mt-3 mb-3 space-y-1 bg-gray-50 rounded p-2">
                              {diner.pedidos.map((pedido, pidx) => (
                                <div key={pidx}>
                                  {pedido.items.map((item, iidx) => (
                                    <div key={iidx} className="flex justify-between text-xs text-gray-600">
                                      <span>{item.cantidad}x {item.nombre}</span>
                                      <span>{formatCOP(item.precio * item.cantidad)}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="font-medium">Total:</span>
                              <span className="font-medium text-green-600">
                                {formatCOP(diner.total)}
                              </span>
                            </div>

                            {diner.estado_pago === 'sin_pagar' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleRegisterCashPayment(table.numero, diner.nombre, diner.total)}
                                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Efectivo
                                </button>
                                <button
                                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Tarjeta
                                </button>
                              </div>
                            )}

                            {diner.estado_pago === 'pendiente' && (
                              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                                <p className="text-sm text-yellow-700">
                                  ⏳ Esperando aprobación de pago digital
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Total Mesa</span>
                        <span className="text-2xl font-medium text-green-600">
                          {formatCOP(tableTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTable(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">Mesa {selectedTable}</h2>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {getDinersByTable(selectedTable).map((diner, idx) => (
                <div key={idx} className="mb-6 pb-6 border-b last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: diner.color }}
                      >
                        {getInitials(diner.nombre)}
                      </div>
                      <div>
                        <p className="font-medium">{diner.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {diner.pedidos.length} {diner.pedidos.length === 1 ? 'pedido' : 'pedidos'}
                        </p>
                      </div>
                    </div>
                    <PaymentStatusBadge estado={diner.estado_pago} />
                  </div>
                  <div className="space-y-2 mb-3">
                    {diner.pedidos.map((order, oidx) => (
                      <div key={oidx}>
                        {order.items.map((item, iidx) => (
                          <div key={iidx} className="flex justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.cantidad}x</span> {item.nombre}
                              {item.modificadores.length > 0 && (
                                <span className="text-gray-500 text-xs ml-2">
                                  ({item.modificadores.join(', ')})
                                </span>
                              )}
                            </div>
                            <span className="text-gray-600">{formatCOP(item.precio * item.cantidad)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium text-green-600">{formatCOP(diner.total)}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Mesa</span>
                  <span className="font-medium text-green-600">
                    {formatCOP(getTableTotal(selectedTable))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

function ViewButton({ 
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
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors flex-1 justify-center relative ${
        active
          ? 'border-blue-500 text-blue-600'
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

function OrderCard({ 
  order, 
  onMarkServed, 
  highlight 
}: { 
  order: Order; 
  onMarkServed: (id: string) => void;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 ${highlight ? 'bg-white rounded-lg border-2 border-green-300' : 'hover:bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium">Mesa {order.mesa_numero}</p>
          <p className="text-sm text-gray-500 mt-1">{order.hora} • {order.fecha}</p>
        </div>
        <OrderStatusBadge estado={order.estado} />
      </div>
      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <div>
              <span className="font-medium">{item.cantidad}x</span> {item.nombre}
              {item.modificadores.length > 0 && (
                <span className="text-gray-500 text-xs ml-2">
                  ({item.modificadores.join(', ')})
                </span>
              )}
            </div>
            <span className="text-gray-600">{formatCOP(item.precio * item.cantidad)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium">Total: {formatCOP(order.total)}</span>
        {order.estado === 'listo' && (
          <button
            onClick={() => onMarkServed(order.id)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar Servido
          </button>
        )}
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

function PaymentStatusBadge({ estado }: { estado: 'sin_pagar' | 'pendiente' | 'pagado' }) {
  const styles = {
    sin_pagar: 'bg-gray-100 text-gray-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    pagado: 'bg-green-100 text-green-700',
  };

  const labels = {
    sin_pagar: 'Sin pagar',
    pendiente: 'Pendiente',
    pagado: 'Pagado',
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
    <span className={`inline-block px-3 py-1 rounded-full text-sm mt-1 ${styles[estado as keyof typeof styles]}`}>
      {labels[estado as keyof typeof labels]}
    </span>
  );
}
