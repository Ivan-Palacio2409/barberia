// ============================================================
// legal.ts — Fase 7
// Versiones vigentes de documentos legales.
// [C8] Ley 1581/2012 y Decreto 1377/2013 (Colombia)
//
// Al cambiar el texto de cualquier documento, incrementa la
// versión aquí. Los registros en la tabla `consentimientos`
// quedan trazados contra la versión que el usuario aceptó.
// `tieneConsentimientoVigente()` compara contra estas versiones.
// ============================================================

export const LEGAL_VERSIONS = {
  PRIVACIDAD:  'privacidad-v1.1',
  TERMINOS:    'terminos-v1.1',
  FOTOGRAFIAS: 'fotos-v1.0',
} as const

export type LegalVersion = (typeof LEGAL_VERSIONS)[keyof typeof LEGAL_VERSIONS]