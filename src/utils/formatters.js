// src/utils/formatters.js

/**
 * Formatea una cadena de fecha a un formato legible en 'es-VE'.
 * Maneja de forma inteligente las fechas con y sin hora para evitar
 * problemas de zona horaria.
 * @param {string} dateString - La fecha en formato de cadena.
 * @returns {string} - La fecha formateada.
 */
export function formatDisplayDate(dateString) {
  if (!dateString) return 'N/A';

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Si la fecha incluye la hora (es un timestamp completo),
  // le pedimos que la muestre en la zona horaria local del navegador.
  if (dateString.includes('T')) {
    // No se añade la propiedad timeZone, por lo que usa la del cliente
  }
  // Si la fecha NO incluye la hora (es un tipo DATE de la DB),
  // la tratamos como UTC para evitar que se atrase un día.
  else {
    options.timeZone = 'UTC';
  }

  return new Date(dateString).toLocaleDateString('es-VE', options);
}
