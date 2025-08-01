<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { signUp } from '@/services/authService' // <-- Usamos el servicio
import CustomButton from '@/components/CustomButton.vue'

const router = useRouter()
const toast = useToast()
const form = ref({
  email: '',
  password: '',
  nombre: '',
  telefono: ''
})
const procesando = ref(false)

async function handleRegister() {
  procesando.value = true
  try {
    await signUp(form.value) // <-- Lógica simplificada
    toast.success('¡Registro exitoso! Ya puedes iniciar sesión.')
    router.push('/ingresar')
  } catch (error) {
    toast.error(error.message)
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h1 class="text-3xl font-bold text-center text-brand-morado mb-6">Crear una Cuenta</h1>
    <form @submit.prevent="handleRegister" class="space-y-4">
      <input v-model="form.nombre" type="text" placeholder="Nombre y Apellido" required
        class="w-full p-2 border rounded-md">
      <input v-model="form.telefono" type="tel" placeholder="Teléfono" required class="w-full p-2 border rounded-md">
      <input v-model="form.email" type="email" placeholder="Correo Electrónico" required
        class="w-full p-2 border rounded-md">
      <input v-model="form.password" type="password" placeholder="Contraseña (mín. 6 caracteres)" required
        class="w-full p-2 border rounded-md">
      <CustomButton type="submit" class="w-full" :disabled="procesando">
        {{ procesando ? 'Creando cuenta...' : 'Registrarse' }}
      </CustomButton>
    </form>
    <p class="text-center text-sm mt-4">
      ¿Ya tienes una cuenta?
      <RouterLink to="/ingresar" class="font-semibold text-brand-fucsia hover:underline">Inicia Sesión</RouterLink>
    </p>
  </div>
</template>
