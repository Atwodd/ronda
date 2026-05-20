# 🍽️ RONDA - Sistema de Pedidos para Restaurantes

**Demo del Flujo del Cliente - Fase 1 MVP**

Esta es una demostración interactiva y completamente funcional del flujo del cliente para RONDA, una plataforma SaaS multi-tenant de gestión de pedidos y pagos para restaurantes colombianos.

---

## 🎯 ¿Qué es RONDA?

RONDA es una Web App (sin descargas) que permite a los clientes de un restaurante:

1. **Escanear un código QR** en su mesa
2. **Ver el menú** completo con fotos y precios
3. **Hacer pedidos** desde su celular
4. **Dividir la cuenta** automáticamente (personal/compartido)
5. **Pagar digitalmente** (Nequi, Daviplata) o presencialmente
6. **Descargar su comprobante** en PDF

---

## 🚀 Inicio Rápido

### Accede a la Demo

Simplemente abre la aplicación y selecciona una mesa disponible:

- **Mesa 4**: Haz clic en la tarjeta de Mesa 4
- **Mesa 7**: Haz clic en la tarjeta de Mesa 7

O accede directamente con estas URLs:
- `/m/MESA-04-RONDA`
- `/m/MESA-07-RONDA`

### Flujo Completo (5 minutos)

1. **Selecciona una mesa** desde la página principal
2. **Ingresa tu nombre** (ejemplo: "María López")
3. **Explora el menú** por categorías
4. **Agrega platos** al carrito
5. **Configura cada pedido** (modificadores + tipo personal/compartido)
6. **Confirma tu pedido** desde el carrito flotante
7. **Revisa tu cuenta** con el desglose
8. **Realiza el pago** (incluye propina opcional)
9. **Descarga tu comprobante** en PDF

---

## ✨ Características Implementadas

### 🎨 Experiencia del Cliente

- ✅ **Onboarding rápido**: Solo nombre, sin registros complejos
- ✅ **Recuperación de sesión**: URL única para volver si cierras el navegador
- ✅ **Menú visual**: Fotos de alta calidad (Unsplash), precios formateados, tiempos de preparación
- ✅ **Navegación por categorías**: Tabs scrolleables (Entradas, Platos Fuertes, Bebidas, Postres)
- ✅ **Indicadores de disponibilidad**: Ítems agotados claramente marcados

### 🛒 Pedidos Inteligentes

- ✅ **Modificadores**: Opciones obligatorias y opcionales con precios adicionales
- ✅ **División automática**: Ítems personales vs compartidos
- ✅ **Carrito flotante**: FAB con contador en tiempo real
- ✅ **Edición de cantidades**: +/- para ajustar cada ítem
- ✅ **Confirmación visual**: Notificaciones toast al confirmar

### 💰 Pagos Flexibles

- ✅ **Propina opcional**: 0%, 5%, 10% (popular), 15%, o monto personalizado
- ✅ **Múltiples métodos**: Nequi, Daviplata, Efectivo, Tarjeta
- ✅ **Instrucciones claras**: Paso a paso para pagos digitales
- ✅ **Upload de comprobante**: Captura desde cámara o galería
- ✅ **Código de referencia único**: Formato `RONDA-MESA-HORA-INICIALES`
- ✅ **Comprobante PDF descargable**: Con jsPDF

### 📊 Estado de Cuenta

- ✅ **Desglose en tiempo real**: Personal + Compartido + Propina
- ✅ **Indicadores visuales**: Badges de estado (Pendiente, En proceso, Pagado)
- ✅ **Cálculo automático**: Total a pagar - Abonado = Pendiente

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **React Router 7** (Data mode con RouterProvider)
- **Tailwind CSS v4** para estilos
- **Context API** para estado global
- **LocalStorage** para persistencia

### UI/UX
- **Lucide React** - Iconos SVG
- **Sonner** - Notificaciones toast
- **jsPDF** - Generación de comprobantes PDF
- **Unsplash** - Imágenes de comida de alta calidad

### Arquitectura
```
src/
├── app/
│   ├── components/
│   │   ├── MenuItem.tsx
│   │   ├── ModifierModal.tsx
│   │   └── CartDrawer.tsx
│   ├── context/
│   │   ├── SessionContext.tsx
│   │   └── CartContext.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── TableLanding.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Menu.tsx
│   │   ├── Account.tsx
│   │   ├── Payment.tsx
│   │   └── PaymentSuccess.tsx
│   ├── App.tsx
│   └── routes.ts
└── styles/
    └── theme.css
```

---

## 📱 Detalles de Implementación

### Formato de Precios
Los precios se manejan internamente en **centavos de COP**:
- `$12.000 COP` = `1200000` centavos
- Se formatean automáticamente con `Intl.NumberFormat('es-CO')`

