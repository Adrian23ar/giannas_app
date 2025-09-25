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
        // AQUÍ ESTÁ LA MAGIA: CADA VISTA SE CARGA BAJO DEMANDA
        { path: '', name: 'catalog', component: () => import('../views/CatalogView.vue') },
        { path: 'cart', name: 'cart', component: () => import('../views/CartView.vue') },
        { path: 'checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
        { path: 'confirmation/:orderId', name: 'confirmation', component: () => import('../views/OrderConfirmationView.vue') },
        { path: 'seguimiento', name: 'tracking', component: () => import('../views/TrackingView.vue') },
        { path: 'ingresar', name: 'client-login', component: () => import('../views/ClientLoginView.vue') },
        { path: 'registro', name: 'client-register', component: () => import('../views/ClientRegisterView.vue') },
        { path: 'olvide-clave', name: 'forgot-password', component: () => import('../views/ForgotPasswordView.vue') },
        { path: 'actualizar-clave', name: 'update-password', component: () => import('../views/UpdatePasswordView.vue') },
        { path: 'mi-cuenta', name: 'account', component: () => import('../views/AccountView.vue') },
        { path: 'pedidos-especiales', name: 'special-order', component: () => import('@/views/SpecialOrderView.vue') },
        { path: 'solicitud-confirmada', name: 'special-order-confirmation', component: () => import('@/views/OrderRequestConfirmation.vue') }
      ],
    },

    // --- RUTAS DEL ADMINISTRADOR ---
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/LoginView.vue'), // También aplicamos lazy-loading aquí
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        // Chart.js y otras librerías de admin solo se cargarán al entrar a estas rutas
        { path: '', name: 'admin-dashboard', component: () => import('../views/AdminDashboardView.vue') },
        { path: 'productos', name: 'Productos', component: () => import('../views/AdminProductosView.vue') },
        { path: 'categorias', name: 'Categorias', component: () => import('../views/AdminCategoriasView.vue') },
        { path: 'pedidos', name: 'Pedidos', component: () => import('../views/AdminPedidosView.vue') },
        { path: 'cupones', name: 'Cupones', component: () => import('../views/AdminCuponesView.vue') },
        { path: 'metodos-pago', name: 'Metodos de Pago', component: () => import('../views/AdminPaymentsView.vue') },
        { path: 'secciones', name: 'Secciones', component: () => import('@/views/AdminSectionsView.vue') },
        { path: 'pedidos-especiales', name: 'Pedidos Especiales', component: () => import('@/views/AdminSpecialOrdersView.vue') }
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
