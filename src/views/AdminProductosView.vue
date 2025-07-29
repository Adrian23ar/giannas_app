<script setup>
import { ref, onMounted } from 'vue'
// Importaciones de nuestro nuevo servicio
import { getProductsWithCategory, createProduct, updateProduct, deleteProduct } from '@/services/productService'
import { supabase } from '../supabase'

// Importaciones de componentes e íconos...
import CustomButton from '@/components/CustomButton.vue'
import EmptyState from '@/components/EmptyState.vue';
import ProductListItem from '@/components/ProductListItem.vue'
import { PlusIcon, PencilSquareIcon, XCircleIcon, CubeIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { useToast } from 'vue-toastification'
import ConfirmModal from '@/components/ConfirmModal.vue' // <-- Importamos el modal

const toast = useToast()
// --- ESTADO DE LA VISTA ---
const productos = ref([])
const categorias = ref([])
const cargando = ref(true)
const modoEdicion = ref(false)
const productoAEditar = ref(null)
const formAbierto = ref(false)
const nuevoProducto = ref({ nombre: '', descripcion: '', precio: 0, stock: 0, categoria_id: null })
const archivoImagen = ref(null)

// --- ESTADO PARA MODAL DE CONFIRMACIÓN ---
const showConfirmModal = ref(false)
const productToDelete = ref(null)

// --- LÓGICA ---
async function obtenerDatosIniciales() {
  try {
    cargando.value = true
    // Obtenemos categorías (esto lo moveremos a su propio servicio después)
    const { data: cats } = await supabase.from('categorias').select('id, nombre')
    categorias.value = cats

    // Usamos nuestro nuevo servicio para obtener los productos
    productos.value = await getProductsWithCategory()
  } catch (error) {
    alert(error || 'Error al cargar los datos iniciales.')
  } finally {
    cargando.value = false
  }
}

function manejarSeleccionArchivo(event) {
  archivoImagen.value = event.target.files[0]
}

function resetearFormulario() {
  nuevoProducto.value = { nombre: '', descripcion: '', precio: 0, stock: 0, categoria_id: null }
  archivoImagen.value = null
  if (document.getElementById('file-input')) {
    document.getElementById('file-input').value = ''
  }
  modoEdicion.value = false
  productoAEditar.value = null
  formAbierto.value = false
}

async function guardarProducto() {
  try {
    if (modoEdicion.value) {
      // Usamos el servicio de actualización
      const dataActualizado = await updateProduct(
        productoAEditar.value.id,
        nuevoProducto.value,
        archivoImagen.value,
        productoAEditar.value.foto_url
      )
      const index = productos.value.findIndex(p => p.id === dataActualizado.id)
      if (index !== -1) productos.value[index] = dataActualizado
    } else {
      // Usamos el servicio de creación
      const nuevo = await createProduct(nuevoProducto.value, archivoImagen.value)
      productos.value.push(nuevo)
    }
    toast.success(modoEdicion.value ? '¡Producto actualizado!' : '¡Producto creado con éxito!')
    resetearFormulario()
  } catch (error) {
    toast.error('Ocurrió un error al guardar el producto.')
  }
}

// --- LÓGICA DE ELIMINACIÓN ACTUALIZADA ---

// 1. Esta función abre el modal
function promptEliminarProducto(producto) {
  productToDelete.value = producto
  showConfirmModal.value = true
}

// 2. Esta función se ejecuta si el usuario confirma en el modal
async function handleEliminarProducto() {
  if (!productToDelete.value) return
  try {
    await deleteProduct(productToDelete.value)
    productos.value = productos.value.filter(p => p.id !== productToDelete.value.id)
    toast.success(`Producto "${productToDelete.value.nombre}" eliminado.`)
  } catch (error) {
    toast.error('Ocurrió un error al eliminar el producto.')
  } finally {
    showConfirmModal.value = false
    productToDelete.value = null
  }
}

function iniciarEdicion(producto) {
  modoEdicion.value = true
  productoAEditar.value = producto
  nuevoProducto.value = {
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    stock: producto.stock,
    categoria_id: producto.categoria_id,
  }
  formAbierto.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(obtenerDatosIniciales)
</script>

<template>
  <div>
    <div class="mt-6 bg-white rounded-lg shadow-md">
      <button @click="formAbierto = !formAbierto"
        class="w-full flex justify-between items-center p-4 font-bold text-lg text-white bg-brand-fucsia rounded-t-lg">
        <span>{{ modoEdicion ? 'Editando Producto Existente' : '+ Añadir Nuevo Producto' }}</span>
        <ChevronDownIcon class="h-6 w-6 transition-transform" :class="formAbierto && 'rotate-180'" />
      </button>

      <Transition name="slide-fade">
        <form v-if="formAbierto" @submit.prevent="guardarProducto" class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Nombre del Producto</span>
              <input type="text" v-model="nuevoProducto.nombre"
                class="mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Categoría</span>
              <select v-model="nuevoProducto.categoria_id"
                class="mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
                <option :value="null" disabled>Selecciona una categoría</option>
                <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
              </select>
            </label>
          </div>
          <label class="block">
            <span class="text-gray-700 font-medium text-sm">Descripción</span>
            <textarea v-model="nuevoProducto.descripcion" rows="3"
              class="mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50"></textarea>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Precio ($)</span>
              <input type="number" step="0.01" v-model="nuevoProducto.precio"
                class="mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Stock</span>
              <input type="number" v-model="nuevoProducto.stock"
                class="mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Imagen del Producto</label>
            <input type="file" @change="manejarSeleccionArchivo" id="file-input" accept="image/*"
              class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-rosa-palo file:text-white hover:file:bg-brand-fucsia cursor-pointer transition-all">
            <p v-if="modoEdicion" class="text-xs text-gray-500 mt-1">Deja este campo vacío si no quieres cambiar la
              imagen actual.</p>
          </div>
          <div class="flex justify-end items-center gap-4 pt-4 border-t">
            <CustomButton v-if="modoEdicion" @click="resetearFormulario" variant="secondary">
              <XCircleIcon class="h-5 w-5" />
              Cancelar
            </CustomButton>
            <CustomButton type="submit">
              <PlusIcon v-if="!modoEdicion" class="h-5 w-5" />
              <PencilSquareIcon v-else class="h-5 w-5" />
              {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Producto' }}
            </CustomButton>
          </div>
        </form>
      </Transition>
    </div>
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-bold text-gray-700">Productos Existentes</h2>
      <p class="text-sm text-gray-500 mb-4">Gestiona tu inventario actual de productos.</p>
      <div v-if="cargando" class="space-y-4">
        <div v-for="n in 3" :key="n" class="flex items-center gap-4 p-4 border rounded-lg">
          <SkeletonLoader class="w-16 h-16 rounded-md flex-shrink-0" />
          <div class="flex-grow space-y-2">
            <SkeletonLoader class="h-4 w-3/4" />
            <SkeletonLoader class="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <ul v-else-if="productos.length > 0" class="space-y-4">
        <ProductListItem v-for="producto in productos" :key="producto.id" :product="producto" @edit="iniciarEdicion"
          @delete="promptEliminarProducto" />
      </ul>
      <EmptyState v-else title="Aún no hay productos"
        message="Empieza añadiendo tu primer producto para que aparezca aquí.">
        <template #icon>
          <CubeIcon class="h-8 w-8 text-gray-400" />
        </template>
        <template #action>
          <CustomButton @click="formAbierto = true">
            <PlusIcon class="h-5 w-5" />
            Añadir Producto
          </CustomButton>
        </template>
      </EmptyState>
    </div>
  </div>
  <ConfirmModal
      :show="showConfirmModal"
      title="Confirmar Eliminación de Producto"
      :message="`¿Estás seguro de que quieres eliminar '${productToDelete?.nombre}'? Esta acción es permanente.`"
      @confirm="handleEliminarProducto"
      @cancel="showConfirmModal = false"
    />
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
