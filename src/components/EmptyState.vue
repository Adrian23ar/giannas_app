<script setup>
defineProps({
  title: String,
  message: String,
})
</script>

<template>
  <div class="text-center border-2 border-dashed rounded-lg p-12">
    <div class="mx-auto w-fit bg-slate-100 p-4 rounded-full">
      <slot name="icon"></slot>
    </div>
    <h3 class="mt-4 text-lg font-semibold text-gray-800">{{ title }}</h3>
    <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
    <div class="mt-6">
      <slot name="action"></slot>
    </div>
  </div>
</template>
