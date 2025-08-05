# Sistema de Gestión de Kiosco Escolar

## Visión General

El sistema de Kiosco Escolar es una plataforma digital integral que permite a los estudiantes realizar pedidos de alimentos y bebidas, mientras que facilita la gestión del inventario y las operaciones diarias para los administradores del kiosco. La arquitectura sigue un flujo moderno:

```
Frontend (React + Vite) → Supabase (PostgreSQL + Auth + Realtime) → Servicio de Notificaciones
```

## Stack Tecnológico

### Frontend
- **Framework**: React 18 con TypeScript
- **Bundler**: Vite
- **Estado**: Context API
- **Enrutamiento**: React Router v6
- **UI**: Componentes personalizados con Tailwind CSS
- **Autenticación**: Supabase Auth con roles personalizados
- **Datos en Tiempo Real**: Supabase Realtime

### Backend (Supabase)
- **Base de Datos**: PostgreSQL con RLS (Row Level Security)
- **Autenticación**: Supabase Auth con JWT
- **API**: REST y GraphQL mediante Supabase
- **Almacenamiento**: Supabase Storage
- **Funciones Serverless**: Edge Functions

## Estructura del Proyecto

### Frontend (React + Vite)

#### Componentes Principales
1. **App.tsx**
   - Configuración de rutas principales
   - Protección de rutas basada en roles
   - Layout principal de la aplicación

2. **Contextos**
   - `AuthContext`: Manejo de autenticación y sesión
   - `CartContext`: Gestión del carrito de compras
   - `ToastContext`: Notificaciones al usuario

3. **Vistas Principales**
   - `MenuPage`: Catálogo de productos
   - `CheckoutPage`: Proceso de pago
   - `KioscoDashboard`: Panel de control del kiosquero
   - `InventoryPage`: Gestión de inventario
   - `AnalyticsPage`: Reportes y análisis
   - `UsersPage`: Gestión de usuarios (admin)

#### Autenticación
- Implementada mediante Supabase Auth
- Roles personalizados:
  - `ciclo_basico`
  - `ciclo_superior`
  - `kiosquero`
  - `admin`
- Flujo de autenticación con JWT
- Protección de rutas basada en roles

### Backend (Supabase)

#### Base de Datos (PostgreSQL)

**Tablas Principales**
1. **users**
   - Almacena información de usuarios
   - Roles y permisos
   - Datos de perfil

2. **products**
   - Catálogo de productos
   - Precios y disponibilidad
   - Categorías y opciones

3. **orders**
   - Encabezados de pedidos
   - Estados y seguimiento
   - Métodos de pago

4. **order_items**
   - Ítems de cada pedido
   - Personalizaciones
   - Precios históricos

5. **inventory_logs**
   - Registro de movimientos
   - Control de stock
   - Historial de cambios

6. **analytics_daily**
   - Métricas diarias
   - Reportes consolidados
   - Tendencias de ventas

#### Seguridad
- Row Level Security (RLS) habilitado
- Políticas de acceso granulares
- Validación de datos en tiempo real
- Registro de auditoría

## Roles del Sistema

### 1. Estudiantes (Ciclo Básico y Superior)
- **Permisos Principales:**
  - Ver menú disponible
  - Realizar pedidos
  - Ver historial personal
  - Gestionar perfil

### 2. Kiosquero
- **Responsabilidades:**
  - Gestionar pedidos entrantes
  - Controlar inventario
  - Actualizar estados de pedidos
  - Gestionar disponibilidad de productos

### 3. Administrador
- **Funciones Adicionales:**
  - Gestión de usuarios
  - Configuración del sistema
  - Reportes avanzados
  - Ajustes de menú

## Flujo de Pedido - Experiencia del Estudiante

### 1. Inicio de Sesión
- Autenticación segura con email y contraseña
- Validación de rol y permisos
- Redirección según perfil

