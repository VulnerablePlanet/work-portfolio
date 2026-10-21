# Fase 7 — despliegue y CI/CD

## Estado

Este proyecto queda preparado para CI/CD, pero **no queda desplegado automáticamente** hasta conectar un proveedor real: Vercel, Netlify o GitHub Pages.

## Pipeline agregado

Archivo: `.github/workflows/ci.yml`

El pipeline ejecuta:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. Lighthouse CI sobre:
   - `/`
   - `/fallback.html`

## Performance budgets de Lighthouse

Archivo: `.lighthouserc.cjs`

Budgets actuales:

- Performance: warning si baja de `0.80`
- Accessibility: error si baja de `0.90`
- SEO: error si baja de `0.90`
- FCP: warning sobre `2000ms`
- TTI: warning sobre `2500ms`
- Total byte weight: warning sobre `2.2MB`
- Script size: warning sobre `1.7MB`

Las assertions son explícitas: no se usa el preset `lighthouse:recommended` para evitar que auditorías informativas (por ejemplo `unused-javascript` o `network-dependency-tree-insight`) rompan el pipeline. `errors-in-console` sí es bloqueante y el favicon incluido evita el 404 de `/favicon.ico`.

## Opción recomendada de hosting

Para este proyecto, recomiendo Vercel o Netlify primero:

- **Vercel**: excelente DX y previews rápidos.
- **Netlify**: muy bueno para sitios estáticos y headers/cache avanzados.
- **GitHub Pages**: útil, pero menos cómodo si luego queremos headers finos para assets comprimidos.

## Variables y secretos

El repositorio ya está inicializado localmente en la rama `main`, pero todavía no tiene remoto. Tampoco se agregaron secretos de despliegue porque no hay proveedor conectado.

Cuando exista remoto, el siguiente paso será elegir proveedor y agregar el workflow de deploy correspondiente.

## Comandos locales seguros

```bash
npm install
npm run dev
npm run typecheck
```

No ejecutes build local si quieres mantener la regla actual del proyecto. El build queda reservado para CI.

## Lighthouse local en Windows

`Lighthouse CI` no es un comando válido de PowerShell. El comando real es el
CLI de LHCI:

```powershell
npx @lhci/cli@0.15.1 autorun --config=.lighthouserc.cjs
```

Para facilitar Windows agregamos:

```powershell
npm run lhci:local
```

Este script lanza Chrome/Edge manualmente con remote debugging en el puerto
`9222` y usa `.lighthouserc.local.cjs`. La razón es importante: en Windows,
ChromeLauncher puede fallar al matar procesos o borrar perfiles temporales.
Con Chrome pre-lanzado, Lighthouse se conecta al navegador existente y reduce
la dependencia del cleanup interno de ChromeLauncher.

Errores que este flujo intenta evitar:

```txt
EPERM, Permission denied ... AppData\Local\Temp\lighthouse.*
taskkill ... There is no running instance of the task
```

Ese error suele ser un lock temporal de Chrome/Lighthouse al limpiar su perfil
temporal en Windows. No prueba por sí mismo que la app esté rota.

Requisitos para correr Lighthouse local:

1. Debe existir `dist/`.
2. Si no existe, genera el build manualmente:

```powershell
npm run build
```

3. Luego ejecuta:

```powershell
npm run lhci:local
```

Si vuelve a aparecer `EPERM`, cierra Chrome/Edge, espera unos segundos y repite.
La validación más confiable sigue siendo CI en Linux vía GitHub Actions.

Si el puerto `9222` ya está ocupado, cierra el Chrome/Edge usado para debugging o
cambia el puerto en:

- `scripts/run-lhci-local.ps1`
- `.lighthouserc.local.cjs`
