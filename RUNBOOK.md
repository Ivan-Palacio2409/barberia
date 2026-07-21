# FORMA — Runbook de Produccion

## Acceso rapido

| Recurso              | URL / Comando                                         |
|----------------------|-------------------------------------------------------|
| Vercel Dashboard     | https://vercel.com/dashboard                          |
| Supabase Dashboard   | https://supabase.com/dashboard                        |
| Logs en Vercel       | Vercel > proyecto > Deployments > Functions           |
| Supabase Logs        | Dashboard > Logs > API / Auth / PostgREST             |

---

## 1. Backup y recuperacion

### Supabase (plan Free / Pro)

- **Plan Free:** Supabase hace snapshots diarios con 7 dias de retencion.
  No hay Point-in-Time Recovery (PITR).
- **Plan Pro:** PITR disponible. Activar en Dashboard > Settings > Backups.

### Backup manual antes de migraciones criticas

```bash
# Requiere supabase CLI y acceso a la DB
supabase db dump -f backup-$(date +%Y%m%d).sql --db-url "$SUPABASE_DB_URL"
```

Guardar el archivo en un bucket S3 o Google Drive corporativo.

### Restauracion de backup

```bash
psql "$SUPABASE_DB_URL" < backup-YYYYMMDD.sql
```

Verificar integridad post-restauracion:
```sql
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM citas;
```

---

## 2. Despliegue y rollback

### Despliegue normal (automatico)

Todo push a `main` dispara el pipeline CI en GitHub Actions.
Si el pipeline pasa, Vercel despliega automaticamente.

### Rollback inmediato

```
Vercel Dashboard > proyecto > Deployments > 
  seleccionar ultimo deployment estable > Promote to Production
```

Tiempo estimado de rollback: menos de 2 minutos.

### Rollback de migracion SQL

Las migraciones de FORMA son **solo aditivas** (CREATE TABLE, CREATE POLICY).
Para revertir una migracion problemática:

```sql
-- Ejemplo: revertir 028_push_suscripciones.sql
DROP TABLE IF EXISTS push_suscripciones CASCADE;
```

---

## 3. Incidentes comunes

### El sitio devuelve 500

1. Revisar Vercel > Functions > Logs para el error exacto.
2. Revisar si las variables de entorno estan definidas en Vercel.
3. Verificar que Supabase no este en modo mantenimiento.

### Sesiones de usuarios expiradas masivamente

Supabase rota las claves JWT cada cierto tiempo.
Solucion: los usuarios deben volver a hacer login.
No hay accion requerida del lado del servidor.

### Notificaciones push no llegan

1. Verificar que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` esten en Vercel.
2. Verificar que `web-push` este instalado (`npm ls web-push`).
3. Verificar tabla `push_suscripciones` — endpoints no expirados.
4. Probar manualmente con el endpoint `/api/push/send` desde el admin.

### Reservas no se crean

1. Revisar RLS de la tabla `citas` en Supabase > Authentication > Policies.
2. Correr `supabase/migrations/021_rls_mis_citas.sql` si las politicas no existen.
3. Verificar disponibilidad: el servicio `/api/slots` devuelve slots.

---

## 4. Monitoreo manual

Hasta que se implemente Sentry, el monitoreo es via:

- **Vercel Analytics:** latencia, errores 4xx/5xx por ruta.
- **Supabase Dashboard > Logs:** errores de API y Auth.
- **GitHub Actions:** historial de CI — detecta regresiones.

### Chequeo de salud semanal (manual)

```
[] Dashboard de Supabase > Logs — sin errores criticos
[] Vercel > Analytics — P95 de latencia < 2s
[] GitHub Actions — ultimo CI en verde
[] Tabla citas — sin citas en estado 'pendiente' de mas de 48h
[] Tabla push_suscripciones — sin crecimiento anomalo
```

---

## 4b. Notificaciones reales (email + WhatsApp) — H5

`crearCitaCompleta()`, cancelar/reagendar cita, lista de espera, etc.
solo **registran** filas en `notificaciones` (`enviado = false`). Quien
las envía de verdad es `POST/GET /api/notificaciones/procesar`, que
lee las pendientes, llama a Resend/WhatsApp y marca `enviado = true`.
Sin programar este endpoint para correr periódicamente, las
notificaciones quedan siempre en `enviado = false` sin enviarse.

### Antes de activar en producción

1. Configura `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (dominio verificado en Resend).
2. Configura `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_ID` (WhatsApp Business Cloud API de Meta).
   Sin esto, el `dispatch()` cae automáticamente a email para todo lo que se
   programó con `canal: 'ambos'` — nada se pierde, solo no llega por WhatsApp.
