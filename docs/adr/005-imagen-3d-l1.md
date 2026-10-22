# ADR-005 — Imagen→3D v1: relieve (L1) en el cliente; L2 condicionado a experimento

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-004](004-assets-y-colisionadores.md), [ADR-001](001-shell-hosting.md)

## Contexto

El objetivo de producto incluye que una persona pueda **crear objetos 3D a partir de una imagen** para su habitación. La expectativa natural es "subo la foto de mi silla y aparece la silla". El estado del arte no cumple esa expectativa de forma fiable:

- La inferencia imagen→3D produce mallas plausibles, no objetos métricos, orientados y con topología limpia.
- Requiere GPU; el plan gratuito no la tiene.
- Los modelos abiertos tienen licencias distintas y algunas no permiten uso comercial del output o el despliegue por terceros.
- Generar un colisionador y una escala real es trabajo adicional al modelo.

Al mismo tiempo, hay un caso de uso que sí es barato, fiable y valioso: convertir una imagen en una **placa con relieve** (póster, logo, cuadro, certificado, señal). Eso se puede hacer sin servidor y sin GPU de pago.

## Decisión

### 1. Alcance de v1: solo L1

| Nivel | Qué es | v1 |
|---|---|---|
| **L0** | La imagen se usa como contenido: cuadro, póster, mural | Sí (parte del editor) |
| **L0.5** | Panorama 360/equirectangular como fondo de la habitación | Sí (M2) |
| **L1** | Imagen → malla de relieve con textura y colisión de caja | **Sí (M4)** |
| **L2** | Imagen(es) → objeto 3D real (GLB con textura) | Solo si pasa el experimento |
| **L3** | Reconstrucción de una habitación desde fotos | No |

**L1 no promete un objeto 3D.** Promete un relieve utilizable. El wizard lo dice con ejemplos visuales. La vía principal para objetos reales sigue siendo **subir un GLB** (ADR-004).

### 2. Dónde se ejecuta

**En el navegador**, en un Web Worker:

- La imagen no sale del dispositivo (privacidad).
- Coste marginal cero para el operador.
- Sin cola, sin GPU de servidor, sin límites de Workers.
- WebGPU con fallback WASM; si no hay ninguno, se ofrece "tarjeta plana".

**Coste:** el modelo (~25 MB cuantizado) se descarga una vez, solo al abrir el wizard, y se cachea. En un móvil viejo puede tardar 10–30 s.

### 3. Pipeline

```text
Imagen (≤ 4096 px, ≤ 10 MB)
  → decodificar y limitar a 1024 px de lado mayor
  → estimación de profundidad monocular (Depth Anything V2 Small / MiDaS)
  → mapa de profundidad normalizado
  → malla de rejilla (128–192 segmentos) desplazada en Z
  → UVs desde la imagen + normales
  → escala real: ancho y grosor indicados por el usuario (metros)
  → GLB + textura WebP
  → colisionador = caja (ancho × alto × grosor)
  → thumbnail + bounds + stats
  → subida a R2 como asset normal
```

Parámetros expuestos al usuario:

| Parámetro | Rango | Valor por defecto |
|---|---|---|
| Ancho real | 0,1–5 m | 0,6 m |
| Grosor del relieve | 1–30 cm | 4 cm |
| Intensidad de profundidad | 0–2 | 1 |
| Invertir profundidad | Sí/No | No |
| Recorte | Manual (arrastre) | Sin recorte |

### 4. Modelo y licencias

- Candidatos: `onnx-community/depth-anything-v2-small` (Transformers.js) y MiDaS small.
- La licencia del **código** y la de los **pesos** se verifican por separado antes de empaquetar. No se asume que "open source" implique uso comercial del output.
- Se registra `model` y `license` en el asset generado.
- Si la licencia no permite el uso previsto, se sustituye el modelo; el pipeline es agnóstico.

### 5. Expectativas y límites

- Funciona bien en: pósteres, logos, cuadros, certificados, mapas, bajorrelieves, texturas de pared.
- Funciona mal en: muebles, personas, objetos con partes finas o huecos.
- No genera un objeto "por detrás": es una placa, no una reconstrucción.
- El resultado se puede escalar, rotar y colgar; no se puede editar la malla.

La UI usa el término **"relieve"**, no "objeto 3D", y muestra tres ejemplos buenos y tres malos antes de empezar.

### 6. Aceptación de L1

| Métrica | Umbral |
|---|---|
| Tiempo total (portátil medio, imagen 1024 px) | ≤ 30 s |
| Tasa de resultados usables sin retoque | ≥ 80% en las 10 imágenes de prueba |
| Peso del GLB resultante | ≤ 2 MB |
| Fallback funcional sin WebGPU | Tarjeta plana en ≤ 2 s |
| Privacidad | Ninguna imagen sale del navegador |

### 7. L2: condición para construirlo

Antes de invertir en GPU:

1. Recolectar 20 fotos reales de objetos de portafolio (silla, lámpara, teclado, planta, taza, herramienta).
2. Probar al menos tres modelos candidatos (TripoSR, TRELLIS, Stable Fast 3D) con la misma entrada.
3. Medir: tasa de "usable sin retoque", tiempo de limpieza manual, coste por trabajo, licencia.
4. Criterio de avance: **≥ 60% usable** y coste por trabajo compatible con créditos o BYO key.
5. Si no se cumple, L2 no se construye y se refuerza L1 + GLB.

L2, si se construye, corre en un worker externo con GPU, con cola en `asset_jobs`, cuota y estados visibles. Nunca en el camino crítico de la publicación.

## Consecuencias

### Positivas

- Se entrega valor real de "imagen → 3D" sin coste de infraestructura.
- Privacidad por diseño.
- El sistema de assets no distingue el origen: relieve, GLB y prefab son lo mismo para el renderer.
- La expectativa se gestiona antes de que el usuario invierta tiempo.

### Negativas y riesgos aceptados

- **No cumple la visión completa** de "objeto 3D desde una foto". Se mitiga con comunicación honesta y con GLB como vía principal.
- **Rendimiento variable** según dispositivo.
- **Descarga del modelo** en la primera sesión.
- **Licencias**: hay que verificarlas antes de empaquetar y antes de ofrecer el servicio a terceros.
- **Calidad del relieve**: depende de la profundidad estimada; imágenes planas o con fondo complejo dan artefactos.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| L2 desde v1 con GPU de pago | Coste recurrente sin validación de calidad; contradice el presupuesto cero |
| Inferencia en Workers | 30 ms de CPU por request; inviable |
| Servidor CPU con ONNX | Lento y always-on; el free tier no lo sostiene |
| Solo GLB, sin imagen→3D | Se pierde el diferenciador y parte del objetivo de producto |
| Reconstrucción de habitación desde fotos (L3) | Muy por encima del estado del arte para un equipo pequeño; no es el 80/20 |
| Usar un servicio comercial de imagen→3D desde v1 | Coste por trabajo y dependencia; se puede ofrecer como BYO key más adelante |

## Referencias

- [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2)
- [Transformers.js](https://github.com/huggingface/transformers.js)
- [TripoSR](https://github.com/VAST-AI-Research/TripoSR)
- [TRELLIS](https://github.com/microsoft/TRELLIS)
- [Stable Fast 3D](https://github.com/Stability-AI/stable-fast-3d)
- [ADR-004](004-assets-y-colisionadores.md) — pipeline de assets y colisionadores.
