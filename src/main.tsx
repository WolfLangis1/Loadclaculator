import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/device-override.css'
import App from './App.tsx'

// Error boundary for production deployment
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo)
    // Send error to console for debugging in production
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        console.error('Global error:', { message, source, lineno, colno, error })
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page and try again.</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Fix for React scheduler issues in production
const root = ReactDOM.createRoot(document.getElementById('root')!)

// Simple render without error boundary for now to isolate issues
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  root.render(<App />)
}