import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AREAS,
  COPIA_SIEMPRE,
  TIEMPO_MINIMO_MS,
  construirCorreo,
  escaparHtml,
  pareceBot,
  validarContacto,
} from '../src/lib/contacto.ts';

const valido = {
  nombre: '  Francisco González ',
  email: ' Francisco@Ejemplo.CL ',
  telefono: '+56 9 1234 5678',
  area: 'penal',
  mensaje: 'Necesito asesoría por una querella en curso.',
  consentimiento: 'si',
};

test('acepta una consulta válida y normaliza los datos', () => {
  const r = validarContacto(valido);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.datos.nombre, 'Francisco González');
  assert.equal(r.datos.email, 'francisco@ejemplo.cl');
  assert.equal(r.datos.area, 'penal');
});

test('el teléfono es opcional', () => {
  assert.equal(validarContacto({ ...valido, telefono: '' }).ok, true);
});

const casosInvalidos: [string, Record<string, string>, string][] = [
  ['sin consentimiento', { consentimiento: '' }, 'consentimiento'],
  ['correo inválido', { email: 'no-es-correo' }, 'email'],
  ['correo con espacios', { email: 'a b@c.cl' }, 'email'],
  ['nombre muy corto', { nombre: 'A' }, 'nombre'],
  ['nombre con salto de línea (inyección de cabeceras)', { nombre: 'Juan\nBcc: x@y.cl' }, 'nombre'],
  ['área inexistente', { area: 'tributario' }, 'area'],
  ['área vacía', { area: '' }, 'area'],
  ['mensaje muy corto', { mensaje: 'Hola' }, 'mensaje'],
  ['mensaje muy largo', { mensaje: 'x'.repeat(5001) }, 'mensaje'],
  ['teléfono con letras', { telefono: 'llámame' }, 'telefono'],
];

for (const [nombre, cambio, campo] of casosInvalidos) {
  test(`rechaza: ${nombre}`, () => {
    const r = validarContacto({ ...valido, ...cambio });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.ok(r.errores[campo], `esperaba error en "${campo}", obtuvo ${JSON.stringify(r.errores)}`);
  });
}

test('rechaza campos que no son texto', () => {
  const r = validarContacto({ ...valido, nombre: 123 as unknown as string });
  assert.equal(r.ok, false);
});

test('detecta bots por honeypot y por velocidad', () => {
  const ahora = 1_000_000_000_000;
  const humano = String(ahora - TIEMPO_MINIMO_MS - 1);
  assert.equal(pareceBot({ t: humano }, ahora), false);
  assert.equal(pareceBot({ t: humano, sitio_web: 'http://spam' }, ahora), true);
  assert.equal(pareceBot({ t: String(ahora - 500) }, ahora), true);
  assert.equal(pareceBot({}, ahora), true);
  assert.equal(pareceBot({ t: 'abc' }, ahora), true);
});

test('enruta cada área a su socio y copia siempre al socio director', () => {
  for (const area of AREAS) {
    const r = validarContacto({ ...valido, area: area.id });
    assert.equal(r.ok, true);
    if (!r.ok) continue;
    const correo = construirCorreo(r.datos);
    assert.deepEqual(correo.to, [area.destino]);
    const destinatarios = [...correo.to, ...(correo.cc ?? [])];
    assert.ok(destinatarios.includes(COPIA_SIEMPRE), `${area.id} no incluye a ${COPIA_SIEMPRE}`);
    assert.equal(new Set(destinatarios).size, destinatarios.length, `${area.id} duplica destinatarios`);
  }
});

test('penal va a yerko@ con copia a rafael@', () => {
  const r = validarContacto(valido);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const correo = construirCorreo(r.datos);
  assert.deepEqual(correo.to, ['yerko@rpabogados.cl']);
  assert.deepEqual(correo.cc, ['rafael@rpabogados.cl']);
  assert.equal(correo.reply_to, 'francisco@ejemplo.cl');
  assert.doesNotMatch(correo.subject, /[\r\n]/);
});

test('escapa HTML del cliente en el cuerpo del correo', () => {
  const r = validarContacto({ ...valido, mensaje: '<script>alert(1)</script> & "comillas"' });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const { html, text } = construirCorreo(r.datos);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;comillas&quot;/);
  assert.match(text, /<script>alert\(1\)<\/script>/);
  assert.equal(escaparHtml(`'<>&"`), '&#39;&lt;&gt;&amp;&quot;');
});
