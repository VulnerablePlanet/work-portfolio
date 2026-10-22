# ADR-003 — Perfil público renderizado en servidor, sin three en el bundle público

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-001](001-shell-hosting.md), [ADR-002](002-espacio-habitacion-portal.md)

## Contexto

La aplicación actual es un canvas 3D: sin JS no hay contenido, y los buscadores no pueden indexar una escena. Para un portafolio, eso es un fallo de producto: el objetivo es que se **conozcan las habilidades de una persona**, no solo que se vea una habitación.

Además, la auditoría detectó que el fallback actual descarga `three` y `r3f` antes de redirigir (H-05) y que el estado de arranque se escribe directamente en el DOM (H-07). Un perfil renderizado en servidor resuelve ambos problemas de raíz y se convierte en la degradación graceful real.

## Decisión

### 1. Dos superficies de lectura

| Superficie | Render | Contenido | Indexable |
|---|---|---|---|
| Perfil del espacio `/u/:handle` | SSR en el Worker | Resumen, habitaciones publicadas, contenido de cada nodo interactivo, enlaces, contacto | Sí |
| Página de habitación `/u/:handle/:room` | SSR en el Worker | Contenido de esa habitación, portales, CTA a la experiencia | Sí (canonical propio) |
| Experiencia `/u/:handle/:room/room` | Cliente | Canvas 3D | No (`noindex`) |

El perfil **no es un fallback**: es el producto principal. La experiencia 3D es una mejora progresiva.

### 2. El perfil se construye desde el mismo documento

- El `RoomDocument` contiene `ContentBlock` por nodo (`eyebrow`, `title`, `body`, `links`).
- El perfil agrega los bloques de todas las habitaciones publicadas, agrupados por habitación y propósito.
- El panel 3D muestra exactamente el mismo bloque.
- No hay dos fuentes de contenido: si el usuario edita un texto, cambia en ambos sitios al publicar.

Esto evita la duplicación que la auditoría marcó como H-03/H-04 a escala de plataforma.

### 3. La ruta pública no importa three

Regla verificable:

```text
El grafo de módulos de /u/:handle y /u/:handle/:room
no contiene: three, @react-three/fiber, @react-three/drei,
             @react-three/rapier, gsap, zustand
```

Se implementa con:

- Rutas separadas y `lazy` para la experiencia.
- Un test de build que analice los chunks de la ruta pública y falle si aparece un import prohibido.
- Presupuesto: **JS de la ruta pública < 120 KB gzip**. Si se supera, se revisa antes de fusionar.

Consecuencia directa: el usuario sin WebGL, el buscador y el lector de pantalla reciben una página completa en HTML.

### 4. SEO y metadatos

| Elemento | Decisión |
|---|---|
| `<title>` | `{nombre} — {título del espacio}` |
| `meta description` | Resumen del espacio (máx. 160 caracteres) |
| Canonical | `/u/:handle` en el perfil; `/u/:handle/:room` en cada habitación |
| `noindex` | Experiencia 3D, editor, playtest, borradores, `unlisted` |
| Open Graph / Twitter | Título, resumen e imagen OG por habitación |
| JSON-LD | `Person` + `CreativeWork` por habitación |
| Sitemap | `/sitemap.xml` generado por espacio publicado; `lastmod` = `published_at` |
| `robots.txt` | Permite público; bloquea `/editor`, `/api`, `/admin` |

**Imagen OG:** se genera en el publish a partir del thumbnail de la habitación (render de la cámara de portada o la imagen del nodo principal). Se guarda en R2 como `spaces/{spaceId}/og/{roomId}-{version}.webp`.

### 5. Caché y frescura

- Perfil: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- Al publicar, se invalida la URL del perfil y de la habitación (purga por URL en M6; en M1 basta con el TTL corto).
- El documento publicado en R2 es inmutable y se cachea un año.
- Los borradores nunca se cachean.

### 6. Accesibilidad

- HTML semántico: un `h1`, secciones por habitación, listas de enlaces.
- Navegación por teclado y foco visible.
- Contraste AA.
- `prefers-reduced-motion`: desactiva animaciones y transiciones, no solo baja la calidad.
- La experiencia 3D es opcional y siempre hay un enlace de vuelta al perfil.
- El editor no es accesible solo por canvas: todo control tiene equivalente de teclado y campo numérico.

## Consecuencias

### Positivas

- Indexación real desde el primer día.
- El fallback deja de ser una página aparte mantenida a mano (`public/fallback.html`) y pasa a ser el perfil.
- Se elimina el arranque imperativo (`renderBootStatus`) y el estado de boot duplicado.
- Mejor primera impresión en redes y mensajería (OG image).
- Cumple el objetivo de accesibilidad sin renunciar a la experiencia 3D.

### Negativas y riesgos aceptados

- **Dos modos de render en la misma app.** Mitigación: la experiencia y el editor son rutas cliente explícitas; el resto es SSR.
- **Coste de SSR.** Mitigación: caché en el edge y consultas pequeñas (manifiesto + documentos).
- **Contenido duplicado entre perfil y habitación.** Mitigación: canonical por habitación y `noindex` en la experiencia.
- **OG images.** Requieren un paso de generación en publish; se pospone a M5 si bloquea M1.
- **Textos vacíos.** El perfil debe funcionar con habitaciones sin contenido interactivo; se muestran solo las que tienen bloques.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| SPA con contenido solo en canvas | No indexable, no accesible sin JS, primer render vacío |
| SPA + prerender en build | El contenido es de usuario y cambia en runtime; no se puede prerenderizar en CI |
| Snapshot HTML generado en publish y servido desde R2 | Válido y barato, pero exige un renderizador de plantillas aparte y re-render masivo al cambiar la plantilla. Se puede adoptar como optimización futura |
| Astro para el perfil y SPA para el resto | Duplica el shell y el sistema de rutas; el coste de mantenimiento supera el beneficio |
| SSR de todo, incluida la experiencia | La experiencia es intrínsecamente cliente (WebGL); renderizarla en servidor no aporta |

## Verificación

En M1a se añade un test que:

1. Construye la app.
2. Localiza los chunks de la ruta pública.
3. Falla si contienen `three`, `@react-three/*`, `gsap` o `zustand`.
4. Reporta el tamaño gzip de la ruta pública y falla si supera 120 KB.

## Referencias

- [ADR-001](001-shell-hosting.md) — shell y hosting.
- [room-document-v1](../architecture/room-document-v1.md) — `ContentBlock` y nodos.
- [overview.md](../architecture/overview.md) — atributos de calidad.
- Auditoría de arquitectura, hallazgos H-05 y H-07.
