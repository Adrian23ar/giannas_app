// src/services/exchangeRateService.js
import { supabase } from '@/supabase';

const toYYYYMMDD = (date) => date.toISOString().split('T')[0];

const fetchAndStoreRateViaEdgeFunction = async () => {
  console.log("Invocando Edge Function 'store-exchange-rate'...");
  try {
    // --- INICIO DEL CAMBIO ---
    // Ahora le enviamos la fecha de "hoy" del cliente en el cuerpo de la solicitud.
    const todayYYYYMMDD = toYYYYMMDD(new Date());
    const { data, error } = await supabase.functions.invoke('store-exchange-rate', {
      body: { date: todayYYYYMMDD },
    });
    // --- FIN DEL CAMBIO ---

    if (error) throw error;
    console.log("✅ Tasa obtenida desde la Edge Function:", data.rate);
    return data.rate;

  } catch (error) {
    console.error("Error al invocar la Edge Function:", error.message);
    return null;
  }
};

export const getLatestExchangeRate = async () => {
  const todayYYYYMMDD = toYYYYMMDD(new Date());

  console.log(`Buscando tasa en BD (caché) para HOY (${todayYYYYMMDD})...`);
  const { data: rateFromDB } = await supabase
    .from('tasa_cambio')
    .select('tasa')
    .eq('fecha', todayYYYYMMDD)
    .maybeSingle(); // <-- Mantenemos el cambio aquí también

  if (rateFromDB) {
    console.log(`✅ Tasa encontrada en CACHÉ de BD: ${rateFromDB.tasa}`);
    return rateFromDB.tasa;
  }

  console.log('Tasa no encontrada en caché. Invocando función en el servidor...');
  return await fetchAndStoreRateViaEdgeFunction();
};
