<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { updateUserPassword } from '@/services/auth/authService'
import CustomButton from '@/components/shared/CustomButton.vue'

const router = useRouter()
const toast = useToast()
const password = ref('')
const procesando = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleUpdatePassword() {
  procesando.value = true
  errorMsg.value = ''
  try {
    await updateUserPassword(password.value)
    successMsg.value = '¡Tu contraseña ha sido actualizada con éxito! Serás redirigido para iniciar sesión.'
    setTimeout(() => {
      router.push('/ingresar')
    }, 3000)
  } catch (error) {
    errorMsg.value = error.message
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h1 class="text-3xl font-bold text-center text-brand-morado mb-6">Restablecer Contraseña</h1>

    <div v-if="successMsg" class="text-center text-green-600">
      <p>{{ successMsg }}</p>
    </div>

    <form v-else @submit.prevent="handleUpdatePassword" class="space-y-4">
      <p class="text-sm text-gray-600">Introduce tu nueva contraseña.</p>
      <input v-model="password" type="password" placeholder="Nueva Contraseña (mín. 6 caracteres)" required
        class="w-full p-2 border rounded-md">
      <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>
      <CustomButton type="submit" class="w-full" :disabled="procesando">
        {{ procesando ? 'Actualizando...' : 'Guardar Nueva Contraseña' }}
      </CustomButton>
    </form>
  </div>
</template>
