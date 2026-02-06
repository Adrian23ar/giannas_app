// supabase/functions/store-exchange-rate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Manejo de CORS para peticiones OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date: clientDate } = await req.json()
    if (!clientDate || !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      throw new Error('Fecha inválida o no proporcionada.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Nueva URL de la API de DolarFlash
    const apiUrl = 'https://dolarflashve.eu/api/api/rates/paginated?page=1&limit=300'

    // 2. Llamada a la API
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error('La API de DolarFlash no respondió correctamente.')
    }

    const jsonResponse = await response.json()

    // En DolarFlash, los datos vienen en la propiedad 'data'
    if (!jsonResponse || !Array.isArray(jsonResponse.data)) {
      throw new Error('Formato de respuesta de API inválido.')
    }

    // 3. Buscar la tasa específica filtrando solo por la fecha (YYYY-MM-DD)
    const tasaEncontrada = jsonResponse.data.find((item: any) => {
      // Extraemos solo los primeros 10 caracteres de la fecha de la API (YYYY-MM-DD)
      const apiDateOnly = item.date.split('T')[0];

      return (
        apiDateOnly === clientDate &&
        item.source === "BCV" &&
        item.operation_type === "USD"
      );
    });

    // Si no encuentra la fecha exacta, puedes decidir si devolver un error
    // o la más reciente. Para el admin, es mejor devolver error si no hay data.
    if (!tasaEncontrada) {
      return new Response(JSON.stringify({
        error: `No se encontró tasa del BCV para la fecha ${clientDate} en los registros externos.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Convertimos el string "381.11" a número float
    const rateValue = parseFloat(tasaEncontrada.rate)

    // 4. Guardar en tu tabla de Supabase para caché
    const { error: upsertError } = await supabaseClient
      .from('tasa_cambio')
      .upsert(
        { fecha: clientDate, tasa: rateValue },
        { onConflict: 'fecha' }
      )

    if (upsertError) {
      console.error("Error guardando en BD:", upsertError.message)
    }

    // 5. Respuesta al frontend
    return new Response(JSON.stringify({
      rate: rateValue,
      source: tasaEncontrada.source,
      last_update: tasaEncontrada.date,
      date: tasaEncontrada.date
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
