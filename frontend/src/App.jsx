import { Routes, Route } from 'react-router-dom'

import CustomCursor from './components/CustomCursor'

import LandingPage from './pages/LandingPage'
import PreferencesPage from './pages/PreferencesPage'
import SpacesPage from './pages/SpacesPage'
import CategoriesPage from './pages/CategoriesPage'
import RecommendationsPage from './pages/RecommendationsPage'
import RefinementsPage from './pages/RefinementsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SavedPage from './pages/SavedPage'
import MyStylePage from './pages/MyStylePage'
import AboutPage from './pages/AboutPage'
import Footer from './components/Footer'

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
        <Route path="/product/:id" element={<ProductDetailPage />}/>
        <Route path="/saved" element={<SavedPage />}/>
        <Route path="/my-style" element={<MyStylePage />}/>
        <Route path="/about" element={<AboutPage />} />
      </Routes>

      <Footer />
    </>
  )
}

export default App