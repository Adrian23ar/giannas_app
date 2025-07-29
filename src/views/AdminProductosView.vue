<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

// --- ESTADO ---
const productos = ref([])
const categorias = ref([])
const cargando = ref(true)
const modoEdicion = ref(false)
const productoAEditar = ref(null)
const formAbierto = ref(false)

const nuevoProducto = ref({
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  categoria_id: null,
})
const archivoImagen = ref(null)

// --- LÓGICA (Sin cambios) ---
async function obtenerDatosIniciales() {
  try {
    cargando.value = true
    const { data: dataCategorias, error: errorCategorias } = await supabase.from('categorias').select('id, nombre')
    if (errorCategorias) throw errorCategorias
    categorias.value = dataCategorias
    const { data: dataProductos, error: errorProductos } = await supabase.from('productos').select(`*, categorias (nombre)`)
    if (errorProductos) throw errorProductos
    productos.value = dataProductos
  } catch (error) {
    console.error('Error al cargar datos:', error.message)
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
  if (modoEdicion.value) {
    actualizarProducto()
  } else {
    crearProducto()
  }
}

async function crearProducto() {
  if (!nuevoProducto.value.nombre || nuevoProducto.value.precio <= 0 || !nuevoProducto.value.categoria_id || !archivoImagen.value) {
    alert('Por favor, completa Nombre, Precio, Categoría y selecciona una imagen.')
    return
  }
  try {
    const extensionArchivo = archivoImagen.value.name.split('.').pop()
    const nombreArchivo = `${Date.now()}.${extensionArchivo}`
    await supabase.storage.from('imagenes-productos').upload(`public/${nombreArchivo}`, archivoImagen.value)
    const { data: dataUrl } = supabase.storage.from('imagenes-productos').getPublicUrl(`public/${nombreArchivo}`)
    const productoParaGuardar = { ...nuevoProducto.value, foto_url: dataUrl.publicUrl, precio: parseFloat(nuevoProducto.value.precio.toFixed(2)) }
    const { data: dataProducto, error: errorProducto } = await supabase.from('productos').insert(productoParaGuardar).select(`*, categorias (nombre)`).single()
    if (errorProducto) throw errorProducto
    productos.value.push(dataProducto)
    resetearFormulario()
  } catch (error) {
    console.error('Error al crear producto:', error.message)
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

async function actualizarProducto() {
  try {
    let urlImagenActualizada = productoAEditar.value.foto_url;
    if (archivoImagen.value) {
      const urlAntigua = productoAEditar.value.foto_url;
      const rutaAntigua = `public/${urlAntigua.split('/').pop()}`;
      const extensionArchivo = archivoImagen.value.name.split('.').pop();
      const nombreArchivo = `${Date.now()}.${extensionArchivo}`;
      const nuevaRuta = `public/${nombreArchivo}`;
      await supabase.storage.from('imagenes-productos').upload(nuevaRuta, archivoImagen.value);
      const { data: dataUrl } = supabase.storage.from('imagenes-productos').getPublicUrl(nuevaRuta);
      urlImagenActualizada = dataUrl.publicUrl;
      if (rutaAntigua) {
        await supabase.storage.from('imagenes-productos').remove([rutaAntigua]);
      }
    }
    const datosParaActualizar = { ...nuevoProducto.value, foto_url: urlImagenActualizada, precio: parseFloat(nuevoProducto.value.precio.toFixed(2)) };
    const { data: dataActualizado, error } = await supabase.from('productos').update(datosParaActualizar).eq('id', productoAEditar.value.id).select(`*, categorias (nombre)`).single();
    if (error) throw error;
    const index = productos.value.findIndex(p => p.id === dataActualizado.id);
    if (index !== -1) productos.value[index] = dataActualizado;
    resetearFormulario();
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
  }
}

async function eliminarProducto(producto) {
  if (!confirm(`¿Seguro que quieres eliminar "${producto.nombre}"?`)) return
  try {
    const nombreArchivo = producto.foto_url.split('/').pop()
    await supabase.storage.from('imagenes-productos').remove([`public/${nombreArchivo}`])
    await supabase.from('productos').delete().eq('id', producto.id)
    productos.value = productos.value.filter(p => p.id !== producto.id)
  } catch (error) {
    console.error('Error al eliminar producto:', error.message)
  }
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
            <button v-if="modoEdicion" @click="resetearFormulario" type="button"
              class="inline-flex items-center gap-2 bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-md hover:bg-gray-300 transition-colors">
              <XCircleIcon class="h-5 w-5" />
              Cancelar
            </button>
            <button type="submit"
              class="inline-flex items-center gap-2 bg-brand-fucsia hover:bg-brand-fucsia-dark text-white font-bold py-2 px-6 rounded-md transition-all">
              <PlusIcon v-if="!modoEdicion" class="h-5 w-5" />
              <PencilSquareIcon v-else class="h-5 w-5" />
              {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Producto' }}
            </button>
          </div>
        </form>
      </Transition>
    </div>
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-bold text-gray-700">Productos Existentes</h2>
      <p class="text-sm text-gray-500 mb-4">Gestiona tu inventario actual de productos.</p>
      <div v-if="cargando" class="text-center p-4">Cargando...</div>
      <ul v-else class="space-y-4">
        <li v-for="producto in productos" :key="producto.id"
          class="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
          <img :src="producto.foto_url" alt="" class="w-16 h-16 rounded-md object-cover bg-gray-200" />
          <div class="flex-grow">
            <p class="font-bold text-gray-800">{{ producto.nombre }}</p>
            <p class="text-sm text-gray-500">{{ producto.categorias.nombre }}</p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500">Stock</p>
            <p class="font-bold" :class="producto.stock < 5 ? 'text-red-500' : 'text-gray-700'">{{ producto.stock }}</p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500">Precio</p>
            <p class="font-bold text-gray-700">${{ producto.precio.toFixed(2) }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="iniciarEdicion(producto)"
              class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md">
              <PencilSquareIcon class="h-5 w-5" />
            </button>
            <button @click="eliminarProducto(producto)"
              class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md">
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </li>
      </ul>
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
