import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useCart } from '../../models/context/CartContext';
import { useSession } from '../../models/context/SessionContext';
import { formatCOP } from '../../models/data/mockData';
import { toast } from 'sonner';
import { getSupabase } from '../../models/lib/supabaseClient';

interface CartDrawerProps {
  onClose: () => void;
}

export function CartDrawer({ onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { qrCode } = useParams<{ qrCode: string }>();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { currentUser, tableNumber, tableId, updateUserTotals } = useSession();

  const handleConfirm = async () => {
    if (!items.length) return;

    const supabase = getSupabase();
    if (!supabase || !qrCode) return;

    try {
      // calcular total
      const total = items.reduce((sum, item) => {
        const modsTotal =
          item.modificadores?.reduce(
            (acc: number, m: any) => acc + (m.precio_extra || 0),
            0
          ) || 0;

        return sum + (item.precio + modsTotal) * item.cantidad;
      }, 0);

      let currentTableId = tableId;
      if (!currentTableId && qrCode) {
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('id')
          .eq('qr_code', qrCode)
          .single();

        if (tableError || !tableData) {
          console.error('TABLE LOOKUP ERROR:', tableError);
          toast.error('No se pudo determinar la mesa del pedido');
          return;
        }
        currentTableId = tableData.id;
      }

      if (!currentTableId) {
        toast.error('No se encontró el ID de la mesa');
        return;
      }

      // CREAR UNA SOLA ORDEN: intentar insertar el payload completo; si el servidor
      // responde que faltan columnas, eliminar esas claves y reintentar.
      let orderPayload = {
        table_id: currentTableId,
        comensal_id: currentUser?.id ?? null,
        estado: 'pendiente',
        total,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError || !order) {
        console.error('ORDER ERROR FULL:', orderError);
        toast.error(orderError?.message || 'Error creando la orden');
        return;
      }

      //CREAR TODOS LOS ITEMS DE LA ORDEN
      // Insertar sólo columnas válidas en `order_items` según el schema actual
      const orderItems = items.map((item) => {
        const base: any = {
          order_id: order.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          tipo: item.tipo,
        };
        if ((item as any).menu_item_id) base.menu_item_id = (item as any).menu_item_id;
        return base;
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        console.error('ITEMS ERROR:', itemsError);
        toast.error('Error guardando los items');
        return;
      }

      // Actualizar totales en la sesión para mostrar el gasto inmediato.
      const personalAmount = items.reduce((sum, item) => {
        const modsTotal =
          item.modificadores?.reduce(
            (acc: number, m: any) => acc + (m.precio_extra || 0),
            0
          ) || 0;
        return sum + (item.tipo === 'personal' ? (item.precio + modsTotal) * item.cantidad : 0);
      }, 0);
      const compartidoAmount = items.reduce((sum, item) => {
        const modsTotal =
          item.modificadores?.reduce(
            (acc: number, m: any) => acc + (m.precio_extra || 0),
            0
          ) || 0;
        return sum + (item.tipo === 'compartido' ? (item.precio + modsTotal) * item.cantidad : 0);
      }, 0);

      if (currentUser) {
        updateUserTotals({
          total_personal: currentUser.total_personal + personalAmount,
          total_compartido: currentUser.total_compartido + compartidoAmount,
        });
      }

      // limpiar carrito
      clearCart();
      onClose();

      toast.success('Pedido enviado correctamente');

      // opcional: redirigir o no
      navigate(`/table/${qrCode}`);

    } catch (err) {
      console.error('UNEXPECTED ERROR:', err);
      toast.error('Error inesperado');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl">Tu Pedido</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* ITEMS */}
        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500">
              Tu carrito está vacío
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-lg">

                <div className="flex justify-between">
                  <div>
                    <h3>{item.nombre}</h3>
                    <p className="text-xs text-gray-500">{item.tipo}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500"
                  >
                    <Trash2 />
                  </button>
                </div>

                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.cantidad - 1)
                      }
                    >
                      <Minus />
                    </button>

                    <span>{item.cantidad}</span>

                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.cantidad + 1)
                      }
                    >
                      <Plus />
                    </button>
                  </div>

                  <span className="text-orange-600">
                    {formatCOP(item.precio * item.cantidad)}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {items.length > 0 && (
          <div className="p-4 border-t">
            <button
              onClick={handleConfirm}
              className="w-full bg-orange-500 text-white py-3 rounded-lg"
            >
              Confirmar Pedido
            </button>
          </div>
        )}

      </div>
    </div>
  );
}