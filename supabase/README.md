# Supabase

## Puesta en marcha

1. Crea un proyecto en Supabase y enlázalo:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

   La migración `migrations/20261025000000_initial_schema.sql` crea perfiles,
   espacios, habitaciones, versiones, assets, jobs, reportes, moderación y
   cuotas, con RLS de solo lectura para el cliente.

2. Crea el bucket de snapshots en R2:

   ```bash
   npx wrangler r2 bucket create work-portfolio-snapshots
   ```

   `wrangler.json` ya declara el binding `ROOM_SNAPSHOTS`.

3. Configura las credenciales del Worker en `.dev.vars` (desarrollo) o como
   variables/secretos del Worker (producción):

   ```text
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<anon-key>
   ```

4. Configura la plantilla del email **Magic Link**:

   ```text
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

   Añade el origen local y el dominio de producción a las Redirect URLs.

## Modelo de escritura

El cliente **no escribe tablas**. Las acciones del Worker validan el documento
y usan `service_role`; `publish_room` es una función transaccional que crea la
versión, actualiza la habitación y recalcula el manifiesto del espacio. El
snapshot JSON se escribe en R2 antes de llamar a la función.

`publishRoom` está implementado en `src/lib/rooms.server.ts`. La UI del editor
llega en M2; hasta entonces no hay una ruta pública para publicar.

## Lectura pública

`loadPublicSpace` lee `profiles` + `spaces.published_manifest` y descarga cada
documento desde R2. Sin Supabase configurado, el handle `demo` usa la semilla
local; el resto devuelve 404.
