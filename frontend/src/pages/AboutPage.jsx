import { Link } from 'react-router-dom'

function AboutPage() {
  return (
    <main className="about-page">
      <header className="recommendations-nav">
        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <nav className="main-nav-links">
          <Link to="/recommendations">Explore</Link>
          <Link to="/saved">Saved</Link>
          <Link to="/about">About</Link>
          <Link to="/my-style">My Style</Link>
        </nav>
      </header>

      <section className="about-page-content">
        <span className="section-label">
          ABOUT HOUSPO
        </span>

        <h1>
          Inspiration that feels personal.
        </h1>

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

        <Link
          to="/preferences"
          className="my-style-edit-button"
        >
          Find my style
        </Link>
      </section>
    </main>
  )
}

export default AboutPage