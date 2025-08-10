// supabase/functions/verify-recaptcha/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY')
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // O tu dominio específico: 'https://tu-dominio.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar la solicitud pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      throw new Error('No se proporcionó el token de reCAPTCHA.')
    }

    if (!RECAPTCHA_SECRET_KEY) {
      throw new Error('La clave secreta de reCAPTCHA no está configurada en el servidor.')
    }

    // URL de la API de Google para verificar el token
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';

    // Preparamos los datos para enviar a Google
    const body = new URLSearchParams();
    body.append('secret', RECAPTCHA_SECRET_KEY);
    body.append('response', token);

    // Hacemos la llamada a la API de Google
    const response = await fetch(verificationUrl, {
      method: 'POST',
      body: body,
    });

    const data = await response.json();

    // Devolvemos la respuesta de Google a nuestro frontend
    return new Response(
      JSON.stringify({ success: data.success, error: data['error-codes']?.[0] }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
