import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'

// Importamos todos los layouts y vistas que usaremos
import AdminLayout from '../layouts/AdminLayout.vue'
import ClientLayout from '../layouts/ClientLayout.vue' // <-- Nuevo Layout

import LoginView from '../views/LoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminProductosView from '../views/AdminProductosView.vue'
import AdminCategoriasView from '../views/AdminCategoriasView.vue'
import CatalogView from '../views/CatalogView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import OrderConfirmationView from '../views/OrderConfirmationView.vue'
import AdminPedidosView from '../views/AdminPedidosView.vue'
import TrackingView from '../views/TrackingView.vue'; // <-- Importa la nueva vista
import AdminCuponesView from '../views/AdminCuponesView.vue'; // <-- Importa la nueva vista

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
      ],
    },

    // --- RUTAS DEL ADMINISTRADOR ---
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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

// El vigilante de rutas se mantiene igual
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/admin')
  } else {
    next()
  }
})

export default router