### 2. Navegación del Menú
- **Catálogo de Productos:**
  - Organizado por categorías (bebidas, sándwiches, ensaladas, etc.)
  - Filtros por disponibilidad y preferencias
  - Búsqueda por nombre o ingredientes

- **Selección de Productos:**
  - Vista detallada de cada ítem
  - Opciones de personalización (cuando aplica)
  - Cantidad y notas especiales
  - Advertencias de alérgenos

### 3. Carrito de Compras
- Resumen de la orden
- Ajustes de cantidades
- Eliminación de ítems
- Cálculo automático del total

### 4. Selección de Horario
- Elección del recreo designado
  - Validación de disponibilidad
  - Horarios bloqueados cuando se alcanza el límite
- Confirmación visual del horario seleccionado

### 5. Proceso de Pago
- **Opciones disponibles:**
  - Efectivo
  - Tarjeta
  - Mercado Pago
- Generación de comprobante
- Confirmación de la transacción

### 6. Confirmación y Seguimiento
- Resumen del pedido
- Código de seguimiento
- Tiempo estimado de entrega
- Notificaciones en tiempo real

## Panel de Control del Kiosquero

### 1. Vista de Pedidos
- **Panel Principal:**
  - Lista de pedidos en tiempo real
  - Filtros por estado (pendiente, en preparación, listo)
  - Búsqueda por código o estudiante

- **Gestión de Pedidos:**
  - Actualización de estados
  - Asignación de preparador
  - Tiempos de preparación
  - Notas internas

### 2. Gestión de Inventario
- **Control de Stock:**
  - Niveles actuales
  - Alertas de bajo inventario
  - Historial de movimientos

- **Actualizaciones:**
  - Ajuste manual de cantidades
  - Registro de desperdicios
  - Entradas de inventario

### 3. Reportes
- Ventas por período
- Productos más vendidos
- Horarios pico
- Ingresos totales

## Proceso Técnico Detrás de Escena

### 1. Validación de Inventario
```typescript
// Ejemplo de validación de stock
async function validarStock(productos) {
  const sinStock = [];
  
  for (const item of productos) {
    const producto = await obtenerProducto(item.id);
    if (producto.stock_quantity < item.cantidad) {
      sinStock.push({
        id: producto.id,
        nombre: producto.nombre,
        stockDisponible: producto.stock_quantity
      });
    }
  }
  
  return {
    valido: sinStock.length === 0,
    productosSinStock: sinStock
  };
}
```

### 2. Procesamiento de Pedidos
1. El estudiante confirma el pedido
2. El sistema reserva el inventario
3. Se crea la orden en estado "pendiente"
4. Se notifica al kiosco en tiempo real
5. Se envía confirmación al estudiante

### 3. Notificaciones en Tiempo Real
- WebSockets para actualizaciones instantáneas
- Notificaciones push para cambios de estado
- Recordatorios de pedidos pendientes

## Características de Seguridad

### 1. Autenticación
- JWT para autenticación
- Refresh tokens
- Protección contra CSRF

### 2. Autorización
- Roles bien definidos
- Políticas de acceso granular
- Registro de actividades

### 3. Protección de Datos
- Encriptación de información sensible
- Cumplimiento de normativas de privacidad
- Copias de seguridad automáticas

## Escalabilidad y Mantenimiento

### 1. Arquitectura
- Frontend: Vue.js con Vuetify
- Backend: Node.js con Express
- Base de Datos: PostgreSQL (Supabase)
- Caché: Redis para sesiones

### 2. Monitoreo
- Logs detallados
- Alertas de rendimiento
- Métricas en tiempo real

### 3. Despliegue
- CI/CD automatizado
- Pruebas automatizadas
- Despliegues sin tiempo de inactividad

## Consideraciones Futuras

1. **Integración con Pasarelas de Pago Adicionales**
2. **App Móvil Nativa**
3. **Sistema de Fidelización**
4. **Análisis Predictivo de Inventario**
5. **Pedidos Recurrentes**

---

*Este documento se actualiza continuamente para reflejar los cambios en el sistema. Última actualización: Junio 2024*