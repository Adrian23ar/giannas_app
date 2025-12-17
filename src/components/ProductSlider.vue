<script setup>
// src/components/ProductSlider.vue
import { defineProps, defineEmits } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import ProductCard from '@/components/ProductCard.vue';

// Importa los estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';

defineProps({
  section: {
    type: Object,
    required: true
  },
  recentlyAddedId: {
    type: [String, Number],
    default: null
  }
});

// Definimos los eventos que puede emitir este componente
const emit = defineEmits(['showDetails']);

// Pasamos los eventos del ProductCard hacia el padre (CatalogView)
function onShowDetails(product) {
  emit('showDetails', product);
}

</script>

<template>
  <div class="mb-12">
    <p class="text-3xl font-bold text-brand-morado mb-4">{{ section.nombre }}</p>
    <Swiper :modules="[Navigation]" :slides-per-view="1.5" :space-between="20" :navigation="true" :breakpoints="{
      640: { slidesPerView: 2.5 },
      768: { slidesPerView: 2.5 },
      1024: { slidesPerView: 3.5 },
      1440: { slidesPerView: 4.5 }
    }">
      <SwiperSlide v-for="product in section.productos" :key="product.id">
        <ProductCard :producto="product" :is-recently-added="recentlyAddedId === product.id"
          @show-details="onShowDetails(product)" />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<style>
/* Estilos para personalizar las flechas de navegación de Swiper */
.swiper-button-next,
.swiper-button-prev {
  color: #CC146C;
  /* Un color que combine con tu marca, ej: morado */
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  width: 44px;
  height: 44px;
}

.swiper-button-next:after,
.swiper-button-prev:after {
  font-size: 20px;
  font-weight: bold;
}
</style>
