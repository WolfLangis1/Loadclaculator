import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/device-override.css'
// Use the authenticated version of the app
import AppWithAuth from './AppWithAuth.tsx'
// Keep the original App for backwards compatibility if needed
// import App from './App.tsx'

// Build timestamp: 2025-07-17T01:04:00Z - Supabase migration complete

const root = ReactDOM.createRoot(document.getElementById('root')!)

// Temporarily disable StrictMode in development to reduce re-renders
// StrictMode causes double-rendering in development which can trigger reload issues
if (import.meta.env.DEV && false) { // Disabled for now
  root.render(
    <React.StrictMode>
      <AppWithAuth />
    </React.StrictMode>
  )
} else {
  root.render(<AppWithAuth />)
}