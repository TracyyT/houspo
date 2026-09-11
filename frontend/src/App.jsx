import { Routes, Route } from 'react-router-dom'

import CustomCursor from './components/CustomCursor'

import LandingPage from './pages/LandingPage'
import PreferencesPage from './pages/PreferencesPage'
import SpacesPage from './pages/SpacesPage'

function App() {
  return (
    <>
      <CustomCursor />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/spaces" element={<SpacesPage />} />
      </Routes>
    </>
  )
}

export default App