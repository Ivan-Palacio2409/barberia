# Arquitectura — Peluquería FORMA

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS v3 + shadcn/ui |
| Formularios | React Hook Form + Zod |
| Backend / BD | Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime) |
| Deploy | Vercel |
| CI/CD | GitHub Actions |

## Decisiones técnicas clave

### [C1] Autenticación — tabla `profiles` en lugar de `usuarios`
`auth.users` de Supabase es la fuente de verdad para credenciales.
La tabla `profiles` (migración `001_profiles.sql`) almacena datos complementarios
(nombre, teléfono, rol, foto). El campo `profiles.id` referencia `auth.users.id`
con `ON DELETE CASCADE`. La tabla `usuarios` **no existe**.

### [C2] Clientes unificados
Una única tabla `clientes` cubre dos escenarios:
- **Invitado**: `auth_user_id = NULL` (reserva sin cuenta).
- **Con cuenta**: `auth_user_id → auth.users.id`.

La función `conciliar_cliente_con_auth()` enlaza un invitado con su cuenta si
posteriormente se registra con el mismo email o teléfono.

### [C3] Notificaciones multi-canal desacopladas
La interfaz `NotificationProvider` permite agregar canales (email, WhatsApp, push)
sin cambios estructurales. Email es el canal del lanzamiento inicial.
El campo `canal` existe en la tabla `notificaciones` desde la Fase 5.

### [C4] Analítica
`src/lib/analytics/index.ts` define 11 eventos de negocio (embudo de reserva,
servicios vistos, pagos, usuarios, reseñas). Soporte para PostHog, Plausible y GA4.

### [C5] Backup y recuperación
Ver `RUNBOOK.md` para estrategia de backups y procedimientos de disaster recovery.

### [C6] Tres entornos independientes
| Entorno | Supabase | Vercel |
|---------|----------|--------|
| Local | `supabase start` | `npm run dev` |
| Staging | `[negocio]-staging` | Preview (rama `develop`) |
| Producción | `[negocio]-prod` | Production (rama `main`) |

Cada entorno tiene variables de entorno independientes.

### [C7] Tests y CI/CD
- **Unit**: Vitest
- **Integration**: Vitest + Supabase local
- **E2E**: Playwright
- **Pipeline**: GitHub Actions — lint → typecheck → unit → integration → E2E → deploy

Ningún merge a `main` es posible si algún test falla.

### [C8] Cumplimiento Ley 1581/2012 (Colombia)
- Páginas públicas `/privacidad` y `/terminos`.
- Tabla `consentimientos` (migración `020`).
- Consentimiento de tratamiento de datos en paso 4 del flujo de reserva.
- Consentimiento de fotografías en paso 5 del flujo de reserva.
- Derechos ARCO implementados en `/cliente/perfil`.

## Estructura de carpetas

```
src/
├── app/
│   ├── (public)/          # Portal público sin auth
│   ├── (auth)/            # Páginas de autenticación
│   ├── cliente/           # Rutas protegidas del cliente
│   ├── admin/             # Rutas protegidas del administrador
│   └── api/               # API Routes (webhooks, disponibilidad)
├── components/
│   ├── ui/                # shadcn/ui base
│   ├── forms/             # Formularios reutilizables
│   ├── calendar/          # Calendario de citas
│   ├── dashboard/         # Widgets del panel admin
│   ├── maps/              # Google Maps
│   ├── payments/          # Componentes de pago
│   ├── public/            # Secciones del portal público
│   ├── reserva/           # Pasos del flujo de reserva
│   ├── servicios/         # Catálogo de servicios
│   ├── galeria/           # Galería con lightbox
│   ├── auth/              # AuthGuard, UserMenu
│   └── shared/            # Componentes reutilizables globales
├── lib/
│   ├── supabase/          # Cliente, server, middleware, storage
│   ├── notifications/     # Arquitectura multi-canal [C3]
│   ├── analytics/         # Tracking de eventos [C4]
│   ├── maps/              # Google Maps helpers
│   ├── payments/          # Helpers de pasarela de pago
│   ├── validations/       # Esquemas Zod compartidos
│   └── utils/             # Utilidades genéricas
├── services/              # Llamadas a Supabase por entidad
├── hooks/                 # React hooks personalizados
├── types/                 # Tipos TypeScript globales
└── constants/             # Constantes, tokens de diseño, versiones legales
```

