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
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   TURNSTILE_SITE_KEY=<site-key>
   TURNSTILE_SECRET_KEY=<secret-key>
   ```

   `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor para reportes,
   moderación, rate limits y borrado de cuenta. Nunca debe llegar al cliente.

4. Configura la plantilla del email **Magic Link**:

   ```text
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

   Añade el origen local y el dominio de producción a las Redirect URLs.

5. Para moderar, marca un perfil como administrador:

   ```sql
   update public.profiles set role = 'admin' where handle = '<tu-handle>';
   ```

## M1c: abuso y moderación

- `api_rate_limits` + `consume_rate_limit` limitan login y reportes por IP.
- Los triggers `rooms_enforce_quota` y `assets_enforce_quota` aplican las
  cuotas de 8 habitaciones, 25 assets y 25 MB.
- Tres reportes abiertos suspenden la habitación automáticamente
  (`reports_auto_hide`).
- `/admin` muestra la cola de reportes y permite ocultar o descartar.
- `/settings` borra la cuenta con `auth.admin.deleteUser`; el borrado en cascada
  elimina perfiles, espacios, habitaciones, versiones y assets de la base. Los
  objetos de R2 quedan para el job de mantenimiento.
- Las páginas `/terms`, `/privacy` y `/content-policy` son borradores
  operativos y deben revisarse antes de producción.

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
