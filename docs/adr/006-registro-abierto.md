# ADR-006 — Registro abierto con verificación, cuotas y moderación

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-001](001-shell-hosting.md), [ADR-002](002-espacio-habitacion-portal.md), [ADR-007](007-telemetria-y-privacidad.md)

## Contexto

La plataforma se abre al público desde el primer día: cualquiera puede registrarse y publicar un espacio 3D. Eso es bueno para la comunidad y para la adopción, pero cambia por completo el modelo de amenaza y el coste:

- Contenido generado por usuarios (textos, imágenes, GLB, habitaciones).
- Almacenamiento y ancho de banda que paga el operador.
- Riesgo de spam, contenido ofensivo, copyright y abuso de subida.
- Un proyecto open source que además opera una instancia oficial: la reputación está en juego.

El plan gratuito no tiene margen para moderación manual intensiva ni para inferencia GPU abierta. La política debe ser **automática por defecto, manual por excepción**.

## Decisión

### 1. Registro y verificación

| Paso | Control |
|---|---|
| Registro | GitHub OAuth o email con enlace mágico; Turnstile en el formulario |
| Verificación | Email verificado obligatorio antes de publicar o de crear assets |
| Perfil | Handle único, nombre visible, headline; sin datos sensibles |
| Sesión | Cookies `HttpOnly`, `Secure`, `SameSite=Lax` vía `@supabase/ssr` |
| Recuperación | Email; sin preguntas secretas |
| Baja | Borrado de cuenta en cascada (DB + R2) y exportación previa |

### 2. Cuotas

| Recurso | Límite v1 |
|---|---|
| Espacios | 1 |
| Habitaciones por espacio | 8 |
| Nodos por habitación | 150 |
| Assets por usuario | 25 |
| Almacenamiento por usuario | 25 MB |
| Peso por GLB | 15 MB (10 MB sin optimizar) |
| Publicaciones por hora | 10 |
| Guardados de borrador | 60/min |
| Subidas por hora | 20 |
| Trabajos L1 | No se limitan por job: se ejecutan en el cliente. El límite real son las subidas y el almacenamiento |

Las cuotas se aplican en el servidor, no solo en la UI. Los contadores se actualizan por trigger y se reconcilian con un job periódico.

### 3. Rate limits

- Por IP y por usuario en el Worker (binding de rate limiting o contador en Postgres).
- Límites específicos en: registro, login, publish, upload-url, finalize, reportes.
- Supabase Auth tiene sus propios límites; se configuran y se documentan.
- Cloudflare WAF/Bot Fight para tráfico anómalo.

### 4. Publicación con período de prueba

Política recomendada (revisable si la operación lo exige):

| Estado de la cuenta | Publicación |
|---|---|
| Nueva (< 72 h o sin email verificado) | `unlisted`: accesible por enlace, `noindex`, no aparece en directorios |
| Establecida (≥ 72 h, email verificado, sin reportes) | `published`: indexable y listada |
| Con reportes abiertos | `published` se mantiene hasta 3 reportes; luego `suspended` |
| Suspendida | `noindex`, sin acceso público, apelable por email |

La promoción de `unlisted` a `published` es automática y auditada. El usuario ve el estado en el editor.

### 5. Moderación

| Elemento | v1 |
|---|---|
| Reporte público | Botón en perfil y experiencia; motivos: spam, acoso, sexual, violencia, copyright, otro |
| Auto-ocultar | 3 reportes distintos → `suspended` pendiente de revisión |
| Cola de admin | `/admin/reports` con contexto (captura de la habitación, textos, assets) |
| Acciones | Ocultar, restaurar, suspender, borrar; con nota y log |
| Apelación | Email de contacto; respuesta manual |
| Copyright | Contacto de abuso/DMCA en la política de contenido |
| Registro de auditoría | `moderation_actions` inmutable |

**No hay revisión previa** en v1: no escala y mata el onboarding. Se compensa con verificación, cuotas, período de prueba y reportes.

### 6. Contenido y legal

Antes del lanzamiento público:

