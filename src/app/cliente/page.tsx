// ============================================================
// src/app/cliente/page.tsx — Fase 13
// Redirige a mis citas.
// ============================================================

import { redirect } from 'next/navigation'

export default function ClientePage() {
  redirect('/cliente/mis-citas')
}
