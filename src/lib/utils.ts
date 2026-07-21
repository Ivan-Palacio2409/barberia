import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilidad estándar de shadcn/ui para combinar clases de Tailwind
// sin colisiones (twMerge) y con soporte de condicionales (clsx).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
