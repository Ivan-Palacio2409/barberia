'use client'

import { create } from 'zustand'
import type { Servicio } from '@/types'

// ============================================================
// Tipos del estado de reserva
// ============================================================

export interface ServicioSeleccionado {
  servicio: Servicio
  cantidad: number
}

export interface DatosCliente {
  nombre: string
  telefono: string
  email: string
  /** null = invitado; string = auth_user_id si autenticado */
  authUserId: string | null
  clienteId: string | null
}

export interface ReservaState {
  // Paso actual (1–6)
  paso: number

  // Paso 1 — servicios
  serviciosSeleccionados: ServicioSeleccionado[]

  // Paso 2 — fecha
  fechaSeleccionada: string | null   // ISO "YYYY-MM-DD"

  // Paso 3 — hora
  horaInicio: string | null          // "HH:MM"
  horaFin: string | null             // "HH:MM"

  // Paso 4 — datos del cliente
  datosCliente: DatosCliente | null

  // Paso 5 — fotos y consentimiento de fotografías [C8]
  notasAdicionales: string
  fotosReferencia: File[]
  consentimientoFotos: boolean

  // Acciones
  setPaso: (paso: number) => void
  toggleServicio: (servicio: Servicio) => void
  setFecha: (fecha: string) => void
  setHorario: (inicio: string, fin: string) => void
  setDatosCliente: (datos: DatosCliente) => void
  setNotas: (notas: string) => void
  addFoto: (file: File) => void
  removeFoto: (index: number) => void
  setConsentimientoFotos: (valor: boolean) => void
  reset: () => void

  // Computed helpers
  duracionTotal: () => number
  precioTotal: () => number
}

const INITIAL: Omit<
  ReservaState,
  | 'setPaso'
  | 'toggleServicio'
  | 'setFecha'
  | 'setHorario'
  | 'setDatosCliente'
  | 'setNotas'
  | 'addFoto'
  | 'removeFoto'
  | 'setConsentimientoFotos'
  | 'reset'
  | 'duracionTotal'
  | 'precioTotal'
> = {
  paso: 1,
  serviciosSeleccionados: [],
  fechaSeleccionada: null,
  horaInicio: null,
  horaFin: null,
  datosCliente: null,
  notasAdicionales: '',
  fotosReferencia: [],
  consentimientoFotos: false,
}

export const useReserva = create<ReservaState>((set, get) => ({
  ...INITIAL,

  setPaso: (paso) => set({ paso }),

  toggleServicio: (servicio) =>
    set((state) => {
      const exists = state.serviciosSeleccionados.find(
        (s) => s.servicio.id === servicio.id,
      )
      if (exists) {
        return {
          serviciosSeleccionados: state.serviciosSeleccionados.filter(
            (s) => s.servicio.id !== servicio.id,
          ),
        }
      }
      return {
        serviciosSeleccionados: [
          ...state.serviciosSeleccionados,
          { servicio, cantidad: 1 },
        ],
      }
    }),

  setFecha: (fecha) =>
    set({ fechaSeleccionada: fecha, horaInicio: null, horaFin: null }),

  setHorario: (inicio, fin) => set({ horaInicio: inicio, horaFin: fin }),

  setDatosCliente: (datos) => set({ datosCliente: datos }),

  setNotas: (notas) => set({ notasAdicionales: notas }),

  setConsentimientoFotos: (valor) => set({ consentimientoFotos: valor }),

  addFoto: (file) =>
    set((state) => ({
      fotosReferencia:
        state.fotosReferencia.length < 5
          ? [...state.fotosReferencia, file]
          : state.fotosReferencia,
    })),

  removeFoto: (index) =>
    set((state) => ({
      fotosReferencia: state.fotosReferencia.filter((_, i) => i !== index),
    })),

  reset: () => set({ ...INITIAL }),

  duracionTotal: () =>
    get().serviciosSeleccionados.reduce(
      (acc, s) => acc + s.servicio.duracion_minutos * s.cantidad,
      0,
    ),

  precioTotal: () =>
    get().serviciosSeleccionados.reduce(
      (acc, s) => acc + s.servicio.precio * s.cantidad,
      0,
    ),
}))
