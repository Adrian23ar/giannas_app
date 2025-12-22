// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

// Los Layouts se pueden mantener con importación estática, ya que son la base
import AdminLayout from '../layouts/AdminLayout.vue'
import ClientLayout from '../layouts/ClientLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- RUTAS DEL CLIENTE ---
    {
      path: '/',
      component: ClientLayout,
      children: [
        { 
          path: '', 
          name: 'catalog', 
          component: () => import('../views/client/CatalogView.vue')
        },
        { 
          path: 'cart', 
          name: 'cart', 
          component: () => import('../views/client/CartView.vue') 
        },
        { 
          path: 'checkout', 
          name: 'checkout', 
          component: () => import('../views/client/CheckoutView.vue') 
        },
        { 
          path: 'confirmation/:orderId', 
          name: 'confirmation', 
          component: () => import('../views/client/OrderConfirmationView.vue') 
        },
        { 
          path: 'seguimiento', 
          name: 'tracking', 
          component: () => import('../views/client/TrackingView.vue') 
        },
        { 
          path: 'ingresar', 
          name: 'client-login', 
          component: () => import('../views/client/LoginView.vue') 
        },
        { 
          path: 'registro', 
          name: 'client-register', 
          component: () => import('../views/client/RegisterView.vue') 
        },
        { 
          path: 'olvide-clave', 
          name: 'forgot-password', 
          component: () => import('../views/client/ForgotPasswordView.vue') 
        },
        { 
          path: 'actualizar-clave', 
          name: 'update-password', 
          component: () => import('../views/client/UpdatePasswordView.vue') 
        },
        { 
          path: 'mi-cuenta', 
          name: 'account', 
          component: () => import('../views/client/AccountView.vue') 
        },
      ],
    },

    // --- RUTAS DEL ADMINISTRADOR ---
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/LoginView.vue'),
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { 
          path: '', 
          name: 'admin-dashboard', 
          component: () => import('../views/admin/DashboardView.vue') 
        },
        { 
          path: 'productos', 
          name: 'Productos', 
          component: () => import('../views/admin/ProductosView.vue') 
        },
        { 
          path: 'categorias', 
          name: 'Categorias', 
          component: () => import('../views/admin/CategoriasView.vue') 
        },
        { 
          path: 'pedidos', 
          name: 'Pedidos', 
          component: () => import('../views/admin/PedidosView.vue') 
        },
        { 
          path: 'cupones', 
          name: 'Cupones', 
          component: () => import('../views/admin/CuponesView.vue') 
        },
        { 
          path: 'metodos-pago', 
          name: 'Metodos de Pago', 
          component: () => import('../views/admin/PaymentsView.vue') 
        },
        { 
          path: 'tasa-de-cambio', 
          name: 'Tasa de Cambio', 
          component: () => import('../views/admin/ExchangeRateView.vue') 
        },
        { 
          path: 'secciones', 
          name: 'Secciones', 
          component: () => import('../views/admin/SectionsView.vue') 
        },
        { 
          path: 'configuracion', 
          name: 'Configuracion', 
          component: () => import('../views/admin/ConfigView.vue') 
        }
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (userStore.user === undefined) {
    await userStore.fetchUser()
  }

  const isLoggedIn = userStore.isLoggedIn
  const isAdmin = userStore.userRole === 'admin'

  // Regla 1: Si intenta ir al LOGIN DE ADMIN
  if (to.name === 'admin-login') {
    if (isLoggedIn && isAdmin) {
      return next('/admin') // Si es admin, lo llevamos a su dashboard
    }
    if (isLoggedIn && !isAdmin) {
      return next('/') // Si es cliente, lo llevamos al catálogo
    }
  }

  // Regla 2: Si intenta ir a RUTAS DE ADMIN PROTEGIDAS
  if (to.meta.requiresAuth) {
    if (isLoggedIn && isAdmin) {
      return next() // Es admin, puede pasar
    } else {
      return next({ name: 'admin-login' }) // No es admin o no está logueado, al login
    }
  }

  // Regla 3: Si un cliente logueado intenta ir al LOGIN/REGISTRO de cliente
  if ((to.name === 'client-login' || to.name === 'client-register') && isLoggedIn && !isAdmin) {
    return next('/') // Ya está logueado, va al catálogo
  }

  next()
})

export default router
