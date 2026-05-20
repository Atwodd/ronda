# Guía de Defensa: Manejo de QR, Generación, Repositorio y Despliegue

## 1. Objetivo de este documento

Este documento te deja lista una explicación completa para presentar el proyecto RONDA ante el profesor, especialmente en estos puntos:

1. Cómo se maneja el flujo de QR en el sistema.
2. Cómo se generan los QR y en qué parte del código.
3. Cómo se organiza este sistema en un repositorio.
4. Cómo se despliega (hosting, variables de entorno, base de datos, rutas).
5. Qué limitaciones tiene hoy y cómo se justificarían técnicamente.
6. Qué responder si hacen preguntas adicionales o críticas.

---

## 2. Resumen ejecutivo (versión corta para iniciar la exposición)

RONDA usa códigos QR por mesa para abrir una URL única con un identificador de mesa (`qr_code`).
Ese identificador se crea al registrar una mesa desde el panel de administración y se guarda en Supabase.
Luego, el panel renderiza la imagen QR usando un servicio externo de generación de QR.

Cuando un cliente escanea el QR:

1. Entra por una ruta con parámetro dinámico (`:qrCode`).
2. La app busca la mesa en la base de datos (Supabase) por ese `qr_code`.
3. Si existe, continúa al onboarding y al flujo de menú/pedido/pago.
4. Si no existe, muestra flujo de error o redirección.

A nivel de despliegue, el frontend está preparado para Vercel (SPA con rewrite a `index.html`), y la persistencia está pensada con Supabase. 

---

## 3. Arquitectura aplicada al QR

## 3.1 Componentes principales

1. Frontend React + React Router + Context API.
2. Base de datos Supabase (PostgreSQL) para mesas y datos operativos.
3. Tabla de mesas con columna `qr_code` única.
4. Panel admin para crear mesas y visualizar el QR.
5. Rutas dinámicas para consumir ese `qr_code`.

## 3.2 Archivos clave del flujo

1. Rutas de navegación: `src/controllers/routes.ts`.
2. Creación de mesas y `qr_code`: `src/models/lib/adminSupabase.ts`.
3. Render de QR visual en panel admin: `src/views/pages/AdminDashboard.tsx`.
4. Recepción del parámetro QR en onboarding: `src/views/pages/Onboarding.tsx`.
5. Recepción del parámetro QR en mesa virtual: `src/views/pages/VirtualTable.tsx`.
6. Modelo de tabla y tipo `qr_code`: `src/models/data/mockData.ts`.
7. Estructura SQL de tabla `tables`: `supabase/schema.sql`.

---

## 3.3 Estructura del MVP (Producto Mínimo Viable)

### 3.3.1 Alcance del MVP

El MVP incluye:

**Lado del cliente (comensal)**

1. Pantalla de inicio con selección de mesa.
2. Escaneo QR o entrada directa por parámetro URL.
3. Onboarding liviano (nombre del comensal).
4. Menú interactivo por categorías.
5. Carrito con modificadores y división personal/compartido.
6. Confirmación y revisión de pedidos.
7. Pantalla de cuenta con desglose.
8. Flujo de pago con 4 métodos (Nequi, Daviplata, Efectivo, Tarjeta).
9. Generación de comprobante PDF descargable.
10. Persistencia de sesión por localStorage.

**Lado del administrador**

1. Panel de dashboard con estadísticas (mesas, pedidos, pagos).
2. Gestión de mesas: crear, eliminar, visualizar QR.
3. Gestión de menú: crear, editar, eliminar ítems.
4. Seguimiento de órdenes: cambiar estado (pendiente → en preparación → listo → servido).
5. Aprobación/rechazo de pagos.
6. Gestión de meseros: crear, editar, activar/desactivar.

### 3.3.2 Estructura de carpetas del MVP

