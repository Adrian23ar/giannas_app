// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  // --- GETTERS (Propiedades calculadas) ---
  const totalItems = computed(() => {
    return items.value.length
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      return total + (item.precio * item.quantity)
    }, 0)
  })

  // --- ACTIONS (Funciones para modificar el estado) ---
  function addToCart(product) {
    const existingProduct = items.value.find(item => item.id === product.id)
    if (existingProduct) {
      existingProduct.quantity += 1
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
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
      // Nos aseguramos de que la cantidad no sea menor que 1
      if (newQuantity >= 1) {
        product.quantity = newQuantity
      } else {
        // Si la cantidad llega a 0, eliminamos el producto
        removeFromCart(productId)
      }
    }
  }

  function clearCart() {
  items.value = []
}

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalPrice,
    clearCart
  }
})
