# ADR-007 — Telemetría apagada por defecto; errores técnicos opt-in

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-006](006-registro-abierto.md), [ADR-003](003-perfil-publico-ssr.md)

## Contexto

Un proyecto open source que opera una instancia oficial necesita saber si funciona: tasa de fallback, errores de carga, jobs fallidos, publicación. Pero la telemetría es también el punto donde un proyecto de comunidad pierde confianza: scripts de terceros, cookies, fingerprinting y datos que se van sin que el usuario lo sepa.

La pregunta correcta no es "¿qué podemos medir?", sino "¿qué decisión depende de este dato?".

## Decisión

### 1. v1 sin analítica de producto

- **No** se incluye Google Analytics, Plausible, PostHog, Meta Pixel ni equivalente.
- **No** se añaden cookies de terceros ni fingerprinting.
- **No** se envía nada desde el cliente por defecto.

### 2. Errores técnicos opt-in

- Un **error boundary** de aplicación captura errores de render y de canvas.
- Un endpoint propio `POST /api/errors` recibe eventos **anónimos y muestreados** (máx. 20/día por sesión).
- El evento contiene: tipo, mensaje saneado, ruta, backend (webgpu/webgl2), versión del documento, user agent reducido. **Nunca** email, handle, IP completa, contenido de la habitación ni texto del usuario.
- Retención: 30 días. Agregación por tipo de error.
- **Desactivado por defecto** en self-host (`TELEMETRY_ENABLED=false`); la instancia oficial lo activa y lo documenta en la política de privacidad.

### 3. Métricas del servidor

Lo que ya existe sin instrumentar al usuario:

| Pregunta | Dato |
|---|---|
| ¿La gente publica? | Conteo de `rooms.visibility = 'published'` por semana |
| ¿Fallan los jobs? | `asset_jobs.status = 'failed'` por tipo y proveedor |
| ¿Cuánta gente cae al perfil sin 3D? | Peticiones a `/u/:handle` vs. `/u/:handle/:room/room` |
| ¿Crece el storage? | Suma de `assets.bytes` y uso de R2 |
| ¿Hay abuso? | Reportes por 1.000 publicaciones |
| ¿Cuánto tarda el perfil? | Métricas de Workers (p50/p95) y caché hit ratio |

### 4. Rendimiento: se mide en CI, no en el usuario

- Presupuestos de bundle (ruta pública < 120 KB gzip).
- Presupuesto por habitación (nodos, triángulos, texturas).
- Lighthouse/CI sobre el perfil público y la experiencia.
- Banco de pruebas con una habitación de referencia.

Esto detecta regresiones antes de desplegar sin necesidad de RUM.

### 5. Si más adelante se necesita analítica de producto

Requisitos mínimos antes de añadirla:

1. Una pregunta concreta que no se pueda responder con datos del servidor.
2. Implementación sin cookies (Cloudflare Web Analytics o Plausible self-hosted).
3. `TELEMETRY_ENABLED` como interruptor y documentación clara.
4. Sin datos personales; agregación; retención definida.
5. Aviso visible y opción de exclusión.

### 6. Puerta de telemetría

El código usa un puerto `Telemetry` con implementación **no-op** por defecto:

```ts
interface Telemetry {
  event(name: string, props: Record<string, string | number | boolean>): void;
  error(error: unknown, context: Record<string, string | number>): void;
}
```

Cambiar de proveedor no debe tocar dominio, editor ni experiencia.

## Consecuencias

### Positivas

- Confianza de la comunidad: el proyecto no "llama a casa".
- Self-host limpio y predecible.
- Menos superficie de seguridad y menos dependencias.
- Las decisiones de producto se apoyan en datos del servidor, no en rastreo.

### Negativas y riesgos aceptados

- **Punto ciego en el cliente:** no se sabe con precisión qué porcentaje de usuarios tiene WebGPU, cuántos abandonan en el editor o qué errores ocurren en dispositivos que no reportan.
- **Menos datos para priorizar.** Se compensa con entrevistas, pruebas moderadas y métricas de servidor.
- **La instancia oficial y el self-host pueden divergir** en datos disponibles; se documenta.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Google Analytics | Cookies, terceros y contradice el contrato de privacidad |
| Plausible/PostHog desde v1 | Útil, pero antes de tener usuarios es ruido y añade dependencia |
| Sentry desde v1 | Se puede adoptar como opt-in; no es necesario para lanzar y complica el self-host |
| RUM propio con muestreo alto | Coste y privacidad; se pospone |
| Sin ningún dato | No se podría saber si los jobs fallan o si el storage crece; los datos del servidor son suficientes |

## Verificación

- Test: con `TELEMETRY_ENABLED=false`, el cliente no realiza peticiones a `/api/errors`.
- Revisión de red en el navegador: cero peticiones a dominios de terceros.
- Documento de privacidad enumera exactamente qué se recoge.

## Referencias

- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)
- [Plausible](https://plausible.io/)
- [ADR-003](003-perfil-publico-ssr.md) — presupuestos de la ruta pública.
