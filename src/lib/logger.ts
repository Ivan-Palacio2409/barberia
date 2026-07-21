// ============================================================
// logger.ts
// Auditoría de calidad (post fase 30) — hallazgo M4.
//
// Reemplaza los 102 console.log/error/warn/info/debug sueltos que
// eran el único mecanismo de logging en producción. Este módulo es
// el ÚNICO punto de la app que debería llamar a `console` — todo
// lo demás importa `logger` desde acá.
//
// La firma es intencionalmente compatible con console.* (acepta
// cualquier cantidad de argumentos) para que el reemplazo en los
// call sites existentes fuera mecánico y no cambiara el
// comportamiento de cada log individual. Lo que sí cambia, al
// estar centralizado acá:
//   - En producción se silencia 'debug' (ruido de desarrollo).
//   - Hay un único lugar para conectar un servicio real (Sentry,
//     Logtail, Axiom, etc.) cuando se decida cuál usar — ver el
//     punto de extensión al final de `emit()`.
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isProd = process.env.NODE_ENV === 'production'

function shouldLog(level: LogLevel): boolean {
  // En producción se omite 'debug'; info/warn/error siempre se emiten.
  if (isProd && level === 'debug') return false
  return true
}

function emit(level: LogLevel, args: unknown[]) {
  if (!shouldLog(level)) return

  switch (level) {
    case 'debug':
      console.debug(...args)
      break
    case 'info':
      console.info(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
  }

  // Punto de extensión: cuando se conecte un servicio real de logs
  // / error tracking, acá se reenvía además de (o en vez de)
  // escribir a consola. Ej.:
  //   if (isProd && level === 'error') Sentry.captureMessage(String(args[0]), { extra: { args } })
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
}
