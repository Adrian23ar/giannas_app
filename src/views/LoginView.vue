<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { supabase } from '@/supabase'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const procesando = ref(false)

async function handleLogin() {
  procesando.value = true
  try {
    // 1. Inicia sesión como siempre
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (signInError) throw new Error('Credenciales incorrectas.');

    // 2. Busca el perfil para verificar el rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 3. Verifica si el rol es 'admin'
    if (profile && profile.role === 'admin') {
      await userStore.fetchUser() // Actualiza el store con los datos del admin
      router.push('/admin')
      toast.success('¡Bienvenido, Administrador!')
    } else {
      // Si no es admin, cierra la sesión recién creada y muestra un error
      await supabase.auth.signOut()
      throw new Error('No tienes permiso para acceder a esta área.')
    }

  } catch (error) {
    toast.error(error.message)
  } finally {
    procesando.value = false
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
        <button type="submit" class="w-full bg-brand-fucsia text-white font-bold py-3 rounded-md">
          Iniciar Sesión
        </button>
      </form>
    </div>
  </div>
</template>
