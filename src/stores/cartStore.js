// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useUserStore } from './userStore' // Importamos el userStore
import { validateCoupon } from '@/services/couponService'
import { fetchCart, upsertCartItem, removeCartItem, clearUserCart } from '@/services/cartService'

export const useCartStore = defineStore('cart', () => {
  // --- ESTADO ---
  const userStore = useUserStore()
  const items = ref([])
  const recentlyAddedId = ref(null)
  const appliedCoupon = ref(null) // Guardará el cupón válido
  const discountAmount = ref(0)   // Guardará el monto del descuento

  // --- GETTERS (Propiedades Calculadas) ---
  const totalItems = computed(() => items.value.length)

  // Renombramos 'totalPrice' a 'subtotal'
  const subtotal = computed(() => {
    return items.value.reduce((total, item) => {
      return total + (item.precio * item.quantity)
    }, 0)
  })

  // Nuevo getter para el total final con descuento
  const finalTotal = computed(() => {
    const total = subtotal.value - discountAmount.value
    return total < 0 ? 0 : total // Asegura que el total no sea negativo
  })

  // --- ACTIONS (Funciones) ---

  // Nueva función para cargar el carrito inicial
  async function initializeCart() {
    if (userStore.isLoggedIn) {
      // Si el usuario tiene sesión, carga el carrito desde la DB
      items.value = await fetchCart(userStore.user.id)
    } else {
      // Si es un invitado, carga el carrito desde LocalStorage
      const localCart = localStorage.getItem('guestCart')
      items.value = localCart ? JSON.parse(localCart) : []
    }
  }

  // Observador: recalcula el descuento automáticamente si el carrito cambia
  watch(items, recalculateDiscount, { deep: true });

  async function addToCart(product) {
    const existingProduct = items.value.find(item => item.id === product.id)
    if (existingProduct) {
      existingProduct.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }

    if (userStore.isLoggedIn) {
      // Sincronizar con la DB
      const item = items.value.find(i => i.id === product.id)
      await upsertCartItem(userStore.user.id, item.id, item.quantity)
    }
    recentlyAddedId.value = product.id
    setTimeout(() => {
      recentlyAddedId.value = null
    }, 1000)
  }

  async function removeFromCart(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
      if (userStore.isLoggedIn) {
        await removeCartItem(userStore.user.id, productId)
      }
    }
  }

  async function updateQuantity(productId, newQuantity) {
    const product = items.value.find(item => item.id === productId)
    if (!product) return

    if (newQuantity < 1) {
      removeFromCart(productId)
    } else {
      product.quantity = newQuantity
      if (userStore.isLoggedIn) {
        await upsertCartItem(userStore.user.id, productId, newQuantity)
      }
    }
  }


  // clearCart ahora también limpia el cupón
  async function clearCart() {
    if (userStore.isLoggedIn) {
      await clearUserCart(userStore.user.id)
    }
    items.value = []
    removeCoupon()
  }

  function recalculateDiscount() {
    if (!appliedCoupon.value) return;

    let discount = 0;
    if (appliedCoupon.value.tipo === 'porcentaje') {
      discount = subtotal.value * (appliedCoupon.value.valor / 100);
    } else { // tipo 'fijo'
      discount = appliedCoupon.value.valor;
    }
    // El descuento no puede ser mayor que el subtotal
    discountAmount.value = Math.min(discount, subtotal.value);
  }
  // Nueva acción para aplicar el cupón
  async function applyCoupon(code) {
    const coupon = await validateCoupon(code) // Llama al servicio que valida
    appliedCoupon.value = coupon // Guarda el cupón si es válido
    recalculateDiscount() // Calcula el descuento inicial
    return coupon // Devuelve el cupón para mostrar un mensaje de éxito
  }

  // Nueva acción para quitar el cupón
  function removeCoupon() {
    appliedCoupon.value = null
    discountAmount.value = 0
  }

  // Observador para guardar el carrito de invitado en LocalStorage
  watch(items, (newItems) => {
    if (!userStore.isLoggedIn) {
      localStorage.setItem('guestCart', JSON.stringify(newItems))
    }
    recalculateDiscount()
  }, { deep: true });

  // Observador para cargar el carrito cuando el usuario inicia sesión
  watch(() => userStore.isLoggedIn, (isLoggedIn) => {
    if (isLoggedIn) {
      // Lógica para migrar el carrito local a la DB (opcional pero recomendado)
      // Por ahora, simplemente cargamos el carrito de la DB
      initializeCart()
    } else {
      // Si cierra sesión, volvemos a un carrito local
      initializeCart()
    }
  });

  // 3. Exponemos los nuevos estados y acciones
  return {
    items,
    recentlyAddedId,
    appliedCoupon,
    discountAmount,
    totalItems,
    subtotal,      // <- Renombrado
    finalTotal,    // <- Nuevo
    initializeCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,   // <- Nuevo
    removeCoupon,  // <- Nuevo
  }
})
