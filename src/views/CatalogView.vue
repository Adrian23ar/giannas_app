<script setup>
// src/views/CatalogView.vue
import { ref, onMounted, watch } from 'vue' // Usamos 'watch' para la reactividad
import { useCartStore } from '@/stores/cartStore'

// Importamos todos los servicios que necesitamos
import { getFilteredProducts } from '@/services/productService'
import { getActiveSectionsWithProducts } from '@/services/sectionService'
import { getCategories } from '@/services/categoryService'

// Importamos todos los componentes que usaremos en la vista
import ProductCard from '@/components/ProductCard.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'
import ProductSlider from '@/components/ProductSlider.vue'
import ProductFilters from '@/components/ProductFilters.vue'
import WelcomeModal from '@/components/WelcomeModal.vue'

// --- ESTADO PRINCIPAL DE LA VISTA ---
const cartStore = useCartStore()

// Datos para la UI
const sections = ref([])       // Para los sliders de secciones destacadas
const products = ref([])       // Para la cuadrícula de productos filtrados
const categories = ref([])     // Para pasarle al componente de filtros
const loading = ref({
  initial: true,      // Un loading para la carga inicial de toda la página
  products: false     // Un loading específico para cuando se aplican filtros
})
let debounceTimer = null

// Estado de los filtros: esta es la única fuente de verdad para la búsqueda
const filters = ref({
  searchTerm: '',
  categoryId: null,
  minPrice: 0,
  maxPrice: 100, // Puedes ajustar este valor máximo por defecto
})


// --- LÓGICA DE CARGA DE DATOS ---

// Esta función se ejecuta solo una vez, al montar el componente
async function fetchInitialData() {
  loading.value.initial = true
  try {
    // Pedimos todo en paralelo para máxima eficiencia
    const [sectionsData, productsData, categoriesData] = await Promise.all([
      getActiveSectionsWithProducts(),
      getFilteredProducts(filters.value), // Carga inicial de productos sin filtros
      getCategories()
    ])
    sections.value = sectionsData
    products.value = productsData
    categories.value = categoriesData
  } catch (error) {
    console.error('Error en la carga inicial de datos del catálogo:', error)
    // Aquí podrías mostrar un toast de error general
  } finally {
    loading.value.initial = false
  }
}

// Esta función se ejecuta CADA VEZ que los filtros cambian
async function applyFilters() {
  loading.value.products = true
  try {
    products.value = await getFilteredProducts(filters.value)
  } catch (error) {
    console.error('Error al aplicar filtros:', error)
  } finally {
    loading.value.products = false
  }
}


// --- OBSERVADOR DE FILTROS (EL CORAZÓN DE LA REACTIVIDAD) ---

// 'watch' vigila el objeto 'filters'. Si algo cambia, se ejecuta.
watch(filters, (newFilters) => {
  // Limpiamos cualquier temporizador previo para resetear la cuenta atrás
  clearTimeout(debounceTimer)

  // Creamos un nuevo temporizador. La búsqueda no se ejecutará hasta que
  // el usuario deje de interactuar con los filtros por 400ms.
  debounceTimer = setTimeout(() => {
    applyFilters()
  }, 400)
}, { deep: true }) // 'deep: true' es crucial para que watch detecte cambios dentro del objeto


// --- LÓGICA DEL MODAL Y CARRITO (sin cambios) ---
// 1. Renombramos la variable de estado para que sea específica del catálogo general (la cuadrícula)
const recentlyAddedInGridId = ref(null)
// 2. Creamos una NUEVA variable de estado, solo para el slider
const recentlyAddedInSliderId = ref(null)

const selectedProduct = ref(null)
const isModalVisible = ref(false)
const recentlyAddedInModalId = ref(null)

function handleShowDetails(producto) {
  selectedProduct.value = producto
  recentlyAddedInModalId.value = null
  isModalVisible.value = true
}

// 3. Renombramos la función original para que maneje SOLO los clics del catálogo general
function handleAddToCartFromGrid(producto) {
  cartStore.addToCart(producto, 1)
  recentlyAddedInGridId.value = producto.id // Actualiza el estado de la cuadrícula
  setTimeout(() => {
    if (recentlyAddedInGridId.value === producto.id) {
      recentlyAddedInGridId.value = null
    }
  }, 2000)
}

