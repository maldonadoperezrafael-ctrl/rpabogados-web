// Fuente única de los datos del estudio: la usan el Layout (SEO y datos estructurados),
// el footer y la política de privacidad.

export const SITIO = {
  nombre: 'RP Abogados',
  lema: 'Ayudamos a la gente',
  url: 'https://rpabogados.cl',
  descripcion:
    'Estudio jurídico en Providencia, Santiago. Litigación de alta complejidad en materias civiles, penales, contencioso administrativas y laborales en la Región Metropolitana y la Región de O’Higgins.',
  telefono: '+56985497497',
  telefonoVisible: '+56 9 8549 7497',
  whatsapp: 'https://wa.me/56985497497',
  email: 'contacto@rpabogados.cl',
  direccion: {
    calle: 'Eliodoro Yáñez 2084, oficina 41',
    comuna: 'Providencia',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
    pais: 'CL',
  },
  horario: { dias: 'Lunes a viernes', abre: '09:00', cierra: '18:00' },
  mapa: {
    embed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.475685817757!2d-70.6128527!3d-33.4368522!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662cf7a2163b4f9%3A0xb36d888126b23b1!2sAv.%20Eliodoro%20Y%C3%A1%C3%B1ez%202084%2C%20Providencia%2C%20Regi%C3%B3n%20Metropolitana!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl',
    enlace: 'https://www.google.com/maps/search/?api=1&query=Eliodoro%20Y%C3%A1%C3%B1ez%202084%2C%20Providencia%2C%20Santiago',
  },
  socios: [
    { nombre: 'Rafael Pérez Maldonado', cargo: 'Socio Fundador y Director de Litigios', email: 'rafael@rpabogados.cl' },
    { nombre: 'Yerko Scheihing Sepúlveda', cargo: 'Socio, Litigación Penal y Compliance', email: 'yerko@rpabogados.cl' },
  ],
  areas: [
    'Litigación Civil',
    'Litigación Penal y Compliance',
    'Derecho Público y Administrativo',
    'Litigación Laboral',
  ],
  zonas: ['Región Metropolitana de Santiago', 'Región del Libertador General Bernardo O’Higgins'],
} as const;

export function datosEstructurados() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${SITIO.url}/#estudio`,
    name: SITIO.nombre,
    slogan: SITIO.lema,
    description: SITIO.descripcion,
    url: `${SITIO.url}/`,
    logo: `${SITIO.url}/logo-rp-abogados.png`,
    image: `${SITIO.url}/og-rpabogados.png`,
    telephone: SITIO.telefono,
    email: SITIO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITIO.direccion.calle,
      addressLocality: SITIO.direccion.comuna,
      addressRegion: SITIO.direccion.region,
      addressCountry: SITIO.direccion.pais,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: SITIO.horario.abre,
        closes: SITIO.horario.cierra,
      },
    ],
    areaServed: SITIO.zonas.map((name) => ({ '@type': 'AdministrativeArea', name })),
    knowsAbout: [...SITIO.areas],
    employee: SITIO.socios.map((s) => ({ '@type': 'Person', name: s.nombre, jobTitle: s.cargo, email: s.email })),
  };
}

// URL canónica sin barra final ni ".html" (así están en el sitemap y así las indexa Google).
export function urlCanonica(pathname: string): string {
  let ruta = pathname.replace(/\.html$/, '').replace(/\/index$/, '');
  if (ruta.length > 1) ruta = ruta.replace(/\/+$/, '');
  return `${SITIO.url}${ruta || '/'}`;
}
