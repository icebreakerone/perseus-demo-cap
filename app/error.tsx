'use client'
import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    // eslint-disable-next-line no-console
    console.error('Error caught by error boundary gDSFE:', error)
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error('Error caught by error boundary cDC:', error, errorInfo)
  }

  render() {
    if (this.state.hasError)
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>

    return this.props.children
  }
}

export default ErrorBoundary
