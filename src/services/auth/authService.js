// src/services/authService.js
import { supabase } from '@/supabase'

/**
 * Inicia sesión de un usuario.
 * @param {string} email - El correo del usuario.
 * @param {string} password - La contraseña del usuario.
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

/**
 * Registra un nuevo usuario.
 * @param {object} userData - Un objeto con { email, password, nombre, telefono }.
 */
export const signUp = async (userData) => {
  const { email, password, nombre, telefono } = userData
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nombre,
        phone: telefono,
        role: 'cliente',
      }
    }
  })
  if (error) throw error
  return data
}

/**
 * Envía un correo para restablecer la contraseña.
 * @param {string} email - El correo del usuario.
 */
export const sendPasswordResetEmail = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // IMPORTANTE: Esta es la URL a la que será redirigido el usuario desde su correo
    redirectTo: 'https://giannascookies.netlify.app/actualizar-clave',
  })
  if (error) throw error
}

/**
 * Actualiza la contraseña del usuario actual.
 * @param {string} newPassword - La nueva contraseña.
 */
export const updateUserPassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
  return data
}
