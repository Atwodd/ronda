import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ShoppingCart, User, Receipt } from 'lucide-react';
import { useSession } from '../../models/context/SessionContext';
import { useCart } from '../../models/context/CartContext';
import { MenuItem } from '../components/MenuItem';
import { ModifierModal } from '../components/ModifierModal';
import { CartDrawer } from '../components/CartDrawer';
import { getSupabase } from '../../models/lib/supabaseClient';

export function Menu() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { currentUser, tableNumber } = useSession();
  const { addItem, totalItems } = useCart();

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    if (!currentUser || !qrCode) {
      navigate(`/onboarding/${qrCode}`);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('activo', true);

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('disponible', true);

      if (cats) setCategories(cats);
      if (items) setMenuItems(items);

      setLoading(false);
    };

    fetchData();
  }, [qrCode, currentUser, navigate]);

  //Seleccionar categoría SOLO cuando ya haya datos
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories]);

  if (!currentUser || !qrCode) return null;

  if (loading) {
    return <div className="p-4">Cargando menú...</div>;
  }

  const filteredItems = menuItems.filter(
    (item) =>
      String(item.categoria_id).trim().toLowerCase() ===
      String(selectedCategory).trim().toLowerCase()
  );

  const handleAddItem = (item: any) => {
    setSelectedItem(item);
  };

  const handleConfirmItem = (
    tipo: 'personal' | 'compartido',
    modificadores: any[]
  ) => {
    if (!selectedItem) return;

    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      item_id: selectedItem.id,
      nombre: selectedItem.nombre,
      precio: selectedItem.precio,
      cantidad: 1,
      tipo,
      modificadores,
      foto_url: selectedItem.foto_url,
    };

    addItem(cartItem);
    setSelectedItem(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl">La Mesa Redonda</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/account/${qrCode}`)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Receipt className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span>{currentUser.nombre}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Mesa {tableNumber}
          </div>
        </div>

        {/* CATEGORÍAS */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full ${selectedCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100'
                }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* ITEMS */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <MenuItem key={item.id} item={item} onAdd={handleAddItem} />
        ))}

        {filteredItems.length === 0 && (
          <p>No hay productos en esta categoría</p>
        )}
      </div>

      {/* CARRITO */}
      {totalItems > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full"
        >
          <ShoppingCart />
        </button>
      )}

      {selectedItem && (
        <ModifierModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleConfirmItem}
        />
      )}

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}
    </div>
  );
}