- **Términos de servicio** con versión aceptada y registro de aceptación.
- **Política de contenido** (qué no se permite, cómo se reporta, cómo se apela).
- **Política de privacidad** (datos recogidos, finalidad, retención, derechos, cookies).
- **Contacto de abuso** y **DMCA** si aplica.
- **Edad mínima** según jurisdicción; se declara en el registro.
- **Exportación y borrado** de datos en `/settings`.

Esto no es asesoría legal: los textos deben revisarse antes de abrir el registro masivo.

### 7. Coste y abuso

- **L1 no cuesta** (se ejecuta en el cliente), pero las subidas sí: cuotas y lifecycle de R2.
- **L2 no se abre** sin créditos o BYO key; nunca inferencia gratuita ilimitada.
- **Kill switches** operables sin desplegar:
  - cerrar registro,
  - pasar todas las publicaciones nuevas a `unlisted`,
  - deshabilitar subidas,
  - deshabilitar jobs.
- Umbrales de alerta: R2 > 70% (7 GB), DB > 70% (350 MB), Workers > 50k/día, tasa de reportes > 1% de publicaciones.

### 8. Modelo de amenaza (resumen)

| Amenaza | Vector | Control |
|---|---|---|
| Spam de cuentas | Registro automatizado | Turnstile, email, rate limit, cuotas |
| Spam de habitaciones | Publicación masiva | Límite 8 habitaciones, 10 publish/h, `unlisted` inicial |
| XSS | Textos y enlaces | Sin HTML, escape en SSR, esquema `http/https`, CSP |
| Contenido ofensivo | Imágenes y textos | Reportes, auto-ocultar, revisión, política |
| Copyright | Assets subidos | Términos, DMCA, takedown |
| Abuso de storage | Subidas grandes | Límites por archivo/usuario, validación, lifecycle |
| Fuerza bruta | Login | Rate limits, Supabase Auth, Turnstile |
| Scraping | Perfiles públicos | Rate limits, WAF, sin datos sensibles |
| Ejecución remota | Prefabs o scripts de usuario | **No se acepta código de usuario**; prefabs son código del proyecto |
| Fuga de datos | RLS mal configurada | RLS por tabla, tests de políticas, clave de servicio solo en servidor |

## Consecuencias

### Positivas

- Crecimiento sin fricción ni intervención manual constante.
- Riesgo acotado por diseño: cuotas, período de prueba y reportes.
- El operador puede dormir: los controles son automáticos y reversibles.
- La comunidad puede usar la instancia oficial sin coste y auto-hostear si quiere más control.

### Negativas y riesgos aceptados

- **Contenido ofensivo puede llegar a publicarse** antes de ser reportado. Mitigación: reportes, auto-ocultar y revisión rápida.
- **Coste de moderación** recae en el mantenedor al inicio.
- **Falsos positivos** del auto-ocultar. Mitigación: apelación y restauración.
- **Legal**: sin textos revisados, el registro abierto es un riesgo. Es un bloqueante de lanzamiento, no de desarrollo.
- **Cuotas percibidas como bajas**: 25 MB puede ser poco para un usuario intensivo. Se ajustan con datos de uso.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Solo por invitación | Seguro, pero contradice la decisión de registro abierto y limita la comunidad |
| Revisión manual antes de publicar | No escala para una persona y bloquea el onboarding |
| Registro abierto sin controles | Abuso y coste inasumibles en free tier |
| Solo OAuth de GitHub | Excluye a parte del público; se ofrece también email |
| Pago para publicar | Barrera de entrada contraria a "portafolio para cualquiera" |

## Verificación

- Test de RLS: un usuario no puede leer ni escribir habitaciones ajenas.
- Test de cuotas: el intento 26 de asset falla con error claro.
- Test de flujo: cuenta nueva publica → `unlisted` → tras 72 h (simuladas) → `published`.
- Test de moderación: 3 reportes → `suspended`; admin restaura.
- Simulación de abuso: 100 registros automatizados → Turnstile/rate limit bloquean.

## Referencias

- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [data-model.md](../architecture/data-model.md) — RLS y tablas de moderación.
