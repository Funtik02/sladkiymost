import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/admin.css'
import { enableClickSound } from './utils/clickSound.js'

enableClickSound()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
)