```
src/
├── controllers/
│   ├── routes.ts                    # Rutas React Router (7 páginas + admin)
│   └── utils/
│       └── clipboard.ts             # Utilidad copiar al portapapeles
│
├── models/
│   ├── context/                     # Estado global
│   │   ├── SessionContext.tsx       # Sesión del comensal (nombre, mesa, totales)
│   │   ├── CartContext.tsx          # Carrito y pedidos
│   │   ├── AdminAuthContext.tsx     # Autenticación admin
│   │   └── WaiterAuthContext.tsx    # Autenticación mesero
│   │
│   ├── data/
│   │   └── mockData.ts              # Tipos, constantes, datos de ejemplo
│   │
│   └── lib/
│       ├── supabaseClient.ts        # Cliente de Supabase
│       └── adminSupabase.ts         # Funciones CRUD para admin
│
├── views/
│   ├── pages/                       # Pantallas principales
│   │   ├── Home.tsx                 # Landing con menú de mesas
│   │   ├── TableLanding.tsx         # Resolución de QR (lookup de mesa)
│   │   ├── Onboarding.tsx           # Captura de nombre + URL de recuperación
│   │   ├── VirtualTable.tsx         # Visualización de mesa con comensales
│   │   ├── Menu.tsx                 # Catálogo de productos por categoría
│   │   ├── Account.tsx              # Desglose de cuenta
│   │   ├── Payment.tsx              # Flujo de pago (propina, método, comprobante)
│   │   ├── PaymentSuccess.tsx       # Confirmación de pago
│   │   ├── AdminDashboard.tsx       # Panel admin (stats, menú, mesas, pagos)
│   │   ├── AdminLogin.tsx           # Login admin
│   │   ├── WaiterDashboard.tsx      # Panel de mesero (comandas)
│   │   ├── WaiterLogin.tsx          # Login mesero
│   │   └── NotFound.tsx             # Página 404
│   │
│   ├── components/                  # Componentes reutilizables
│   │   ├── MenuItem.tsx             # Card de producto
│   │   ├── ModifierModal.tsx        # Modal para seleccionar modificadores
│   │   ├── CartDrawer.tsx           # Carrito deslizable
│   │   ├── ImageWithFallback.tsx    # Imagen con fallback si falla URL
│   │   └── TableDiners.tsx          # Visualización de comensales en mesa
│   │
│   ├── ui/                          # Componentes UI base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── accordion.tsx
│   │   ├── table.tsx
│   │   └── ... (40+ componentes base)
│   │
│   └── styles/
│       ├── index.css                # Estilos globales
│       ├── tailwind.css             # Configuración Tailwind
│       ├── theme.css                # Variables CSS de tema
│       └── fonts.css                # Tipografías
│
├── App.tsx                          # Raíz de contextos y router
├── main.tsx                         # Entry point React
└── vite-env.d.ts                    # Tipos de Vite

supabase/
├── schema.sql                       # Schema PostgreSQL (tablas, índices, RLS)
└── meseros_login_rpc.sql            # Function RPC para login de mesero
```

### 3.3.3 Características por fase de usuario

**Fase 1: Acceso por QR**

- Usuario escanea QR o abre link directo.
- Sistema resuelve `qr_code` contra tabla `tables` en Supabase.
- Redirige a onboarding si mesa es válida.

**Fase 2: Identificación del comensal**

- Usuario ingresa nombre.
- Sistema genera sesión simulada (token mock + localStorage).
- Se guarda: `session_token`, `user`, `qr_code`, `table_number`.

**Fase 3: Exploración de menú**

- Usuario ve categorías (Entradas, Platos Fuertes, Bebidas, Postres).
- Elige items, ve modificadores obligatorios/opcionales.
- Selecciona si es personal o compartido.
- Añade al carrito con cantidad.

**Fase 4: Revisión de pedido**

- Carrito flotante con contador.
- Desglose de cada item: cantidad, precio unitario, modificadores.
- Total calculado dinámicamente.

**Fase 5: Revisión de cuenta**

- Desglose: consumo personal + consumo compartido + propina.
- Total a pagar y pendiente.

**Fase 6: Pago**

- Selección de propina (0%, 5%, 10%, 15%, o monto personalizado).
- Selección de método (Nequi, Daviplata, Efectivo, Tarjeta).
- Para métodos digitales: muestra número e instrucciones + upload de comprobante.
- Para presencial (Efectivo, Tarjeta): simula confirmación.

**Fase 7: Comprobante**

- Genera PDF con datos del comprobante (número referencia, mesa, monto, hora).
- Opción descargar.

### 3.3.4 Stack tecnológico del MVP

**Frontend**

- React 18 + TypeScript.
- React Router 7 (rutas dinámicas con parámetros).
- Context API para estado global.
- Tailwind CSS v4 para estilos.
- shadcn/ui para componentes base (40+ componentes reutilizables).
- Lucide React para iconografía.
- Sonner para notificaciones toast.
- jsPDF para generación de comprobantes PDF.

**Backend de datos**

- Supabase (PostgreSQL + Auth + RLS + Realtime).
- Row Level Security para aislar datos por sesión.

**Persistencia**

