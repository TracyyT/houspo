import { Routes, Route } from 'react-router-dom'

import CustomCursor from './components/CustomCursor'

import LandingPage from './pages/LandingPage'
import PreferencesPage from './pages/PreferencesPage'
import SpacesPage from './pages/SpacesPage'
import CategoriesPage from './pages/CategoriesPage'
import RecommendationsPage from './pages/RecommendationsPage'
import RefinementsPage from './pages/RefinementsPage'

function App() {
  return (
    <>
      <CustomCursor />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/spaces" element={<SpacesPage />} />
        <Route path="/categories" element={<CategoriesPage />}/>
        <Route path="/recommendations" element={<RecommendationsPage />}/>
        <Route path="/refinements" element={<RefinementsPage />}/>
      </Routes>
    </>
  )
}

export default App