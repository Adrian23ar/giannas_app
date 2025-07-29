<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'

// --- ESTADO REACTIVO ---
const categorias = ref([])
const nuevaCategoriaNombre = ref('')
const cargando = ref(false)
const errorMsg = ref('')

// --- LÓGICA ---

// 1. Función para OBTENER todas las categorías
async function obtenerCategorias() {
  try {
    cargando.value = true
    errorMsg.value = ''
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error

    categorias.value = data
  } catch (error) {
    console.error('Error al obtener categorías:', error.message)
    errorMsg.value = 'No se pudieron cargar las categorías.'
  } finally {
    cargando.value = false
  }
}

// 2. Función para AÑADIR una nueva categoría
async function agregarCategoria() {
  if (nuevaCategoriaNombre.value.trim() === '') {
    alert('Por favor, escribe un nombre para la categoría.')
    return
  }

  try {
    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre: nuevaCategoriaNombre.value.trim() })
      .select()
      .single() // .single() para obtener un solo objeto en lugar de un array

    if (error) throw error

    categorias.value.push(data)
    nuevaCategoriaNombre.value = ''
    // Quitamos la alerta para una mejor experiencia de usuario
  } catch (error) {
    console.error('Error al agregar categoría:', error.message)
    alert('Hubo un error al guardar la categoría.')
  }
}

// 3. Función para ELIMINAR una categoría (¡NUEVO!)
async function eliminarCategoria(id) {
  // Pedimos confirmación para evitar borrados accidentales
  if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return

  try {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Eliminamos la categoría de la lista local para actualizar la vista
    categorias.value = categorias.value.filter(cat => cat.id !== id)
  } catch (error) {
    console.error('Error al eliminar categoría:', error.message)
    alert('Hubo un error al eliminar la categoría.')
  }
}

// 4. Función para EDITAR una categoría (¡NUEVO!)
async function editarCategoria(categoria) {
  const nuevoNombre = prompt('Introduce el nuevo nombre para la categoría:', categoria.nombre)

  if (nuevoNombre === null || nuevoNombre.trim() === '') return // El usuario canceló o no escribió nada

  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ nombre: nuevoNombre.trim() })
      .eq('id', categoria.id)
      .select()
      .single()

    if (error) throw error

    // Actualizamos la categoría en la lista local
    const index = categorias.value.findIndex(cat => cat.id === categoria.id)
    if (index !== -1) {
      categorias.value[index] = data
    }
  } catch (error) {
    console.error('Error al editar categoría:', error.message)
    alert('Hubo un error al editar la categoría.')
  }
}

// Se ejecuta al cargar el componente
onMounted(obtenerCategorias)
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Gestionar Categorías</h1>

    <form @submit.prevent="agregarCategoria" class="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Añadir Nueva Categoría</h2>
      <div class="flex items-center gap-4">
        <input type="text" v-model="nuevaCategoriaNombre" placeholder="Ej: Galletas Clásicas"
          class="flex-grow p-2 border border-gray-300 rounded-md focus-within:outline-none focus:ring-1 focus:ring-brand-fucsia focus:border-brand-fucsia" />
        <button type="submit"
          class="bg-brand-fucsia text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90 transition-colors">
          Guardar
        </button>
      </div>
    </form>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Categorías Existentes</h2>
      <div v-if="cargando" class="text-gray-500">Cargando categorías...</div>
      <div v-else-if="errorMsg" class="text-red-500">{{ errorMsg }}</div>
      <ul v-else-if="categorias.length > 0" class="space-y-3">
        <li v-for="categoria in categorias" :key="categoria.id"
          class="bg-slate-100 p-3 rounded-md flex justify-between items-center border border-gray-300">
          <div>
            <p class="text-xs text-gray-500 mb-0">Nombre</p>
            <span class="text-gray-800">{{ categoria.nombre }}</span>
          </div>

          <div class="gap-2 flex">
            <button @click="editarCategoria(categoria)" class="text-xs flex items-center gap-1 transition-all text-white p-2 bg-blue-600 hover:bg-blue-800 rounded-md font-semibold">
              <PencilSquareIcon class="h-[1.15rem] w-[1.15rem]" />
              Editar
            </button>
            <button @click="eliminarCategoria(categoria.id)" class="text-xs flex items-center gap-1 transition-all text-white p-2 bg-red-600 hover:bg-red-800 rounded-md font-semibold">
              <TrashIcon class="h-[1.15rem] w-[1.15rem]" />
              Eliminar
            </button>
          </div>
        </li>
      </ul>
      <div v-else class="text-gray-500">Aún no has añadido ninguna categoría.</div>
    </div>
  </div>
</template>
