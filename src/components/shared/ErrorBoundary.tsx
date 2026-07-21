'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-error/20 bg-error/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-error" aria-hidden />
          <div className="space-y-1">
            <p className="font-display font-semibold text-foreground">
              Algo salió mal
            </p>
            <p className="text-sm text-muted-foreground">
              Por favor recarga la página o intenta de nuevo.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
