import { Clock } from 'lucide-react';
import { MenuItem as MenuItemType } from '../../models/data/mockData';
import { formatCOP } from '../../models/data/mockData';
import { ImageWithFallback } from './ImageWithFallback';

interface MenuItemProps {
  item: MenuItemType;
  onAdd: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAdd }: MenuItemProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden transition hover:shadow-xl ${!item.disponible ? 'opacity-60' : ''}`}>

      <div className="relative h-48">
        <ImageWithFallback
          src={item.foto_url}
          alt={item.nombre}
          className="w-full h-full object-cover"
        />

        {!item.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white px-4 py-2 bg-red-500 rounded-full text-sm font-medium">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">
          {item.nombre}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {item.descripcion}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-600 text-lg font-bold">
              {formatCOP(item.precio)}
            </p>

            {item.tiempo_prep_min && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{item.tiempo_prep_min} min</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onAdd(item)}
            disabled={!item.disponible}
            className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
