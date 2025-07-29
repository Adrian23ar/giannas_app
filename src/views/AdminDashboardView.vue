<script setup>
import { onMounted, ref, computed } from 'vue'
import { supabase } from '../supabase'
import { CubeIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const productos = ref([])
const cargando = ref(true)

// Función para obtener los datos de los productos
async function obtenerProductos() {
  try {
    cargando.value = true
    const { data, error } = await supabase.from('productos').select('precio, stock')
    if (error) throw error
    productos.value = data
  } catch (error) {
    console.error('Error al obtener productos:', error.message)
  } finally {
    cargando.value = false
  }
}

// Datos calculados para las tarjetas
const totalProductos = computed(() => productos.value.length)
const valorInventario = computed(() =>
  productos.value.reduce((total, producto) => total + (producto.precio * producto.stock), 0)
)
const bajoStock = computed(() =>
  productos.value.filter(producto => producto.stock < 5).length
)

onMounted(obtenerProductos)
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Total Productos</p>
          <p class="text-3xl font-bold text-gray-800">{{ totalProductos }}</p>
        </div>
        <div class="bg-blue-100 text-blue-600 p-3 rounded-full">
          <CubeIcon class="h-6 w-6" />
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Valor Inventario</p>
          <p class="text-3xl font-bold text-gray-800">${{ valorInventario.toFixed(2) }}</p>
        </div>
        <div class="bg-green-100 text-green-600 p-3 rounded-full">
          <BanknotesIcon class="h-6 w-6" />
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Bajo Stock (&lt;5)</p>
          <p class="text-3xl font-bold text-gray-800">{{ bajoStock }}</p>
        </div>
        <div class="bg-red-100 text-red-600 p-3 rounded-full">
          <ExclamationTriangleIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
      <p class="text-gray-600 mt-2">Usa el menú de la izquierda para gestionar tu tienda.</p>
    </div>
  </div>
</template>
