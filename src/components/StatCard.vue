<script setup>
defineProps({
  title: String,
  value: [String, Number],
  iconColorClass: String,
  bgColorClass: String
})
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-gray-500">{{ title }}</p>
      <p class="text-3xl font-bold text-gray-800">{{ value }}</p>
    </div>
    <div
      class="p-3 rounded-full"
      :class="[bgColorClass, iconColorClass]"
    >
      <slot></slot>
    </div>
  </div>
</template>
