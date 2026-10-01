// Fuente única del formulario de contacto: áreas, destinatarios, validación y armado del correo.
// La usan el endpoint /api/contacto, el formulario de la portada y los tests.

export const AREAS = [
  { id: 'civil', etiqueta: 'Litigación Civil', destino: 'rafael@rpabogados.cl' },
  { id: 'penal', etiqueta: 'Litigación Penal & Compliance', destino: 'yerko@rpabogados.cl' },
  { id: 'publico', etiqueta: 'Derecho Público & Administrativo', destino: 'rafael@rpabogados.cl' },
  { id: 'laboral', etiqueta: 'Litigación Laboral', destino: 'rafael@rpabogados.cl' },
  { id: 'otra', etiqueta: 'Otra materia', destino: 'rafael@rpabogados.cl' },
] as const;

export type AreaId = (typeof AREAS)[number]['id'];

// El socio director recibe copia de toda consulta: si el buzón del área falla, la consulta no se pierde.
export const COPIA_SIEMPRE = 'rafael@rpabogados.cl';
export const REMITENTE_POR_DEFECTO = 'Sitio web RP Abogados <formulario@rpabogados.cl>';
export const TIEMPO_MINIMO_MS = 3000;

export type EstadoEnvio = 'ok' | 'error' | 'config';

export const MENSAJES: Record<EstadoEnvio, string> = {
  ok: 'Recibimos su consulta. Le responderemos a la brevedad.',
  error: 'No pudimos enviar su consulta. Intente nuevamente o escríbanos a rafael@rpabogados.cl.',
  config: 'El envío en línea aún no está habilitado. Escríbanos a rafael@rpabogados.cl o por WhatsApp al +56 9 8549 7497.',
};

export const LIMITES = {
  nombre: { min: 2, max: 120 },
  email: { max: 254 },
  telefono: { max: 20 },
  mensaje: { min: 10, max: 5000 },
} as const;

export interface DatosContacto {
  nombre: string;
  email: string;
  telefono: string;
  area: AreaId;
  mensaje: string;
}

export type ResultadoValidacion =
  | { ok: true; datos: DatosContacto }
  | { ok: false; errores: Record<string, string> };

const RE_EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const RE_TELEFONO = /^[+\d\s().-]{8,20}$/;
// Caracteres de control (incluye saltos de línea) salvo en el mensaje, donde se permiten \n y \t.
const RE_CONTROL = /[\u0000-\u001F\u007F]/;
const RE_CONTROL_MENSAJE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validarContacto(entrada: Record<string, unknown>): ResultadoValidacion {
  const nombre = texto(entrada.nombre);
  const email = texto(entrada.email).toLowerCase();
  const telefono = texto(entrada.telefono);
  const area = texto(entrada.area);
  const mensaje = texto(entrada.mensaje).replace(/\r\n?/g, '\n');
  const consentimiento = texto(entrada.consentimiento);
  const errores: Record<string, string> = {};

  if (nombre.length < LIMITES.nombre.min || nombre.length > LIMITES.nombre.max || RE_CONTROL.test(nombre)) {
    errores.nombre = 'Ingrese su nombre completo.';
  }
  if (!email || email.length > LIMITES.email.max || !RE_EMAIL.test(email)) {
    errores.email = 'Ingrese un correo electrónico válido.';
  }
  if (telefono && !RE_TELEFONO.test(telefono)) {
    errores.telefono = 'Ingrese un teléfono válido (solo números, espacios y +).';
  }
  if (!AREAS.some((a) => a.id === area)) {
    errores.area = 'Seleccione el área de su consulta.';
  }
  if (mensaje.length < LIMITES.mensaje.min) {
    errores.mensaje = `Describa su asunto en al menos ${LIMITES.mensaje.min} caracteres.`;
  } else if (mensaje.length > LIMITES.mensaje.max || RE_CONTROL_MENSAJE.test(mensaje)) {
    errores.mensaje = `El mensaje no puede superar ${LIMITES.mensaje.max} caracteres.`;
  }
  if (consentimiento !== 'si') {
    errores.consentimiento = 'Debe aceptar el uso de sus datos para responder la consulta.';
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return { ok: true, datos: { nombre, email, telefono, area: area as AreaId, mensaje } };
}

// Honeypot lleno o envío más rápido de lo humanamente posible => bot.
// `transcurrido` lo mide el navegador (ms entre mostrar el formulario y enviarlo), así no depende
// del reloj del servidor ni de cuándo se construyó la página estática. Sin JavaScript no llega:
// en ese caso solo cuenta el honeypot, para no bloquear a personas sin JavaScript.
export function pareceBot(entrada: Record<string, unknown>): boolean {
  if (texto(entrada.sitio_web)) return true;
  const crudo = texto(entrada.transcurrido);
  if (!crudo) return false;
  const ms = Number(crudo);
  return !Number.isFinite(ms) || ms < TIEMPO_MINIMO_MS;
}

export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface Correo {
  from: string;
  to: string[];
  cc?: string[];
  reply_to: string;
  subject: string;
  text: string;
  html: string;
}

export function construirCorreo(datos: DatosContacto, remitente = REMITENTE_POR_DEFECTO): Correo {
  const area = AREAS.find((a) => a.id === datos.area) ?? AREAS[AREAS.length - 1];
  const filas: [string, string][] = [
    ['Nombre', datos.nombre],
    ['Correo', datos.email],
    ['Teléfono', datos.telefono || 'No indicado'],
    ['Área', area.etiqueta],
  ];
  const text = [
    'Nueva consulta desde el sitio web rpabogados.cl',
    '',
    ...filas.map(([k, v]) => `${k}: ${v}`),
    '',
    'Resumen del asunto:',
    datos.mensaje,
    '',
    'Responda directamente a este correo para contestarle al cliente.',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#12151B">
<p><strong>Nueva consulta desde el sitio web rpabogados.cl</strong></p>
<table cellpadding="4" style="border-collapse:collapse">${filas
    .map(([k, v]) => `<tr><td style="color:#5c636a">${k}</td><td><strong>${escaparHtml(v)}</strong></td></tr>`)
    .join('')}</table>
<p style="color:#5c636a;margin-top:16px">Resumen del asunto:</p>
<p style="white-space:pre-wrap">${escaparHtml(datos.mensaje)}</p>
<p style="color:#5c636a;font-size:12px">Responda directamente a este correo para contestarle al cliente.</p>
</div>`;

  return {
    from: remitente,
    to: [area.destino],
    ...(area.destino !== COPIA_SIEMPRE ? { cc: [COPIA_SIEMPRE] } : {}),
    reply_to: datos.email,
    subject: `Consulta web · ${area.etiqueta} · ${datos.nombre}`,
    text,
    html,
  };
}
