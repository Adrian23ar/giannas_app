# Gianna's Cookies - Aplicación de E-commerce 🍪

Bienvenido al repositorio oficial de la aplicación de comercio electrónico para Gianna's Cookies. Este proyecto es una solución web completa que incluye un catálogo de productos para clientes y un panel de administración para la gestión de la tienda.

**Enlace a la demo en vivo:** `https://giannascookies.netlify.app`

-----

## ✨ Características Principales

Este proyecto se divide en dos áreas principales: la plataforma orientada al cliente y un panel de control para la administración del negocio.

### 🛍️ Plataforma para Clientes

  * **Autenticación de Usuarios**: Registro, inicio de sesión (con credenciales o Google), y recuperación de contraseña.
  * **Catálogo de Productos**: Navegación de productos con búsqueda por texto, filtrado por categorías y rango de precios.
  * **Carrito de Compras Persistente**: El carrito se guarda para usuarios registrados y se sincroniza entre dispositivos. Para invitados, se utiliza el almacenamiento local del navegador.
  * **Sistema de Cupones**: Aplicación de códigos de descuento en el carrito de compras.
  * **Proceso de Checkout**: Formulario de información del cliente, selección de método de entrega (retiro en tienda o a domicilio con mapa interactivo) y selección de métodos de pago.
  * **Seguimiento de Pedidos**: Los clientes pueden ver el estado actual de sus pedidos.
  * **Pedidos Especiales**: Un formulario dedicado para solicitar cotizaciones de productos para eventos, con verificación reCAPTCHA para evitar spam.
  * **Diseño Responsivo**: Experiencia de usuario optimizada para dispositivos móviles y de escritorio.

### 🔐 Panel de Administración

  * **Dashboard Interactivo**: Visualización de métricas clave como ingresos totales, ventas del día, pedidos pendientes y gráficos de ventas por período.
  * **Gestión de Productos (CRUD)**: Creación, lectura, actualización y eliminación de productos, incluyendo la subida de imágenes.
  * **Gestión de Categorías (CRUD)**: Administración de las categorías de los productos.
  * **Gestión de Cupones (CRUD)**: Creación y manejo de cupones de descuento (porcentaje o monto fijo).
  * **Administración de Pedidos**: Visualización detallada de todos los pedidos, con la capacidad de actualizar su estado (ej. Pendiente, En Preparación, Listo para Entrega, etc.).
  * **Gestión de Contenido**: Posibilidad de editar las secciones y productos destacados que aparecen en la página principal.
  * **Notificaciones en Tiempo Real**: Alertas sobre nuevos pedidos y pedidos especiales.

-----

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con un stack de tecnologías modernas, separando claramente el frontend del backend.

  * **Frontend**:

      * **Framework**: [Vue.js 3](https://vuejs.org/) (usando Composition API)
      * **Build Tool**: [Vite](https://vitejs.dev/)
      * **Enrutamiento**: [Vue Router](https://router.vuejs.org/)
      * **Manejo de Estado**: [Pinia](https://pinia.vuejs.org/)
      * **Estilos CSS**: [Tailwind CSS](https://tailwindcss.com/)
      * **Gráficos**: [Chart.js](https://www.chartjs.org/)
      * **Mapas**: [Leaflet.js](https://leafletjs.com/)
      * **Notificaciones**: [Vue Toastification](https://github.com/Maronato/vue-toastification)

  * **Backend (BaaS - Backend as a Service)**:

      * **Plataforma**: [Supabase](https://supabase.io/)
      * **Base de Datos**: PostgreSQL
      * **Autenticación**: Supabase Auth (manejo de usuarios y roles)
      * **Almacenamiento**: Supabase Storage (para imágenes de productos)
      * **Funciones Serverless**: Supabase Edge Functions (escritas en TypeScript/Deno) para tareas como:
          * Verificación de reCAPTCHA.
          * Obtención y almacenamiento de la tasa de cambio del dólar.
          * Envío de correos electrónicos (próximamente).

-----

## 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

  * [Node.js](https://nodejs.org/) (versión 18.x o superior)
  * [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
  * Una cuenta de [Supabase](https://supabase.io/) para configurar la base de datos y el backend.

### Instalación

1.  **Clona el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/giannas_app.git
    cd giannas_app
    ```

2.  **Instala las dependencias del proyecto:**

    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto, copiando el contenido de `.env.example` (si existe) o usando la siguiente plantilla. Deberás obtener estas claves desde el dashboard de tu proyecto en Supabase y Google reCAPTCHA.

    ```env
    # Claves de Supabase (Dashboard -> Project Settings -> API)
    VITE_SUPABASE_URL="TU_URL_DE_SUPABASE"
    VITE_SUPABASE_ANON_KEY="TU_CLAVE_ANON_DE_SUPABASE"

    # Clave de Google reCAPTCHA (consola de reCAPTCHA v2)
    VITE_RECAPTCHA_SITE_KEY="TU_SITE_KEY_DE_RECAPTCHA"
    ```

4.  **Configura el backend en Supabase:**
    Para que las funciones del lado del servidor funcionen, necesitarás desplegar las Edge Functions que se encuentran en la carpeta `supabase/functions` usando la [CLI de Supabase](https://supabase.com/docs/guides/cli).

    ```bash
    # Inicia sesión en Supabase (requiere Docker)
    supabase login

    # Vincula tu proyecto local con el proyecto remoto
    supabase link --project-ref TU_ID_DE_PROYECTO

    # Despliega las funciones
    supabase functions deploy
    ```

5.  **Ejecuta el servidor de desarrollo:**
    La aplicación estará disponible en `http://localhost:5173`.

    ```bash
    npm run dev
    ```

6.  **Compila para producción:**
    Genera una versión optimizada del sitio en la carpeta `dist`.

    ```bash
    npm run build
    ```

-----

## 📁 Estructura del Proyecto

El código fuente está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

```
src/
├── assets/         # Archivos estáticos como CSS e imágenes
├── components/     # Componentes de Vue reutilizables (botones, modales, tarjetas)
├── composables/    # Lógica reutilizable (ej. useRecaptcha)
├── layouts/        # Componentes de diseño base (AdminLayout, ClientLayout)
├── router/         # Configuración de las rutas de la aplicación
├── services/       # Lógica de negocio y comunicación con Supabase
├── stores/         # Módulos de estado de Pinia (userStore, cartStore)
├── utils/          # Funciones de utilidad (formateadores de moneda/fecha)
├── views/          # Componentes de página principal (una vista por ruta)
├── App.vue         # Componente raíz de la aplicación
├── main.js         # Punto de entrada de la aplicación
└── supabase.js     # Configuración del cliente de Supabase
```

-----

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

-----

Creado por **Adrian Rincon**. ¡No dudes en contactarme\!
