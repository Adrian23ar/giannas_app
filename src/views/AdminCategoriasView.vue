<script setup>
// src/views/AdminCategoriasView.vue
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService'
import { useToast } from 'vue-toastification' // <-- 1. IMPORTACIÓN AÑADIDA
import ConfirmModal from '@/components/ConfirmModal.vue'
import EditCategoryModal from '@/components/EditCategoryModal.vue' // <-- NUEVO
import EmptyState from '@/components/EmptyState.vue'
import CustomButton from '@/components/CustomButton.vue'
import CategoryListItem from '@/components/CategoryListItem.vue'
import { PlusIcon, TagIcon } from '@heroicons/vue/24/outline'
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const toast = useToast()
const categorias = ref([])
const nuevaCategoriaNombre = ref('')
const cargando = ref(false)

// --- NUEVOS REFS PARA EL MODAL ---
const showConfirmModal = ref(false)
const categoryToDelete = ref(null)

// --- NUEVO ESTADO PARA EL MODAL DE EDICIÓN ---
const showEditModal = ref(false)
const categoryToEdit = ref(null)

// --- Lógica de la vista (sin cambios) ---
async function obtenerCategorias() {
  cargando.value = true
  try {
    categorias.value = await getCategories()
  } catch (error) {
    toast.error('Hubo un error al obtener las categorías.')
  } finally {
    cargando.value = false
  }
}

async function agregarCategoria() {
  if (nuevaCategoriaNombre.value.trim() === '') return
  try {
    const nuevaCategoria = await createCategory(nuevaCategoriaNombre.value)
    categorias.value.push(nuevaCategoria)
    nuevaCategoriaNombre.value = ''
    toast.success('Categoría creada con éxito.')
  } catch (error) {
    toast.error('Hubo un error al agregar la categoría.')
  }
}


// --- NUEVA LÓGICA DE EDICIÓN ---
// Abre el modal de edición
function promptEditarCategoria(categoria) {
  categoryToEdit.value = categoria
  showEditModal.value = true
}

// Guarda los cambios desde el modal
async function handleUpdateCategory(nuevoNombre) {
  if (!categoryToEdit.value) return
  try {
    const categoriaActualizada = await updateCategory(categoryToEdit.value.id, nuevoNombre)
    const index = categorias.value.findIndex(cat => cat.id === categoryToEdit.value.id)
    if (index !== -1) {
      categorias.value[index] = categoriaActualizada
    }
    toast.success('Categoría actualizada con éxito.')
  } catch (error) {
    toast.error('Hubo un error al editar la categoría.')
  } finally {
    showEditModal.value = false
    categoryToEdit.value = null
  }
}

// Esta función AHORA solo abre el modal
function promptEliminarCategoria(categoria) {
  categoryToDelete.value = categoria
  showConfirmModal.value = true
}

// Esta es la nueva función que realmente borra la categoría
async function handleEliminarCategoria() {
  if (!categoryToDelete.value) return
  try {
    await deleteCategory(categoryToDelete.value.id)
    categorias.value = categorias.value.filter(cat => cat.id !== categoryToDelete.value.id)
    toast.success('Categoría eliminada.')
  } catch (error) {
    toast.error('Error al eliminar la categoría.')
  } finally {
    // Cierra el modal y resetea la variable
    showConfirmModal.value = false
    categoryToDelete.value = null
  }
}

onMounted(obtenerCategorias)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Gestionar Categorías</h1>
    <p class="text-sm text-gray-500 mb-6">Crea y administra las categorías para tus productos.</p>

    <div class="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Añadir Nueva Categoría</h2>
      <form @submit.prevent="agregarCategoria" class="flex flex-col md:flex-row md:items-center gap-4">
        <input type="text" v-model="nuevaCategoriaNombre" placeholder="Ej: Galletas Rellenas"
          class="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50" />
        <CustomButton type="submit">
          <PlusIcon class="h-5 w-5" />
          Guardar
        </CustomButton>
      </form>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Categorías Existentes</h2>
      <div v-if="cargando" class="space-y-3">
        <SkeletonLoader v-for="n in 3" :key="n" class="h-14 w-full" />
      </div>
      <ul v-else-if="categorias.length > 0" class="space-y-3">
        <CategoryListItem v-for="categoria in categorias" :key="categoria.id" :category="categoria"
          @edit="promptEditarCategoria" @delete="promptEliminarCategoria" />
      </ul>
      <EmptyState v-else title="Aún no hay categorías"
        message="Empieza añadiendo tu primera categoría para que aparezca aquí.">
        <template #icon>
          <TagIcon class="h-8 w-8 text-gray-400" />
        </template>
      </EmptyState>
    </div>

    <ConfirmModal :show="showConfirmModal" title="Confirmar Eliminación"
      :message="`¿Estás seguro de que quieres eliminar la categoría '${categoryToDelete?.nombre}'? Esta acción no se puede deshacer.`"
      @confirm="handleEliminarCategoria" @cancel="showConfirmModal = false" />

    <EditCategoryModal :show="showEditModal" :category="categoryToEdit" @close="showEditModal = false"
      @save="handleUpdateCategory" />
  </div>
</template>
