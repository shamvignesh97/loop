import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  // Register immediately so updates are discovered without waiting for window load
  navigator.serviceWorker.register(swUrl).catch(() => {
    /* offline install still works without SW on first visit */
  })
}
