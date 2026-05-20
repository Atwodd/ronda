import { useState } from 'react';
import { X } from 'lucide-react';
import { MenuItem, formatCOP } from '../../models/data/mockData';

interface SelectedModifier {
  nombre_grupo: string;
  opcion: string;
  precio_extra: number;
}

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (tipo: 'personal' | 'compartido', modificadores: SelectedModifier[]) => void;
}

export function ModifierModal({ item, onClose, onConfirm }: ModifierModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [tipo, setTipo] = useState<'personal' | 'compartido'>('personal');

  // Extraer modificadores del item
  const modifiers = item.modificadores ?? [];

  const handleModifierChange = (grupo: string, opcion: string) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [grupo]: opcion,
    }));
  };

  const handleConfirm = () => {
    const modifiersSelected: SelectedModifier[] = [];

    modifiers.forEach((mod) => {
      const selected = selectedModifiers[mod.nombre_grupo];

      if (selected) {
        const opcionObj = mod.opciones?.find((o) => o.texto === selected);

        if (opcionObj) {
          modifiersSelected.push({
            nombre_grupo: mod.nombre_grupo,
            opcion: selected,
            precio_extra: opcionObj.precio_extra,
          });
        }
      }
    });

    const allObligatorySelected = modifiers
      .filter((mod) => mod.obligatorio)
      .every((mod) => selectedModifiers[mod.nombre_grupo]);

    if (!allObligatorySelected) {
      alert('Por favor selecciona todas las opciones obligatorias');
      return;
    }

    onConfirm(tipo, modifiersSelected);
  };

  const totalExtras = Object.entries(selectedModifiers).reduce(
    (sum, [grupo, opcion]) => {
      const mod = modifiers.find((m) => m.nombre_grupo === grupo);
      const opcionObj = mod?.opciones?.find((o) => o.texto === opcion);
      return sum + (opcionObj?.precio_extra || 0);
    },
    0
  );

  const totalPrice = item.precio + totalExtras;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl">{item.nombre}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">

          {/* MODIFICADORES */}
          {modifiers.map((mod) => (
            <div key={mod.id}>
              <h3 className="mb-3">
                {mod.nombre_grupo}
                {mod.obligatorio && <span className="text-red-500 ml-1">*</span>}
              </h3>

              <div className="space-y-2">
                {mod.opciones?.map((opcion) => (
                  <label
                    key={opcion.texto}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={mod.nombre_grupo}
                        value={opcion.texto}
                        checked={selectedModifiers[mod.nombre_grupo] === opcion.texto}
                        onChange={() =>
                          handleModifierChange(mod.nombre_grupo, opcion.texto)
                        }
                      />
                      <span>{opcion.texto}</span>
                    </div>

                    {opcion.precio_extra > 0 && (
                      <span className="text-sm text-gray-600">
                        +{formatCOP(opcion.precio_extra)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* TIPO */}
          <div>
            <h3 className="mb-3">¿Para quién es este pedido?</h3>

            <label className="block p-3 border rounded-lg mb-2">
              <input
                type="radio"
                checked={tipo === 'personal'}
                onChange={() => setTipo('personal')}
              />
              Solo para mí
            </label>

            <label className="block p-3 border rounded-lg">
              <input
                type="radio"
                checked={tipo === 'compartido'}
                onChange={() => setTipo('compartido')}
              />
              Para el centro
            </label>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between mb-3">
            <span>Total:</span>
            <span className="text-orange-600">{formatCOP(totalPrice)}</span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-orange-500 text-white py-3 rounded-lg"
          >
            Agregar al pedido
          </button>
        </div>

      </div>
    </div>
  );
}