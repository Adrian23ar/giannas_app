// supabase/functions/enviar-correo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createTransport } from "npm:nodemailer@6.9.1"; // Importamos Nodemailer

console.log("Función de correo (Gmail) cargada.");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, html } = body;

    // 1. Leemos las credenciales de Gmail
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      throw new Error('Faltan las credenciales SMTP_USER o SMTP_PASS en Supabase.');
    }

    // 2. Configuramos el "Transportador" de Gmail
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // 3. Opciones del correo
    const mailOptions = {
      from: `"Gianna's Cookies" <${smtpUser}>`, // Aparecerá este nombre
      to: to,
      subject: subject,
      html: html,
    };

    console.log(`Enviando correo a ${to} vía Gmail...`);

    // 4. Enviar
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);

    return new Response(JSON.stringify({ message: 'Correo enviado vía Gmail' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error enviando correo:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
