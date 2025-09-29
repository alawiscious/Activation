import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { usePharmaVisualPivotStore } from '@/data/store'

const rootEl = document.getElementById('root')!

// Global error wiring to surface issues in the UI
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try {
      usePharmaVisualPivotStore.getState().setError?.(e.message || 'Uncaught error')
    } catch {}
  })
  window.addEventListener('unhandledrejection', (e) => {
    try {
      const msg = (e.reason && (e.reason.message || String(e.reason))) || 'Unhandled promise rejection'
      usePharmaVisualPivotStore.getState().setError?.(msg)
    } catch {}
  })
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)








