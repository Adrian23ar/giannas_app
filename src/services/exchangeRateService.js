// src/services/exchangeRateService.js
import { supabase } from '@/supabase';

/**
 * ¡FUNCIÓN CORREGIDA!
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