### División de Cuenta Compartida
En esta versión (Fase 1):
- Los ítems marcados como "Para el centro" se dividen entre **todos** los comensales
- Simulación actual: **3 personas** por mesa (hardcoded)
- Cada usuario ve su parte proporcional en "Consumo compartido"

### Código de Referencia
Formato: `RONDA-[MESA]-[HHMM]-[INICIALES]`

Ejemplo: `RONDA-4-1423-MG` significa:
- Mesa 4
- Hora: 14:23
- Iniciales: María García

### Persistencia de Sesión
```typescript
// Se guarda en localStorage:
- ronda_session_token: JWT simulado
- ronda_user: Objeto completo del usuario
- ronda_qr_code: Código QR de la mesa
- ronda_table_number: Número de mesa
```

---

## 🎨 Menú de Ejemplo

La demo incluye **11 ítems de menú** en **4 categorías**:

### 🥟 Entradas
- Empanadas Colombianas ($12.000)
- Patacones con Hogao ($15.000)
- Arepas con Queso ($10.000)

### 🍖 Platos Fuertes
- Bandeja Paisa ($35.000) - Con modificadores: punto del huevo, extras
- Pechuga a la Plancha ($28.000) - Con modificadores: acompañamiento
- Cazuela de Mariscos ($42.000) - ⚠️ Agotado

### 🍹 Bebidas
- Limonada Natural ($6.000) - Con modificadores: tipo (natural, coco, cerezada)
- Cerveza Club Colombia ($8.000)
- Jugo Natural ($7.000) - Con modificadores: sabor (mora, lulo, maracuyá, mango)

### 🍰 Postres
- Tres Leches ($12.000)
- Brownie con Helado ($14.000) - Con modificadores: sabor del helado

---

## 🔒 Limitaciones (Es una Demo)

Esta es una **demostración frontend-only**. NO incluye:

- ❌ Backend real (Fastify API)
- ❌ Base de datos (Supabase)
- ❌ Autenticación real con JWT
- ❌ Supabase Realtime para sincronización
- ❌ Upload real a Cloudinary
- ❌ Panel de staff (admin/meseros)
- ❌ Múltiples usuarios reales simultáneos
- ❌ Aprobación real de comprobantes
- ❌ Multi-tenancy con Row Level Security

---

## 🎯 Próximos Pasos (Para Producción)

Para convertir esto en una aplicación real:

### Backend & Base de Datos
1. Configurar **Supabase** con schema PostgreSQL completo
2. Implementar **Row Level Security (RLS)** para multi-tenancy
3. Crear API con **Fastify 4** + **Prisma 5**
4. Implementar **Supabase Realtime** para sincronización

### Storage & Media
5. Conectar **Cloudinary** para upload de comprobantes
6. Implementar validación de imágenes en servidor

### Panel de Staff
7. Construir **Panel de Admin**: gestión de menú, aprobación de pagos, reportes
8. Construir **Panel de Mesero**: ver comandas, cobrar presencialmente, cambiar estados

### Autenticación & Seguridad
9. Implementar **Supabase Auth** para staff
10. Generar **JWT firmado** para clientes de mesa
11. Validar tokens en todas las rutas del API

### Deploy & DevOps
12. Desplegar frontend a **Vercel**
13. Desplegar API a **Railway**
14. Configurar **CI/CD** y monitoreo

---

## 📄 Documentación Adicional

- Ver [DEMO_GUIDE.md](./DEMO_GUIDE.md) para instrucciones detalladas de uso
- Ver [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) para créditos de imágenes

---

## 🙋‍♂️ Preguntas Frecuentes

**¿Los datos persisten si recargo la página?**
Sí, la sesión del usuario se guarda en `localStorage`. Puedes cerrar el navegador y volver con la URL de recuperación.

**¿Puedo probar con múltiples usuarios?**
La demo está diseñada para un solo usuario. En producción, múltiples usuarios verían sus cuentas sincronizadas en tiempo real vía Supabase Realtime.

**¿Los comprobantes de pago son reales?**
No, el upload simula envío a Cloudinary y la "aprobación" es automática después de 3 segundos.

**¿Puedo cambiar el menú?**
Sí, edita `/src/app/data/mockData.ts` para agregar/editar ítems, categorías y modificadores.

**¿Funciona en móvil?**
¡Sí! La aplicación es completamente responsive y está optimizada para móvil (es su uso principal).

---

## 🌟 Créditos

**Desarrollado para**: Proyecto RONDA - Fase 1 MVP

**Imágenes**: Unsplash (ver ATTRIBUTIONS.md)

**Concepto**: Sistema SaaS multi-tenant para restaurantes colombianos

---

## 📞 Contacto

Para preguntas sobre la implementación completa del sistema RONDA, incluyendo backend, infraestructura y despliegue, por favor contacta al equipo de desarrollo.

---

**¡Disfruta explorando RONDA! 🍽️🎉**
