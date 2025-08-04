// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useUserStore } from './userStore'
import { validateCoupon } from '@/services/couponService'
import { fetchCart, upsertCartItem, removeCartItem, clearUserCart } from '@/services/cartService'

export const useCartStore = defineStore('cart', () => {
  // --- ESTADO ---
  const userStore = useUserStore()
  const items = ref([])
  const recentlyAddedId = ref(null)
  const appliedCoupon = ref(null)
  const discountAmount = ref(0)

  // --- GETTERS ---
  const totalItems = computed(() => {
    // Ahora cuenta la cantidad total de productos, no solo de líneas de item
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => {
      return total + (item.precio * item.quantity)
    }, 0)
  })

  const finalTotal = computed(() => {
    const total = subtotal.value - discountAmount.value
    return total < 0 ? 0 : total
  })

  // --- ACTIONS ---

  async function initializeCart() {
    if (userStore.isLoggedIn) {
      items.value = await fetchCart(userStore.user.id)
    } else {
      const localCart = localStorage.getItem('guestCart')
      items.value = localCart ? JSON.parse(localCart) : []
    }
  }

  // ---------- INICIO DEL CAMBIO ----------
  // Modificamos addToCart para que acepte una cantidad. Por defecto es 1.
  async function addToCart(product, quantity = 1) {
    const existingProduct = items.value.find(item => item.id === product.id)
    if (existingProduct) {
      // Si el producto ya existe, sumamos la nueva cantidad
      existingProduct.quantity += quantity
    } else {
      // Si es nuevo, lo añadimos con la cantidad especificada
      items.value.push({ ...product, quantity })
    }

    if (userStore.isLoggedIn) {
      const item = items.value.find(i => i.id === product.id)
      await upsertCartItem(userStore.user.id, item.id, item.quantity)
    }

    // El feedback visual sigue funcionando igual
    recentlyAddedId.value = product.id
    setTimeout(() => {
      recentlyAddedId.value = null
    }, 1000)
  }
  // ---------- FIN DEL CAMBIO ----------

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
    } else {
      discount = appliedCoupon.value.valor;
    }
    discountAmount.value = Math.min(discount, subtotal.value);
  }

  async function applyCoupon(code) {
    const coupon = await validateCoupon(code)
    appliedCoupon.value = coupon
    recalculateDiscount()
    return coupon
  }

  function removeCoupon() {
    appliedCoupon.value = null
    discountAmount.value = 0
  }

  watch(items, (newItems) => {
    if (!userStore.isLoggedIn) {
      localStorage.setItem('guestCart', JSON.stringify(newItems))
    }
    recalculateDiscount()
  }, { deep: true });

  watch(() => userStore.isLoggedIn, (isLoggedIn) => {
    if (isLoggedIn) {
      initializeCart()
    } else {
      initializeCart()
    }
  });

  return {
    items,
    recentlyAddedId,
    appliedCoupon,
    discountAmount,
    totalItems,
    subtotal,
    finalTotal,
    initializeCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  }
})
