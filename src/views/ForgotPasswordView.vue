<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { sendPasswordResetEmail } from '@/services/authService'
import CustomButton from '@/components/CustomButton.vue'

const toast = useToast()
const email = ref('')
const procesando = ref(false)
const emailEnviado = ref(false)

async function handlePasswordReset() {
  procesando.value = true
  try {
    await sendPasswordResetEmail(email.value)
    emailEnviado.value = true
  } catch (error) {
    toast.error(error.message)
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h1 class="text-3xl font-bold text-center text-brand-morado mb-6">Recuperar Contraseña</h1>

    <div v-if="emailEnviado" class="text-center">
      <p class="text-gray-700">Si existe una cuenta con el correo <span class="font-bold">{{ email }}</span>, hemos
        enviado un enlace para restablecer tu contraseña.</p>
      <p class="text-sm text-gray-500 mt-2">Por favor, revisa tu bandeja de entrada (y la de spam).</p>
      <RouterLink to="/ingresar" class="font-semibold text-brand-fucsia hover:underline mt-6 block">Volver a Iniciar
        Sesión</RouterLink>
    </div>

    <form v-else @submit.prevent="handlePasswordReset" class="space-y-4">
      <p class="text-sm text-gray-600">Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu
        contraseña.</p>
      <input v-model="email" type="email" placeholder="Correo Electrónico" required
        class="w-full p-2 border rounded-md">
      <CustomButton type="submit" class="w-full" :disabled="procesando">
        {{ procesando ? 'Enviando...' : 'Enviar Enlace de Recuperación' }}
      </CustomButton>
    </form>
  </div>
</template>
