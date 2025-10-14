# Sistema de Pedidos para Kiosco Escolar

Sistema web completo para la gestión de pedidos en un kiosco escolar, desarrollado con React, TypeScript, TailwindCSS y Supabase.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Manual de Usuario](#manual-de-usuario)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Solución de Problemas](#solución-de-problemas)

---

## Descripción General

Este sistema permite a los estudiantes realizar pedidos anticipados al kiosco escolar, seleccionando productos del menú, personalizando sus pedidos y eligiendo el horario de retiro durante los recreos. Los kiosqueros pueden gestionar los pedidos en tiempo real, mientras que los administradores tienen control total sobre usuarios, horarios y reportes.

### Roles del Sistema

1. **Ciclo Básico** - Estudiantes de 1° a 3° año
2. **Ciclo Superior** - Estudiantes de 4° a 7° año
3. **Kiosquero** - Personal del kiosco que prepara y entrega pedidos
4. **Administrador** - Gestión completa del sistema

---

## Características Principales

### Para Estudiantes
- Navegación intuitiva del menú con categorías
- Búsqueda de productos
- Personalización de productos (ensaladas con ingredientes a elección)
- Selección de horario de retiro según recreos disponibles
- Múltiples métodos de pago (tarjeta, MercadoPago, efectivo)
- Interfaz responsive para móviles y tablets
- Historial completo de pedidos
- Sistema de reseñas y calificaciones
- Gestión de perfil personal

### Para Kiosqueros
- Dashboard en tiempo real de pedidos activos
- Gestión de estados de pedidos (pendiente → en preparación → listo → entregado)
- Control de inventario con alertas de stock bajo
- Análisis de ventas y productos más vendidos
- Visualización de reseñas de clientes
- Sistema de reportes de usuarios problemáticos

### Para Administradores
- Gestión completa de usuarios (crear, editar, eliminar)
- Sistema de sanciones (advertencias, suspensiones temporales, bans permanentes)
- Configuración de horarios de recreo por ciclo
- Reportes y estadísticas del sistema
- Revisión de reportes de usuarios
- Acceso a todas las reseñas del sistema

---

## Tecnologías Utilizadas

### Frontend
- **React 18.3** - Biblioteca de UI
- **TypeScript 5.5** - Tipado estático
- **React Router DOM 6.26** - Enrutamiento
- **TailwindCSS 3.4** - Estilos
- **Lucide React** - Iconos
- **Recharts 3.1** - Gráficos y visualizaciones
- **jsPDF 2.5** - Generación de PDFs
- **Vite 5.4** - Build tool y dev server

### Backend
- **Supabase** - Base de datos PostgreSQL y autenticación
- **Row Level Security (RLS)** - Seguridad a nivel de filas

---

## Requisitos Previos

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- Cuenta en **Supabase** (gratuita)
- Editor de código (recomendado: VS Code)

---

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/LautaTuzzio/Kiosco
cd Kiosco
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales del proyecto

#### 3.2 Ejecutar Migraciones

En el panel de Supabase, ve a **SQL Editor** y ejecuta los archivos de migración en orden desde la carpeta `supabase/migrations/`.

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Reemplaza los valores con los de tu proyecto de Supabase (disponibles en **Project Settings → API**).

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El sistema estará disponible en `http://localhost:5173`

### 6. Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| usuario@ciclobasico.com | $2a$10$dummy.hash.for.demo123 | Ciclo Básico |
| usuario@ciclosuperior.com | $2a$10$dummy.hash.for.demo123 | Ciclo Superior |
| usuario@kiosquero.com | $2a$10$dummy.hash.for.demo123 | Kiosquero |
| usuario@admin.com | $2a$10$dummy.hash.for.demo123 | Administrador |

---

## Manual de Usuario

### Para Estudiantes (Ciclo Básico y Ciclo Superior)

#### 1. Iniciar Sesión
1. Abre la aplicación en tu navegador
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar Sesión"

#### 2. Explorar el Menú
- **Categorías disponibles**: Todos, Ensaladas, Tostados, Sándwiches, Bebidas, Empanadas
- Usa la **barra de búsqueda** para encontrar productos específicos
- Haz clic en las categorías para filtrar productos

#### 3. Agregar Productos al Carrito
1. Haz clic en un producto
2. Si es personalizable (como ensaladas):
   - Selecciona los ingredientes que deseas
   - Elige condimentos
   - Haz clic en "Agregar al Carrito"
3. Para productos estándar, haz clic directamente en "Agregar al Carrito"

#### 4. Revisar y Modificar el Carrito
1. Haz clic en el **ícono del carrito** (esquina inferior derecha)
2. Revisa los productos agregados
3. Puedes aumentar/disminuir cantidades o eliminar productos

#### 5. Realizar el Pedido
1. En el carrito, haz clic en "Proceder al Pago"
2. Selecciona el **horario de retiro** según tu ciclo
3. Elige el **método de pago**: Tarjeta, MercadoPago o Efectivo
4. Revisa el resumen del pedido
5. Haz clic en "Confirmar Pedido"

#### 6. Seguimiento del Pedido
Después de confirmar, verás:
- **Número de pedido** (ej: ORD-001)
- Horario de retiro
- Total a pagar
- Opción para descargar comprobante en PDF

#### 7. Ver Historial de Pedidos
1. Ve a **"Mis Pedidos"** en el menú lateral
2. Verás todos tus pedidos con estado, fecha y detalles

#### 8. Dejar Reseñas
1. En "Mis Pedidos", busca pedidos entregados
2. Haz clic en "Dejar Reseña"
3. Selecciona calificación (1-5 estrellas)
4. Escribe un comentario opcional
5. Envía la reseña

#### 9. Gestionar Perfil
1. Ve a **"Mi Perfil"** en el menú
2. Actualiza: nombre, email, teléfono, dirección, curso, contacto de emergencia
3. Guarda los cambios

---

### Para Kiosqueros

#### 1. Dashboard de Pedidos
Al iniciar sesión verás el **Panel de Órdenes** con todos los pedidos del día en tiempo real.

#### 2. Gestionar Pedidos

**Estados de un pedido:**
1. **Pendiente** → Pedido recibido
2. **En Preparación** → Pedido en proceso
3. **Listo** → Pedido terminado
4. **Entregado** → Pedido completado
5. **Cancelado** → Pedido cancelado

**Acciones:**
- Haz clic en **"Iniciar Preparación"** para cambiar estado
- Haz clic en **"Marcar como Listo"** cuando termines
- Haz clic en **"Marcar como Entregado"** al entregar
- Usa **"Cancelar"** si hay problemas

#### 3. Filtrar Pedidos
- Usa los botones de horario en la parte superior
- Filtra por recreo específico o ve todos

#### 4. Reportar Usuarios
1. Haz clic en el ícono de alerta (⚠️) junto al nombre del cliente
2. Completa el formulario de reporte
3. Envía al administrador

#### 5. Gestión de Inventario
1. Ve a **"Inventario"** en el menú lateral
2. Visualiza stock, precios y disponibilidad

**Acciones disponibles:**
- **Agregar Producto**: Crear nuevos productos
- **Editar Producto**: Modificar detalles
- **Ajustar Stock**: Aumentar o disminuir cantidades
- **Cambiar Disponibilidad**: Activar/desactivar
- **Eliminar Producto**: Borrar del sistema

#### 6. Registrar Movimientos de Inventario
1. Haz clic en "Ajustar Stock"
2. Selecciona tipo: Restock, Ajuste o Merma
3. Ingresa cantidad y razón
4. Confirma

#### 7. Ver Análisis de Ventas
1. Ve a **"Análisis"** en el menú lateral
2. Visualiza:
   - Ventas diarias
   - Productos más vendidos
   - Pedidos por horario
   - Métodos de pago
   - Estadísticas generales

#### 8. Revisar Reseñas
1. Ve a **"Reseñas"** en el menú lateral
2. Visualiza calificaciones y comentarios de clientes

---

### Para Administradores

#### 1. Gestión de Usuarios
1. Ve a **"Usuarios"** en el menú lateral
2. Visualiza estadísticas generales

**Crear Usuario:**
1. Haz clic en **"Nuevo Usuario"**
2. Completa: nombre, email, rol, contraseña
3. Crea el usuario

**Editar Usuario:**
1. Haz clic en el ícono de edición (✏️)
2. Modifica campos
3. Guarda cambios

**Eliminar Usuario:**
1. Haz clic en el ícono de eliminar (🗑️)
2. Confirma (no puedes eliminar tu propia cuenta)

#### 2. Sistema de Sanciones

**Tipos:**
- **Advertencia**: Notificación sin restricciones
- **Suspensión Temporal**: Bloqueo por horas determinadas
- **Ban Permanente**: Bloqueo indefinido

**Aplicar Sanción:**
1. Haz clic en el ícono de sanción (🚫)
2. Selecciona tipo y duración
3. Escribe la razón
4. Aplica la sanción

#### 3. Configuración de Horarios de Recreo
1. Ve a **"Horarios de Recreo"**
2. Gestiona horarios por ciclo:
   - Activar/Desactivar con switch
   - Agregar nuevos horarios
   - Eliminar horarios existentes

**Horarios predeterminados:**
- **Ciclo Básico**: 9:35, 11:55, 14:55
- **Ciclo Superior**: 11:55, 14:55, 17:15, 19:35

#### 4. Gestión de Reportes
1. Ve a **"Reportes"** en el menú lateral
2. Revisa reportes de usuarios
3. Agrega notas administrativas
4. Cambia estado: Pendiente → Revisado → Resuelto
5. Aplica sanciones si es necesario

#### 5. Ver Reseñas
1. Accede a todas las reseñas del sistema
2. Filtra por calificación, fecha o usuario
3. Evalúa satisfacción general

---

## Estructura del Proyecto

```
Kiosco/
├── src/
│   ├── components/
│   │   ├── admin/           # Componentes de administración
│   │   ├── auth/            # Autenticación
│   │   ├── common/          # Componentes compartidos
│   │   ├── kiosco/          # Componentes del kiosquero
│   │   ├── layout/          # Layout y navegación
│   │   └── student/         # Componentes de estudiantes
│   ├── contexts/            # Contextos de React
│   ├── lib/                 # Utilidades y configuración
│   ├── types/               # Tipos de TypeScript
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── supabase/
│   └── migrations/          # Migraciones de base de datos
├── .env                     # Variables de entorno
├── package.json
└── README.md
```

---

## Base de Datos

### Tablas Principales

- **users**: Información de usuarios
- **products**: Catálogo de productos
- **orders**: Pedidos realizados
- **order_items**: Ítems de cada pedido
- **inventory_logs**: Movimientos de inventario
- **analytics_daily**: Análisis diarios
- **reviews**: Reseñas y calificaciones
- **reports**: Reportes de usuarios
- **sanctions**: Sanciones aplicadas
- **break_times_config**: Horarios de recreo

### Seguridad (RLS)

- **Estudiantes**: Solo acceso a sus propios datos
- **Kiosqueros**: Acceso a pedidos e inventario
- **Administradores**: Acceso completo

---

## Solución de Problemas

### Error: "Missing Supabase environment variables"
**Solución**: Verifica que el archivo `.env` existe y contiene las variables correctas. Reinicia el servidor.

### Error al Iniciar Sesión
**Solución**: Verifica que las migraciones se ejecutaron y los usuarios de prueba existen en la base de datos.

### Productos No Aparecen
**Solución**: Verifica conexión a Supabase, que los productos tienen `is_available = true` y revisa políticas RLS.

### Stock No Se Actualiza
**Solución**: Verifica que el trigger `trigger_update_inventory_on_order` existe en Supabase.

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

## Soporte

Para soporte o consultas, contacta al equipo de desarrollo o abre un issue en el repositorio.
