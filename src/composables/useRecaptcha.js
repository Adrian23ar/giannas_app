// src/composables/useRecaptcha.js

import { ref } from 'vue';
import { supabase } from '@/supabase'; // Importamos nuestro cliente de Supabase

// Exportamos la función composable
export function useRecaptcha() {

  // Estados reactivos para manejar la carga y los errores
  const isVerifying = ref(false);
  const verificationError = ref(null);

  /**
   * Llama a nuestra Edge Function en Supabase para verificar el token de reCAPTCHA.
   * @param {string} token - El token generado por el widget de reCAPTCHA en el frontend.
   * @returns {Promise<boolean>} - Devuelve 'true' si la verificación es exitosa, 'false' si no lo es.
   */
  const verifyRecaptcha = async (token) => {
    // 1. Reiniciamos los estados
    isVerifying.value = true;
    verificationError.value = null;

    if (!token) {
      verificationError.value = 'El reCAPTCHA ha expirado o es inválido. Por favor, inténtalo de nuevo.';
      isVerifying.value = false;
      return false;
    }

    try {
      // 2. Invocamos la Edge Function que crearemos en el siguiente paso
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token },
      });

      if (error) {
        // Si hay un error de red o la función falla
        throw new Error('Error de conexión con el servicio de verificación.');
      }

      if (data?.success) {
        // 3. Si la función nos dice que el reCAPTCHA es válido
        console.log('Verificación de reCAPTCHA exitosa.');
        isVerifying.value = false;
        return true;
      } else {
        // 4. Si la función nos dice que no es válido (o hay otro problema)
        throw new Error(data?.error || 'La verificación de reCAPTCHA ha fallado.');
      }

    } catch (err) {
      console.error('Error en la verificación de reCAPTCHA:', err);
      verificationError.value = err.message;
      isVerifying.value = false;
      return false;
    }
  };

  // El composable devuelve los estados y la función para que los componentes los usen
  return {
    isVerifying,
    verificationError,
    verifyRecaptcha,
  };
}