- localStorage en cliente para sesión de comensal (MVP).
- Base de datos para datos operativos (mesas, menú, órdenes, pagos).

**Deploy**

- Vite como bundler/build tool.
- Vercel como platform (SPA con rewrite).

### 3.3.5 Qué NO está incluido en el MVP

1. ❌ Backend API real (las operaciones son directas a Supabase desde cliente).
2. ❌ Autenticación real con JWT (sesiones de comensal simuladas).
3. ❌ Multi-tenancy en RLS (todas las mesas/menúes visibles a todos).
4. ❌ Supabase Realtime para sincronización de estados.
5. ❌ Upload real a Cloudinary (comprobantes simulados).
6. ❌ Integración real con pasarelas Nequi/Daviplata.
7. ❌ Panel de kitchen display system (KDS).
8. ❌ Reportes y analytics.
9. ❌ Soporte a múltiples idiomas.
10. ❌ Modo offline.

### 3.3.6 Datos de ejemplo en el MVP

**Menú precargado**

- 11 ítems en 4 categorías.
- Precios en COP (internamente en centavos).
- Imágenes desde Unsplash.
- Modificadores de ejemplo (punto de huevo, sabor de bebida, etc.).

**Mesas de demo**

- Mesa 4 y Mesa 7 precargadas para demostración rápida.
- Formato de `qr_code`: `MESA-04-RONDA` y `MESA-07-RONDA`.

### 3.3.7 Simples pero funcionales: justificación de decisiones MVP

| Aspecto | MVP | Decisión |
|---------|-----|----------|
| Sesión cliente | localStorage + context | Rápido de implementar, suficiente para demo, mejora a JWT en producción |
| Menú | mockData.ts + Supabase | Híbrido: demo con mock, producción con BD |
| Generación QR | API externa (qrserver.com) | Rápido, sin dependencias locales |
| Órdenes | En memoria + contexto | MVP; en producción: tabla `orders` + Realtime |
| Pagos | Simulados | Flujo UI/UX listo, integración real pendiente |
| Auth admin | Supabase RPC básico | Funcional, sin 2FA ni complejidad extra |
| Mensajería | Toast (Sonner) | Suficiente para feedback de usuario |

---

## 4. Cómo se generan los QR en este proyecto

## 4.1 Generación del identificador QR (dato)

El sistema primero genera el valor identificador, no la imagen.
Ese valor tiene forma:

- `MESA-<numero>-<sufijo_aleatorio>`

En términos funcionales:

1. Admin crea mesa.
2. Se arma un string único (`qr_code`).
3. Se inserta en la tabla `tables` de Supabase.
4. Ese valor se usa como llave de acceso por URL.

## 4.2 Generación de la imagen QR (visual)

La imagen se genera en frontend usando un endpoint externo:

- `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=<URL_ENCODED>`

Donde `<URL_ENCODED>` es el enlace de la mesa con su `qr_code`.

En otras palabras:

- El proyecto genera internamente el dato (`qr_code`).
- La imagen del QR la dibuja un servicio externo a partir de la URL.

## 4.3 Diferencia importante para explicar bien

Cuando te pregunten “¿el QR dónde se genera?” puedes responder así:

1. El identificador (token de mesa) se genera en nuestra lógica del sistema.
2. La imagen QR se genera mediante un servicio externo consumido por el panel admin.

Eso muestra criterio técnico y evita respuestas ambiguas.

---

## 5. Flujo completo desde escaneo hasta pedido

## 5.1 Escaneo

1. Cliente escanea QR físico de la mesa.
2. Abre un link web con parámetro `:qrCode`.

## 5.2 Resolución de mesa

1. La app recibe el `qrCode` por ruta.
2. Consulta Supabase en la tabla `tables` por coincidencia en `qr_code`.
3. Si existe mesa: permite continuar.
4. Si no existe: error/redirección.

## 5.3 Inicio de sesión liviana del cliente

1. En onboarding, cliente escribe nombre.
2. Se guarda sesión temporal del cliente en contexto + localStorage.
3. Se conserva `qr_code` y `tableNumber` para continuar flujo.

## 5.4 Consumo operativo

1. Cliente entra al menú de su mesa.
2. Agrega productos al carrito.
3. Revisa cuenta y realiza pago.
4. Flujo mantiene el contexto de mesa por `qrCode`.

---

## 6. Estado actual: fortalezas y puntos por corregir

## 6.1 Fortalezas

