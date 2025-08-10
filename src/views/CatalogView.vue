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
import heroBanner from '@/assets/welcome.png'
import comoComprarBanner from '@/assets/como_comprar.png'
import comprar_2 from '@/assets/2.png'
import comprar_3 from '@/assets/3.png'
import comprar_4 from '@/assets/4.png'
import comprar_5 from '@/assets/5.png'

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
  maxPrice: 500, // Puedes ajustar este valor máximo por defecto
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

const selectedProduct = ref(null)
const isModalVisible = ref(false)
const recentlyAddedInCardId = ref(null)
const recentlyAddedInModalId = ref(null)

function handleShowDetails(producto) {
  selectedProduct.value = producto
  recentlyAddedInModalId.value = null
  isModalVisible.value = true
}

function handleAddToCartFromCard(producto) {
  cartStore.addToCart(producto, 1)
  recentlyAddedInCardId.value = producto.id
  setTimeout(() => {
    if (recentlyAddedInCardId.value === producto.id) {
      recentlyAddedInCardId.value = null
    }
  }, 2000)
}

function handleAddToCartFromModal({ product, quantity }) {
  cartStore.addToCart(product, quantity)
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
  <div class="pb-8 px-4 sm:px-6 lg:px-8">

    <section class="mb-16">
      <img :src="heroBanner" alt="Bienvenido a Gianna's Cookies"
        class="w-full h-40 md:h-auto rounded-lg shadow-lg object-cover" />
    </section>

    <div v-if="loading.initial" class="text-center py-12">
      <p class="text-gray-500 text-lg">Cargando delicias...</p>
    </div>

    <div v-else>

      <div v-if="sections.length > 0" class="space-y-16 mb-16">
        <ProductSlider v-for="section in sections" :key="section.id" :section="section"
          @show-details="handleShowDetails" @add-to-cart="handleAddToCartFromCard" />
      </div>

      <div>
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 bg-brand-morado rounded-lg p-4 lg:p-8">
          <h2 class="text-2xl sm:text-3xl font-bold col-span-2 md:col-span-4 text-center text-white">Comprar es muy fácil</h2>

          <img :src="comprar_2" alt="Pasos para comprar en Gianna's Cookies" class="w-full h-32 lg:h-52 rounded object-contain" />
          <img :src="comprar_3" alt="Pasos para comprar en Gianna's Cookies" class="w-full h-32 lg:h-52 rounded object-contain" />
          <img :src="comprar_4" alt="Pasos para comprar en Gianna's Cookies" class="w-full h-32 lg:h-52 rounded object-contain" />
          <img :src="comprar_5" alt="Pasos para comprar en Gianna's Cookies" class="w-full h-32 lg:h-52 rounded object-contain" />
        </section>

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
            <div v-if="products.length > 0" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <ProductCard v-for="producto in products" :key="producto.id" :producto="producto"
                :is-recently-added="recentlyAddedInCardId === producto.id" @show-details="handleShowDetails(producto)"
                @add-to-cart="handleAddToCartFromCard(producto)" />
            </div>

            <div v-else class="text-center py-24 bg-gray-50 rounded-lg">
              <p class="font-bold text-2xl text-gray-700">No se encontraron productos</p>
              <p class="text-gray-500 mt-2">Intenta cambiar los filtros o limpiar la búsqueda.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProductDetailModal :show="isModalVisible" :product="selectedProduct"
      :is-recently-added="recentlyAddedInModalId === selectedProduct?.id" @close="closeModal"
      @add-to-cart="handleAddToCartFromModal" />
  </div>
</template>
