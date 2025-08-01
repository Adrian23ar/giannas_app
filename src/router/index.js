// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore' // <-- Importa el userStore

// Importamos todos los layouts y vistas que usaremos
import AdminLayout from '../layouts/AdminLayout.vue'
import ClientLayout from '../layouts/ClientLayout.vue'
import AdminLoginView from '../views/LoginView.vue' // Login del Administrador
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminProductosView from '../views/AdminProductosView.vue'
import AdminCategoriasView from '../views/AdminCategoriasView.vue'
import CatalogView from '../views/CatalogView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import OrderConfirmationView from '../views/OrderConfirmationView.vue'
import AdminPedidosView from '../views/AdminPedidosView.vue'
import TrackingView from '../views/TrackingView.vue';
import AdminCuponesView from '../views/AdminCuponesView.vue';
import ClientLoginView from '../views/ClientLoginView.vue'
import ClientRegisterView from '../views/ClientRegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import UpdatePasswordView from '../views/UpdatePasswordView.vue'
import AccountView from '../views/AccountView.vue'; // <-- Panel de usuario cliente

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- RUTAS DEL CLIENTE ---
    {
      path: '/',
      component: ClientLayout,
      children: [
        { path: '', name: 'catalog', component: CatalogView },
        { path: 'cart', name: 'cart', component: CartView },
        { path: 'checkout', name: 'checkout', component: CheckoutView },
        { path: 'confirmation/:orderId', name: 'confirmation', component: OrderConfirmationView },
        { path: 'seguimiento', name: 'tracking', component: TrackingView },
        { path: 'ingresar', name: 'client-login', component: ClientLoginView },
        { path: 'registro', name: 'client-register', component: ClientRegisterView },
        { path: 'olvide-clave', name: 'forgot-password', component: ForgotPasswordView },
        { path: 'actualizar-clave', name: 'update-password', component: UpdatePasswordView },
        { path: 'mi-cuenta', name: 'account', component: AccountView },

      ],
    },

    // --- RUTAS DEL ADMINISTRADOR ---
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'admin-dashboard', component: AdminDashboardView },
        { path: 'productos', name: 'admin-productos', component: AdminProductosView },
        { path: 'categorias', name: 'admin-categorias', component: AdminCategoriasView },
        { path: 'pedidos', name: 'admin-pedidos', component: AdminPedidosView },
        { path: 'cupones', name: 'admin-cupones', component: AdminCuponesView },

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
      return next('/') // ✨ CORRECCIÓN: Si es cliente, lo llevamos al catálogo
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
