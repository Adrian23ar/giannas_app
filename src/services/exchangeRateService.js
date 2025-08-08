// src/services/exchangeRateService.js

// Importamos el cliente de Supabase para comunicarnos con nuestra base de datos.
import { supabase } from '@/supabase';

// Tu API Key para el servicio de pydolarve.org
const API_TOKEN = 'ZCp_K35_WZUYeTJWoJLYcA';

/**
 * Formatea un objeto de fecha al formato 'YYYY-MM-DD'.
 * @param {Date} date - El objeto de fecha a formatear.
 * @returns {string} La fecha como string, ej: "2024-08-10".
 */
const toYYYYMMDD = (date) => date.toISOString().split('T')[0];

/**
 * Formatea un objeto de fecha al formato 'DD-MM-YYYY' que requiere la API.
 * @param {Date} date - El objeto de fecha a formatear.
 * @returns {string} La fecha como string, ej: "10-08-2024".
 */
const toDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Guarda o actualiza una tasa en nuestra tabla 'tasa_cambio'.
 * Esta función es el corazón de nuestro sistema de caché para evitar
 * llamadas innecesarias a la API.
 * @param {string} fecha - La fecha en formato 'YYYY-MM-DD'.
 * @param {number} tasa - El valor de la tasa de cambio.
 */
const storeRateInDB = async (fecha, tasa) => {
  // Usamos 'upsert' para insertar la tasa. Si la fecha ya existe,
  // simplemente la actualiza. Esto hace el proceso más seguro.
  const { error } = await supabase
    .from('tasa_cambio')
    .upsert({ fecha, tasa }, { onConflict: 'fecha' });

  if (error) {
    console.error(`Error al guardar la tasa para ${fecha} en la DB:`, error);
  } else {
    console.log(`Tasa guardada en DB para fecha: ${fecha}`);
  }
};

/**
 * Busca la tasa en la API externa, usando tu lógica de reintentos.
 * Si la encuentra, la guarda en nuestra base de datos para uso futuro.
 * @returns {Promise<number|null>} El valor de la tasa o null si falla.
 */
const fetchAndStoreLatestRateFromAPI = async (maxRetries = 7) => {
  console.log(`Iniciando búsqueda de tasa en API externa con hasta ${maxRetries} reintentos.`);

  const today = new Date();
  const todayYYYYMMDD = toYYYYMMDD(today);

  for (let i = 0; i < maxRetries; i++) {
    const dateToTry = new Date();
    dateToTry.setDate(dateToTry.getDate() - i);

    const dateToTryYYYYMMDD = toYYYYMMDD(dateToTry);
    const dateToTryDDMMYYYY = toDDMMYYYY(dateToTry);

    // Construimos la URL de la API exactamente como en tu función.
    const apiUrl = `https://pydolarve.org/api/v2/dollar/history?page=bcv&monitor=usd&start_date=${dateToTryDDMMYYYY}&end_date=${dateToTryDDMMYYYY}&format_date=default&rounded_price=true&order=desc`;

    try {
      console.log(`Intento #${i + 1}: Buscando tasa para fecha ${dateToTryYYYYMMDD}`);
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${API_TOKEN}` } // Usamos la API Key
      });

      if (!response.ok) {
        console.warn(`API no respondió OK para ${dateToTryYYYYMMDD} (Status: ${response.status}). Reintentando día anterior...`);
        continue; // Si falla, pasa al siguiente intento (día anterior)
      }

      const data = await response.json();

      // Verificamos que la respuesta tenga la estructura esperada
      if (data && data.history && data.history.length > 0) {
        const rateValue = parseFloat(data.history[0].price);
        if (rateValue && !isNaN(rateValue) && rateValue > 0) {
          console.log(`✅ Tasa encontrada en API: ${rateValue} (corresponde a ${dateToTryYYYYMMDD})`);

          // 1. Guardamos la tasa para la fecha en que fue VÁLIDA.
          await storeRateInDB(dateToTryYYYYMMDD, rateValue);

          // 2. Si la fecha de la tasa no es la de hoy, también la guardamos para HOY.
          // Esto asegura que la próxima vez que se consulte por "hoy", la encontremos en nuestra BD.
          if (todayYYYYMMDD !== dateToTryYYYYMMDD) {
            console.log(`Guardando tasa también para la fecha de hoy (${todayYYYYMMDD}) para caché.`);
            await storeRateInDB(todayYYYYMMDD, rateValue);
          }

          return rateValue; // ¡Éxito! Devolvemos la tasa.
        }
      }
    } catch (error) {
      console.error(`Error crítico en el intento #${i + 1} para ${dateToTryYYYYMMDD}:`, error);
    }
  }

  console.error(`FALLO TOTAL: No se pudo obtener la tasa de cambio después de ${maxRetries} intentos.`);
  return null; // Devolvemos null si todo falla.
};


/**
 * Función principal que se exporta y se usa en la aplicación.
 * Obtiene la tasa de cambio más reciente, priorizando la caché en nuestra base de datos.
 * @returns {Promise<number|null>} El valor de la tasa o null si no se pudo obtener.
 */
export const getLatestExchangeRate = async () => {
  const todayYYYYMMDD = toYYYYMMDD(new Date());

  // 1. Primero, revisamos si ya tenemos la tasa para HOY en nuestra BD.
  console.log(`Buscando tasa en BD (caché) para HOY (${todayYYYYMMDD})...`);
  const { data: rateFromDB } = await supabase
    .from('tasa_cambio')
    .select('tasa')
    .eq('fecha', todayYYYYMMDD)
    .single();

  if (rateFromDB) {
    console.log(`✅ Tasa encontrada en CACHÉ de BD: ${rateFromDB.tasa}`);
    return rateFromDB.tasa; // Si está, la devolvemos inmediatamente.
  }

  // 2. Si no está en nuestra BD, entonces llamamos a la función que busca en la API.
  console.log('Tasa no encontrada en caché. Buscando en API externa...');
  return await fetchAndStoreLatestRateFromAPI();
};
