<script setup>
// src/views/AdminSectionsView.vue
import { ref, onMounted, computed } from 'vue' // <-- Se añade 'computed' aquí
import * as sectionService from '@/services/admin/sectionService'
import { useToast } from 'vue-toastification'
import SkeletonLoader from '@/components/shared/SkeletonLoader.vue'

// 1. FALTA IMPORTAR draggable
import draggable from 'vuedraggable'

// Importamos los componentes y los íconos necesarios
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ToggleSwitch from '@/components/shared/ToggleSwitch.vue'
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon, Bars3Icon } from '@heroicons/vue/24/outline'


// --- ESTADO PRINCIPAL (sin cambios) ---
const sections = ref([])
const selectedSection = ref(null)
const productsInSection = ref([])
const availableProducts = ref([])
const loading = ref({
  sections: false,
  products: false
})
const newSectionName = ref('')
const toast = useToast()
const editingSectionId = ref(null)
const editingSectionName = ref('')
const sectionToDelete = ref(null)
const showDeleteModal = ref(false)

// 2. FALTA LA PROPIEDAD COMPUTADA PARA EL v-model
const draggableSections = computed({
  get() {
    return sections.value
  },
  set(newValue) {
    // Cuando draggable reordena, actualiza nuestro array 'sections'
    sections.value = newValue
  }
})


// --- LÓGICA ---

async function fetchSections() {
  loading.value.sections = true
  try {
    sections.value = await sectionService.getSections()
  } catch (error) { console.error(error); toast.error('Error al cargar las secciones.') }
  finally { loading.value.sections = false }
}

async function handleOrderChange() {
  try {
    await sectionService.updateSectionsOrder(sections.value)
    toast.success('Orden de las secciones guardado.')
  } catch (error) {
    console.error(error)
    toast.error('No se pudo guardar el nuevo orden.')
    await fetchSections()
  }
}

// ... El resto de tus funciones están perfectas y no necesitan cambios ...
async function selectSection(section) {
  if (editingSectionId.value) return
  selectedSection.value = section
  loading.value.products = true
  try {
    const [inSection, available] = await Promise.all([
      sectionService.getProductsInSection(section.id),
      sectionService.getAvailableProducts(section.id)
    ])
    productsInSection.value = inSection
    availableProducts.value = available
  } catch (error) {
    console.error(error)
    toast.error('Error al cargar los productos.')
  } finally {
    loading.value.products = false
  }
}

async function handleCreateSection() {
  if (!newSectionName.value.trim()) return
  try {
    const newSection = await sectionService.createSection(newSectionName.value.trim())
    sections.value.push(newSection)
    newSectionName.value = ''
    toast.success('Sección creada con éxito.')
  } catch (error) {
    console.error(error)
    toast.error('Error al crear la sección.')
  }
}

async function handleToggleStatus(section) {
  try {
    await sectionService.updateSection(section.id, { activo: section.activo })
    toast.success(`Sección ${section.activo ? 'activada' : 'desactivada'}.`)
  } catch (error) {
    section.activo = !section.activo
    console.error(error)
    toast.error('Error al cambiar el estado de la sección.')
  }
}

async function addProduct(product) {
  if (!selectedSection.value) return
  try {
    await sectionService.addProductToSection(product.id, selectedSection.value.id)
    productsInSection.value.push(product)
    availableProducts.value = availableProducts.value.filter(p => p.id !== product.id)
    toast.success('Producto agregado con éxito.')

  } catch (error) { console.error(error); toast.error('Error al agregar el producto.') }
}

async function removeProduct(product) {
  if (!selectedSection.value) return
  try {
    await sectionService.removeProductFromSection(product.id, selectedSection.value.id)
    availableProducts.value.push(product)
    productsInSection.value = productsInSection.value.filter(p => p.id !== product.id)
    toast.success('Producto quitado con éxito.')
  } catch (error) { console.error(error); toast.error('Error al quitar el producto.') }
}

function startEditing(section) {
  editingSectionId.value = section.id
  editingSectionName.value = section.nombre
}

function cancelEditing() {
  editingSectionId.value = null
  editingSectionName.value = ''
}

async function handleUpdateSectionName(section) {
  if (!editingSectionName.value.trim()) return
  try {
    await sectionService.updateSection(section.id, { nombre: editingSectionName.value.trim() })
    section.nombre = editingSectionName.value.trim()
    toast.success('Sección actualizada con éxito.')
    cancelEditing()
  } catch (error) { console.error(error); toast.error('Error al actualizar la sección.') }
}

function promptDeleteSection(section) {
  sectionToDelete.value = section
  showDeleteModal.value = true
}


async function handleDeleteSection() {
  if (!sectionToDelete.value) return
  try {
    await sectionService.deleteSection(sectionToDelete.value.id)
    sections.value = sections.value.filter(s => s.id !== sectionToDelete.value.id)
    if (selectedSection.value?.id === sectionToDelete.value.id) {
      selectedSection.value = null
    }
    toast.success('Sección eliminada con éxito.')
  } catch (error) {
    console.error(error); toast.error('Error al eliminar la sección.')
  } finally {
    showDeleteModal.value = false
    sectionToDelete.value = null
  }
}

