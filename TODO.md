# TODO - Pedido “listo” se queda en BD

## Paso 1
- Entender dónde se marca el estado del pedido en AdminDashboard.

## Paso 2
- Agregar en `src/models/lib/adminSupabase.ts` una función para actualizar el estado de `orders` en Supabase.

## Paso 3
- Actualizar `src/views/pages/AdminDashboard.tsx` para que “Iniciar Preparación / Marcar Listo / Marcar Servido” llamen a Supabase y luego `reloadData()`.

## Paso 4
- Probar: marcar un pedido como `listo`, refrescar la página y verificar que permanece como listo.

## Paso 5 (opcional, hardening)
- (Si aplica) Asegurar que el backend/DB use un enum/constraints para el estado y evitar estados inválidos.