## Migraciones SQL (orden de aplicación)

```
Fase 28                             — Sin cambios SQL. Se conecto el Realtime de notificaciones (ya habilitado desde la migracion 027) al panel admin y a la campana del navbar.
Fase 29                             — Sin cambios SQL. PWA: manifest.webmanifest, service worker (cache-first para assets, network-first para HTML, network-only para API), página /offline, hook useServiceWorker, PWAUpdateToast, next.config.ts con headers de seguridad y optimización, sitemap.ts, robots.ts, metadatos Open Graph y Twitter Card en root layout, íconos PWA (192, 512, maskable, apple-touch-icon, favicon), og-image.png.
Fase 30                             — Migración 028_push_suscripciones.sql. Web Push Notifications: tabla push_suscripciones (cliente_id, endpoint, p256dh, auth) con RLS, hook usePushNotifications (solicitar permiso, suscribir/desuscribir, persistir en Supabase), componente PushNotifBanner en pestaña "Mi perfil", API Routes /api/push/subscribe (POST/DELETE) y /api/push/send (POST, admin), service worker actualizado a forma-v2 con handlers push y notificationclick, variables de entorno VAPID documentadas en .env.example.
```

## Migraciones SQL (orden de aplicación)

```
001_profiles.sql              — profiles vinculada a auth.users [C1]
002_clientes.sql              — clientes unificados [C2]
003_categorias_servicio.sql   — categorías con seeds
004_servicios.sql             — servicios con seeds
005_citas.sql                 — citas + trigger anti-solapamiento
006_cita_servicios.sql        — tabla puente cita ↔ servicio
007_estilos_referencia.sql    — fotos de referencia por cita
008_pagos.sql                 — pagos
009_horarios_trabajo.sql      — horarios semanales con seeds
010_dias_bloqueados.sql       — días sin atención
011_lista_espera.sql          — lista de espera
012_notificaciones.sql        — notificaciones multi-canal [C3]
013_resenas.sql               — reseñas
014_sugerencias.sql           — sugerencias
015_catalogo_estilos.sql      — catálogo público de diseños
016_configuracion_negocio.sql — configuración del negocio (Fase 11)
017_estilos_favoritos.sql     — favoritos del cliente (Fase 14)
019_horarios_especiales.sql   — horarios especiales (Fase 21)
020_consentimientos.sql       — auditoría legal [C8]
021_rls_mis_citas.sql         — RLS citas del cliente
022_admin_rls.sql             — RLS admin ampliada
023_realtime_citas.sql        — Realtime en tabla citas
024_servicios_imagen_url.sql  — columna imagen_url en servicios
025_admin_resenas_pagos_rls.sql — RLS admin resenas + pagos, vista ingresos_por_mes
026_lista_espera_admin_rls_realtime.sql — RLS admin lista_espera, Realtime lista_espera
027_notificaciones_rls_realtime.sql — RLS notificaciones (cliente + admin), Realtime notificaciones
VIEW reporte_servicios_periodo      — Vista de rendimiento por servicio (Fase 25, SQL Editor)
Fase 26 SQL Editor                  — ALTER TABLE resenas ADD COLUMN cita_id + unique index + funcion tiene_resena_para_cita
Fase 27 SQL Editor                  — RLS publica de citas/cita_servicios cuando estan vinculadas a una resena (mostrar servicio reseñado)
Fase 28                             — Sin cambios SQL. Se conecto el Realtime al panel admin y campana del navbar.
Fase 29                             — Sin cambios SQL. Ver detalle en seccion superior.
```



