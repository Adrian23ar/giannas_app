// src/services/exchangeRateService.js
import { supabase } from '@/supabase';

/**
 * Formatea un objeto de fecha al formato 'YYYY-MM-DD' usando la zona horaria local del navegador.
 * @param {Date} date - El objeto de fecha a formatear.
 * @returns {string} La fecha como string, ej: "2025-08-09".
 */
const toYYYYMMDD_local = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fetchAndStoreRateViaEdgeFunction = async () => {
  console.log("Invocando Edge Function 'store-exchange-rate'...");
  try {
    // Le enviamos la fecha de "hoy" REAL del cliente.
    const todayYYYYMMDD = toYYYYMMDD_local(new Date());
    const { data, error } = await supabase.functions.invoke('store-exchange-rate', {
      body: { date: todayYYYYMMDD },
    });

    if (error) throw error;
    console.log("✅ Tasa obtenida desde la Edge Function:", data.rate);
    return data.rate;

  } catch (error) {
    console.error("Error al invocar la Edge Function:", error.message);
    // Si la función falla, devolvemos null para que el frontend pueda manejarlo.
    return null;
  }
};

export const getLatestExchangeRate = async () => {
  // Usamos la nueva función para obtener la fecha local correcta.
  const todayYYYYMMDD = toYYYYMMDD_local(new Date());

  console.log(`Buscando tasa en BD (caché) para HOY (${todayYYYYMMDD})...`);
  const { data: rateFromDB } = await supabase
    .from('tasa_cambio')
    .select('tasa')
    .eq('fecha', todayYYYYMMDD)
    .maybeSingle();

  if (rateFromDB) {
    console.log(`✅ Tasa encontrada en CACHÉ de BD: ${rateFromDB.tasa}`);
    return rateFromDB.tasa;
  }

  console.log('Tasa no encontrada en caché. Invocando función en el servidor...');
  return await fetchAndStoreRateViaEdgeFunction();
};


// ----- INICIO DE LAS NUEVAS FUNCIONES PARA EL ADMIN -----

/**
 * [ADMIN] Obtiene las tasas de cambio registradas en un rango de fechas.
 * @param {string} startDate - Fecha de inicio en formato 'YYYY-MM-DD'.
 * @param {string} endDate - Fecha de fin en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array>} Una lista de objetos {fecha, tasa}.
 */
export const getRatesForPeriod = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('tasa_cambio')
    .select('fecha, tasa')
    .gte('fecha', startDate)
    .lte('fecha', endDate)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener el historial de tasas:', error.message);
    throw error;
  }

  return data;
};

/**
 * [ADMIN] Inserta o actualiza la tasa de cambio para una fecha específica.
 * @param {string} date - La fecha en formato 'YYYY-MM-DD'.
 * @param {number} rate - El valor de la tasa de cambio.
 * @returns {Promise<object>} El registro guardado en la base de datos.
 */
export const upsertRate = async (date, rate) => {
  const { data, error } = await supabase
    .from('tasa_cambio')
    .upsert({ fecha: date, tasa: rate }, { onConflict: 'fecha' })
    .select()
    .single();

  if (error) {
    console.error('Error al guardar la tasa de cambio:', error.message);
    throw error;
  }

  return data;
};

/**
 * [ADMIN] Verifica el estado de la API externa de tasas de cambio.
 * @returns {Promise<object>} Un objeto con el resultado de la verificación.
 */
export const checkApiStatus = async () => {
  try {
    const response = await fetch('https://api.dolarvzla.com/public/exchange-rate/list');
    if (!response.ok) {
      throw new Error(`La API respondió con un estado: ${response.status}`);
    }
    const data = await response.json();
    if (!data.rates || data.rates.length === 0) {
      throw new Error('La API respondió pero no devolvió tasas.');
    }
    // Si todo va bien, devolvemos un objeto de éxito
    return {
      success: true,
      message: `API funcionando. Tasa más reciente: ${data.rates[0].usd} Bs.`,
    };
  } catch (error) {
    console.error('Error al verificar el estado de la API:', error.message);
    // Si algo falla, devolvemos un objeto de error
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
};

// ----- FIN DE LAS NUEVAS FUNCIONES PARA EL ADMIN -----
