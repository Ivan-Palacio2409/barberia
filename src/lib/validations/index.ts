// ============================================================
// lib/validations/index.ts — Fase 1
// Esquemas Zod compartidos para formularios y server actions.
// ============================================================

import { z } from 'zod'
import { ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/supabase/storage'

// ── Teléfono colombiano ───────────────────────────────────────
export const telefonoColombiano = z
  .string()
  .regex(/^3\d{9}$/, 'Ingresa un número celular colombiano válido (10 dígitos, inicia con 3)')

// ── Email ─────────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .email('Correo electrónico inválido')
  .max(150, 'Máximo 150 caracteres')

// ── Contraseña ────────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')

// ── Nombre ────────────────────────────────────────────────────
export const nombreSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'Máximo 100 caracteres')

// ── Registro ──────────────────────────────────────────────────
export const registroSchema = z
  .object({
    nombre:   nombreSchema,
    email:    emailSchema,
    telefono: telefonoColombiano,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// ── Login ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

// ── Datos de cliente en reserva ───────────────────────────────
export const datosClienteReservaSchema = z.object({
  nombre:   nombreSchema,
  telefono: telefonoColombiano,
  email:    emailSchema.optional().or(z.literal('')),
  // Honeypot — debe estar vacío
  website:  z.literal('').optional(),
  // [C8] Consentimiento obligatorio
  consentimientoDatos: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar el tratamiento de tus datos personales para continuar.' }),
  }),
})

// ── Imagen de archivo ─────────────────────────────────────────
// Auditoría fase 30: antes redefinía sus propias constantes de
// tipos/tamaño en paralelo a lib/supabase/storage.ts. Ahora
// reexporta esas mismas constantes para que exista una única
// fuente de verdad (storage.ts, que es la usada en producción
// por ImageUpload.tsx y ReservaStep5Fotos.tsx).
export const TIPOS_IMAGEN = ALLOWED_TYPES
export const MAX_BYTES     = MAX_FILE_SIZE

export const imagenSchema = z
  .instanceof(File)
  .refine((f) => TIPOS_IMAGEN.includes(f.type as (typeof TIPOS_IMAGEN)[number]), {
    message: 'Solo se permiten imágenes JPEG, PNG o WebP',
  })
  .refine((f) => f.size <= MAX_BYTES, {
    message: 'La imagen no puede superar 5 MB',
  })
