<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore() // Usamos nuestro store del carrito
const productos = ref([])
const cargando = ref(true)

async function obtenerProductos() {
  try {
    cargando.value = true
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    productos.value = data
  } catch (error) {
    console.error('Error al obtener productos:', error)
  } finally {
    cargando.value = false
  }
}

onMounted(obtenerProductos)
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-2">Nuestro Dulce Catálogo</h1>
    <p class="text-gray-600 mb-8">Elige tus galletas favoritas y añádelas al carrito.</p>

    <div v-if="cargando" class="text-center py-12">
      <p class="text-gray-500">Cargando delicias...</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <div v-for="producto in productos" :key="producto.id"
        class="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
        <img :src="producto.foto_url" :alt="producto.nombre" class="w-full h-56 object-cover">
        <div class="p-4">
          <h2 class="text-xl font-bold text-gray-800">{{ producto.nombre }}</h2>
          <p class="text-brand-morado font-semibold text-lg mt-1">${{ producto.precio.toFixed(2) }}</p>
          <p class="text-gray-600 text-sm mt-2 h-14">{{ producto.descripcion }}</p>
          <button @click="cartStore.addToCart(producto)"
            class="w-full mt-4 bg-brand-fucsia text-white font-bold py-2 rounded-md hover:bg-opacity-90 transition-colors">
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
