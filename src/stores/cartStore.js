// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { validateCoupon } from '@/services/couponService' // 1. Importamos nuestro servicio

export const useCartStore = defineStore('cart', () => {
  // --- ESTADO ---
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

  // Función interna para recalcular el descuento
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

  // Observador: recalcula el descuento automáticamente si el carrito cambia
  watch(items, recalculateDiscount, { deep: true });

  function addToCart(product) {
    const existingProduct = items.value.find(item => item.id === product.id)
    if (existingProduct) {
      existingProduct.quantity += 1
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
    recentlyAddedId.value = product.id
    setTimeout(() => {
      recentlyAddedId.value = null
    }, 1000)
  }

  function removeFromCart(productId) {
    const index = items.value.findIndex(item => item.id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function updateQuantity(productId, newQuantity) {
    const product = items.value.find(item => item.id === productId)
    if (product) {
      if (newQuantity >= 1) {
        product.quantity = newQuantity
      } else {
        removeFromCart(productId)
      }
    }
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

  // clearCart ahora también limpia el cupón
  function clearCart() {
    items.value = []
    removeCoupon()
  }

  // 3. Exponemos los nuevos estados y acciones
  return {
    items,
    recentlyAddedId,
    appliedCoupon,
    discountAmount,
    totalItems,
    subtotal,      // <- Renombrado
    finalTotal,    // <- Nuevo
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,   // <- Nuevo
    removeCoupon,  // <- Nuevo
  }
})
