# ADR-004 — Assets GLB, optimización en cliente y colisionadores proxy

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-005](005-imagen-3d-l1.md), [room-document-v1](../architecture/room-document-v1.md)

## Contexto

La plataforma acepta objetos 3D creados fuera del sistema (Blender, escáner, generador de imágenes). Eso plantea cuatro problemas que el código actual no tiene porque toda la geometría es procedural:

1. **Peso:** un GLB sin optimizar puede pesar decenas de MB y contener texturas 4K.
2. **Física:** una malla arbitraria no sirve como colisionador; Rapier necesita una forma estable.
3. **Escala y orientación:** cada exportador usa convenciones distintas (Y-up/Z-up, unidades, origen).
4. **Confianza:** el archivo es contenido de usuario y no puede ejecutarse ni consumir recursos sin límite.

El presupuesto es free tier: R2 con 10 GB y egreso cero, Workers con 30 ms de CPU. No hay servidor de procesamiento pesado en v1.

## Decisión

### 1. Asset inmutable, referenciado por ID

- Un asset es una fila en `assets` con un objeto en R2. **Nunca se muta**: reemplazar un objeto crea un asset nuevo y el documento apunta al nuevo.
- El `RoomDocument` guarda `assetId`, no rutas ni URLs.
- Los assets procesados son públicos por URL no adivinable (UUID); los originales quedan privados. Es aceptable porque el contenido está destinado a publicarse; los borradores no exponen originales.
- `ready` es el único estado en el que un asset puede usarse en una publicación.

### 2. Subida directa y validación barata

```text
1. POST /api/assets/upload-url   (auth) → URL firmada PUT a R2, 20 MB máx.
2. Cliente sube el GLB directo a R2 (no pasa por el Worker).
3. Cliente lee la cabecera glTF y el chunk JSON (sin decodificar buffers):
   cuenta nodos, meshes, materiales, texturas y extensión.
4. Cliente normaliza y optimiza (ver §3).
5. POST /api/assets/:id/finalize  (auth) → el Worker revalida:
   - magic glTF, versión, tamaño
   - chunk JSON: conteos, extensiones permitidas, tamaño del JSON
   - presupuesto de triángulos y texturas declarado
   - owner y cuota
   Marca ready o failed con motivo legible.
```

**Por qué no se decodifica el binario en el Worker:** 30 ms de CPU no alcanzan para parsear buffers grandes. La cabecera y el chunk JSON son suficientes para rechazar la mayoría de abusos; la validación profunda (geometría degenerada, UVs) se hace en el cliente y, si hace falta, en un job posterior.

### 3. Optimización en cliente

| Paso | Herramienta | v1 |
|---|---|---|
| Deduplicar y limpiar | `gltf-transform` en el navegador | Sí |
| Compresión de geometría | Draco (`draco3dgltf`) | Sí, lazy |
| Texturas | WebP (v1); KTX2/Basis (M3.5) | WebP |
| Resolución máxima | 2048×2048 | Sí |
| Triángulos máximos | 300k | Sí |
| Peso máximo tras optimizar | 15 MB | Sí |

Si el navegador no puede optimizar (sin WebAssembly, dispositivo lento), se acepta el GLB sin optimizar con un límite menor (10 MB). El wizard muestra el peso antes y después.

**Ventaja:** coste de servidor cero y menos bytes en R2. **Coste:** unos cientos de KB de WASM que se cargan solo al importar, y tiempo de CPU en el cliente.

### 4. Normalización

Todo asset entra al sistema con:

- **Y arriba.**
- **Origen en el centro de la base** (no en el centro geométrico).
- **Escala en metros**, con `bounds` calculados.
- **Rotación canónica**; el usuario ajusta en el editor si hace falta.

Si el GLB no declara unidades, se asume 1 unidad = 1 metro y se avisa. La escala real se confirma en el editor antes de publicar.

### 5. Colisionador proxy

