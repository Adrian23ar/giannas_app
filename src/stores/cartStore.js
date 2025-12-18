// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useUserStore } from './userStore'
import { validateCoupon } from '@/services/couponService'
import { fetchCart, upsertCartItem, removeCartItem, clearUserCart } from '@/services/cartService'

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  const items = ref([])
  const recentlyAddedId = ref(null)
  const appliedCoupon = ref(null)
  const discountAmount = ref(0)
  const shippingCost = ref(0)

  // --- GETTERS ---
  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => {
      return total + (item.precio * item.quantity)
    }, 0)
  })

  const finalTotal = computed(() => {
    // 2. MODIFICADO: Sumamos el envío al total final
    const total = subtotal.value - discountAmount.value + shippingCost.value
    return total < 0 ? 0 : total
  })

  // Helper para comparar variantes (simple comparación de objetos)
  const areVariantsEqual = (v1, v2) => {
    return JSON.stringify(v1 || {}) === JSON.stringify(v2 || {})
  }

  // --- ACTIONS ---

  async function initializeCart() {
    if (userStore.isLoggedIn) {
      items.value = await fetchCart(userStore.user.id)
    } else {
      const localCart = localStorage.getItem('guestCart')
      items.value = localCart ? JSON.parse(localCart) : []
    }
  }

  // MODIFICADO: Ahora acepta 'variants' y compara profundamente
  async function addToCart(product, quantity = 1, variants = {}) {
    // Buscamos si ya existe el producto CON LAS MISMAS variantes
    const existingItem = items.value.find(item =>
      item.id === product.id && areVariantsEqual(item.variants, variants)
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      // Si no existe esa combinación, creamos nueva línea
      items.value.push({
        ...product,
        quantity,
        variants
      })
    }

    if (userStore.isLoggedIn) {
      // Obtenemos el item actualizado (o nuevo) para sincronizar
      const itemToSync = items.value.find(i => i.id === product.id && areVariantsEqual(i.variants, variants))
      await upsertCartItem(userStore.user.id, product.id, itemToSync.quantity, variants)
    }

    // Feedback visual
    recentlyAddedId.value = product.id
    setTimeout(() => {
      recentlyAddedId.value = null
    }, 1000)
  }

  async function removeFromCart(cartItemIndex) {
    // Usamos el índice del array porque el ID del producto ya no es único en la lista
    const itemToRemove = items.value[cartItemIndex]
    if (!itemToRemove) return

    items.value.splice(cartItemIndex, 1)

    if (userStore.isLoggedIn) {
      await removeCartItem(userStore.user.id, itemToRemove.id, itemToRemove.variants)
    }
  }

  async function updateQuantity(cartItemIndex, newQuantity) {
    const item = items.value[cartItemIndex]
    if (!item) return

    if (newQuantity < 1) {
      removeFromCart(cartItemIndex)
    } else {
      item.quantity = newQuantity
      if (userStore.isLoggedIn) {
        await upsertCartItem(userStore.user.id, item.id, newQuantity, item.variants)
      }
    }
  }

  async function clearCart() {
    if (userStore.isLoggedIn) {
      await clearUserCart(userStore.user.id)
    }
    items.value = []
    removeCoupon()
    setShippingCost(0) // Limpiamos envío también
  }

  function setShippingCost(amount) {
    shippingCost.value = amount
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
    initializeCart()
  });

  return {
    items,
    recentlyAddedId,
    appliedCoupon,
    discountAmount,
    shippingCost,
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
    setShippingCost
  }
})
