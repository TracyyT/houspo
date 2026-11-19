import { useEffect } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import logo from '../assets/houspoLOGO.png'
import { spaces } from '../data/spaces'
import { usePreferences } from '../context/PreferenceContext'

// Rooms shown in "Shop by space", in order.
const featuredSpaces = [
  'living-room',
  'bedroom',
  'dining-room',
  'home-office',
  'entryway',
  'outdoor',
]
  .map((id) => spaces.find((space) => space.id === id))
  .filter(Boolean)

const steps = [
  {
    number: '01',
    title: 'Take the style quiz',
    text: 'Pick your styles, room, colors, materials and budget. It takes about two minutes.',
    link: '/preferences',
    action: 'Start the quiz',
  },
  {
    number: '02',
    title: 'Shop a room photo',
    text: 'Upload a room you love. houspo finds each piece in it and matches it with similar products.',
    link: '/shop-room',
    action: 'Upload a photo',
  },
  {
    number: '03',
    title: 'Save what you love',
    text: 'Save favorites, mark what is not your style, and your recommendations get more personal.',
    link: '/saved',
    action: 'See saved items',
  },
]

function LandingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectSpace } = usePreferences()

  // Scroll to a section when the URL has a hash,
  // e.g. /#about or /#how-it-works.
  useEffect(() => {
    if (!location.hash) {
      return
    }

    const section = document.getElementById(
      location.hash.slice(1)
    )

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [location])

  const shopSpace = (space) => {
    selectSpace(space.name)
    navigate('/recommendations')
  }

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <img src={logo} alt="houspo logo" />
        </Link>

        <nav className="nav-links">
          <Link to="/recommendations">Explore</Link>
          <Link to="/shop-room">Shop a Room</Link>
          <Link to="/saved">Saved</Link>
          <a href="#about">About</a>

          <Link to="/preferences" className="nav-cta">
            Find My Style
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            INTERIOR INSPIRATION, PERSONALIZED
          </span>

          <h1>
            Find a home
            <br />
            that feels like you.
          </h1>

          <p className="hero-description">
            Discover furniture, decor, and home products selected around
            your space and your style.
          </p>

          <div className="hero-actions">
            <Link to="/preferences" className="primary-button">
              <span>Find My Style</span>
              <span className="button-arrow">→</span>
            </Link>

            <Link to="/shop-room" className="secondary-button">
              <span>Shop a Room Photo</span>
              <span className="button-arrow">→</span>
            </Link>
          </div>

          <p className="hero-browse">
            Just looking?{' '}
            <Link to="/recommendations" className="text-button">
              Browse all products
            </Link>
          </p>

          <div className="hero-tags">
            <span>SPACES</span>
            <span>•</span>
            <span>STYLES</span>
            <span>•</span>
            <span>PRODUCTS</span>
            <span>•</span>
            <span>ONE PLACE</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="art-frame">
            <div className="art-inner" />
          </div>

          <div className="hero-room">
            <div className="hero-plant">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="coffee-table">
              <div className="table-top" />
              <div className="table-base" />
            </div>

            <div className="sofa">
              <div className="sofa-back" />
              <div className="sofa-seat" />
              <div className="sofa-arm sofa-arm-left" />
              <div className="sofa-arm sofa-arm-right" />
              <div className="pillow" />
            </div>
          </div>
        </div>
      </section>

      <section id="shop-by-space" className="landing-section">
        <div className="landing-section-heading">
          <span className="eyebrow">SHOP BY SPACE</span>

          <h2>Start with a room.</h2>
        </div>

        <div className="space-grid">
          {featuredSpaces.map((space) => (
            <button
              key={space.id}
              className="space-tile"
              onClick={() => shopSpace(space)}
            >
              <img src={space.image} alt="" loading="lazy" />

              <span className="space-tile-label">
                <span>{space.name}</span>
                <span className="button-arrow">→</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="landing-section-heading">
          <span className="eyebrow">HOW IT WORKS</span>

          <h2>Three ways to find your pieces.</h2>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <Link key={step.number} to={step.link} className="step-card">
              <span className="step-number">{step.number}</span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>

              <span className="step-action">
                {step.action}
                <span className="button-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-content">
          <span className="eyebrow">
            ABOUT HOUSPO
          </span>

          <h2>
            Inspiration that
            <br />
            feels personal.
          </h2>

          <p>
            houspo helps you discover furniture, decor,
            and home inspiration based on your personal
            style, space, and preferences.
          </p>

          <p>
            Instead of searching through endless products,
            houspo brings together pieces that better match
            the kind of home you want to create.
          </p>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
