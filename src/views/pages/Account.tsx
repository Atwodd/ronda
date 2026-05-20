import { ArrowLeft, CreditCard } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useSession } from '../../models/context/SessionContext';
import { formatCOP } from '../../models/data/mockData';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../models/lib/supabaseClient';

export function Account() {
  const navigate = useNavigate();
  const { qrCode } = useParams<{ qrCode: string }>();
  const { currentUser, tableNumber, tableId, updateUserTotals } = useSession();

  const [loadingTotals, setLoadingTotals] = useState(false);

  useEffect(() => {
    if (!currentUser || !qrCode) {
      navigate(`/onboarding/${qrCode}`);
    }
  }, [currentUser, qrCode, navigate]);

  useEffect(() => {
    const loadTotals = async () => {
      if (
        !currentUser ||
        !qrCode ||
        !tableNumber ||
        !tableId ||
        tableId === 'null' ||
        tableId === 'undefined'
      ) {
        return;
      }

      const supabase = getSupabase();
      if (!supabase) return;

      setLoadingTotals(true);
      try {
        // Obtener todas las órdenes sin filtro y filtrar localmente para evitar errores de schema
        let ordersData: any = null;

        const { data, error } = await supabase
          .from('orders')
          .select('id,comensal_id,table_id');

        if (error) {
          console.warn('Order fetch error:', error);
          // Si falla, confiar en los totales actuales de la sesión
          return;
        }

        ordersData = data ?? [];

        // Filtrar por mesa y comensal localmente
        const orders = (ordersData ?? []).filter((o: any) => {
          return (
            o.table_id === tableId &&
            o.comensal_id === currentUser.id
          );
        });

        const orderIds = orders.map((o: any) => o.id);

        const { data: comensales } = await supabase
          .from('table_comensales')
          .select('id')
          .eq('table_id', tableId);

        const cantidadComensales = comensales?.length || 1;

        if (orderIds.length === 0) {
          updateUserTotals({ total_personal: 0, total_compartido: 0 });
          return;
        }

        // Intentar leer tipo desde order_items; si no existe la columna `tipo`, leer sin ella
        let itemsRes: any = await supabase
          .from('order_items')
          .select('cantidad, precio, tipo')
          .in('order_id', orderIds);

        if (itemsRes.error) {
          const msg = itemsRes.error.message ?? '';
          if (itemsRes.error.code === '42703' || msg.includes('Could not find') || msg.includes('column')) {
            const fallback = await supabase
              .from('order_items')
              .select('cantidad, precio')
              .in('order_id', orderIds);

            if (fallback.error) {
              console.error(fallback.error);
              return;
            }
            itemsRes = { data: (fallback.data ?? []).map((i: any) => ({ ...i, tipo: 'personal' })) };
          } else {
            console.error(itemsRes.error);
            return;
          }
        }

        const items = itemsRes.data ?? [];

        const personal = (items ?? [])
          .filter((i: any) => i.tipo === 'personal')
          .reduce((sum: number, i: any) => sum + (Number(i.precio) * Number(i.cantidad)), 0);

        const compartido = (items ?? [])
          .filter((i: any) => i.tipo === 'compartido')
          .reduce((sum: number, i: any) => sum + (Number(i.precio) * Number(i.cantidad)), 0);

        updateUserTotals({ total_personal: personal, total_compartido: compartido });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTotals(false);
      }
    };

    void loadTotals();
  }, [currentUser, qrCode, tableNumber, tableId]);

  if (!currentUser || !qrCode) {
    return null;
  }

  const totalAPagar =
    currentUser.total_personal +
    currentUser.total_compartido +
    currentUser.total_propina;
  const pendiente = totalAPagar - currentUser.total_abonado;

  const getEstadoPagoColor = () => {
    switch (currentUser.estado_pago) {
      case 'pagado':
        return 'bg-green-100 text-green-700';
      case 'abonado':
        return 'bg-blue-100 text-blue-700';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEstadoPagoText = () => {
    switch (currentUser.estado_pago) {
      case 'pagado':
        return 'Pagado';
      case 'abonado':
        return 'Abonado';
      case 'en_proceso':
        return 'En proceso';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(`/menu/${qrCode}`)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl">Tu Cuenta</h1>
          </div>
          <div className="text-sm text-gray-600 ml-12">
            Mesa {tableNumber} • {currentUser.nombre}
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-4 space-y-4">
        {/* Estado */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">Estado del Pago</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getEstadoPagoColor()}`}>
              {getEstadoPagoText()}
            </span>
          </div>
        </div>

        {/* Desglose */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg mb-4">Desglose</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Consumo personal</span>
              <span>{formatCOP(currentUser.total_personal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Consumo compartido</span>
              <span>{formatCOP(currentUser.total_compartido)}</span>
            </div>
            {currentUser.total_propina > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Propina</span>
                <span>{formatCOP(currentUser.total_propina)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCOP(totalAPagar)}</span>
              </div>
            </div>
            {currentUser.total_abonado > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Abonado</span>
                <span>-{formatCOP(currentUser.total_abonado)}</span>
              </div>
            )}
            <div className="border-t-2 border-orange-500 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg">Pendiente</span>
                <span className="text-2xl text-orange-600">
                  {formatCOP(Math.max(0, pendiente))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        {pendiente > 0 && (
          <button
            onClick={() => navigate(`/payment/${qrCode}`)}
            className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Pagar Cuenta</span>
          </button>
        )}

        {pendiente <= 0 && currentUser.estado_pago === 'pagado' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-green-700 mb-2">¡Gracias por tu visita!</div>
            <div className="text-sm text-green-600">Tu cuenta está completamente pagada</div>
          </div>
        )}
      </div>
    </div>
  );
}
