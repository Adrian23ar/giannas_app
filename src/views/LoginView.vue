<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  try {
    // Limpiamos el mensaje de error anterior
    errorMsg.value = ''

    // Ya no declaramos 'data' porque no la usamos
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) throw error

    router.push('/admin')
  } catch (error) {
    // Ahora usamos el mensaje de error real que nos da Supabase
    console.error('Error de login:', error.message) // Para verlo en la consola
    errorMsg.value = error.message || 'Email o contraseña incorrectos.'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
      <div class="text-center mb-8">
        <img src="/logo-giannas.png" alt="Logo Gianna's Cookies" class="w-32 mx-auto">
        <h1 class="text-3xl font-bold text-brand-morado mt-4">Acceso al Panel</h1>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="email" class="block text-gray-700">Email</label>
          <input type="email" v-model="email" id="email" class="w-full p-2 border rounded-md">
        </div>
        <div class="mb-6">
          <label for="password" class="block text-gray-700">Contraseña</label>
          <input type="password" v-model="password" id="password" class="w-full p-2 border rounded-md">
        </div>
        <div v-if="errorMsg" class="text-red-500 text-center mb-4">{{ errorMsg }}</div>
        <button type="submit" class="w-full bg-brand-fucsia text-white font-bold py-3 rounded-md">
          Iniciar Sesión
        </button>
      </form>
    </div>
  </div>
</template>
