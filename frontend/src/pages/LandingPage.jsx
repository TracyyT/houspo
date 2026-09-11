import { Link } from 'react-router-dom'
import logo from '../assets/houspoLOGO.png'

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <img src={logo} alt="houspo logo" />
        </Link>

        <nav className="nav-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>

          <Link to="/preferences" className="nav-cta">
            Get Started
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

            <button className="text-button">
              Browse Inspiration
            </button>
          </div>

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
          <div className="visual-number">01</div>

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

          <div className="visual-pagination">
            <span className="active">01</span>
            <span>02</span>
            <span>03</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage