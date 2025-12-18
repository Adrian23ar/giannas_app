<script setup>
// src/views/AdminProductosView.vue
import { ref, onMounted } from 'vue'
import { getAllProductsWithCategory, createProduct, updateProduct, toggleProductStatus, calculateProductStats } from '@/services/productService'
import { supabase } from '../supabase'

// 1. IMPORTAR COMPRESOR
import imageCompression from 'browser-image-compression';

import StatCard from '@/components/StatCard.vue'
import CustomButton from '@/components/CustomButton.vue'
import EmptyState from '@/components/EmptyState.vue';
import ProductListItem from '@/components/ProductListItem.vue'
import { PlusIcon, TrashIcon, PencilSquareIcon, XCircleIcon, CubeIcon, ChevronDownIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { useToast } from 'vue-toastification'

const toast = useToast()

// --- ESTADO PARA LAS ESTADÍSTICAS ---
const stats = ref({
  totalProducts: 0,
  inventoryValue: 0,
  lowStockCount: 0,
})

// --- ESTADO DE LA VISTA ---
const productos = ref([])
const categorias = ref([])
const cargando = ref(true)
const modoEdicion = ref(false)
const productoAEditar = ref(null)
const formAbierto = ref(false)
const nuevoProducto = ref({ nombre: '', descripcion: '', precio: 0, stock: 0, categoria_id: null })
const variantesConfig = ref([])
const archivoImagen = ref(null)

// ... (Tus funciones de variantes: agregarGrupoVariante, eliminarGrupoVariante, agregarOpcion, eliminarOpcion se quedan igual) ...

function agregarGrupoVariante() {
  variantesConfig.value.push({
    titulo: '', min: 0, max: 1, opciones: [], nuevaOpcionTemp: ''
  })
}
function eliminarGrupoVariante(index) {
  variantesConfig.value.splice(index, 1)
}
function agregarOpcion(grupoIndex) {
  const grupo = variantesConfig.value[grupoIndex]
  if (grupo.nuevaOpcionTemp && grupo.nuevaOpcionTemp.trim() !== '') {
    grupo.opciones.push(grupo.nuevaOpcionTemp.trim())
    grupo.nuevaOpcionTemp = ''
  }
}
function eliminarOpcion(grupoIndex, opIndex) {
  variantesConfig.value[grupoIndex].opciones.splice(opIndex, 1)
}

async function obtenerDatosIniciales() {
  cargando.value = true
  try {
    const { data: cats } = await supabase.from('categorias').select('id, nombre')
    categorias.value = cats

    const productList = await getAllProductsWithCategory()
    productos.value = productList
    stats.value = calculateProductStats(productList)
  } catch (error) {
    toast.error('Error al cargar los datos iniciales.')
  } finally {
    cargando.value = false
  }
}

// 2. FUNCIÓN DE SELECCIÓN DE ARCHIVO MODIFICADA
async function manejarSeleccionArchivo(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validar
  if (!file.type.startsWith('image/')) {
    toast.error('Por favor sube un archivo de imagen válido')
    return
  }

  try {
    // COMPRESIÓN
    const options = {
      maxSizeMB: 0.3,          // Meta: Máximo 300KB
      maxWidthOrHeight: 1024,  // Redimensionar a máximo 1024px
      useWebWorker: true,
      fileType: 'image/webp'   // Formato ligero
    }

    console.log(`Original: ${(file.size / 1024).toFixed(0)} KB`)
    const compressedFile = await imageCompression(file, options);
    console.log(`Comprimido: ${(compressedFile.size / 1024).toFixed(0)} KB`)

    // Guardamos el archivo ya comprimido
    archivoImagen.value = compressedFile
    toast.success(`Imagen optimizada (${(compressedFile.size / 1024).toFixed(0)} KB)`)

  } catch (error) {
    console.error('Error al comprimir imagen:', error)
    toast.error('Error al procesar la imagen')
  }
}

function resetearFormulario() {
  nuevoProducto.value = { nombre: '', descripcion: '', precio: 0, stock: 0, categoria_id: null }
  archivoImagen.value = null
  if (document.getElementById('file-input')) {
    document.getElementById('file-input').value = ''
  }
  variantesConfig.value = []
  modoEdicion.value = false
  productoAEditar.value = null
  formAbierto.value = false
}

async function guardarProducto() {
  try {
    const variantesParaGuardar = variantesConfig.value.map(({ nuevaOpcionTemp, ...resto }) => resto)

    const datosProducto = {
      ...nuevoProducto.value,
      configuracion_variantes: variantesParaGuardar
    }

    // Aquí 'archivoImagen.value' ya tiene la versión comprimida gracias a manejarSeleccionArchivo
    if (modoEdicion.value) {
      const dataActualizado = await updateProduct(
        productoAEditar.value.id,
        datosProducto,
        archivoImagen.value,
        productoAEditar.value.foto_url
      )
      const index = productos.value.findIndex(p => p.id === dataActualizado.id)
      if (index !== -1) productos.value[index] = dataActualizado
    } else {
      const nuevo = await createProduct(datosProducto, archivoImagen.value)
      productos.value.push(nuevo)
    }

    stats.value = calculateProductStats(productos.value)
    toast.success(modoEdicion.value ? '¡Producto actualizado!' : '¡Producto creado con éxito!')
    resetearFormulario()
  } catch (error) {
    console.log(error);
    toast.error('Ocurrió un error al guardar el producto.')
  }
}

async function handleToggleStatus(producto) {
  try {
    const productoActualizado = await toggleProductStatus(producto.id, producto.activo)
    const index = productos.value.findIndex(p => p.id === producto.id)
    if (index !== -1) {
      productos.value[index] = productoActualizado
    }
    toast.success(`Producto ${productoActualizado.activo ? 'activado' : 'desactivado'}.`)
  } catch (error) {
    toast.error('Error al cambiar el estado del producto.')
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

  if (producto.configuracion_variantes) {
    variantesConfig.value = JSON.parse(JSON.stringify(producto.configuracion_variantes)).map(grupo => ({
      ...grupo,
      nuevaOpcionTemp: ''
    }))
  } else {
    variantesConfig.value = []
  }

  formAbierto.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(obtenerDatosIniciales)
</script>

<template>
  <div>
    <div v-if="productos.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatCard title="Total Productos" :value="stats.totalProducts" bgColorClass="bg-blue-100"
        iconColorClass="text-blue-600">
        <CubeIcon class="h-6 w-6" />
      </StatCard>
      <StatCard title="Valor Inventario" :value="`$${stats.inventoryValue.toFixed(2)}`" bgColorClass="bg-green-100"
        iconColorClass="text-green-600">
        <BanknotesIcon class="h-6 w-6" />
      </StatCard>
      <StatCard title="Bajo Stock (<5)" :value="stats.lowStockCount" bgColorClass="bg-red-100"
        iconColorClass="text-red-600">
        <ExclamationTriangleIcon class="h-6 w-6" />
      </StatCard>
    </div>
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
          <div class="border-t pt-6 mt-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-700">Personalización (Sabores/Toppings)</h3>
              <button v-if="variantesConfig.length === 0" type="button" @click="agregarGrupoVariante"
                class="text-sm flex items-center gap-1 text-brand-fucsia font-bold hover:underline">
                <PlusIcon class="h-4 w-4" /> Agregar Grupo
              </button>
            </div>

            <div class="space-y-4">
              <div v-for="(grupo, index) in variantesConfig" :key="index"
                class="bg-slate-50 p-4 rounded-lg border border-gray-200 relative">

                <button type="button" @click="eliminarGrupoVariante(index)"
                  class="absolute top-2 right-2 text-red-400 hover:text-red-600" title="Eliminar grupo">
                  <TrashIcon class="h-5 w-5" />
                </button>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div class="md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 mb-1">Título (ej: Elige Sabores)</label>
                    <input type="text" v-model="grupo.titulo" placeholder="Título del grupo"
                      class="w-full p-2 border rounded text-sm">
                  </div>
                  <div class="grid grid-cols-2 gap-2 md:col-span-2">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">Mínimo (0 = Opcional)</label>
                      <input type="number" v-model.number="grupo.min" min="0" class="w-full p-2 border rounded text-sm">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-500 mb-1">Máximo</label>
                      <input type="number" v-model.number="grupo.max" min="1" class="w-full p-2 border rounded text-sm">
                    </div>
                  </div>
                </div>

                <div class="bg-white p-3 rounded border">
                  <label class="block text-xs font-bold text-gray-500 mb-2">Opciones disponibles</label>

                  <div class="flex flex-wrap gap-2 mb-3">
                    <span v-for="(opcion, opIndex) in grupo.opciones" :key="opIndex"
                      class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {{ opcion }}
                      <button type="button" @click="eliminarOpcion(index, opIndex)"
                        class="hover:text-red-600 font-bold ml-1">×</button>
                    </span>
                    <span v-if="grupo.opciones.length === 0" class="text-xs text-gray-400 italic">
                      Sin opciones agregadas aún.
                    </span>
                  </div>

                  <div class="flex gap-2">
                    <input type="text" v-model="grupo.nuevaOpcionTemp" @keydown.enter.prevent="agregarOpcion(index)"
                      placeholder="Escribe una opción (ej: Chocolate)"
                      class="flex-grow p-1 px-2 border rounded text-sm bg-gray-50 focus:bg-white">
                    <button type="button" @click="agregarOpcion(index)"
                      class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-bold">
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Imagen del Producto</label>
            <input type="file" @change="manejarSeleccionArchivo" id="file-input" accept="image/*"
              class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-rosa-palo file:text-white hover:file:bg-brand-fucsia cursor-pointer transition-all">
            <p v-if="modoEdicion" class="text-xs text-gray-500 mt-1">Deja este campo vacío si no quieres cambiar la
              imagen actual.</p>
          </div>
          <div class="flex flex-col md:flex-row md:justify-end md:items-center gap-4 pt-4 border-t">
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
          @toggleStatus="handleToggleStatus" />
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
