// ============================================================
// src/services/servicios-ssr.ts
// Auditoría enterprise (Revisión 1 — rendimiento frontend / bug
// de build): getServiciosPorCategoria() vivía en services/servicios.ts
// junto a funciones que usan el cliente de navegador. Ese archivo
// lo importan varios Client Components (ModalServicio.tsx,
// TablaServicios.tsx, ServiceTabs.tsx) — al mezclar el import de
// '@/lib/supabase/server' (que usa next/headers, solo válido en
// Server Components) en el mismo módulo, Next.js intentaba incluir
// código server-only en el bundle de cliente y el build de
// producción fallaba con:
//   "You're importing a component that needs next/headers..."
//
// Fix: esta función (la única del archivo que necesita el cliente
// de servidor) se separa a su propio módulo, que solo importan
// Server Components (páginas sin 'use client').
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { CategoriaServicio, Servicio } from '@/types'

export type CategoriaConServicios = CategoriaServicio & { servicios: Servicio[] }

export async function getServiciosPorCategoria(): Promise<CategoriaConServicios[]> {
  const supabase = await createClient()

  const [{ data: categorias, error: catErr }, { data: servicios, error: srvErr }] =
    await Promise.all([
      supabase.from('categorias_servicio').select('id, nombre').order('nombre'),
      supabase
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('nombre'),
    ])

  if (catErr || srvErr || !categorias || !servicios) return []

  return categorias
    .map((cat) => ({
      ...cat,
      servicios: servicios.filter((s) => s.categoria_id === cat.id) as Servicio[],
    }))
    .filter((cat) => cat.servicios.length > 0)
}
