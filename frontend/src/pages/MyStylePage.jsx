import { Link } from 'react-router-dom'
import { usePreferences } from '../context/PreferenceContext'

function MyStylePage() {
  const { preferences } = usePreferences()

  const hasPreferences =
    preferences.styles.length > 0 ||
    preferences.characteristics.length > 0 ||
    preferences.colors.length > 0 ||
    preferences.materials.length > 0 ||
    preferences.space ||
    preferences.categories.length > 0

  return (
    <main className="my-style-page">
      <header className="recommendations-nav">
        <Link
          to="/"
          className="onboarding-logo"
        >
          houspo
        </Link>

        <nav className="main-nav-links">
          <Link to="/recommendations">
            Explore
          </Link>

          {/* <Link to="/preferences">
            Find Your Style
          </Link> */}

          <Link to="/saved">
            Saved
          </Link>

          <Link to="/about">
            About
          </Link>

          <Link to="/my-style">
            My Style
          </Link>
        </nav>
      </header>

      <section className="my-style-content">
        <div className="my-style-heading">
        <span className="section-label">
            YOUR STYLE
        </span>

        <h1>Your design profile.</h1>

        <p>
            The preferences houspo uses to find pieces
            that feel more like you.
        </p>
        </div>

        {!hasPreferences ? (
          <div className="my-style-empty">
            <h2>No style profile yet.</h2>

            <p>
              Complete the style quiz to start
              building your personalized profile.
            </p>

            <Link
              to="/preferences"
              className="my-style-edit-button"
            >
              Find Your Style
            </Link>
          </div>
        ) : (
          <>
            <div className="my-style-grid">
              <section className="my-style-card">
                <span>STYLE</span>

                <div className="my-style-tags">
                  {preferences.styles.length > 0 ? (
                    preferences.styles.map((style) => (
                      <span key={style}>
                        {style}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>SPACE</span>

                <div className="my-style-tags">
                  {preferences.space ? (
                    <span>
                      {preferences.space}
                    </span>
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>CHARACTERISTICS</span>

                <div className="my-style-tags">
                  {preferences.characteristics.length > 0 ? (
                    preferences.characteristics.map(
                      (characteristic) => (
                        <span key={characteristic}>
                          {characteristic}
                        </span>
                      )
                    )
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>COLORS</span>

                <div className="my-style-tags">
                  {preferences.colors.length > 0 ? (
                    preferences.colors.map((color) => (
                      <span key={color}>
                        {color}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>MATERIALS</span>

                <div className="my-style-tags">
                  {preferences.materials.length > 0 ? (
                    preferences.materials.map((material) => (
                      <span key={material}>
                        {material}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>CATEGORIES</span>

                <div className="my-style-tags">
                  {preferences.categories.length > 0 ? (
                    preferences.categories.map((category) => (
                      <span key={category}>
                        {category}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>
            </div>

            <div className="my-style-actions">
            <Link
                to="/preferences"
                className="my-style-edit-button"
            >
                Edit my style
            </Link>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default MyStylePage