- **Nunca** se usa la malla de render como colisionador.
- **Por defecto:** caja alineada a los bounds (`box`), barata y estable.
- **Opcional:** convex hull calculado en cliente con una muestra ≤ 5.000 vértices, guardado como `collider.points`.
- **Futuro:** descomposición convexa (V-HACD) para objetos grandes o compuestos.
- El editor muestra el colisionador y permite cambiarlo (`auto`, `box`, `none`).
- Los assets son **estáticos** en v1: cuerpo fijo en Rapier. No hay objetos dinámicos de usuario (evita inestabilidad y coste).

```json
{
  "type": "convex",
  "points": [[0, 0, 0], [1.2, 0, 0], "..."],
  "bounds": { "min": [-0.6, 0, -0.4], "max": [0.6, 1.2, 0.4] }
}
```

### 6. Layout de R2

```text
originals/{ownerId}/{assetId}/source.{glb|png|jpg}   privado
assets/{assetId}/model.glb                            público, inmutable
assets/{assetId}/thumb.webp                           público, inmutable
spaces/{spaceId}/rooms/{roomId}/{version}.json        público, inmutable
spaces/{spaceId}/manifest.json                        público, se reescribe en publish
spaces/{spaceId}/og/{roomId}-{version}.webp           público, inmutable
```

### 7. Cuotas y ciclo de vida

| Límite | v1 |
|---|---|
| Assets por usuario | 25 |
| Almacenamiento por usuario | 25 MB |
| Peso por GLB | 15 MB (10 MB sin optimizar) |
| Triángulos | 300k |
| Texturas | 2048×2048, ≤ 8 por asset |

- Al borrar un asset no referenciado, se borra el objeto de R2.
- Job periódico de reconciliación: assets `failed`/huérfanos > 30 días se eliminan.
- Al borrar la cuenta: borrado en cascada de DB y de objetos de R2 (por prefijo del owner).

## Consecuencias

### Positivas

- El coste de procesamiento es cero para el operador.
- R2 crece de forma controlada: la optimización ocurre antes de subir.
- Los colisionadores son estables y baratos; el jugador no atraviesa objetos ni se atasca.
- Los assets son inmutables y cacheables para siempre.
- El sistema no depende de un proveedor de optimización.

### Negativas y riesgos aceptados

- **Dependencia del cliente para validar:** un cliente modificado puede subir algo que no cumple. Mitigación: revalidación de cabecera/conteos en el Worker y presupuesto declarado; renderizado con límites; rechazo en carga si excede.
- **Tiempo de importación en dispositivos lentos:** se muestra progreso y se permite cancelar.
- **Calidad del colisionador convexo:** objetos con concavidades se comportan como su envolvente. Aceptable para props; el usuario puede elegir caja.
- **Sin LOD en v1:** un asset puede ser pesado visualmente aunque esté dentro del presupuesto. Se aborda en M6.
- **Formatos:** solo GLB. Otros formatos (FBX, OBJ, USDZ) se convierten fuera del sistema.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Procesar en el Worker | 30 ms de CPU y memoria limitada; no es viable para buffers grandes |
| Procesar en un servidor Node propio | Añade un servicio always-on que el free tier no sostiene |
| Aceptar el GLB tal cual | R2 se llena rápido y la experiencia se degrada |
| Trimesh del render como colisionador | Coste alto e inestable; el jugador se engancha |
| Colisionadores calculados en runtime | Repetir el cálculo en cada carga y en cada cliente; mejor almacenarlos |
| Guardar en Supabase Storage | Egreso de 5 GB y 1 GB de storage; R2 es mejor para assets |

## Verificación

- Test unitario: validador de cabecera GLB acepta/rechaza fixtures (válido, truncado, con extensión desconocida, gigante).
- Test de integración: subida → optimize → finalize → asset `ready` con `bounds` y `collider`.
- Prueba manual: GLB de 12 MB en un portátil medio; medir tiempo de importación y peso final.
- Prueba de física: colocar el asset, caminar contra él, comprobar que no se atraviesa.

## Referencias

- [`gltf-transform`](https://gltf-transform.dev/)
- [Draco](https://github.com/google/draco)
- [Rapier — colliders](https://rapier.rs/docs/user_guides/javascript/colliders/)
- [room-document-v1](../architecture/room-document-v1.md) — referencia de assets en nodos.
- [data-model.md](../architecture/data-model.md) — tabla `assets` y cuotas.
