import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/device-override.css'
import App from './App.tsx'

const root = ReactDOM.createRoot(document.getElementById('root')!)

if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  root.render(<App />)
}