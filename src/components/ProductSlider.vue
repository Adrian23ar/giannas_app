<script setup>
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
  }
});

// Definimos los eventos que puede emitir este componente
const emit = defineEmits(['showDetails', 'addToCart']);

// Pasamos los eventos del ProductCard hacia el padre (CatalogView)
function onShowDetails(product) {
  emit('showDetails', product);
}

function onAddToCart(product) {
  emit('addToCart', product);
}
</script>

<template>
  <div class="mb-12">
    <h2 class="text-3xl font-bold text-brand-morado mb-4">{{ section.nombre }}</h2>
    <swiper :modules="[Navigation]" :slides-per-view="1.5" :space-between="20" :navigation="true" :breakpoints="{
      640: { slidesPerView: 2.5 },
      768: { slidesPerView: 3.5 },
      1024: { slidesPerView: 4.5 }
    }">
      <swiper-slide v-for="product in section.productos" :key="product.id">
        <ProductCard :producto="product" @show-details="onShowDetails(product)" @add-to-cart="onAddToCart(product)" />
      </swiper-slide>
    </swiper>
  </div>
</template>

<style>
/* Estilos para personalizar las flechas de navegación de Swiper */
.swiper-button-next,
.swiper-button-prev {
  color: #8A2BE2;
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