3. Configura `ADMIN_EMAIL` y `ADMIN_WHATSAPP_PHONE` — a dónde llegan las
   notificaciones dirigidas al admin (nueva reserva, resumen de mañana,
   recordatorio 1h antes). Sin esto, esas notificaciones se omiten
   (se loguea una advertencia, no rompe nada).
4. Genera un secreto random para `CRON_SECRET` (ej. `openssl rand -hex 32`)
   y config­úralo tanto en las variables de entorno de la app como en el cron.
   **Sin `CRON_SECRET`, los endpoints responden 503 y no procesan nada** — es
   intencional, para que no queden expuestos públicamente sin protección.

### Dos endpoints de cron

- **`/api/notificaciones/procesar`** (cada 10 min): envía confirmaciones,
  recordatorios (24h, mismo día, 1h antes) y solicitudes de reseña — todo
  lo que ya está en la cola `notificaciones`.
- **`/api/notificaciones/resumen-diario`** (1 vez al día, en la noche):
  arma y envía al admin el listado de citas del día siguiente. No usa la
  cola: consulta `citas` directamente en cada corrida.

### Opción A — Vercel Cron (recomendado si el hosting es Vercel)

Ya viene configurado en `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/notificaciones/procesar",       "schedule": "*/10 * * * *" },
    { "path": "/api/notificaciones/resumen-diario", "schedule": "0 1 * * *" }
  ]
}
```
`0 1 * * *` en UTC equivale a las 8:00 p.m. hora Colombia (UTC-5, sin
horario de verano). Vercel agrega automáticamente el header
`Authorization: Bearer $CRON_SECRET` en cada llamada si esa variable de
entorno existe en el proyecto — no hay que hacer nada más que
configurar `CRON_SECRET` en Vercel. Los cron jobs de Vercel están
disponibles desde el plan Hobby (con límites de frecuencia menores) y
sin límite de frecuencia real en Pro/Enterprise.

### Opción B — pg_cron + pg_net (Supabase)

Si el hosting no es Vercel, se puede programar desde el propio Postgres
de Supabase. Correr en el SQL Editor (requiere las extensiones
`pg_cron` y `pg_net`, activables desde Database > Extensions):

```sql
select cron.schedule(
  'procesar-notificaciones',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://TU-DOMINIO.vercel.app/api/notificaciones/procesar',
    headers := jsonb_build_object(
      'Authorization', 'Bearer TU_CRON_SECRET',
      'Content-Type', 'application/json'
    )
  );
  $$
);

select cron.schedule(
  'resumen-diario-admin',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://TU-DOMINIO.vercel.app/api/notificaciones/resumen-diario',
    headers := jsonb_build_object(
      'Authorization', 'Bearer TU_CRON_SECRET',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

### Verificar que está funcionando

```sql
-- Notificaciones enviadas en la última hora
select tipo, canal, enviado, fecha_programada
from notificaciones
where fecha_programada > now() - interval '1 hour'
order by fecha_programada desc;
```

Si `enviado` se queda en `false` por más de ~30 minutos después de la
`fecha_programada`, revisar los logs de la app buscando
`[procesar-notificaciones]` o `[dispatch]` — el motivo del fallo queda
logueado ahí (credenciales faltantes, error de la API externa, etc.).

### Ventana de 24h de WhatsApp

Meta solo permite mensajes de texto libre dentro de las 24h desde el
último mensaje del cliente al negocio. Fuera de esa ventana (el caso
típico: confirmaciones y recordatorios, que el negocio inicia) Meta
exige un *message template* pre-aprobado. Mientras no se aprueben
templates, es normal que WhatsApp falle y el sistema caiga a email
automáticamente — no hace falta ninguna acción, ya está manejado.

---

## 5. Contactos de emergencia

| Rol               | Accion                        |
|-------------------|-------------------------------|
| Dev principal     | Pancho — revisar este RUNBOOK |
| Supabase soporte  | https://supabase.com/support  |
| Vercel soporte    | https://vercel.com/support    |
