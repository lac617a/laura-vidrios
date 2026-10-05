# Lanzamiento (Hito C)

Checklist de salida a producción del Sprint 10. Lo que ya está hecho en el código está marcado; el
resto depende de cuentas, del negocio o de pruebas con dispositivos reales.

---

## 1. Infraestructura (una sola vez)

- [ ] **GitHub:** repositorio privado y primer push de `main`. El CI corre formato, lint, tipos,
      tests, build y E2E (Chrome, Android e iPhone con WebKit) contra Postgres 18.
- [ ] **Neon:** proyecto en `us-east-1` con Postgres 18 y rama `main` para producción.
- [ ] **Vercel:** crear el proyecto desde el repo (región `iad1`, ya en `vercel.json`) y conectar
      la integración Vercel ↔ Neon: crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`, y una rama de
      BD por cada preview.
- [ ] **Variables en Vercel** (producción y preview por separado):

  | Variable | Producción | Preview |
  |----------|------------|---------|
  | `BETTER_AUTH_SECRET` | secreto propio | **otro** secreto |
  | `BETTER_AUTH_URL` | `https://<proyecto>.vercel.app` | — (usa el host del deploy) |
  | `NEXT_PUBLIC_SITE_URL` | `https://<proyecto>.vercel.app` | — (usa el host del deploy) |
  | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | sí | sí |
  | `CANONICAL_HOST` | solo cuando haya dominio | **nunca** |

- [ ] **Plan Pro de Vercel:** uso comercial, eventos personalizados de Web Analytics y alertas.
- [ ] **Web Analytics:** activarlo en el proyecto (pestaña Analytics) y volver a desplegar.
- [ ] **Neon:** revisar la ventana de restauración point-in-time del plan y **probar una
      restauración** creando una rama desde un punto anterior (sin tocar `main`).

> La base de producción solo cambia con `pnpm db:deploy` (lo corre el build de Vercel). Nunca
> `migrate dev`, `migrate reset`, `db push` ni el seed contra Neon.

## 2. Primer deploy

- [ ] `https://<proyecto>.vercel.app/api/health` responde `{"status":"ok","database":"ok"}`.
- [ ] Crear la cuenta de la dueña (rol `OWNER`) contra producción, desde un archivo local que no se
      sube al repo:

  ```bash
  pnpm admin:create --env-file .env.production.local --email <correo> --name <nombre>
  ```

- [ ] La dueña entra a `/admin/configuracion` y completa: nombre del negocio, WhatsApp, cobertura,
      envío e instalación, medidas y marcos a la medida, política de datos, redes, foto del hero y
      cifras reales de los contadores (o vacías para ocultarlas).
- [ ] Carga del catálogo real (Hito A): fotos, precios con IVA, medidas y destacados.

## 3. Verificaciones en producción

- [ ] **WhatsApp real:** consulta desde un producto, desde «a la medida» y desde el botón flotante,
      en la app del celular y en WhatsApp Web. El mensaje llega con referencia, medida y código; el
      enlace muestra la vista previa con la foto; la consulta aparece en `/admin/consultas`.
- [ ] **Lighthouse móvil ≥ 90** en `/`, `/espejos`, una ficha y `/a-la-medida` (PageSpeed Insights
      sobre el deploy). En local: 91–93, 90, 90 y 91; accesibilidad y SEO 100.
- [ ] **SEO:** `/robots.txt` apunta al sitemap; `/sitemap.xml` lista solo productos publicados; los
      previews responden `Disallow: /`. Ficha compartida → og:image de la foto del producto.
- [ ] **Analítica:** en el panel de Vercel aparecen `whatsapp_click`, `custom_quote_click` y
      `filter_used` tras probarlos (los eventos personalizados necesitan Pro).
- [ ] **Cabeceras:** `curl -I` muestra `X-Frame-Options: DENY`, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy` y la CSP básica.

## 4. Matriz de QA (dispositivos reales)

Automatizado en cada push: Chrome de escritorio, Android (Pixel 7) e iPhone (WebKit), incluida la
auditoría WCAG 2.2 AA con axe. `E2E_WEBKIT=all pnpm e2e` suma Safari de escritorio en local.

| Flujo | iPhone (Safari) | Android gama media (Chrome) | Desktop Chrome | Desktop Safari | WhatsApp app | WhatsApp Web |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Landing y menú | ☐ | ☐ | ☐ | ☐ | — | — |
| Catálogo y filtros | ☐ | ☐ | ☐ | ☐ | — | — |
| Ficha → consulta | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| A la medida → consulta | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Vista previa del enlace | — | — | — | — | ☐ | ☐ |
| Admin: login, productos, consultas | ☐ | ☐ | ☐ | ☐ | — | — |

Revisión manual de accesibilidad: recorrer cada página solo con teclado (el primer Tab muestra
«Saltar al contenido»), con VoiceOver en el iPhone y con zoom al 200 %.

## 5. Legal (con un asesor)

- [ ] **Política de tratamiento de datos** (Ley 1581 de 2012, Decreto 1377 de 2013): responsable
      con NIT o cédula, dirección y correo; finalidades (atender consultas, cotizar, instalar);
      derechos del titular y cómo ejercerlos; plazos de respuesta; vigencia. Se edita en
      Configuración y se publica en `/politica-de-datos`.
- [ ] Evaluar si aplica el registro de bases de datos ante la SIC (RNBD).
- [ ] **Precios** (Ley 1480 de 2011): los precios visibles incluyen IVA (lo dice el pie de página);
      confirmar el texto y qué se informa cuando el precio es «a consultar».
- [ ] Garantía y tiempos de fabricación y entrega (pendiente del negocio, PRD §15).

## 6. Monitoreo

- Errores del servidor: una línea JSON por error en los logs de Vercel (`"event":"request_error"`,
  con ruta, método y `digest`). La pantalla de error muestra el mismo código para cruzarlo.
- [ ] Configurar en Vercel (Observability → Alerts) una alerta por errores 5xx o fallas de
      funciones, con aviso por correo.
- [ ] Monitor externo gratuito (p. ej. UptimeRobot) contra `/api/health` cada 5 minutos.
- Sentry queda opcional: hoy basta con logs + alertas para el volumen esperado.

## 7. Go-live

- [ ] Todo lo anterior marcado y CI en verde sobre `main`.
- [ ] Demo final con la dueña: recibe una consulta real, la encuentra por código y la mueve de estado.
- [ ] Anuncio en redes con enlaces directos a productos (la vista previa ya muestra la foto).
- [ ] Cuando se compre el dominio: seguir la «Tarea flotante: dominio propio» del ROADMAP
      (`CANONICAL_HOST` activa la redirección 308 desde `*.vercel.app`).
