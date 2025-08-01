<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { signIn } from '@/services/authService' // <-- Usamos el servicio
import CustomButton from '@/components/CustomButton.vue'

const router = useRouter()
const toast = useToast()
const email = ref('')
const password = ref('')
const procesando = ref(false)

async function handleLogin() {
  procesando.value = true
  try {
    await signIn(email.value, password.value) // <-- Lógica simplificada
    toast.success('¡Bienvenido de vuelta!')
    router.push('/')
  } catch (error) {
    toast.error('Email o contraseña incorrectos.')
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h1 class="text-3xl font-bold text-center text-brand-morado mb-6">Iniciar Sesión</h1>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <input v-model="email" type="email" placeholder="Correo Electrónico" required
        class="w-full p-2 border rounded-md">
      <input v-model="password" type="password" placeholder="Contraseña" required class="w-full p-2 border rounded-md">
      <div class="text-right text-sm">
        <RouterLink to="/olvide-clave" class="font-semibold text-gray-500 hover:text-brand-fucsia">¿Olvidaste tu
          contraseña?</RouterLink>
      </div>
      <CustomButton type="submit" class="w-full" :disabled="procesando">
        {{ procesando ? 'Ingresando...' : 'Iniciar Sesión' }}
      </CustomButton>
    </form>
    <p class="text-center text-sm mt-4">
      ¿No tienes una cuenta?
      <RouterLink to="/registro" class="font-semibold text-brand-fucsia hover:underline">Regístrate</RouterLink>
    </p>
  </div>
</template>
