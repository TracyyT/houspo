import { Link, useLocation, } from 'react-router-dom'

function AboutPage() {
  const location = useLocation()
  return (
    <main className="about-page">
      <header className="recommendations-nav">
        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <nav className="main-nav-links">
            <Link
                to="/recommendations"
                className={
                location.pathname === '/recommendations'
                    ? 'active'
                    : ''
                }
            >
                Explore
            </Link>

            <Link
                to="/saved"
                className={
                location.pathname === '/saved'
                    ? 'active'
                    : ''
                }
            >
                Saved
            </Link>

            <Link
                to="/about"
                className={
                location.pathname === '/about'
                    ? 'active'
                    : ''
                }
            >
                About
            </Link>

            <Link
                to="/my-style"
                className={
                location.pathname === '/my-style'
                    ? 'active'
                    : ''
                }
            >
                My Style
            </Link>
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