// 4. Creamos una NUEVA función para manejar SOLO los clics del slider
function handleAddToCartFromSlider(producto) {
  cartStore.addToCart(producto, 1)
  recentlyAddedInSliderId.value = producto.id // Actualiza el estado del slider
  setTimeout(() => {
    if (recentlyAddedInSliderId.value === producto.id) {
      recentlyAddedInSliderId.value = null
    }
  }, 2000)
}

// Busca esta función y reemplázala completamente
function handleAddToCartFromModal({ product, quantity, variants }) { // <-- Agregamos 'variants' aquí
  // Pasamos 'variants' al store
  cartStore.addToCart(product, quantity, variants)

  recentlyAddedInModalId.value = product.id
  setTimeout(() => {
    if (recentlyAddedInModalId.value === product.id) {
      recentlyAddedInModalId.value = null
    }
  }, 2000)
}

function closeModal() {
  isModalVisible.value = false
  setTimeout(() => {
    selectedProduct.value = null
  }, 300)
}

// Se llama a la carga de datos inicial cuando el componente se monta
onMounted(fetchInitialData)

</script>

<template>
  <div class="pb-4 px-4 sm:px-6 lg:px-8">
<WelcomeModal />
    <section class="mb-12">
      <picture>
        <source media="(max-width: 680px)" srcset="/welcome.webp">

        <source media="(min-width: 681px)"
          srcset="/welcome-640w.webp 640w, /welcome-768w.webp 768w, /welcome-1024w.webp 1024w, /welcome-1280w.webp 1280w, /welcome-1536w.webp 1536w, /welcome-1872w.webp 1872w"
          sizes="(max-width: 1872px) 100vw, 1872px">

        <img src="/welcome-1536w.webp" alt="Bienvenido a Gianna's Cookies" width="1872" height="480" loading="lazy"
          class="w-full md:h-auto rounded-lg shadow-lg object-cover">
      </picture>
      <p class="text-xs text-center mt-4 text-gray-600 italic">Ciudad Ojeda - Estado Zulia</p>
    </section>

    <div v-if="loading.initial" class="text-center py-12">
      <p class="text-gray-500 text-lg">Cargando delicias...</p>
    </div>

    <div v-else>

      <div v-if="sections.length > 0" class="space-y-16 mb-16">
        <ProductSlider v-for="section in sections" :key="section.id" :section="section"
          @show-details="handleShowDetails" @add-to-cart="handleAddToCartFromSlider"
          :recently-added-id="recentlyAddedInSliderId" />
      </div>

      <div>
        <div class="text-center md:text-left">
          <h1 class="text-3xl sm:text-4xl font-bold text-brand-morado mb-2">Nuestro Dulce Catálogo</h1>
          <p class="text-gray-600 mb-8">Encuentra tus galletas, brownies y postres favoritos.</p>
        </div>

        <ProductFilters :categories="categories" :initial-filters="filters"
          @filters-changed="(newFilters) => filters = newFilters" class="mb-8" />

        <div>
          <div v-if="loading.products" class="text-center py-24">
            <p class="font-semibold text-gray-600 text-lg">Buscando delicias...</p>
          </div>

          <div v-else>
            <div v-if="products.length > 0" class="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
              <ProductCard v-for="producto in products" :key="producto.id" :producto="producto"
                :is-recently-added="recentlyAddedInGridId === producto.id" @show-details="handleShowDetails(producto)"
                @add-to-cart="handleAddToCartFromGrid(producto)" />
            </div>


            <div v-else class="text-center py-24 bg-gray-50 rounded-lg">
              <p class="font-bold text-2xl text-gray-700">No se encontraron productos</p>
              <p class="text-gray-500 mt-2">Intenta cambiar los filtros o limpiar la búsqueda.</p>
            </div>
            <p class="text-center mt-8 text-sm sm:text-base">¿Tienes alguna pregunta sobre el menú? <br>
              <a href="https://wa.me/+584122741450" class="text-brand-fucsia font-bold hover:underline">
                Comunícate por WhatsApp con Gianna’s Cookies</a>
            </p>


          </div>
        </div>
      </div>
    </div>

    <ProductDetailModal :show="isModalVisible" :product="selectedProduct"
      :is-recently-added="recentlyAddedInModalId === selectedProduct?.id" @close="closeModal"
      @add-to-cart="handleAddToCartFromModal" />
  </div>
</template>