1. Estructura de rutas dinámica ya implementada.
2. Modelo de datos de mesas con `qr_code` único.
3. Panel admin con creación de mesas y visualización de QR.
4. Integración inicial con Supabase para lookup de mesas.
5. Configuración de despliegue SPA en Vercel ya presente.

## 6.2 Brechas importantes detectadas

1. Hay inconsistencia entre rutas de entrada por QR (`/m/:qrCode` vs `/table/:qrCode`).
2. Parte del flujo de landing QR valida contra estructura mock/in-memory en lugar de usar siempre Supabase.
3. Dependencia de un servicio externo para render de QR, sin fallback local.
4. Existen partes simuladas (token mock) que deben reemplazarse para producción.
5. RLS necesita endurecimiento por tenant/restaurante para escenario SaaS real.

---

## 7. Cómo explicarlo al profesor sin entrar en contradicciones

Puedes usar este discurso:

"El diseño del sistema es QR por mesa con identificador único persistido en base de datos. Técnicamente el identificador se crea al registrar la mesa, y la imagen QR se renderiza en el panel admin con un servicio generador. El cliente escanea, entra por una URL con el `qrCode`, el sistema valida la mesa en Supabase y habilita el flujo onboarding-menú-pago. Actualmente tenemos una versión funcional tipo MVP con algunas capas simuladas y una ruta que debemos unificar para endurecer el flujo de producción." 

---

## 8. Repositorio: cómo lo tendrían profesionalmente

## 8.1 Estructura recomendada

1. Código frontend en rama principal (React/Vite).
2. Scripts SQL versionados en carpeta `supabase/`.
3. Variables sensibles fuera del repo (`.env`, secrets de plataforma).
4. Pull requests con revisión para cambios de rutas, auth y pagos.
5. Documentación técnica separada (arquitectura, despliegue, seguridad).

## 8.2 Flujo Git recomendado

1. `main`: estable para demo/producción.
2. `develop`: integración continua.
3. `feature/*`: nuevas funcionalidades.
4. `hotfix/*`: correcciones urgentes en producción.

---

## 9. Despliegue: cómo se publica hoy y cómo se profesionaliza

## 9.1 Frontend

1. Plataforma: Vercel.
2. Build: `vite build`.
3. Salida estática en `dist`.
4. Rewrite SPA a `index.html` para soportar rutas directas con parámetros.

## 9.2 Base de datos y backend de datos

1. Supabase como PostgreSQL administrado.
2. Aplicar scripts SQL (`schema.sql` y funciones RPC cuando corresponda).
3. Configurar políticas RLS robustas.

## 9.3 Variables de entorno

Necesarias en el entorno de despliegue:

1. `VITE_SUPABASE_URL`
2. `VITE_SUPABASE_ANON_KEY`

## 9.4 Secuencia de despliegue recomendada

1. Crear proyecto en Supabase.
2. Ejecutar script de esquema.
3. Verificar tablas y políticas.
4. Configurar proyecto en Vercel enlazado al repositorio.
5. Cargar variables de entorno en Vercel.
6. Desplegar y validar rutas QR de extremo a extremo.
7. Probar con links reales de mesa desde el panel admin.

---

## 10. Riesgos técnicos y cómo responder si te los preguntan

## 10.1 "¿Qué pasa si se cae el servicio externo de QR?"

Respuesta sugerida:

"El sistema seguiría teniendo el identificador de mesa y la URL funcional, pero no renderizaría la imagen en el panel admin temporalmente. La mejora inmediata es agregar fallback local con una librería QR en frontend o un endpoint propio para no depender de terceros." 

## 10.2 "¿Es seguro el acceso por QR?"

Respuesta sugerida:

"El QR da acceso al contexto de mesa, pero para producción se complementa con control de sesión robusto, expiración, validación de tokens y políticas RLS segmentadas por tenant para evitar lecturas cruzadas." 

## 10.3 "¿Cómo evitan que alguien adivine códigos de mesa?"

Respuesta sugerida:

"Hoy usamos un sufijo aleatorio; en productivo se recomienda reforzar con tokens de alta entropía, expiración por sesión y validación server-side de estado de mesa/sesión." 

## 10.4 "¿Está listo para multi-restaurante?"

Respuesta sugerida:

"La base conceptual sí, pero falta endurecer aislamiento multi-tenant en datos y políticas. El siguiente paso es agregar identificador de restaurante en todas las entidades operativas y políticas por tenant." 

---

## 11. Preguntas difíciles (Q&A largo)

## 11.1 "¿Cuál es la diferencia entre QR y sesión?"

