import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import './index.css'

import { PreferenceProvider } from './context/PreferenceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PreferenceProvider>
        <App />
      </PreferenceProvider>
    </BrowserRouter>
  </StrictMode>,
)

// main.jsx
//    │
//    └── BrowserRouter (browser urls)
//           │
//           └── App.jsx (decides what page component to show for each url)
//                  │
//                  ├── /
//                  ├── /preferences
//                  └── /spaces

// UI
//  │
//  ├── PreferencesPage
//  └── SpacesPage
//         │
//         ↓
// PreferenceContext
//         │
//         ├── React state
//         │
//         └── sessionStorage (later will use localStorage)