onMounted(fetchSections)
</script>

<template>
  <div class="p-4 md:p-6">
    <h1 class="text-3xl font-bold mb-6 text-brand-morado">Gestión de Secciones del Catálogo</h1>

    <div class="flex flex-col lg:flex-row gap-8">

      <div class="w-full lg:w-1/3 bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-bold mb-4">Secciones</h2>
        <div class="flex items-center gap-2 mb-4">
          <input type="text" v-model="newSectionName" placeholder="Nombre de la sección"
            class="w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
          <button @click="handleCreateSection" class="bg-brand-fucsia text-white p-2 rounded-md hover:bg-opacity-90">
            <PlusIcon class="w-6 h-6" />
          </button>
        </div>

        <draggable v-if="!loading.sections" v-model="draggableSections" item-key="id" tag="ul" class="space-y-2"
          handle=".handle" @end="handleOrderChange">
          <template #item="{ element: section }">
            <li class="p-3 rounded-md transition-colors border border-gray-200 flex items-center gap-2" :class="{
              'bg-pink-200': selectedSection?.id === section.id && !editingSectionId,
              'hover:border-gray-300 hover:bg-gray-100': !editingSectionId
            }">
              <Bars3Icon class="w-6 h-6 text-gray-400 cursor-move handle" />
              <div class="flex-grow" @click="selectSection(section)" :class="{ 'cursor-pointer': !editingSectionId }">
                <div v-if="editingSectionId !== section.id" class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="font-semibold mr-2">{{ section.nombre }}</span>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <ToggleSwitch v-model="section.activo" @update:modelValue="handleToggleStatus(section)"
                      @click.stop />
                    <button @click.stop="startEditing(section)"
                      class="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md">
                      <PencilSquareIcon class="w-5 h-5" />
                    </button>
                    <button @click.stop="promptDeleteSection(section)"
                      class="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md">
                      <TrashIcon class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <input type="text" v-model="editingSectionName"
                    class="w-full p-2 border border-brand-fucsia rounded-md text-sm">
                  <button @click.stop="handleUpdateSectionName(section)"
                    class="p-1 text-green-500 hover:text-green-600 hover:bg-green-200 rounded-md">
                    <CheckIcon class="w-6 h-6" />
                  </button>
                  <button @click.stop="cancelEditing"
                    class="p-1 text-red-500 hover:text-red-600 hover:bg-red-200 rounded-md">
                    <XMarkIcon class="w-6 h-6" />
                  </button>
                </div>
              </div>
            </li>
          </template>
        </draggable>

        <div v-else>
          <SkeletonLoader v-for="n in 3" :key="n" class="h-16 w-full mb-2" />
        </div>
      </div>

      <div class="w-full lg:w-2/3 bg-white p-4 md:p-6 rounded-lg shadow-md">
        <div v-if="!selectedSection">
          <p class="text-gray-500 text-center py-10">Selecciona una sección de la izquierda para empezar a añadir
            productos.
          </p>
        </div>
        <div v-else>
          <h2 class="text-xl font-bold mb-4">Editando: <span class="text-brand-fucsia">{{ selectedSection.nombre
              }}</span>
          </h2>
          <div v-if="loading.products" class="text-center py-10">Cargando productos...</div>
          <div v-else class="flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-1/2">
              <h3 class="font-semibold mb-2">Productos en esta sección ({{ productsInSection.length }})</h3>
              <ul class="h-96 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md border">
                <li v-for="product in productsInSection" :key="product.id"
                  class="flex items-center gap-3 p-2 bg-white rounded shadow">
                  <img :src="product.foto_url" class="w-10 h-10 object-cover rounded flex-shrink-0">
                  <span class="flex-grow text-sm">{{ product.nombre }}</span>
                  <button @click="removeProduct(product)"
                    class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">-</button>
                </li>
              </ul>
            </div>
            <div class="w-full md:w-1/2">
              <h3 class="font-semibold mb-2">Productos disponibles ({{ availableProducts.length }})</h3>
              <ul class="h-96 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md border">
                <li v-for="product in availableProducts" :key="product.id"
                  class="flex items-center gap-3 p-2 bg-white rounded shadow">
                  <img :src="product.foto_url" class="w-10 h-10 object-cover rounded flex-shrink-0">
                  <span class="flex-grow text-sm">{{ product.nombre }}</span>
                  <button @click="addProduct(product)"
                    class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">+</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal :show="showDeleteModal" title="Confirmar Eliminación"
      message="¿Estás seguro de que quieres eliminar esta sección? Esta acción no se puede deshacer."
      @confirm="handleDeleteSection" @cancel="showDeleteModal = false" />
  </div>
</template>
