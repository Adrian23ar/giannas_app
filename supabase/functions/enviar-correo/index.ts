// supabase/functions/enviar-correo/index.ts (Versión de Depuración)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log("Código de la función cargado.");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Función invocada, procesando solicitud...");

  if (req.method === 'OPTIONS') {
    console.log("Detectada solicitud OPTIONS (preflight). Respondiendo OK.");
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`Método de la solicitud: ${req.method}`);
    const body = await req.json();
    console.log("Cuerpo de la solicitud recibido:", body);

    const { to, subject, html } = body;
    console.log(`Datos extraídos: to=${to}, subject=${subject}`);

    console.log("Intentando leer los secretos de Supabase...");
    const apiKey = Deno.env.get('MAILERSEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL_ADDRESS');

    if (!apiKey) {
      console.error("ERROR CRÍTICO: El secreto MAILERSEND_API_KEY no se encontró.");
      throw new Error('MAILERSEND_API_KEY no está configurado.');
    }
    if (!adminEmail) {
      console.error("ERROR CRÍTICO: El secreto ADMIN_EMAIL_ADDRESS no se encontró.");
      // Usamos el 'to' del body como fallback si el secreto no está, aunque no es ideal
    }
    console.log("Secretos leídos correctamente. API Key encontrada.");

    const fromEmail = 'Giannas_Cookies@test-eqvygm0ow1zl0p7w.mlsender.net';

    const emailPayload = {
      from: { email: fromEmail, name: "Gianna's Cookies Notificaciones" },
      to: [{ email: to }],
      subject: subject,
      html: html,
    };
    console.log("Preparando para enviar el siguiente payload a MailerSend:", JSON.stringify(emailPayload, null, 2));

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });
    console.log(`Respuesta de MailerSend - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Cuerpo del error de MailerSend:', errorBody);
      throw new Error(`Error al enviar el correo: ${response.statusText}`);
    }

    console.log("¡Correo enviado con éxito a través de MailerSend!");
    return new Response(JSON.stringify({ message: 'Correo enviado con éxito' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error capturado en el bloque catch:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
