import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootThemeFromStorage } from './lib/theme'
import { purgeExpiredSessionSync, startSessionWatch } from './lib/sessionGuard'
import './store/useHealthStore'

bootThemeFromStorage()
purgeExpiredSessionSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

startSessionWatch()
