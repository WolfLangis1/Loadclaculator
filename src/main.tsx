import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/device-override.css'
import App from './App.tsx'

// Fix for React scheduler issues in production
const root = ReactDOM.createRoot(document.getElementById('root')!)

// Disable strict mode in production to avoid scheduler conflicts
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  root.render(<App />)
}