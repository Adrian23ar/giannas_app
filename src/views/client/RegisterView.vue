<script setup>
//src\views\RegisterView.vue
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { signUp } from '@/services/auth/authService' // <-- Usamos el servicio
import CustomButton from '@/components/shared/CustomButton.vue'
import { loadRecaptcha } from '@/utils/recaptchaLoader'

const router = useRouter()
const toast = useToast()
const form = ref({
  email: '',
  password: '',
  nombre: '',
  telefono: ''
})
const procesando = ref(false)
const emailError = ref('') // <-- NUEVO: Para guardar el mensaje de error del email

// 1. Crea una referencia para el contenedor del reCAPTCHA
const recaptchaContainer = ref(null)
const recaptchaWidgetId = ref(null) // Para guardar el ID del widget

// Función que renderizará el reCAPTCHA
const renderRecaptcha = () => {
  // Asegúrate de que el contenedor existe y que la API 'grecaptcha' está disponible
  if (recaptchaContainer.value && window.grecaptcha) {
    window.grecaptcha.ready(() => {
      recaptchaWidgetId.value = window.grecaptcha.render(recaptchaContainer.value, {
        'sitekey': '6LegfJ8rAAAAABWBru2sS_rlb5G7GHPie-V4ZD8-',
      });
    });
  }
};

onMounted(async () => {
  try {
    await loadRecaptcha()
    renderRecaptcha()
  } catch (e) {
    console.error('Error cargando ReCAPTCHA', e)
  }
})

// Es una buena práctica limpiar el listener cuando el componente se destruye
onUnmounted(() => {
  window.removeEventListener('recaptcha-loaded', renderRecaptcha);
});

// NUEVA FUNCIÓN: Valida el formato del correo
function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (form.value.email && !emailRegex.test(form.value.email)) {
    emailError.value = 'Por favor, introduce un correo electrónico válido.';
  } else {
    emailError.value = ''; // Limpia el error si el formato es correcto
  }
}

// NUEVO: Deshabilita el botón si hay error de email o se está procesando
const isBotonDeshabilitado = computed(() => {
  return procesando.value || !!emailError.value;
});

async function handleRegister() {
  // Primero, corre la validación por si el usuario no ha desenfocado el campo
  validateEmail();
  if (emailError.value) {
    toast.error(emailError.value);
    return;
  }
  // Es recomendable verificar que el usuario completó el reCAPTCHA antes de enviar
  const recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId.value);
  if (!recaptchaResponse) {
    toast.error('Por favor, completa el reCAPTCHA.');
    return;
  }
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
      <div>
        <label for="nombre" class="block mb-1 text-sm font-medium text-gray-700">Nombre y Apellido</label>
        <input id="nombre" v-model="form.nombre" type="text" placeholder="Nombre y Apellido" required
          class="w-full p-2 border rounded-md">
      </div>

      <div>
        <label for="telefono" class="block mb-1 text-sm font-medium text-gray-700">Teléfono</label>
        <input id="telefono" v-model="form.telefono" type="tel" placeholder="Ej: 0414-1234567" required
          class="w-full p-2 border rounded-md">
      </div>

      <div>
        <label for="email" class="block mb-1 text-sm font-medium text-gray-700">Correo Electrónico</label>
        <input id="email" v-model="form.email" type="email" placeholder="tucorreo@ejemplo.com" required
          @blur="validateEmail" class="w-full p-2 border rounded-md">
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
      </div>

      <div>
        <label for="password" class="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
        <input id="password" v-model="form.password" type="password" placeholder="Mínimo 6 caracteres" required
          class="w-full p-2 border rounded-md">
      </div>
      <div class="flex justify-center flex-col text-center pt-2">
        <div class="mx-auto" ref="recaptchaContainer"></div>

        <CustomButton type="submit" class="w-full mt-4" :disabled="procesando">
          {{ procesando ? 'Creando cuenta...' : 'Registrarse' }}
        </CustomButton>
      </div>


    </form>
    <p class="text-center text-sm mt-4">
      ¿Ya tienes una cuenta?
      <RouterLink to="/ingresar" class="font-semibold text-brand-fucsia hover:underline">Inicia Sesión</RouterLink>
    </p>
  </div>
</template>
