import type { APIRoute } from 'astro';
import {
  construirCorreo,
  pareceBot,
  validarContacto,
  MENSAJES,
  REMITENTE_POR_DEFECTO,
  type EstadoEnvio as Estado,
} from '../../lib/contacto';

export const prerender = false;

interface EnvContacto {
  RESEND_API_KEY?: string;
  CONTACTO_REMITENTE?: string;
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const quiereJson = (request.headers.get('accept') ?? '').includes('application/json');
  const responder = (estado: Estado, status: number, errores?: Record<string, string>) =>
    quiereJson
      ? new Response(JSON.stringify({ estado, mensaje: MENSAJES[estado], errores }), {
          status,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        })
      : redirect(`/?contacto=${estado}#contacto`, 303);

  let entrada: Record<string, unknown>;
  try {
    const form = await request.formData();
    entrada = Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  } catch {
    return responder('error', 400);
  }

  // A un bot se le responde "ok" para que no reintente ni aprenda a esquivar la trampa.
  if (pareceBot(entrada)) return responder('ok', 200);

  const validacion = validarContacto(entrada);
  if (!validacion.ok) return responder('error', 422, validacion.errores);

  const env = ((locals as { runtime?: { env?: EnvContacto } }).runtime?.env ?? {}) as EnvContacto;
  if (!env.RESEND_API_KEY) return responder('config', 503);

  const correo = construirCorreo(validacion.datos, env.CONTACTO_REMITENTE || REMITENTE_POR_DEFECTO);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(correo),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('contacto: Resend respondió', res.status, (await res.text()).slice(0, 500));
      return responder('error', 502);
    }
  } catch (e) {
    console.error('contacto: fallo de red al enviar', e);
    return responder('error', 502);
  }
  return responder('ok', 200);
};