El QR identifica la mesa. La sesión identifica al usuario/comensal dentro de esa mesa.

## 11.2 "¿El QR contiene datos sensibles?"

No debería. Idealmente contiene solo URL/identificador opaco, no información personal ni montos.

## 11.3 "¿Por qué usar URL con parámetro en vez de QR con payload cifrado?"

Porque simplifica operación, observabilidad y soporte en MVP. En escala, se puede firmar el token o usar identificador opaco + validación server-side.

## 11.4 "¿Cómo auditarían uso de QR por mesa?"

Con tabla de sesiones (`table_sessions`), timestamps de apertura/cierre y eventos de orden/pago vinculados a `table_id`.

## 11.5 "¿Qué pruebas mínimas deberían existir?"

1. Prueba de creación de mesa y unicidad de `qr_code`.
2. Prueba de apertura de URL QR válida.
3. Prueba de rechazo QR inválido.
4. Prueba de continuidad de sesión del comensal.
5. Prueba de rutas directas en producción (refresh en URL profunda).

## 11.6 "¿Qué pasa si hay dos personas escaneando el mismo QR?"

Es esperado: comparten contexto de mesa, pero cada comensal mantiene su sesión de usuario. El sistema debe sincronizar estado por backend.

## 11.7 "¿Qué cambios hay que hacer para producción real?"

1. Unificar ruta QR canónica.
2. Eliminar validaciones mock.
3. Reemplazar token simulado por autenticación firme.
4. Endurecer RLS por tenant/rol.
5. Definir estrategia de generación QR sin dependencia crítica externa.

---

## 12. Guion oral de 2 a 3 minutos

"En RONDA, cada mesa tiene un identificador `qr_code` único guardado en Supabase. Cuando el administrador crea una mesa, el sistema genera ese identificador y luego el panel produce la imagen QR para imprimirla o usarla en el restaurante. Al escanear, el cliente entra por una URL con ese `qrCode`; la aplicación valida la existencia de la mesa en base de datos y continúa al flujo de onboarding, menú y pago.

La arquitectura está pensada como SPA en React con rutas dinámicas y persistencia en Supabase. El despliegue del frontend se hace en Vercel, con rewrite de rutas para soportar accesos directos a URLs profundas. Las variables de entorno conectan el frontend con Supabase.

Como MVP funcional, el sistema ya cubre la experiencia de usuario principal. Como siguiente fase de producción, hay que unificar completamente la ruta de entrada QR, retirar partes simuladas, fortalecer seguridad de sesiones y aplicar políticas multi-tenant más estrictas para escalar a varios restaurantes con aislamiento total de datos." 

---

## 13. Checklist para defensa final

Marca cada punto antes de exponer:

1. Sé explicar diferencia entre `qr_code` (mesa) y sesión (usuario).
2. Sé decir dónde se genera el identificador y dónde se renderiza la imagen QR.
3. Sé mencionar qué tabla almacena el `qr_code`.
4. Sé explicar por qué Vercel necesita rewrite para SPA.
5. Sé justificar qué partes son MVP y qué partes son producción.
6. Tengo preparadas respuestas para seguridad y escalabilidad.
7. Tengo claro un plan de mejoras corto (3 pasos) y largo (5+ pasos).

---

## 14. Plan de mejora sugerido (si te piden "qué sigue")

## Fase 1 (rápida)

1. Unificar URL de QR en una sola ruta canónica.
2. Cambiar validación de landing para usar solo Supabase.
3. Agregar fallback de generación QR local.

## Fase 2 (producción)

1. Implementar autenticación real de sesión cliente.
2. Endurecer RLS por tenant y rol.
3. Auditoría de sesiones de mesa y eventos.
4. Monitoreo de errores y trazabilidad por mesa.

## Fase 3 (escala)

1. Multi-restaurante completo con aislamiento estricto.
2. Reportes operativos por local y franja horaria.
3. Automatización CI/CD con validaciones de seguridad.

---

## 15. Conclusión

El proyecto ya demuestra correctamente la idea central de negocio: operar pedidos por mesa usando QR como llave de entrada al flujo digital del cliente.

Técnicamente, el MVP está bien encaminado y el camino a producción está claro:

1. unificar rutas,
2. cerrar componentes simulados,
3. reforzar seguridad y multi-tenant,
4. formalizar despliegue y observabilidad.

Con esta narrativa, no solo explicas "qué hace", sino que demuestras criterio de ingeniería sobre "qué falta" para llevarlo a entorno real.
